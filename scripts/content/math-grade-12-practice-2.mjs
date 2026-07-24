// Grade 12 Mathematics — second batch of extra practice questions, Khmer only.
//
// Appended after math-grade-12-practice.mjs, taking each lesson's quiz from
// 6 → 9 questions. Same slug keys, same helper shapes, same rules as the first
// practice file: inline LaTeX math ($…$), Khmer kept OUT of math, answer keys
// hand-verified AND checked to be auto-gradable + discriminating by the real
// assessment-service grader (see scripts/validate against graders/index.ts).

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

export const MATH_GRADE_12_PRACTICE_2 = {
  /* ── Chapter 1 — Complex numbers ─────────────────────────────────────── */
  'complex-numbers-definition': [
    numeric(
      'គណនាម៉ូឌុល $|z|$ នៃចំនួន $z = 6 + 8i$។',
      10,
      '$|z| = \\sqrt{6^{2} + 8^{2}} = \\sqrt{36 + 64} = \\sqrt{100} = 10$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ឆ្នូត (conjugué) នៃ $z = 2 - 5i$ គឺ៖',
      [
        ['$2 + 5i$', true],
        ['$-2 + 5i$', false],
        ['$2 - 5i$', false],
        ['$-2 - 5i$', false],
      ],
      'ឆ្នូតនៃ $a + bi$ គឺ $a - bi$។ ដូច្នេះឆ្នូតនៃ $2 - 5i$ គឺ $2 + 5i$។',
    ),
    numeric(
      'គណនាតម្លៃនៃ $i^{100}$។',
      1,
      '$100 = 4 \\times 25$ ដូច្នេះ $i^{100} = (i^{4})^{25} = 1^{25} = 1$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'complex-numbers-operations': [
    mc(
      'គណនា $(1 + i)^{2}$។',
      [
        ['$2i$', true],
        ['$2$', false],
        ['$1 + 2i$', false],
        ['$-2i$', false],
      ],
      '$(1+i)^{2} = 1 + 2i + i^{2} = 1 + 2i - 1 = 2i$។',
    ),
    numeric(
      'គណនាផ្នែកពិតនៃ $(2 + 3i)(2 - 3i)$។',
      13,
      '$(2+3i)(2-3i) = 4 - (3i)^{2} = 4 + 9 = 13$ ជាចំនួនពិត។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ផលគុណ $z \\cdot \\bar{z}$ ជាចំនួនពិតវិជ្ជមានជានិច្ច (សម្រាប់ $z \\neq 0$)។',
      true,
      'ត្រូវ។ $z \\cdot \\bar{z} = a^{2} + b^{2} = |z|^{2} \\geq 0$ ជាចំនួនពិត។',
    ),
  ],
  'complex-numbers-polar-form': [
    numeric(
      'គណនាម៉ូឌុលនៃ $z = 1 + i$។',
      1.4142,
      '$|z| = \\sqrt{1^{2} + 1^{2}} = \\sqrt{2} \\approx 1.414$។',
      { tolerance: 0.01, points: 2 },
    ),
    mc(
      'អាគុយម៉ង់ (មុំ) នៃ $z = 1 + i$ គឺ៖',
      [
        ['$\\dfrac{\\pi}{4}$', true],
        ['$\\dfrac{\\pi}{2}$', false],
        ['$\\dfrac{\\pi}{3}$', false],
        ['$\\dfrac{\\pi}{6}$', false],
      ],
      'ដោយ $a = b = 1 > 0$ មុំ $\\theta = \\arctan\\frac{1}{1} = \\frac{\\pi}{4}$។',
    ),
    numeric(
      'គណនាម៉ូឌុលនៃ $z = \\sqrt{3} + i$។',
      2,
      '$|z| = \\sqrt{(\\sqrt{3})^{2} + 1^{2}} = \\sqrt{3 + 1} = 2$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'complex-numbers-equations': [
    mc(
      'ចម្លើយនៃសមីការ $z^{2} = -1$ គឺ៖',
      [
        ['$z = \\pm i$', true],
        ['$z = \\pm 1$', false],
        ['$z = i$ តែមួយ', false],
        ['គ្មានចម្លើយ', false],
      ],
      '$z^{2} = -1 \\Rightarrow z = \\pm\\sqrt{-1} = \\pm i$។',
    ),
    numeric(
      'ផលបូកនៃឫសទាំងពីរនៃ $z^{2} - 4z + 13 = 0$ គឺប៉ុន្មាន?',
      4,
      'តាមរូបមន្ត Viète ផលបូកឫស $= -\\frac{b}{a} = \\frac{4}{1} = 4$ (ឫសគឺ $2 \\pm 3i$)។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'ផលគុណនៃឫសទាំងពីរនៃ $z^{2} - 4z + 13 = 0$ គឺប៉ុន្មាន?',
      13,
      'តាមរូបមន្ត Viète ផលគុណឫស $= \\frac{c}{a} = 13$ (ព្រោះ $(2+3i)(2-3i) = 13$)។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 2 — Limits & continuity ─────────────────────────────────── */
  'limits-introduction': [
    numeric(
      'គណនា $\\lim_{x \\to 2} \\dfrac{x^{2} - 4}{x - 2}$។',
      4,
      '$\\frac{x^{2}-4}{x-2} = \\frac{(x-2)(x+2)}{x-2} = x + 2 \\to 4$ ពេល $x \\to 2$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនា $\\lim_{x \\to 3} \\dfrac{x^{2} - 9}{x - 3}$។',
      6,
      '$\\frac{x^{2}-9}{x-3} = x + 3 \\to 6$ ពេល $x \\to 3$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តម្លៃនៃ $\\lim_{x \\to 0} \\dfrac{\\sin x}{x}$ គឺ៖',
      [
        ['$1$', true],
        ['$0$', false],
        ['$+\\infty$', false],
        ['មិនកំណត់', false],
      ],
      'នេះជាលីមីតត្រីកោណមាត្រមូលដ្ឋាន៖ $\\lim_{x\\to 0}\\frac{\\sin x}{x} = 1$។',
    ),
  ],
  'limits-indeterminate-forms': [
    numeric(
      'គណនា $\\lim_{x \\to 1} \\dfrac{x^{2} - 1}{x^{2} - 3x + 2}$។',
      -2,
      '$= \\frac{(x-1)(x+1)}{(x-1)(x-2)} = \\frac{x+1}{x-2} \\to \\frac{2}{-1} = -2$ ពេល $x \\to 1$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនា $\\lim_{x \\to +\\infty} \\dfrac{3x^{2} + 1}{x^{2} - 5}$។',
      3,
      'ចែកភាគយក/ភាគបែងនឹង $x^{2}$៖ $\\frac{3 + 1/x^{2}}{1 - 5/x^{2}} \\to 3$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'ទម្រង់ $\\frac{0}{0}$ ជាទម្រង់មិនកំណត់ដែលត្រូវការបំប្លែងមុនគណនា។',
      true,
      'ត្រូវ។ $\\frac{0}{0}$ ជាទម្រង់មិនកំណត់ — ត្រូវសម្រួល (កត្តា ឬឆ្នូត) មុននឹងជំនួស។',
    ),
  ],
  'limits-at-infinity-asymptotes': [
    numeric(
      'គណនា $\\lim_{x \\to +\\infty} \\dfrac{2x + 1}{x - 1}$។',
      2,
      'មេគុណនាំមុខ $\\frac{2}{1} = 2$ ដូច្នេះ $y = 2$ ជាអាស៊ីមតូតដេក។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'អាស៊ីមតូតដេកនៃ $f(x) = \\dfrac{2x + 1}{x - 1}$ គឺ៖',
      [
        ['$y = 2$', true],
        ['$y = 0$', false],
        ['$y = 1$', false],
        ['$x = 1$', false],
      ],
      'ដឺក្រេភាគយក = ដឺក្រេភាគបែង ដូច្នេះអាស៊ីមតូតដេក $y = \\frac{2}{1} = 2$។',
    ),
    numeric(
      'តម្លៃ $x$ នៃអាស៊ីមតូតឈរនៃ $f(x) = \\dfrac{1}{x - 3}$ គឺប៉ុន្មាន?',
      3,
      'ភាគបែងរលត់ត្រង់ $x - 3 = 0$ គឺ $x = 3$ ជាអាស៊ីមតូតឈរ។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'continuity-of-functions': [
    trueFalse(
      'អនុគមន៍ពហុធាជាប់នៅគ្រប់ចំណុចនៃ $\\mathbb{R}$។',
      true,
      'ត្រូវ។ អនុគមន៍ពហុធាជាប់នៅគ្រប់ $x \\in \\mathbb{R}$។',
    ),
    numeric(
      'ដើម្បីឲ្យ $f(x) = \\dfrac{x^{2} - 1}{x - 1}$ ($x \\neq 1$) ជាប់ត្រង់ $x = 1$ តើត្រូវកំណត់ $f(1)$ ស្មើប៉ុន្មាន?',
      2,
      '$\\lim_{x\\to 1}\\frac{x^{2}-1}{x-1} = \\lim_{x\\to 1}(x+1) = 2$ ដូច្នេះ $f(1) = 2$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'អនុគមន៍ $f$ ជាប់ត្រង់ $x = a$ លុះត្រាតែ៖',
      [
        ['$\\lim_{x \\to a} f(x) = f(a)$', true],
        ['$f(a) = 0$', false],
        ['$f\'(a)$ មាន', false],
        ['$\\lim_{x \\to a} f(x) = 0$', false],
      ],
      'និយមន័យភាពជាប់៖ លីមីតនៅ $a$ មាន ហើយស្មើនឹងតម្លៃ $f(a)$។',
    ),
  ],

  /* ── Chapter 3 — Derivatives ─────────────────────────────────────────── */
  'derivative-definition': [
    numeric(
      'សម្រាប់ $f(x) = x^{3}$ គណនា $f\'(2)$។',
      12,
      '$f\'(x) = 3x^{2}$ ដូច្នេះ $f\'(2) = 3 \\times 4 = 12$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'និយមន័យដេរីវេ $f\'(a)$ គឺ៖',
      [
        ['$\\lim_{h \\to 0} \\dfrac{f(a+h) - f(a)}{h}$', true],
        ['$\\lim_{h \\to 0} \\dfrac{f(a) - f(a+h)}{h}$', false],
        ['$\\dfrac{f(a+h) - f(a)}{h}$', false],
        ['$\\lim_{h \\to \\infty} \\dfrac{f(a+h)}{h}$', false],
      ],
      'ដេរីវេជាលីមីតនៃកូអេវិចនៃការប្រែប្រួល ពេល $h \\to 0$។',
    ),
    trueFalse(
      'ដេរីវេនៃអនុគមន៍ថេរ $f(x) = c$ ស្មើនឹង $0$។',
      true,
      'ត្រូវ។ អនុគមន៍ថេរមិនប្រែប្រួល ដូច្នេះ $f\'(x) = 0$។',
    ),
  ],
  'derivative-rules': [
    numeric(
      'គណនាដេរីវេនៃ $f(x) = x^{4}$ ត្រង់ $x = 2$។',
      32,
      '$f\'(x) = 4x^{3}$ ដូច្នេះ $f\'(2) = 4 \\times 8 = 32$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ដេរីវេនៃ $x^{n}$ គឺ៖',
      [
        ['$n x^{n-1}$', true],
        ['$n x^{n+1}$', false],
        ['$x^{n-1}$', false],
        ['$(n-1) x^{n}$', false],
      ],
      'ក្បួនអំណាច៖ $(x^{n})\' = n x^{n-1}$។',
    ),
    numeric(
      'គណនាដេរីវេនៃ $f(x) = 3x^{2} + 2x$ ត្រង់ $x = 1$។',
      8,
      '$f\'(x) = 6x + 2$ ដូច្នេះ $f\'(1) = 6 + 2 = 8$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'chain-rule': [
    numeric(
      'គណនាដេរីវេនៃ $f(x) = (2x + 1)^{3}$ ត្រង់ $x = 0$។',
      6,
      '$f\'(x) = 3(2x+1)^{2} \\cdot 2 = 6(2x+1)^{2}$ ដូច្នេះ $f\'(0) = 6 \\times 1 = 6$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ក្បួនខ្សែសង្វាក់ $(f \\circ g)\'(x)$ ស្មើនឹង៖',
      [
        ['$f\'(g(x)) \\cdot g\'(x)$', true],
        ['$f\'(g(x))$', false],
        ['$f\'(x) \\cdot g\'(x)$', false],
        ['$f\'(g\'(x))$', false],
      ],
      'ក្បួនខ្សែសង្វាក់៖ ដេរីវេខាងក្រៅ គុណនឹងដេរីវេខាងក្នុង។',
    ),
    numeric(
      'គណនាដេរីវេនៃ $f(x) = \\sin(2x)$ ត្រង់ $x = 0$។',
      2,
      '$f\'(x) = 2\\cos(2x)$ ដូច្នេះ $f\'(0) = 2\\cos 0 = 2$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'derivative-applications': [
    numeric(
      'តម្លៃ $x$ ដែល $f(x) = x^{2} - 4x$ ឈានដល់អប្បបរមា គឺប៉ុន្មាន?',
      2,
      '$f\'(x) = 2x - 4 = 0 \\Rightarrow x = 2$ (អប្បបរមា ព្រោះ $f\'\' = 2 > 0$)។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'នៅចំណុចអតិបរមាតំបន់ ដេរីវេ $f\'$ ប្តូរសញ្ញាពី៖',
      [
        ['វិជ្ជមាន ទៅ អវិជ្ជមាន', true],
        ['អវិជ្ជមាន ទៅ វិជ្ជមាន', false],
        ['វិជ្ជមាន ទៅ វិជ្ជមាន', false],
        ['អវិជ្ជមាន ទៅ អវិជ្ជមាន', false],
      ],
      'មុនអតិបរមា $f$ កើន ($f\' > 0$) ក្រោយអតិបរមា $f$ ចុះ ($f\' < 0$)។',
    ),
    numeric(
      'តម្លៃអតិបរមានៃ $f(x) = -(x - 3)^{2} + 5$ គឺប៉ុន្មាន?',
      5,
      'ការេ $-(x-3)^{2} \\leq 0$ ធំបំផុតត្រង់ $x = 3$ ផ្តល់ $f(3) = 5$។',
      { tolerance: 0, points: 2 },
    ),
  ],

  /* ── Chapter 4 — Function & curve study ──────────────────────────────── */
  'rational-functions': [
    numeric(
      'តម្លៃ $x$ នៃអាស៊ីមតូតឈរនៃ $y = \\dfrac{x + 2}{x - 4}$ គឺប៉ុន្មាន?',
      4,
      'ភាគបែងរលត់ត្រង់ $x - 4 = 0$ គឺ $x = 4$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនាកូអរដោនេ $y$ នៃចំណុចប្រសព្វនឹងអ័ក្ស $Oy$ (គឺ $x = 0$) នៃ $y = \\dfrac{x + 2}{x - 4}$។',
      -0.5,
      'ជំនួស $x = 0$៖ $y = \\frac{0 + 2}{0 - 4} = \\frac{2}{-4} = -0.5$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'អាស៊ីមតូតដេកនៃ $y = \\dfrac{x + 2}{x - 4}$ គឺ៖',
      [
        ['$y = 1$', true],
        ['$y = 0$', false],
        ['$y = 4$', false],
        ['$y = -2$', false],
      ],
      'ដឺក្រេស្មើគ្នា ដូច្នេះអាស៊ីមតូតដេក $y = \\frac{1}{1} = 1$។',
    ),
  ],
  'exponential-functions': [
    numeric(
      'គណនាតម្លៃនៃ $e^{0}$។',
      1,
      'អំណាចសូន្យ៖ $e^{0} = 1$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ដេរីវេនៃ $f(x) = e^{2x}$ គឺ៖',
      [
        ['$2 e^{2x}$', true],
        ['$e^{2x}$', false],
        ['$2 e^{x}$', false],
        ['$e^{2}$', false],
      ],
      'ក្បួនខ្សែសង្វាក់៖ $(e^{2x})\' = 2 e^{2x}$។',
    ),
    numeric(
      'គណនា $\\lim_{x \\to -\\infty} e^{x}$។',
      0,
      'ពេល $x \\to -\\infty$ នោះ $e^{x} \\to 0$ ($y = 0$ ជាអាស៊ីមតូតដេក)។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'logarithm-functions': [
    numeric(
      'គណនាតម្លៃនៃ $\\ln(e^{5})$។',
      5,
      '$\\ln(e^{5}) = 5 \\ln e = 5 \\times 1 = 5$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ដេរីវេនៃ $f(x) = \\ln x$ គឺ៖',
      [
        ['$\\dfrac{1}{x}$', true],
        ['$\\ln x$', false],
        ['$x \\ln x$', false],
        ['$-\\dfrac{1}{x^{2}}$', false],
      ],
      '$(\\ln x)\' = \\frac{1}{x}$ សម្រាប់ $x > 0$។',
    ),
    numeric(
      'ដោះស្រាយ $\\ln x = 0$ រក $x$។',
      1,
      '$\\ln x = 0 \\Leftrightarrow x = e^{0} = 1$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'complete-curve-sketching': [
    numeric(
      'គណនាកូអរដោនេ $y$ នៃចំណុចប្រសព្វនឹងអ័ក្ស $Oy$ នៃ $f(x) = x^{3} - 3x^{2} + 2$។',
      2,
      'ជំនួស $x = 0$៖ $f(0) = 0 - 0 + 2 = 2$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'តម្លៃ $x$ នៃចំណុចរបត់នៃ $f(x) = x^{3} - 3x^{2} + 2$ គឺប៉ុន្មាន?',
      1,
      '$f\'\'(x) = 6x - 6 = 0 \\Rightarrow x = 1$ ជាចំណុចរបត់។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'តើ $f(x) = x^{3} - 3x^{2} + 2$ មានចំណុចអតិបរមា/អប្បបរមាតំបន់ប៉ុន្មាន?',
      [
        ['$2$', true],
        ['$0$', false],
        ['$1$', false],
        ['$3$', false],
      ],
      '$f\'(x) = 3x^{2} - 6x = 3x(x-2)$ រលត់ត្រង់ $x = 0$ និង $x = 2$ — គឺ ២ ចំណុច។',
    ),
  ],

  /* ── Chapter 5 — Integrals ───────────────────────────────────────────── */
  'indefinite-integrals': [
    mc(
      'គណនា $\\displaystyle\\int x^{2}\\,dx$។',
      [
        ['$\\dfrac{x^{3}}{3} + C$', true],
        ['$\\dfrac{x^{3}}{2} + C$', false],
        ['$2x + C$', false],
        ['$3x^{3} + C$', false],
      ],
      'ក្បួនអំណាច៖ $\\int x^{n}\\,dx = \\frac{x^{n+1}}{n+1} + C$ ដូច្នេះ $\\int x^{2}\\,dx = \\frac{x^{3}}{3} + C$។',
    ),
    mc(
      'គណនា $\\displaystyle\\int \\dfrac{1}{x}\\,dx$។',
      [
        ['$\\ln|x| + C$', true],
        ['$-\\dfrac{1}{x^{2}} + C$', false],
        ['$\\dfrac{1}{x^{2}} + C$', false],
        ['$x \\ln x + C$', false],
      ],
      'ព្រីមីទីវនៃ $\\frac{1}{x}$ គឺ $\\ln|x| + C$។',
    ),
    trueFalse(
      'ព្រីមីទីវនៃ $\\cos x$ គឺ $\\sin x + C$។',
      true,
      'ត្រូវ។ $(\\sin x)\' = \\cos x$ ដូច្នេះ $\\int \\cos x\\,dx = \\sin x + C$។',
    ),
  ],
  'integration-techniques': [
    mc(
      'ដោយប្រើការជំនួស $u = x^{2}$ គណនា $\\displaystyle\\int 2x\\, e^{x^{2}}\\,dx$។',
      [
        ['$e^{x^{2}} + C$', true],
        ['$2x\\, e^{x^{2}} + C$', false],
        ['$x^{2} e^{x^{2}} + C$', false],
        ['$\\dfrac{e^{x^{2}}}{2} + C$', false],
      ],
      '$u = x^{2}, du = 2x\\,dx$ ដូច្នេះ $\\int e^{u}\\,du = e^{u} + C = e^{x^{2}} + C$។',
    ),
    mc(
      'រូបមន្តអាំងតេក្រាលដោយផ្នែក (par parties) គឺ៖',
      [
        ['$\\int u\\,dv = uv - \\int v\\,du$', true],
        ['$\\int u\\,dv = uv + \\int v\\,du$', false],
        ['$\\int u\\,dv = u\'v\'$', false],
        ['$\\int u\\,dv = \\int u \\int dv$', false],
      ],
      'អាំងតេក្រាលដោយផ្នែក៖ $\\int u\\,dv = uv - \\int v\\,du$។',
    ),
    numeric(
      'គណនា $\\displaystyle\\int_{0}^{1} 2x\\,dx$។',
      1,
      '$\\int_{0}^{1} 2x\\,dx = [x^{2}]_{0}^{1} = 1 - 0 = 1$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'definite-integrals': [
    numeric(
      'គណនា $\\displaystyle\\int_{0}^{2} x^{2}\\,dx$។',
      2.6667,
      '$\\int_{0}^{2} x^{2}\\,dx = \\left[\\frac{x^{3}}{3}\\right]_{0}^{2} = \\frac{8}{3} \\approx 2.667$។',
      { tolerance: 0.01, points: 2 },
    ),
    numeric(
      'គណនា $\\displaystyle\\int_{1}^{3} 2x\\,dx$។',
      8,
      '$\\int_{1}^{3} 2x\\,dx = [x^{2}]_{1}^{3} = 9 - 1 = 8$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនា $\\displaystyle\\int_{0}^{\\pi} \\sin x\\,dx$។',
      2,
      '$\\int_{0}^{\\pi} \\sin x\\,dx = [-\\cos x]_{0}^{\\pi} = -\\cos\\pi + \\cos 0 = 1 + 1 = 2$។',
      { tolerance: 0.01, points: 2 },
    ),
  ],
  'integral-applications': [
    numeric(
      'គណនាក្រផ្ទៃក្រោមខ្សែកោង $y = x$ រវាង $x = 0$ និង $x = 4$។',
      8,
      'ក្រផ្ទៃ $= \\int_{0}^{4} x\\,dx = \\left[\\frac{x^{2}}{2}\\right]_{0}^{4} = \\frac{16}{2} = 8$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនាក្រផ្ទៃរវាងខ្សែកោង $y = x^{2}$ និងអ័ក្ស $Ox$ ពី $x = 0$ ដល់ $x = 3$។',
      9,
      '$\\int_{0}^{3} x^{2}\\,dx = \\left[\\frac{x^{3}}{3}\\right]_{0}^{3} = \\frac{27}{3} = 9$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'មាឌនៃរូបកកើតដោយបង្វិលខ្សែកោង $y = f(x)$ ជុំវិញអ័ក្ស $Ox$ គឺ៖',
      [
        ['$\\pi \\displaystyle\\int_{a}^{b} [f(x)]^{2}\\,dx$', true],
        ['$\\displaystyle\\int_{a}^{b} f(x)\\,dx$', false],
        ['$2\\pi \\displaystyle\\int_{a}^{b} f(x)\\,dx$', false],
        ['$\\pi \\displaystyle\\int_{a}^{b} f(x)\\,dx$', false],
      ],
      'មាឌបង្វិល៖ $V = \\pi \\int_{a}^{b} [f(x)]^{2}\\,dx$។',
    ),
  ],

  /* ── Chapter 6 — Differential equations ──────────────────────────────── */
  'differential-equations-first-order': [
    mc(
      'ដំណោះស្រាយទូទៅនៃ $y\' = y$ គឺ៖',
      [
        ['$y = C e^{x}$', true],
        ['$y = C x$', false],
        ['$y = e^{x} + C$', false],
        ['$y = C e^{-x}$', false],
      ],
      '$y\' = y$ ជាកំណើនអិចស្ប៉ូណង់ស្យែល ដំណោះស្រាយ $y = C e^{x}$។',
    ),
    numeric(
      'សម្រាប់សមីការ $y\' = 2y$ តើថេរកំណើន $k$ ក្នុងដំណោះស្រាយ $y = C e^{kx}$ ស្មើប៉ុន្មាន?',
      2,
      'ប្រៀបធៀបនឹង $y\' = ky$ បានភ្លាម $k = 2$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'សមីការ $y\' = ky$ មានដំណោះស្រាយទូទៅ $y = C e^{kx}$។',
      true,
      'ត្រូវ។ នេះជាទម្រង់មូលដ្ឋាននៃសមីការឌីផេរ៉ង់ស្យែលលំដាប់ទី១ដែលអាចញែកអថេរ។',
    ),
  ],
  'differential-equations-second-order': [
    mc(
      'ដំណោះស្រាយទូទៅនៃ $y\'\' + \\omega^{2} y = 0$ គឺ៖',
      [
        ['$y = A\\cos(\\omega x) + B\\sin(\\omega x)$', true],
        ['$y = A e^{\\omega x}$', false],
        ['$y = A x + B$', false],
        ['$y = A e^{\\omega x} + B e^{-\\omega x}$', false],
      ],
      'សមីការនេះឆ្លើយនឹងចលនាអង្កួច ដំណោះស្រាយ $A\\cos\\omega x + B\\sin\\omega x$។',
    ),
    numeric(
      'សមីការឌីផេរ៉ង់ស្យែលលំដាប់ទី២ (លីនេអ៊ែរ) មានឫសសមីការលក្ខណៈប៉ុន្មាន?',
      2,
      'សមីការលក្ខណៈ $ar^{2} + br + c = 0$ ជាសមីការដឺក្រេ ២ មានឫស ២។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ដំណោះស្រាយទូទៅនៃ $y\'\' - y = 0$ គឺ៖',
      [
        ['$y = C_{1} e^{x} + C_{2} e^{-x}$', true],
        ['$y = C_{1}\\cos x + C_{2}\\sin x$', false],
        ['$y = C e^{x}$', false],
        ['$y = C_{1} x + C_{2}$', false],
      ],
      'សមីការលក្ខណៈ $r^{2} - 1 = 0 \\Rightarrow r = \\pm 1$ ដូច្នេះ $y = C_{1} e^{x} + C_{2} e^{-x}$។',
    ),
  ],
  'differential-equations-applications': [
    mc(
      'ការបំបែកធាតុវិទ្យុសកម្មត្រូវបានគំរូដោយសមីការ៖',
      [
        ['$y\' = -ky$ (ថយចុះអិចស្ប៉ូណង់ស្យែល)', true],
        ['$y\' = ky$ (កើនអិចស្ប៉ូណង់ស្យែល)', false],
        ['$y\' = k$ (ថេរ)', false],
        ['$y\'\' = -ky$', false],
      ],
      'បរិមាណថយចុះតាមអត្រាសមាមាត្រ៖ $y\' = -ky$ ដំណោះស្រាយ $y = y_{0} e^{-kt}$។',
    ),
    trueFalse(
      'ក្នុងគំរូ $y = y_{0} e^{kt}$ ជាមួយ $k > 0$ បរិមាណ $y$ កើនតាមពេលវេលា។',
      true,
      'ត្រូវ។ ពេល $k > 0$ អិចស្ប៉ូណង់ស្យែល $e^{kt}$ កើន ដូច្នេះ $y$ កើន។',
    ),
    numeric(
      'ក្នុងគំរូ $y = y_{0} e^{kt}$ តើ $\\dfrac{y}{y_{0}}$ ស្មើប៉ុន្មាននៅ $t = 0$?',
      1,
      'នៅ $t = 0$៖ $\\frac{y}{y_{0}} = e^{0} = 1$។',
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
      'គណនាចំនួនបន្សំ $\\binom{5}{2}$។',
      10,
      '$\\binom{5}{2} = \\frac{5!}{2!\\,3!} = \\frac{120}{2 \\times 6} = 10$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនាចំនួនរៀបចំ (arrangements) $A_{5}^{2}$។',
      20,
      '$A_{5}^{2} = 5 \\times 4 = 20$ (រៀបចំ ២ ក្នុងចំណោម ៥ ដោយគិតលំដាប់)។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'basic-probability': [
    numeric(
      'ការបោះគ្រាប់ឡុកឡាក់យុត្តិធម៌ ១ គ្រាប់ តើប្រូបាប៊ីលីតេទទួលបានលេខ ៦ ស្មើប៉ុន្មាន? (ជាទសភាគ)',
      0.1667,
      'មានតែ ១ លទ្ធផលអំណោយផលក្នុងចំណោម ៦៖ $P = \\frac{1}{6} \\approx 0.167$។',
      { tolerance: 0.01, points: 2 },
    ),
    numeric(
      'ការបោះគ្រាប់ឡុកឡាក់ ១ គ្រាប់ តើប្រូបាប៊ីលីតេទទួលបានលេខគូ ស្មើប៉ុន្មាន? (ជាទសភាគ)',
      0.5,
      'លេខគូ គឺ $\\{2, 4, 6\\}$៖ $P = \\frac{3}{6} = 0.5$។',
      { tolerance: 0.01, points: 2 },
    ),
    trueFalse(
      'សម្រាប់ព្រឹត្តិការណ៍ $A$ ណាមួយ យើងមាន $P(A) + P(\\bar{A}) = 1$។',
      true,
      'ត្រូវ។ ព្រឹត្តិការណ៍ និងបំពេញរបស់វា គ្របដណ្តប់លទ្ធភាពទាំងអស់៖ ផលបូក $= 1$។',
    ),
  ],
  'conditional-probability': [
    mc(
      'ប្រូបាប៊ីលីតេលក្ខខណ្ឌ $P(A \\mid B)$ ស្មើនឹង៖',
      [
        ['$\\dfrac{P(A \\cap B)}{P(B)}$', true],
        ['$\\dfrac{P(A \\cap B)}{P(A)}$', false],
        ['$P(A) \\cdot P(B)$', false],
        ['$\\dfrac{P(B)}{P(A \\cap B)}$', false],
      ],
      'និយមន័យ៖ $P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}$ សម្រាប់ $P(B) > 0$។',
    ),
    trueFalse(
      'បើ $A$ និង $B$ ឯករាជ្យ នោះ $P(A \\cap B) = P(A) \\cdot P(B)$។',
      true,
      'ត្រូវ។ នេះជានិយមន័យនៃព្រឹត្តិការណ៍ឯករាជ្យ។',
    ),
    numeric(
      'បើ $P(A) = 0.5$ និង $P(B \\mid A) = 0.4$ គណនា $P(A \\cap B)$។',
      0.2,
      '$P(A \\cap B) = P(A) \\cdot P(B \\mid A) = 0.5 \\times 0.4 = 0.2$។',
      { tolerance: 0.001, points: 2 },
    ),
  ],
  'random-variables-binomial': [
    numeric(
      'សម្រាប់ $X \\sim \\mathcal{B}(10,\\ 0.3)$ គណនាមធ្យមភាគ $E(X)$។',
      3,
      '$E(X) = np = 10 \\times 0.3 = 3$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'សម្រាប់ $X \\sim \\mathcal{B}(10,\\ 0.3)$ គណនាវ៉ារ្យង់ $V(X)$។',
      2.1,
      '$V(X) = np(1-p) = 10 \\times 0.3 \\times 0.7 = 2.1$។',
      { tolerance: 0.01, points: 2 },
    ),
    numeric(
      'សម្រាប់ $X \\sim \\mathcal{B}(3,\\ 0.5)$ គណនា $P(X = 0)$។',
      0.125,
      '$P(X = 0) = \\binom{3}{0}(0.5)^{0}(0.5)^{3} = (0.5)^{3} = 0.125$។',
      { tolerance: 0.001, points: 2 },
    ),
  ],

  /* ── Chapter 8 — Geometry in space ───────────────────────────────────── */
  'vectors-in-space': [
    numeric(
      'គណនាបណ្តោយ (norm) នៃវ៉ិចទ័រ $\\vec{u} = (2,\\ 3,\\ 6)$។',
      7,
      '$\\|\\vec{u}\\| = \\sqrt{2^{2} + 3^{2} + 6^{2}} = \\sqrt{4 + 9 + 36} = \\sqrt{49} = 7$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ផលបូកនៃវ៉ិចទ័រ $(1, 2, 3) + (4, 5, 6)$ គឺ៖',
      [
        ['$(5, 7, 9)$', true],
        ['$(4, 10, 18)$', false],
        ['$(3, 3, 3)$', false],
        ['$(5, 5, 5)$', false],
      ],
      'បូកតាមសមាសភាគ៖ $(1+4,\\ 2+5,\\ 3+6) = (5, 7, 9)$។',
    ),
    numeric(
      'គណនាបណ្តោយនៃវ៉ិចទ័រ $\\vec{v} = (1,\\ 2,\\ 2)$។',
      3,
      '$\\|\\vec{v}\\| = \\sqrt{1 + 4 + 4} = \\sqrt{9} = 3$។',
      { tolerance: 0, points: 2 },
    ),
  ],
  'dot-and-cross-product': [
    numeric(
      'គណនាផលគុណស្កាលែរ $(1, 2, 3) \\cdot (4, 5, 6)$។',
      32,
      '$1 \\times 4 + 2 \\times 5 + 3 \\times 6 = 4 + 10 + 18 = 32$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនាផលគុណស្កាលែរ $(1, 0, 0) \\cdot (0, 1, 0)$។',
      0,
      'ផលគុណ $= 0$ បញ្ជាក់ថាវ៉ិចទ័រទាំងពីរកែងគ្នា។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'ផលគុណវ៉ិចទ័រ (produit vectoriel) $\\vec{u} \\times \\vec{v}$ ផ្តល់៖',
      [
        ['វ៉ិចទ័រកែងនឹងទាំង $\\vec{u}$ និង $\\vec{v}$', true],
        ['ចំនួនស្កាលែរ', false],
        ['វ៉ិចទ័រស្របនឹង $\\vec{u}$', false],
        ['សូន្យជានិច្ច', false],
      ],
      'ផលគុណវ៉ិចទ័រផ្តល់វ៉ិចទ័រថ្មីកែងនឹងប្លង់ដែលបង្កើតដោយ $\\vec{u}$ និង $\\vec{v}$។',
    ),
  ],
  'lines-and-planes': [
    mc(
      'វ៉ិចទ័រណរម៉ាល់នៃប្លង់ $2x + 3y + 4z + 5 = 0$ គឺ៖',
      [
        ['$(2, 3, 4)$', true],
        ['$(2, 3, 4, 5)$', false],
        ['$(5, 5, 5)$', false],
        ['$(-2, -3, -4)$ តែមួយ', false],
      ],
      'មេគុណ $x, y, z$ ក្នុងសមីការប្លង់ផ្តល់វ៉ិចទ័រណរម៉ាល់ $(a, b, c) = (2, 3, 4)$។',
    ),
    numeric(
      'សមាសភាគ $z$ នៃវ៉ិចទ័រណរម៉ាល់នៃប្លង់ $2x + 3y + 4z = 5$ គឺប៉ុន្មាន?',
      4,
      'វ៉ិចទ័រណរម៉ាល់ $= (2, 3, 4)$ ដូច្នេះសមាសភាគ $z$ គឺ $4$។',
      { tolerance: 0, points: 2 },
    ),
    trueFalse(
      'បន្ទាត់ស្របនឹងប្លង់ លុះត្រាតែវ៉ិចទ័រនាំផ្លូវរបស់បន្ទាត់កែងនឹងវ៉ិចទ័រណរម៉ាល់នៃប្លង់។',
      true,
      'ត្រូវ។ បើវ៉ិចទ័រនាំផ្លូវកែងនឹងណរម៉ាល់ (ផលគុណស្កាលែរ $= 0$) នោះបន្ទាត់ស្របនឹងប្លង់។',
    ),
  ],
  'distances-and-angles': [
    numeric(
      'គណនាចម្ងាយរវាងចំណុច $O(0, 0, 0)$ និង $A(2, 3, 6)$។',
      7,
      '$OA = \\sqrt{2^{2} + 3^{2} + 6^{2}} = \\sqrt{49} = 7$។',
      { tolerance: 0, points: 2 },
    ),
    numeric(
      'គណនាចម្ងាយពីគល់ $O$ ទៅចំណុច $B(1, 2, 2)$។',
      3,
      '$OB = \\sqrt{1 + 4 + 4} = \\sqrt{9} = 3$។',
      { tolerance: 0, points: 2 },
    ),
    mc(
      'កូស៊ីនុសនៃមុំរវាងវ៉ិចទ័រ $\\vec{u}$ និង $\\vec{v}$ ស្មើនឹង៖',
      [
        ['$\\dfrac{\\vec{u} \\cdot \\vec{v}}{\\|\\vec{u}\\|\\,\\|\\vec{v}\\|}$', true],
        ['$\\vec{u} \\cdot \\vec{v}$', false],
        ['$\\dfrac{\\|\\vec{u}\\|\\,\\|\\vec{v}\\|}{\\vec{u} \\cdot \\vec{v}}$', false],
        ['$\\|\\vec{u}\\| \\cdot \\|\\vec{v}\\|$', false],
      ],
      'រូបមន្តមុំ៖ $\\cos\\theta = \\frac{\\vec{u} \\cdot \\vec{v}}{\\|\\vec{u}\\|\\,\\|\\vec{v}\\|}$។',
    ),
  ],
}
