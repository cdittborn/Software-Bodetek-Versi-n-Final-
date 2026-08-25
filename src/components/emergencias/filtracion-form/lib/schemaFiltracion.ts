import { z } from "zod";
import { ESTADOS_LLUVIAS } from "@/lib/trabajos";
import { problemasVacios } from "@/lib/filtracion/problemas";

export const NONE = "none";

const bloqueProblemaSchema = z.object({
  activo: z.boolean(),
  descripcion: z.string(),
  plan: z.string(),
});

export const filtracionFormSchema = z.object({
  recintoId: z.string().min(1, "Selecciona la bodega afectada"),
  fechaEntregaEstimada: z.string().optional(),
  estado: z.enum(ESTADOS_LLUVIAS),
  ejecutadoPor: z.string(),
  proveedorId: z.string(),
  fechaEntregaReal: z.string().optional(),
  horasMaestros: z.string().optional(),
  numeroCotizacion: z.string().optional(),
  valorRecinto: z.string().optional(),
  valorTotalCotizacion: z.string().optional(),
  problemas: z.object({
    techumbre: bloqueProblemaSchema,
    canaleta: bloqueProblemaSchema,
    cielo: bloqueProblemaSchema,
    electrico: bloqueProblemaSchema,
  }),
});

export type FiltracionFormSchema = z.infer<typeof filtracionFormSchema>;

export const defaultFiltracionValues: FiltracionFormSchema = {
  recintoId: "",
  fechaEntregaEstimada: "",
  estado: "sin_asignar",
  ejecutadoPor: NONE,
  proveedorId: NONE,
  fechaEntregaReal: "",
  horasMaestros: "",
  numeroCotizacion: "",
  valorRecinto: "",
  valorTotalCotizacion: "",
  problemas: problemasVacios(),
};
