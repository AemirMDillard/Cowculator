import type { Access, CollectionConfig } from 'payload'

const isSelf: Access = ({ req }) => {
  const user = req.user

  if (!user || user.collection !== 'users') {
    return false
  }

  return {
    id: {
      equals: user.id,
    },
  }
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    create: () => true,
    read: isSelf,
    update: isSelf,
    delete: () => false,
  },
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}
