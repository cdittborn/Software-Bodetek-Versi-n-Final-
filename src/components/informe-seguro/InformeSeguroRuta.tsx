"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PantallaInformeSeguro } from "@/components/informe-seguro/PantallaInformeSeguro";
import type { FuenteProyecto } from "@/lib/informe-seguro/fuente";
import type { ResultadoPersistir } from "@/lib/informe-seguro/resultado";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";

type InformeSeguroRutaProps = {
  modoInicial?: "edicion" | "liquidador";
  controles: boolean;
  fuente: FuenteProyecto[];
  inicial: BorradorInforme;
  urls: Record<string, string>;
  dashboardHref?: string;
  linkPath?: string | null;
  tokenActivo?: boolean;
  onGuardar?: (
    borrador: BorradorInforme,
    opciones?: { activarLink?: boolean },
  ) => Promise<ResultadoPersistir>;
  onDesactivar?: () => Promise<ResultadoPersistir>;
  onRegenerar?: () => Promise<ResultadoPersistir>;
};

export function InformeSeguroRuta(props: InformeSeguroRutaProps) {
  const params = useSearchParams();
  const router = useRouter();
  const [modo, setModo] = useState<"edicion" | "liquidador">(props.modoInicial ?? "edicion");
  const recinto = params.get("recinto");

  function ir(codigo: string | null) {
    const query = new URLSearchParams(params.toString());
    if (codigo) query.set("recinto", codigo);
    else query.delete("recinto");
    const texto = query.toString();
    router.push(texto ? `?${texto}` : "?", { scroll: true });
  }

  return (
    <PantallaInformeSeguro
      modo={props.modoInicial === "liquidador" ? "liquidador" : modo}
      controles={props.controles}
      fuente={props.fuente}
      inicial={props.inicial}
      urls={props.urls}
      recintoCodigo={recinto}
      onElegirRecinto={(codigo) => ir(codigo)}
      onVolverLista={() => ir(null)}
      dashboardHref={props.dashboardHref}
      linkPath={props.linkPath}
      tokenActivo={props.tokenActivo}
      onGuardar={props.onGuardar}
      onDesactivar={props.onDesactivar}
      onRegenerar={props.onRegenerar}
      onAlternarModo={
        props.controles && props.modoInicial !== "liquidador"
          ? () => setModo((actual) => (actual === "edicion" ? "liquidador" : "edicion"))
          : undefined
      }
    />
  );
}
