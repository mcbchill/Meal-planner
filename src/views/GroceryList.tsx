import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { buildGroceryList, prettyQuantity } from '../nutrition'

export function GroceryList() {
  const { state, setCartBatches, clearCart } = useStore()
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const cartMeals = useMemo(
    () =>
      Object.entries(state.cart)
        .map(([id, batches]) => ({ meal: state.meals.find((m) => m.id === id), batches }))
        .filter((x): x is { meal: NonNullable<typeof x.meal>; batches: number } => !!x.meal),
    [state.cart, state.meals],
  )

  const list = useMemo(
    () => buildGroceryList(state.cart, state.meals, state.components),
    [state.cart, state.meals, state.components],
  )

  const totalServings = cartMeals.reduce((sum, { meal, batches }) => sum + meal.servings * batches, 0)

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

  if (cartMeals.length === 0) {
    return (
      <section>
        <div className="view-header">
          <h2 className="view-title">Grocery list</h2>
        </div>
        <div className="empty-state">
          <p>Your grocery list is empty.</p>
          <p className="view-sub">
            Add meals to your list from the <strong>Meals</strong> tab and their
            ingredients will roll up here automatically.
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
          <p className="view-sub">
            {cartMeals.length} meal{cartMeals.length > 1 ? 's' : ''} · {totalServings} servings
            total
          </p>
        </div>
        <div className="view-header__actions">
          <button className="btn btn--ghost btn--sm" onClick={copyList}>
            📋 Copy
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              if (confirm('Clear the grocery list?')) {
                clearCart()
                setChecked(new Set())
              }
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grocery-meals">
        {cartMeals.map(({ meal, batches }) => (
          <div key={meal.id} className="grocery-meal">
            <span className="grocery-meal__name">{meal.name}</span>
            <div className="stepper stepper--sm">
              <button className="stepper__btn" onClick={() => setCartBatches(meal.id, batches - 1)}>
                −
              </button>
              <span className="stepper__val">
                ×{batches} ({meal.servings * batches} srv)
              </span>
              <button className="stepper__btn" onClick={() => setCartBatches(meal.id, batches + 1)}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>

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
