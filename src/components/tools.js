/* =============================================================================
 * tools — the actuarial toolkit. Five working apps written in exactly the
 * Alpine style the course teaches: an x-data scope, getters for derived
 * numbers, x-for for tables, x-bind for charts, x-model.number for inputs.
 *
 * They double as reference implementations for the exercises.
 * ========================================================================== */

import { life, chainLadder, bornhuetterFerguson, triangle, buhlmann, bondMath, varModel, geomMath, moments, returns, rnd } from '../content/data.js'
import { rng, fmt } from '../lib/utils.js'

/* --------------------------------------------------------------- life maths */
export function registerLifeCalc(Alpine) {
  Alpine.data('lifeCalc', () => ({
    x: 40, n: 20, i: 4.5, benefit: 250000, t: 10, product: 'endowment',

    get rate() { return this.i / 100 },
    get aDue() { return life.aDueTemp(this.x, this.n, this.rate) },
    get aWhole() { return life.aDue(this.x, this.rate) },
    get Aterm() { return life.ATerm(this.x, this.n, this.rate) },
    get Aendow() { return life.AEndow(this.x, this.n, this.rate) },
    get Awhole() { return life.A(this.x, this.rate) },
    get sumAssured() { return this.benefit },
    get singlePremium() {
      const A = this.product === 'term' ? this.Aterm : this.product === 'whole' ? this.Awhole : this.Aendow
      return A * this.benefit
    },
    get levelPremium() {
      const annuity = this.product === 'whole' ? this.aWhole : this.aDue
      return annuity ? (this.singlePremium / 1000) / annuity : 0   // per 1,000 sum assured
    },
    get reserve() {
      const t = Math.min(this.t, this.n - 1)
      const P = (this.product === 'term' ? this.Aterm : this.Aendow) / this.aDue
      const future = this.product === 'term' ? life.ATerm(this.x + t, this.n - t, this.rate) : life.AEndow(this.x + t, this.n - t, this.rate)
      const futureAnnuity = life.aDueTemp(this.x + t, this.n - t, this.rate)
      return (future - P * futureAnnuity) * this.benefit
    },
    get qxHere() { return life.qx(this.x) },
    get exHere() { return life.ex(this.x) },
    /** survival curve l(x) sampled every 2 years — quick visual sanity check */
    get curve() {
      const pts = []
      const max = life.omega
      const x0 = Math.max(0, this.x - 10), step = 2
      for (let a = x0; a <= max; a += step) pts.push({ a, v: life.p(x0, a - x0) })
      return pts
    },
    get curvePath() {
      const pts = this.curve
      const w = 560, h = 140, x0 = pts[0].a, x1 = pts[pts.length - 1].a
      return pts.map(p => `${((p.a - x0) / (x1 - x0) * w).toFixed(1)},${(h - p.v * h).toFixed(1)}`).join(' ')
    },
    money: v => fmt.money(v)
  }))
}

/* ------------------------------------------------------- reserving triangle */
export function registerTriangleCalc(Alpine) {
  Alpine.data('triangleCalc', () => ({
    tri: triangle,
    cl: chainLadder(triangle),
    aPrioriLR: 0.65,
    premium: [1500, 1560, 1620, 1690, 1750],
    method: 'cl',

    get bf() { return bornhuetterFerguson(this.tri, this.aPrioriLR, this.premium) },
    get ultimates() { return this.method === 'cl' ? this.cl.ultimates : this.bf.ultimates },
    get ibnr() { return this.method === 'cl' ? this.cl.ibnr : this.bf.ibnr },
    get total() { return this.ibnr.reduce((a, b) => a + b, 0) },
    get reserveByAy() { return this.tri.years.map((y, k) => ({ year: y, latest: this.cl.latest[k], age: this.cl.age[k], ultimate: this.ultimates[k], ibnr: this.ibnr[k] })) },
    get maxUltimate() { return Math.max(...this.ultimates) },
    pct: v => fmt.num(v * 100, 1) + '%',
    k: v => fmt.num(v, 3)
  }))
}

