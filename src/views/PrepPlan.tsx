import { useMemo } from 'react'
import { useStore } from '../store'
import { CATEGORIES } from '../types'
import {
  batchesNeeded,
  prepNutrition,
  proteinDensity,
  roundNutrition,
  scaleNutrition,
  totalPlannedServings,
} from '../nutrition'
import { TargetProgress } from '../components/NutritionStats'

export function PrepPlan() {
  const { state, setPrepServings, setPeriodDays, clearPrep } = useStore()
  const { components, prep, targets, periodDays } = state

  const total = useMemo(() => prepNutrition(prep, components), [prep, components])
  const rounded = roundNutrition(total)
  const servings = totalPlannedServings(prep)
  const density = proteinDensity(total)

  const periodTarget = {
    calories: targets.calories * periodDays,
    protein: targets.protein * periodDays,
  }
  const perDay = {
    calories: periodDays > 0 ? total.calories / periodDays : 0,
    protein: periodDays > 0 ? total.protein / periodDays : 0,
  }

  const hasPlan = servings > 0

  return (
    <section>
      <div className="view-header">
        <div>
          <h2 className="view-title">Prep plan</h2>
          <p className="view-sub">
            Decide how many servings of each component you'll batch-cook. Prep all
            of it and you'll hit your targets — however you assemble meals day to
            day.
          </p>
        </div>
        {hasPlan && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              if (confirm('Clear the whole prep plan?')) clearPrep()
            }}
          >
            Clear plan
          </button>
        )}
      </div>

      {/* Period + running totals */}
      <div className="prep-summary">
        <div className="prep-summary__top">
          <label className="period-control">
            <span>Prep for</span>
            <div className="stepper stepper--sm">
              <button
                className="stepper__btn"
                onClick={() => setPeriodDays(periodDays - 1)}
                aria-label="Fewer days"
              >
                −
              </button>
              <span className="stepper__val period-control__val">
                {periodDays} day{periodDays > 1 ? 's' : ''}
              </span>
              <button
                className="stepper__btn"
                onClick={() => setPeriodDays(periodDays + 1)}
                aria-label="More days"
              >
                +
              </button>
            </div>
          </label>
          <div className="prep-summary__servings">
            <span className="prep-summary__servings-num">{servings}</span>
            <span className="prep-summary__servings-label">servings prepped</span>
          </div>
        </div>

        <div className="prep-summary__totals">
          <div className="big-stat">
            <span className="big-stat__num big-stat__num--cal">{rounded.calories.toLocaleString()}</span>
            <span className="big-stat__label">total kcal</span>
          </div>
          <div className="big-stat">
            <span className="big-stat__num big-stat__num--protein">{rounded.protein}g</span>
            <span className="big-stat__label">total protein</span>
          </div>
          {hasPlan && density >= 8 && (
            <span className="pct pct--good">🔥 {density.toFixed(1)}g protein /100kcal</span>
          )}
        </div>

        <div className="prep-summary__bars">
          <TargetProgress
            label={`Calories vs ${periodDays}-day target`}
            value={total.calories}
            target={periodTarget.calories}
            unit="kcal"
            variant="cal"
          />
          <TargetProgress
            label={`Protein vs ${periodDays}-day target`}
            value={total.protein}
            target={periodTarget.protein}
            unit="g"
            variant="protein"
          />
        </div>

        {hasPlan && (
          <p className="prep-summary__avg">
            That's an average of <strong>{Math.round(perDay.calories).toLocaleString()} kcal</strong>{' '}
            and <strong>{Math.round(perDay.protein)}g protein</strong> per day over {periodDays} days
            {' '}(targets: {targets.calories.toLocaleString()} kcal · {targets.protein}g).
          </p>
        )}
      </div>

      {/* Component pickers by category */}
      {CATEGORIES.map((cat) => {
        const items = components.filter((c) => c.category === cat.id)
        if (items.length === 0) return null
        return (
          <div key={cat.id} className="cat-section">
            <h3 className="cat-section__title">
              <span className="cat-emoji">{cat.emoji}</span> {cat.label}
            </h3>
            <div className="prep-rows">
              {items.map((c) => {
                const planned = prep[c.id] ?? 0
                const sub = roundNutrition(scaleNutrition(c.nutrition, planned))
                const batches = planned > 0 ? batchesNeeded(c, planned) : 0
                return (
                  <div key={c.id} className={`prep-row ${planned > 0 ? 'prep-row--on' : ''}`}>
                    <div className="prep-row__info">
                      <span className="prep-row__name">{c.name}</span>
                      <span className="prep-row__macro">
                        {c.nutrition.calories} kcal · {c.nutrition.protein}g protein / serving
                      </span>
                    </div>

                    <div className="prep-row__right">
                      {planned > 0 && (
                        <span className="prep-row__sub">
                          {sub.calories} kcal · {sub.protein}g · {batches} batch
                          {batches > 1 ? 'es' : ''}
                        </span>
                      )}
                      <div className="stepper stepper--sm">
                        <button
                          className="stepper__btn"
                          onClick={() => setPrepServings(c.id, planned - 1)}
                          aria-label={`One fewer serving of ${c.name}`}
                        >
                          −
                        </button>
                        <span className="stepper__val prep-row__count">{planned}</span>
                        <button
                          className="stepper__btn"
                          onClick={() => setPrepServings(c.id, planned + 1)}
                          aria-label={`One more serving of ${c.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="footnote">
        Tip: set servings on your proteins first to lock in your protein target,
        then add bases, veg, sauces and garnishes to round out the calories.
      </p>
    </section>
  )
}
