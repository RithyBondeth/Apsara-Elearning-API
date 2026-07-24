// Grade 12 Mathematics — graph supplements, keyed by lesson slug.
//
// Each value is a markdown block injected into the lesson (before the
// key-points summary) by `withGraph()` in seed.mjs. Graphs are authored as
// ```graph fenced blocks carrying a compact JSON spec that the web renders to a
// theme-aware SVG (components/learn/graph-plot). No image assets, no LaTeX
// inside the JSON — function strings use plain infix math with `*`/`^` and the
// whitelisted functions (exp, ln, sin, sqrt, …); the only variable is `x`.
//
// Spec fields: xRange/yRange (required), xLabel/yLabel, grid, caption,
// functions[{fn,color,label,dashed}], areas[{fn,from,to,color}],
// points[{x,y,label,color,open}], segments[{from,to,color,arrow,dashed,label}],
// vAsymptotes[{x,label}], hAsymptotes[{y,label}].
//
// Every curve here was hand-checked: key values, extrema and asymptotes are
// stated in the caption so a reader can confirm the plot matches the theory.

export const MATH_GRADE_12_GRAPHS = {
  // ── ជំពូក ១ — ចំនួនកុំផ្លិច ────────────────────────────────────────────────
  'complex-numbers-polar-form': `### ក្រាបនៃចំនួនកុំផ្លិច (ប្លង់ Argand)

ចំនួនកុំផ្លិច $z = 1 + i\\sqrt{3}$ តាងដោយចំណុច $M(1, \\sqrt{3})$ ក្នុងប្លង់កុំផ្លិច។ ម៉ូឌុល $r = |z| = 2$ ជាប្រវែងវ៉ិចទ័រ $\\vec{OM}$ ហើយអាគុយម៉ង់ $\\theta = \\dfrac{\\pi}{3}$ ជាមុំដែលវ៉ិចទ័រនេះធ្វើជាមួយអ័ក្សពិត។

\`\`\`graph
{
  "xRange": [-1, 3],
  "yRange": [-1, 3],
  "xLabel": "Re",
  "yLabel": "Im",
  "segments": [
    { "from": [0, 0], "to": [1, 1.732], "color": "emerald", "arrow": true, "label": "r=2" },
    { "from": [1, 0], "to": [1, 1.732], "color": "slate", "dashed": true },
    { "from": [0, 1.732], "to": [1, 1.732], "color": "slate", "dashed": true }
  ],
  "points": [
    { "x": 1, "y": 1.732, "label": "z = 1 + i√3", "color": "emerald" },
    { "x": 1, "y": 0, "label": "1", "color": "slate", "open": true },
    { "x": 0, "y": 1.732, "label": "√3", "color": "slate", "open": true }
  ],
  "caption": "z = 1 + i√3 = 2(cos π/3 + i sin π/3) — ម៉ូឌុល r = 2, អាគុយម៉ង់ θ = π/3 = 60°"
}
\`\`\``,

  // ── ជំពូក ២ — លីមីត និងភាពជាប់ ─────────────────────────────────────────────
  'limits-at-infinity-asymptotes': `### ក្រាបនៃអនុគមន៍ និងអាស៊ីមតូត

អនុគមន៍ $f(x) = \\dfrac{2x + 1}{x - 1}$ មានអាស៊ីមតូតឈរ $x = 1$ (ព្រោះភាគបែងរលត់) និងអាស៊ីមតូតដេក $y = 2$ (ព្រោះ $\\lim_{x\\to\\pm\\infty} f(x) = 2$)។ សង្កេតមើលក្រាបខិតទៅជិតបន្ទាត់ដាច់ៗទាំងពីរ។

\`\`\`graph
{
  "xRange": [-6, 8],
  "yRange": [-6, 10],
  "functions": [{ "fn": "(2*x + 1)/(x - 1)", "color": "violet", "label": "y=(2x+1)/(x−1)" }],
  "vAsymptotes": [{ "x": 1, "label": "x=1" }],
  "hAsymptotes": [{ "y": 2, "label": "y=2" }],
  "caption": "អាស៊ីមតូតឈរ x = 1 និងអាស៊ីមតូតដេក y = 2"
}
\`\`\``,

  // ── ជំពូក ៣ — ដេរីវេ និងអនុវត្តន៍ ─────────────────────────────────────────
  'derivative-applications': `### ក្រាបនៃអថេរភាព

សម្រាប់ $f(x) = x^{3} - 3x$ យើងបាន $f'(x) = 3x^{2} - 3 = 3(x-1)(x+1)$។ ដេរីវេរលត់ត្រង់ $x = -1$ និង $x = 1$ ដែលផ្តល់ចំណុចអតិបរមាតំបន់ $(-1, 2)$ និងចំណុចអប្បបរមាតំបន់ $(1, -2)$។

\`\`\`graph
{
  "xRange": [-2.4, 2.4],
  "yRange": [-4, 4],
  "functions": [{ "fn": "x^3 - 3*x", "color": "violet", "label": "y=x³−3x" }],
  "points": [
    { "x": -1, "y": 2, "label": "អតិបរមា (−1, 2)", "color": "emerald" },
    { "x": 1, "y": -2, "label": "អប្បបរមា (1, −2)", "color": "rose" }
  ],
  "caption": "f(x)=x³−3x — កើនលើ ]−∞,−1[, ចុះលើ ]−1,1[, កើនលើ ]1,+∞["
}
\`\`\``,

  // ── ជំពូក ៤ — សិក្សាអនុគមន៍ និងខ្សែកោង ───────────────────────────────────
  'rational-functions': `### ក្រាបនៃអនុគមន៍សនិទាន

អនុគមន៍ $f(x) = x + \\dfrac{1}{x} = \\dfrac{x^{2}+1}{x}$ មានអាស៊ីមតូតឈរ $x = 0$ និងអាស៊ីមតូតឆៀង $y = x$ (ព្រោះ $f(x) - x = \\frac{1}{x} \\to 0$)។ វាមានចំណុចអប្បបរមា $(1, 2)$ សម្រាប់ $x > 0$ និងអតិបរមា $(-1, -2)$ សម្រាប់ $x < 0$។

\`\`\`graph
{
  "xRange": [-5, 5],
  "yRange": [-6, 6],
  "functions": [{ "fn": "x + 1/x", "color": "cyan", "label": "y=x+1/x" }],
  "vAsymptotes": [{ "x": 0, "label": "x=0" }],
  "segments": [{ "from": [-5, -5], "to": [5, 5], "color": "slate", "dashed": true, "label": "y=x" }],
  "points": [
    { "x": 1, "y": 2, "label": "(1, 2)", "color": "emerald" },
    { "x": -1, "y": -2, "label": "(−1, −2)", "color": "rose" }
  ],
  "caption": "y = x + 1/x — អាស៊ីមតូតឆៀង y = x និងអាស៊ីមតូតឈរ x = 0"
}
\`\`\``,

  'exponential-functions': `### ក្រាបនៃអនុគមន៍អ៉ិចស្ប៉ូណង់ស្យែល

ក្រាបនៃ $y = e^{x}$ កើនជានិច្ច ប៉ោងឡើងលើ កាត់អ័ក្ស $Oy$ ត្រង់ $(0, 1)$ ហើយមានអ័ក្ស $Ox$ (បន្ទាត់ $y = 0$) ជាអាស៊ីមតូតដេកនៅខាងឆ្វេង។

\`\`\`graph
{
  "xRange": [-3, 3],
  "yRange": [-1, 9],
  "functions": [{ "fn": "exp(x)", "color": "violet", "label": "y=eˣ" }],
  "hAsymptotes": [{ "y": 0, "label": "y=0" }],
  "points": [{ "x": 0, "y": 1, "label": "(0, 1)", "color": "rose" }],
  "caption": "y = eˣ — កើនជានិច្ច, អាស៊ីមតូតដេក y = 0"
}
\`\`\`

ក្រាបនៃ $g(x) = x\\,e^{-x}$ (ឧទាហរណ៍ខាងលើ) កើនលើ $]-\\infty, 1[$ រួចចុះលើ $]1, +\\infty[$ ដោយមានចំណុចអតិបរមា $(1, \\tfrac{1}{e}) \\approx (1,\\ 0.37)$។

\`\`\`graph
{
  "xRange": [-1, 5],
  "yRange": [-2, 1],
  "functions": [{ "fn": "x*exp(-x)", "color": "cyan", "label": "y=x·e⁻ˣ" }],
  "hAsymptotes": [{ "y": 0, "label": "y=0" }],
  "points": [{ "x": 1, "y": 0.368, "label": "អតិបរមា (1, 1/e)", "color": "emerald" }],
  "caption": "y = x·e⁻ˣ — អតិបរមាត្រង់ x = 1, តម្លៃ 1/e ≈ 0.37"
}
\`\`\``,

  'logarithm-functions': `### ក្រាបនៃលោការីត និងទំនាក់ទំនងនឹងអ៉ិចស្ប៉ូណង់ស្យែល

អនុគមន៍ $y = \\ln x$ និង $y = e^{x}$ ជាអនុគមន៍ច្រាស់គ្នា ដូច្នេះក្រាបរបស់វាឆ្លុះស៊ីមេទ្រីគ្នាធៀបនឹងបន្ទាត់ $y = x$។ ក្រាប $\\ln x$ កាត់អ័ក្ស $Ox$ ត្រង់ $(1, 0)$ ហើយមានអ័ក្ស $Oy$ ($x = 0$) ជាអាស៊ីមតូតឈរ។

\`\`\`graph
{
  "xRange": [-2, 6],
  "yRange": [-2, 6],
  "functions": [
    { "fn": "ln(x)", "color": "violet", "label": "y=ln x" },
    { "fn": "exp(x)", "color": "cyan", "label": "y=eˣ", "dashed": true }
  ],
  "vAsymptotes": [{ "x": 0 }],
  "segments": [{ "from": [-2, -2], "to": [6, 6], "color": "slate", "dashed": true, "label": "y=x" }],
  "points": [
    { "x": 1, "y": 0, "label": "(1, 0)", "color": "rose" },
    { "x": 2.718, "y": 1, "label": "(e, 1)", "color": "emerald" }
  ],
  "caption": "y = ln x ស៊ីមេទ្រីនឹង y = eˣ ធៀបនឹង y = x"
}
\`\`\``,

  'complete-curve-sketching': `### ក្រាបនៃការសិក្សាពេញលេញ

ឧទាហរណ៍ $f(x) = x^{3} - 3x^{2} + 2$។ ដេរីវេ $f'(x) = 3x^{2} - 6x = 3x(x-2)$ រលត់ត្រង់ $x = 0$ (អតិបរមា $(0, 2)$) និង $x = 2$ (អប្បបរមា $(2, -2)$)។ ដេរីវេទី២ $f''(x) = 6x - 6$ រលត់ត្រង់ $x = 1$ ដែលជាចំណុចរបត់ $(1, 0)$។

\`\`\`graph
{
  "xRange": [-1.5, 3.5],
  "yRange": [-4, 4],
  "functions": [{ "fn": "x^3 - 3*x^2 + 2", "color": "violet", "label": "y=x³−3x²+2" }],
  "points": [
    { "x": 0, "y": 2, "label": "អតិបរមា (0, 2)", "color": "emerald" },
    { "x": 2, "y": -2, "label": "អប្បបរមា (2, −2)", "color": "rose" },
    { "x": 1, "y": 0, "label": "ចំណុចរបត់ (1, 0)", "color": "amber" }
  ],
  "caption": "f(x)=x³−3x²+2 — អតិបរមា (0,2), អប្បបរមា (2,−2), ចំណុចរបត់ (1,0)"
}
\`\`\``,

  // ── ជំពូក ៥ — អាំងតេក្រាល ─────────────────────────────────────────────────
  'definite-integrals': `### ក្រាប៖ ក្រផ្ទៃក្រោមខ្សែកោង

អាំងតេក្រាលកំណត់ $\\displaystyle\\int_{0}^{2} x^{2}\\,dx$ ស្មើនឹងក្រផ្ទៃរវាងខ្សែកោង $y = x^{2}$ អ័ក្ស $Ox$ និងបន្ទាត់ $x = 0$, $x = 2$។ តម្លៃ $= \\left[\\dfrac{x^{3}}{3}\\right]_{0}^{2} = \\dfrac{8}{3} \\approx 2.67$។

\`\`\`graph
{
  "xRange": [-0.5, 3],
  "yRange": [-0.5, 5],
  "functions": [{ "fn": "x^2", "color": "violet", "label": "y=x²" }],
  "areas": [{ "fn": "x^2", "from": 0, "to": 2, "color": "cyan" }],
  "points": [
    { "x": 0, "y": 0, "label": "a=0", "color": "slate", "open": true },
    { "x": 2, "y": 0, "label": "b=2", "color": "slate", "open": true }
  ],
  "caption": "ក្រផ្ទៃក្រោម y = x² ពី 0 ដល់ 2 = 8/3 ≈ 2.67"
}
\`\`\``,

  // ── ជំពូក ៧ — ប្រូបាប៊ីលីតេ និងស្ថិតិ ─────────────────────────────────────
  'random-variables-binomial': `### ក្រាបនៃច្បាប់ទ្វេធា

អថេរចៃដន្យ $X \\sim \\mathcal{B}(5,\\ 0.5)$។ ប្រូបាប៊ីលីតេ $P(X=k) = \\binom{5}{k}(0.5)^{5}$ ផ្តល់តម្លៃ $\\tfrac{1}{32},\\ \\tfrac{5}{32},\\ \\tfrac{10}{32},\\ \\tfrac{10}{32},\\ \\tfrac{5}{32},\\ \\tfrac{1}{32}$។ ក្រាបខាងក្រោមបង្ហាញការចែកចាយស៊ីមេទ្រីជុំវិញ $k = 2.5$។

\`\`\`graph
{
  "xRange": [-0.5, 5.5],
  "yRange": [0, 0.4],
  "xLabel": "k",
  "yLabel": "P(X=k)",
  "grid": true,
  "segments": [
    { "from": [0, 0], "to": [0, 0.031], "color": "cyan" },
    { "from": [1, 0], "to": [1, 0.156], "color": "cyan" },
    { "from": [2, 0], "to": [2, 0.313], "color": "cyan" },
    { "from": [3, 0], "to": [3, 0.313], "color": "cyan" },
    { "from": [4, 0], "to": [4, 0.156], "color": "cyan" },
    { "from": [5, 0], "to": [5, 0.031], "color": "cyan" }
  ],
  "points": [
    { "x": 2, "y": 0.313, "label": "10/32", "color": "violet" },
    { "x": 3, "y": 0.313, "color": "violet" }
  ],
  "caption": "ច្បាប់ទ្វេធា B(5, 0.5) — មធ្យមភាគ E(X)=np=2.5, ស៊ីមេទ្រី"
}
\`\`\``,
}
