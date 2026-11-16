
import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) =>
  req.user?.collection === 'admins'

export const Foods: CollectionConfig = {
  slug: 'foods',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'foodOrigin', 'foodCategory', 'isActive'],
  },

  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },

  fields: [
    // Basic information
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'foodOrigin',
      type: 'select',
      required: true,
      options: [
        { label: 'Animal-based', value: 'animal' },
        { label: 'Plant-based', value: 'plant' },
        { label: 'Fungi', value: 'fungi' },
        { label: 'Algae', value: 'algae' },
      ],
    },
    {
      name: 'foodCategory',
      type: 'select',
      required: true,
      options: [
        { label: 'Meat', value: 'meat' },
        { label: 'Poultry', value: 'poultry' },
        { label: 'Fish', value: 'fish' },
        { label: 'Seafood', value: 'seafood' },
        { label: 'Dairy', value: 'dairy' },
        { label: 'Eggs', value: 'eggs' },
        { label: 'Legumes', value: 'legumes' },
        { label: 'Soy products', value: 'soy' },
        { label: 'Grains', value: 'grains' },
        { label: 'Nuts and seeds', value: 'nuts_seeds' },
        { label: 'Fruits', value: 'fruits' },
        { label: 'Vegetables', value: 'vegetables' },
        { label: 'Fungi', value: 'fungi' },
        { label: 'Algae', value: 'algae' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'animalProductCategory',
      type: 'select',
      options: [
        { label: 'Beef', value: 'beef' },
        { label: 'Pork', value: 'pork' },
        { label: 'Poultry', value: 'poultry' },
        { label: 'Fish', value: 'fish' },
        { label: 'Seafood', value: 'seafood' },
        { label: 'Dairy', value: 'dairy' },
        { label: 'Eggs', value: 'eggs' },
        { label: 'Other animal product', value: 'other' },
      ],
      admin: {
        condition: (data) => data?.foodOrigin === 'animal',
      },
    },

    // Standard serving information
    {
      name: 'servingSize',
      type: 'number',
      defaultValue: 100,
      min: 0,
      label: 'Standard serving amount',
    },
    {
      name: 'servingUnit',
      type: 'select',
      defaultValue: 'g',
      options: [
        { label: 'Grams', value: 'g' },
        { label: 'Milliliters', value: 'ml' },
        { label: 'Pieces', value: 'pieces' },
        { label: 'Tablespoons', value: 'tbsp' },
        { label: 'Cups', value: 'cups' },
      ],
    },

    // Nutrition: values standardized per 100g
    {
      name: 'nutritionPer100g',
      type: 'group',
      label: 'Nutritional Information (per 100g)',
      fields: [
        {
          name: 'proteinG',
          type: 'number',
          min: 0,
          label: 'Protein (g)',
        },
        {
          name: 'vitaminB12Mcg',
          type: 'number',
          min: 0,
          label: 'Vitamin B12 (mcg)',
        },
        {
          name: 'ironMg',
          type: 'number',
          min: 0,
          label: 'Iron (mg)',
        },
        {
          name: 'calciumMg',
          type: 'number',
          min: 0,
          label: 'Calcium (mg)',
        },
        {
          name: 'omega3G',
          type: 'number',
          min: 0,
          label: 'Omega-3 (g)',
        },
        {
          name: 'zincMg',
          type: 'number',
          min: 0,
          label: 'Zinc (mg)',
        },
        {
          name: 'iodineMcg',
          type: 'number',
          min: 0,
          label: 'Iodine (mcg)',
        },
        {
          name: 'fiberG',
          type: 'number',
          min: 0,
          label: 'Fiber (g)',
        },
      ],
    },

    // Sensory characteristics
    {
      name: 'textures',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Smooth', value: 'smooth' },
        { label: 'Creamy', value: 'creamy' },
        { label: 'Soft', value: 'soft' },
        { label: 'Firm', value: 'firm' },
        { label: 'Chewy', value: 'chewy' },
        { label: 'Crunchy', value: 'crunchy' },
        { label: 'Crispy', value: 'crispy' },
        { label: 'Fibrous', value: 'fibrous' },
        { label: 'Grainy', value: 'grainy' },
        { label: 'Liquid', value: 'liquid' },
      ],
    },
    {
      name: 'textureConsistency',
      type: 'select',
      options: [
        { label: 'Consistent', value: 'consistent' },
        { label: 'Mixed', value: 'mixed' },
        { label: 'Variable', value: 'variable' },
      ],
    },
    {
      name: 'tasteProfiles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Sweet', value: 'sweet' },
        { label: 'Savory', value: 'savory' },
        { label: 'Bitter', value: 'bitter' },
        { label: 'Sour', value: 'sour' },
        { label: 'Umami', value: 'umami' },
        { label: 'Neutral', value: 'neutral' },
      ],
    },
    {
      name: 'smellIntensity',
      type: 'select',
      options: [
        { label: 'Mild', value: 'mild' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Strong', value: 'strong' },
      ],
    },
    {
      name: 'appearanceCharacteristics',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Uniform', value: 'uniform' },
        { label: 'Mixed', value: 'mixed' },
        { label: 'Chunky', value: 'chunky' },
        { label: 'Visibly textured', value: 'textured' },
      ],
    },
    {
      name: 'temperatureOptions',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Hot', value: 'hot' },
        { label: 'Cold', value: 'cold' },
        { label: 'Room temperature', value: 'room_temperature' },
      ],
    },
    {
      name: 'sensoryConsiderations',
      type: 'textarea',
      label: 'Additional sensory notes',
    },

    // Accessibility and dietary considerations
    {
      name: 'allergens',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Soy', value: 'soy' },
        { label: 'Wheat / Gluten', value: 'wheat_gluten' },
        { label: 'Peanuts', value: 'peanuts' },
        { label: 'Tree nuts', value: 'tree_nuts' },
        { label: 'Sesame', value: 'sesame' },
        { label: 'Milk', value: 'milk' },
        { label: 'Eggs', value: 'eggs' },
        { label: 'Fish', value: 'fish' },
        { label: 'Shellfish', value: 'shellfish' },
      ],
    },
    {
      name: 'digestiveConsiderations',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'High fiber', value: 'high_fiber' },
        { label: 'Contains lactose', value: 'lactose' },
        { label: 'Contains common FODMAPs', value: 'fodmaps' },
        { label: 'May cause digestive discomfort for some', value: 'potential_discomfort' },
      ],
    },
    {
      name: 'nutritionalCautions',
      type: 'textarea',
      label: 'Nutritional considerations',
    },
    {
      name: 'preparationComplexity',
      type: 'select',
      options: [
        { label: 'Minimal preparation', value: 'minimal' },
        { label: 'Moderate preparation', value: 'moderate' },
        { label: 'Involved preparation', value: 'involved' },
      ],
    },
    {
      name: 'availability',
      type: 'select',
      options: [
        { label: 'Common grocery item', value: 'common' },
        { label: 'Specialty grocery item', value: 'specialty' },
        { label: 'Difficult to find', value: 'difficult' },
      ],
    },

    // Cost
    {
      name: 'estimatedCostPerServing',
      type: 'number',
      min: 0,
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'USD',
      options: [
        { label: 'USD', value: 'USD' },
      ],
    },
    {
      name: 'costRegion',
      type: 'text',
    },
    {
      name: 'costLastUpdated',
      type: 'date',
    },

    // Research references
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
