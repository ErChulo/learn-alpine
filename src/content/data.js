/* =============================================================================
 * data.js — the actuarial / statistical / geometric playground used by every
 * exercise, quiz item and calculator in the course.
 *
 * Everything here is *generated deterministically* from a handful of stated
 * assumptions. Exercises never hard-code an expected answer: they import the
 * helper (e.g. `life.p(40, 20)`) so the check and the data can never drift.
 *
 * The mortality table below is a Gompertz–Makeham teaching table built with
 * mu(x) = A + B·c^x,  A = 0.0005, B = 0.00004, c = 1.10, calibrated to look
 * like a modern insured-lives table (q40 ≈ 0.23 %, q60 ≈ 1.3 %, q80 ≈ 8.2 %).
 * It is illustrative — not an official table.
 * ========================================================================== */

import { rnd } from '../lib/utils.js'

/* ----------------------------------------------------------------- life table */

const GM = { A: 0.0005, B: 0.00004, c: 1.10 }

export const qx = x => 1 - Math.exp(-(GM.A + GM.B * Math.pow(GM.c, x)))

const OMEGA = 120
const lx = [100000]
for (let x = 0; x < OMEGA; x++) lx.push(lx[x] * (1 - qx(x)))
lx[OMEGA] = 0

export const life = {
  omega: OMEGA,
  qx,
  lx: x => (x >= OMEGA ? 0 : lx[Math.round(x)]),
  dx: x => life.lx(x) - life.lx(x + 1),
  /** n years of survival probability: ₙpₓ */
  p: (x, n) => life.lx(x + n) / life.lx(x),
  /** n years of death probability: ₙqₓ */
  q: (x, n) => 1 - life.p(x, n),
  /** deferred death probability: ₘ|ₙqₓ */
  deferQ: (x, m, n) => life.p(x, m) * life.q(x + m, n),
  /** curtate expectation of life, eₓ */
  ex: (x) => { let s = 0; for (let k = 0; k < OMEGA - x; k++) s += life.p(x, k + 1); return s },

  /* commutation functions — D, C, M, N, S (used by the annuity exercises) */
  D(x, i = 0.05) { return life.lx(x) * Math.pow(1 + i, -x) },
  C(x, i = 0.05) { return life.dx(x) * Math.pow(1 + i, -(x + 1)) },
  N(x, i = 0.05) { let s = 0; for (let k = x; k < OMEGA; k++) s += life.D(k, i); return s },
  M(x, i = 0.05) { let s = 0; for (let k = x; k < OMEGA; k++) s += life.C(k, i); return s },
  S(x, i = 0.05) { let s = 0; for (let k = x; k < OMEGA; k++) s += life.N(k, i); return s },

  /** Whole-life annuity-due a-double-dot: äₓ = Nₓ / Dₓ */
  aDue: (x, i = 0.05) => life.N(x, i) / life.D(x, i),
  /** Temporary annuity-due: äₓ:ₙ = (Nₓ − Nₓ₊ₙ) / Dₓ */
  aDueTemp: (x, n, i = 0.05) => (life.N(x, i) - life.N(x + n, i)) / life.D(x, i),
  /** Deferred annuity-due: ₘ|äₓ = (Nₓ₊ₘ) / Dₓ */
  aDueDefer: (x, m, i = 0.05) => life.N(x + m, i) / life.D(x, i),
  /** Whole-life insurance Aₓ = Mₓ / Dₓ (death benefit at end of year) */
  A: (x, i = 0.05) => life.M(x, i) / life.D(x, i),
  /** Term insurance A¹ₓ:ₙ */
  ATerm: (x, n, i = 0.05) => (life.M(x, i) - life.M(x + n, i)) / life.D(x, i),
  /** Endowment: Aₓ:ₙ = (Mₓ − Mₓ₊ₙ + Dₓ₊ₙ) / Dₓ */
  AEndow: (x, n, i = 0.05) => (life.M(x, i) - life.M(x + n, i) + life.D(x + n, i)) / life.D(x, i),
  /** Net level annual premium for a whole-life policy (benefit 1). */
  netPremium: (x, i = 0.05) => life.A(x, i) / life.aDue(x, i),
  /** Prospective net premium reserve at duration t: V_t = A_{x+t} − P · ä_{x+t} */
  reserve: (x, t, i = 0.05) => life.A(x + t, i) - life.netPremium(x, i) * life.aDue(x + t, i)
}

