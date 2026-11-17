import type { Access } from 'payload'

export const communityAdminAccess: Access = ({ req }) => req.user?.collection === 'admins'
