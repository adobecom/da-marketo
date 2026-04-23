# da-marketo Architecture

## Overview

This repo serves two purposes:

1. **`blocks/da-marketo/`** — The EDS block that acts as the translation layer between DA-authored content and the Marketo script pipeline.
2. **`mkto/`** — An EDS-agnostic Marketo script pipeline that can be consumed by any host (BACOM, Milo, or other future consumers).

The key design principle: the `mkto/` scripts know nothing about EDS or DA. The block is responsible for reading DA content and translating it into the state the scripts need to execute against the Marketo Forms2 API.

---

## Phases

### v1 — Milo block (current, production)

Milo's built-in marketo block handles everything: reads page content, calls Marketo `getForm`, and renders the form. Scripts run inline via the legacy `mkto-frms` pipeline. This repo is not involved in the loading chain.

```
DA Content
    ↓
Milo marketo block  (translation + render)
    ↓
Marketo Forms2 API
```

### v2 — da-marketo block (in progress, POC)

BACOM bypasses Milo's block and loads the `da-marketo` block from this repo instead. This enables faster iteration and decouples the script pipeline from Milo's release cycle.

**Loading chain:**

```
DA Content
    ↓
da-bacom scripts.js
  → (when milolibs=main) renames marketo blocks → "da-marketo"
  → loads block from da-marketo.aem.live
        ↓
    da-marketo block  (translation layer: DA content → state)
        ↓
    mkto/ scripts     (EDS-agnostic execution layer)
        ↓
    Marketo Forms2 API
```

**Dev override:** `?marketolibs=<branch>` loads the block and scripts from `<branch>--da-marketo--adobecom.aem.live` instead of `main`, enabling per-branch testing without a deploy.

### v3 — Standardised (future)

Milo's marketo block is updated to load scripts from this repo's `mkto/` path, making da-marketo the canonical source of truth for all consumers. Scripts are rewritten to a modern, maintainable standard. The `da-marketo` block becomes the reference implementation.

```
DA Content
    ↓
Milo marketo block (updated)  —or—  da-marketo block
  (both act as translation layer)
        ↓
    mkto/ scripts  (shared, EDS-agnostic)
        ↓
    Marketo Forms2 API
```

v2 and v3 run in parallel during the transition, toggled by a feature flag, to ensure full E2E test coverage before v2 is retired.

---

## Folder structure

```
da-marketo/
├── blocks/
│   └── da-marketo/        # EDS translation block (v2+)
├── mkto/                  # EDS-agnostic Marketo script pipeline
│   ├── 00_config/
│   ├── 20_template_manager/
│   ├── 30_privacy/
│   ├── 40_field_management/
│   ├── 50_analytics/
│   ├── 60_enrichment/
│   ├── 80_translations/
│   └── 90_build/
├── nala/                  # E2E tests
├── scripts/               # AEM EDS entry point
└── utils/                 # Shared utilities
```

### Why `mkto/` and not `/marketo/`

`/marketo` redirects to `https://business.adobe.com/products/marketo.html` and cannot be used as a CDN path. `mkto/` is the established abbreviation, matches the draft CDN mapping (`business.adobe.com/mkto/*`), and is neutral enough to survive the v3 rewrite.

---

## CDN path (planned)

```
business.adobe.com/mkto/*  →  main--da-marketo--adobecom.aem.live/mkto/*
```

> Not yet configured. Rollback strategy is PR revert; AEM EDS Code Bus handles CI/CD.

---

## E2E testing targets

Tests in `nala/` are designed to cover the full matrix of loading scenarios:

| Site | Block source | Script source |
|---|---|---|
| `main--da-marketo--adobecom.aem.live` | da-marketo (this repo) | mkto/ (this repo) |
| `main--da-bacom--adobecom.aem.live` | da-marketo (via milolibs override) | mkto/ (this repo) |
| `business.adobe.com` (via Milo) | Milo marketo block | mkto/ (v3, planned) |

Base URL is overridable via `BASE_URL` env var. Use `?marketolibs=<branch>` to target a specific branch across all three sites during development.
