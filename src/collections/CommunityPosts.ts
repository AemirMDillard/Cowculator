import type { CollectionConfig } from 'payload'
import { communityAdminAccess } from './community-access'
import { COMMUNITY_POST_MAX_LENGTH, normalizeCommunityText } from '@/lib/community'

export const CommunityPosts: CollectionConfig = {
  slug: 'community-posts',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['author', 'status', 'createdAt'],
    description: 'Text-only posts shared with signed-in Cowculator members.',
  },
  access: {
    read: communityAdminAccess,
    create: communityAdminAccess,
    update: communityAdminAccess,
    delete: communityAdminAccess,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.status === 'deleted') {
          data.content = ''
          return data
        }
        if (typeof data.content === 'string') {
          const content = normalizeCommunityText(data.content, COMMUNITY_POST_MAX_LENGTH)
          if (!content)
            throw new Error('Posts must contain text and stay within the character limit.')
          data.content = content
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: COMMUNITY_POST_MAX_LENGTH,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      required: true,
      index: true,
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Hidden by moderator', value: 'hidden' },
        { label: 'Deleted by author', value: 'deleted' },
      ],
    },
  ],
}
