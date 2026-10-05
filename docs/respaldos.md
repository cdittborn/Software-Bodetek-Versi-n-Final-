# Respaldos automáticos (GitHub Actions → R2 privado)

El plan Free de Supabase no incluye backups. Este repo **nunca** guarda dumps ni archivos: solo workflows. Los respaldos viven en un bucket R2 **privado y separado** del de la app (`bodetek-respaldos`).

Los cron **solo corren en `main`** (rama por defecto de GitHub). Un PR no programa nada.

| Qué | Cuándo (hora Chile) | Destino en el bucket de respaldos |
|---|---|---|
| Base de datos (`public` + `auth`) | Diario, 04:00 | `db/AAAA-MM-DD.sql.gz` |
| Archivos de la app | Domingo, 04:00 | `archivos/` (copia incremental; **no borra** lo que se eliminó en el origen) |

Si el dump pesa menos de 10 KB o no incluye las tablas `eventos`, `trabajos` y `trabajo_media`, el workflow **falla** y GitHub puede avisarte por correo (ver abajo).

Retención de dumps: 30 días (el job borra `db/*.sql.gz` más viejos). Los archivos en `archivos/` no se purgan solos.

---

## 1. Crear el bucket en Cloudflare (lo haces tú)

1. Entrá a [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Arriba a la izquierda, elegí la cuenta donde ya está el R2 de la app.
3. Menú izquierdo: **R2 Object Storage** → **Overview**.
4. Botón **Create bucket**.
5. **Bucket name:** `bodetek-respaldos` (minúsculas, exacto).
6. **Location:** *Automatic* (está bien).
7. **Create bucket**.
8. Entrá al bucket → pestaña **Settings**:
   - **Public access / Public development URL:** debe quedar **deshabilitado**. No conectes un dominio. No pulses *Allow Access*.
   - No configures CORS para este bucket.
9. Confirmá que **no** es el mismo nombre que `R2_BUCKET_NAME` de Vercel (ese es el de la app).

### Token de API (Access Key) para GitHub

1. Seguí en **R2 Object Storage** → **Overview**.
2. A la derecha (o en el menú): **Manage R2 API Tokens** → **Create API token**.
3. **Token name:** `github-actions-respaldos`.
4. **Permissions:** **Object Read & Write** (un solo permiso para los buckets que selecciones).
5. **Apply to specific buckets** (no “All buckets”):
   - el bucket de la **app** (el mismo valor que `R2_BUCKET_NAME` en Vercel), y
   - `bodetek-respaldos`.
6. **TTL:** Forever (sin vencimiento).
7. **Create API Token**.
8. Copiá **ahora** (la secret se muestra una sola vez):
   - **Access Key ID**
   - **Secret Access Key**
9. **Account ID:** en Overview de R2, columna derecha *Account ID* (también está en la URL `https://xxxx.r2.cloudflarestorage.com`).

Ese token puede leer/escribir ambos buckets. Guardalo solo como secret de GitHub. No lo pongas en Vercel ni en el repo.

---

## 2. Secrets en GitHub (lo haces tú)

GitHub → tu repo **Software-Bodetek-Versi-n-Final-** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Tiene que ser **Repository secrets** (pestaña Actions). No uses *Environment secrets* de Production/Preview (eso es de Vercel), ni variables de Vercel, ni secrets de Cursor.

Creá **estos 6**, uno por uno:

| Name | Value | Dónde sacarlo |
|---|---|---|
| `SUPABASE_DB_URL` | URI `postgresql://…` | Supabase → **Project Settings** (engranaje) → **Database** → **Connect** / Connection string → **URI**, modo **Session** (pooler, puerto **5432**), usuario `postgres`. Copiá la URI completa (incluye la contraseña). Tiene que contener el ref `jzmlhgvmetljbpjguvoz`. |
| `R2_ACCOUNT_ID` | Account ID de Cloudflare | R2 → Overview, columna derecha. |
| `R2_ACCESS_KEY_ID` | Access Key ID del token nuevo | Paso del token, arriba. |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key del token nuevo | Paso del token (solo se ve al crearlo). |
| `R2_BUCKET_NAME` | Nombre del bucket **de la app** | Vercel → proyecto → Settings → Environment Variables → `R2_BUCKET_NAME`. **No** uses `bodetek-respaldos`. |
| `R2_BACKUP_BUCKET` | `bodetek-respaldos` | Literal, el bucket nuevo. |

No subas dumps al repo. No hace falta `R2_PUBLIC_URL` acá.

### Correo cuando falle

GitHub.com → tu avatar → **Settings** → **Notifications** → sección **Actions** → activá notificaciones de workflows **failed**. El mail llega a la dirección de la cuenta GitHub.

---

## 3. Cómo se corre

- **Automático:** cron 06:00 y 07:00 UTC en `main`. GitHub puede atrasarlo. No hace falta que sean las 04:00 Chile.
  - Base: sube `db/AAAA-MM-DD.sql.gz` (fecha Chile) si ese objeto todavía no existe. Si ya existe, el job queda verde y no repite el dump.
  - Archivos: una vez por semana (el domingo de esa semana en Chile). Si el marcador `marcadores/archivos-semana-AAAA-MM-DD.txt` no existe, copia. La copia es Get + Put en el runner: R2 no acepta el `CopyObject` de `aws s3 sync` (`x-amz-tagging-directive: REPLACE` → `NotImplemented`).
- **A mano:** pestaña **Actions** → *Respaldo base de datos* o *Respaldo archivos R2* → **Run workflow** → rama `main`. Una corrida manual siempre respalda, aunque el objeto del día o el marcador de la semana ya existan.
- Si el archivo no queda en el bucket, el job termina en error. Un «Skip» silencioso que deje el run en verde no se usa.

En R2, bucket `bodetek-respaldos`, deberías ver:

- `db/2026-09-28.sql.gz` (la fecha en hora Chile)
- `archivos/trabajos/…`, `archivos/fachadas/…`, etc. (espejo del bucket de la app, sin borrar histórico)

---

## 4. Restaurar la base (paso a paso)

Esto **pisa datos**. Preferí un proyecto Supabase nuevo o un clone; no lo hagas a mano en prod sin backup extra.

1. En Cloudflare R2 → bucket `bodetek-respaldos` → `db/` → bajá el `.sql.gz` del día (ej. `2026-09-28.sql.gz`).
2. En tu máquina:

```bash
gunzip -k 2026-09-28.sql.gz
# queda 2026-09-28.sql
```

3. URI de **destino** (Session pooler, puerto 5432), distinta si es un proyecto nuevo:

```bash
export DEST="postgresql://postgres.XXXX:CONTRASEÑA@….pooler.supabase.com:5432/postgres?sslmode=require"
```

4. Restaurar (tarda; `auth` trae usuarios):

```bash
psql "$DEST" --set ON_ERROR_STOP=1 -f 2026-09-28.sql
```

5. En el dashboard de Supabase del destino: **Project Settings** → **API** → **Reload schema** / o SQL `NOTIFY pgrst, 'reload schema';`.
6. Probá login. Los UUID de `auth.users` coinciden con `public.perfiles` si restauraste ambos schemas.
7. Borrá el `.sql` local cuando termines.

Si el destino **ya tiene** tablas, el restore puede chocar (`already exists`). En un proyecto vacío (solo migraciones de Supabase Auth) suele funcionar. Si falla a mitad, no reintentes a ciegas: usá un proyecto limpio.

Auth: las contraseñas van en `auth.users` (hashes). Los usuarios pueden entrar con la misma clave. Revisá proveedores OAuth si los usás.

---

## 5. Restaurar archivos (paso a paso)

Copia **desde** el bucket de respaldos **hacia** el bucket de la app. No uses `--delete` si no querés vaciar el destino.

En una máquina con [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) y las mismas keys del token de respaldos:

```bash
export AWS_ACCESS_KEY_ID="…"
export AWS_SECRET_ACCESS_KEY="…"
export AWS_DEFAULT_REGION=auto
export AWS_REQUEST_CHECKSUM_CALCULATION=WHEN_REQUIRED
export AWS_RESPONSE_CHECKSUM_VALIDATION=WHEN_REQUIRED
ENDPOINT="https://TU_ACCOUNT_ID.r2.cloudflarestorage.com"

# Simulación (no escribe)
aws s3 ls s3://bodetek-respaldos/archivos/ --endpoint-url "$ENDPOINT" | head

# Restaurar hacia el bucket de la app (agrega/actualiza; no borra extra en la app)
aws s3 sync \
  s3://bodetek-respaldos/archivos \
  s3://NOMBRE_BUCKET_APP \
  --endpoint-url "$ENDPOINT"
```

`R2_PUBLIC_URL` de la app sigue apuntando al bucket de la app: las keys (`trabajos/…`) no cambian.

Para un solo prefijo (ej. un trabajo):

```bash
aws s3 sync \
  s3://bodetek-respaldos/archivos/trabajos/ID \
  s3://NOMBRE_BUCKET_APP/trabajos/ID \
  --endpoint-url "$ENDPOINT"
```

---

## 6. Scripts locales (opcional)

Con las mismas variables de entorno que los secrets:

```bash
export TZ=America/Santiago
./scripts/respaldo-db.sh
./scripts/respaldo-archivos.sh
```

El dump se crea en un directorio temporal y se sube a R2; no queda en el git working tree. `*.sql.gz` está en `.gitignore`.
