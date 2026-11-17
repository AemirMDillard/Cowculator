import type { Payload } from 'payload'

export async function isUsernameTaken(
  payload: Payload,
  name: string,
  exceptUserId?: number | string,
) {
  const result = await payload.find({
    collection: 'users',
    where: exceptUserId
      ? {
          and: [{ name: { equals: name } }, { id: { not_equals: exceptUserId } }],
        }
      : { name: { equals: name } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs.length > 0
}
