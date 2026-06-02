import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, Component, Meal, Targets } from './types'
import { DEFAULT_PERIOD_DAYS, DEFAULT_TARGETS, SEED_COMPONENTS, SEED_MEALS } from './seed'

const STORAGE_KEY = 'meal-planner.state.v2'

function initialState(): AppState {
  return {
    components: SEED_COMPONENTS,
    meals: SEED_MEALS,
    targets: DEFAULT_TARGETS,
    periodDays: DEFAULT_PERIOD_DAYS,
    prep: {},
    seeded: true,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    // Merge defensively so older/partial saved states still hydrate cleanly,
    // and backfill servingsPerBatch on any component missing it.
    const components = (parsed.components ?? SEED_COMPONENTS).map((c) => ({
      ...c,
      servingsPerBatch: c.servingsPerBatch && c.servingsPerBatch > 0 ? c.servingsPerBatch : 4,
    }))
    return {
      components,
      meals: parsed.meals ?? SEED_MEALS,
      targets: parsed.targets ?? DEFAULT_TARGETS,
      periodDays: parsed.periodDays ?? DEFAULT_PERIOD_DAYS,
      prep: parsed.prep ?? {},
      seeded: parsed.seeded ?? true,
    }
  } catch {
    return initialState()
  }
}

function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}-${rand}`
}

interface Store {
  state: AppState
  // components
  addComponent: (c: Omit<Component, 'id'>) => Component
  updateComponent: (c: Component) => void
  deleteComponent: (id: string) => void
  // meals (assembly ideas)
  addMeal: (m: Omit<Meal, 'id'>) => Meal
  updateMeal: (m: Meal) => void
  deleteMeal: (id: string) => void
  // targets & period
  setTargets: (t: Targets) => void
  setPeriodDays: (days: number) => void
  // prep plan
  setPrepServings: (componentId: string, servings: number) => void
  addServingsToPrep: (componentIds: string[], delta: number) => void
  setPrep: (prep: Record<string, number>) => void
  clearPrep: () => void
  // data
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or unavailable — non-fatal, app keeps working in-memory.
    }
  }, [state])

  const addComponent = useCallback((c: Omit<Component, 'id'>) => {
    const created: Component = { ...c, id: uid('cmp') }
    setState((s) => ({ ...s, components: [...s.components, created] }))
    return created
  }, [])

  const updateComponent = useCallback((c: Component) => {
    setState((s) => ({
      ...s,
      components: s.components.map((x) => (x.id === c.id ? c : x)),
    }))
  }, [])

  const deleteComponent = useCallback((id: string) => {
    setState((s) => {
      const prep = { ...s.prep }
      delete prep[id]
      return {
        ...s,
        components: s.components.filter((x) => x.id !== id),
        // Drop the component from any meal ideas that referenced it.
        meals: s.meals.map((m) => ({
          ...m,
          componentIds: m.componentIds.filter((cid) => cid !== id),
        })),
        prep,
      }
    })
  }, [])

  const addMeal = useCallback((m: Omit<Meal, 'id'>) => {
    const created: Meal = { ...m, id: uid('meal') }
    setState((s) => ({ ...s, meals: [...s.meals, created] }))
    return created
  }, [])

  const updateMeal = useCallback((m: Meal) => {
    setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === m.id ? m : x)) }))
  }, [])

  const deleteMeal = useCallback((id: string) => {
    setState((s) => ({ ...s, meals: s.meals.filter((x) => x.id !== id) }))
  }, [])

  const setTargets = useCallback((t: Targets) => {
    setState((s) => ({ ...s, targets: t }))
  }, [])

  const setPeriodDays = useCallback((days: number) => {
    setState((s) => ({ ...s, periodDays: Math.max(1, Math.round(days) || 1) }))
  }, [])

  const setPrepServings = useCallback((componentId: string, servings: number) => {
    setState((s) => {
      const prep = { ...s.prep }
      if (servings <= 0) delete prep[componentId]
      else prep[componentId] = servings
      return { ...s, prep }
    })
  }, [])

  const addServingsToPrep = useCallback((componentIds: string[], delta: number) => {
    setState((s) => {
      const prep = { ...s.prep }
      for (const id of componentIds) {
        const next = (prep[id] ?? 0) + delta
        if (next <= 0) delete prep[id]
        else prep[id] = next
      }
      return { ...s, prep }
    })
  }, [])

  const setPrep = useCallback((prep: Record<string, number>) => {
    setState((s) => ({ ...s, prep }))
  }, [])

  const clearPrep = useCallback(() => setState((s) => ({ ...s, prep: {} })), [])

  const resetAll = useCallback(() => setState(initialState()), [])

  const value = useMemo<Store>(
    () => ({
      state,
      addComponent,
      updateComponent,
      deleteComponent,
      addMeal,
      updateMeal,
      deleteMeal,
      setTargets,
      setPeriodDays,
      setPrepServings,
      addServingsToPrep,
      setPrep,
      clearPrep,
      resetAll,
    }),
    [
      state,
      addComponent,
      updateComponent,
      deleteComponent,
      addMeal,
      updateMeal,
      deleteMeal,
      setTargets,
      setPeriodDays,
      setPrepServings,
      addServingsToPrep,
      setPrep,
      clearPrep,
      resetAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}
