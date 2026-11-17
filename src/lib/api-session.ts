import { getPayload } from 'payload'
import config from '@payload-config'

export async function getPayloadSession(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  // Admin accounts are intentionally excluded from user-facing application sessions.
  return { payload, user: user?.collection === 'users' ? user : null }
}

export async function getUserSession(request: Request) {
  const session = await getPayloadSession(request)
  if (!session.user) return null
  return { payload: session.payload, user: session.user }
}
