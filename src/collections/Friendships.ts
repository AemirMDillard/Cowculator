import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'

export const Friendships: CollectionConfig = {
  slug: 'friendships',
  admin: {
    useAsTitle: 'status',
    defaultColumns: ['requester', 'recipient', 'status', 'updatedAt'],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'requester',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Declined', value: 'declined' },
      ],
      index: true,
    },
  ],
}
