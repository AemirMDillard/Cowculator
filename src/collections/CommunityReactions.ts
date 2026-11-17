import type { CollectionConfig } from 'payload'
import { communityAdminAccess } from './community-access'

export const CommunityReactions: CollectionConfig = {
  slug: 'community-reactions',
  admin: {
    useAsTitle: 'reaction',
    defaultColumns: ['post', 'author', 'reaction', 'createdAt'],
  },
  access: {
    read: communityAdminAccess,
    create: communityAdminAccess,
    update: communityAdminAccess,
    delete: communityAdminAccess,
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'community-posts',
      required: true,
      index: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'reaction',
      type: 'select',
      required: true,
      options: [
        { label: 'Support', value: 'support' },
        { label: 'Heart', value: 'heart' },
        { label: 'Leaf', value: 'leaf' },
      ],
    },
    {
      name: 'reactionKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
