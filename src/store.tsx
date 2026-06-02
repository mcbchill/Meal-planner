import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, Component, Day, Meal, Targets } from './types'
import { emptyWeekPlan } from './types'
import { DEFAULT_TARGETS, SEED_COMPONENTS, SEED_MEALS } from './seed'

const STORAGE_KEY = 'meal-planner.state.v1'

function initialState(): AppState {
  return {
    components: SEED_COMPONENTS,
    meals: SEED_MEALS,
    targets: DEFAULT_TARGETS,
    cart: {},
    plan: emptyWeekPlan(),
    seeded: true,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    // Merge defensively so older/partial saved states still hydrate cleanly.
    return {
      components: parsed.components ?? SEED_COMPONENTS,
      meals: parsed.meals ?? SEED_MEALS,
      targets: parsed.targets ?? DEFAULT_TARGETS,
      cart: parsed.cart ?? {},
      plan: { ...emptyWeekPlan(), ...(parsed.plan ?? {}) },
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
  // meals
  addMeal: (m: Omit<Meal, 'id'>) => Meal
  updateMeal: (m: Meal) => void
  deleteMeal: (id: string) => void
  // targets
  setTargets: (t: Targets) => void
  // cart
  setCartBatches: (mealId: string, batches: number) => void
  clearCart: () => void
  // weekly plan
  addMealToDay: (day: Day, mealId: string) => void
  removeMealFromDay: (day: Day, index: number) => void
  clearDay: (day: Day) => void
  clearPlan: () => void
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
    setState((s) => ({
      ...s,
      components: s.components.filter((x) => x.id !== id),
      // Drop the component from any meals that referenced it.
      meals: s.meals.map((m) => ({
        ...m,
        componentIds: m.componentIds.filter((cid) => cid !== id),
      })),
    }))
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
    setState((s) => {
      const cart = { ...s.cart }
      delete cart[id]
      // Also strip the deleted meal from every planned day.
      const plan = Object.fromEntries(
        Object.entries(s.plan).map(([day, ids]) => [day, ids.filter((mid) => mid !== id)]),
      ) as typeof s.plan
      return { ...s, meals: s.meals.filter((x) => x.id !== id), cart, plan }
    })
  }, [])

  const setTargets = useCallback((t: Targets) => {
    setState((s) => ({ ...s, targets: t }))
  }, [])

  const setCartBatches = useCallback((mealId: string, batches: number) => {
    setState((s) => {
      const cart = { ...s.cart }
      if (batches <= 0) delete cart[mealId]
      else cart[mealId] = batches
      return { ...s, cart }
    })
  }, [])

  const clearCart = useCallback(() => setState((s) => ({ ...s, cart: {} })), [])

  const addMealToDay = useCallback((day: Day, mealId: string) => {
    setState((s) => ({ ...s, plan: { ...s.plan, [day]: [...s.plan[day], mealId] } }))
  }, [])

  const removeMealFromDay = useCallback((day: Day, index: number) => {
    setState((s) => ({
      ...s,
      plan: { ...s.plan, [day]: s.plan[day].filter((_, i) => i !== index) },
    }))
  }, [])

  const clearDay = useCallback((day: Day) => {
    setState((s) => ({ ...s, plan: { ...s.plan, [day]: [] } }))
  }, [])

  const clearPlan = useCallback(() => setState((s) => ({ ...s, plan: emptyWeekPlan() })), [])

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
      setCartBatches,
      clearCart,
      addMealToDay,
      removeMealFromDay,
      clearDay,
      clearPlan,
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
      setCartBatches,
      clearCart,
      addMealToDay,
      removeMealFromDay,
      clearDay,
      clearPlan,
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
