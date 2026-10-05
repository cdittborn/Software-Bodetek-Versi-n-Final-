"use client";

import { EditorInformeSeguro } from "@/components/informe-seguro/EditorInformeSeguro";
import {
  desactivarTokenInforme,
  guardarInforme,
  regenerarTokenInforme,
} from "@/lib/informe-seguro/acciones";
import type { FuenteProyecto } from "@/lib/informe-seguro/fuente";
import type { VersionLista } from "@/lib/informe-seguro/resultado";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";

type EditorInformeAccionesProps = {
  fuente: FuenteProyecto[];
  inicial: BorradorInforme;
  previews: Record<string, string>;
  versiones: VersionLista[];
  tokenActivo: boolean;
  linkPath: string | null;
  tieneInforme: boolean;
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
};

export function EditorInformeAcciones(props: EditorInformeAccionesProps) {
  return (
    <EditorInformeSeguro
      {...props}
      onGuardar={(borrador, publicar, confirmarFaltantes) =>
        guardarInforme({
          eventoId: props.eventoId,
          categoriaId: props.categoriaId,
          subtipoId: props.subtipoId,
          borrador,
          publicar,
          confirmarFaltantes,
        })
      }
      onDesactivar={() => desactivarTokenInforme(props.eventoId)}
      onRegenerar={() => regenerarTokenInforme(props.eventoId)}
    />
  );
}
