---
layout: article
title: RF Materials, Permittivity and Wireless Propagation
section: RF Materials
section_url: /Research/rf-materials/
description: A physical and engineering account of how permittivity, conductivity, loss, thickness and frequency determine reflection, transmission and penetration through real materials.
next_title: Can Clothing Reduce RF Exposure?
next_url: /Research/rf-materials/protective-fabrics.html
---

## 1. The engineering problem

A link budget often treats propagation loss as a number. The radio wave encounters something more complicated: interfaces, finite-thickness slabs, mixtures of materials, moisture, reinforcement, surface roughness and frequency-dependent electrical properties.

When a wave reaches a wall, glass panel, fabric or human body, its energy can be:

- reflected at an interface;
- transmitted into the material;
- absorbed and converted into heat;
- scattered by roughness or internal structure;
- diffracted around edges;
- re-radiated after multiple internal reflections.

Material propagation is therefore not captured by “concrete loses X dB” without specifying frequency, composition, thickness, angle, polarization and measurement geometry.

## 2. Complex permittivity

For many non-magnetic building materials, the central constitutive quantity is complex permittivity:

```text
ε* = ε′ − jε″
```

The real part, `ε′`, describes electric-field energy storage and polarization. Relative permittivity is `εr′ = ε′/ε0`. The imaginary part represents dielectric loss. Conductivity can also be folded into the loss term, giving an effective complex permittivity.

Two dimensionless ratios are useful:

```text
relative permittivity: εr = ε / ε0
loss tangent:         tan δ = ε″ / ε′
```

Higher relative permittivity changes wavelength and impedance inside the material. Higher loss tangent or conductivity increases attenuation as the wave propagates through it.

## 3. Why permittivity depends on frequency

Polarization mechanisms do not respond instantaneously. Electronic, ionic, molecular-dipole and interfacial polarization operate over different time scales. As frequency rises, a mechanism may no longer follow the applied field, changing both stored energy and loss.

This produces **dispersion**: the same sample has different complex permittivity at different frequencies. Moisture makes the problem especially variable because water is strongly polar and its fraction and distribution can change with weather, curing and humidity.

Consequently, a material value measured at 1 GHz should not be inserted blindly into a 28-, 60- or 100-GHz simulation.

## 4. The first interface: reflection and refraction

At normal incidence, a lossless-material approximation gives the electric-field reflection coefficient:

```text
Γ = (η2 − η1) / (η2 + η1)
```

where `η1` and `η2` are the wave impedances of the two media. A larger impedance discontinuity produces a larger reflection. At oblique incidence the result also depends on polarization and angle through the Fresnel coefficients.

The transmitted wave changes direction according to Snell's law and then accumulates phase and attenuation inside the material. A wall is not merely an interface: it is a finite slab with a second boundary.

## 5. A wall as a multilayer RF structure

A real partition may contain paint, plasterboard, an air gap, insulation, reinforcement and another surface layer. Every boundary creates partial reflection and transmission.

```text
air → paint → board → air/insulation → board → air
       ↕        ↕            ↕          ↕
     partial reflections and transmissions
```

The components recombine with frequency-dependent phase. Thickness can therefore create constructive or destructive interference. Windows may contain multiple glass panes, gas gaps and low-emissivity metallic coatings; reinforced concrete adds conducting steel geometry to a lossy dielectric host.

ITU-R P.2040 models single and multiple dielectric slabs and provides frequency-dependent material-property guidance for propagation work from 1 MHz to 450 GHz. Its tabulated models are useful for planning, but site-specific measurements remain preferable when composition is uncertain.

## 6. Attenuation inside a lossy material

A uniform medium has a complex propagation constant:

```text
γ = α + jβ
```

`α` is the attenuation constant and `β` is the phase constant. Field magnitude decays approximately as:

```text
|E(z)| = |E(0)| e^(−αz)
```

Penetration loss therefore grows with path length inside the material, but the total measured loss also includes interface mismatch and interference. At oblique incidence the path through a slab is longer than its physical thickness.

## 7. Why higher frequency often penetrates buildings poorly

It is tempting to state that higher frequency always means higher material loss. The real causes are more specific:

- dielectric and conductive loss are frequency dependent;
- wavelength becomes comparable to surface roughness and internal features;
- metallic coatings, meshes and reinforcement interact differently with shorter wavelengths;
- diffraction around openings and edges weakens as wavelength shrinks;
- antenna beams and measurement geometry become more directional;
- multilayer phase relationships change.

This is why sub-6-GHz coverage behavior cannot simply be scaled to mmWave by free-space path loss alone.

## 8. Common material classes

### Concrete and masonry

Concrete is heterogeneous: cement paste, aggregate, pores, water and sometimes steel reinforcement. Density, moisture and curing strongly affect loss. Reinforcement can introduce polarization-dependent transmission and additional reflection.

### Glass

Ordinary glass can be less attenuating than thick masonry, but modern energy-efficient glazing may contain thin conductive low-emissivity coatings. A visually transparent window can consequently behave as a strong RF reflector at some bands.

### Wood and plasterboard

Dry lightweight partitions are often less lossy, but moisture, support frames, foil-backed insulation and multilayer construction can dominate the result.

### Metals

Good conductors have a small skin depth at RF and generally reflect strongly. Openings, seams, mesh pitch and finite enclosure geometry determine whether a metallic structure is an effective shield.

### Human tissue and textiles

Biological tissue is lossy and water-rich. Ordinary dry fabric is usually a weak RF shield; conductive fibers, coatings or films can transform a textile into a reflecting and absorbing sheet. That distinction is developed in the companion article.

## 9. How properties are measured

No single method covers every material and frequency. Common approaches include:

- coaxial probes for liquids and semi-solids;
- transmission/reflection fixtures and waveguides;
- resonant cavities for accurate narrow-band measurements;
- free-space measurements for planar samples at microwave and mmWave bands;
- on-site transmission measurements through completed walls or windows.

Calibration, sample flatness, air gaps, anisotropy, surface roughness and thickness uncertainty can materially alter inferred permittivity. A database value should be accompanied by its measurement band and method.

## 10. From material data to network engineering

Material characterization feeds several engineering tasks:

- ray-tracing and digital-twin models;
- indoor/outdoor coverage prediction;
- access-point and repeater placement;
- beam selection and blockage recovery;
- link adaptation and handover design;
- RIS and engineered-surface development;
- antenna, package and radome design.

At mmWave, knowing that a wall blocks a path is not enough. A model must also identify reflected alternatives, angular spread, polarization changes and temporal variation from people, doors and vehicles.

## 11. Open research problems

- Reliable material databases above 100 GHz
- Moisture- and temperature-dependent models
- Anisotropic and spatially heterogeneous construction materials
- Low-emissivity glass and reinforced-wall characterization
- Differentiable material models for RF digital twins
- Joint inference of geometry and material properties from channel measurements
- Reconfigurable, programmable and frequency-selective building surfaces
- Uncertainty propagation from material parameters into coverage predictions

## References

1. ITU-R, [Recommendation P.2040-4: Effects of building materials and structures on radiowave propagation in the range of 1 MHz to 450 GHz](https://www.itu.int/rec/r-rec-p.2040/en), 2025.
2. ITU-R, [Recommendation P.2109: Prediction of building entry loss](https://www.itu.int/rec/R-REC-P.2109/en).
3. ITU-R, [Radiowave propagation Recommendations](https://www.itu.int/rec/r-rec-p).
