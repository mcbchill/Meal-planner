import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { CATEGORIES, type Component } from '../types'
import {
  batchesNeeded,
  prepNutrition,
  proteinDensity,
  roundNutrition,
  scaleNutrition,
  totalPlannedServings,
} from '../nutrition'
import { TargetProgress } from '../components/NutritionStats'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { TEMPLATES, generatePrepPlan, type PrepTemplate } from '../planner'

export function PrepPlan() {
  const { state, setPrepServings, setPeriodDays, setPrep, clearPrep, undo } = useStore()
  const { showToast } = useToast()
  const { components, prep, targets, periodDays } = state
  const [adding, setAdding] = useState(false)

  const total = useMemo(() => prepNutrition(prep, components), [prep, components])
  const rounded = roundNutrition(total)
  const servings = totalPlannedServings(prep)
  const density = proteinDensity(total)
  const hasPlan = servings > 0

  const periodTarget = {
    calories: targets.calories * periodDays,
    protein: targets.protein * periodDays,
  }
  const perDay = {
    calories: periodDays > 0 ? total.calories / periodDays : 0,
    protein: periodDays > 0 ? total.protein / periodDays : 0,
  }

  function applyTemplate(t: PrepTemplate) {
    const replacing = hasPlan
    setPrep(generatePrepPlan(components, targets, periodDays, { profile: t.profile }))
    showToast(`${replacing ? 'Replaced with' : 'Generated'} the “${t.name}” plan`, 'Undo', undo)
  }

  // Components currently in the plan, grouped by category for the "Your plan" view.
  const plannedByCat = useMemo(() => {
    const map = new Map<string, { component: Component; servings: number }[]>()
    for (const c of components) {
      const s = prep[c.id] ?? 0
      if (s <= 0) continue
      const arr = map.get(c.category) ?? []
      arr.push({ component: c, servings: s })
      map.set(c.category, arr)
    }
    return map
  }, [components, prep])

  return (
    <section>
      <div className="view-header">
        <div>
          <h2 className="view-title">Prep plan</h2>
          <p className="view-sub">
            Start from a template, then tweak. Prep all of it and you'll hit your
            targets — however you assemble meals day to day.
          </p>
        </div>
        {hasPlan && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              clearPrep()
              showToast('Prep plan cleared', 'Undo', undo)
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick-start: one-tap templates / auto-plan */}
      <div className="quickstart">
        <span className="quickstart__label">
          {hasPlan ? 'Re-roll:' : 'Quick start:'}
        </span>
        <div className="quickstart__chips">
          {TEMPLATES.map((t) => (
            <button key={t.id} className="qchip" onClick={() => applyTemplate(t)} title={t.description}>
              <span className="qchip__emoji">{t.emoji}</span>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Running totals vs the period target */}
      <div className="prep-summary">
        <div className="prep-summary__top">
          <label className="period-control">
            <span>Prep for</span>
            <div className="stepper stepper--sm">
              <button className="stepper__btn" onClick={() => setPeriodDays(periodDays - 1)} aria-label="Fewer days">
                −
              </button>
              <span className="stepper__val period-control__val">
                {periodDays} day{periodDays > 1 ? 's' : ''}
              </span>
              <button className="stepper__btn" onClick={() => setPeriodDays(periodDays + 1)} aria-label="More days">
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
            Averages <strong>{Math.round(perDay.calories).toLocaleString()} kcal</strong> and{' '}
            <strong>{Math.round(perDay.protein)}g protein</strong> per day over {periodDays} days
            {' '}(targets: {targets.calories.toLocaleString()} · {targets.protein}g).
          </p>
        )}
      </div>

      {!hasPlan ? (
        <div className="empty-state">
          <p className="empty-state__lead">Pick a starting point</p>
          <div className="template-grid">
            {TEMPLATES.map((t) => (
              <button key={t.id} className="template-card" onClick={() => applyTemplate(t)}>
                <span className="template-card__emoji">{t.emoji}</span>
                <span className="template-card__name">{t.name}</span>
                <span className="template-card__desc">{t.description}</span>
              </button>
            ))}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setAdding(true)}>
            …or build it yourself
          </button>
        </div>
      ) : (
        <>
          <div className="plan-header">
            <h3 className="plan-header__title">Your plan</h3>
            <button className="btn btn--soft btn--sm" onClick={() => setAdding(true)}>
              + Add component
            </button>
          </div>

          {CATEGORIES.map((cat) => {
            const rows = plannedByCat.get(cat.id)
            if (!rows || rows.length === 0) return null
            return (
              <div key={cat.id} className="plan-group">
                <h4 className="plan-group__title">
                  <span className="cat-emoji">{cat.emoji}</span> {cat.label}
                </h4>
                <div className="prep-rows">
                  {rows.map(({ component: c, servings: planned }) => {
                    const sub = roundNutrition(scaleNutrition(c.nutrition, planned))
                    const batches = batchesNeeded(c, planned)
                    return (
                      <div key={c.id} className="prep-row prep-row--on">
                        <div className="prep-row__info">
                          <span className="prep-row__name">{c.name}</span>
                          <span className="prep-row__macro">
                            {sub.calories} kcal · {sub.protein}g protein · {batches} batch
                            {batches > 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="prep-row__right">
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
        </>
      )}

      {adding && <AddComponentModal onClose={() => setAdding(false)} />}
    </section>
  )
}

function AddComponentModal({ onClose }: { onClose: () => void }) {
  const { state, setPrepServings } = useStore()
  const { components, prep } = state
  const [q, setQ] = useState('')

  const query = q.trim().toLowerCase()
  const matches = (c: Component) => !query || c.name.toLowerCase().includes(query)

  return (
    <Modal title="Add to prep plan" onClose={onClose}>
      <input
        className="input input--search"
        placeholder="Search components…"
        value={q}
        autoFocus
        onChange={(e) => setQ(e.target.value)}
        style={{ width: '100%', marginBottom: 14 }}
      />
      {CATEGORIES.map((cat) => {
        const items = components.filter((c) => c.category === cat.id && matches(c))
        if (items.length === 0) return null
        return (
          <div key={cat.id} className="add-group">
            <h4 className="add-group__title">
              <span className="cat-emoji">{cat.emoji}</span> {cat.label}
            </h4>
            {items.map((c) => {
              const planned = prep[c.id] ?? 0
              return (
                <div key={c.id} className="add-row">
                  <div className="add-row__info">
                    <span className="add-row__name">{c.name}</span>
                    <span className="add-row__macro">
                      {c.nutrition.calories} kcal · {c.nutrition.protein}g protein
                    </span>
                  </div>
                  {planned > 0 ? (
                    <div className="stepper stepper--sm">
                      <button className="stepper__btn" onClick={() => setPrepServings(c.id, planned - 1)}>
                        −
                      </button>
                      <span className="stepper__val prep-row__count">{planned}</span>
                      <button className="stepper__btn" onClick={() => setPrepServings(c.id, planned + 1)}>
                        +
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn--soft btn--sm" onClick={() => setPrepServings(c.id, 1)}>
                      + Add
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </Modal>
  )
}