/* --------------------------------------------------------------- loss triangle */

/** Cumulative paid losses ($000) — accident year × development year. */
export const triangle = {
  years: [2021, 2022, 2023, 2024, 2025],
  /** rows: AY, index in row = development lag (0 = 12 months). */
  rows: [
    [100, 145, 178, 195, 205, 210],
    [110, 160, 199, 220, 232],
    [121, 177, 221, 245],
    [133, 196, 245],
    [147, 217]
  ]
}

export const chainLadder = (t = triangle) => {
  const rows = t.rows
  const maxLag = Math.max(...rows.map(r => r.length)) - 1
  const f = []
  for (let lag = 0; lag < maxLag; lag++) {
    let num = 0, den = 0
    for (const r of rows) if (r.length > lag + 1) { num += r[lag + 1]; den += r[lag] }
    f.push(num / den)
  }
  const latest = rows.map(r => r[r.length - 1])
  const age = rows.map(r => r.length - 1)
  const ultimates = rows.map((r, k) => latest[k] * f.slice(age[k]).reduce((a, b) => a * b, 1))
  const ibnr = ultimates.map((u, k) => u - latest[k])
  return { factors: f, latest, age, ultimates, ibnr, totalIBNR: ibnr.reduce((a, b) => a + b, 0) }
}

/** Bornhuetter–Ferguson with an a-priori expected loss ratio. */
export const bornhuetterFerguson = (t = triangle, aPrioriLR = 0.65, premium = [1500, 1560, 1620, 1690, 1750]) => {
  const cl = chainLadder(t)
  const maxLag = cl.factors.length
  const reportPct = t.rows.map(r => 1 / cl.factors.slice(r.length - 1).reduce((a, b) => a * b, 1))
  const ultimates = t.rows.map((r, k) => cl.latest[k] + aPrioriLR * premium[k] * (1 - reportPct[k]))
  return {
    reportPct,
    aPrioriUltimate: premium.map(p => aPrioriLR * p),
    ultimates,
    ibnr: ultimates.map((u, k) => u - cl.latest[k])
  }
}

/* ---------------------------------------------------------------- credibility */

export const credibility = {
  groups: [
    { name: 'Clinic A', exposure: 200, mean: 420 },
    { name: 'Clinic B', exposure: 350, mean: 385 },
    { name: 'Clinic C', exposure: 150, mean: 470 },
    { name: 'Clinic D', exposure: 300, mean: 400 }
  ],
  /** Known within-group variance (process variance, per unit of exposure). */
  EPV: 45000,
  /** Known between-group variance of the true means. */
  VHM: 400
}

export const buhlmann = (c = credibility) => {
  const totalW = c.groups.reduce((s, g) => s + g.exposure, 0)
  const mu = c.groups.reduce((s, g) => s + g.exposure * g.mean, 0) / totalW
  const k = c.EPV / c.VHM
  return {
    mu, k,
    groups: c.groups.map(g => {
      const z = g.exposure / (g.exposure + k)
      return { ...g, Z: z, credible: z * g.mean + (1 - z) * mu }
    }),
    /** Credibility of one extra unit of exposure, helpful for the k intuition. */
    fullCredibilityExposure: k * 3
  }
}

/* -------------------------------------------------------------------- finance */

export const bond = {
  face: 1000, coupon: 0.045, years: 5, ytm: 0.052, freq: 1
}

export const bondMath = (b = bond) => {
  const times = [], cf = []
  for (let t = 1; t <= b.years; t++) { times.push(t); cf.push(b.face * b.coupon) }
  cf[cf.length - 1] += b.face
  const disc = cf.map((c, i) => c * Math.pow(1 + b.ytm, -times[i]))
  const price = disc.reduce((a, x) => a + x, 0)
  const macaulay = disc.reduce((a, x, i) => a + times[i] * x, 0) / price
  const modified = macaulay / (1 + b.ytm)
  const convexity = disc.reduce((a, x, i) => a + times[i] * (times[i] + 1) * x, 0) / (price * Math.pow(1 + b.ytm, 2))
  return { times, cf, disc, price, macaulay, modified, convexity }
}

/* ------------------------------------------------- statistics & information geo */

