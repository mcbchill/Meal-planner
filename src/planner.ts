import type { Category, Component, FlavorProfile, Targets } from './types'
import { prepNutrition } from './nutrition'

export interface PrepTemplate {
  id: string
  name: string
  emoji: string
  description: string
  /** If set, the generator prefers components in this flavor profile. */
  profile?: FlavorProfile
}

export const TEMPLATES: PrepTemplate[] = [
  {
    id: 'balanced',
    name: 'Auto-plan',
    emoji: '⚡',
    description: 'Balanced, protein-forward — any cuisine',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    emoji: '🫒',
    description: 'Farro, chicken, chickpeas, tahini, feta',
    profile: 'Mediterranean',
  },
  {
    id: 'mexican',
    name: 'Mexican',
    emoji: '🌮',
    description: 'Cilantro-lime rice, chicken, slaw, chipotle',
    profile: 'Mexican',
  },
  {
    id: 'east-asian',
    name: 'Asian-inspired',
    emoji: '🥢',
    description: 'Jasmine rice, tofu, broccoli, soy-ginger',
    profile: 'East Asian',
  },
]

/**
 * Generate a prep plan that aims to hit the protein and calorie targets for the
 * period. Strategy: meet protein first (it's the hard constraint for weight
 * loss), pair bases/veg/sauce/garnish proportionally, then nudge bases to land
 * the calorie total. The result is meant as a strong starting point to tweak.
 */
export function generatePrepPlan(
  components: Component[],
  targets: Targets,
  days: number,
  opts: { profile?: FlavorProfile } = {},
): Record<string, number> {
  const inProfile = (c: Component) => !opts.profile || c.flavorProfiles.includes(opts.profile)

  const byCat = (cat: Category): Component[] => {
    const scoped = components.filter((c) => c.category === cat && inProfile(c))
    return scoped.length ? scoped : components.filter((c) => c.category === cat)
  }

  const proteinNeeded = targets.protein * days
  const calorieNeeded = targets.calories * days
  const prep: Record<string, number> = {}

  // Proteins: prefer the most protein-rich, take up to 3 for variety.
  const proteins = byCat('protein')
    .slice()
    .sort((a, b) => b.nutrition.protein - a.nutrition.protein)
    .slice(0, 3)
  if (proteins.length === 0) return prep

  const perProteinTarget = proteinNeeded / proteins.length
  let proteinServings = 0
  for (const p of proteins) {
    const pp = p.nutrition.protein > 0 ? p.nutrition.protein : 1
    const servings = Math.max(1, Math.round(perProteinTarget / pp))
    prep[p.id] = servings
    proteinServings += servings
  }

  // Distribute `total` servings across the first `k` of a category, evenly.
  const distribute = (list: Component[], total: number, k: number) => {
    const picks = list.slice(0, k)
    if (picks.length === 0 || total <= 0) return
    const per = Math.floor(total / picks.length)
    let rem = total - per * picks.length
    for (const c of picks) {
      const add = per + (rem > 0 ? 1 : 0)
      if (rem > 0) rem--
      if (add > 0) prep[c.id] = (prep[c.id] ?? 0) + add
    }
  }

  // Veg, sauce and garnish are scaled to the period (a couple of veg + a sauce
  // per day, a touch of garnish) — they're low-to-moderate calorie.
  distribute(byCat('vegetable'), days * 2, 3)
  distribute(byCat('sauce'), days * 2, 2)
  distribute(byCat('garnish'), days, 2)

  // Bases fill the *remaining* calorie budget after protein + the rest — this is
  // what keeps total calories near target instead of overshooting on carbs.
  const bases = byCat('base').slice(0, 2)
  if (bases.length) {
    const soFar = prepNutrition(prep, components).calories
    const avgBaseCal =
      bases.reduce((s, c) => s + c.nutrition.calories, 0) / bases.length || 1
    // Floor so we land just under the calorie target rather than over it.
    const baseServings = Math.max(0, Math.floor((calorieNeeded - soFar) / avgBaseCal))
    distribute(bases, baseServings, bases.length)
  }

  return prep
}
