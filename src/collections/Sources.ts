
import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) =>
  req.user?.collection === 'admins'

export const Sources: CollectionConfig = {
  slug: 'sources',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sourceType', 'publicationYear'],
  },

  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'authors',
      type: 'text',
    },
    {
      name: 'publisher',
      type: 'text',
    },
    {
      name: 'publicationYear',
      type: 'number',
    },
    {
      name: 'sourceType',
      type: 'select',
      required: true,
      options: [
        { label: 'Scientific research paper', value: 'research_paper' },
        { label: 'Government dataset', value: 'government_dataset' },
        { label: 'Nutrition database', value: 'nutrition_database' },
        { label: 'Research report', value: 'research_report' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      label: 'Source URL',
    },
    {
      name: 'doi',
      type: 'text',
    },
    {
      name: 'evidenceLevel',
      type: 'select',
      options: [
        { label: 'Systematic review or meta-analysis', value: 'systematic_review' },
        { label: 'Peer-reviewed research', value: 'peer_reviewed' },
        { label: 'Government or institutional data', value: 'institutional' },
        { label: 'Other / not assessed', value: 'other' },
      ],
    },
    {
      name: 'publicationDate',
      type: 'date',
    },
    {
      name: 'accessedAt',
      type: 'date',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'What information does Cowculator use from this source?',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
