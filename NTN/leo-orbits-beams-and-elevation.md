---
layout: article
title: LEO Orbits, Satellite Beams and Elevation Angle
section: NR NTN
section_url: /NTN/
description: A geometric and numerical explanation of LEO motion, constellation coverage, spot beams, minimum elevation, central angle, slant range, delay and Doppler.
evidence_type: Numerical geometry analysis
reference_basis: 3GPP Release 17, ITU and space-agency sources
last_reviewed: 2026-08-29
math: true
mermaid: true
previous_title: SIB19, Epoch Time and Timing Advance
previous_url: /NTN/timing-advance-and-epoch-time.html
---

## 1. Does a satellite always orbit around an Earth diameter?

In the ideal two-body model, an Earth satellite moves in a fixed orbital plane that passes through Earth's centre of mass. It is reasonable to imagine that plane slicing Earth along a great circle, but not to imagine one satellite repeatedly following a painted diameter on the rotating surface.

The orbit is described by quantities including:

- semi-major axis or altitude;
- eccentricity;
- inclination relative to the equatorial plane;
- orientation of the orbital plane;
- satellite phase within that plane.

Earth rotates underneath the orbit. Therefore, the point directly below the satellite—the **sub-satellite point**—draws a moving ground track across different longitudes.

| Inclination | Ground-region implication |
|---:|---|
| \\(0^\circ\\) | Equatorial orbit; cannot directly cover high latitudes |
| \\(53^\circ\\) | Ground track reaches approximately \\(53^\circ\\) north and south latitude |
| Near \\(90^\circ\\) | Near-polar orbit; can pass over nearly all latitudes |

Perturbations, Earth oblateness, atmospheric drag and station keeping slowly change a real orbit, but the planar two-body model is the correct first mental picture.

## 2. A numerical 600 km circular LEO

Use:

\\[
R_E=6371\text{ km},\qquad h=600\text{ km},
\\]

\\[
r_s=R_E+h=6971\text{ km}.
\\]

For a circular orbit with Earth's gravitational parameter

\\[
\mu=398600.4418\text{ km}^3/\text{s}^2,
\\]

the orbital speed is

\\[
v=\sqrt{\frac{\mu}{r_s}}
=\sqrt{\frac{398600.4418}{6971}}
=7.562\text{ km/s}.
\\]

The orbital period is

\\[
T=2\pi\sqrt{\frac{r_s^3}{\mu}}
=5792.3\text{ s}
=96.54\text{ minutes}.
\\]

A LEO satellite therefore moves several kilometres each second and completes roughly 15 orbits per day. The ground observer sees a short pass because Earth is large and the usable radio elevation mask is much higher than the mathematical horizon.

## 3. One LEO satellite does not cover Earth continuously

A single satellite illuminates only the part of Earth inside both:

1. its geometric visibility region; and
2. its usable antenna/link-budget footprint.

As the satellite moves, this footprint moves or is electronically steered. Continuous global coverage requires a **constellation**:

- several orbital planes are distributed around Earth;
- multiple satellites are phased along each plane;
- adjacent footprints overlap enough to avoid coverage holes;
- handover moves a UE or cell between beams and satellites;
- high inclination or polar shells are required for polar coverage;
- Earth rotation moves new longitudes beneath the constellation.

<div class="mermaid">
flowchart TD
    SHELL[LEO constellation shell]
    SHELL --> PLANES[Multiple orbital planes]
    SHELL --> PHASE[Satellites phased in each plane]
    PLANES --> LAT[Required latitude coverage]
    PHASE --> OVERLAP[Overlapping visibility windows]
    LAT --> SERVICE[Continuous regional or global service]
    OVERLAP --> SERVICE
</div>

An equatorial shell cannot continuously cover the poles regardless of how many satellites are placed in the equatorial plane. Constellation altitude, inclination, number of planes, satellites per plane and minimum usable elevation must be designed together.

## 4. Visibility footprint is not the same as a radio beam

The **visibility footprint** is every ground location with geometric line of sight above a chosen elevation mask. A **spot beam** is the smaller region illuminated by one satellite antenna beam.

One satellite can produce many spot beams inside its visible region. Beam size is set by antenna aperture, carrier frequency, beamforming weights, link budget and interference-reuse plan—not only by satellite altitude.

3GPP distinguishes three service-link coverage behaviours:

| Beam/cell behaviour | Meaning | Typical example |
|---|---|---|
| Earth-fixed | Coverage remains over the same geographical area | GEO beam |
| Quasi-Earth-fixed | An NGSO steerable beam holds one ground area temporarily, then another | Steered LEO cell |
| Earth-moving | Footprint slides over Earth with satellite motion | Fixed/non-steered LEO beam |

<div class="mermaid">
flowchart LR
    SAT[Moving LEO satellite] --> FIXED[Fixed antenna beam]
    SAT --> STEERED[Electronically steered beam]
    FIXED --> MOVING[Earth-moving footprint]
    STEERED --> QUASI[Quasi-Earth-fixed footprint]
