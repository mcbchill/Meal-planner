import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Modal } from '../components/Modal'
import {
  CATEGORIES,
  FLAVOR_PROFILES,
  FORM_FACTORS,
  type FlavorProfile,
  type FormFactor,
  type Meal,
} from '../types'
import { mealNutrition, proteinDensity } from '../nutrition'
import { NutritionStats, TargetProgress } from '../components/NutritionStats'

export function MealForm({
  initial,
  onClose,
}: {
  initial: Meal | null
  onClose: () => void
}) {
  const { state, addMeal, updateMeal } = useStore()
  const isEdit = !!initial

  const [name, setName] = useState(initial?.name ?? '')
  const [flavor, setFlavor] = useState<FlavorProfile>(initial?.flavorProfile ?? 'Mexican')
  const [formFactor, setFormFactor] = useState<FormFactor>(initial?.formFactor ?? 'bowl')
  const [servings, setServings] = useState(String(initial?.servings ?? 4))
  const [selected, setSelected] = useState<string[]>(initial?.componentIds ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const nutrition = useMemo(
    () => mealNutrition(selected, state.components),
    [selected, state.components],
  )
  const density = proteinDensity(nutrition)

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  /** Mix & match: pick one on-profile component per category at random. */
  function surpriseMe() {
    const picks: string[] = []
    for (const cat of CATEGORIES) {
      const onProfile = state.components.filter(
        (c) => c.category === cat.id && c.flavorProfiles.includes(flavor),
      )
      const pool = onProfile.length > 0 ? onProfile : state.components.filter((c) => c.category === cat.id)
      if (pool.length > 0) picks.push(pool[Math.floor(Math.random() * pool.length)].id)
    }
    setSelected(picks)
  }

  function save() {
    const payload = {
      name: name.trim() || `${flavor} ${formFactor}`,
      flavorProfile: flavor,
      formFactor,
      servings: Math.max(1, Number(servings) || 1),
      componentIds: selected,
      notes: notes.trim() || undefined,
    }
    if (isEdit && initial) updateMeal({ ...payload, id: initial.id })
    else addMeal(payload)
    onClose()
  }

  return (
    <Modal title={isEdit ? `Edit ${initial!.name}` : 'Build a meal'} onClose={onClose}>
      <div className="form meal-form">
        <div className="meal-form__row">
          <label className="form__field form__field--grow">
            <span>Meal name</span>
            <input
              className="input"
              value={name}
              autoFocus
              placeholder={`${flavor} ${formFactor}`}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="form__field">
            <span>Servings / batch</span>
            <input
              className="input input--narrow"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </label>
        </div>

        <div className="meal-form__row">
          <label className="form__field form__field--grow">
            <span>Flavor profile</span>
            <select
              className="input"
              value={flavor}
              onChange={(e) => setFlavor(e.target.value as FlavorProfile)}
            >
              {FLAVOR_PROFILES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field form__field--grow">
            <span>Form factor</span>
            <select
              className="input"
              value={formFactor}
              onChange={(e) => setFormFactor(e.target.value as FormFactor)}
            >
              {FORM_FACTORS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.emoji} {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="button" className="btn btn--soft btn--block" onClick={surpriseMe}>
          🎲 Surprise me — pick {flavor} components
        </button>

        {CATEGORIES.map((cat) => {
          const items = state.components.filter((c) => c.category === cat.id)
          if (items.length === 0) return null
          // On-profile first.
          const sorted = [...items].sort((a, b) => {
            const aOn = a.flavorProfiles.includes(flavor) ? 0 : 1
            const bOn = b.flavorProfiles.includes(flavor) ? 0 : 1
            return aOn - bOn || a.name.localeCompare(b.name)
          })
          return (
            <div key={cat.id} className="form__field">
              <span>
                {cat.emoji} {cat.label}
              </span>
              <div className="picker">
                {sorted.map((c) => {
                  const on = c.flavorProfiles.includes(flavor)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`pick ${selectedSet.has(c.id) ? 'pick--on' : ''}`}
                      onClick={() => toggle(c.id)}
                      title={`${c.nutrition.calories} kcal · ${c.nutrition.protein}g protein`}
                    >
                      {on && <span className="pick__star">★</span>}
                      {c.name}
                      <span className="pick__macro">
                        {c.nutrition.calories}kcal · {c.nutrition.protein}p
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="meal-form__summary">
          <div className="meal-form__summary-head">
            <h3>This meal · per serving</h3>
            {density >= 8 && <span className="pct pct--good">🔥 protein-dense</span>}
          </div>
          <NutritionStats nutrition={nutrition} showDensity />
          <div className="meal-form__bars">
            <TargetProgress
              label="Calories"
              value={nutrition.calories}
              target={state.targets.calories}
              unit="kcal"
              variant="cal"
            />
            <TargetProgress
              label="Protein"
              value={nutrition.protein}
              target={state.targets.protein}
              unit="g"
              variant="protein"
            />
          </div>
        </div>

        <label className="form__field">
          <span>Notes (optional)</span>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div className="form__actions">
          <button
            className="btn btn--primary"
            disabled={selected.length === 0}
            onClick={save}
          >
            {isEdit ? 'Save meal' : 'Save meal'}
          </button>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
