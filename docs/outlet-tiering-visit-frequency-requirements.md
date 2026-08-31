# Requirement Document: Outlet Tagging, Tiering & Visit Frequency Rule Engine

## Module Context
This is a sub-module of the PJP/Beat Plan Recommendation Engine (see main PRD/BRD). It covers the logic for classifying outlets and determining how often each should be visited, using **manual/rule-based tagging instead of an ML classification model**, since no historical sales data exists yet. Geographic clustering (beat formation) remains a separate, required step and is **not replaced** by this module — this module determines *visit frequency per outlet*; clustering determines *which outlets are grouped into a rep's route*.

**Prototype area:** Dadar, Mumbai

---

## 1. Objective

Define and implement a rule-based system that:
1. Assigns each outlet a **Size Tag** (Small / Medium / Large)
2. Assigns each outlet a **Sales Performance** value (synthetic, since no real order history exists)
3. Combines both into a **Tier** (A / B / C)
4. Maps each Tier to a **Visit Frequency**

This output feeds directly into the Beat Plan generation module — every outlet must carry a visit frequency before route optimization can run.

---

## 2. Scope

**In Scope**
- Manual/derived Size tagging for Dadar outlets pulled from OSM
- Synthetic Sales Performance data generation (with realistic variance, not flat/random values)
- Rule-based Tier assignment (Size × Sales Performance matrix)
- Rule-based Visit Frequency mapping (Tier → frequency)
- Manual override capability for both Size and Tier (for cases where OSM data or the rule output looks wrong)

**Out of Scope (this module)**
- Geographic clustering / beat formation (separate module, still required)
- ML-based/dynamic tiering (deferred until real sales data exists)
- Route sequencing (separate module)
- Trend-based tier changes and new-outlet grace period (documented as future refinements, not built now)

---

## 3. Functional Requirements

### FR-1: Size Tagging

| ID | Requirement |
|---|---|
| FR-1.1 | System shall assign a default Size Tag (Small / Medium / Large) to each outlet based on its OSM `shop`/`amenity` type, using a configurable mapping table |
| FR-1.2 | System shall allow manual override of the Size Tag for any individual outlet |
| FR-1.3 | System shall log when a Size Tag has been manually overridden vs. auto-assigned, for traceability |

**Default Size Mapping (configurable)**

| OSM Type | Default Size Tag |
|---|---|
| `shop=convenience`, `shop=kiosk` | Small |
| `shop=grocery`, `shop=chemist` | Medium |
| `shop=supermarket`, `shop=department_store` | Large |
| Unmapped/unknown type | Small (safe default) |

### FR-2: Synthetic Sales Performance Generation

| ID | Requirement |
|---|---|
| FR-2.1 | System shall generate a simulated monthly sales value per outlet, drawn from a range dependent on its Size Tag |
| FR-2.2 | System shall introduce randomized variance within each size band so outlets of the same size do not carry identical values |
| FR-2.3 | System shall compute each outlet's Sales Performance as a **percentile rank within its own Size Tag group**, not as an absolute value across all outlets |

**Default Simulated Monthly Sales Ranges (configurable)**

| Size Tag | Monthly Sales Range (₹) |
|---|---|
| Small | 15,000 – 60,000 |
| Medium | 50,000 – 1,50,000 |
| Large | 1,50,000 – 5,00,000 |

**Sales Performance Bands (percentile within size group)**

| Band | Percentile Range |
|---|---|
| Low | Bottom third |
| Medium | Middle third |
| High | Top third |

### FR-3: Tier Assignment

| ID | Requirement |
|---|---|
| FR-3.1 | System shall assign a Tier (A/B/C) to each outlet based on the combination of Size Tag and Sales Performance band |
| FR-3.2 | System shall allow manual override of the computed Tier for any individual outlet |
| FR-3.3 | System shall log when a Tier has been manually overridden vs. rule-derived |

**Tier Assignment Matrix**

| Size ↓ / Sales Performance → | Low | Medium | High |
|---|---|---|---|
| Large | B | A | A |
| Medium | C | B | A |
| Small | C | C | B |

### FR-4: Visit Frequency Mapping

| ID | Requirement |
|---|---|
| FR-4.1 | System shall assign a Visit Frequency to each outlet based on its Tier, using a configurable mapping table |
| FR-4.2 | System shall pass Visit Frequency as a required field to the Beat Plan generation module |

**Tier → Visit Frequency Mapping**

| Tier | Visit Frequency |
|---|---|
| A | 2x per week |
| B | 1x per week |
| C | 1x per 2 weeks |

### FR-5: Manual Override & Audit

| ID | Requirement |
|---|---|
| FR-5.1 | System shall provide a way to manually edit Size Tag, Sales Performance, and Tier at the individual outlet level |
| FR-5.2 | System shall retain both the original rule-derived value and the overridden value (not overwrite silently) |

---

## 4. Data Requirements

New/updated fields required on the **Outlet Master** table:

| Column | Type | Description |
|---|---|---|
| size_tag | enum (Small/Medium/Large) | Auto-assigned or manually overridden |
| size_tag_source | enum (Auto/Manual) | Traceability flag |
| simulated_monthly_sales | float | Synthetic value, Phase 1 only — replaced by real sales once available |
| sales_performance_band | enum (Low/Medium/High) | Percentile-derived, within size group |
| tier | enum (A/B/C) | Derived from Size × Sales Performance matrix |
| tier_source | enum (Auto/Manual) | Traceability flag |
| visit_frequency | enum (2x/week, 1x/week, 1x/2weeks) | Derived from Tier |

---

## 5. Business Rules Summary (Plain Language)

1. Every outlet gets a size label first — small, medium, or large — based on what kind of shop it is.
2. Since we don't have real sales numbers yet, we simulate them — but not the same number for every outlet of the same size; there's realistic variation.
3. We don't compare a small shop's sales to a large shop's sales directly — a small shop is judged as "high/medium/low performing" only against other small shops.
4. Tier is decided by combining size and relative sales performance — a large store with low sales isn't automatically Tier A just because it's large; a small store with high relative sales can outrank a mediocre medium store.
5. Tier decides how often the outlet gets visited — Tier A most often, Tier C least often.
6. Anything the system decides automatically can be manually corrected — and we keep a record of what was auto-decided vs. manually changed, so we don't lose track of where the data actually came from.

---

## 6. Assumptions

- No real sales/order data exists for Dadar outlets at this stage; all sales figures are synthetic and clearly marked as such in the data.
- The Size → Sales Range values and the Tier/Frequency mapping tables are starting defaults — expected to be reviewed and adjusted once real data is available or business stakeholders weigh in.
- This module's output (Tier, Visit Frequency) is an *input* to route optimization, not a replacement for the geographic clustering step.

---

## 7. Open Questions

- Should manual overrides require a reason/comment field for audit purposes, or is a simple Auto/Manual flag sufficient for the prototype?
- Are the ₹ sales ranges per size tag realistic for Dadar specifically, or should they be adjusted based on local knowledge before generating synthetic data?
- Should Tier reassessment happen on a fixed schedule (e.g., monthly) even in the synthetic-data phase, to simulate how this would behave with real data over time?

---

## 8. Dependencies

- Outlet Master data for Dadar must be pulled from OSM (Overpass API) before this module can be applied.
- Output of this module (visit_frequency per outlet) is a required input for the Beat Plan / Route Optimization module — sequencing cannot begin until every outlet has a frequency assigned.
