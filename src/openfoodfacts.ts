import type { Nutrition } from './types'

// Open Food Facts is a free, CORS-enabled food database (no API key needed).
// We use it to auto-fill a component's macros by name search or barcode.

export interface FoodHit {
  id: string
  name: string
  brand?: string
  nutrition: Nutrition
  /** Whether the macros are per serving or per 100 g. */
  basis: 'serving' | '100 g'
  servingSize?: string
}

type Nutriments = Record<string, number | string | undefined>

const FIELDS = 'code,product_name,generic_name,brands,serving_size,nutriments'

function num(v: number | string | undefined): number | undefined {
  return typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : undefined
}

function kcal(n: Nutriments, suffix: string): number {
  const k = num(n[`energy-kcal${suffix}`])
  if (k !== undefined) return k
  const kj = num(n[`energy${suffix}`])
  if (kj !== undefined) return kj / 4.184 // kJ → kcal
  return 0
}

function toNutrition(n: Nutriments, suffix: string): Nutrition {
  return {
    calories: Math.round(kcal(n, suffix)),
    protein: Math.round(num(n[`proteins${suffix}`]) ?? 0),
    carbs: Math.round(num(n[`carbohydrates${suffix}`]) ?? 0),
    fat: Math.round(num(n[`fat${suffix}`]) ?? 0),
  }
}

interface OffProduct {
  code?: string
  product_name?: string
  generic_name?: string
  brands?: string
  serving_size?: string
  nutriments?: Nutriments
}

function toHit(p: OffProduct): FoodHit | null {
  const n = p.nutriments ?? {}
  const hasServing =
    num(n['energy-kcal_serving']) !== undefined || num(n['proteins_serving']) !== undefined
  const suffix = hasServing ? '_serving' : '_100g'
  const nutrition = toNutrition(n, suffix)
  if (nutrition.calories === 0 && nutrition.protein === 0) return null
  const name = (p.product_name || p.generic_name || '').trim()
  if (!name) return null
  return {
    id: p.code || name,
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    nutrition,
    basis: hasServing ? 'serving' : '100 g',
    servingSize: p.serving_size || undefined,
  }
}

export async function searchFoods(query: string): Promise<FoodHit[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=15&fields=${FIELDS}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Food search failed')
  const data = (await res.json()) as { products?: OffProduct[] }
  const hits: FoodHit[] = []
  for (const p of data.products ?? []) {
    const hit = toHit(p)
    if (hit) hits.push(hit)
    if (hits.length >= 10) break
  }
  return hits
}

export async function lookupBarcode(code: string): Promise<FoodHit | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { status?: number; product?: OffProduct }
  if (data.status !== 1 || !data.product) return null
  return toHit(data.product)
}