export const returns = [ // 24 monthly returns of an equity book, in %
  1.8, -0.9, 2.4, 0.7, -1.3, 3.1, 0.4, -2.2, 1.1, 2.9, -0.6, 0.2,
  1.5, -1.8, 2.7, 0.9, -0.4, 1.2, 3.4, -0.3, 0.8, 1.9, -1.1, 2.2
]

export const moments = (xs = returns) => {
  const n = xs.length
  const mean = xs.reduce((a, b) => a + b, 0) / n
  const ss = xs.reduce((a, b) => a + (b - mean) ** 2, 0)
  const varr = ss / (n - 1)
  const sd = Math.sqrt(varr)
  const skew = xs.reduce((a, b) => a + ((b - mean) / sd) ** 3, 0) * n / ((n - 1) * (n - 2))
  const kurt = xs.reduce((a, b) => a + ((b - mean) / sd) ** 4, 0) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) -
    3 * (n - 1) ** 2 / ((n - 2) * (n - 3))
  const se = sd / Math.sqrt(n)
  return { n, mean, sd, varr, skew, kurt, se, t: mean / se }
}

/** Two competing Bernoulli models for the information-geometry module. */
export const informationGeometry = {
  p1: 0.25, p2: 0.40, n: 40,
  kl: (p, q) => p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q)),
  fisher: (p, n = 1) => n / (p * (1 - p)),
  logit: p => Math.log(p / (1 - p)),
  mle: (successes, n) => successes / n
}
informationGeometry.D_kl = informationGeometry.kl(informationGeometry.p1, informationGeometry.p2)

/** Compound Poisson aggregate model: N ~ Poisson(λ), severity ~ Gamma(μ, σ). */
export const aggregate = {
  lambda: 250, mu: 1200, sigma: 3000, retention: 25000
}

export const aggregateMoments = (a = aggregate) => {
  const { lambda: lam, mu: m, sigma: s } = a
  const meanSev = m
  const secondMomentSev = s * s + m * m
  return {
    expectedCount: lam,
    expectedAggregate: lam * meanSev,
    varianceAggregate: lam * secondMomentSev,
    sdAggregate: Math.sqrt(lam * secondMomentSev),
    /** CoV of the aggregate loss. */
    cov: Math.sqrt(lam * secondMomentSev) / (lam * meanSev)
  }
}

/** Monte-Carlo friendly parameters for the VaR exercise. */
export const varModel = { lambda: 200, mu: 1200, sigma: 2800, premium: 300000, trials: 2000 }

/* ------------------------------------------------------------------- geometry */

export const geom = {
  /** Right triangle legs (3-4-5 family). */
  tri: { a: 3, b: 4, c: 5 },
  /** General triangle for the law of cosines. */
  scalene: { a: 7, b: 8, Cdeg: 35 },
  circle: { r: 10, chord: 12 }
}

export const geomMath = (() => {
  const { a, b } = geom.tri
  const s = geom.scalene
  const C = (s.Cdeg * Math.PI) / 180
  const cSide = Math.sqrt(s.a ** 2 + s.b ** 2 - 2 * s.a * s.b * Math.cos(C))
  return {
    area: (a * b) / 2,
    hyp: Math.hypot(a, b),
    inradius: (a + b - Math.hypot(a, b)) / 2,
    circumradius: Math.hypot(a, b) / 2,
    scalene: {
      ...s,
      cSide,
      area: 0.5 * s.a * s.b * Math.sin(C),
      semip: (s.a + s.b + cSide) / 2,
      perimeter: s.a + s.b + cSide
    },
    circle: {
      ...geom.circle,
      sagitta: geom.circle.r - Math.sqrt(geom.circle.r ** 2 - (geom.circle.chord / 2) ** 2),
      circumference: 2 * Math.PI * geom.circle.r,
      area: Math.PI * geom.circle.r ** 2
    }
  }
})()

/* ------------------------------------------------------------------- utilities */

/** Round-trip through rnd() so printed answers look tidy. */
export const nice = (x, n = 4) => rnd(x, n)

export { rnd }

/** JSON that survives an HTML attribute delimited by double quotes. */
export const sq = v => JSON.stringify(v).replace(/"/g, "'")

export const data = {
  life, triangle, chainLadder, bornhuetterFerguson, credibility, buhlmann,
  bond, bondMath, returns, moments, informationGeometry, aggregate, aggregateMoments,
  varModel, geom, geomMath, rnd
}
export default data
