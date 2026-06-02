// ---------------------------------------------------------------------------
// Domain model for the meal planner.
//
// The system is component-based (inspired by Ethan Chlebowski's mix-and-match
// meal prep): you keep a library of prepped *components* grouped by role, then
// assemble *meals* by picking one or more components per role. Flavor profile
// (driven mostly by the sauce + aromatics) is what makes the same components
// feel like a different meal.
//
// Every component carries per-serving nutrition so meals can total calories and
// protein automatically — the numbers that matter for hitting a weight-loss
// target.
// ---------------------------------------------------------------------------

export type Category = 'base' | 'protein' | 'vegetable' | 'sauce' | 'garnish'

export interface CategoryMeta {
  id: Category
  label: string
  emoji: string
  /** Short reminder of the component's role in a meal. */
  hint: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'base', label: 'Base / Carb', emoji: '🍚', hint: 'Rice, grains, potatoes, greens — the foundation.' },
  { id: 'protein', label: 'Protein', emoji: '🍗', hint: 'The protein anchor. Aim high for weight loss.' },
  { id: 'vegetable', label: 'Vegetable', emoji: '🥦', hint: 'Volume, fiber, color — fill the plate cheaply.' },
  { id: 'sauce', label: 'Sauce / Flavor', emoji: '🥣', hint: 'The flavor driver. Switch this to switch cuisines.' },
  { id: 'garnish', label: 'Garnish / Texture', emoji: '🌿', hint: 'Herbs, acid, crunch — the finishing touch.' },
]

export const CATEGORY_BY_ID: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category, CategoryMeta>

export type FormFactor = 'bowl' | 'salad' | 'wrap' | 'sandwich' | 'tacos' | 'plate'

export const FORM_FACTORS: { id: FormFactor; label: string; emoji: string }[] = [
  { id: 'bowl', label: 'Bowl', emoji: '🥣' },
  { id: 'salad', label: 'Salad', emoji: '🥗' },
  { id: 'wrap', label: 'Wrap', emoji: '🌯' },
  { id: 'sandwich', label: 'Sandwich', emoji: '🥪' },
  { id: 'tacos', label: 'Tacos', emoji: '🌮' },
  { id: 'plate', label: 'Plate', emoji: '🍽️' },
]

/** Flavor profiles drive variety; the sauce usually carries the profile. */
export const FLAVOR_PROFILES = [
  'Mexican',
  'Mediterranean',
  'East Asian',
  'Thai',
  'Italian',
  'Indian',
  'Middle Eastern',
  'American',
  'Neutral',
] as const

export type FlavorProfile = (typeof FLAVOR_PROFILES)[number]

export interface Nutrition {
  calories: number
  protein: number // grams
  carbs: number // grams
  fat: number // grams
}

export const EMPTY_NUTRITION: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 }

/** A shopping ingredient that a component contributes to the grocery list. */
export interface Ingredient {
  name: string
  quantity: number
  unit: string
}

export interface Component {
  id: string
  name: string
  category: Category
  flavorProfiles: FlavorProfile[]
  /** Nutrition for ONE serving of this component as used in a meal. */
  nutrition: Nutrition
  /** Grocery items needed to prep one batch of this component. */
  ingredients: Ingredient[]
  notes?: string
}

export interface Meal {
  id: string
  name: string
  formFactor: FormFactor
  flavorProfile: FlavorProfile
  componentIds: string[]
  /** How many servings one batch of this meal makes (scales the grocery list). */
  servings: number
  notes?: string
}

export interface Targets {
  calories: number
  protein: number // grams/day
}

export interface AppState {
  components: Component[]
  meals: Meal[]
  targets: Targets
  /** mealId -> number of batches to buy groceries for. */
  cart: Record<string, number>
  seeded: boolean
}
