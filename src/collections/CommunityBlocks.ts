import type { CollectionConfig } from 'payload'
import { communityAdminAccess } from './community-access'

export const CommunityBlocks: CollectionConfig = {
  slug: 'community-blocks',
  admin: {
    useAsTitle: 'blockKey',
    defaultColumns: ['blocker', 'blocked', 'createdAt'],
  },
  access: {
    read: communityAdminAccess,
    create: communityAdminAccess,
    update: communityAdminAccess,
    delete: communityAdminAccess,
  },
  fields: [
    {
      name: 'blocker',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'blocked',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'blockKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
