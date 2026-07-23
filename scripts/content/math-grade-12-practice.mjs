// Grade 12 Mathematics — extra practice questions, Khmer only.
//
// These are appended to each lesson's quiz at seed time (see seed.mjs), taking
// every quiz from 3 → 6 questions so students get real retrieval practice, not
// just a spot check. Keyed by lesson slug (must match math-grade-12.mjs).
//
// Answer keys are hand-verified. Notation: inline LaTeX math delimited by $…$,
// rendered with KaTeX by the web quiz player (see components/learn/math-text).
// Keep Khmer OUT of math — the math fonts have no Khmer glyphs. Shapes match the
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
      'តើផ្នែកពិត $\\operatorname{Re}(z)$ នៃចំនួន $z = -2 + 7i$ មានតម្លៃប៉ុន្មាន?',
      [
        ['$-2$', true],
        ['$7$', false],
        ['$7i$', false],
        ['$2$', false],
      ],
      '$\\operatorname{Re}(z)$ ជាផ្នែកពិត គឺ $a$ ក្នុងទម្រង់ $z = a + bi$។ ដូច្នេះ $\\operatorname{Re}(z) = -2$។',
    ),
    numeric(
      'គណនាតម្លៃនៃ $i^{38}$។',
      -1,
      '$38 = 4 \\times 9 + 2$ ដូច្នេះ $i^{38} = i^2 = -1$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ចំនួន $5i$ ជាចំនួនកុំផ្លិចនិមិត្តសុទ្ធ។',
      true,
      'ចំនួនកុំផ្លិចនិមិត្តសុទ្ធមានទម្រង់ $bi$ ($a = 0$, $b \\ne 0$)។ $5i$ ត្រូវនឹងលក្ខណៈនេះ។',
    ),
  ],
  'complex-numbers-operations': [
    mc(
      'គណនា $(2 + 3i) + (4 - i)$។',
      [
        ['$6 + 2i$', true],
        ['$6 + 4i$', false],
        ['$6 - 2i$', false],
        ['$8 + 2i$', false],
      ],
      'បូកផ្នែកពិតនឹងផ្នែកពិត និងផ្នែកកុំផ្លិចនឹងផ្នែកកុំផ្លិច៖ $(2+4) + (3-1)i = 6 + 2i$។',
    ),
    numeric(
      'គណនាផ្នែកពិត $\\operatorname{Re}$ នៃផលគុណ $(2 + 3i)(1 - i)$។',
      5,
      '$(2+3i)(1-i) = 2 - 2i + 3i - 3i^2 = 2 + i + 3 = 5 + i$។ ដូច្នេះ $\\operatorname{Re} = 5$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ផលគុណនៃចំនួនកុំផ្លិច $z$ នឹងផ្សំរបស់វា $\\bar{z}$ ជាចំនួនពិតជានិច្ច។',
      true,
      '$z \\cdot \\bar{z} = a^2 + b^2 = |z|^2$ ដែលជាចំនួនពិតវិជ្ជមាន ឬសូន្យ។',
    ),
  ],
  'complex-numbers-polar-form': [
    numeric(
      'គណនាម៉ូឌុល $|3 + 4i|$។',
      5,
      '$|a + bi| = \\sqrt{a^2 + b^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើម៉ូឌុលនៃ $z = -1 + i\\sqrt{3}$ មានតម្លៃប៉ុន្មាន?',
      [
        ['$2$', true],
        ['$4$', false],
        ['$\\sqrt{2}$', false],
        ['$1$', false],
      ],
      '$|z| = \\sqrt{(-1)^2 + (\\sqrt{3})^2} = \\sqrt{1 + 3} = \\sqrt{4} = 2$។',
    ),
    trueFalse(
      'អាគុយម៉ង់នៃ $i$ គឺ $\\pi/2$។',
      true,
      '$i$ ស្ថិតនៅលើអ័ក្សនិមិត្តវិជ្ជមាន ដូច្នេះមុំរបស់វាគឺ $\\pi/2$។',
    ),
  ],
  'complex-numbers-equations': [
    mc(
      'ដោះស្រាយសមីការ $z^2 = -9$ ក្នុង $\\mathbb{C}$។',
      [
        ['$z = \\pm 3i$', true],
        ['$z = \\pm 3$', false],
        ['$z = \\pm 9i$', false],
        ['$z = 3i$ តែប៉ុណ្ណោះ', false],
      ],
      '$z^2 = -9 = 9i^2$ ដូច្នេះ $z = \\pm 3i$។',
    ),
    trueFalse(
      'គ្រប់សមីការពហុធាដឺក្រេ $n$ ($n \\ge 1$) មានឫសយ៉ាងច្រើន $n$ ក្នុង $\\mathbb{C}$ រាប់ទាំងពហុគុណ។',
      true,
      'នេះជាទ្រឹស្តីបទមូលដ្ឋាននៃពិជគណិត។',
    ),
    numeric(
      'សមីការ $z^2 - 2z + 5 = 0$ មានឫស $z = 1 + 2i$ និង $z = 1 - 2i$។ គណនាផលបូកនៃឫសទាំងពីរ។',
      2,
      'ផលបូកឫស $= (1 + 2i) + (1 - 2i) = 2$ (ស្របនឹង $-b/a = 2$)។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 2 — Limits & continuity ─────────────────────────────────── */
  'limits-introduction': [
    numeric(
      'គណនា $\\lim\\limits_{x \\to 2} \\dfrac{x^2 - 4}{x - 2}$។',
      4,
      '$\\dfrac{x^2 - 4}{x - 2} = \\dfrac{(x - 2)(x + 2)}{x - 2} = x + 2 \\to 2 + 2 = 4$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើ $\\lim\\limits_{x \\to 0} \\dfrac{\\sin x}{x}$ មានតម្លៃប៉ុន្មាន?',
      [
        ['$1$', true],
        ['$0$', false],
        ['$\\infty$', false],
        ['មិនកំណត់', false],
      ],
      'នេះជាលីមីតត្រីកោណមាត្រមូលដ្ឋាន៖ $\\lim\\limits_{x \\to 0} \\dfrac{\\sin x}{x} = 1$។',
    ),
    trueFalse(
      'ប្រសិនបើ $\\lim\\limits_{x \\to a} f(x)$ មាន នោះវាមានតម្លៃតែមួយគត់។',
      true,
      'នៅពេលលីមីតមាន វាមានតម្លៃឯកតែមួយ (លីមីតឆ្វេង $=$ លីមីតស្តាំ)។',
    ),
  ],
  'limits-indeterminate-forms': [
    mc(
      'តើ $\\lim\\limits_{x \\to 0} \\dfrac{\\sin x}{x}$ ជាទម្រង់មិនកំណត់អ្វី?',
      [
        ['$0/0$', true],
        ['$\\infty/\\infty$', false],
        ['$0 \\cdot \\infty$', false],
        ['$\\infty - \\infty$', false],
      ],
      'នៅ $x = 0$ ភាគយក $\\sin 0 = 0$ និងភាគបែង $0$ ដូច្នេះទម្រង់គឺ $0/0$។',
    ),
    numeric(
      'គណនា $\\lim\\limits_{x \\to 3} \\dfrac{x^2 - 9}{x - 3}$។',
      6,
      '$\\dfrac{x^2 - 9}{x - 3} = x + 3 \\to 3 + 3 = 6$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ទម្រង់ $0/0$ តែងតែផ្តល់លីមីតស្មើ $0$។',
      false,
      '$0/0$ ជាទម្រង់មិនកំណត់ — លីមីតអាចជាតម្លៃណាមួយ ឬមិនមាន។ ត្រូវប្រែក្លាយមុនគណនា។',
    ),
  ],
  'limits-at-infinity-asymptotes': [
    numeric(
      'គណនា $\\lim\\limits_{x \\to \\infty} \\dfrac{3x^2 + 2}{x^2 - 1}$។',
      3,
      'ចែកភាគយក និងភាគបែងនឹង $x^2$៖ $\\dfrac{3 + 2/x^2}{1 - 1/x^2} \\to \\dfrac{3}{1} = 3$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើអាស៊ីមតូតដេក(ផ្តេក)នៃ $f(x) = \\dfrac{2x + 1}{x - 3}$ គឺជាអ្វី?',
      [
        ['$y = 2$', true],
        ['$y = 0$', false],
        ['$y = 1$', false],
        ['$x = 3$', false],
      ],
      'នៅ $x \\to \\infty$ សមាមាត្រនៃមេគុណនាំមុខ $= 2/1 = 2$ ដូច្នេះ $y = 2$។ ($x = 3$ ជាអាស៊ីមតូតឈរ)។',
    ),
    trueFalse(
      'អនុគមន៍ $f(x) = 1/x$ មានអាស៊ីមតូតឈរ $x = 0$ និងអាស៊ីមតូតដេក $y = 0$។',
      true,
      'នៅ $x \\to 0$ នោះ $f \\to \\pm\\infty$ ($x = 0$)។ នៅ $x \\to \\pm\\infty$ នោះ $f \\to 0$ ($y = 0$)។',
    ),
  ],
  'continuity-of-functions': [
    mc(
      'អនុគមន៍ $f$ ជាប់នៅ $x = a$ លុះត្រាតែ៖',
      [
        ['$\\lim\\limits_{x \\to a} f(x) = f(a)$', true],
        ['$f(a) = 0$', false],
        ['$f\'(a)$ មាន', false],
        ['$\\lim\\limits_{x \\to a} f(x) = \\infty$', false],
      ],
      'ភាពជាប់តម្រូវឱ្យលីមីតមាន $f(a)$ មាន និងស្មើគ្នា។',
    ),
    trueFalse(
      'គ្រប់អនុគមន៍ពហុធាជាប់លើ $\\mathbb{R}$ ទាំងមូល។',
      true,
      'ពហុធាជាប់នៅគ្រប់ចំណុច ព្រោះវាបង្កើតដោយបូក ដក គុណនៃ $x$។',
    ),
    numeric(
      'អនុគមន៍ $f(x) = \\dfrac{x^2 - 1}{x - 1}$ សម្រាប់ $x \\ne 1$។ តើត្រូវកំណត់ $f(1)$ ស្មើប៉ុន្មាន ដើម្បីឱ្យ $f$ ជាប់នៅ $x = 1$?',
      2,
      '$\\lim\\limits_{x \\to 1} \\dfrac{x^2 - 1}{x - 1} = \\lim (x + 1) = 2$ ដូច្នេះ $f(1) = 2$។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 3 — Derivatives ─────────────────────────────────────────── */
  'derivative-definition': [
    mc(
      'និយមន័យដេរីវេ $f\'(a)$ គឺ៖',
      [
        ['$\\lim\\limits_{h \\to 0} \\dfrac{f(a + h) - f(a)}{h}$', true],
        ['$f(a) / a$', false],
        ['$\\lim\\limits_{h \\to 0} f(a + h)$', false],
        ['$\\dfrac{f(a + h) + f(a)}{h}$', false],
      ],
      'ដេរីវេជាលីមីតនៃសមាមាត្រកំណើន នៅពេល $h \\to 0$។',
    ),
    numeric(
      'សម្រាប់ $f(x) = x^2$ គណនា $f\'(3)$។',
      6,
      '$f\'(x) = 2x$ ដូច្នេះ $f\'(3) = 2 \\times 3 = 6$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ដេរីវេ $f\'(a)$ តំណាងឱ្យជម្រាលនៃបន្ទាត់ប៉ះនឹងក្រាបនៅចំណុច $x = a$។',
      true,
      'នេះជាអត្ថន័យធរណីមាត្រនៃដេរីវេ។',
    ),
  ],
  'derivative-rules': [
    numeric(
      'សម្រាប់ $f(x) = x^3$ គណនា $f\'(2)$។',
      12,
      '$f\'(x) = 3x^2$ ដូច្នេះ $f\'(2) = 3 \\times 4 = 12$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើដេរីវេនៃ $\\sin x$ គឺជាអ្វី?',
      [
        ['$\\cos x$', true],
        ['$-\\cos x$', false],
        ['$-\\sin x$', false],
        ['$\\tan x$', false],
      ],
      '$(\\sin x)\' = \\cos x$។',
    ),
    numeric(
      'សម្រាប់ $f(x) = 3x^2 - 5x + 2$ គណនា $f\'(1)$។',
      1,
      '$f\'(x) = 6x - 5$ ដូច្នេះ $f\'(1) = 6 - 5 = 1$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'chain-rule': [
    numeric(
      'សម្រាប់ $f(x) = (2x + 1)^3$ គណនា $f\'(0)$។',
      6,
      '$f\'(x) = 3(2x + 1)^2 \\times 2 = 6(2x + 1)^2$។ នៅ $x = 0$៖ $6 \\times 1 = 6$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើដេរីវេនៃ $e^{2x}$ គឺជាអ្វី?',
      [
        ['$2e^{2x}$', true],
        ['$e^{2x}$', false],
        ['$2x \\cdot e^{2x}$', false],
        ['$e^{2x-1}$', false],
      ],
      'ក្បួនខ្សែសង្វាក់៖ $(e^u)\' = u\' \\cdot e^u$ ដែល $u = 2x$, $u\' = 2$ ដូច្នេះ $= 2e^{2x}$។',
    ),
    trueFalse(
      'ដេរីវេនៃ $\\sin(x^2)$ គឺ $2x \\cdot \\cos(x^2)$។',
      true,
      'ក្បួនខ្សែសង្វាក់៖ $(\\sin u)\' = u\' \\cos u$ ដែល $u = x^2$, $u\' = 2x$។',
    ),
  ],
  'derivative-applications': [
    mc(
      'អនុគមន៍ $f$ កើនលើចន្លោះមួយ នៅពេល៖',
      [
        ['$f\'(x) > 0$', true],
        ['$f\'(x) < 0$', false],
        ['$f\'(x) = 0$', false],
        ['$f\'\'(x) > 0$', false],
      ],
      'សញ្ញាវិជ្ជមាននៃដេរីវេទី១ បញ្ជាក់ថាអនុគមន៍កើន។',
    ),
    trueFalse(
      'នៅចំណុចអតិបរមាមូលដ្ឋាននៃអនុគមន៍ដេរីវេបាន ដេរីវេទី១ ស្មើសូន្យ។',
      true,
      'នៅចំណុចខ្ពស់បំផុតមូលដ្ឋាន បន្ទាត់ប៉ះផ្តេក ដូច្នេះ $f\' = 0$។',
    ),
    numeric(
      'អនុគមន៍ $f(x) = x^2 - 4x + 3$ មានអប្បបរមានៅ $x = ?$',
      2,
      '$f\'(x) = 2x - 4 = 0 \\to x = 2$។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 4 — Functions & curves ──────────────────────────────────── */
  'rational-functions': [
    mc(
      'តើដែននិយមន័យនៃ $f(x) = \\dfrac{1}{x - 2}$ គឺ?',
      [
        ['$x \\ne 2$', true],
        ['$x \\ne 0$', false],
        ['$x > 2$', false],
        ['ចំនួនពិតទាំងអស់', false],
      ],
      'ភាគបែងត្រូវខុសពីសូន្យ៖ $x - 2 \\ne 0 \\to x \\ne 2$។',
    ),
    numeric(
      'តើអាស៊ីមតូតឈរនៃ $f(x) = \\dfrac{x + 1}{x - 4}$ នៅ $x = ?$',
      4,
      'អាស៊ីមតូតឈរនៅកន្លែងភាគបែងស្មើសូន្យ៖ $x - 4 = 0 \\to x = 4$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'អនុគមន៍សនិទាន $f(x) = \\dfrac{P(x)}{Q(x)}$ មិនកំណត់នៅកន្លែងដែល $Q(x) = 0$។',
      true,
      'ការចែកនឹងសូន្យគ្មានន័យ ដូច្នេះកន្លែងទាំងនោះមិនស្ថិតក្នុងដែននិយមន័យ។',
    ),
  ],
  'exponential-functions': [
    numeric(
      'ដោះស្រាយ $2^x = 8$។',
      3,
      '$8 = 2^3$ ដូច្នេះ $x = 3$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើអនុគមន៍ $f(x) = e^x$ មានលក្ខណៈអ្វី?',
      [
        ['កើនជានិច្ច និងវិជ្ជមានជានិច្ច', true],
        ['ថយចុះជានិច្ច', false],
        ['អាចមានតម្លៃអវិជ្ជមាន', false],
        ['ថេរ', false],
      ],
      '$e^x > 0$ សម្រាប់គ្រប់ $x$ និងកើនជានិច្ច ព្រោះ $(e^x)\' = e^x > 0$។',
    ),
    trueFalse(
      '$a^{x+y} = a^x \\cdot a^y$ សម្រាប់ $a > 0$។',
      true,
      'នេះជាលក្ខណៈមូលដ្ឋាននៃស្វ័យគុណ។',
    ),
  ],
  'logarithm-functions': [
    numeric(
      'គណនា $\\log_2 8$។',
      3,
      '$\\log_2 8 = \\log_2 2^3 = 3$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើ $\\ln 1$ មានតម្លៃប៉ុន្មាន?',
      [
        ['$0$', true],
        ['$1$', false],
        ['$e$', false],
        ['មិនកំណត់', false],
      ],
      '$\\ln 1 = 0$ ព្រោះ $e^0 = 1$។',
    ),
    trueFalse(
      '$\\ln(a \\cdot b) = \\ln a + \\ln b$ សម្រាប់ $a, b > 0$។',
      true,
      'នេះជាលក្ខណៈផលគុណនៃលោការីត។',
    ),
  ],
  'complete-curve-sketching': [
    mc(
      'ចំណុចរបត់នៃក្រាបស្ថិតនៅកន្លែងដែល៖',
      [
        ['$f\'\'(x) = 0$ ហើយប្តូរសញ្ញា', true],
        ['$f\'(x) = 0$', false],
        ['$f(x) = 0$', false],
        ['$x = 0$', false],
      ],
      'ចំណុចរបត់ជាកន្លែងកោងប្តូរទិស — ដេរីវេទី២ ស្មើសូន្យ ហើយប្តូរសញ្ញា។',
    ),
    trueFalse(
      'ដើម្បីសិក្សាអថេរភាព(ការកើន-ថយ)នៃអនុគមន៍ គេសិក្សាសញ្ញានៃដេរីវេទី១។',
      true,
      'សញ្ញា $f\'$ បញ្ជាក់ថាអនុគមន៍កើន ($f\' > 0$) ឬថយ ($f\' < 0$)។',
    ),
    numeric(
      'សម្រាប់ $f(x) = x^3 - 3x$ តើសមីការ $f\'(x) = 0$ មានឫសប៉ុន្មាន?',
      2,
      '$f\'(x) = 3x^2 - 3 = 0 \\to x^2 = 1 \\to x = \\pm 1$ គឺ $2$ ឫស។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 5 — Integrals ───────────────────────────────────────────── */
  'indefinite-integrals': [
    mc(
      'គណនា $\\displaystyle\\int x^2\\,dx$។',
      [
        ['$\\dfrac{x^3}{3} + C$', true],
        ['$x^3 + C$', false],
        ['$2x + C$', false],
        ['$3x^3 + C$', false],
      ],
      '$\\displaystyle\\int x^n\\,dx = \\dfrac{x^{n+1}}{n + 1} + C$ ដែល $n = 2$ ផ្តល់ $\\dfrac{x^3}{3} + C$។',
    ),
    numeric(
      '$\\displaystyle\\int x^3\\,dx = \\dfrac{x^4}{n} + C$។ តើ $n = ?$',
      4,
      '$\\displaystyle\\int x^n\\,dx = \\dfrac{x^{n+1}}{n + 1} + C$ ដូច្នេះសម្រាប់ $x^3$ គេបាន $\\dfrac{x^4}{4} \\to n = 4$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ព្រីមីទីវនៃអនុគមន៍មួយមិនមានតែមួយទេ ព្រោះវាខុសគ្នាដោយថេរ $C$។',
      true,
      'ប្រសិនបើ $F$ ជាព្រីមីទីវ នោះ $F + C$ ក៏ជាព្រីមីទីវដែរ សម្រាប់គ្រប់ថេរ $C$។',
    ),
  ],
  'integration-techniques': [
    mc(
      'គណនា $\\displaystyle\\int \\dfrac{1}{x}\\,dx$។',
      [
        ['$\\ln|x| + C$', true],
        ['$\\dfrac{1}{x^2} + C$', false],
        ['$\\dfrac{x^2}{2} + C$', false],
        ['$-\\dfrac{1}{x^2} + C$', false],
      ],
      '$\\displaystyle\\int \\dfrac{1}{x}\\,dx = \\ln|x| + C$។',
    ),
    trueFalse(
      'វិធីជំនួសអថេរ (substitution) ជាវិធីបញ្ច្រាសនៃក្បួនខ្សែសង្វាក់។',
      true,
      'ការជំនួសអថេរ «ស្រាយ» ដេរីវេផ្សំដែលក្បួនខ្សែសង្វាក់បង្កើត។',
    ),
    trueFalse(
      '$\\displaystyle\\int \\cos x\\,dx = \\sin x + C$។',
      true,
      'ព្រីមីទីវនៃ $\\cos x$ គឺ $\\sin x$ ព្រោះ $(\\sin x)\' = \\cos x$។',
    ),
  ],
  'definite-integrals': [
    numeric(
      'គណនា $\\displaystyle\\int_0^1 2x\\,dx$។',
      1,
      'ព្រីមីទីវនៃ $2x$ គឺ $x^2$។ $[x^2]_0^1 = 1 - 0 = 1$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តាមទ្រឹស្តីបទមូលដ្ឋាននៃអាំងតេក្រាល $\\displaystyle\\int_a^b f(x)\\,dx$ ស្មើ៖',
      [
        ['$F(b) - F(a)$', true],
        ['$F(a) - F(b)$', false],
        ['$F(b) + F(a)$', false],
        ['$f(b) - f(a)$', false],
      ],
      'ដែល $F$ ជាព្រីមីទីវនៃ $f$ នោះ $\\displaystyle\\int_a^b f = F(b) - F(a)$។',
    ),
    trueFalse(
      '$\\displaystyle\\int_a^a f(x)\\,dx = 0$។',
      true,
      'ព្រំដែនខាងលើ និងខាងក្រោមដូចគ្នា ដូច្នេះផ្ទៃ $= 0$។',
    ),
  ],
  'integral-applications': [
    mc(
      'ផ្ទៃក្រឡាក្រោមខ្សែកោង $y = f(x) \\ge 0$ ពី $x = a$ ដល់ $x = b$ គណនាដោយ៖',
      [
        ['$\\displaystyle\\int_a^b f(x)\\,dx$', true],
        ['$f(b) - f(a)$', false],
        ['$F(a)$', false],
        ['$\\displaystyle\\int_a^b f\'(x)\\,dx$', false],
      ],
      'អាំងតេក្រាលកំណត់នៃអនុគមន៍វិជ្ជមានផ្តល់ផ្ទៃរវាងខ្សែកោង និងអ័ក្ស $Ox$។',
    ),
    numeric(
      'គណនាផ្ទៃក្រឡាក្រោមខ្សែ $y = x$ ពី $x = 0$ ដល់ $x = 2$ គឺ $\\displaystyle\\int_0^2 x\\,dx$។',
      2,
      '$\\left[\\dfrac{x^2}{2}\\right]_0^2 = \\dfrac{4}{2} - 0 = 2$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'មាឌនៃរូបកកើតដោយវិលខ្សែកោង $y = f(x)$ ជុំវិញអ័ក្ស $Ox$ គណនាដោយ $\\pi\\displaystyle\\int y^2\\,dx$។',
      true,
      'នេះជារូបមន្តមាឌវិលជុំ (disk method)។',
    ),
  ],

  /* ── Chapter 6 — Differential equations ──────────────────────────────── */
  'differential-equations-first-order': [
    mc(
      'តើដំណោះស្រាយទូទៅនៃ $y\' = y$ គឺជាអ្វី?',
      [
        ['$y = Ce^x$', true],
        ['$y = e^x + C$', false],
        ['$y = Cx$', false],
        ['$y = \\dfrac{x^2}{2}$', false],
      ],
      '$y\' = y$ ជាកំណើនអិចស្ប៉ូណង់ស្យែល ដែលមានដំណោះស្រាយ $y = Ce^x$។',
    ),
    trueFalse(
      'សមីការ $y\' = ky$ មានដំណោះស្រាយ $y = Ce^{kx}$។',
      true,
      'នេះជាគំរូកំណើន/ការពុកផុយអិចស្ប៉ូណង់ស្យែលមូលដ្ឋាន។',
    ),
    numeric(
      'តើសមីការ $y\'\' + 3y\' + 2y = 0$ មានលំដាប់(order)ប៉ុន្មាន?',
      2,
      'លំដាប់ស្មើនឹងដេរីវេខ្ពស់បំផុត គឺ $y\'\'$ ដូច្នេះលំដាប់ $= 2$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'differential-equations-second-order': [
    mc(
      'តើសមីការលក្ខណៈនៃ $y\'\' + 3y\' + 2y = 0$ គឺជាអ្វី?',
      [
        ['$r^2 + 3r + 2 = 0$', true],
        ['$r^2 + 2r + 3 = 0$', false],
        ['$3r + 2 = 0$', false],
        ['$r^2 + 3r = 0$', false],
      ],
      'ជំនួស $y\'\' \\to r^2$, $y\' \\to r$, $y \\to 1$ ផ្តល់ $r^2 + 3r + 2 = 0$។',
    ),
    numeric(
      'សមីការលក្ខណៈ $r^2 - 5r + 6 = 0$ មានឫស $r = 2$ និង $r = ?$',
      3,
      '$r^2 - 5r + 6 = (r - 2)(r - 3) = 0$ ដូច្នេះឫសទីពីរគឺ $r = 3$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'បើសមីការលក្ខណៈមានឫសពិតផ្សេងគ្នាពីរ $r_1, r_2$ នោះដំណោះស្រាយទូទៅគឺ $y = C_1 e^{r_1 x} + C_2 e^{r_2 x}$។',
      true,
      'នេះជាទម្រង់ដំណោះស្រាយសម្រាប់ឫសពិតផ្សេងគ្នា។',
    ),
  ],
  'differential-equations-applications': [
    mc(
      'គំរូកំណើនអិចស្ប៉ូណង់ស្យែលនៃចំនួនប្រជាជនសរសេរជា៖',
      [
        ['$\\dfrac{dP}{dt} = kP$', true],
        ['$\\dfrac{dP}{dt} = k$', false],
        ['$P = kt$', false],
        ['$\\dfrac{dP}{dt} = P^2$', false],
      ],
      'អត្រាកំណើនសមាមាត្រនឹងចំនួនបច្ចុប្បន្ន៖ $\\dfrac{dP}{dt} = kP$។',
    ),
    trueFalse(
      'ក្នុងគំរូការពុកផុយវិទ្យុសកម្ម បរិមាណថយចុះតាមអិចស្ប៉ូណង់ស្យែល។',
      true,
      'ការពុកផុយមានទម្រង់ $N(t) = N_0 e^{-kt}$ ដែល $k > 0$។',
    ),
    numeric(
      'សម្រាប់គំរូ $P(t) = 100e^{0.2t}$ តើតម្លៃដើម $P(0)$ ស្មើប៉ុន្មាន?',
      100,
      '$P(0) = 100e^0 = 100 \\times 1 = 100$។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 7 — Probability & statistics ────────────────────────────── */
  'permutations-combinations': [
    numeric(
      'គណនា $5!$ (ហ្វាក់តូរីយែល ៥)។',
      120,
      '$5! = 5 \\times 4 \\times 3 \\times 2 \\times 1 = 120$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនាបន្សំ $C(5, 2)$។',
      10,
      '$C(5, 2) = \\dfrac{5!}{2! \\cdot 3!} = \\dfrac{120}{2 \\times 6} = 10$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើ $C(n, 0)$ មានតម្លៃប៉ុន្មាន សម្រាប់គ្រប់ $n \\ge 0$?',
      [
        ['$1$', true],
        ['$0$', false],
        ['$n$', false],
        ['$n!$', false],
      ],
      'មានវិធីតែមួយក្នុងការជ្រើសរើសគ្មានវត្ថុ ដូច្នេះ $C(n, 0) = 1$។',
    ),
  ],
  'basic-probability': [
    numeric(
      'បោះគ្រាប់ឡុកឡាក់យុត្តិធម៌ ៦ មុខ ម្តង។ តើប្រូបាប៊ីលីតេទទួលបានលេខគូ ស្មើប៉ុន្មាន?',
      0.5,
      'លេខគូគឺ $\\{2, 4, 6\\}$ ដូច្នេះ $P = 3/6 = 0.5$។',
      { tolerance: 0.001, points: 2 },
    ),
    mc(
      'តើប្រូបាប៊ីលីតេនៃព្រឹត្តិការណ៍ណាមួយស្ថិតក្នុងចន្លោះណា?',
      [
        ['$0 \\le P \\le 1$', true],
        ['$-1 \\le P \\le 1$', false],
        ['$0 \\le P \\le 100$', false],
        ['$P \\ge 1$', false],
      ],
      'ប្រូបាប៊ីលីតេតែងតែស្ថិតរវាង $0$ (មិនអាចកើត) និង $1$ (កើតប្រាកដ)។',
    ),
    trueFalse(
      'ផលបូកនៃប្រូបាប៊ីលីតេនៃលទ្ធផលទាំងអស់ក្នុងលំហគំរូ ស្មើ $1$។',
      true,
      'លទ្ធផលមួយក្នុងចំណោមទាំងអស់ត្រូវតែកើត ដូច្នេះផលបូក $= 1$។',
    ),
  ],
  'conditional-probability': [
    mc(
      'រូបមន្តប្រូបាប៊ីលីតេលក្ខខណ្ឌ $P(A|B)$ គឺ៖',
      [
        ['$\\dfrac{P(A \\cap B)}{P(B)}$', true],
        ['$\\dfrac{P(A)}{P(B)}$', false],
        ['$\\dfrac{P(A \\cap B)}{P(A)}$', false],
        ['$P(A) \\cdot P(B)$', false],
      ],
      '$P(A|B) = \\dfrac{P(A \\cap B)}{P(B)}$ សម្រាប់ $P(B) > 0$។',
    ),
    trueFalse(
      'ប្រសិនបើ $A$ និង $B$ ឯករាជ្យ នោះ $P(A \\cap B) = P(A) \\cdot P(B)$។',
      true,
      'នេះជានិយមន័យនៃឯករាជ្យភាព។',
    ),
    numeric(
      'ដឹងថា $P(A) = 0.5$ និង $P(B|A) = 0.4$។ គណនា $P(A \\cap B)$។',
      0.2,
      '$P(A \\cap B) = P(A) \\cdot P(B|A) = 0.5 \\times 0.4 = 0.2$។',
      { tolerance: 0.001, points: 2 },
    ),
  ],
  'random-variables-binomial': [
    numeric(
      'អថេរចៃដន្យ $X \\sim B(n = 10, p = 0.5)$។ គណនាមធ្យម(esperance) $E(X)$។',
      5,
      '$E(X) = np = 10 \\times 0.5 = 5$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើមធ្យម $E(X)$ នៃច្បាប់ប៊ីណូម $B(n, p)$ គឺ?',
      [
        ['$np$', true],
        ['$np(1 - p)$', false],
        ['$p$', false],
        ['$n/p$', false],
      ],
      'មធ្យមនៃច្បាប់ប៊ីណូមគឺ $E(X) = np$។',
    ),
    numeric(
      'គណនាវ៉ារ្យ៉ង់(variance) នៃ $B(n = 4, p = 0.5)$។',
      1,
      '$V(X) = np(1 - p) = 4 \\times 0.5 \\times 0.5 = 1$។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 8 — Space geometry ──────────────────────────────────────── */
  'vectors-in-space': [
    numeric(
      'គណនាប្រវែងនៃវ៉ិចទ័រ $\\vec{u} = (3, 0, 4)$។',
      5,
      '$|\\vec{u}| = \\sqrt{3^2 + 0^2 + 4^2} = \\sqrt{25} = 5$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើវ៉ិចទ័រក្នុងលំហ(3D)មានសមាសភាគប៉ុន្មាន?',
      [
        ['$3$', true],
        ['$2$', false],
        ['$1$', false],
        ['$4$', false],
      ],
      'ក្នុងលំហបីវិមាត្រ វ៉ិចទ័រមានសមាសភាគ $(x, y, z)$ គឺ $3$។',
    ),
    trueFalse(
      'វ៉ិចទ័រសូន្យមានប្រវែងស្មើ $0$។',
      true,
      'វ៉ិចទ័រសូន្យ $(0, 0, 0)$ មានប្រវែង $\\sqrt{0} = 0$។',
    ),
  ],
  'dot-and-cross-product': [
    numeric(
      'គណនាផលគុណស្កាលែរ $(1, 2, 3) \\cdot (4, 5, 6)$។',
      32,
      '$\\vec{u} \\cdot \\vec{v} = 1 \\times 4 + 2 \\times 5 + 3 \\times 6 = 4 + 10 + 18 = 32$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ប្រសិនបើវ៉ិចទ័រមិនសូន្យពីរកាត់កែងគ្នា នោះផលគុណស្កាលែររបស់វា ស្មើ៖',
      [
        ['$0$', true],
        ['$1$', false],
        ['$-1$', false],
        ['ផលគុណនៃប្រវែងទាំងពីរ', false],
      ],
      '$\\vec{u} \\cdot \\vec{v} = |\\vec{u}||\\vec{v}|\\cos\\theta$។ នៅពេលកាត់កែង $\\theta = 90°$ ដូច្នេះ $\\cos\\theta = 0 \\to \\vec{u} \\cdot \\vec{v} = 0$។',
    ),
    trueFalse(
      'ផលគុណវ៉ិចទ័រ $\\vec{u} \\times \\vec{v}$ កាត់កែងនឹងទាំង $\\vec{u}$ និង $\\vec{v}$។',
      true,
      'នេះជាលក្ខណៈមូលដ្ឋាននៃផលគុណវ៉ិចទ័រ។',
    ),
  ],
  'lines-and-planes': [
    mc(
      'តើវ៉ិចទ័រណរម៉ាល់(normal)នៃប្លង់ $2x + 3y - z + 5 = 0$ គឺជាអ្វី?',
      [
        ['$(2, 3, -1)$', true],
        ['$(2, 3, 5)$', false],
        ['$(2, 3, 1)$', false],
        ['$(5, 0, 0)$', false],
      ],
      'មេគុណនៃ $x, y, z$ ក្នុងសមីការប្លង់បង្កើតវ៉ិចទ័រណរម៉ាល់ $(2, 3, -1)$។',
    ),
    trueFalse(
      'សមីការប្លង់ក្នុងលំហមានទម្រង់ $ax + by + cz + d = 0$។',
      true,
      'នេះជាទម្រង់ទូទៅ(cartesian)នៃប្លង់ ដែល $(a, b, c)$ ជាវ៉ិចទ័រណរម៉ាល់។',
    ),
    trueFalse(
      'ខ្សែបន្ទាត់ក្នុងលំហកំណត់បានដោយចំណុចមួយ និងវ៉ិចទ័រទិសដៅ។',
      true,
      'ចំណុចផ្តល់ទីតាំង និងវ៉ិចទ័រទិសដៅផ្តល់ទិសនៃខ្សែបន្ទាត់។',
    ),
  ],
  'distances-and-angles': [
    numeric(
      'គណនាចម្ងាយរវាងចំណុច $O(0, 0, 0)$ និង $A(1, 2, 2)$។',
      3,
      '$d = \\sqrt{1^2 + 2^2 + 2^2} = \\sqrt{9} = 3$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'មុំ $\\theta$ រវាងវ៉ិចទ័រមិនសូន្យពីរ $\\vec{u}$ និង $\\vec{v}$ គណនាដោយ៖',
      [
        ['$\\cos\\theta = \\dfrac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}|\\,|\\vec{v}|}$', true],
        ['$\\sin\\theta = \\dfrac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}|\\,|\\vec{v}|}$', false],
        ['$\\cos\\theta = \\vec{u} \\cdot \\vec{v}$', false],
        ['$\\cos\\theta = |\\vec{u}| \\cdot |\\vec{v}|$', false],
      ],
      'ពីរូបមន្ត $\\vec{u} \\cdot \\vec{v} = |\\vec{u}||\\vec{v}|\\cos\\theta$ គេទាញបាន $\\cos\\theta = \\dfrac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}||\\vec{v}|}$។',
    ),
    trueFalse(
      'ចម្ងាយរវាងចំណុចពីរក្នុងលំហគណនាដោយរូបមន្តអឺគ្លីត $\\sqrt{(\\Delta x)^2 + (\\Delta y)^2 + (\\Delta z)^2}$។',
      true,
      'នេះជារូបមន្តចម្ងាយអឺគ្លីតក្នុងបីវិមាត្រ។',
    ),
  ],
}
