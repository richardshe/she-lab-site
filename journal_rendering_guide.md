# Journal Title Rendering Guide

This guide provides instructions, CSS/HTML templates, and logo assets to help you recreate the visual style of prominent scientific journals on your webpage.

---

## Represented Journals

The following journals are represented in your collection:

1.  **Nature**
2.  **Science**
3.  **Cell**
4.  **PNAS** (Proceedings of the National Academy of Sciences)
5.  **NEJM** (New England Journal of Medicine)
6.  **Neuron** (Cell Press)
7.  **Nature Neuroscience**
8.  **Nature Methods**
9.  **Immunity** (Cell Press)
10. **Molecular Therapy** (Cell Press/ASGCT)

---

## 1. Nature Portfolio Style (Nature, Nature Neuroscience, Nature Methods)

The "Nature Style" is characterized by clean, left-aligned typography with high-impact serif titles and sans-serif metadata.

### Styling Logic
-   **Title Font:** "Harding" (Nature's custom font). Use **Georgia** or **Times New Roman** as web-safe fallbacks.
-   **Metadata Font:** **Helvetica** or **Arial**.
-   **Case:** Sentence case (Only capitalize the first word and proper nouns).
-   **Nature Methods Accent:** Teal-Blue (`#025E8D`).
-   **Nature Neuroscience Accent:** Black (`#000000`).

### Logo Assets
-   **Nature Logo (SVG):** [Direct Link](https://www.nature.com/static/images/logos/nature-logo-40.21a62d60b0.svg)
-   **Nature Neuroscience Logo (SVG):** [Direct Link](https://seekvectorlogo.com/wp-content/uploads/2018/01/nature-neuroscience-vector-logo.svg)
-   **Nature Methods:** Use the Nature logo + "Methods" in `#025E8D` (Helvetica).

### HTML/CSS Template
```html
<style>
  .nature-header { font-family: "Georgia", serif; max-width: 800px; text-align: left; }
  .nature-meta { font-family: "Arial", sans-serif; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 10px; }
  .nature-title { font-size: 32px; font-weight: 700; line-height: 1.1; margin-bottom: 15px; letter-spacing: -0.02em; }
  .nature-authors { font-family: "Arial", sans-serif; font-size: 14px; font-weight: bold; }
  .nature-methods-accent { color: #025E8D; }
</style>

<div class="nature-header">
  <div class="nature-meta">Article | Published 2020</div>
  <h1 class="nature-title">A pneumonia outbreak associated with a new coronavirus of probable bat origin</h1>
  <div class="nature-authors">Zhou, P., Yang, XL., Wang, XG. et al.</div>
</div>
```

---

## 2. Cell Press Style (Cell, Neuron, Immunity, Molecular Therapy)

Cell Press journals use a modern, clinical aesthetic with bold sans-serif titles and signature brand colors.

### Styling Logic
-   **Title Font:** **Avenir Next**, **Helvetica**, or **Arial**.
-   **Body/Author Font:** **Minion Pro** or **Times New Roman**.
-   **Case:** Sentence case.
-   **Signature Colors:**
    -   **Cell:** Red (`#E31B23`)
    -   **Neuron:** Black (`#000000`) or Dark Grey.
    -   **Immunity:** Deep Blue (`#005596`)
    -   **Molecular Therapy:** Deep Teal (`#00859B`)

### Logo Assets
-   **Cell Press Logo (SVG):** [Direct Link](https://worldvectorlogo.com/logo/cell-press)
-   **Cell Logo (SVG):** [Direct Link](https://seeklogo.com/vector-logo/318445/cell-press)
-   **Neuron Logo:** Typically just the word "Neuron" in bold sans-serif.

### HTML/CSS Template
```html
<style>
  .cell-header { font-family: "Helvetica", Arial, sans-serif; max-width: 800px; border-top: 4px solid #E31B23; padding-top: 20px; }
  .cell-title { font-size: 36px; font-weight: 800; line-height: 1.05; color: #222; margin-bottom: 20px; letter-spacing: -0.03em; }
  .cell-authors { font-size: 18px; font-weight: 600; color: #444; }
</style>

<div class="cell-header">
  <h1 class="cell-title">Induction of pluripotent stem cells from mouse embryonic and adult fibroblast cultures by defined factors</h1>
  <div class="cell-authors">Kazutoshi Takahashi and Shinya Yamanaka</div>
</div>
```

---

## 3. PNAS (Proceedings of the National Academy of Sciences)

PNAS features a very heavy, flush-left sans-serif title block.

### Styling Logic
-   **Title Font:** **Helvetica Neue** or **Arial** (Standard fallback for Latin Modern Sans).
-   **Size:** 29px (approx 22pt) Bold.
-   **Alignment:** Flush left.
-   **Case:** Sentence case.

### Logo Assets
-   **PNAS Logo (SVG):** [Direct Link](https://upload.wikimedia.org/wikipedia/commons/a/a0/PNAS_logo.svg)

### HTML/CSS Template
```html
<style>
  .pnas-header { max-width: 800px; text-align: left; }
  .pnas-title { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 29px; line-height: 1.1; font-weight: 700; color: #000; margin: 20px 0; letter-spacing: -0.01em; }
</style>

<div class="pnas-header">
  <h1 class="pnas-title">DNA sequencing with chain-terminating inhibitors</h1>
</div>
```

---

## 4. NEJM (New England Journal of Medicine)

NEJM is the most traditional, using centered serif typography and a distinct orange-red accent for labels.

### Styling Logic
-   **Title Font:** **Georgia** or **Times New Roman** (Fallback for Miller).
-   **Alignment:** Centered.
-   **Case:** Sentence case.
-   **Accent Color:** Orange-Red (`#DF6C4F`).

### Logo Assets
-   **NEJM Logo (SVG):** [Direct Link](https://upload.wikimedia.org/wikipedia/commons/a/a0/The_New_England_Journal_of_Medicine_logo.svg)

### HTML/CSS Template
```html
<style>
  .nejm-header { max-width: 800px; margin: 40px auto; text-align: center; }
  .nejm-label { font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #DF6C4F; letter-spacing: 0.15em; margin-bottom: 15px; }
  .nejm-title { font-family: "Georgia", serif; font-size: 38px; font-weight: 700; line-height: 1.15; color: #000; margin: 0 0 20px 0; }
</style>

<div class="nejm-header">
  <div class="nejm-label">Original Article</div>
  <h1 class="nejm-title">Safety and efficacy of the BNT162b2 mRNA Covid-19 vaccine</h1>
</div>
```

---

## 5. Science (AAAS)

Science uses a clean, high-contrast digital look with strong serif titles.

### Styling Logic
-   **Title Font:** **Merriweather**, **Georgia**, or **Times New Roman**.
-   **Case:** Sentence case or Title Case (Journal has varied over time; sentence case is more modern).
-   **Alignment:** Left-aligned.

### Logo Assets
-   **Science Logo (SVG):** [Direct Link](https://upload.wikimedia.org/wikipedia/commons/b/b7/Science_AAAS_logo.svg)

---

## General Recreation Tips

1.  **Letter Spacing:** For large titles (30px+), always use `letter-spacing: -0.02em;` to achieve that professional "locked-in" academic look.
2.  **Line Height:** Academic titles use tight leading. Set `line-height` between `1.05` and `1.15`.
3.  **Color:** Avoid pure black (`#000`) for the web. Use `#1A1A1A` or `#222` to make the text feel more modern.
4.  **Logos:** Download the SVG files from the links provided and host them locally to avoid hotlinking issues. Use `height: 40px;` for most header logos to maintain standard proportions.
