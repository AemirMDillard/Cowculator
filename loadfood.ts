import 'dotenv/config'
import { getPayload } from 'payload'
import config from './src/payload.config'

type FoodOrigin = 'animal' | 'plant' | 'fungi' | 'algae';
type SwapCategory =
  | 'beef'
  | 'pork'
  | 'poultry'
  | 'fish'
  | 'seafood'
  | 'dairy'
  | 'eggs'
  | 'other';

type FoodCategory =
  | 'meat'
  | 'poultry'
  | 'fish'
  | 'seafood'
  | 'dairy'
  | 'eggs'
  | 'legumes'
  | 'soy'
  | 'grains'
  | 'nuts_seeds'
  | 'fruits'
  | 'vegetables'
  | 'fungi'
  | 'algae'
  | 'other';

type AnimalCategory =
  | 'beef'
  | 'pork'
  | 'poultry'
  | 'fish'
  | 'seafood'
  | 'dairy'
  | 'eggs'
  | 'other';

type Food = {
  name: string;
  description: string;
  image: null;
  foodOrigin: FoodOrigin;
  verificationStatus: 'verified' | 'suggestion';
  swapCategory: SwapCategory;
  foodCategory: FoodCategory;
  animalProductCategory: AnimalCategory | null;
  textureTags: string[];
  tasteProfiles: string[];
  servingSize: number;
  servingUnit: string;
  nutrition: {
    calories: number;
    proteinG: number;
    fiberG: number;
    ironMg: number;
    calciumMg: number;
    vitaminB12Mcg: number;
    omega3G: number;
    zincMg: number;
    iodineMcg: number;
  };
  environmentalImpact: {
    co2eKg: number;
    waterLiters: number;
    landM2: number;
    animalsPer100g: number;
    impactScorePer100g: number;
  };
  pricing: {
    avgCostPer100g: number;
    costPer20gProtein: number | null;
    priceTier: 'low' | 'mid' | 'high';
  };
  sources: string[];
  isActive: boolean;
  sourceReferences: string[];
};

const USDA = 'https://fdc.nal.usda.gov/';
const ENVIRONMENT =
  'https://ourworldindata.org/explorers/food-footprints';

const sourceReferences = {
  nutrition: USDA,
  environmentalImpact: ENVIRONMENT,
  pricing: 'https://www.ers.usda.gov/data-products/',
};

const profiles = {
  beef: [250, 26, 0, 2.6, 18, 0.01],
  pork: [242, 27, 0, 0.9, 19, 0.02],
  poultry: [165, 31, 0, 1.3, 15, 0.02],
  fish: [208, 20, 0, 0.5, 12, 2.3],
  seafood: [99, 24, 0, 0.5, 70, 0.3],
  dairy: [61, 3.2, 0, 0.03, 113, 0.08],
  eggs: [143, 13, 0, 1.8, 56, 0.07],

  seitan: [140, 25, 1.5, 2.5, 30, 0.05],
  soy: [145, 16, 2, 2.7, 220, 0.4],
  legumes: [150, 9, 7, 2.5, 45, 0.1],
  mushrooms: [90, 5, 2.5, 1.2, 15, 0.05],
  jackfruit: [95, 1.7, 1.5, 0.6, 35, 0.05],
  vegetables: [70, 1.5, 2.5, 0.8, 25, 0.1],
  carrot: [45, 1, 3, 0.4, 30, 0.05],
  seaweed: [45, 4, 3, 3, 100, 0.2],
  konjac: [20, 0.5, 3, 0.2, 20, 0.02],
  nuts: [500, 18, 12, 5, 200, 15],
  oatMilk: [45, 1, 1, 0.3, 120, 0.1],
  coconutYogurt: [120, 1.5, 1, 0.5, 120, 0.1],
  nutritionalYeast: [330, 45, 25, 5, 20, 0.1],
  aquafaba: [25, 1.5, 0.5, 0.3, 10, 0.02],
  avocado: [160, 2, 6.7, 0.6, 12, 0.1],
  coconutMilk: [197, 2, 0, 2.3, 18, 0.1],
  palmOil: [884, 0, 0, 0, 0, 0.2],
} as const;

