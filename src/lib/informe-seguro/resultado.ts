import type { ListaFaltantesInforme } from "@/lib/informe-seguro/faltantes";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";

export type VersionLista = {
  numero: number;
  publicadoAt: string;
  publicadoPor: string | null;
};

export type InformeGuardado = {
  id: string;
  token: string;
  tokenActivo: boolean;
  borrador: BorradorInforme;
  versiones: VersionLista[];
};

export type ResultadoPersistir = {
  ok: boolean;
  error?: string;
  pendiente?: boolean;
  requiereConfirmacion?: boolean;
  faltantes?: ListaFaltantesInforme;
  linkPath?: string | null;
  tokenActivo?: boolean;
  versionesRecintos?: { trabajoId: string; version: number }[];
};
