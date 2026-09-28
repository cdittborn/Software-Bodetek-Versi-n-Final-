/** Datos de ejemplo EN MEMORIA (capturas Claude Design). Sin I/O. */

import type {
  ConteosBorrarFachada,
  FachadaDetalle,
  FachadaListadoItem,
  IntervencionDetalle,
  MediaFachada,
  PortadaIntervencion,
} from "@/lib/fachadas/tipos";
import type {
  DocumentoIndicador,
  IntervencionIndicadores,
  TipoIntervencionDias,
} from "@/lib/fachadas/indicadores";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";
import type { EstadoCalculadoFachada } from "@/lib/fachadas/estado";
import type { EjecutadoPorFachada } from "@/lib/fachadas/indicadores";

export const DEMO_HOY = "2026-09-28";
export const DEMO_BASE = "/trabajos/fachadas/demo";
export const DEMO_CATEGORIA = "demo";
export const DEMO_SUBTIPO = "demo";

export const DEMO_PROVEEDORES: ProveedorOption[] = [
  { id: "prov-andes", nombre_empresa: "Pinturas Andes", rubros: ["pintura", "limpieza"] },
  { id: "prov-sur", nombre_empresa: "Revestimientos Sur", rubros: ["reparacion", "pintura"] },
  { id: "prov-maipu", nombre_empresa: "Hojalatería Maipú", rubros: ["hojalateria"] },
  { id: "prov-sodimac", nombre_empresa: "Sodimac", rubros: ["materiales"] },
];

export const DEMO_RECINTOS: RecintoOption[] = Array.from({ length: 32 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `r${n}`,
    codigo: `Bodega ${n}`,
    nombre: `Bodega ${n}`,
    arrendatario_actual: null,
  };
});

type EstadoPlan = EstadoCalculadoFachada;

type FachadaPlan = {
  n: number;
  letra: string | null;
  estado: EstadoPlan;
  m2: number;
  alto?: number;
  ancho?: number;
};

