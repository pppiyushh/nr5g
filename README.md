# NR5G

NR5G is an independent, standards-grounded technical publication focused on 5G NR Layer 1, non-terrestrial networks, satellite-radio geometry and emerging wireless systems.

The site is maintained by **Piyush Kumar Singh**. It connects public specifications and research literature to mathematical derivations, numerical examples and implementation constraints without publishing proprietary modem information.

## Published work

### NR NTN

- [NR NTN — From Satellite State to Radio Link](NTN/nr-ntn.md)
- [NR-NTN Timing Advance — From SIB19 Epoch to gNB](NTN/timing-advance-and-epoch-time.md)
- [LEO Orbits, Satellite Beams and Elevation Angle](NTN/leo-orbits-beams-and-elevation.md)
- [LEO Pass Simulator: From State Error to Timing and Doppler Residual](NTN/leo-pass-simulator-error-analysis.md)

### Reproducible experiment

- [LEO Pass Simulator](https://github.com/pppiyushh/leo-pass-simulator) — versioned Python source, configuration, full CSV results, figures, tests and limitations for a 600 km pass and controlled NTN state-error study.

### 5G NR physical layer and standards

- [Why 15 kHz and 14 Symbols? OFDM Orthogonality and NR Numerology](5G/physical-layer/ofdm-numerology-scs-symbol-duration.md)
- [MIMO: From the Channel Matrix to NR Channel Estimation](5G/physical-layer/mimo-channel-estimation.md)
- [Who Verifies a Commercial 5G Modem?](5G/standards/modem-conformance.md)

### Research syntheses

- [Inverse-Designed RFICs: When AI Starts Solving Maxwell](Research/inverse-designed-rfics.md)
- [RF Materials, Permittivity and Wireless Propagation](Research/rf-materials/materials-and-propagation.md)
- [Can Clothing Reduce RF Exposure?](Research/rf-materials/protective-fabrics.md)

### Living research and industry maps

- [NR5G Weekly Radar](radar/index.md) — a source-checked archive of weekly standards, research, product, patent and commercialization signals
- [Weekly Radar 2026-W35](radar/2026-W35/index.md) — the inaugural issue covering 24–30 August 2026
- [Wireless Company Atlas v0.1](atlas/index.md) — 41 companies across 22 countries, mapped by products, specialization and maturity
- [Radar methodology](radar/methodology/index.md) and [Atlas methodology](atlas/methodology/index.md)

## Evidence labels

Each published page identifies what it actually demonstrates:

| Label | Meaning |
|---|---|
| Standards analysis | Interprets normative or institutional public sources. |
| Technical derivation | Develops equations and numerical examples from stated assumptions. |
| Research synthesis | Connects peer-reviewed work, mechanisms, trade-offs and open questions. |
| Curated technical review | Selects dated developments and grades the maturity and limitations of their evidence. |
| Curated industry landscape | Maps companies and products using dated public company and product evidence. |
| Reproducible experiment | Requires public code, configuration, generated data, plots, checks and limitations. |
| Original research | Reserved for a novel question or method with comparative evaluation. |

Drafts are kept out of public navigation until their technical review and references are complete. See [About and Evidence](about.html) for the publication policy.

## Repository structure

```text
5G/                 5G NR physical-layer and standards articles
NTN/                NR-NTN and satellite-radio articles
Research/           Cross-domain wireless research syntheses
radar/              Weekly issues, archive and selection methodology
atlas/              Geographic company landscape and verification methodology
6G/                 Draft research tracks not yet publicly promoted
_layouts/           Jekyll article templates
assets/              Shared styles and article navigation script
```

## Local preview

The site is built with GitHub Pages and Jekyll.

```bash
bundle install
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000`.

## Editorial rules

- Prefer 3GPP, ITU, IEEE, peer-reviewed papers and official technical reports.
- State assumptions before derivations and keep units visible.
- Distinguish standardized behavior, implementation choice and engineering interpretation.
- Publish planned work only after it has a defensible technical core and references.
- Never include proprietary employer information, code or measurements.

## Scope

NR5G is educational and exploratory. It is not an official 3GPP publication, a conformance implementation or a statement on behalf of any employer.
