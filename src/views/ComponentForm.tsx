import { useEffect, useRef, useState } from 'react'
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
import { lookupBarcode, searchFoods, type FoodHit } from '../openfoodfacts'

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

  // --- Open Food Facts autofill ---
  const [lookup, setLookup] = useState('')
  const [hits, setHits] = useState<FoodHit[]>([])
  const [searching, setSearching] = useState(false)
  const [offError, setOffError] = useState('')
  const [filledFrom, setFilledFrom] = useState('')
  const [scanning, setScanning] = useState(false)
  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window

  function applyHit(hit: FoodHit) {
    setCalories(String(hit.nutrition.calories))
    setProtein(String(hit.nutrition.protein))
    setCarbs(String(hit.nutrition.carbs))
    setFat(String(hit.nutrition.fat))
    if (!name.trim()) setName(hit.brand ? `${hit.name} (${hit.brand})` : hit.name)
    setFilledFrom(
      `Filled from “${hit.name}” · per ${hit.basis}${hit.servingSize ? ` (${hit.servingSize})` : ''}. Adjust to your portion.`,
    )
    setHits([])
  }

  async function runSearch() {
    const q = lookup.trim()
    if (!q) return
    setSearching(true)
    setOffError('')
    setHits([])
    try {
      // A pure-digit query is treated as a barcode.
      if (/^\d{6,}$/.test(q)) {
        const hit = await lookupBarcode(q)
        if (hit) applyHit(hit)
        else setOffError('No product found for that barcode.')
      } else {
        const results = await searchFoods(q)
        if (results.length === 0) setOffError('No matches found.')
        setHits(results)
      }
    } catch {
      setOffError('Lookup failed — check your connection and try again.')
    } finally {
      setSearching(false)
    }
  }

  async function onScanned(code: string) {
    setScanning(false)
    setLookup(code)
    setSearching(true)
    setOffError('')
    try {
      const hit = await lookupBarcode(code)
      if (hit) applyHit(hit)
      else setOffError(`No product found for barcode ${code}.`)
    } catch {
      setOffError('Lookup failed — check your connection and try again.')
    } finally {
      setSearching(false)
    }
  }

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
          <span>🔎 Auto-fill nutrition</span>
          <div className="autofill">
            <div className="autofill__row">
              <input
                className="input autofill__input"
                placeholder="Search a food or enter a barcode…"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch()
                  }
                }}
              />
              <button type="button" className="btn btn--soft btn--sm" disabled={searching} onClick={runSearch}>
                {searching ? '…' : 'Look up'}
              </button>
              {canScan && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setScanning(true)}
                  title="Scan a barcode with your camera"
                >
                  📷
                </button>
              )}
            </div>
            {offError && <p className="autofill__error">{offError}</p>}
            {hits.length > 0 && (
              <ul className="autofill__hits">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button type="button" className="autofill__hit" onClick={() => applyHit(h)}>
                      <span className="autofill__hit-name">
                        {h.name}
                        {h.brand ? <span className="autofill__hit-brand"> · {h.brand}</span> : null}
                      </span>
                      <span className="autofill__hit-macro">
                        {h.nutrition.calories} kcal · {h.nutrition.protein}g P / {h.basis}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {filledFrom && <p className="autofill__note">{filledFrom}</p>}
            <p className="field-hint">Powered by Open Food Facts. Values are estimates — tweak per your portion.</p>
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

      {scanning && <BarcodeScanner onDetect={onScanned} onClose={() => setScanning(false)} />}
    </Modal>
  )
}

/** Camera barcode scanner using the native BarcodeDetector API (where supported). */
function BarcodeScanner({
  onDetect,
  onClose,
}: {
  onDetect: (code: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    // BarcodeDetector isn't in TS's lib DOM types yet.
    const Detector = (window as unknown as { BarcodeDetector: new (o?: unknown) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector
    const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (stopped) return
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        const tick = async () => {
          if (stopped || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes[0]?.rawValue) {
              onDetect(codes[0].rawValue)
              return
            }
          } catch {
            // transient detect errors are fine — keep scanning
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch {
        setError('Could not access the camera. Enter the barcode digits instead.')
      }
    }
    start()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onDetect])

  return (
    <Modal title="Scan a barcode" onClose={onClose}>
      {error ? (
        <p className="autofill__error">{error}</p>
      ) : (
        <div className="scanner">
          <video ref={videoRef} className="scanner__video" muted playsInline />
          <p className="field-hint">Point your camera at a product barcode.</p>
        </div>
      )}
    </Modal>
  )
}
