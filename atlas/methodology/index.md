---
layout: article
title: "Wireless Company Atlas Methodology"
description: "How NR5G places, classifies, verifies and updates companies in the Wireless Company Atlas."
section: "Company Atlas"
section_url: "/atlas/"
evidence_type: "Editorial methodology"
last_reviewed: 2026-08-30
reference_basis: "Public company and product evidence"
body_class: "atlas-page"
---

## Purpose and boundary

The Wireless Company Atlas answers three questions:

1. Which companies build wireless technology?
2. Where are they based and where do they maintain a meaningful engineering or operating footprint?
3. What products, system layers and markets do they actually address?

It is a technology and industry landscape, **not a vacancy tracker**. A careers link may eventually appear on a company profile, but hiring activity does not determine whether a company belongs in the Atlas.

## Selection

The seed edition is intentionally curated rather than comprehensive. A company is eligible when public evidence connects it to a specific wireless product, component, network function, test capability, deployment or research-to-product program.

Generic use of Wi-Fi, cellular service or cloud software is not enough. The company must build, operate, integrate or validate a meaningful part of the wireless system.

## Geographic placement

- The primary location is the headquarters country supported by the company's official material.
- Engineering, R&D, manufacturing, service and deployment locations are recorded as operating footprint.
- A company appears once under its primary country rather than being duplicated in every market.
- “Global” means the company publicly reports international offices, coverage, customers or deployments. It does not mean every product is available in every country.

## Company and product maturity

Company maturity and product maturity are different fields. An established vendor can have an experimental 6G product, and a startup can have a commercially deployed product.

Product maturity uses the following progression:

`Concept → Prototype or evaluation → Field trial → Early commercial → Commercial at scale`

An announcement, memorandum of understanding, patent, standards contribution or funding round is not sufficient evidence of deployment.

## Record schema

The current seed edition is presented as a readable geographic directory. Stable company profiles should move toward the following structured record:

```yaml
name:
aliases: []
company_type: startup | scale-up | established | public-sector
headquarters:
  country:
  city:
operating_locations: []
products_services: []
specialty_technologies: []
technical_domains: []
standards: []
frequency_domains: []
target_markets: []
maturity_by_product: []
evidence_links: []
official_homepage:
last_verified:
corrections: []
```

## Source rules

Technical and product pages, regulatory filings and named deployment announcements are preferred over generic marketing copy. Frequency bands and standards releases are recorded only when an official specification or product document supports them.

Partnerships, investment and customer announcements can establish ecosystem activity. They do not independently establish performance, interoperability or product maturity.

## Ownership and acquisitions

Acquired brands and subsidiaries are not silently merged. A profile should explain the ownership relationship, the date on which it changed and whether the product identity continues independently.

## Maintenance schedule

- High-change fields such as product stage, ownership and operating footprint should be checked at least quarterly.
- Relatively static identity fields should be checked at least annually.
- Each profile and edition carries a visible last-verified date.
- A new weekly development can link into an Atlas profile, but the permanent record remains independent of the Weekly Radar publishing cycle.

## Corrections

A substantive correction preserves the former value and records the revised value, date, reason and supporting source. Changes in a company or product are updates; mistakes in the Atlas are corrections. The two are not conflated.

## Planned expansion

Future editions should strengthen coverage in countries missing from v0.1, add RF-component and network-testing specialists, represent ownership relationships explicitly, and introduce product-level maturity records for NTN, Open RAN, private 5G and antenna companies.
