# Task: Build Hero Section
**Read this file completely. Then read your industry + photos files. Then build.**

## Structure
Two-column grid on dark background. LEFT: status badges → H1 → subtitle → 3 stats. RIGHT: quote form.

## Background layers (bottom to top)
1. Solid dark bg (`var(--primary)`)
2. Industry photo from photos file `hero` slot, opacity 0.2, `filter:saturate(.5)`
3. CSS grid overlay (accent color at 3% opacity, 60px spacing)
4. Two radial gradient glows (accent color, blurred, floating animation)
5. Signature animation from industry config (radar/pulse/wave — centered, 750px, 15% opacity)
6. Glowing dots (6-7, positioned randomly, pulsing, accent + green + yellow colors)

## Left column
- Status badges row: 2 pill badges with colored dots (green = available, orange = urgency). Text from industry config `status_badges`
- H1: `font-family:var(--font-h)`, `clamp(2.4rem,5.5vw,3.8rem)`, white, uppercase. `<em>` tag for accent-colored word
- Subtitle: 1rem, white at 55% opacity, max-width 460px
- Stats row: 3 metrics from industry config. Number in font-h 2.2rem, label in .68rem uppercase

## Right column — Form
- White card, border-radius 20px, padding 36px, heavy shadow
- Accent gradient line at top (3px)
- H2 title + subtitle from industry config
- Fields: Name, Phone + Email (2-col), Goal/Service dropdown (from industry config services), Submit button
- Trust badges below form (3 items from industry config trust_signals)
- Form uses `action="https://formspree.io/f/DEMO"` with `onsubmit` prevention in JS

## CSS
- `.rv` class for scroll reveal (opacity:0, translateY:28px, transition .8s)
- Mobile 768px: single column, signature animation shrinks to 400px

## JS (in IIFE)
- IntersectionObserver for `.rv` elements
- Nav scroll handler (`.scrolled` class at scrollY > 60)

## Output
One complete HTML block: `<style>` + `<section class="hero">` + beginning of `<script>` (IO observer).
Include the Google Fonts `<link>` tag at the very top.
