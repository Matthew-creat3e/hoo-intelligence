# Task: Build Quote Wizard Section
**Read this file. Read industry config. Build.**

## Structure
Dark section with gradient bg, faded industry photo overlay (6%, grayscale), dark gradient on top. Two-column grid.

## Left Column (text)
- Section tag (accent-light)
- H2 title: "Not Sure Where to Start?" (white)
- Subtitle paragraph (white at 50%)
- 3 value props: emoji + text badges (no commitment, fast response, key benefit)

## Right Column (wizard card)
- Glassmorphism: `background:rgba(255,255,255,.05)`, `backdrop-filter:blur(20px)`, accent border at 15%
- Accent gradient line at top (3px)

### Progress Bar
- 3 segments, flex row, 3px height each
- Active/completed = accent bg, upcoming = white at 10%

### Step 1: Service/Goal Selection
- Label: "Step 1 of 3 — {question}" (from industry config `wizard_step1_label`)
- 2x2 grid of tiles from industry config `wizard_step1_options` (4 items)
- Each tile: emoji + bold label + small description, dark styled
- Click: adds `.sel` class, sets hidden input, auto-advances after 300ms

### Step 2: Urgency/Level Selection
- Back button (← Back, white at 40%)
- Label from industry config `wizard_step2_label`
- 2x2 tiles from `wizard_step2_options`
- Same click behavior → advances to step 3

### Step 3: Contact Form
- Back button
- Fields: Name, Phone + Email (2-col) — dark styled inputs (white at 8% bg, white at 10% border, white text)
- Submit button: accent gradient, uppercase

### Step 4: Success
- Checkmark circle (accent glow border)
- "You're In" heading (white)
- Response time message

## JS
- `wizGo(step)` — show/hide steps, update progress bar
- `wizSel(tile)` — select tile, set hidden input, advance
- `wizBack(step)` — go back
- Form submit: preventDefault, show step 4

## Mobile: single column

## Output
`<section class="quote-wizard-section">` with full wizard JS.
