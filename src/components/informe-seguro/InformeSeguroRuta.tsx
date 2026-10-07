"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  persistenciaId?: string;
  onGuardar?: (borrador: BorradorInforme) => Promise<ResultadoPersistir>;
  onActivar?: () => Promise<ResultadoPersistir>;
  onDesactivar?: () => Promise<ResultadoPersistir>;
  onRegenerar?: () => Promise<ResultadoPersistir>;
};

export function InformeSeguroRuta(props: InformeSeguroRutaProps) {
  const params = useSearchParams();
  const [modo, setModo] = useState<"edicion" | "liquidador">(props.modoInicial ?? "edicion");
  const [recinto, setRecinto] = useState<string | null>(() => params.get("recinto"));

  useEffect(() => {
    const alVolver = () => {
      setRecinto(new URLSearchParams(window.location.search).get("recinto"));
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  function ir(codigo: string | null) {
    setRecinto(codigo);
    const query = new URLSearchParams(window.location.search);
    if (codigo) query.set("recinto", codigo);
    else query.delete("recinto");
    const texto = query.toString();
    const url = `${window.location.pathname}${texto ? `?${texto}` : ""}`;
    // Cambia ?recinto= sin pedir de nuevo el informe al servidor.
    window.history.pushState(null, "", url);
    window.scrollTo(0, 0);
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
      persistenciaId={props.persistenciaId}
      onGuardar={props.onGuardar}
      onActivar={props.onActivar}
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
