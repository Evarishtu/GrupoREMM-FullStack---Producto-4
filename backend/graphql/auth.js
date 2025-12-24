export function requireAuth(context) {
  if (!context.user) {
    throw new Error("No autenticado");
  }
}

export function requireRole(context, role) {
  if (!context.user || context.user.role !== role) {
    throw new Error("No autorizado");
  }
}
