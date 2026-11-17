// Payload relationships can be returned as either raw IDs or populated records.
export function getRelationId(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}
