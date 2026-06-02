import { useState } from 'react'
import { useStore } from '../store'
import { Modal } from '../components/Modal'
import {
  CATEGORIES,
  FLAVOR_PROFILES,
  type Category,
  type Component,
  type FlavorProfile,
  type Ingredient,
} from '../types'

export function ComponentForm({
  initial,
  defaultCategory,
  onClose,
}: {
  initial: Component | null
  defaultCategory?: Category
  onClose: () => void
}) {
  const { addComponent, updateComponent } = useStore()
  const isEdit = !!initial

  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<Category>(
    initial?.category ?? defaultCategory ?? 'base',
  )
  const [flavors, setFlavors] = useState<FlavorProfile[]>(initial?.flavorProfiles ?? [])
  const [calories, setCalories] = useState(String(initial?.nutrition.calories ?? ''))
  const [protein, setProtein] = useState(String(initial?.nutrition.protein ?? ''))
  const [carbs, setCarbs] = useState(String(initial?.nutrition.carbs ?? ''))
  const [fat, setFat] = useState(String(initial?.nutrition.fat ?? ''))
  const [servingsPerBatch, setServingsPerBatch] = useState(String(initial?.servingsPerBatch ?? 4))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients ?? [{ name: '', quantity: 1, unit: 'whole' }],
  )

  function toggleFlavor(f: FlavorProfile) {
    setFlavors((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))
  }

  function updateIngredient(i: number, patch: Partial<Ingredient>) {
    setIngredients((cur) => cur.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)))
  }

  function removeIngredient(i: number) {
    setIngredients((cur) => cur.filter((_, idx) => idx !== i))
  }

  function addIngredient() {
    setIngredients((cur) => [...cur, { name: '', quantity: 1, unit: 'whole' }])
  }

  function save() {
    const cleanIngredients = ingredients
      .map((i) => ({ ...i, name: i.name.trim() }))
      .filter((i) => i.name.length > 0)

    const payload = {
      name: name.trim(),
      category,
      flavorProfiles: flavors,
      nutrition: {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      },
      servingsPerBatch: Math.max(1, Number(servingsPerBatch) || 1),
      ingredients: cleanIngredients,
      notes: notes.trim() || undefined,
    }

    if (isEdit && initial) updateComponent({ ...payload, id: initial.id })
    else addComponent(payload)
    onClose()
  }

  const canSave = name.trim().length > 0

  return (
    <Modal title={isEdit ? `Edit ${initial!.name}` : 'New component'} onClose={onClose}>
      <div className="form">
        <label className="form__field">
          <span>Name</span>
          <input
            className="input"
            value={name}
            autoFocus
            placeholder="e.g. Cilantro-Lime Rice"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="form__field">
          <span>Category</span>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="form__field">
          <span>Flavor profiles</span>
          <div className="chip-row">
            {FLAVOR_PROFILES.map((f) => (
              <button
                key={f}
                type="button"
                className={`chip ${flavors.includes(f) ? 'chip--on' : ''}`}
                onClick={() => toggleFlavor(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="form__field">
          <span>Nutrition (per serving)</span>
          <div className="macro-inputs">
            <label>
              <input
                className="input"
                type="number"
                min={0}
                value={calories}
                placeholder="0"
                onChange={(e) => setCalories(e.target.value)}
              />
              <small>kcal</small>
            </label>
            <label>
              <input
                className="input"
                type="number"
                min={0}
                value={protein}
                placeholder="0"
                onChange={(e) => setProtein(e.target.value)}
              />
              <small>protein g</small>
            </label>
            <label>
              <input
                className="input"
                type="number"
                min={0}
                value={carbs}
                placeholder="0"
                onChange={(e) => setCarbs(e.target.value)}
              />
              <small>carbs g</small>
            </label>
            <label>
              <input
                className="input"
                type="number"
                min={0}
                value={fat}
                placeholder="0"
                onChange={(e) => setFat(e.target.value)}
              />
              <small>fat g</small>
            </label>
          </div>
        </div>

        <label className="form__field">
          <span>Servings per batch</span>
          <input
            className="input input--narrow"
            type="number"
            min={1}
            value={servingsPerBatch}
            onChange={(e) => setServingsPerBatch(e.target.value)}
          />
          <small className="field-hint">
            How many servings one batch of the ingredients below makes — used to
            scale the grocery list from your prep plan.
          </small>
        </label>

        <div className="form__field">
          <span>Grocery ingredients (per batch)</span>
          <div className="ingredient-list">
            {ingredients.map((ing, i) => (
              <div key={i} className="ingredient-row">
                <input
                  className="input ingredient-row__qty"
                  type="number"
                  min={0}
                  step="any"
                  value={ing.quantity}
                  onChange={(e) =>
                    updateIngredient(i, { quantity: Number(e.target.value) || 0 })
                  }
                />
                <input
                  className="input ingredient-row__unit"
                  value={ing.unit}
                  placeholder="unit"
                  onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                />
                <input
                  className="input ingredient-row__name"
                  value={ing.name}
                  placeholder="ingredient"
                  onChange={(e) => updateIngredient(i, { name: e.target.value })}
                />
                <button
                  type="button"
                  className="icon-btn"
                  title="Remove"
                  onClick={() => removeIngredient(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={addIngredient}>
            + Add ingredient
          </button>
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
          <button className="btn btn--primary" disabled={!canSave} onClick={save}>
            {isEdit ? 'Save changes' : 'Add component'}
          </button>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
