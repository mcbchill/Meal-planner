# 🥗 Meal Planner

A component-based meal planner inspired by **Ethan Chlebowski's mix-and-match
meal prep system**, with built-in **calorie and protein targets** for weight
loss.

Instead of cooking five rigid recipes, you keep a **library of prepped
components** and assemble meals by mixing and matching them. Switching the
**sauce** is usually all it takes to turn the same base + protein into a whole
new cuisine.

## The system

A meal is built from five roles:

| Role | Examples | Purpose |
| --- | --- | --- |
| 🍚 **Base / Carb** | rice, farro, quinoa, potatoes, greens | the foundation |
| 🍗 **Protein** | chicken, tofu, beef, chickpeas, shrimp | the anchor — keep it high |
| 🥦 **Vegetable** | roasted broccoli, slaw, cucumber-tomato | volume & fiber |
| 🥣 **Sauce / Flavor** | chipotle crema, peanut, lemon-tahini | the cuisine driver |
| 🌿 **Garnish / Texture** | herbs, feta, sesame, avocado | the finishing touch |

A handful of components per role yields dozens of distinct meals.

## Features

- **Component library** — manage your bank of building blocks by category and
  flavor profile, each with per-serving nutrition and grocery ingredients.
- **Meal builder** — mix & match components into a meal, pick a form factor
  (bowl / salad / wrap / tacos…), and watch calories + protein total up live
  against your daily targets. A 🎲 *Surprise me* button auto-picks on-profile
  components.
- **Week planner** — assign meals to each day of the week and see that day's
  total calories and protein vs. your targets, plus a daily average across the
  week. Days flag when they go over calories or hit protein-dense.
- **Calorie & protein targets** — set a daily goal; every meal shows what % of
  your targets it covers and flags **protein-dense** meals (≥ 8 g protein per
  100 kcal) — the sweet spot for staying full while losing weight.
- **Grocery list** — add meals (in batches) and their ingredients roll up into
  one de-duplicated, checkable shopping list you can copy to the clipboard.

All data is saved in your browser (localStorage) — no account, works offline.

## Run it

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Tech

React 18 · TypeScript · Vite. State lives in a small React context
(`src/store.tsx`) persisted to `localStorage`. No backend.

```
src/
  types.ts            domain model (components, meals, nutrition, targets)
  seed.ts             starter component & meal library
  nutrition.ts        macro math + grocery aggregation
  store.tsx           localStorage-backed state context
  components/         shared UI (targets bar, macros, progress, modal)
  views/              ComponentLibrary, MealBuilder, MealForm, WeekPlanner, GroceryList
```