/* ------------------------------------------------------------- credibility */
export function registerCredCalc(Alpine) {
  Alpine.data('credCalc', () => ({
    groups: [
      { name: 'Clinic A', exposure: 200, mean: 420 },
      { name: 'Clinic B', exposure: 350, mean: 385 },
      { name: 'Clinic C', exposure: 150, mean: 470 },
      { name: 'Clinic D', exposure: 300, mean: 400 }
    ],
    EPV: 45000,
    VHM: 400,

    get model() { return buhlmann({ groups: this.groups.map(g => ({ ...g, exposure: Number(g.exposure) || 0, mean: Number(g.mean) || 0 })), EPV: Number(this.EPV) || 1, VHM: Number(this.VHM) || 1 }) },
    get k() { return this.model.k },
    get mu() { return this.model.mu },
    get rows() { return this.model.groups },
    get spread() { return Math.max(...this.groups.map(g => Math.abs(Number(g.mean) - this.mu))) },
    barPath(z) { return Math.round(z * 100) },
    addGroup() { this.groups.push({ name: 'New group', exposure: 100, mean: Math.round(this.mu) }) },
    removeGroup(i) { if (this.groups.length > 2) this.groups.splice(i, 1) }
  }))
}

/* ------------------------------------------------------------------ finance */
export function registerBondCalc(Alpine) {
  Alpine.data('bondCalc', () => ({
    face: 1000, coupon: 4.5, years: 5, ytm: 5.2,
    get model() { return bondMath({ face: this.face, coupon: this.coupon / 100, years: Math.max(1, Math.round(this.years)), ytm: this.ytm / 100 }) },
    get price() { return this.model.price },
    get duration() { return this.model.modified },
    get convexity() { return this.model.convexity },
    /** Price after a parallel shift dy, using duration + convexity. */
    shift(dy) {
      const p = this.price
      return p * (1 - this.duration * dy + 0.5 * this.convexity * dy * dy)
    },
    get curve() {
      const pts = []
      for (let y = 0.5; y <= 12; y += 0.25) {
        const m = bondMath({ face: this.face, coupon: this.coupon / 100, years: Math.max(1, Math.round(this.years)), ytm: y / 100 })
        pts.push({ y, p: m.price })
      }
      return pts
    },
    get curvePath() {
      const pts = this.curve
      const min = Math.min(...pts.map(p => p.p)), max = Math.max(...pts.map(p => p.p))
      return pts.map(p => `${((p.y - 0.5) / 11.5 * 560).toFixed(1)},${(150 - (p.p - min) / (max - min) * 140).toFixed(1)}`).join(' ')
    },
    get markX() { return ((this.ytm - 0.5) / 11.5 * 560).toFixed(1) },
    get markY() {
      const pts = this.curve, min = Math.min(...pts.map(p => p.p)), max = Math.max(...pts.map(p => p.p))
      return (150 - (this.price - min) / (max - min) * 140).toFixed(1)
    },
    money: v => fmt.money(v)
  }))
}

/* ------------------------------------------------- Monte-Carlo aggregate risk */
function gammaSample(k, scale, rand) {
  if (k < 1) return gammaSample(k + 1, scale, rand) * Math.pow(rand(), 1 / k)
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x, v
    do { x = normalSample(rand); v = 1 + c * x } while (v <= 0)
    v = v * v * v
    const u = rand()
    if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale
  }
}
function normalSample(rand) {
  let u = 0, v = 0
  while (u === 0) u = rand()
  while (v === 0) v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
function poissonSample(lambda, rand) {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= rand() } while (p > L)
  return k - 1
}

