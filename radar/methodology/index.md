---
layout: article
title: "Weekly Radar Methodology"
description: "How NR5G selects, verifies, classifies and corrects items in the Weekly Radar."
section: "Weekly Radar"
section_url: "/radar/"
evidence_type: "Editorial methodology"
last_reviewed: 2026-08-30
reference_basis: "Public selection and verification rules"
body_class: "radar-page"
---

## Purpose

The Weekly Radar is a **curated technical review**, not a comprehensive wireless-news feed. Its purpose is to identify developments that change an engineer's understanding of a mechanism, architecture, implementation constraint, research direction or commercial capability.

An item is not selected merely because it is popular, recent or associated with a large company.

## Covered period and publication date

Each issue states an exact covered period using ISO week notation. The date on which an event occurred, a document was published and NR5G discovered it are treated as different fields.

Older material discovered during the week is labelled **Worth revisiting** rather than presented as new.

## Standard record

Every selected item should answer the following questions:

| Field | Required interpretation |
|---|---|
| Event or publication date | When the underlying event or publication occurred |
| Source type | Standard, peer-reviewed paper, preprint, patent, product announcement, filing or another named class |
| Evidence maturity | The strongest stage actually demonstrated by the source |
| What happened | A short factual account without editorial inflation |
| What is novel | The technical change or differentiator claimed or inferred |
| Why it matters | The consequence for PHY, MAC, RAN, RF, devices, deployment or research |
| Limitation | Missing validation, assumptions, confounders or uncertainty |
| Primary source | The closest authoritative document available |

## Evidence maturity

The Radar uses the following progression when it is applicable:

`Concept → Analysis → Simulation → Prototype → Laboratory test → Field trial → Commercial deployment`

The stages are not interchangeable. In particular:

- a simulation is not a prototype;
- a demonstration is not a field trial;
- a memorandum of understanding is not a deployment;
- production sampling is not volume production; and
- a vendor benchmark is not an independent benchmark.

## Source hierarchy

Primary sources are preferred:

1. standards-body documents, regulator decisions and official meeting records;
2. the paper, DOI record, accepted manuscript or named preprint;
3. patent-office records and the published claims;
4. technical product documentation, filings and named deployment reports; and
5. official announcements when stronger evidence is unavailable.

Secondary reporting may help discover an item, but it should not replace an accessible primary source for the technical claim.

## Research-paper rules

For each paper, the Radar distinguishes peer-reviewed, accepted and preprint status. It records the problem, proposed method, baseline, reported improvement, evaluation environment and important limitations.

Numerical gains are reported with their conditions. When an abstract says only “substantial improvement,” the Radar does not invent a number or infer one from a plot that has not been reviewed.

## Standards rules

A meeting, contribution or work-item discussion proves activity, not agreement. A standards outcome is reported only when an official report, approved Change Request, specification version or other primary record supports it. Document numbers and clauses are preferred over summaries from vendors or conference hosts.

## Patent rules

The Radar explicitly separates:

- an application publication;
- a granted patent; and
- an extension of a patent family into another jurisdiction.

A patent is evidence of published claims, not proof of implementation, validity, standards adoption or technical superiority.

## Product, startup and investment rules

Technical product claims and commercial signals are kept separate. Funding can indicate ecosystem attention, but it does not validate RF performance. A partnership can identify an intended integration, but it does not prove that the integrated system exists or meets its targets.

## Selection limits

An ordinary issue targets **8–12 meaningful records**. A category can be empty in a quiet week. Items outside wireless communications are excluded unless their relevance to a radio, network, device, spectrum or deployment problem is explicit.

## Corrections and updates

Substantive errors are never silently overwritten. The issue receives a dated correction entry containing:

1. the original statement;
2. the corrected statement;
3. the reason for the change; and
4. a source supporting the correction.

Routine follow-up evidence belongs in a later issue and links back to the earlier record.
