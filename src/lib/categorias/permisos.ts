/** Igual que las políticas de la base: solo admin y Pablo editan el menú. */
export function puedeEditarMenu(rol: string | null | undefined): boolean {
  return rol === "admin" || rol === "pablo";
}
