# 🥗 Meal Planner

A component-based meal planner inspired by **Ethan Chlebowski's mix-and-match
meal prep system**, with built-in **calorie and protein targets** for weight
loss.

It's **prep-first**: instead of planning rigid day-by-day meals, you decide how
many **servings of each component** you'll batch-cook for a period (e.g. 5
days). If the total calories and protein you prep cover your period target,
you'll hit your goals — however you mix and match meals day to day. Switching
the **sauce** is usually all it takes to turn the same base + protein into a
whole new cuisine.

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

- **Prep plan** (the main view) — pick a period length (default 5 days) and set
  how many **servings of each component** you'll batch-cook. Running totals show
  total calories & protein vs. your period target (daily × days) and the per-day
  average, so you can see at a glance whether your prep covers your goals.
- **Component library** — manage your bank of building blocks by category and
  flavor profile, each with per-serving nutrition, a servings-per-batch yield,
  and grocery ingredients.
- **Assembly ideas** — saved component combos for inspiration (bowl / wrap /
  tacos…), decoupled from your targets. Send any idea to the prep plan to add a
  serving of each of its components.
- **Calorie & protein targets** — set a daily goal; the prep plan scales it to
  your period and flags **protein-dense** prep (≥ 8 g protein per 100 kcal) —
  the sweet spot for staying full while losing weight.
- **Grocery list** — derived straight from your prep plan: a "to cook"
  checklist (with batch counts) plus a de-duplicated, checkable shopping list
  you can copy to the clipboard.

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
  types.ts            domain model (components, meals, nutrition, targets, prep)
  seed.ts             starter component & idea library
  nutrition.ts        macro math + prep totals + grocery aggregation
  store.tsx           localStorage-backed state context
  components/         shared UI (targets bar, macros, progress, modal)
  views/              PrepPlan, ComponentLibrary, MealBuilder, MealForm, GroceryList
```
