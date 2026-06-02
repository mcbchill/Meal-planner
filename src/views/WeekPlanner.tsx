import { useMemo } from 'react'
import { useStore } from '../store'
import { DAYS, EMPTY_NUTRITION, FORM_FACTORS, type Day, type Nutrition } from '../types'
import { addNutrition, mealNutrition, proteinDensity, roundNutrition } from '../nutrition'
import { TargetProgress } from '../components/NutritionStats'

export function WeekPlanner() {
  const { state, addMealToDay, removeMealFromDay, clearDay, clearPlan } = useStore()

  const mealById = useMemo(() => new Map(state.meals.map((m) => [m.id, m])), [state.meals])

  /** Per-serving nutrition for a given meal id (0 if the meal is missing). */
  function nutritionFor(mealId: string): Nutrition {
    const meal = mealById.get(mealId)
    return meal ? mealNutrition(meal.componentIds, state.components) : EMPTY_NUTRITION
  }

  function dayTotal(mealIds: string[]): Nutrition {
    return mealIds.reduce<Nutrition>((sum, id) => addNutrition(sum, nutritionFor(id)), EMPTY_NUTRITION)
  }

  const plannedDays = DAYS.filter((d) => state.plan[d].length > 0)
  const weekTotals = plannedDays.map((d) => dayTotal(state.plan[d]))
  const avg =
    weekTotals.length > 0
      ? {
          calories: weekTotals.reduce((s, n) => s + n.calories, 0) / weekTotals.length,
          protein: weekTotals.reduce((s, n) => s + n.protein, 0) / weekTotals.length,
        }
      : null

  if (state.meals.length === 0) {
    return (
      <section>
        <div className="view-header">
          <h2 className="view-title">Week planner</h2>
        </div>
        <div className="empty-state">
          <p>You need some meals first.</p>
          <p className="view-sub">
            Build meals in the <strong>Meals</strong> tab, then assign them to
            days here to see daily calories &amp; protein vs. your targets.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="view-header">
        <div>
          <h2 className="view-title">Week planner</h2>
          <p className="view-sub">
            Drop meals onto each day and check the daily totals against your
            targets. One entry = one serving.
          </p>
        </div>
        {plannedDays.length > 0 && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              if (confirm('Clear the whole week?')) clearPlan()
            }}
          >
            Clear week
          </button>
        )}
      </div>

      {avg && (
        <div className="week-avg">
          <span className="week-avg__label">
            Daily average across {plannedDays.length} planned day
            {plannedDays.length > 1 ? 's' : ''}
          </span>
          <div className="week-avg__bars">
            <TargetProgress
              label="Calories"
              value={avg.calories}
              target={state.targets.calories}
              unit="kcal"
              variant="cal"
            />
            <TargetProgress
              label="Protein"
              value={avg.protein}
              target={state.targets.protein}
              unit="g"
              variant="protein"
            />
          </div>
        </div>
      )}

      <div className="week-grid">
        {DAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            mealIds={state.plan[day]}
            total={dayTotal(state.plan[day])}
            targets={state.targets}
            meals={state.meals}
            nameFor={(id) => mealById.get(id)?.name ?? 'Deleted meal'}
            ffEmojiFor={(id) =>
              FORM_FACTORS.find((f) => f.id === mealById.get(id)?.formFactor)?.emoji ?? '🍽️'
            }
            nutritionFor={nutritionFor}
            onAdd={(mealId) => addMealToDay(day, mealId)}
            onRemove={(index) => removeMealFromDay(day, index)}
            onClear={() => clearDay(day)}
          />
        ))}
      </div>
    </section>
  )
}

function DayColumn({
  day,
  mealIds,
  total,
  targets,
  meals,
  nameFor,
  ffEmojiFor,
  nutritionFor,
  onAdd,
  onRemove,
  onClear,
}: {
  day: Day
  mealIds: string[]
  total: Nutrition
  targets: { calories: number; protein: number }
  meals: { id: string; name: string }[]
  nameFor: (id: string) => string
  ffEmojiFor: (id: string) => string
  nutritionFor: (id: string) => Nutrition
  onAdd: (mealId: string) => void
  onRemove: (index: number) => void
  onClear: () => void
}) {
  const rounded = roundNutrition(total)
  const density = proteinDensity(total)
  const hasMeals = mealIds.length > 0

  return (
    <div className={`day-col ${hasMeals ? 'day-col--filled' : ''}`}>
      <div className="day-col__head">
        <h3 className="day-col__name">{day}</h3>
        {hasMeals && (
          <button className="icon-btn" title={`Clear ${day}`} onClick={onClear}>
            ✕
          </button>
        )}
      </div>

      <ul className="day-col__meals">
        {mealIds.map((id, i) => {
          const n = roundNutrition(nutritionFor(id))
          return (
            <li key={`${id}-${i}`} className="day-meal">
              <span className="day-meal__ff">{ffEmojiFor(id)}</span>
              <span className="day-meal__name">{nameFor(id)}</span>
              <span className="day-meal__macro">
                {n.calories} · {n.protein}p
              </span>
              <button className="icon-btn" title="Remove" onClick={() => onRemove(i)}>
                ✕
              </button>
            </li>
          )
        })}
        {!hasMeals && <li className="day-col__empty">No meals yet</li>}
      </ul>

      <select
        className="input input--addmeal"
        value=""
        onChange={(e) => {
          if (e.target.value) onAdd(e.target.value)
        }}
      >
        <option value="">+ Add meal…</option>
        {meals.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <div className="day-col__totals">
        <div className="day-total">
          <span className="day-total__num day-total__num--cal">{rounded.calories}</span>
          <span className="day-total__unit">
            / {targets.calories} kcal
          </span>
        </div>
        <div className="day-total">
          <span className="day-total__num day-total__num--protein">{rounded.protein}g</span>
          <span className="day-total__unit">/ {targets.protein}g protein</span>
        </div>
        {hasMeals && density >= 8 && <span className="pct pct--good">🔥 protein-dense</span>}
        {hasMeals && targets.calories > 0 && rounded.calories > targets.calories && (
          <span className="pct pct--over">over calories</span>
        )}
      </div>
    </div>
  )
}
