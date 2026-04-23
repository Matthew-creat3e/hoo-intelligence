# Task: AEO Schema Injection
**Agent:** Run AFTER assembly (Step 4.5 in BUILD-FLOW)
**Input:** Assembled HTML file + lead data
**Output:** Same HTML file with JSON-LD schema injected in `<head>`

## What to inject

### 1. LocalBusiness Schema (ALWAYS)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{{BUSINESS_NAME}}",
  "telephone": "{{PHONE}}",
  "email": "{{EMAIL}}",
  "url": "{{URL}}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "{{CITY}}",
    "addressRegion": "{{STATE}}",
    "addressCountry": "US"
  },
  "areaServed": {
    "@type": "City",
    "name": "{{CITY}}, {{STATE}}"
  },
  "priceRange": "$$",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{RATING}}",
    "reviewCount": "{{REVIEW_COUNT}}"
  },
  "sameAs": []
}
```

### 2. FAQPage Schema (if FAQ section exists)
Parse all `.faq-q` / `.faq-a` pairs from the HTML and build:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{QUESTION_TEXT}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{ANSWER_TEXT}}"
      }
    }
  ]
}
```

### 3. HowTo Schema (if process section exists)
Parse `.process-step` elements and build:
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How {{BUSINESS_NAME}} Works",
  "step": [
    {
      "@type": "HowToStep",
      "name": "{{STEP_TITLE}}",
      "text": "{{STEP_DESCRIPTION}}"
    }
  ]
}
```

### 4. Meta Tags (ALWAYS add/update)
```html
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
```

## Where to inject
- JSON-LD `<script>` blocks go right before `</head>`
- Meta robots tag goes in `<head>` after existing meta tags

## Rules
- Use lead JSON data for business name, phone, city, state
- Default rating to "5.0" and review count to "50+" if not provided
- Strip HTML tags from FAQ answers — plain text only in schema
- Validate JSON before injecting — no trailing commas, proper escaping
