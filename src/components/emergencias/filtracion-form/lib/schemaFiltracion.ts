import { z } from "zod";
import { ESTADOS_LLUVIAS } from "@/lib/trabajos";

export const NONE = "none";

export const filtracionFormSchema = z.object({
  recintoId: z.string().min(1, "Selecciona la bodega afectada"),
  descripcion: z.string().min(1, "Describe el problema"),
  planAccion: z.string().optional(),
  fechaEntregaEstimada: z.string().optional(),
  estado: z.enum(ESTADOS_LLUVIAS),
  ejecutadoPor: z.string(),
  proveedorId: z.string(),
  fechaEntregaReal: z.string().optional(),
  horasMaestros: z.string().optional(),
  numeroCotizacion: z.string().optional(),
  valorRecinto: z.string().optional(),
  valorTotalCotizacion: z.string().optional(),
});

export type FiltracionFormSchema = z.infer<typeof filtracionFormSchema>;

export const defaultFiltracionValues: FiltracionFormSchema = {
  recintoId: "",
  descripcion: "",
  planAccion: "",
  fechaEntregaEstimada: "",
  estado: "sin_asignar",
  ejecutadoPor: NONE,
  proveedorId: NONE,
  fechaEntregaReal: "",
  horasMaestros: "",
  numeroCotizacion: "",
  valorRecinto: "",
  valorTotalCotizacion: "",
};
