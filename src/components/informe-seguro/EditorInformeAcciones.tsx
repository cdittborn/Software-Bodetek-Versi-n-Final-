"use client";

import { Suspense } from "react";
import { InformeSeguroRuta } from "@/components/informe-seguro/InformeSeguroRuta";
import {
  activarLinkDelInforme,
  desactivarTokenInforme,
  guardarInforme,
  regenerarTokenInforme,
} from "@/lib/informe-seguro/acciones";
import type { FuenteProyecto } from "@/lib/informe-seguro/fuente";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";
import { eventoDashboardHref } from "@/lib/trabajos";

type EditorInformeAccionesProps = {
  fuente: FuenteProyecto[];
  inicial: BorradorInforme;
  previews: Record<string, string>;
  tokenActivo: boolean;
  linkPath: string | null;
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
};

export function EditorInformeAcciones(props: EditorInformeAccionesProps) {
  return (
    <Suspense>
    <InformeSeguroRuta
      controles
      fuente={props.fuente}
      inicial={props.inicial}
      urls={props.previews}
      tokenActivo={props.tokenActivo}
      linkPath={props.linkPath}
      dashboardHref={eventoDashboardHref(props.categoriaId, props.subtipoId, props.eventoId)}
      onGuardar={(borrador) =>
        guardarInforme({
          eventoId: props.eventoId,
          categoriaId: props.categoriaId,
          subtipoId: props.subtipoId,
          borrador,
          publicar: false,
          confirmarFaltantes: true,
        })
      }
      onActivar={() => activarLinkDelInforme(props.eventoId)}
      onDesactivar={() => desactivarTokenInforme(props.eventoId)}
      onRegenerar={() => regenerarTokenInforme(props.eventoId)}
    />
    </Suspense>
  );
}
