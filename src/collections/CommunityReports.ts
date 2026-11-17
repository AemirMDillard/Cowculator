import type { FieldAccess, CollectionConfig } from 'payload'
import { communityAdminAccess } from './community-access'

const isAdmin: FieldAccess = ({ req }) => req.user?.collection === 'admins'

export const CommunityReports: CollectionConfig = {
  slug: 'community-reports',
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['reason', 'status', 'reporter', 'createdAt'],
    description: 'Member reports for moderator review.',
  },
  access: {
    read: communityAdminAccess,
    create: communityAdminAccess,
    update: communityAdminAccess,
    delete: communityAdminAccess,
  },
  fields: [
    {
      name: 'reporter',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'community-posts',
      index: true,
    },
    {
      name: 'comment',
      type: 'relationship',
      relationTo: 'community-comments',
      index: true,
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: [
        { label: 'Harassment or bullying', value: 'harassment' },
        { label: 'Hate or discrimination', value: 'hate' },
        { label: 'Personal or unsafe information', value: 'personal-information' },
        { label: 'Spam or advertising', value: 'spam' },
        { label: 'Other concern', value: 'other' },
      ],
    },
    {
      name: 'details',
      type: 'textarea',
      maxLength: 500,
    },
    {
      name: 'reportKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      required: true,
      index: true,
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Under review', value: 'under-review' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Dismissed', value: 'dismissed' },
      ],
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      access: {
        read: isAdmin,
        update: isAdmin,
      },
    },
  ],
}
