import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) =>
  req.user?.collection === 'admins'

export const SwapSuggestions: CollectionConfig = {
  slug: 'swap-suggestions',

  admin: {
    useAsTitle: 'suggestedAlternative',
    defaultColumns: [
      'suggestedAlternative',
      'status',
      'createdAt',
    ],
  },

  access: {
    read: ({ req }) => isAdmin({ req } as never),
    create: () => true,
    update: isAdmin,
    delete: isAdmin,
  },

  fields: [
    {
      name: 'foodBeingReplaced',
      type: 'relationship',
      relationTo: 'foods',
      required: true,
    },
    {
      name: 'suggestedAlternative',
      type: 'text',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: {
        update: isAdmin,
      },
    },
  ],
}