import type { Component, Ingredient, Nutrition } from './types'
import { EMPTY_NUTRITION } from './types'

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  return {
    calories: n.calories * factor,
    protein: n.protein * factor,
    carbs: n.carbs * factor,
    fat: n.fat * factor,
  }
}

export function roundNutrition(n: Nutrition): Nutrition {
  return {
    calories: Math.round(n.calories),
    protein: Math.round(n.protein),
    carbs: Math.round(n.carbs),
    fat: Math.round(n.fat),
  }
}

/** Per-serving nutrition for an assembled meal: sum of its components. */
export function mealNutrition(componentIds: string[], components: Component[]): Nutrition {
  const byId = new Map(components.map((c) => [c.id, c]))
  return componentIds.reduce<Nutrition>((total, id) => {
    const c = byId.get(id)
    return c ? addNutrition(total, c.nutrition) : total
  }, EMPTY_NUTRITION)
}

/**
 * Total nutrition across a whole prep plan: for each component, planned servings
 * × per-serving nutrition, summed.
 */
export function prepNutrition(
  prep: Record<string, number>,
  components: Component[],
): Nutrition {
  const byId = new Map(components.map((c) => [c.id, c]))
  return Object.entries(prep).reduce<Nutrition>((total, [id, servings]) => {
    const c = byId.get(id)
    if (!c || servings <= 0) return total
    return addNutrition(total, scaleNutrition(c.nutrition, servings))
  }, EMPTY_NUTRITION)
}

/** Total number of planned servings across the whole prep plan. */
export function totalPlannedServings(prep: Record<string, number>): number {
  return Object.values(prep).reduce((sum, s) => sum + (s > 0 ? s : 0), 0)
}

/**
 * Protein density: grams of protein per 100 kcal. A handy weight-loss signal —
 * higher means more satiety per calorie. ~10 g/100 kcal is excellent.
 */
export function proteinDensity(n: Nutrition): number {
  if (n.calories <= 0) return 0
  return (n.protein / n.calories) * 100
}

/** Batches needed to cover the planned servings of a component. */
export function batchesNeeded(component: Component, servings: number): number {
  const per = component.servingsPerBatch > 0 ? component.servingsPerBatch : 1
  return Math.ceil(servings / per)
}

/**
 * Build a grocery list from a prep plan. For each component with planned
 * servings, compute the number of batches and sum its ingredient quantities,
 * de-duplicated by name + unit.
 */
export function buildGroceryFromPrep(
  prep: Record<string, number>,
  components: Component[],
): Ingredient[] {
  const componentById = new Map(components.map((c) => [c.id, c]))
  const totals = new Map<string, Ingredient>()

  for (const [componentId, servings] of Object.entries(prep)) {
    if (!servings || servings <= 0) continue
    const component = componentById.get(componentId)
    if (!component) continue
    const batches = batchesNeeded(component, servings)
    for (const ing of component.ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`
      const existing = totals.get(key)
      if (existing) {
        existing.quantity += ing.quantity * batches
      } else {
        totals.set(key, { ...ing, quantity: ing.quantity * batches })
      }
    }
  }

  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Trim floating point noise from summed quantities for display. */
export function prettyQuantity(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(2).replace(/\.?0+$/, '')
}
