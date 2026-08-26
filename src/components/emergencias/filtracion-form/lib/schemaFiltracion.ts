import { z } from "zod";
import { ESTADOS_LLUVIAS } from "@/lib/trabajos";
import { problemasVacios } from "@/lib/filtracion/problemas";

export const NONE = "none";

const bloqueProblemaSchema = z.object({
  activo: z.boolean(),
  descripcion: z.string(),
  plan: z.string(),
  ejecutadoPor: z.union([
    z.literal(""),
    z.literal("maestros_bodetek"),
    z.literal("proveedor_externo"),
  ]),
  estado: z.enum(ESTADOS_LLUVIAS),
  fechaEntregaEstimada: z.string(),
  fechaEntregaReal: z.string(),
  horasMaestros: z.string(),
  proveedorId: z.string(),
  numeroCotizacion: z.string(),
  valorRecinto: z.string(),
  valorTotalCotizacion: z.string(),
});

export const filtracionFormSchema = z.object({
  recintoId: z.string().min(1, "Selecciona la bodega afectada"),
  problemas: z.object({
    techumbre: bloqueProblemaSchema,
    cielo: bloqueProblemaSchema,
    electrico: bloqueProblemaSchema,
    suciedad_piso: bloqueProblemaSchema,
  }),
});

export type FiltracionFormSchema = z.infer<typeof filtracionFormSchema>;

export const defaultFiltracionValues: FiltracionFormSchema = {
  recintoId: "",
  problemas: problemasVacios(),
};
