import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { batchesNeeded, buildGroceryFromPrep, prettyQuantity } from '../nutrition'
import { CATEGORY_BY_ID } from '../types'

export function GroceryList() {
  const { state } = useStore()
  const { prep, components } = state
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const componentById = useMemo(() => new Map(components.map((c) => [c.id, c])), [components])

  // What to cook: each planned component with its servings and batch count.
  const prepItems = useMemo(
    () =>
      Object.entries(prep)
        .map(([id, servings]) => ({ component: componentById.get(id), servings }))
        .filter((x): x is { component: NonNullable<typeof x.component>; servings: number } =>
          !!x.component && x.servings > 0,
        )
        .sort((a, b) => a.component.name.localeCompare(b.component.name)),
    [prep, componentById],
  )

  const list = useMemo(() => buildGroceryFromPrep(prep, components), [prep, components])

  function toggle(key: string) {
    setChecked((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function copyList() {
    const text = list
      .map((i) => `- ${prettyQuantity(i.quantity)} ${i.unit} ${i.name}`)
      .join('\n')
    navigator.clipboard?.writeText(text)
  }

  if (prepItems.length === 0) {
    return (
      <section>
        <div className="view-header">
          <h2 className="view-title">Grocery list</h2>
        </div>
        <div className="empty-state">
          <p>Your grocery list is empty.</p>
          <p className="view-sub">
            Set servings in the <strong>Prep plan</strong> tab and the ingredients
            you need will roll up here automatically.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="view-header">
        <div>
          <h2 className="view-title">Grocery list</h2>
          <p className="view-sub">Everything you need to prep this period.</p>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={copyList}>
          📋 Copy
        </button>
      </div>

      {/* Prep checklist: what to cook, and how many batches */}
      <div className="prep-checklist">
        <h3 className="prep-checklist__title">🍳 To cook</h3>
        <ul>
          {prepItems.map(({ component, servings }) => {
            const batches = batchesNeeded(component, servings)
            return (
              <li key={component.id}>
                <span className="prep-checklist__cat">
                  {CATEGORY_BY_ID[component.category].emoji}
                </span>
                <span className="prep-checklist__name">{component.name}</span>
                <span className="prep-checklist__qty">
                  {batches} batch{batches > 1 ? 'es' : ''} → {servings} serving
                  {servings > 1 ? 's' : ''}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <h3 className="grocery-heading">🛒 Shopping list</h3>
      <ul className="grocery-list">
        {list.map((ing) => {
          const key = `${ing.name}|${ing.unit}`
          const done = checked.has(key)
          return (
            <li key={key} className={`grocery-item ${done ? 'grocery-item--done' : ''}`}>
              <label>
                <input type="checkbox" checked={done} onChange={() => toggle(key)} />
                <span className="grocery-item__qty">
                  {prettyQuantity(ing.quantity)} {ing.unit}
                </span>
                <span className="grocery-item__name">{ing.name}</span>
              </label>
            </li>
          )
        })}
      </ul>

      <p className="footnote">
        {checked.size} of {list.length} items checked off.
      </p>
    </section>
  )
}
