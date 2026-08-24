"use client";

import { type FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TituloSeccion } from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import type { FiltracionFormSchema } from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";

type Props = {
  errors: FieldErrors<FiltracionFormSchema>;
  register: ReturnType<
    typeof import("react-hook-form").useForm<FiltracionFormSchema>
  >["register"];
};

export function Seccion02Diagnostico({ errors, register }: Props) {
  return (
    <section
      id="sec-02"
      className="-mx-4 mb-10 scroll-mt-4 bg-[#faf9f7] px-4 py-6 md:-mx-6 md:px-6"
    >
      <TituloSeccion numero="02" titulo="Diagnóstico y plan" />
      <span className="mb-4 inline-block rounded-md bg-[#fdf4e3] px-2 py-1 text-xs font-medium text-[#7a4e10]">
        Anotar acá mucho detalle
      </span>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="descripcion" className="text-[#3f3f46]">
            Descripción del problema *
          </Label>
          <Textarea
            id="descripcion"
            rows={8}
            className="min-h-[190px] text-[15px]"
            {...register("descripcion")}
          />
          {errors.descripcion ? (
            <p className="text-sm text-[#a4131f]">{errors.descripcion.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="planAccion" className="text-[#3f3f46]">
            Plan de acción
          </Label>
          <Textarea
            id="planAccion"
            rows={8}
            className="min-h-[190px] text-[15px]"
            {...register("planAccion")}
          />
        </div>
      </div>
    </section>
  );
}
