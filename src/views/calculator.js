/* =============================================================================
 * views/calculator — the actuarial toolkit. Six working Alpine apps that also
 * serve as reference implementations for the exercises.
 * ========================================================================== */

export function renderCalculator() {
  return `
  <div class="stack">
    <div>
      <div class="crumb">Actuarial toolkit</div>
      <h1>Six working apps, written in the style this course teaches</h1>
      <p>
        These are not mock-ups: every number is computed from the datasets in
        <code>src/content/data.js</code>, the same ones the exercises use. Read the markup
        (each card is one <code>x-data</code> scope) and steal the patterns.
      </p>
    </div>

    <!-- ---------------------------------------------------------- life table -->
    <div class="card" x-data="lifeCalc" x-cloak>
      <div class="card-head"><h3>1 · Life contingencies</h3>
        <div style="flex:1"></div>
        <span class="chip info">Gompertz–Makeham teaching table</span></div>
      <div class="grid two">
        <div>
          <div class="grid two">
            <label class="field"><span>Age x</span><input type="number" min="0" max="100" x-model.number="x"></label>
            <label class="field"><span>Term n (years)</span><input type="number" min="1" max="60" x-model.number="n"></label>
            <label class="field"><span>Interest i (%)</span><input type="number" step="0.1" x-model.number="i"></label>
            <label class="field"><span>Sum assured</span><input type="number" step="1000" x-model.number="benefit"></label>
            <label class="field"><span>Product</span>
              <select x-model="product">
                <option value="endowment">Endowment</option>
                <option value="term">Term</option>
                <option value="whole">Whole life</option>
              </select>
            </label>
            <label class="field"><span>Reserve at duration t</span><input type="number" min="0" x-model.number="t"></label>
          </div>
        </div>
        <div>
          <dl class="kv">
            <dt>Interest rate per year</dt><dd x-text="(rate * 100).toFixed(2) + '%'"></dd>
            <dt>q<sub>x</sub> at entry age</dt><dd x-text="(qxHere * 100).toFixed(4) + '%'"></dd>
            <dt>Curtate expectation e<sub>x</sub></dt><dd x-text="exHere.toFixed(2) + ' yr'"></dd>
            <dt>ä<sub>x:n</sub> (annuity-due, n years)</dt><dd x-text="aDue.toFixed(5)"></dd>
            <dt>ä<sub>x</sub> (whole life)</dt><dd x-text="aWhole.toFixed(5)"></dd>
            <dt>A¹<sub>x:n</sub> (term insurance)</dt><dd x-text="Aterm.toFixed(5)"></dd>
            <dt>A<sub>x:n</sub> (endowment)</dt><dd x-text="Aendow.toFixed(5)"></dd>
            <dt>A<sub>x</sub> (whole life)</dt><dd x-text="Awhole.toFixed(5)"></dd>
          </dl>
          <hr>
          <dl class="kv">
            <dt>Single premium</dt><dd x-text="money(singlePremium)"></dd>
            <dt>Level premium (per 1,000)</dt><dd x-text="levelPremium.toFixed(3)"></dd>
            <dt>Net premium reserve V<sub>t</sub></dt><dd x-text="money(reserve)"></dd>
          </dl>
        </div>
      </div>
      <div style="margin-top:12px">
        <div class="tiny muted">Survival curve l(x + s)/l(x) from 10 years before entry</div>
        <svg viewBox="0 0 560 150" width="100%" height="150" role="img" aria-label="survival curve">
          <polyline :points="curvePath" fill="none" stroke="#5eead4" stroke-width="2.5"></polyline>
          <line x1="0" y1="150" x2="560" y2="150" stroke="#253253"></line>
        </svg>
      </div>
    </div>

    <!-- ------------------------------------------------------- loss triangle -->
    <div class="card" x-data="triangleCalc" x-cloak>
      <div class="card-head"><h3>2 · Loss development &amp; reserving</h3>
        <div style="flex:1"></div>
        <span class="chip info">cumulative paid losses ($000)</span></div>
      <div class="row" style="margin-bottom:12px">
        <div class="pill-tabs">
          <button @click="method = 'cl'" :class="{ on: method === 'cl' }">chain-ladder</button>
          <button @click="method = 'bf'" :class="{ on: method === 'bf' }">Bornhuetter–Ferguson</button>
        </div>
        <label class="field" x-show="method === 'bf'" style="max-width:220px;margin:0">
          <span>a-priori loss ratio</span>
          <input type="number" step="0.01" x-model.number="aPrioriLR">
        </label>
        <div style="flex:1"></div>
        <span class="chip accent">Total IBNR <b x-text="total.toFixed(1)"></b></span>
      </div>

      <div style="overflow:auto">
        <table class="data">
          <thead>
            <tr><th>Accident year</th>
              <template x-for="lag in 6" :key="lag"><th class="num" x-text="'dev ' + lag"></th></template>
            </tr>
          </thead>
          <tbody>
            <template x-for="(row, i) in tri.rows" :key="i">
              <tr><td x-text="tri.years[i]"></td>
                <template x-for="lag in 6" :key="lag">
                  <td class="num" x-text="row[lag - 1] === undefined ? '—' : row[lag - 1]"></td>
                </template>
              </tr>
            </template>
            <tr>
              <td><b>development factor</b></td>
              <td class="num">—</td>
              <template x-for="(f, i) in cl.factors" :key="i"><td class="num" x-text="k(f)"></td></template>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <table class="data" style="margin-top:14px">
        <thead><tr><th>Accident year</th><th class="num">latest diagonal</th><th class="num">age (dev)</th><th class="num">ultimate</th><th class="num">IBNR</th><th>relative size</th></tr></thead>
        <tbody>
          <template x-for="r in reserveByAy" :key="r.year">
            <tr>
              <td x-text="r.year"></td>
              <td class="num" x-text="r.latest"></td>
              <td class="num" x-text="r.age"></td>
              <td class="num" x-text="r.ultimate.toFixed(1)"></td>
              <td class="num" x-text="r.ibnr.toFixed(1)"></td>
              <td style="width:200px"><div class="bar"><span :style="'width:' + (100 * r.ultimate / maxUltimate) + '%'"></span></div></td>
            </tr>
          </template>
        </tbody>
      </table>
      <p class="tiny muted" style="margin-top:8px">
        Chain-ladder applies the volume-weighted development factors to the latest diagonal;
        Bornhuetter–Ferguson instead blends the reported amount with an a-priori expectation multiplied by the
        un-reported percentage. Switch methods and watch the 2025 accident year move the most —
        that is exactly the year with the least information.
      </p>
    </div>

    <!-- ---------------------------------------------------------- credibility -->
    <div class="card" x-data="credCalc" x-cloak>
      <div class="card-head"><h3>3 · Bühlmann–Straub credibility</h3>
        <div style="flex:1"></div>
        <span class="chip accent">k = <b x-text="k.toFixed(1)"></b></span></div>
      <div class="row" style="margin-bottom:10px">
        <label class="field" style="max-width:190px"><span>Process variance (EPV)</span><input type="number" step="1000" x-model.number="EPV"></label>
        <label class="field" style="max-width:190px"><span>Between-group variance (VHM)</span><input type="number" step="50" x-model.number="VHM"></label>
        <div style="flex:1"></div>
        <button class="btn-sm" @click="addGroup()">+ group</button>
      </div>
      <table class="data">
        <thead><tr><th>Group</th><th class="num">exposure m</th><th class="num">observed mean x̄</th><th class="num">Z = m/(m+k)</th><th class="num">credible mean</th><th>x̄ − μ</th><th></th></tr></thead>
        <tbody>
          <template x-for="(g, i) in rows" :key="i">
            <tr>
              <td><input x-model="groups[i].name" style="min-height:36px"></td>
              <td class="num"><input type="number" x-model.number="groups[i].exposure" style="min-height:36px;text-align:right"></td>
              <td class="num"><input type="number" x-model.number="groups[i].mean" style="min-height:36px;text-align:right"></td>
              <td class="num" x-text="g.Z.toFixed(4)"></td>
              <td class="num" x-text="g.credible.toFixed(3)"></td>
              <td class="num" x-text="(g.mean - mu).toFixed(1)"></td>
              <td><button class="btn-sm" @click="removeGroup(i)" aria-label="Remove group">✕</button></td>
            </tr>
          </template>
        </tbody>
      </table>
      <p class="tiny muted" style="margin-top:8px">
        μ = <b x-text="mu.toFixed(3)"></b> · k = EPV/VHM = <b x-text="k.toFixed(2)"></b>.
        Z is the credibility weight: how much of a group's own experience survives the blend.
        Raise the exposure of a group and watch its Z climb toward 1 — that is the whole idea of credibility.
      </p>
    </div>

    <!-- ---------------------------------------------------------------- bond -->
    <div class="card" x-data="bondCalc" x-cloak>
      <div class="card-head"><h3>4 · Bond pricing, duration &amp; convexity</h3></div>
      <div class="grid two">
        <div class="grid two">
          <label class="field"><span>Face</span><input type="number" step="100" x-model.number="face"></label>
          <label class="field"><span>Coupon (%)</span><input type="number" step="0.05" x-model.number="coupon"></label>
          <label class="field"><span>Years</span><input type="number" min="1" max="30" x-model.number="years"></label>
          <label class="field"><span>Yield to maturity (%)</span><input type="number" step="0.05" x-model.number="ytm"></label>
        </div>
        <div>
          <dl class="kv">
            <dt>Dirty price</dt><dd x-text="money(price)"></dd>
            <dt>Macaulay duration</dt><dd x-text="model.macaulay.toFixed(4) + ' yr'"></dd>
            <dt>Modified duration</dt><dd x-text="duration.toFixed(4)"></dd>
            <dt>Convexity</dt><dd x-text="convexity.toFixed(4)"></dd>
            <dt>Price if yield +100 bp (duration only)</dt><dd x-text="money(price * (1 - duration * 0.01))"></dd>
            <dt>Price if yield +100 bp (+ convexity)</dt><dd x-text="money(shift(0.01))"></dd>
            <dt>Price if yield −100 bp</dt><dd x-text="money(shift(-0.01))"></dd>
          </dl>
        </div>
      </div>
      <svg viewBox="0 0 560 150" width="100%" height="150" role="img" aria-label="price/yield curve">
        <polyline :points="curvePath" fill="none" stroke="#a78bfa" stroke-width="2.5"></polyline>
        <circle :cx="markX" :cy="markY" r="5" fill="#5eead4"></circle>
        <line x1="0" y1="150" x2="560" y2="150" stroke="#253253"></line>
      </svg>
    </div>

    <!-- ---------------------------------------------------------- Monte Carlo -->
    <div class="card" x-data="varSim" x-cloak>
      <div class="card-head"><h3>5 · Compound-Poisson Monte Carlo (VaR &amp; TVaR)</h3>
        <div style="flex:1"></div>
        <span class="chip info">N ~ Poisson(λ) · severity ~ Gamma</span></div>
      <div class="grid two">
        <div class="grid two">
          <label class="field"><span>λ (claim count)</span><input type="number" x-model.number="lambda" min="1"></label>
          <label class="field"><span>severity mean μ</span><input type="number" x-model.number="mu" min="1"></label>
          <label class="field"><span>severity sd σ</span><input type="number" x-model.number="sigma" min="1"></label>
          <label class="field"><span>simulations</span><input type="number" x-model.number="trials" min="100" max="200000" step="500"></label>
          <label class="field"><span>premium income</span><input type="number" x-model.number="premium" step="1000"></label>
          <label class="field"><span>random seed (reproducible)</span><input type="number" x-model.number="seed"></label>
        </div>
        <div>
          <div class="row">
            <button class="btn-primary" @click="run()" :disabled="running" x-text="running ? 'simulating…' : 'run simulation'"></button>
            <span class="tiny muted" x-text="losses.length ? losses.length + ' scenarios' : 'nothing simulated yet'"></span>
          </div>
          <dl class="kv" style="margin-top:10px">
            <dt>Gamma shape / scale</dt><dd x-text="shape.toFixed(4) + ' / ' + scale.toFixed(1)"></dd>
            <dt>Theoretical mean</dt><dd x-text="money(expected)"></dd>
            <dt>Theoretical s.d.</dt><dd x-text="money(sd)"></dd>
            <dt>Simulated VaR 99 %</dt><dd x-text="money(var99)"></dd>
            <dt>Simulated TVaR 99 %</dt><dd x-text="money(tvar99)"></dd>
            <dt>P(loss &gt; premium)</dt><dd x-text="(ruin * 100).toFixed(2) + '%'"></dd>
            <dt>Expected loss ratio</dt><dd x-text="(ratio * 100).toFixed(1) + '%'"></dd>
          </dl>
        </div>
      </div>
      <div class="row" style="align-items:flex-end;gap:3px;height:130px;margin-top:14px">
        <template x-for="(b, i) in buckets" :key="i">
          <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"
               :title="money(b.from) + ' – ' + money(b.to) + ' · ' + b.n + ' scenarios'">
            <div :style="'height:' + b.h + '%;background:linear-gradient(180deg,#a78bfa,#5eead4);border-radius:3px 3px 0 0'"></div>
          </div>
        </template>
      </div>
      <div class="row tiny muted" style="justify-content:space-between;margin-top:4px">
        <span>0</span><span x-text="losses.length ? money(losses[losses.length - 1]) : ''"></span>
      </div>
      <p class="tiny muted">
        Each scenario draws a Poisson claim count, then that many Gamma severities. Same seed → same answer,
        which is what makes a simulation testable. This is the pattern used in the async and reactivity modules.
      </p>
    </div>

    <!-- ------------------------------------------------------------- statistics -->
    <div class="card" x-data="statsTool" x-cloak>
      <div class="card-head"><h3>6 · Statistical toolbox (and a little information geometry)</h3></div>
      <div class="grid two">
        <div>
          <div class="tiny muted">24 monthly returns (%) — edit any value, add or remove rows</div>
          <div style="max-height:260px;overflow:auto;margin-top:8px">
            <table class="data">
              <tbody>
                <template x-for="(v, i) in xs" :key="i">
                  <tr>
                    <td class="num" style="width:60px" x-text="i + 1"></td>
                    <td><input type="number" step="0.1" x-model.number="xs[i]" style="min-height:36px"></td>
                    <td style="width:60px"><button class="btn-sm" @click="remove(i)" aria-label="Remove">✕</button></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="row" style="margin-top:8px">
            <button class="btn-sm" @click="add()">+ row</button>
            <button class="btn-sm" @click="reset()">reset data</button>
          </div>
        </div>
        <div>
          <dl class="kv">
            <dt>n</dt><dd x-text="m.n"></dd>
            <dt>mean</dt><dd x-text="n(m.mean)"></dd>
            <dt>sd (sample)</dt><dd x-text="n(m.sd)"></dd>
            <dt>s.e. of the mean</dt><dd x-text="n(m.se)"></dd>
            <dt>t = mean / s.e.</dt><dd x-text="n(m.t)"></dd>
            <dt>skewness (adjusted)</dt><dd x-text="n(m.skew)"></dd>
            <dt>excess kurtosis</dt><dd x-text="n(m.kurt)"></dd>
            <dt>D<sub>KL</sub>(p̂ ‖ 0.40)</dt><dd x-text="n(kl)"></dd>
          </dl>
          <div class="row" style="align-items:flex-end;gap:4px;height:110px;margin-top:10px">
            <template x-for="(b, i) in hist" :key="i">
              <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"
                   :title="b.from.toFixed(2) + ' … ' + b.to.toFixed(2) + ' (' + b.n + ')'">
                <div :style="'height:' + b.h + '%;background:#5eead4;border-radius:3px 3px 0 0'"></div>
              </div>
            </template>
          </div>
          <hr>
          <dl class="kv">
            <dt>3-4-5 triangle: area / inradius / circumradius</dt>
            <dd x-text="geom.area + ' / ' + geom.inradius + ' / ' + geom.circumradius"></dd>
            <dt>Scalene a=7, b=8, C=35°: c</dt><dd x-text="n(geom.scalene.cSide)"></dd>
            <dt>Scalene area</dt><dd x-text="n(geom.scalene.area)"></dd>
          </dl>
        </div>
      </div>
    </div>
  </div>`
}
