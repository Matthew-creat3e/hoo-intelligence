# DOCUMENTS WORKSPACE — Layer 2
**Loaded when:** proposal / pitch / deck / PDF / PPTX / DOCX / spreadsheet / document

---

## Purpose
Create professional documents for HOO clients and business: pitch decks, proposals, contracts, branded PDFs, spreadsheets, audit reports.

---

## Repo Location
`C:\Users\Matth\Downloads\workspace-blueprint.zip` (extracted reference)

```
public/
  pptx/    → SKILL.md, ooxml.md, html2pptx.md, scripts/, ooxml/
  docx/    → SKILL.md, ooxml.md, docx-js.md, scripts/
  pdf/     → SKILL.md, REFERENCE.md, FORMS.md
  xlsx/    → SKILL.md
outputs/   → all generated docs (gitignored)
```

---

## Workflows

### PPTX from Scratch (html2pptx — primary method)
1. `mkdir -p outputs/<name>/`
2. Read `public/pptx/html2pptx.md` fully before starting
3. Design color palette from content
4. Create HTML slides (720pt × 405pt for 16:9)
5. Use `class="placeholder"` for charts/tables
6. Rasterize gradients/icons as PNG via Sharp
7. Generate: `html2pptx.js` → `outputs/<name>/presentation.pptx`
8. Thumbnail grid → validate visually → iterate

### PPTX from Template
1. Extract text: `venv/bin/python -m markitdown template.pptx`
2. Thumbnail grid: `venv/bin/python public/pptx/scripts/thumbnail.py`
3. Analyze + inventory (0-based slide indices)
4. Rearrange: `rearrange.py` | Text inventory: `inventory.py` → JSON
5. Build replacement JSON with formatting
6. Apply: `replace.py` → `final.pptx`

### OOXML Edit (PPTX or DOCX)
`unpack.py` → edit XML → `validate.py` → `pack.py`

### PDF
- Merge: pypdf
- Convert PPTX→PDF: `soffice --headless --convert-to pdf`
- PDF→images: pdftoppm

### XLSX
- Zero formula errors (always validate)
- Color coding: Blue = inputs | Black = formulas
- Format zeros as `"-"` not `0`

---

## Toolchain
```
Python venv:   python-pptx, openpyxl, pypdf, lxml, Pillow, markitdown
Node.js:       pptxgenjs v4.0.1, playwright (Chromium), sharp, react-icons
System:        LibreOffice (soffice), Poppler (pdftoppm), Pandoc
Core script:   html2pptx-local.cjs (994 lines — the conversion engine)
```

## Rules
- ALL outputs → `outputs/<descriptive-name>/`
- Always use `venv/bin/python`, never system Python
- Read the relevant SKILL.md fully before starting any document type
- Validate after every OOXML edit
- Never guess at slide structure — thumbnail first, then act

---

## HOO Document Use Cases
- **Client pitch decks** — before/after showcase, pricing, process, ROI math
- **Audit reports** — branded HTML → PDF for cold outreach
- **Proposals** — scope, pricing, timeline, guarantee
- **Contracts** — simple service agreement (DOCX)
- **Revenue tracking** — MRR spreadsheet (XLSX)
