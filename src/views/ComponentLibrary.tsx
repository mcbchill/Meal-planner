import { useMemo, useState } from 'react'
import { useStore } from '../store'
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  FLAVOR_PROFILES,
  type Category,
  type Component,
  type FlavorProfile,
} from '../types'
import { NutritionStats } from '../components/NutritionStats'
import { useToast } from '../components/Toast'
import { ComponentForm } from './ComponentForm'

export function ComponentLibrary() {
  const { state, deleteComponent, undo } = useStore()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [flavor, setFlavor] = useState<FlavorProfile | 'all'>('all')
  const [editing, setEditing] = useState<Component | null>(null)
  const [creating, setCreating] = useState<Category | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.components.filter((c) => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q)
      const matchesFlavor = flavor === 'all' || c.flavorProfiles.includes(flavor)
      return matchesSearch && matchesFlavor
    })
  }, [state.components, search, flavor])

  return (
    <section>
      <div className="view-header">
        <div>
          <h2 className="view-title">Component library</h2>
          <p className="view-sub">
            Your bank of prepped building blocks. Stock a few per category, then
            mix &amp; match into meals.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input input--search"
          placeholder="Search components…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={flavor}
          onChange={(e) => setFlavor(e.target.value as FlavorProfile | 'all')}
        >
          <option value="all">All flavor profiles</option>
          {FLAVOR_PROFILES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {CATEGORIES.map((cat) => {
        const items = filtered.filter((c) => c.category === cat.id)
        return (
          <div key={cat.id} className="cat-section">
            <div className="cat-section__head">
              <h3 className="cat-section__title">
                <span className="cat-emoji">{cat.emoji}</span> {cat.label}
                <span className="cat-count">{items.length}</span>
              </h3>
              <button className="btn btn--ghost btn--sm" onClick={() => setCreating(cat.id)}>
                + Add {cat.label.split(' ')[0].toLowerCase()}
              </button>
            </div>
            <p className="cat-hint">{cat.hint}</p>
            {items.length === 0 ? (
              <p className="empty-hint">No components here yet.</p>
            ) : (
              <div className="card-grid">
                {items.map((c) => (
                  <article key={c.id} className="card">
                    <div className="card__top">
                      <h4 className="card__name">{c.name}</h4>
                      <div className="card__actions">
                        <button
                          className="icon-btn"
                          title="Edit"
                          onClick={() => setEditing(c)}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn"
                          title="Delete"
                          onClick={() => {
                            deleteComponent(c.id)
                            showToast(`Deleted “${c.name}”`, 'Undo', undo)
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="tag-row">
                      {c.flavorProfiles.map((f) => (
                        <span key={f} className="tag">
                          {f}
                        </span>
                      ))}
                    </div>
                    <NutritionStats nutrition={c.nutrition} showDensity={c.category === 'protein'} />
                    <p className="card__yield">Makes {c.servingsPerBatch} servings / batch</p>
                    {c.notes && <p className="card__notes">{c.notes}</p>}
                  </article>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {(editing || creating) && (
        <ComponentForm
          initial={editing}
          defaultCategory={creating ?? undefined}
          onClose={() => {
            setEditing(null)
            setCreating(null)
          }}
        />
      )}

      {filtered.length === 0 && (
        <p className="empty-hint">
          Nothing matches “{search}”
          {flavor !== 'all' ? ` in ${flavor}` : ''}.
        </p>
      )}

      <p className="footnote">
        Tip: the <strong>{CATEGORY_BY_ID.sauce.label}</strong> usually carries the
        cuisine — swap it to turn the same base + protein into a whole new meal.
      </p>
    </section>
  )
}
