
import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) =>
  req.user?.collection === 'admins'

export const ImpactFactors: CollectionConfig = {
  slug: 'impact-factors',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'food', 'calculationVersion', 'isActive'],
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
      name: 'food',
      type: 'relationship',
      relationTo: 'foods',
      required: true,
    },
    {
      name: 'basisAmount',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 0,
      label: 'Reference quantity',
    },
    {
      name: 'basisUnit',
      type: 'select',
      required: true,
      defaultValue: 'kg',
      options: [
        { label: 'Kilograms', value: 'kg' },
        { label: 'Grams', value: 'g' },
        { label: 'Liters', value: 'liters' },
      ],
    },
    {
      name: 'environmentalImpact',
      type: 'group',
      fields: [
        {
          name: 'co2eKg',
          type: 'number',
          min: 0,
          label: 'CO₂e (kg)',
        },
        {
          name: 'waterLiters',
          type: 'number',
          min: 0,
          label: 'Water use (liters)',
        },
        {
          name: 'landM2',
          type: 'number',
          min: 0,
          label: 'Land use (m²)',
        },
      ],
    },
    {
      name: 'animalImpact',
      type: 'group',
      fields: [
        {
          name: 'estimatedAnimalsPerUnit',
          type: 'number',
          min: 0,
          label: 'Estimated animal impact per reference quantity',
        },
        {
          name: 'methodology',
          type: 'textarea',
          label: 'Animal-impact calculation methodology',
        },
      ],
    },
    {
      name: 'sources',
      type: 'relationship',
      relationTo: 'sources',
      hasMany: true,
      required: true,
    },
    {
      name: 'calculationVersion',
      type: 'text',
      required: true,
      defaultValue: '1.0',
    },
    {
      name: 'effectiveFrom',
      type: 'date',
    },
    {
      name: 'effectiveUntil',
      type: 'date',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
