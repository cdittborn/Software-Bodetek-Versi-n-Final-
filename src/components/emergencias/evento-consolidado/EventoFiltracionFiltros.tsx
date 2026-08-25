"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventoFiltracionPanelFiltros } from "@/components/emergencias/evento-consolidado/EventoFiltracionPanelFiltros";
import { TokenFiltroCampo } from "@/components/emergencias/evento-consolidado/ui/TokenFiltroCampo";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  reemplazarTokenCampo,
  tokenKey,
  type FiltroCampoToken,
} from "@/lib/filtracion/filtrosCampoEvento";

type EventoFiltracionFiltrosProps = {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  tokens: FiltroCampoToken[];
  onTokensChange: (tokens: FiltroCampoToken[]) => void;
  proyectos: ProyectoFiltracionEnriquecido[];
  visibles: number;
  total: number;
  panelAbierto: boolean;
  onPanelOpenChange: (open: boolean) => void;
};

export function EventoFiltracionFiltros({
  busqueda,
  onBusquedaChange,
  tokens,
  onTokensChange,
  proyectos,
  visibles,
  total,
  panelAbierto,
  onPanelOpenChange,
}: EventoFiltracionFiltrosProps) {
  function agregarToken(token: FiltroCampoToken) {
    onTokensChange(reemplazarTokenCampo(tokens, token));
  }

  function quitarToken(token: FiltroCampoToken) {
    onTokensChange(
      tokens.filter((t) => !(t.campo === token.campo && t.valor === token.valor)),
    );
  }

  function limpiarTokens() {
    onTokensChange([]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar recinto, arrendatario o N° de cotización"
            className="h-11 min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-[44px] shrink-0 gap-1.5"
            onClick={() => onPanelOpenChange(true)}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Añadir filtro</span>
            <span className="sm:hidden">+ Filtro</span>
          </Button>
        </div>
        <p className="shrink-0 text-sm text-muted-foreground lg:text-right">
          {visibles} de {total} mostrados
        </p>
      </div>

      {tokens.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {tokens.map((t) => (
            <TokenFiltroCampo
              key={tokenKey(t)}
              token={t}
              onRemove={() => quitarToken(t)}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-muted-foreground"
            onClick={limpiarTokens}
          >
            Limpiar todo
          </Button>
        </div>
      ) : null}

      <EventoFiltracionPanelFiltros
        open={panelAbierto}
        onOpenChange={onPanelOpenChange}
        proyectos={proyectos}
        tokens={tokens}
        onSeleccionar={agregarToken}
      />
    </div>
  );
}
