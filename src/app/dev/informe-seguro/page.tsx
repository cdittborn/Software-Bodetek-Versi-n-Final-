import { notFound } from "next/navigation";
import { DemoEditor } from "@/app/dev/informe-seguro/DemoEditor";

export const dynamic = "force-dynamic";

export default function DemoEditorInformePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-full bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <DemoEditor />
      </div>
    </main>
  );
}