</div>

Even a quasi-Earth-fixed beam cannot remain on one area forever: the satellite eventually moves beyond the steering and link-budget limits, so another satellite must take over.

## 5. Elevation angle and central angle are different

Elevation \\(e\\) is measured at the UE between the satellite line of sight and the UE's local horizontal plane:

- \\(e=0^\circ\\): satellite is at the geometric horizon;
- \\(e=90^\circ\\): satellite is directly overhead at zenith.

The geocentric angle \\(\psi\\) is measured at Earth's centre between:

- the radius to the UE; and
- the radius to the satellite's sub-satellite point.

They are angles at different vertices, so

\\[
\psi\ne90^\circ-e.
\\]

<svg class="geometry-diagram" viewBox="0 0 760 430" role="img" aria-labelledby="geometry-title geometry-desc">
  <title id="geometry-title">Satellite elevation and Earth central angle</title>
  <desc id="geometry-desc">A spherical Earth cross section showing Earth centre O, a UE, the local horizon, a satellite, line of sight, elevation e and central angle psi.</desc>
  <circle cx="300" cy="330" r="200" fill="#edf5fb" stroke="#1769aa" stroke-width="3"/>
  <line x1="300" y1="330" x2="429" y2="177" stroke="#637381" stroke-width="2"/>
  <line x1="300" y1="330" x2="350" y2="44" stroke="#637381" stroke-width="2"/>
  <line x1="429" y1="177" x2="350" y2="44" stroke="#d1495b" stroke-width="4"/>
  <line x1="367" y1="103" x2="520" y2="232" stroke="#111" stroke-width="2" stroke-dasharray="8 7"/>
  <path d="M 337 286 A 58 58 0 0 0 315 273" fill="none" stroke="#7b2cbf" stroke-width="4"/>
  <path d="M 403 155 A 48 48 0 0 1 445 154" fill="none" stroke="#e07a00" stroke-width="4"/>
  <circle cx="300" cy="330" r="5" fill="#111"/>
  <circle cx="429" cy="177" r="7" fill="#1769aa"/>
  <circle cx="350" cy="44" r="9" fill="#d1495b"/>
  <text x="278" y="355" font-size="18" fill="#111">O</text>
  <text x="445" y="182" font-size="18" fill="#111">UE</text>
  <text x="365" y="40" font-size="18" fill="#111">Satellite</text>
  <text x="490" y="255" font-size="16" fill="#111">Local horizon</text>
  <text x="370" y="104" font-size="16" fill="#d1495b">Line of sight</text>
  <text x="323" y="274" font-size="20" fill="#7b2cbf">ψ</text>
  <text x="429" y="145" font-size="20" fill="#e07a00">e</text>
  <text x="28" y="400" font-size="14" fill="#666">Conceptual cross-section; not to scale.</text>
</svg>

The related **zenith angle** at the UE is

\\[
z=90^\circ-e.
\\]

Thus \\(90^\circ-e\\) is a UE-local angle between local vertical and line of sight. It is not the Earth-centred angle \\(\psi\\).

## 6. Slant range and elevation equations

For a spherical-Earth model,

\\[
r_s=R_E+h.
\\]

Given central angle \\(\psi\\), the UE-to-satellite slant range is obtained by the cosine rule:

\\[
d=\sqrt{r_s^2+R_E^2-2r_sR_E\cos\psi}.
\\]

Elevation is related to the same triangle by

\\[
\tan e=\frac{r_s\cos\psi-R_E}{r_s\sin\psi}.
\\]

If the design begins with a minimum elevation \\(e_{min}\\), the maximum central angle is

\\[
\boxed{
\psi_{max}=\cos^{-1}\!\left(\frac{R_E}{r_s}\cos e_{min}\right)-e_{min}
}.
\\]

The surface distance from the sub-satellite point to the footprint edge is approximately

\\[
s=R_E\psi_{max},
\\]

with \\(\psi\\) expressed in radians.

## 7. Numerical elevation table for a 600 km LEO

Using \\(R_E=6371\\) km and \\(h=600\\) km:

| Minimum elevation | Maximum \\(\psi\\) | Surface radius | Slant range | One-way free-space delay |
|---:|---:|---:|---:|---:|
| \\(0^\circ\\) | \\(23.946^\circ\\) | 2663 km | 2829 km | 9.438 ms |
| \\(5^\circ\\) | \\(19.432^\circ\\) | 2161 km | 2328 km | 7.766 ms |
| \\(10^\circ\\) | \\(15.836^\circ\\) | 1761 km | 1932 km | 6.443 ms |
| \\(20^\circ\\) | \\(10.816^\circ\\) | 1203 km | 1392 km | 4.644 ms |
| \\(30^\circ\\) | \\(7.675^\circ\\) | 853 km | 1075 km | 3.586 ms |
| \\(60^\circ\\) | \\(2.809^\circ\\) | 312 km | 683 km | 2.279 ms |
| \\(90^\circ\\) | \\(0^\circ\\) | 0 km | 600 km | 2.001 ms |