// Profile tuple order:
// calories, protein, fiber, iron, calcium, omega-3
function getProfile(name: string, origin: FoodOrigin, animalCategory: AnimalCategory | null) {
  const n = name.toLowerCase();

  if (origin === 'animal' && animalCategory) {
    return profiles[animalCategory as keyof typeof profiles] ?? profiles.beef;
  }

  if (n.includes('avocado')) return profiles.avocado;
  if (n.includes('coconut milk')) return profiles.coconutMilk;
  if (n.includes('palm oil')) return profiles.palmOil;
  if (n.includes('seitan')) return profiles.seitan;
  if (
    n.includes('soy') ||
    n.includes('tofu') ||
    n.includes('tempeh') ||
    n.includes('mung-bean')
  ) return profiles.soy;
  if (
    n.includes('lentil') ||
    n.includes('bean') ||
    n.includes('chickpea')
  ) return profiles.legumes;
  if (n.includes('mushroom')) return profiles.mushrooms;
  if (n.includes('jackfruit')) return profiles.jackfruit;
  if (n.includes('carrot')) return profiles.carrot;
  if (n.includes('seaweed')) return profiles.seaweed;
  if (n.includes('konjac')) return profiles.konjac;
  if (
    n.includes('flaxseed') ||
    n.includes('chia') ||
    n.includes('cashew')
  ) return profiles.nuts;
  if (n.includes('oat milk')) return profiles.oatMilk;
  if (n.includes('coconut yogurt')) return profiles.coconutYogurt;
  if (n.includes('nutritional yeast')) return profiles.nutritionalYeast;
  if (n.includes('aquafaba')) return profiles.aquafaba;

  return profiles.vegetables;
}

const environmentalFactors: Record<
  string,
  { co2: number; water: number; land: number }
> = {
  beef: { co2: 9.95, water: 1500, land: 2 },
  pork: { co2: 1.23, water: 600, land: 0.4 },
  poultry: { co2: 0.99, water: 430, land: 0.25 },
  fish: { co2: 1.36, water: 300, land: 0.1 },
  seafood: { co2: 2.69, water: 500, land: 0.15 },
  dairy: { co2: 0.32, water: 100, land: 0.2 },
  eggs: { co2: 0.47, water: 330, land: 0.15 },
  soy: { co2: 0.32, water: 80, land: 0.08 },
  grains: { co2: 0.16, water: 80, land: 0.08 },
  legumes: { co2: 0.18, water: 80, land: 0.08 },
  fungi: { co2: 0.12, water: 80, land: 0.08 },
  fruits: { co2: 0.11, water: 80, land: 0.08 },
  vegetables: { co2: 0.08, water: 80, land: 0.08 },
  algae: { co2: 0.10, water: 80, land: 0.08 },
  nuts_seeds: { co2: 0.04, water: 80, land: 0.08 },
  other: { co2: 0.20, water: 80, land: 0.08 },
};

const prices: Record<string, number> = {
  beef: 1.8,
  pork: 1.1,
  poultry: 0.75,
  fish: 1.8,
  seafood: 2.2,
  dairy: 0.25,
  eggs: 0.55,
  soy: 0.55,
  grains: 0.45,
  legumes: 0.35,
  fungi: 0.9,
  fruits: 0.5,
  vegetables: 0.45,
  algae: 1.5,
  nuts_seeds: 1.2,
  other: 0.8,
};

function makeFood(
  name: string,
  foodOrigin: FoodOrigin,
  swapCategory: SwapCategory,
  foodCategory: FoodCategory,
  animalProductCategory: AnimalCategory | null,
  textureTags: string[],
  tasteProfiles: string[],
): Food {
  const [calories, protein, fiber, iron, calcium, omega3] =
    getProfile(name, foodOrigin, animalProductCategory);

  const impactCategory = animalProductCategory ?? foodCategory;
  const impact =
    environmentalFactors[impactCategory] ?? environmentalFactors.other;

  const price = prices[impactCategory] ?? prices.other;

  const animalsPer100g = foodOrigin === 'animal'
    ? ({
        beef: 0.00004,
        pork: 0.00012,
        poultry: 0.0015,
        fish: 0.0003,
        seafood: 0.0005,
        dairy: 0.00002,
        eggs: 0.0008,
        other: 0,
      }[animalProductCategory ?? 'other'])
    : 0;

  return {
    name,
    description: `${name}. Nutritional, environmental, and pricing figures are approximate estimates per 100 g.`,
    image: null,
    foodOrigin,
    verificationStatus: 'suggestion',
    swapCategory,
    foodCategory,
    animalProductCategory,
    textureTags,
    tasteProfiles,
    servingSize: 100,
    servingUnit: 'g',
    nutrition: {
      calories,
      proteinG: protein,
      fiberG: fiber,
      ironMg: iron,
      calciumMg: calcium,
      vitaminB12Mcg: foodOrigin === 'animal' ? 1 : 0,
      omega3G: omega3,
      zincMg: foodOrigin === 'animal' ? 2.5 : 1,
      iodineMcg: foodOrigin === 'animal' ? 25 : 2,
    },
    environmentalImpact: {
      co2eKg: impact.co2,
      waterLiters: impact.water,
      landM2: impact.land,
      animalsPer100g,
      impactScorePer100g: Math.min(100, impact.co2 * 4),
    },
    pricing: {
      avgCostPer100g: price,
      costPer20gProtein: protein > 0
        ? Number((price * 20 / protein).toFixed(2))
        : null,
      priceTier: price < 0.5 ? 'low' : price < 1.25 ? 'mid' : 'high',
    },
    sources: [],
    isActive: true,
    sourceReferences: [
      sourceReferences.nutrition,
      sourceReferences.environmentalImpact,
      sourceReferences.pricing,
    ],
  };
}

