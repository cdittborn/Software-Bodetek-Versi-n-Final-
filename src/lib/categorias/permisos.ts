/** El lápiz del menú es solo del Gerente General. */
export function puedeEditarMenu(rol: string | null | undefined): boolean {
  return rol === "admin";
}
