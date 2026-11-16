
import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) =>
  req.user?.collection === 'admins'

export const Swaps: CollectionConfig = {
  slug: 'swaps',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'swapCategory', 'isActive'],
  },

  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'replaces',
      type: 'relationship',
      relationTo: 'foods',
      hasMany: true,
      required: true,
      label: 'Animal-based foods being replaced',
    },
    {
      name: 'alternativeFoods',
      type: 'relationship',
      relationTo: 'foods',
      hasMany: true,
      required: true,
      label: 'Plant-based alternatives',
    },
    {
      name: 'swapCategory',
      type: 'select',
      required: true,
      options: [
        { label: 'Protein', value: 'protein' },
        { label: 'Dairy alternatives', value: 'dairy' },
        { label: 'Egg alternatives', value: 'eggs' },
        { label: 'Fish and seafood alternatives', value: 'seafood' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'nutrientBenefits',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Protein', value: 'protein' },
        { label: 'Vitamin B12', value: 'b12' },
        { label: 'Iron', value: 'iron' },
        { label: 'Calcium', value: 'calcium' },
        { label: 'Omega-3', value: 'omega3' },
        { label: 'Zinc', value: 'zinc' },
        { label: 'Iodine', value: 'iodine' },
        { label: 'Fiber', value: 'fiber' },
      ],
    },
    {
      name: 'nutritionalNotes',
      type: 'textarea',
    },
    {
      name: 'sensoryMatchNotes',
      type: 'textarea',
      label: 'Sensory and texture considerations',
    },
    {
      name: 'recommendationNotes',
      type: 'textarea',
    },
    {
      name: 'sources',
      type: 'relationship',
      relationTo: 'sources',
      hasMany: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
