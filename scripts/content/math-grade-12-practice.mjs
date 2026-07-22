// Grade 12 Mathematics — extra practice questions, Khmer only.
//
// These are appended to each lesson's quiz at seed time (see seed.mjs), taking
// every quiz from 3 → 6 questions so students get real retrieval practice, not
// just a spot check. Keyed by lesson slug (must match math-grade-12.mjs).
//
// Answer keys are hand-verified. Notation: Unicode math (√ ∫ ≠ ≤ π ² ³ ⁿ −),
// NOT LaTeX — the web player renders plain markdown. Shapes match the
// assessment-service graders (apps/assessment-service/src/services/graders).

/** Answer-key helpers — same shapes as math-grade-12.mjs. */
const mc = (question, options, explanation, points = 1) => ({
  type: 'multiple_choice',
  question,
  options, // [answer, isCorrect][]
  explanation,
  points,
});
const numeric = (
  question,
  value,
  explanation,
  { tolerance = 0.01, points = 2 } = {},
) => ({
  type: 'numeric',
  question,
  correctAnswer: { value, tolerance },
  explanation,
  points,
});
const trueFalse = (question, value, explanation, points = 1) => ({
  type: 'true_false',
  question,
  correctAnswer: { value },
  explanation,
  points,
});

export const MATH_GRADE_12_PRACTICE = {
  /* ── Chapter 1 — Complex numbers ─────────────────────────────────────── */
  'complex-numbers-definition': [
    mc(
      'តើផ្នែកពិត Re(z) នៃចំនួន z = −2 + 7i មានតម្លៃប៉ុន្មាន?',
      [
        ['−2', true],
        ['7', false],
        ['7i', false],
        ['2', false],
      ],
      'Re(z) ជាផ្នែកពិត គឺ a ក្នុងទម្រង់ z = a + bi។ ដូច្នេះ Re(z) = −2។',
    ),
    numeric(
      'គណនាតម្លៃនៃ i³⁸។',
      -1,
      '38 = 4 × 9 + 2 ដូច្នេះ i³⁸ = i² = −1។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ចំនួន 5i ជាចំនួនកុំផ្លិចនិមិត្តសុទ្ធ។',
      true,
      'ចំនួនកុំផ្លិចនិមិត្តសុទ្ធមានទម្រង់ bi (a = 0, b ≠ 0)។ 5i ត្រូវនឹងលក្ខណៈនេះ។',
    ),
  ],
  'complex-numbers-operations': [
    mc(
      'គណនា (2 + 3i) + (4 − i)។',
      [
        ['6 + 2i', true],
        ['6 + 4i', false],
        ['6 − 2i', false],
        ['8 + 2i', false],
      ],
      'បូកផ្នែកពិតនឹងផ្នែកពិត និងផ្នែកកុំផ្លិចនឹងផ្នែកកុំផ្លិច៖ (2+4) + (3−1)i = 6 + 2i។',
    ),
    numeric(
      'គណនាផ្នែកពិត Re នៃផលគុណ (2 + 3i)(1 − i)។',
      5,
      '(2+3i)(1−i) = 2 − 2i + 3i − 3i² = 2 + i + 3 = 5 + i។ ដូច្នេះ Re = 5។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ផលគុណនៃចំនួនកុំផ្លិច z នឹងផ្សំរបស់វា z̄ ជាចំនួនពិតជានិច្ច។',
      true,
      'z·z̄ = a² + b² = |z|² ដែលជាចំនួនពិតវិជ្ជមាន ឬសូន្យ។',
    ),
  ],
  'complex-numbers-polar-form': [
    numeric(
      'គណនាម៉ូឌុល |3 + 4i|។',
      5,
      '|a + bi| = √(a² + b²) = √(9 + 16) = √25 = 5។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើម៉ូឌុលនៃ z = −1 + i√3 មានតម្លៃប៉ុន្មាន?',
      [
        ['2', true],
        ['4', false],
        ['√2', false],
        ['1', false],
      ],
      '|z| = √((−1)² + (√3)²) = √(1 + 3) = √4 = 2។',
    ),
    trueFalse(
      'អាគុយម៉ង់នៃ i គឺ π/2។',
      true,
      'i ស្ថិតនៅលើអ័ក្សនិមិត្តវិជ្ជមាន ដូច្នេះមុំរបស់វាគឺ π/2។',
    ),
  ],
  'complex-numbers-equations': [
    mc(
      'ដោះស្រាយសមីការ z² = −9 ក្នុង ℂ។',
      [
        ['z = ±3i', true],
        ['z = ±3', false],
        ['z = ±9i', false],
        ['z = 3i តែប៉ុណ្ណោះ', false],
      ],
      'z² = −9 = 9i² ដូច្នេះ z = ±3i។',
    ),
    trueFalse(
      'គ្រប់សមីការពហុធាដឺក្រេ n (n ≥ 1) មានឫសយ៉ាងច្រើន n ក្នុង ℂ រាប់ទាំងពហុគុណ។',
      true,
      'នេះជាទ្រឹស្តីបទមូលដ្ឋាននៃពិជគណិត។',
    ),
    numeric(
      'សមីការ z² − 2z + 5 = 0 មានឫស z = 1 + 2i និង z = 1 − 2i។ គណនាផលបូកនៃឫសទាំងពីរ។',
      2,
      'ផលបូកឫស = (1 + 2i) + (1 − 2i) = 2 (ស្របនឹង −b/a = 2)។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 2 — Limits & continuity ─────────────────────────────────── */
  'limits-introduction': [
    numeric(
      'គណនា lim(x→2) (x² − 4)/(x − 2)។',
      4,
      '(x² − 4)/(x − 2) = (x − 2)(x + 2)/(x − 2) = x + 2 → 2 + 2 = 4។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើ lim(x→0) (sin x)/x មានតម្លៃប៉ុន្មាន?',
      [
        ['1', true],
        ['0', false],
        ['∞', false],
        ['មិនកំណត់', false],
      ],
      'នេះជាលីមីតត្រីកោណមាត្រមូលដ្ឋាន៖ lim(x→0)(sin x)/x = 1។',
    ),
    trueFalse(
      'ប្រសិនបើ lim(x→a) f(x) មាន នោះវាមានតម្លៃតែមួយគត់។',
      true,
      'នៅពេលលីមីតមាន វាមានតម្លៃឯកតែមួយ (លីមីតឆ្វេង = លីមីតស្តាំ)។',
    ),
  ],
  'limits-indeterminate-forms': [
    mc(
      'តើ lim(x→0) (sin x)/x ជាទម្រង់មិនកំណត់អ្វី?',
      [
        ['0/0', true],
        ['∞/∞', false],
        ['0 · ∞', false],
        ['∞ − ∞', false],
      ],
      'នៅ x = 0 ភាគយក sin 0 = 0 និងភាគបែង 0 ដូច្នេះទម្រង់គឺ 0/0។',
    ),
    numeric(
      'គណនា lim(x→3) (x² − 9)/(x − 3)។',
      6,
      '(x² − 9)/(x − 3) = x + 3 → 3 + 3 = 6។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ទម្រង់ 0/0 តែងតែផ្តល់លីមីតស្មើ 0។',
      false,
      '0/0 ជាទម្រង់មិនកំណត់ — លីមីតអាចជាតម្លៃណាមួយ ឬមិនមាន។ ត្រូវប្រែក្លាយមុនគណនា។',
    ),
  ],
  'limits-at-infinity-asymptotes': [
    numeric(
      'គណនា lim(x→∞) (3x² + 2)/(x² − 1)។',
      3,
      'ចែកភាគយក និងភាគបែងនឹង x²៖ (3 + 2/x²)/(1 − 1/x²) → 3/1 = 3។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើអាស៊ីមតូតដេក(ផ្តេក)នៃ f(x) = (2x + 1)/(x − 3) គឺជាអ្វី?',
      [
        ['y = 2', true],
        ['y = 0', false],
        ['y = 1', false],
        ['x = 3', false],
      ],
      'នៅ x → ∞ សមាមាត្រនៃមេគុណនាំមុខ = 2/1 = 2 ដូច្នេះ y = 2។ (x = 3 ជាអាស៊ីមតូតឈរ)។',
    ),
    trueFalse(
      'អនុគមន៍ f(x) = 1/x មានអាស៊ីមតូតឈរ x = 0 និងអាស៊ីមតូតដេក y = 0។',
      true,
      'នៅ x → 0 នោះ f → ±∞ (x = 0)។ នៅ x → ±∞ នោះ f → 0 (y = 0)។',
    ),
  ],
  'continuity-of-functions': [
    mc(
      'អនុគមន៍ f ជាប់នៅ x = a លុះត្រាតែ៖',
      [
        ['lim(x→a) f(x) = f(a)', true],
        ['f(a) = 0', false],
        ['f′(a) មាន', false],
        ['lim(x→a) f(x) = ∞', false],
      ],
      'ភាពជាប់តម្រូវឱ្យលីមីតមាន f(a) មាន និងស្មើគ្នា។',
    ),
    trueFalse(
      'គ្រប់អនុគមន៍ពហុធាជាប់លើ ℝ ទាំងមូល។',
      true,
      'ពហុធាជាប់នៅគ្រប់ចំណុច ព្រោះវាបង្កើតដោយបូក ដក គុណនៃ x។',
    ),
    numeric(
      'អនុគមន៍ f(x) = (x² − 1)/(x − 1) សម្រាប់ x ≠ 1។ តើត្រូវកំណត់ f(1) ស្មើប៉ុន្មាន ដើម្បីឱ្យ f ជាប់នៅ x = 1?',
      2,
      'lim(x→1) (x² − 1)/(x − 1) = lim (x + 1) = 2 ដូច្នេះ f(1) = 2។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 3 — Derivatives ─────────────────────────────────────────── */
  'derivative-definition': [
    mc(
      'និយមន័យដេរីវេ f′(a) គឺ៖',
      [
        ['lim(h→0) [f(a + h) − f(a)] / h', true],
        ['f(a) / a', false],
        ['lim(h→0) f(a + h)', false],
        ['[f(a + h) + f(a)] / h', false],
      ],
      'ដេរីវេជាលីមីតនៃសមាមាត្រកំណើន នៅពេល h → 0។',
    ),
    numeric(
      'សម្រាប់ f(x) = x² គណនា f′(3)។',
      6,
      'f′(x) = 2x ដូច្នេះ f′(3) = 2 × 3 = 6។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ដេរីវេ f′(a) តំណាងឱ្យជម្រាលនៃបន្ទាត់ប៉ះនឹងក្រាបនៅចំណុច x = a។',
      true,
      'នេះជាអត្ថន័យធរណីមាត្រនៃដេរីវេ។',
    ),
  ],
  'derivative-rules': [
    numeric(
      'សម្រាប់ f(x) = x³ គណនា f′(2)។',
      12,
      'f′(x) = 3x² ដូច្នេះ f′(2) = 3 × 4 = 12។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើដេរីវេនៃ sin x គឺជាអ្វី?',
      [
        ['cos x', true],
        ['−cos x', false],
        ['−sin x', false],
        ['tan x', false],
      ],
      '(sin x)′ = cos x។',
    ),
    numeric(
      'សម្រាប់ f(x) = 3x² − 5x + 2 គណនា f′(1)។',
      1,
      'f′(x) = 6x − 5 ដូច្នេះ f′(1) = 6 − 5 = 1។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'chain-rule': [
    numeric(
      'សម្រាប់ f(x) = (2x + 1)³ គណនា f′(0)។',
      6,
      'f′(x) = 3(2x + 1)² × 2 = 6(2x + 1)²។ នៅ x = 0៖ 6 × 1 = 6។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើដេរីវេនៃ e²ˣ គឺជាអ្វី?',
      [
        ['2e²ˣ', true],
        ['e²ˣ', false],
        ['2x · e²ˣ', false],
        ['e²ˣ⁻¹', false],
      ],
      'ក្បួនខ្សែសង្វាក់៖ (e^u)′ = u′ · e^u ដែល u = 2x, u′ = 2 ដូច្នេះ = 2e²ˣ។',
    ),
    trueFalse(
      'ដេរីវេនៃ sin(x²) គឺ 2x · cos(x²)។',
      true,
      'ក្បួនខ្សែសង្វាក់៖ (sin u)′ = u′ cos u ដែល u = x², u′ = 2x។',
    ),
  ],
  'derivative-applications': [
    mc(
      'អនុគមន៍ f កើនលើចន្លោះមួយ នៅពេល៖',
      [
        ['f′(x) > 0', true],
        ['f′(x) < 0', false],
        ['f′(x) = 0', false],
        ['f″(x) > 0', false],
      ],
      'សញ្ញាវិជ្ជមាននៃដេរីវេទី១ បញ្ជាក់ថាអនុគមន៍កើន។',
    ),
    trueFalse(
      'នៅចំណុចអតិបរមាមូលដ្ឋាននៃអនុគមន៍ដេរីវេបាន ដេរីវេទី១ ស្មើសូន្យ។',
      true,
      'នៅចំណុចខ្ពស់បំផុតមូលដ្ឋាន បន្ទាត់ប៉ះផ្តេក ដូច្នេះ f′ = 0។',
    ),
    numeric(
      'អនុគមន៍ f(x) = x² − 4x + 3 មានអប្បបរមានៅ x = ?',
      2,
      'f′(x) = 2x − 4 = 0 → x = 2។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 4 — Functions & curves ──────────────────────────────────── */
  'rational-functions': [
    mc(
      'តើដែននិយមន័យនៃ f(x) = 1/(x − 2) គឺ?',
      [
        ['x ≠ 2', true],
        ['x ≠ 0', false],
        ['x > 2', false],
        ['ចំនួនពិតទាំងអស់', false],
      ],
      'ភាគបែងត្រូវខុសពីសូន្យ៖ x − 2 ≠ 0 → x ≠ 2។',
    ),
    numeric(
      'តើអាស៊ីមតូតឈរនៃ f(x) = (x + 1)/(x − 4) នៅ x = ?',
      4,
      'អាស៊ីមតូតឈរនៅកន្លែងភាគបែងស្មើសូន្យ៖ x − 4 = 0 → x = 4។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'អនុគមន៍សនិទាន f(x) = P(x)/Q(x) មិនកំណត់នៅកន្លែងដែល Q(x) = 0។',
      true,
      'ការចែកនឹងសូន្យគ្មានន័យ ដូច្នេះកន្លែងទាំងនោះមិនស្ថិតក្នុងដែននិយមន័យ។',
    ),
  ],
  'exponential-functions': [
    numeric(
      'ដោះស្រាយ 2ˣ = 8។',
      3,
      '8 = 2³ ដូច្នេះ x = 3។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើអនុគមន៍ f(x) = eˣ មានលក្ខណៈអ្វី?',
      [
        ['កើនជានិច្ច និងវិជ្ជមានជានិច្ច', true],
        ['ថយចុះជានិច្ច', false],
        ['អាចមានតម្លៃអវិជ្ជមាន', false],
        ['ថេរ', false],
      ],
      'eˣ > 0 សម្រាប់គ្រប់ x និងកើនជានិច្ច ព្រោះ (eˣ)′ = eˣ > 0។',
    ),
    trueFalse(
      'aˣ⁺ʸ = aˣ · aʸ សម្រាប់ a > 0។',
      true,
      'នេះជាលក្ខណៈមូលដ្ឋាននៃស្វ័យគុណ។',
    ),
  ],
  'logarithm-functions': [
    numeric(
      'គណនា log₂ 8។',
      3,
      'log₂ 8 = log₂ 2³ = 3។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើ ln 1 មានតម្លៃប៉ុន្មាន?',
      [
        ['0', true],
        ['1', false],
        ['e', false],
        ['មិនកំណត់', false],
      ],
      'ln 1 = 0 ព្រោះ e⁰ = 1។',
    ),
    trueFalse(
      'ln(a · b) = ln a + ln b សម្រាប់ a, b > 0។',
      true,
      'នេះជាលក្ខណៈផលគុណនៃលោការីត។',
    ),
  ],
  'complete-curve-sketching': [
    mc(
      'ចំណុចរបត់នៃក្រាបស្ថិតនៅកន្លែងដែល៖',
      [
        ['f″(x) = 0 ហើយប្តូរសញ្ញា', true],
        ['f′(x) = 0', false],
        ['f(x) = 0', false],
        ['x = 0', false],
      ],
      'ចំណុចរបត់ជាកន្លែងកោងប្តូរទិស — ដេរីវេទី២ ស្មើសូន្យ ហើយប្តូរសញ្ញា។',
    ),
    trueFalse(
      'ដើម្បីសិក្សាអថេរភាព(ការកើន-ថយ)នៃអនុគមន៍ គេសិក្សាសញ្ញានៃដេរីវេទី១។',
      true,
      'សញ្ញា f′ បញ្ជាក់ថាអនុគមន៍កើន (f′ > 0) ឬថយ (f′ < 0)។',
    ),
    numeric(
      'សម្រាប់ f(x) = x³ − 3x តើសមីការ f′(x) = 0 មានឫសប៉ុន្មាន?',
      2,
      'f′(x) = 3x² − 3 = 0 → x² = 1 → x = ±1 គឺ 2 ឫស។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 5 — Integrals ───────────────────────────────────────────── */
  'indefinite-integrals': [
    mc(
      'គណនា ∫ x² dx។',
      [
        ['x³/3 + C', true],
        ['x³ + C', false],
        ['2x + C', false],
        ['3x³ + C', false],
      ],
      '∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C ដែល n = 2 ផ្តល់ x³/3 + C។',
    ),
    numeric(
      '∫ x³ dx = x⁴/n + C។ តើ n = ?',
      4,
      '∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C ដូច្នេះសម្រាប់ x³ គេបាន x⁴/4 → n = 4។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ព្រីមីទីវនៃអនុគមន៍មួយមិនមានតែមួយទេ ព្រោះវាខុសគ្នាដោយថេរ C។',
      true,
      'ប្រសិនបើ F ជាព្រីមីទីវ នោះ F + C ក៏ជាព្រីមីទីវដែរ សម្រាប់គ្រប់ថេរ C។',
    ),
  ],
  'integration-techniques': [
    mc(
      'គណនា ∫ (1/x) dx។',
      [
        ['ln|x| + C', true],
        ['1/x² + C', false],
        ['x²/2 + C', false],
        ['−1/x² + C', false],
      ],
      '∫ (1/x) dx = ln|x| + C។',
    ),
    trueFalse(
      'វិធីជំនួសអថេរ (substitution) ជាវិធីបញ្ច្រាសនៃក្បួនខ្សែសង្វាក់។',
      true,
      'ការជំនួសអថេរ "ស្រាយ" ដេរីវេផ្សំដែលក្បួនខ្សែសង្វាក់បង្កើត។',
    ),
    trueFalse(
      '∫ cos x dx = sin x + C។',
      true,
      'ព្រីមីទីវនៃ cos x គឺ sin x ព្រោះ (sin x)′ = cos x។',
    ),
  ],
  'definite-integrals': [
    numeric(
      'គណនា ∫₀¹ 2x dx។',
      1,
      'ព្រីមីទីវនៃ 2x គឺ x²។ [x²]₀¹ = 1 − 0 = 1។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តាមទ្រឹស្តីបទមូលដ្ឋាននៃអាំងតេក្រាល ∫ₐᵇ f(x) dx ស្មើ៖',
      [
        ['F(b) − F(a)', true],
        ['F(a) − F(b)', false],
        ['F(b) + F(a)', false],
        ['f(b) − f(a)', false],
      ],
      'ដែល F ជាព្រីមីទីវនៃ f នោះ ∫ₐᵇ f = F(b) − F(a)។',
    ),
    trueFalse(
      '∫ₐᵃ f(x) dx = 0។',
      true,
      'ព្រំដែនខាងលើ និងខាងក្រោមដូចគ្នា ដូច្នេះផ្ទៃ = 0។',
    ),
  ],
  'integral-applications': [
    mc(
      'ផ្ទៃក្រឡាក្រោមខ្សែកោង y = f(x) ≥ 0 ពី x = a ដល់ x = b គណនាដោយ៖',
      [
        ['∫ₐᵇ f(x) dx', true],
        ['f(b) − f(a)', false],
        ['F(a)', false],
        ['∫ₐᵇ f′(x) dx', false],
      ],
      'អាំងតេក្រាលកំណត់នៃអនុគមន៍វិជ្ជមានផ្តល់ផ្ទៃរវាងខ្សែកោង និងអ័ក្ស Ox។',
    ),
    numeric(
      'គណនាផ្ទៃក្រឡាក្រោមខ្សែ y = x ពី x = 0 ដល់ x = 2 គឺ ∫₀² x dx។',
      2,
      '[x²/2]₀² = 4/2 − 0 = 2។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'មាឌនៃរូបកកើតដោយវិលខ្សែកោង y = f(x) ជុំវិញអ័ក្ស Ox គណនាដោយ π∫ y² dx។',
      true,
      'នេះជារូបមន្តមាឌវិលជុំ (disk method)។',
    ),
  ],

  /* ── Chapter 6 — Differential equations ──────────────────────────────── */
  'differential-equations-first-order': [
    mc(
      'តើដំណោះស្រាយទូទៅនៃ y′ = y គឺជាអ្វី?',
      [
        ['y = Ceˣ', true],
        ['y = eˣ + C', false],
        ['y = Cx', false],
        ['y = x²/2', false],
      ],
      'y′ = y ជាកំណើនអិចស្ប៉ូណង់ស្យែល ដែលមានដំណោះស្រាយ y = Ceˣ។',
    ),
    trueFalse(
      'សមីការ y′ = ky មានដំណោះស្រាយ y = Ceᵏˣ។',
      true,
      'នេះជាគំរូកំណើន/ការពុកផុយអិចស្ប៉ូណង់ស្យែលមូលដ្ឋាន។',
    ),
    numeric(
      'តើសមីការ y″ + 3y′ + 2y = 0 មានលំដាប់(order)ប៉ុន្មាន?',
      2,
      'លំដាប់ស្មើនឹងដេរីវេខ្ពស់បំផុត គឺ y″ ដូច្នេះលំដាប់ = 2។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'differential-equations-second-order': [
    mc(
      'តើសមីការលក្ខណៈនៃ y″ + 3y′ + 2y = 0 គឺជាអ្វី?',
      [
        ['r² + 3r + 2 = 0', true],
        ['r² + 2r + 3 = 0', false],
        ['3r + 2 = 0', false],
        ['r² + 3r = 0', false],
      ],
      'ជំនួស y″ → r², y′ → r, y → 1 ផ្តល់ r² + 3r + 2 = 0។',
    ),
    numeric(
      'សមីការលក្ខណៈ r² − 5r + 6 = 0 មានឫស r = 2 និង r = ?',
      3,
      'r² − 5r + 6 = (r − 2)(r − 3) = 0 ដូច្នេះឫសទីពីរគឺ r = 3។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'បើសមីការលក្ខណៈមានឫសពិតផ្សេងគ្នាពីរ r₁, r₂ នោះដំណោះស្រាយទូទៅគឺ y = C₁eʳ¹ˣ + C₂eʳ²ˣ។',
      true,
      'នេះជាទម្រង់ដំណោះស្រាយសម្រាប់ឫសពិតផ្សេងគ្នា។',
    ),
  ],
  'differential-equations-applications': [
    mc(
      'គំរូកំណើនអិចស្ប៉ូណង់ស្យែលនៃចំនួនប្រជាជនសរសេរជា៖',
      [
        ['dP/dt = kP', true],
        ['dP/dt = k', false],
        ['P = kt', false],
        ['dP/dt = P²', false],
      ],
      'អត្រាកំណើនសមាមាត្រនឹងចំនួនបច្ចុប្បន្ន៖ dP/dt = kP។',
    ),
    trueFalse(
      'ក្នុងគំរូការពុកផុយវិទ្យុសកម្ម បរិមាណថយចុះតាមអិចស្ប៉ូណង់ស្យែល។',
      true,
      'ការពុកផុយមានទម្រង់ N(t) = N₀e⁻ᵏᵗ ដែល k > 0។',
    ),
    numeric(
      'សម្រាប់គំរូ P(t) = 100e⁰·²ᵗ តើតម្លៃដើម P(0) ស្មើប៉ុន្មាន?',
      100,
      'P(0) = 100e⁰ = 100 × 1 = 100។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 7 — Probability & statistics ────────────────────────────── */
  'permutations-combinations': [
    numeric(
      'គណនា 5! (ហ្វាក់តូរីយែល ៥)។',
      120,
      '5! = 5 × 4 × 3 × 2 × 1 = 120។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនាបន្សំ C(5, 2)។',
      10,
      'C(5, 2) = 5! / (2! · 3!) = 120 / (2 × 6) = 10។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើ C(n, 0) មានតម្លៃប៉ុន្មាន សម្រាប់គ្រប់ n ≥ 0?',
      [
        ['1', true],
        ['0', false],
        ['n', false],
        ['n!', false],
      ],
      'មានវិធីតែមួយក្នុងការជ្រើសរើសគ្មានវត្ថុ ដូច្នេះ C(n, 0) = 1។',
    ),
  ],
  'basic-probability': [
    numeric(
      'បោះគ្រាប់ឡុកឡាក់យុត្តិធម៌ ៦ មុខ ម្តង។ តើប្រូបាប៊ីលីតេទទួលបានលេខគូ ស្មើប៉ុន្មាន?',
      0.5,
      'លេខគូគឺ {2, 4, 6} ដូច្នេះ P = 3/6 = 0.5។',
      { tolerance: 0.001, points: 2 },
    ),
    mc(
      'តើប្រូបាប៊ីលីតេនៃព្រឹត្តិការណ៍ណាមួយស្ថិតក្នុងចន្លោះណា?',
      [
        ['0 ≤ P ≤ 1', true],
        ['−1 ≤ P ≤ 1', false],
        ['0 ≤ P ≤ 100', false],
        ['P ≥ 1', false],
      ],
      'ប្រូបាប៊ីលីតេតែងតែស្ថិតរវាង 0 (មិនអាចកើត) និង 1 (កើតប្រាកដ)។',
    ),
    trueFalse(
      'ផលបូកនៃប្រូបាប៊ីលីតេនៃលទ្ធផលទាំងអស់ក្នុងលំហគំរូ ស្មើ 1។',
      true,
      'លទ្ធផលមួយក្នុងចំណោមទាំងអស់ត្រូវតែកើត ដូច្នេះផលបូក = 1។',
    ),
  ],
  'conditional-probability': [
    mc(
      'រូបមន្តប្រូបាប៊ីលីតេលក្ខខណ្ឌ P(A|B) គឺ៖',
      [
        ['P(A ∩ B) / P(B)', true],
        ['P(A) / P(B)', false],
        ['P(A ∩ B) / P(A)', false],
        ['P(A) · P(B)', false],
      ],
      'P(A|B) = P(A ∩ B) / P(B) សម្រាប់ P(B) > 0។',
    ),
    trueFalse(
      'ប្រសិនបើ A និង B ឯករាជ្យ នោះ P(A ∩ B) = P(A) · P(B)។',
      true,
      'នេះជានិយមន័យនៃឯករាជ្យភាព។',
    ),
    numeric(
      'ដឹងថា P(A) = 0.5 និង P(B|A) = 0.4។ គណនា P(A ∩ B)។',
      0.2,
      'P(A ∩ B) = P(A) · P(B|A) = 0.5 × 0.4 = 0.2។',
      { tolerance: 0.001, points: 2 },
    ),
  ],
  'random-variables-binomial': [
    numeric(
      'អថេរចៃដន្យ X ~ B(n = 10, p = 0.5)។ គណនាមធ្យម(esperance) E(X)។',
      5,
      'E(X) = np = 10 × 0.5 = 5។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើមធ្យម E(X) នៃច្បាប់ប៊ីណូម B(n, p) គឺ?',
      [
        ['np', true],
        ['np(1 − p)', false],
        ['p', false],
        ['n/p', false],
      ],
      'មធ្យមនៃច្បាប់ប៊ីណូមគឺ E(X) = np។',
    ),
    numeric(
      'គណនាវ៉ារ្យ៉ង់(variance) នៃ B(n = 4, p = 0.5)។',
      1,
      'V(X) = np(1 − p) = 4 × 0.5 × 0.5 = 1។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 8 — Space geometry ──────────────────────────────────────── */
  'vectors-in-space': [
    numeric(
      'គណនាប្រវែងនៃវ៉ិចទ័រ u = (3, 0, 4)។',
      5,
      '|u| = √(3² + 0² + 4²) = √25 = 5។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើវ៉ិចទ័រក្នុងលំហ(3D)មានសមាសភាគប៉ុន្មាន?',
      [
        ['3', true],
        ['2', false],
        ['1', false],
        ['4', false],
      ],
      'ក្នុងលំហបីវិមាត្រ វ៉ិចទ័រមានសមាសភាគ (x, y, z) គឺ 3។',
    ),
    trueFalse(
      'វ៉ិចទ័រសូន្យមានប្រវែងស្មើ 0។',
      true,
      'វ៉ិចទ័រសូន្យ (0, 0, 0) មានប្រវែង √0 = 0។',
    ),
  ],
  'dot-and-cross-product': [
    numeric(
      'គណនាផលគុណស្កាលែរ (1, 2, 3) · (4, 5, 6)។',
      32,
      'u · v = 1×4 + 2×5 + 3×6 = 4 + 10 + 18 = 32។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ប្រសិនបើវ៉ិចទ័រមិនសូន្យពីរកាត់កែងគ្នា នោះផលគុណស្កាលែររបស់វា ស្មើ៖',
      [
        ['0', true],
        ['1', false],
        ['−1', false],
        ['ផលគុណនៃប្រវែងទាំងពីរ', false],
      ],
      'u · v = |u||v|cos θ ។ នៅពេលកាត់កែង θ = 90° ដូច្នេះ cos θ = 0 → u · v = 0។',
    ),
    trueFalse(
      'ផលគុណវ៉ិចទ័រ u × v កាត់កែងនឹងទាំង u និង v។',
      true,
      'នេះជាលក្ខណៈមូលដ្ឋាននៃផលគុណវ៉ិចទ័រ។',
    ),
  ],
  'lines-and-planes': [
    mc(
      'តើវ៉ិចទ័រណរម៉ាល់(normal)នៃប្លង់ 2x + 3y − z + 5 = 0 គឺជាអ្វី?',
      [
        ['(2, 3, −1)', true],
        ['(2, 3, 5)', false],
        ['(2, 3, 1)', false],
        ['(5, 0, 0)', false],
      ],
      'មេគុណនៃ x, y, z ក្នុងសមីការប្លង់បង្កើតវ៉ិចទ័រណរម៉ាល់ (2, 3, −1)។',
    ),
    trueFalse(
      'សមីការប្លង់ក្នុងលំហមានទម្រង់ ax + by + cz + d = 0។',
      true,
      'នេះជាទម្រង់ទូទៅ(cartesian)នៃប្លង់ ដែល (a, b, c) ជាវ៉ិចទ័រណរម៉ាល់។',
    ),
    trueFalse(
      'ខ្សែបន្ទាត់ក្នុងលំហកំណត់បានដោយចំណុចមួយ និងវ៉ិចទ័រទិសដៅ។',
      true,
      'ចំណុចផ្តល់ទីតាំង និងវ៉ិចទ័រទិសដៅផ្តល់ទិសនៃខ្សែបន្ទាត់។',
    ),
  ],
  'distances-and-angles': [
    numeric(
      'គណនាចម្ងាយរវាងចំណុច O(0, 0, 0) និង A(1, 2, 2)។',
      3,
      'd = √(1² + 2² + 2²) = √9 = 3។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'មុំ θ រវាងវ៉ិចទ័រមិនសូន្យពីរ u និង v គណនាដោយ៖',
      [
        ['cos θ = (u · v) / (|u| |v|)', true],
        ['sin θ = (u · v) / (|u| |v|)', false],
        ['cos θ = u · v', false],
        ['cos θ = |u| · |v|', false],
      ],
      'ពីរូបមន្ត u · v = |u||v|cos θ គេទាញបាន cos θ = (u · v)/(|u||v|)។',
    ),
    trueFalse(
      'ចម្ងាយរវាងចំណុចពីរក្នុងលំហគណនាដោយរូបមន្តអឺគ្លីត √((Δx)² + (Δy)² + (Δz)²)។',
      true,
      'នេះជារូបមន្តចម្ងាយអឺគ្លីតក្នុងបីវិមាត្រ។',
    ),
  ],
}