const foods: Food[] = [
  // Animal reference foods
  makeFood('Beef', 'animal', 'beef', 'meat', 'beef', ['firm', 'chewy'], ['savory', 'umami']),
  makeFood('Pork', 'animal', 'pork', 'meat', 'pork', ['tender', 'firm'], ['savory', 'mild']),
  makeFood('Chicken', 'animal', 'poultry', 'poultry', 'poultry', ['tender', 'fibrous'], ['savory', 'mild']),
  makeFood('Salmon', 'animal', 'fish', 'fish', 'fish', ['tender', 'flaky'], ['savory', 'rich']),
  makeFood('Shrimp', 'animal', 'seafood', 'seafood', 'seafood', ['firm', 'springy'], ['sweet', 'savory']),
  makeFood("Cow's milk", 'animal', 'dairy', 'dairy', 'dairy', ['liquid', 'creamy'], ['mild', 'creamy']),
  makeFood('Chicken egg', 'animal', 'eggs', 'eggs', 'eggs', ['soft', 'custardy'], ['savory', 'mild']),

  // Beef replacements
  makeFood('Seitan beef-style strips', 'plant', 'beef', 'grains', null, ['chewy', 'fibrous'], ['savory', 'umami']),
  makeFood('Soy protein beef crumbles', 'plant', 'beef', 'soy', null, ['crumbly', 'chewy'], ['savory', 'umami']),
  makeFood('Lentil burger patty', 'plant', 'beef', 'legumes', null, ['firm', 'moist'], ['earthy', 'savory']),
  makeFood('Black bean burger patty', 'plant', 'beef', 'legumes', null, ['soft', 'dense'], ['earthy', 'savory']),
  makeFood('Mushroom-walnut mince', 'plant', 'beef', 'fungi', null, ['crumbly', 'meaty'], ['earthy', 'umami']),
  makeFood('Pea-protein beef-style patty', 'plant', 'beef', 'other', null, ['firm', 'juicy'], ['savory', 'umami']),

  // Pork replacements
  makeFood('Jackfruit pulled-pork style', 'plant', 'pork', 'fruits', null, ['fibrous', 'tender'], ['mild', 'savory']),
  makeFood('Seitan pork-style strips', 'plant', 'pork', 'grains', null, ['chewy', 'fibrous'], ['savory', 'umami']),
  makeFood('Soy curls pork-style', 'plant', 'pork', 'soy', null, ['chewy', 'fibrous'], ['savory']),
  makeFood('Tempeh bacon-style strips', 'plant', 'pork', 'soy', null, ['firm', 'chewy'], ['smoky', 'savory']),
  makeFood('Smoked tofu strips', 'plant', 'pork', 'soy', null, ['firm', 'chewy'], ['smoky', 'savory']),
  makeFood('Mushroom sausage-style crumble', 'plant', 'pork', 'fungi', null, ['crumbly', 'tender'], ['savory', 'herbal']),

  // Poultry replacements
  makeFood('Soy-based chicken-style chunks', 'plant', 'poultry', 'soy', null, ['firm', 'chewy'], ['savory', 'mild']),
  makeFood('Seitan chicken-style pieces', 'plant', 'poultry', 'grains', null, ['fibrous', 'chewy'], ['savory', 'mild']),
  makeFood('Chickpea cutlet', 'plant', 'poultry', 'legumes', null, ['firm', 'soft'], ['nutty', 'savory']),
  makeFood('Tofu chicken-style cubes', 'plant', 'poultry', 'soy', null, ['firm', 'tender'], ['mild', 'savory']),
  makeFood('Cauliflower chicken-style bites', 'plant', 'poultry', 'vegetables', null, ['tender', 'crisp'], ['mild', 'savory']),
  makeFood('Pea-protein chicken-style strips', 'plant', 'poultry', 'other', null, ['fibrous', 'chewy'], ['savory', 'mild']),

  // Fish replacements
  makeFood('Banana blossom fish-style fillet', 'plant', 'fish', 'fruits', null, ['flaky', 'tender'], ['mild', 'briny']),
  makeFood('Tofu fish-style fillet', 'plant', 'fish', 'soy', null, ['tender', 'flaky'], ['mild', 'savory']),
  makeFood('Hearts-of-palm fish-style pieces', 'plant', 'fish', 'vegetables', null, ['tender', 'fibrous'], ['mild', 'briny']),
  makeFood('Carrot lox', 'plant', 'fish', 'vegetables', null, ['silky', 'tender'], ['smoky', 'salty']),
  makeFood('Seaweed-seasoned tempeh', 'plant', 'fish', 'soy', null, ['firm', 'chewy'], ['umami', 'briny']),
  makeFood('Plant-protein fish-style fillet', 'plant', 'fish', 'other', null, ['flaky', 'firm'], ['mild', 'savory']),

  // Seafood replacements
  makeFood('King oyster mushroom scallops', 'plant', 'seafood', 'fungi', null, ['firm', 'tender'], ['umami', 'mild']),
  makeFood('Konjac shrimp-style pieces', 'plant', 'seafood', 'other', null, ['springy', 'firm'], ['mild', 'briny']),
  makeFood('Hearts-of-palm crab-style cakes', 'plant', 'seafood', 'vegetables', null, ['fibrous', 'tender'], ['mild', 'savory']),
  makeFood('Chickpea tuna-style salad', 'plant', 'seafood', 'legumes', null, ['flaky', 'creamy'], ['savory', 'tangy']),
  makeFood('Seaweed-based calamari-style rings', 'plant', 'seafood', 'algae', null, ['chewy', 'springy'], ['briny', 'umami']),
  makeFood('Plant-protein crab-style pieces', 'plant', 'seafood', 'other', null, ['flaky', 'firm'], ['sweet', 'savory']),

  // Dairy replacements
  makeFood('Calcium-set firm tofu', 'plant', 'dairy', 'soy', null, ['firm', 'creamy'], ['mild', 'nutty']),
  makeFood('Unsweetened fortified soy milk', 'plant', 'dairy', 'soy', null, ['liquid', 'creamy'], ['mild', 'bean-like']),
  makeFood('Unsweetened oat milk', 'plant', 'dairy', 'grains', null, ['liquid', 'creamy'], ['mild', 'sweet']),
  makeFood('Coconut yogurt, plain', 'plant', 'dairy', 'fruits', null, ['creamy', 'thick'], ['tangy', 'mild']),
  makeFood('Cashew cream cheese', 'plant', 'dairy', 'nuts_seeds', null, ['creamy', 'spreadable'], ['tangy', 'nutty']),
  makeFood('Nutritional yeast', 'plant', 'dairy', 'fungi', null, ['flaky', 'powdery'], ['cheesy', 'umami']),

  // Egg replacements
  makeFood('Ground flaxseed egg substitute', 'plant', 'eggs', 'nuts_seeds', null, ['gel-like', 'thick'], ['nutty', 'mild']),
  makeFood('Chia egg substitute', 'plant', 'eggs', 'nuts_seeds', null, ['gel-like', 'thick'], ['mild', 'nutty']),
  makeFood('Aquafaba', 'plant', 'eggs', 'legumes', null, ['foamy', 'liquid'], ['mild', 'neutral']),
  makeFood('Mung-bean egg-style scramble', 'plant', 'eggs', 'legumes', null, ['soft', 'custardy'], ['savory', 'mild']),

  // Additional foods
  makeFood('Avocado', 'plant', 'other', 'fruits', null, ['creamy', 'soft'], ['mild', 'buttery']),
  makeFood('Coconut milk', 'plant', 'other', 'fruits', null, ['liquid', 'creamy'], ['sweet', 'coconut']),
  makeFood('Palm oil', 'plant', 'other', 'other', null, ['oily', 'liquid'], ['neutral']),
];

if (foods.length !== 50) {
  throw new Error(`Expected 50 foods, got ${foods.length}`);
}

const payload = await getPayload({ config })

try {
  let created = 0
  let updated = 0

  for (const food of foods) {
    // These aren't fields in the current Foods collection schema.
    const { sources: _sources, sourceReferences: _sourceReferences, ...data } = food
    void _sources
    void _sourceReferences

    const existing = await payload.find({
      collection: 'foods',
      where: { name: { equals: food.name } },
      limit: 1,
      overrideAccess: true,
    })

    const existingFood = existing.docs[0]

    if (existingFood) {
      await payload.update({
        collection: 'foods',
        id: existingFood.id,
        data,
        overrideAccess: true,
      })
      updated++
    } else {
      await payload.create({
        collection: 'foods',
        data,
        overrideAccess: true,
      })
      created++
    }
  }

  console.info(`Foods seeded: ${created} created, ${updated} updated.`)
} finally {
  await payload.destroy()
}