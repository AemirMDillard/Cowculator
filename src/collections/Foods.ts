import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'

export const Foods: CollectionConfig = {
  slug: 'foods',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'foodOrigin', 'swapCategory', 'isActive'],
  },

  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },

  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },

    {
      name: 'foodOrigin',
      type: 'select',
      required: true,
      options: ['animal', 'plant', 'fungi', 'algae'],
    },
    {
      name: 'verificationStatus',
      type: 'select',
      required: true,
      options: ['verified', 'suggestion'],
    },
    {
      name: 'swapCategory',
      type: 'select',
      required: true,
      options: ['beef', 'poultry', 'fish', 'pork', 'seafood', 'dairy', 'eggs', 'other'],
    },
    {
      name: 'foodCategory',
      type: 'select',
      options: [
        'meat', 'poultry', 'fish', 'seafood', 'dairy', 'eggs',
        'legumes', 'soy', 'grains', 'nuts_seeds', 'fruits',
        'vegetables', 'fungi', 'algae', 'other',
      ],
    },
    {
      name: 'animalProductCategory',
      type: 'select',
      options: ['beef', 'pork', 'poultry', 'fish', 'seafood', 'dairy', 'eggs', 'other'],
    },
    {
      name: 'textureTags',
      type: 'select',
      hasMany: true,
      options: ['smooth', 'creamy', 'soft', 'firm', 'chewy', 'crunchy', 'crispy', 'fibrous', 'grainy', 'liquid', 'tender', 'flaky', 'springy', 'custardy', 'crumbly', 'moist', 'dense', 'meaty', 'juicy', 'crisp', 'silky', 'thick', 'spreadable', 'powdery', 'gel-like', 'foamy', 'oily'],
    },
    {
      name: 'tasteProfiles',
      type: 'select',
      hasMany: true,
      options: [
      'sweet', 'savory', 'bitter', 'sour', 'umami', 'neutral',
      'mild', 'earthy', 'smoky', 'briny', 'tangy', 'nutty',
      'rich', 'creamy', 'herbal', 'salty', 'bean-like', 'cheesy',
      'buttery', 'coconut',
    ],
    },
    { name: 'servingSize', type: 'number' },
    {
      name: 'servingUnit',
      type: 'select',
      options: ['g', 'ml', 'pieces', 'tbsp', 'cups'],
    },

    {
      name: 'nutrition',
      type: 'group',
      fields: [
        { name: 'calories', type: 'number' },
        { name: 'proteinG', type: 'number' },
        { name: 'fiberG', type: 'number' },
        { name: 'ironMg', type: 'number' },
        { name: 'calciumMg', type: 'number' },
        { name: 'vitaminB12Mcg', type: 'number' },
        { name: 'omega3G', type: 'number' },
        { name: 'zincMg', type: 'number' },
        { name: 'iodineMcg', type: 'number' },
      ],
    },
    {
      name: 'environmentalImpact',
      type: 'group',
      fields: [
        { name: 'co2eKg', type: 'number' },
        { name: 'waterLiters', type: 'number' },
        { name: 'landM2', type: 'number' },
        { name: 'animalsPer100g', type: 'number' },
        { name: 'impactScorePer100g', type: 'number' },
      ],
    },
    {
      name: 'pricing',
      type: 'group',
      fields: [
        { name: 'avgCostPer100g', type: 'number' },
        { name: 'costPer20gProtein', type: 'number' },
        {
          name: 'priceTier',
          type: 'select',
          options: ['low', 'mid', 'high'],
        },
      ],
    },
    {
      name: 'sources',
      type: 'relationship',
      relationTo: 'sources',
      hasMany: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
