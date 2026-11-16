import type { Access, CollectionConfig, FieldAccess } from 'payload'

const isSelf: Access = ({ req }) => {
  const user = req.user

  if (!user || user.collection !== 'users') {
    return false
  }

  return {
    id: {
      equals: user.id,
    },
  }
}

const canReadUsers: Access = ({ req }) => {
  const user = req.user

  if (!user) return false

  if (user.collection === 'admins') return true

  if (user.collection === 'users') {
    return {
      id: {
        equals: user.id,
      },
    }
  }

  return false
}

// Impact totals should only be changed by trusted server-side
// calculations or administrators, not directly by user requests.

const isAdmin: FieldAccess = ({ req }) =>
  req.user?.collection === 'admins'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,

  access: {
    create: () => true,
    read: canReadUsers,
    update: isSelf,
    delete: () => false,
  },

  admin: {
    useAsTitle: 'email',
    defaultColumns: [
      'name',
      'email',
      'dietType',
      'createdAt',
    ],
  },

  fields: [
    // BASIC PROFILE
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'wantsMealPlan',
      type: 'checkbox',
      label: 'Wants the seven-day meal plan',
      defaultValue: false,
    },

    // CURRENT HABITS
    {
      name: 'dietType',
      type: 'select',
      label: 'Current dietary pattern',
      options: [
        { label: 'Vegan', value: 'vegan' },
        { label: 'Vegetarian', value: 'vegetarian' },
        { label: 'Pescatarian', value: 'pescatarian' },
        { label: 'Omnivore', value: 'omnivore' },
        { label: 'Other', value: 'other' },
        { label: 'Not sure', value: 'not_sure' },
      ],
    },
    {
      name: 'plantBasedGoalDaysPerWeek',
      type: 'number',
      label: 'Plant-based goal (days per week)',
      min: 0,
      max: 7,
    },
    {
      name: 'activeSwaps',
      type: 'json',
      label: 'Currently selected swaps',
    },
    {
      name: 'quizResponses',
      type: 'json',
      label: 'Sustainability quiz responses',
    },

    // CUMULATIVE IMPACT
    {
      name: 'cumulativeImpact',
      type: 'group',
      label: 'Cumulative Impact',
      access: {
        update: isAdmin,
      },
      fields: [
        {
          name: 'co2eSaved',
          type: 'number',
          label: 'CO₂e saved (kg)',
          defaultValue: 0,
        },
        {
          name: 'waterSaved',
          type: 'number',
          label: 'Water saved (liters)',
          defaultValue: 0,
        },
        {
          name: 'landSaved',
          type: 'number',
          label: 'Land use avoided (m²)',
          defaultValue: 0,
        },
        {
          name: 'animalsSpared',
          type: 'number',
          label: 'Estimated animals spared',
          defaultValue: 0,
        },
        {
          name: 'plantBasedDays',
          type: 'number',
          label: 'Cumulative plant-based days',
          defaultValue: 0,
        },
      ],
    },

    // PROJECTED IMPACT
    {
      name: 'projectedImpact',
      type: 'group',
      label: 'Projected Annual Impact',
      access: {
        update: isAdmin,
      },
      fields: [
        {
          name: 'co2eSaved',
          type: 'number',
          label: 'Projected annual CO₂e savings (kg)',
          defaultValue: 0,
        },
        {
          name: 'waterSaved',
          type: 'number',
          label: 'Projected annual water savings (liters)',
          defaultValue: 0,
        },
        {
          name: 'landSaved',
          type: 'number',
          label: 'Projected annual land savings (m²)',
          defaultValue: 0,
        },
        {
          name: 'animalsSpared',
          type: 'number',
          label: 'Projected annual animals spared',
          defaultValue: 0,
        },
      ],
    },

    // TRACKING
    {
      name: 'currentStreak',
      type: 'number',
      label: 'Current plant-based goal streak',
      defaultValue: 0,
      access: {
        update: isAdmin,
      },
    },
    {
      name: 'lastImpactUpdate',
      type: 'date',
      label: 'Last impact calculation',
      access: {
        update: isAdmin,
      },
    },
    {
      name: 'calculationVersion',
      type: 'text',
      label: 'Impact calculation version',
      access: {
        update: isAdmin,
      },
    },
  ],
}