For \\(e_{min}=10^\circ\\):

\\[
\psi_{max}
=\cos^{-1}\!\left(\frac{6371}{6971}\cos10^\circ\right)-10^\circ
=15.836^\circ.
\\]

This is the significance of \\(\psi\\): it converts a local elevation requirement into a geographic angular footprint on Earth.

## 8. Why designers often begin near a 10° elevation mask

Ten degrees is not a universal 3GPP law. It is a common early system-design assumption because operation very close to the horizon is difficult:

- slant range and free-space path loss increase;
- the atmospheric path becomes longer;
- terrain, buildings, foliage, vehicles and the user's body block the line of sight more easily;
- multipath and shadowing become stronger;
- antenna patterns and polarization alignment may be less favourable;
- the footprint becomes larger, but its edge has the weakest link budget;
- interference coordination with other satellite and terrestrial systems becomes harder.

Raising the mask improves link quality but shrinks each satellite's coverage area and visibility time. The constellation then needs more satellites or accepts coverage gaps.

| Lower elevation mask | Higher elevation mask |
|---|---|
| Larger geometric footprint | Smaller footprint |
| Longer nominal visibility window | Shorter visibility window |
| Larger slant range and loss | Better link budget |
| More blockage and atmospheric exposure | Cleaner line of sight |
| Fewer satellites needed geometrically | More overlap/satellites needed |

The correct value comes from link budget, terminal antenna, environment, required availability, spectrum-sharing rules and constellation economics.

## 9. Motion creates delay and Doppler

For UE and satellite positions \\(\mathbf r_u,\mathbf r_s\\),

\\[
\boldsymbol\rho=\mathbf r_s-\mathbf r_u,
\qquad
R=\|\boldsymbol\rho\|.
\\]

With velocities \\(\mathbf v_u,\mathbf v_s\\), radial range rate is

\\[
\dot R=(\mathbf v_s-\mathbf v_u)\cdot\frac{\boldsymbol\rho}{R}.
\\]

First-order Doppler is

\\[
f_D=-\frac{\dot R}{c}f_c.
\\]

The satellite's total orbital speed is not inserted directly into Doppler. Only the line-of-sight component matters. Near the closest point of a pass, total speed remains high while radial speed can cross through zero, causing Doppler to change sign.

Delay also evolves:

\\[
\tau(t)=\frac{R(t)}{c},
\qquad
\dot\tau(t)=\frac{\dot R(t)}{c}.
\\]

This is why SIB19 needs an epoch and why a UE must propagate satellite position instead of treating one received coordinate as permanent.

## 10. Beam, satellite and gateway mobility are different

An NR-NTN session may face three distinct transitions:

1. **Beam switch:** another beam of the same satellite serves the UE.
2. **Satellite switch:** service moves to a different satellite.
3. **Feeder/gateway switch:** the service satellite changes the ground gateway used to reach the gNB/network.

These events can coincide, but they solve different geometric/resource problems. A quasi-Earth-fixed cell may keep the geographic cell abstraction stable while satellites switch behind it. An Earth-moving cell exposes more of the footprint movement to cell selection and handover procedures.

## 11. Engineering implications for NR-NTN

- A larger footprint creates a larger difference in delay and Doppler between UEs at beam centre and edge.
- A low-elevation UE generally needs more link margin and has less reliable visibility.
- Ephemeris age converts directly into position, delay and frequency errors.
- Spot-beam steering can stabilize a ground service area but consumes beamforming range and satellite resources.
- Constellation handover should consider remaining visibility time, not only instantaneous RSRP.
- A geometrically visible satellite may still be unusable because of power, antenna, polarization, interference or gateway constraints.

## 12. References

1. ETSI / 3GPP TS 38.300, [NR and NG-RAN overall description, NTN service-link types](https://www.etsi.org/deliver/etsi_ts/138300_138399/138300/17.08.00_60/ts_138300v170800p.pdf).
2. 3GPP TR 38.821, [Solutions for NR to support non-terrestrial networks](https://portal.3gpp.org/desktopmodules/Specifications/SpecificationDetails.aspx?specificationId=3525).
3. NASA, [What Is an Orbit?](https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-an-orbit-grades-5-8/).
4. NASA Earth Observatory, [Catalog of Earth Satellite Orbits](https://science.nasa.gov/earth/earth-observatory/catalog-of-earth-satellite-orbits/).
5. ESA, [Types of orbits](https://www.esa.int/Enabling_Support/Space_Transportation/Types_of_orbits).
6. ITU-R Recommendation P.619, [Propagation data required for space-Earth telecommunication systems](https://www.itu.int/rec/R-REC-P.619/).
7. ITU-R Recommendation S.1714, [Static methodology for calculating non-GSO interference](https://www.itu.int/rec/R-REC-S.1714/).
