import { notFound } from "next/navigation";
import { EditorInformeSeguro } from "@/components/informe-seguro/EditorInformeSeguro";
import {
  borradorDemo,
  fuenteDemo,
  previewsDemo,
} from "@/lib/informe-seguro/demo-datos";
import { fuenteSinNotas } from "@/lib/informe-seguro/fuente";

export const dynamic = "force-dynamic";

export default function DemoEditorInformePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-full bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <EditorInformeSeguro
          modoDemo
          fuente={fuenteSinNotas(fuenteDemo)}
          inicial={borradorDemo}
          previews={previewsDemo}
          versiones={[]}
          tokenActivo={false}
          linkPath={null}
          tieneInforme={false}
          categoriaId="demo-cat"
          subtipoId="demo-sub"
          eventoId="demo-evento"
          onGuardar={async () => ({ ok: true, tokenActivo: false, linkPath: null })}
          onDesactivar={async () => ({ ok: true, tokenActivo: false, linkPath: null })}
          onRegenerar={async () => ({ ok: true, tokenActivo: false, linkPath: null })}
        />
      </div>
    </main>
  );
}
