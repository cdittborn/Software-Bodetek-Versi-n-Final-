"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logErrorFachadas } from "@/lib/fachadas/log";

export class SeccionErrorBoundary extends Component<
  { children: ReactNode; titulo?: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logErrorFachadas(this.props.titulo ?? "sección", {
      error,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
          <p className="font-medium">
            {this.props.titulo ?? "No se pudo mostrar esta sección."}
          </p>
          <p className="mt-1">{this.state.error.message || "Error inesperado."}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
