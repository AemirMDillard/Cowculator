
import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) =>
  req.user?.collection === 'admins'

export const Leaderboard: CollectionConfig = {
  slug: 'leaderboard',

  admin: {
    useAsTitle: 'displayName',
    defaultColumns: [
      'displayName',
      'month',
      'year',
      'combinedScore',
    ],
  },

  access: {
    read: ({ req }) => Boolean(req.user),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'month',
      type: 'number',
      required: true,
      min: 1,
      max: 12,
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'animalImpactScore',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'environmentalScore',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'plantBasedScore',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'optimizationPoints',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'referralPoints',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'combinedScore',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'lastUpdated',
      type: 'date',
    },
  ],
}
