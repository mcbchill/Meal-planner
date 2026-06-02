import type { Component, Ingredient, Meal, Nutrition } from './types'
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

/** Per-serving nutrition for a meal: sum of its selected components. */
export function mealNutrition(componentIds: string[], components: Component[]): Nutrition {
  const byId = new Map(components.map((c) => [c.id, c]))
  return componentIds.reduce<Nutrition>((total, id) => {
    const c = byId.get(id)
    return c ? addNutrition(total, c.nutrition) : total
  }, EMPTY_NUTRITION)
}

/**
 * Protein density: grams of protein per 100 kcal. A handy weight-loss signal —
 * higher means more satiety per calorie. ~10 g/100 kcal is excellent.
 */
export function proteinDensity(n: Nutrition): number {
  if (n.calories <= 0) return 0
  return (n.protein / n.calories) * 100
}

/**
 * Aggregate a grocery list from a cart of meals. Each cart entry is a number of
 * batches; one batch yields `meal.servings` servings. Ingredient quantities are
 * summed across meals, keyed by name + unit.
 */
export function buildGroceryList(
  cart: Record<string, number>,
  meals: Meal[],
  components: Component[],
): Ingredient[] {
  const mealById = new Map(meals.map((m) => [m.id, m]))
  const componentById = new Map(components.map((c) => [c.id, c]))
  const totals = new Map<string, Ingredient>()

  for (const [mealId, batches] of Object.entries(cart)) {
    if (!batches || batches <= 0) continue
    const meal = mealById.get(mealId)
    if (!meal) continue
    for (const componentId of meal.componentIds) {
      const component = componentById.get(componentId)
      if (!component) continue
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
  }

  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Trim floating point noise from summed quantities for display. */
export function prettyQuantity(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(2).replace(/\.?0+$/, '')
}
