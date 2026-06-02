import { useState } from 'react'
import { useStore } from '../store'
import { CATEGORY_BY_ID, FORM_FACTORS, type Meal } from '../types'
import { mealNutrition, proteinDensity, roundNutrition } from '../nutrition'
import { NutritionStats } from '../components/NutritionStats'
import { MealForm } from './MealForm'

function formFactorMeta(id: Meal['formFactor']) {
  return FORM_FACTORS.find((f) => f.id === id) ?? FORM_FACTORS[0]
}

export function MealBuilder() {
  const { state, deleteMeal, setCartBatches } = useStore()
  const [building, setBuilding] = useState(false)
  const [editing, setEditing] = useState<Meal | null>(null)

  return (
    <section>
      <div className="view-header">
        <div>
          <h2 className="view-title">Meals</h2>
          <p className="view-sub">
            Assemble a base + protein + veg + sauce + garnish. Calories and
            protein total up automatically.
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setBuilding(true)}>
          + Build a meal
        </button>
      </div>

      {state.meals.length === 0 ? (
        <div className="empty-state">
          <p>No meals yet.</p>
          <button className="btn btn--primary" onClick={() => setBuilding(true)}>
            Build your first meal
          </button>
        </div>
      ) : (
        <div className="card-grid card-grid--meals">
          {state.meals.map((meal) => {
            const n = mealNutrition(meal.componentIds, state.components)
            const rounded = roundNutrition(n)
            const density = proteinDensity(n)
            const ff = formFactorMeta(meal.formFactor)
            const inCart = state.cart[meal.id] ?? 0
            const calPct = state.targets.calories
              ? Math.round((rounded.calories / state.targets.calories) * 100)
              : 0
            const protPct = state.targets.protein
              ? Math.round((rounded.protein / state.targets.protein) * 100)
              : 0
            return (
              <article key={meal.id} className="meal-card">
                <div className="meal-card__head">
                  <div>
                    <h3 className="meal-card__name">
                      <span className="meal-card__ff">{ff.emoji}</span> {meal.name}
                    </h3>
                    <div className="tag-row">
                      <span className="tag tag--flavor">{meal.flavorProfile}</span>
                      <span className="tag">{ff.label}</span>
                      <span className="tag">{meal.servings} servings</span>
                    </div>
                  </div>
                  <div className="card__actions">
                    <button className="icon-btn" title="Edit" onClick={() => setEditing(meal)}>
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${meal.name}"?`)) deleteMeal(meal.id)
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <ul className="meal-card__components">
                  {meal.componentIds.map((id) => {
                    const c = state.components.find((x) => x.id === id)
                    if (!c) return null
                    return (
                      <li key={id}>
                        <span className="meal-card__cat">
                          {CATEGORY_BY_ID[c.category].emoji}
                        </span>
                        {c.name}
                      </li>
                    )
                  })}
                </ul>

                <div className="meal-card__nutrition">
                  <NutritionStats nutrition={n} showDensity />
                  <div className="meal-card__pcts">
                    <span className="pct pct--cal">{calPct}% of cal target</span>
                    <span className="pct pct--protein">{protPct}% of protein target</span>
                    {density >= 8 && <span className="pct pct--good">🔥 protein-dense</span>}
                  </div>
                </div>

                {meal.notes && <p className="card__notes">{meal.notes}</p>}

                <div className="meal-card__cart">
                  {inCart > 0 ? (
                    <div className="stepper">
                      <button
                        className="stepper__btn"
                        onClick={() => setCartBatches(meal.id, inCart - 1)}
                      >
                        −
                      </button>
                      <span className="stepper__val">
                        {inCart} batch{inCart > 1 ? 'es' : ''} in list
                      </span>
                      <button
                        className="stepper__btn"
                        onClick={() => setCartBatches(meal.id, inCart + 1)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn--soft btn--sm btn--block"
                      onClick={() => setCartBatches(meal.id, 1)}
                    >
                      🛒 Add to grocery list
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {(building || editing) && (
        <MealForm
          initial={editing}
          onClose={() => {
            setBuilding(false)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}
