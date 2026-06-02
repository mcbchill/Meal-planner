import type { Nutrition } from '../types'
import { proteinDensity, roundNutrition } from '../nutrition'

/** Compact macro readout used on meal and component cards. */
export function NutritionStats({
  nutrition,
  showDensity = false,
}: {
  nutrition: Nutrition
  showDensity?: boolean
}) {
  const n = roundNutrition(nutrition)
  const density = proteinDensity(nutrition)
  return (
    <div className="macros">
      <span className="macro macro--cal">{n.calories} kcal</span>
      <span className="macro macro--protein">{n.protein}g protein</span>
      <span className="macro">{n.carbs}g carbs</span>
      <span className="macro">{n.fat}g fat</span>
      {showDensity && nutrition.calories > 0 && (
        <span
          className={`macro macro--density ${density >= 8 ? 'macro--good' : ''}`}
          title="Grams of protein per 100 kcal — higher is more filling per calorie"
        >
          {density.toFixed(1)} g/100kcal
        </span>
      )}
    </div>
  )
}

/** A labeled progress bar comparing a value against a target. */
export function TargetProgress({
  label,
  value,
  target,
  unit,
  variant,
}: {
  label: string
  value: number
  target: number
  unit: string
  variant: 'cal' | 'protein'
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  const over = target > 0 && value > target
  return (
    <div className="progress">
      <div className="progress__head">
        <span className="progress__label">{label}</span>
        <span className="progress__nums">
          {over && <span className="progress__flag">▲ over</span>}
          {Math.round(value)} / {target} {unit}
        </span>
      </div>
      <div className="progress__track">
        <div
          className={`progress__fill progress__fill--${variant} ${over ? 'progress__fill--over' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
