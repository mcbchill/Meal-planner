import { useState } from 'react'
import { useStore } from '../store'

/** Header widget: shows daily calorie & protein targets and lets you edit them. */
export function TargetsBar() {
  const { state, setTargets } = useStore()
  const [editing, setEditing] = useState(false)
  const [calories, setCalories] = useState(String(state.targets.calories))
  const [protein, setProtein] = useState(String(state.targets.protein))

  function save() {
    setTargets({
      calories: Math.max(0, Number(calories) || 0),
      protein: Math.max(0, Number(protein) || 0),
    })
    setEditing(false)
  }

  function cancel() {
    setCalories(String(state.targets.calories))
    setProtein(String(state.targets.protein))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="targets targets--editing">
        <label className="targets__field">
          <span>Daily calories</span>
          <input
            type="number"
            value={calories}
            min={0}
            onChange={(e) => setCalories(e.target.value)}
          />
        </label>
        <label className="targets__field">
          <span>Protein (g)</span>
          <input
            type="number"
            value={protein}
            min={0}
            onChange={(e) => setProtein(e.target.value)}
          />
        </label>
        <div className="targets__actions">
          <button className="btn btn--primary btn--sm" onClick={save}>
            Save
          </button>
          <button className="btn btn--ghost btn--sm" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button className="targets" onClick={() => setEditing(true)} title="Edit daily targets">
      <div className="targets__stat">
        <span className="targets__value">{state.targets.calories}</span>
        <span className="targets__label">kcal / day</span>
      </div>
      <div className="targets__divider" />
      <div className="targets__stat">
        <span className="targets__value targets__value--protein">{state.targets.protein}g</span>
        <span className="targets__label">protein / day</span>
      </div>
      <span className="targets__edit">✏️</span>
    </button>
  )
}
