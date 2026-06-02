import { useState } from 'react'
import { useStore } from '../store'
import { CATEGORY_BY_ID, FORM_FACTORS, type Meal } from '../types'
import { mealNutrition, proteinDensity } from '../nutrition'
import { NutritionStats } from '../components/NutritionStats'
import { MealForm } from './MealForm'

function formFactorMeta(id: Meal['formFactor']) {
  return FORM_FACTORS.find((f) => f.id === id) ?? FORM_FACTORS[0]
}

export function MealBuilder() {
  const { state, deleteMeal, addServingsToPrep } = useStore()
  const [building, setBuilding] = useState(false)
  const [editing, setEditing] = useState<Meal | null>(null)
  const [added, setAdded] = useState<string | null>(null)

  function addToPrep(meal: Meal) {
    addServingsToPrep(meal.componentIds, 1)
    setAdded(meal.id)
    window.setTimeout(() => setAdded((cur) => (cur === meal.id ? null : cur)), 1600)
  }

  return (
    <section>
      <div className="view-header">
        <div>
          <h2 className="view-title">Assembly ideas</h2>
          <p className="view-sub">
            Saved component combos for inspiration. Send one to your prep plan to
            add a serving of each of its components.
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setBuilding(true)}>
          + New idea
        </button>
      </div>

      {state.meals.length === 0 ? (
        <div className="empty-state">
          <p>No assembly ideas yet.</p>
          <button className="btn btn--primary" onClick={() => setBuilding(true)}>
            Create your first idea
          </button>
        </div>
      ) : (
        <div className="card-grid card-grid--meals">
          {state.meals.map((meal) => {
            const n = mealNutrition(meal.componentIds, state.components)
            const density = proteinDensity(n)
            const ff = formFactorMeta(meal.formFactor)
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
                  {density >= 8 && (
                    <div className="meal-card__pcts">
                      <span className="pct pct--good">🔥 protein-dense</span>
                    </div>
                  )}
                </div>

                {meal.notes && <p className="card__notes">{meal.notes}</p>}

                <div className="meal-card__cart">
                  <button
                    className={`btn btn--soft btn--sm btn--block ${added === meal.id ? 'btn--ok' : ''}`}
                    onClick={() => addToPrep(meal)}
                  >
                    {added === meal.id ? '✓ Added to prep plan' : '➕ Add components to prep plan'}
                  </button>
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