export function registerVarSim(Alpine) {
  Alpine.data('varSim', () => ({
    lambda: varModel.lambda,
    mu: varModel.mu,
    sigma: varModel.sigma,
    trials: 2000,
    premium: varModel.premium,
    seed: 42,
    running: false,
    losses: [],
    buckets: [],

    get shape() { return (this.mu ** 2) / (this.sigma ** 2) },
    get scale() { return (this.sigma ** 2) / this.mu },
    get expected() { return this.lambda * this.mu },
    get sd() { return Math.sqrt(this.lambda * (this.sigma ** 2 + this.mu ** 2)) },

    run() {
      this.running = true
      const rand = rng(Number(this.seed) || 1)
      const n = Math.min(200000, Math.max(100, Math.round(this.trials)))
      const losses = new Array(n)
      for (let i = 0; i < n; i++) {
        const count = poissonSample(this.lambda, rand)
        let sum = 0
        for (let j = 0; j < count; j++) sum += gammaSample(this.shape, this.scale, rand)
        losses[i] = sum
      }
      this.losses = losses.sort((a, b) => a - b)
      this.buckets = this.buildBuckets(this.losses)
      this.running = false
    },

    buildBuckets(sorted) {
      const max = sorted[sorted.length - 1] || 1
      const nb = 18, step = max / nb
      const b = Array.from({ length: nb }, (_, i) => ({ from: i * step, to: (i + 1) * step, n: 0 }))
      for (const v of sorted) {
        const idx = Math.min(nb - 1, Math.floor(v / step))
        b[idx].n++
      }
      const peak = Math.max(...b.map(x => x.n))
      b.forEach(x => { x.h = Math.round((x.n / peak) * 100) })
      return b
    },

    quantile(q) {
      if (!this.losses.length) return 0
      return this.losses[Math.min(this.losses.length - 1, Math.floor(q * this.losses.length))]
    },
    get var99() { return this.quantile(0.99) },
    get tvar99() {
      if (!this.losses.length) return 0
      const tail = this.losses.slice(Math.floor(0.99 * this.losses.length))
      return tail.reduce((a, b) => a + b, 0) / (tail.length || 1)
    },
    get ruin() { return this.losses.length ? this.losses.filter(l => l > this.premium).length / this.losses.length : 0 },
    get ratio() { return this.premium ? this.expected / this.premium : 0 },
    money: v => fmt.money(v, 'USD', 0)
  }))
}

/* ------------------------------------------------------------------ statistics */
export function registerStatsTool(Alpine) {
  Alpine.data('statsTool', () => ({
    xs: returns.slice(),
    inspect: 'moments',
    get m() { return moments(this.xs.map(Number).filter(Number.isFinite)) },
    get sorted() { return this.xs.map(Number).filter(Number.isFinite).slice().sort((a, b) => a - b) },
    get hist() {
      const xs = this.sorted
      if (!xs.length) return []
      const min = Math.min(...xs), max = Math.max(...xs)
      const nb = 10, step = (max - min) / nb || 1
      const b = Array.from({ length: nb }, (_, i) => ({ from: min + i * step, to: min + (i + 1) * step, n: 0 }))
      for (const v of xs) b[Math.min(nb - 1, Math.floor((v - min) / step))].n++
      const peak = Math.max(...b.map(x => x.n))
      b.forEach(x => { x.h = Math.round((x.n / peak) * 100) })
      return b
    },
    get kl() {
      const p = this.m.mean / 100 > 0 && this.m.mean / 100 < 1 ? this.m.mean / 100 : 0.25
      const eps = 1e-6
      return (x => x * Math.log(x / 0.4) + (1 - x) * Math.log((1 - x) / 0.6))(Math.min(1 - eps, Math.max(eps, p)))
    },
    geom: geomMath,
    add() { this.xs.push(0) },
    remove(i) { if (this.xs.length > 3) this.xs.splice(i, 1) },
    reset() { this.xs = returns.slice() },
    n: (v, d = 4) => rnd(v, d)
  }))
}

export const TOOLS = ['lifeCalc', 'triangleCalc', 'credCalc', 'bondCalc', 'varSim', 'statsTool']
