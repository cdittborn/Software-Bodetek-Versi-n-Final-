#!/usr/bin/env bash
# Copia incremental del bucket de la app al bucket de respaldos (prefijo archivos/).
# LEE el bucket de la app (GetObject). ESCRIBE solo en bodetek-respaldos/archivos/.
# No usa CopyObject: R2 responde NotImplemented a x-amz-tagging-directive=REPLACE.
# Nunca borra en el origen ni en el destino.
set -euo pipefail

ACCOUNT_ID="${R2_ACCOUNT_ID:-}"
APP_BUCKET="${R2_BUCKET_NAME:-}"
BACKUP_BUCKET="${R2_BACKUP_BUCKET:-}"
if [[ -z "$BACKUP_BUCKET" ]]; then
  BACKUP_BUCKET="bodetek-respaldos"
fi

if [[ -z "$ACCOUNT_ID" ]]; then
  echo "Falta R2_ACCOUNT_ID." >&2
  exit 1
fi
if [[ -z "$APP_BUCKET" ]]; then
  echo "Falta R2_BUCKET_NAME (bucket de la app)." >&2
  exit 1
fi
if [[ -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Faltan R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY." >&2
  exit 1
fi
if [[ "$APP_BUCKET" == "$BACKUP_BUCKET" ]]; then
  echo "ABORTADO: el bucket de la app y el de respaldos no pueden ser el mismo." >&2
  exit 1
fi

export TZ="${TZ:-America/Santiago}"
ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"
export AWS_REQUEST_CHECKSUM_CALCULATION=WHEN_REQUIRED
export AWS_RESPONSE_CHECKSUM_VALIDATION=WHEN_REQUIRED
export ENDPOINT APP_BUCKET BACKUP_BUCKET
export FORZAR="${FORZAR:-0}"

python3 - <<'PY'
import json, os, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

class ConsultaError(RuntimeError):
    pass

endpoint = os.environ["ENDPOINT"]
app = os.environ["APP_BUCKET"]
backup = os.environ["BACKUP_BUCKET"]
forzar = os.environ.get("FORZAR", "0") == "1"

def aws(*args, capture=False):
    cmd = ["aws", *args, "--endpoint-url", endpoint]
    if capture:
        return subprocess.run(cmd, check=True, capture_output=True)
    subprocess.run(cmd, check=True)

def head(bucket, key):
    err = subprocess.run(
        ["aws", "s3api", "head-object", "--bucket", bucket, "--key", key, "--endpoint-url", endpoint],
        capture_output=True,
        text=True,
    )
    if err.returncode == 0:
        return "existe", err.stdout
    texto = (err.stderr or "") + (err.stdout or "")
    if "404" in texto or "Not Found" in texto or "NoSuchKey" in texto:
        return "falta", ""
    raise ConsultaError(f"FALLO: no se pudo consultar {bucket}/{key}\n{texto}")

now = datetime.now()
days_since_sunday = (now.weekday() + 1) % 7
sunday = (now.date() - timedelta(days=days_since_sunday)).isoformat()
marker = f"marcadores/archivos-semana-{sunday}.txt"
try:
    estado, _ = head(backup, marker)
except ConsultaError as exc:
    print(exc, file=sys.stderr)
    sys.exit(1)
if estado == "existe" and not forzar:
    print(f"Ya existe {marker} (semana Chile, domingo {sunday}). No se vuelve a copiar.")
    sys.exit(0)
if estado == "existe":
    print(f"Ejecución manual: se vuelve a copiar y se actualiza {marker}.")

def listar(bucket, prefix=""):
    keys = {}
    token = None
    while True:
        cmd = [
            "aws", "s3api", "list-objects-v2",
            "--bucket", bucket,
            "--endpoint-url", endpoint,
            "--output", "json",
        ]
        if prefix:
            cmd += ["--prefix", prefix]
        if token:
            cmd += ["--continuation-token", token]
        raw = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout
        data = json.loads(raw or "{}")
        for obj in data.get("Contents") or []:
            keys[obj["Key"]] = int(obj["Size"])
        if not data.get("IsTruncated"):
            break
        token = data.get("NextContinuationToken")
        if not token:
            break
    return keys

origen = listar(app)
destino = listar(backup, "archivos/")
print(f"→ objetos en app: {len(origen)}")
if not origen:
    print("FALLO: el bucket de la app no listó objetos.", file=sys.stderr)
    sys.exit(1)

faltan = []
for key, size in origen.items():
    if not key or key.startswith("/") or ".." in key.split("/"):
        print(f"FALLO: key rechazada: {key}", file=sys.stderr)
        sys.exit(1)
    dest_key = "archivos/" + key
    if destino.get(dest_key) != size:
        faltan.append(key)

print(f"→ por copiar (Get + Put, sin CopyObject): {len(faltan)}")

def copiar(key):
    dest_key = "archivos/" + key
    estado_ct, cuerpo = head(app, key)
    ctype = ""
    if estado_ct == "existe":
        try:
            ctype = json.loads(cuerpo).get("ContentType") or ""
        except json.JSONDecodeError:
            ctype = ""
    fd, path = tempfile.mkstemp(prefix="respaldo-")
    os.close(fd)
    try:
        aws("s3", "cp", f"s3://{app}/{key}", path, "--only-show-errors")
        cmd = ["s3", "cp", path, f"s3://{backup}/{dest_key}", "--only-show-errors"]
        if ctype:
            cmd += ["--content-type", ctype]
        aws(*cmd)
    finally:
        try:
            os.remove(path)
        except OSError:
            pass
    return key

errores = []
if faltan:
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(copiar, key): key for key in faltan}
        hechos = 0
        for fut in as_completed(futures):
            hechos += 1
            try:
                fut.result()
            except Exception as exc:
                errores.append(f"{futures[fut]}: {exc}")
            if hechos % 25 == 0 or hechos == len(faltan):
                print(f"→ copiados {hechos} de {len(faltan)}")

if errores:
    print("FALLO: no se pudieron copiar algunos archivos:", file=sys.stderr)
    for linea in errores[:20]:
        print(linea, file=sys.stderr)
    sys.exit(1)

destino = listar(backup, "archivos/")
incompletos = [key for key, size in origen.items() if destino.get("archivos/" + key) != size]
if incompletos:
    print(f"FALLO: quedaron {len(incompletos)} objetos sin el mismo tamaño en el respaldo.", file=sys.stderr)
    sys.exit(1)

nota = f"ok {datetime.now().isoformat(timespec='seconds')} objetos={len(origen)}\n"
subprocess.run(
    ["aws", "s3", "cp", "-", f"s3://{backup}/{marker}", "--endpoint-url", endpoint, "--content-type", "text/plain", "--only-show-errors"],
    input=nota.encode(),
    check=True,
)
estado_m, _ = head(backup, marker)
if estado_m != "existe":
    print(f"FALLO: no quedó el marcador {marker}.", file=sys.stderr)
    sys.exit(1)
print(f"→ objetos en respaldo (archivos/): {len(destino)}")
print(f"OK respaldo de archivos, semana {sunday} ({len(origen)} objetos, sin borrar)")
PY
