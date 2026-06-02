import { useState } from 'react'
import { useStore } from './store'
import { PrepPlan } from './views/PrepPlan'
import { ComponentLibrary } from './views/ComponentLibrary'
import { MealBuilder } from './views/MealBuilder'
import { GroceryList } from './views/GroceryList'
import { TargetsBar } from './components/TargetsBar'

type Tab = 'prep' | 'ideas' | 'components' | 'grocery'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'prep', label: 'Prep plan', emoji: '🗓️' },
  { id: 'ideas', label: 'Ideas', emoji: '🍽️' },
  { id: 'components', label: 'Components', emoji: '🧩' },
  { id: 'grocery', label: 'Grocery', emoji: '🛒' },
]

const ONBOARD_KEY = 'meal-planner.onboarded'

export default function App() {
  const [tab, setTab] = useState<Tab>('prep')
  const { state } = useStore()
  const prepItemCount = Object.keys(state.prep).length
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem(ONBOARD_KEY) !== '1'
    } catch {
      return false
    }
  })

  function dismissIntro() {
    setShowIntro(false)
    try {
      localStorage.setItem(ONBOARD_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__title">
          <span className="logo">🥗</span>
          <div>
            <h1>Meal Planner</h1>
            <p className="tagline">Prep-first planning · hit your calorie &amp; protein targets</p>
          </div>
        </div>
        <TargetsBar />
      </header>

      {showIntro && (
        <div className="intro" role="note">
          <span className="intro__text">
            👋 <strong>Prep-first:</strong> pick a <em>Prep plan</em> template, batch-cook those
            servings, and as long as you eat what you prepped you'll hit your targets — assemble
            meals however you like day to day.
          </span>
          <button className="intro__close" aria-label="Dismiss intro" onClick={dismissIntro}>
            Got it
          </button>
        </div>
      )}

      <nav className="tabs" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab__emoji">{t.emoji}</span>
            {t.label}
            {t.id === 'grocery' && prepItemCount > 0 && (
              <span className="tab__badge" aria-label={`${prepItemCount} items to prep`}>
                {prepItemCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'prep' && <PrepPlan />}
        {tab === 'ideas' && <MealBuilder />}
        {tab === 'components' && <ComponentLibrary />}
        {tab === 'grocery' && <GroceryList />}
      </main>

      <footer className="app-footer">
        <span>
          Inspired by Ethan Chlebowski's component-based meal prep · data saved
          in your browser
        </span>
      </footer>
    </div>
  )
}