/** 45 fachadas / 32 recintos, cifras de las capturas. */
const PLAN: FachadaPlan[] = [
  { n: 1, letra: "A", estado: "al_dia", m2: 172 },
  { n: 1, letra: "B", estado: "al_dia", m2: 168 },
  { n: 2, letra: "A", estado: "requiere_trabajo", m2: 110 },
  { n: 2, letra: "B", estado: "al_dia", m2: 180 },
  { n: 3, letra: "A", estado: "en_ejecucion", m2: 132.5, alto: 7.0, ancho: 18.93 },
  { n: 3, letra: "B", estado: "requiere_trabajo", m2: 108 },
  { n: 4, letra: "A", estado: "al_dia", m2: 176 },
  { n: 4, letra: "B", estado: "programada", m2: 102 },
  { n: 5, letra: "A", estado: "al_dia", m2: 170 },
  { n: 5, letra: "B", estado: "en_ejecucion", m2: 140 },
  { n: 6, letra: "A", estado: "requiere_trabajo", m2: 115 },
  { n: 6, letra: "B", estado: "al_dia", m2: 182 },
  { n: 7, letra: "A", estado: "programada", m2: 98 },
  { n: 7, letra: "B", estado: "al_dia", m2: 84, alto: 6, ancho: 14 },
  { n: 8, letra: "A", estado: "requiere_trabajo", m2: 112 },
  { n: 8, letra: "B", estado: "al_dia", m2: 165 },
  { n: 9, letra: "A", estado: "requiere_trabajo", m2: 120, alto: 6, ancho: 20 },
  { n: 9, letra: "B", estado: "al_dia", m2: 178 },
  { n: 10, letra: "A", estado: "requiere_trabajo", m2: 116 },
  { n: 10, letra: "B", estado: "programada", m2: 100 },
  { n: 11, letra: "A", estado: "al_dia", m2: 148, alto: 6.5, ancho: 22.77 },
  { n: 11, letra: "B", estado: "programada", m2: 104 },
  { n: 12, letra: "A", estado: "requiere_trabajo", m2: 109 },
  { n: 12, letra: "B", estado: "al_dia", m2: 174 },
  { n: 13, letra: "A", estado: "requiere_trabajo", m2: 111 },
  { n: 13, letra: "B", estado: "en_ejecucion", m2: 125 },
  { n: 14, letra: "A", estado: "al_dia", m2: 111.6, alto: 6.2, ancho: 18 },
  { n: 15, letra: null, estado: "al_dia", m2: 160 },
  { n: 16, letra: null, estado: "programada", m2: 101 },
  { n: 17, letra: null, estado: "requiere_trabajo", m2: 107 },
  { n: 18, letra: null, estado: "programada", m2: 96, alto: 6, ancho: 16 },
  { n: 19, letra: null, estado: "requiere_trabajo", m2: 113 },
  { n: 20, letra: null, estado: "al_dia", m2: 190 },
  { n: 21, letra: null, estado: "en_ejecucion", m2: 118 },
  { n: 22, letra: null, estado: "al_dia", m2: 64.8, alto: 5.4, ancho: 12 },
  { n: 23, letra: null, estado: "requiere_trabajo", m2: 106 },
  { n: 24, letra: null, estado: "programada", m2: 99 },
  { n: 25, letra: null, estado: "requiere_trabajo", m2: 114 },
  { n: 26, letra: null, estado: "al_dia", m2: 188 },
  { n: 27, letra: null, estado: "requiere_trabajo", m2: 72.4, alto: 5.2, ancho: 13.92 },
  { n: 28, letra: null, estado: "al_dia", m2: 177 },
  { n: 29, letra: null, estado: "programada", m2: 97 },
  { n: 30, letra: null, estado: "requiere_trabajo", m2: 105 },
  { n: 31, letra: null, estado: "al_dia", m2: 171.6 },
  { n: 32, letra: null, estado: "programada", m2: 249.1 },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function idFachada(n: number, letra: string | null): string {
  return `f${pad(n)}${letra ?? ""}`;
}

function recintoId(n: number): string {
  return `r${pad(n)}`;
}

function recintoCodigo(n: number): string {
  return `B${pad(n)}`;
}

function recintoEtiqueta(n: number): string {
  return `Bodega ${pad(n)}`;
}

export function svgFachada(opts: {
  variant: "antes" | "despues";
  seed?: number;
  letrero?: string;
}): string {
  const sucio = opts.variant === "antes";
  const muro = sucio ? "#c4b7a4" : "#d9d2c3";
  const franja = sucio ? "#8a1f28" : "#e30613";
  const persiana = sucio ? "#6e6a64" : "#8d8a84";
  const cielo = sucio ? "#d7d2c8" : "#e7e4dc";
  const texto = opts.letrero ?? "BODETEK";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
    <rect width="800" height="500" fill="${cielo}"/>
    <rect x="40" y="70" width="720" height="390" fill="${muro}"/>
    <rect x="40" y="70" width="720" height="70" fill="${franja}"/>
    <text x="70" y="118" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="#fff">${texto}</text>
    <rect x="90" y="200" width="280" height="220" fill="${persiana}"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="90" y="${200 + i * 28}" width="280" height="8" fill="#00000022"/>`).join("")}
    <rect x="430" y="210" width="140" height="200" fill="${sucio ? "#b9b3a8" : "#cfc8bc"}"/>
    <rect x="600" y="250" width="90" height="160" fill="${sucio ? "#b0aa9f" : "#c8c1b5"}"/>
    ${sucio ? `<rect x="120" y="320" width="40" height="70" fill="#5c5852"/>` : ""}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function svgPlanoB14(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280">
    <rect width="640" height="280" fill="#faf9f6"/>
    <defs><pattern id="g" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M16 0H0V16" fill="none" stroke="#eceae4" stroke-width="1"/>
    </pattern></defs>
    <rect width="640" height="280" fill="url(#g)"/>
    <rect x="70" y="50" width="500" height="170" fill="none" stroke="#444" stroke-width="2"/>
    <rect x="120" y="90" width="90" height="90" fill="none" stroke="#888"/>
    <rect x="230" y="90" width="90" height="90" fill="none" stroke="#888"/>
    <rect x="430" y="120" width="50" height="100" fill="none" stroke="#888"/>
    <text x="320" y="240" text-anchor="middle" font-size="13" fill="#666">18,00 m</text>
    <text x="585" y="140" font-size="13" fill="#c8102e">6,20 m</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function foto(n: number, letra: string | null, variant: "antes" | "despues"): string {
  return svgFachada({
    variant,
    letrero: variant === "despues" ? `BODETEK ${pad(n)}` : "BODETEK",
    seed: n + (letra ? letra.charCodeAt(0) : 0),
  });
}

export const DEMO_FACHADAS: FachadaListadoItem[] = PLAN.map((p) => ({
  id: idFachada(p.n, p.letra),
  nombre: p.letra ? (p.letra === "A" ? "Principal (acceso)" : p.letra === "B" ? "Posterior" : "Lateral") : `Fachada Bodega ${pad(p.n)}`,
  letra: p.letra,
  recintoId: recintoId(p.n),
  recintoCodigo: recintoCodigo(p.n),
  recintoEtiqueta: recintoEtiqueta(p.n),
  superficieM2: p.m2,
  frecuenciaRevisionMeses: p.n === 14 ? 6 : 12,
  fotoUrl: foto(p.n, p.letra, "despues"),
  intervencionesN: 1,
  ultimoEstado:
    p.estado === "en_ejecucion"
      ? "en_ejecucion"
      : p.estado === "programada"
        ? "programada"
        : "terminada",
}));

function docs(
  items: Array<{
    tipo: DocumentoIndicador["tipoDocumento"];
    cat: DocumentoIndicador["categoria"];
    neto: number;
    estado: string;
  }>,
): DocumentoIndicador[] {
  return items.map((d) => ({
    tipoDocumento: d.tipo,
    categoria: d.cat,
    valorNeto: d.neto,
    estado: d.estado,
  }));
}

function intBase(
  extra: Partial<IntervencionIndicadores> &
    Pick<IntervencionIndicadores, "id" | "fachadaId">,
): IntervencionIndicadores {
  const f = DEMO_FACHADAS.find((x) => x.id === extra.fachadaId);
  return {
    recintoId: f?.recintoId ?? null,
    ejecutadoPor: "maestros_bodetek",
    requiereHojalateria: false,
    sinMateriales: false,
    fechaInicio: "2026-06-01",
    fechaTermino: "2026-06-10",
    estado: "terminada",
    altoMSnapshot: 6,
    anchoMSnapshot: 12,
    superficieM2Snapshot: f?.superficieM2 ?? 100,
    tipos: [{ tipo: "limpieza", dias: 2 }],
    cotizaciones: [],
    hojalaterias: [],
    materiales: [],
    documentos: [],
    ...extra,
  };
}

function costoMaestro(opts: {
  id: string;
  fachadaId: string;
  tipos: TipoIntervencionDias[];
  fechaInicio: string;
  fechaTermino: string | null;
  estado?: IntervencionIndicadores["estado"];
  mano: number;
  pintura?: number;
  otros?: number;
  hoj?: number;
  docs?: DocumentoIndicador[];
  ejecutadoPor?: EjecutadoPorFachada;
  proveedorId?: string | null;
}): IntervencionIndicadores {
  const pintura = opts.pintura ?? 0;
  const otros = opts.otros ?? 0;
  const materiales = [
    ...(pintura ? [{ tipo: "pintura" as const, valorNeto: pintura, valorBruto: pintura }] : []),
    ...(otros ? [{ tipo: "otros" as const, valorNeto: otros, valorBruto: otros }] : []),
  ];
  const hoj = opts.hoj ?? 0;
  const documentos =
    opts.docs ??
    docs([
      ...(opts.mano
        ? [{ tipo: "factura" as const, cat: "mano_de_obra" as const, neto: opts.mano, estado: "pagada" }]
        : []),
      ...(hoj
        ? [{ tipo: "factura" as const, cat: "hojalateria" as const, neto: hoj, estado: "pagada" }]
        : []),
    ]);
  return intBase({
    id: opts.id,
    fachadaId: opts.fachadaId,
    tipos: opts.tipos,
    fechaInicio: opts.fechaInicio,
    fechaTermino: opts.fechaTermino,
    estado: opts.estado ?? "terminada",
    ejecutadoPor: opts.ejecutadoPor ?? "maestros_bodetek",
    proveedorId: opts.proveedorId ?? null,
    sinMateriales: materiales.length === 0,
    materiales,
    requiereHojalateria: hoj > 0,
    hojalaterias: hoj
      ? [{ proveedorId: "prov-maipu", valorNeto: hoj, valorBruto: hoj }]
      : [],
    cotizaciones:
      opts.estado === "en_ejecucion" || opts.estado === "programada"
        ? []
        : opts.ejecutadoPor === "proveedor_externo"
        ? [
            {
              valorNeto:
                opts.mano ||
                documentos.find((d) => d.tipoDocumento === "cotizacion")?.valorNeto ||
                0,
              valorBruto:
                opts.mano ||
                documentos.find((d) => d.tipoDocumento === "cotizacion")?.valorNeto ||
                0,
              cotizacionKey: `cot/${opts.id}`,
              facturaKey: documentos.some((d) => d.tipoDocumento === "factura")
                ? `fac/${opts.id}`
                : null,
              tipos: opts.tipos.map((t) => t.tipo),
            },
          ]
        : [],
    documentos,
    ...(opts.estado === "en_ejecucion" || opts.estado === "programada"
      ? { sinMateriales: false, materiales: [] as IntervencionIndicadores["materiales"] }
      : {}),
  });
}

const I_B14_2026 = "i-f14A-2026";
const I_B07 = "i-f07B-2026";
const I_B22 = "i-f22-2026";
const I_B11 = "i-f11A-2026";
const I_B03 = "i-f03A-2026";
const I_B18 = "i-f18-2026";

/** Intervenciones 2026 + historial de Bodega 14 · A. */
export const DEMO_INTERVENCIONES: IntervencionIndicadores[] = [
  costoMaestro({
    id: I_B14_2026,
    fachadaId: "f14A",
    tipos: [
      { tipo: "limpieza", dias: 2 },
      { tipo: "reparacion", dias: 3.5 },
      { tipo: "pintura", dias: 3.5 },
    ],
    fechaInicio: "2026-09-01",
    fechaTermino: "2026-09-12",
    ejecutadoPor: "proveedor_externo",
    proveedorId: "prov-andes",
    mano: 1_420_000,
    pintura: 312_000,
    otros: 74_000,
    hoj: 245_000,
    docs: docs([
      { tipo: "cotizacion", cat: "mano_de_obra", neto: 1_480_000, estado: "aprobada" },
      { tipo: "factura", cat: "mano_de_obra", neto: 1_420_000, estado: "pagada" },
      { tipo: "cotizacion", cat: "materiales", neto: 386_000, estado: "aprobada" },
      { tipo: "factura", cat: "materiales", neto: 386_000, estado: "pagada" },
      { tipo: "cotizacion", cat: "hojalateria", neto: 260_000, estado: "aprobada" },
      { tipo: "factura", cat: "hojalateria", neto: 245_000, estado: "pagada" },
    ]),
  }),
  costoMaestro({
    id: "i-f14A-2025",
    fachadaId: "f14A",
    tipos: [
      { tipo: "limpieza", dias: 4 },
      { tipo: "reparacion", dias: 0 },
      { tipo: "pintura", dias: 0 },
    ],
    fechaInicio: "2025-03-10",
    fechaTermino: "2025-03-14",
    mano: 200_000,
    pintura: 53_000,
  }),
  costoMaestro({
    id: "i-f14A-2023",
    fachadaId: "f14A",
    tipos: [
      { tipo: "limpieza", dias: 2.7 },
      { tipo: "reparacion", dias: 5 },
    ],
    fechaInicio: "2023-10-02",
    fechaTermino: "2023-10-13",
    mano: 720_000,
    pintura: 175_000,
  }),
  costoMaestro({
    id: I_B07,
    fachadaId: "f07B",
    tipos: [
      { tipo: "limpieza", dias: 2 },
      { tipo: "pintura", dias: 2 },
    ],
    fechaInicio: "2026-08-28",
    fechaTermino: "2026-09-03",
    mano: 520_000,
    pintura: 90_000,
    docs: docs([
      { tipo: "cotizacion", cat: "mano_de_obra", neto: 520_000, estado: "aprobada" },
      { tipo: "factura", cat: "mano_de_obra", neto: 520_000, estado: "pagada" },
    ]),
  }),
  costoMaestro({
    id: I_B22,
    fachadaId: "f22",
    tipos: [{ tipo: "limpieza", dias: 2 }],
    fechaInicio: "2026-08-25",
    fechaTermino: "2026-08-28",
    mano: 180_000,
  }),
  costoMaestro({
    id: I_B11,
    fachadaId: "f11A",
    tipos: [
      { tipo: "reparacion", dias: 5 },
      { tipo: "pintura", dias: 3 },
    ],
    fechaInicio: "2026-08-10",
    fechaTermino: "2026-08-20",
    ejecutadoPor: "proveedor_externo",
    proveedorId: "prov-sur",
    mano: 1_520_000,
    pintura: 340_000,
  }),
  costoMaestro({
    id: I_B03,
    fachadaId: "f03A",
    tipos: [
      { tipo: "reparacion", dias: 3 },
      { tipo: "pintura", dias: 2 },
    ],
    fechaInicio: "2026-09-15",
    fechaTermino: null,
    estado: "en_ejecucion",
    ejecutadoPor: "proveedor_externo",
    proveedorId: "prov-sur",
    mano: 0,
    docs: docs([
      { tipo: "cotizacion", cat: "mano_de_obra", neto: 1_690_000, estado: "aprobada" },
    ]),
  }),
  costoMaestro({
    id: I_B18,
    fachadaId: "f18",
    tipos: [
      { tipo: "limpieza", dias: 2 },
      { tipo: "pintura", dias: 2 },
    ],
    fechaInicio: "2026-10-15",
    fechaTermino: "2026-10-20",
    estado: "programada",
    mano: 400_000,
    docs: docs([
      { tipo: "cotizacion", cat: "mano_de_obra", neto: 400_000, estado: "pendiente" },
    ]),
  }),
  costoMaestro({
    id: "i-f09A-2025",
    fachadaId: "f09A",
    tipos: [{ tipo: "limpieza", dias: 2 }],
    fechaInicio: "2025-03-01",
    fechaTermino: "2025-03-20",
    mano: 80_000,
  }),
  costoMaestro({
    id: "i-f27-2024",
    fachadaId: "f27",
    tipos: [{ tipo: "limpieza", dias: 2 }],
    fechaInicio: "2024-11-01",
    fechaTermino: "2024-11-15",
    mano: 60_000,
  }),
];

const AL_DIA_REST = PLAN.filter(
  (p) =>
    p.estado === "al_dia" &&
    !["f14A", "f07B", "f22", "f11A"].includes(idFachada(p.n, p.letra)),
);

const EN_EJ_REST = PLAN.filter(
  (p) =>
    p.estado === "en_ejecucion" && idFachada(p.n, p.letra) !== "f03A",
);

const PROG_REST = PLAN.filter(
  (p) => p.estado === "programada" && idFachada(p.n, p.letra) !== "f18",
);

const REQ_REST = PLAN.filter(
  (p) =>
    p.estado === "requiere_trabajo" &&
    !["f09A", "f27"].includes(idFachada(p.n, p.letra)),
);

function pushResto() {
  const out: IntervencionIndicadores[] = [];
  const limpiezas: FachadaPlan[] = [];
  const reparaciones: FachadaPlan[] = [];
  const pinturas: FachadaPlan[] = [];
  AL_DIA_REST.forEach((p, i) => {
    if (i < 6) limpiezas.push(p);
    else if (i < 10) reparaciones.push(p);
    else pinturas.push(p);
  });

  limpiezas.forEach((p, i) => {
    const id = idFachada(p.n, p.letra);
    const externo = i < 3;
    out.push(
      costoMaestro({
        id: `i-${id}-2026`,
        fachadaId: id,
        tipos: [{ tipo: "limpieza", dias: 2 }],
        fechaInicio: `2026-0${5 + (i % 3)}-04`,
        fechaTermino: `2026-0${5 + (i % 3)}-12`,
        ejecutadoPor: externo ? "proveedor_externo" : "maestros_bodetek",
        proveedorId: externo ? "prov-andes" : null,
        mano: externo ? 420_000 : 310_000,
        pintura: externo ? 40_000 : 25_000,
        hoj: i === 0 ? 625_000 : i === 1 ? 350_000 : i === 2 ? 340_000 : i === 3 ? 340_000 : 0,
      }),
    );
  });

  reparaciones.forEach((p, i) => {
    const id = idFachada(p.n, p.letra);
    out.push(
      costoMaestro({
        id: `i-${id}-2026`,
        fachadaId: id,
        tipos: [{ tipo: "reparacion", dias: 6 }],
        fechaInicio: "2026-07-02",
        fechaTermino: "2026-07-18",
        ejecutadoPor: i === 0 ? "proveedor_externo" : "maestros_bodetek",
        proveedorId: i === 0 ? "prov-sur" : null,
        mano: i === 0 ? 1_050_000 : 780_000,
        pintura: 80_000,
        otros: 30_000,
      }),
    );
  });

  pinturas.forEach((p, i) => {
    const id = idFachada(p.n, p.letra);
    out.push(
      costoMaestro({
        id: `i-${id}-2026`,
        fachadaId: id,
        tipos: [{ tipo: "pintura", dias: 3 }],
        fechaInicio: "2026-06-08",
        fechaTermino: "2026-06-20",
        ejecutadoPor: i < 2 ? "maestros_bodetek" : "proveedor_externo",
        proveedorId: i < 2 ? null : "prov-andes",
        mano: 845_000,
        pintura: 460_750,
        otros: 151_500,
      }),
    );
  });

  EN_EJ_REST.forEach((p, i) => {
    const id = idFachada(p.n, p.letra);
    out.push(
      costoMaestro({
        id: `i-${id}-2026`,
        fachadaId: id,
        tipos:
          i === 0
            ? [{ tipo: "reparacion", dias: 4 }]
            : i === 1
              ? [
                  { tipo: "limpieza", dias: 1 },
                  { tipo: "reparacion", dias: 2 },
                ]
              : [{ tipo: "pintura", dias: 3 }],
        fechaInicio: "2026-09-10",
        fechaTermino: null,
        estado: "en_ejecucion",
        ejecutadoPor: i === 2 ? "proveedor_externo" : "maestros_bodetek",
        proveedorId: i === 2 ? "prov-andes" : null,
        mano: 0,
        docs: docs([
          {
            tipo: "cotizacion",
            cat: "mano_de_obra",
            neto: i === 0 ? 900_000 : i === 1 ? 640_000 : 720_000,
            estado: "aprobada",
          },
        ]),
      }),
    );
  });

  PROG_REST.forEach((p, i) => {
    const id = idFachada(p.n, p.letra);
    out.push(
      costoMaestro({
        id: `i-${id}-2026`,
        fachadaId: id,
        tipos: [{ tipo: "limpieza", dias: 2 }],
        fechaInicio: `2026-10-${String(12 + i).padStart(2, "0")}`,
        fechaTermino: `2026-10-${String(18 + i).padStart(2, "0")}`,
        estado: "programada",
        mano: 200_000,
        docs: docs([
          { tipo: "cotizacion", cat: "mano_de_obra", neto: 200_000, estado: "pendiente" },
        ]),
      }),
    );
  });

  REQ_REST.forEach((p, i) => {
    const id = idFachada(p.n, p.letra);
    out.push(
      costoMaestro({
        id: `i-${id}-2024`,
        fachadaId: id,
        tipos: [{ tipo: "limpieza", dias: 2 }],
        fechaInicio: i % 2 === 0 ? "2024-11-02" : "2025-02-04",
        fechaTermino: i % 2 === 0 ? "2024-11-12" : "2025-02-14",
        mano: 70_000,
      }),
    );
  });

  return out;
}

DEMO_INTERVENCIONES.push(...pushResto());

function mediaItem(
  id: string,
  intervencionId: string,
  tipo: "antes" | "despues",
  url: string,
  orden: number,
  esPortada: boolean,
): MediaFachada {
  return {
    id,
    tipo,
    tipoArchivo: "foto",
    objectKey: `demo/${id}`,
    nombreArchivo: `${tipo}.png`,
    thumbnailKey: null,
    publicUrl: url,
    thumbnailUrl: url,
    esPortada,
    orden,
    fecha: "2026-09-12",
  };
}

function mediaB14(intId: string, nAntes: number, nDespues: number): MediaFachada[] {
  const out: MediaFachada[] = [];
  for (let i = 0; i < nAntes; i++) {
    out.push(
      mediaItem(
        `${intId}-a${i}`,
        intId,
        "antes",
        svgFachada({ variant: "antes", letrero: "BODETEK" }),
        i,
        i === 0,
      ),
    );
  }
  for (let i = 0; i < nDespues; i++) {
    out.push(
      mediaItem(
        `${intId}-d${i}`,
        intId,
        "despues",
        svgFachada({ variant: "despues", letrero: "BODETEK 14" }),
        i,
        i === 0,
      ),
    );
  }
  return out;
}

export const DEMO_PORTADAS: PortadaIntervencion[] = [
  {
    intervencionId: I_B14_2026,
    antesUrl: svgFachada({ variant: "antes" }),
    despuesUrl: svgFachada({ variant: "despues", letrero: "BODETEK 14" }),
  },
  {
    intervencionId: I_B07,
    antesUrl: svgFachada({ variant: "antes" }),
    despuesUrl: svgFachada({ variant: "despues", letrero: "BODETEK 07" }),
  },
  {
    intervencionId: I_B22,
    antesUrl: svgFachada({ variant: "antes" }),
    despuesUrl: svgFachada({ variant: "despues", letrero: "BODETEK 22" }),
  },
  {
    intervencionId: I_B11,
    antesUrl: svgFachada({ variant: "antes" }),
    despuesUrl: svgFachada({ variant: "despues", letrero: "BODETEK 11" }),
  },
];

export const DEMO_FACHADA_B14: FachadaDetalle = {
  id: "f14A",
  nombre: "Principal (acceso)",
  letra: "A",
  recintoId: "r14",
  recintoCodigo: "B14",
  recintoEtiqueta: "Bodega 14",
  altoM: 6.2,
  anchoM: 18,
  superficieM2: 111.6,
  frecuenciaRevisionMeses: 6,
  notas: "Material del muro, color de pintura, observaciones",
  foto: {
    key: "demo/f14A-foto",
    nombre: "estado-actual.jpg",
    url: svgFachada({ variant: "despues", letrero: "BODETEK 14" }),
  },
  plano: {
    key: "demo/f14A-plano",
    nombre: "plano_B14_fachadaA.pdf",
    url: svgPlanoB14(),
  },
  intervenciones: [],
};

function docsDetalle(
  intId: string,
  items: Array<{
    tipo: IntervencionDetalle["documentos"][number]["tipoDocumento"];
    cat: IntervencionDetalle["documentos"][number]["categoria"];
    neto: number;
    estado: string;
    proveedorId: string | null;
    numero: string | null;
    fecha: string | null;
    nombre: string;
  }>,
): IntervencionDetalle["documentos"] {
  return items.map((d, i) => ({
    id: `${intId}-doc-${i}`,
    tipoDocumento: d.tipo,
    categoria: d.cat,
    proveedorId: d.proveedorId,
    numero: d.numero,
    fecha: d.fecha,
    valorNeto: d.neto,
    archivoKey: `demo/${intId}-${i}.pdf`,
    archivoNombre: d.nombre,
    archivoUrl: "#",
    estado: d.estado,
  }));
}

export const DEMO_INTERVENCIONES_B14: IntervencionDetalle[] = [
  {
    id: I_B14_2026,
    fachadaId: "f14A",
    fachadaNombre: "Bodega 14 · Fachada A",
    estado: "terminada",
    fechaInicio: "2026-09-01",
    fechaTermino: "2026-09-12",
    notas: "Se reparó grieta sobre portón 2 y se selló junta.",
    ejecutadoPor: "proveedor_externo",
    proveedorId: "prov-andes",
    maestrosAsignados: null,
    requiereHojalateria: true,
    sinMateriales: false,
    altoMSnapshot: 6.2,
    anchoMSnapshot: 18,
    superficieM2Snapshot: 111.6,
    tipos: [
      { tipo: "limpieza", dias: 2 },
      { tipo: "reparacion", dias: 3.5 },
      { tipo: "pintura", dias: 3.5 },
    ],
    cotizaciones: [],
    hojalaterias: [
      {
        id: "h-f14A-2026",
        proveedorId: "prov-maipu",
        descripcion: "2 forros de coronación y 1 botaguas sobre portón",
        valorNeto: 245_000,
        valorIva: 0,
        valorBruto: 245_000,
        cotizacionKey: "demo/hoj-cot.pdf",
        cotizacionNombre: "cot-hojalateria.pdf",
        cotizacionUrl: "#",
        facturaKey: "demo/hoj-fac.pdf",
        facturaNombre: "F 3.120",
        facturaUrl: "#",
      },
    ],
    materiales: [
      {
        id: "m-f14A-pintura",
        tipo: "pintura",
        fechaCompra: "2026-09-02",
        proveedorId: "prov-sodimac",
        numeroFactura: "F 88.412",
        material: "Látex exterior · 12 galones",
        valorNeto: 312_000,
        valorIva: 0,
        valorBruto: 312_000,
        facturaKey: "demo/mat-pintura.pdf",
        facturaNombre: "F 88.412",
        facturaUrl: "#",
      },
      {
        id: "m-f14A-otros",
        tipo: "otros",
        fechaCompra: "2026-09-02",
        proveedorId: "prov-sodimac",
        numeroFactura: "F 88.412",
        material: "Rodillos, sellante, hongicida",
        valorNeto: 74_000,
        valorIva: 0,
        valorBruto: 74_000,
        facturaKey: "demo/mat-otros.pdf",
        facturaNombre: "F 88.412",
        facturaUrl: "#",
      },
    ],
    documentos: docsDetalle(I_B14_2026, [
      {
        tipo: "cotizacion",
        cat: "mano_de_obra",
        neto: 1_480_000,
        estado: "aprobada",
        proveedorId: "prov-andes",
        numero: "COT-2291",
        fecha: "2026-08-18",
        nombre: "COT-2291.pdf",
      },
      {
        tipo: "cotizacion",
        cat: "mano_de_obra",
        neto: 1_690_000,
        estado: "no_elegida",
        proveedorId: "prov-sur",
        numero: "0457",
        fecha: "2026-08-20",
        nombre: "0457.pdf",
      },
      {
        tipo: "cotizacion",
        cat: "hojalateria",
        neto: 260_000,
        estado: "aprobada",
        proveedorId: "prov-maipu",
        numero: "C-118",
        fecha: "2026-08-22",
        nombre: "C-118.pdf",
      },
      {
        tipo: "factura",
        cat: "mano_de_obra",
        neto: 1_420_000,
        estado: "pagada",
        proveedorId: "prov-andes",
        numero: "F 10.884",
        fecha: "2026-09-14",
        nombre: "F-10.884.pdf",
      },
      {
        tipo: "factura",
        cat: "materiales",
        neto: 386_000,
        estado: "pagada",
        proveedorId: "prov-sodimac",
        numero: "F 88.412",
        fecha: "2026-09-02",
        nombre: "F-88.412.pdf",
      },
      {
        tipo: "factura",
        cat: "hojalateria",
        neto: 245_000,
        estado: "pagada",
        proveedorId: "prov-maipu",
        numero: "F 3.120",
        fecha: "2026-09-06",
        nombre: "F-3.120.pdf",
      },
    ]),
    media: mediaB14(I_B14_2026, 8, 10),
  },
  {
    id: "i-f14A-2025",
    fachadaId: "f14A",
    fachadaNombre: "Bodega 14 · Fachada A",
    estado: "terminada",
    fechaInicio: "2025-03-10",
    fechaTermino: "2025-03-14",
    notas: null,
    ejecutadoPor: "maestros_bodetek",
    proveedorId: null,
    maestrosAsignados: null,
    requiereHojalateria: false,
    sinMateriales: false,
    altoMSnapshot: 6.2,
    anchoMSnapshot: 18,
    superficieM2Snapshot: 111.6,
    tipos: [
      { tipo: "limpieza", dias: 4 },
      { tipo: "reparacion", dias: 0 },
      { tipo: "pintura", dias: 0 },
    ],
    cotizaciones: [],
    hojalaterias: [],
    materiales: [
      {
        id: "m-f14A-2025",
        tipo: "pintura",
        fechaCompra: "2025-03-10",
        proveedorId: null,
        numeroFactura: null,
        material: "Pintura",
        valorNeto: 53_000,
        valorIva: 0,
        valorBruto: 53_000,
        facturaKey: null,
        facturaNombre: null,
        facturaUrl: null,
      },
    ],
    documentos: docsDetalle("i-f14A-2025", [
      {
        tipo: "factura",
        cat: "mano_de_obra",
        neto: 200_000,
        estado: "pagada",
        proveedorId: null,
        numero: null,
        fecha: "2025-03-14",
        nombre: "mano-2025.pdf",
      },
    ]),
    media: mediaB14("i-f14A-2025", 4, 4),
  },
  {
    id: "i-f14A-2023",
    fachadaId: "f14A",
    fachadaNombre: "Bodega 14 · Fachada A",
    estado: "terminada",
    fechaInicio: "2023-10-02",
    fechaTermino: "2023-10-13",
    notas: null,
    ejecutadoPor: "maestros_bodetek",
    proveedorId: null,
    maestrosAsignados: null,
    requiereHojalateria: true,
    sinMateriales: false,
    altoMSnapshot: 6.2,
    anchoMSnapshot: 18,
    superficieM2Snapshot: 111.6,
    tipos: [
      { tipo: "limpieza", dias: 2.7 },
      { tipo: "reparacion", dias: 5 },
      { tipo: "pintura", dias: 0 },
    ],
    cotizaciones: [],
    hojalaterias: [
      {
        id: "h-f14A-2023",
        proveedorId: "prov-maipu",
        descripcion: null,
        valorNeto: 0,
        valorIva: 0,
        valorBruto: 0,
        cotizacionKey: null,
        cotizacionNombre: null,
        cotizacionUrl: null,
        facturaKey: null,
        facturaNombre: null,
        facturaUrl: null,
      },
    ],
    materiales: [
      {
        id: "m-f14A-2023",
        tipo: "pintura",
        fechaCompra: "2023-10-02",
        proveedorId: null,
        numeroFactura: null,
        material: "Pintura",
        valorNeto: 175_000,
        valorIva: 0,
        valorBruto: 175_000,
        facturaKey: null,
        facturaNombre: null,
        facturaUrl: null,
      },
    ],
    documentos: docsDetalle("i-f14A-2023", [
      {
        tipo: "factura",
        cat: "mano_de_obra",
        neto: 720_000,
        estado: "pagada",
        proveedorId: null,
        numero: null,
        fecha: "2023-10-13",
        nombre: "mano-2023.pdf",
      },
    ]),
    media: mediaB14("i-f14A-2023", 6, 5),
  },
];

export const DEMO_INTERVENCION_NUEVA: IntervencionDetalle = {
  ...DEMO_INTERVENCIONES_B14[0],
  id: "i-demo-nueva",
  media: [],
};

export const DEMO_CONTEOS_BORRAR: ConteosBorrarFachada = {
  intervenciones: 3,
  cotizaciones: 3,
  fotos: 18,
};

export const DEMO_SIDEBAR = [
  {
    id: "cat-techumbres",
    nombre: "Techumbres y canales",
    subtipos: [],
  },
  {
    id: "cat-imagen",
    nombre: "Imagen",
    subtipos: [
      { id: "sub-fachadas", nombre: "Fachadas" },
      { id: "sub-letreros", nombre: "Letreros de locales" },
      { id: "sub-portico", nombre: "Pórtico de entrada" },
    ],
  },
  { id: "cat-patentes", nombre: "Patentes", subtipos: [] },
  { id: "cat-protocolos", nombre: "Protocolos", subtipos: [] },
  { id: "cat-seguridad", nombre: "Seguridad", subtipos: [] },
  { id: "cat-otros", nombre: "Otros", subtipos: [] },
];
