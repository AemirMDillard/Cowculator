import type { Access, CollectionConfig, FieldAccess } from 'payload'
import { randomBytes } from 'node:crypto'
import { isRecord } from '@/lib/guards'
import { isUsernameTaken } from '@/lib/usernames'

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

const isAdmin: FieldAccess = ({ req }) => req.user?.collection === 'admins'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,

  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (typeof data.name === 'string') {
          data.name = data.name.trim()
        }

        const name = typeof data.name === 'string' ? data.name : originalDoc?.name
        const nameChanged = operation === 'create' || data.name !== undefined

        if (nameChanged && typeof name === 'string') {
          if (name.length < 2 || name.length > 32) {
            throw new Error('Username must be between 2 and 32 characters.')
          }

          if (await isUsernameTaken(req.payload, name, originalDoc?.id)) {
            throw new Error('That username is already taken.')
          }
        }

        if (operation !== 'create') return data

        data.referralCode = randomBytes(12).toString('hex')
        let answers = isRecord(data.quizResponses) ? data.quizResponses : {}
        const isVeganAtSignup =
          data.dietType === 'vegan' || answers.dietPattern === 'Fully plant-based (vegan)'

        if (isVeganAtSignup) {
          data.dietType = 'vegan'
          answers = { ...answers, dietPattern: 'Fully plant-based (vegan)' }
          data.quizResponses = answers
        }

        const referralCodeUsed =
          typeof data.referralCodeUsed === 'string'
            ? data.referralCodeUsed.trim().toLowerCase()
            : ''

        if (!referralCodeUsed) {
          data.referralCodeUsed = null
          return data
        }

        const referrals = await req.payload.find({
          collection: 'users',
          where: { referralCode: { equals: referralCodeUsed } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        const referrer = referrals.docs[0]

        if (!referrer) {
          throw new Error('That friend invite link is invalid or expired.')
        }

        const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''

        if (referrer.email.trim().toLowerCase() === email) {
          throw new Error('You cannot use your own friend invite link.')
        }

        data.referralCodeUsed = referralCodeUsed
        // Snapshot signup status so later quiz changes don't rewrite referral credit.
        const metadata = isRecord(answers.__cowculator) ? answers.__cowculator : {}
        data.quizResponses = {
          ...answers,
          __cowculator: {
            ...metadata,
            veganReferralAtSignup: isVeganAtSignup,
          },
        }
        return data
      },
    ],
  },

  access: {
    create: () => true,
    read: canReadUsers,
    update: isSelf,
    delete: () => false,
  },

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'dietType', 'createdAt'],
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
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      index: true,
      access: {
        update: () => false,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'referralCodeUsed',
      type: 'text',
      index: true,
      access: {
        read: ({ req }) => req.user?.collection === 'admins',
        update: () => false,
      },
      admin: {
        hidden: true,
      },
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
      name: 'lastStreakWeek',
      type: 'text',
      label: 'Last week credited to streak',
      access: {
        update: isAdmin,
      },
    },
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
