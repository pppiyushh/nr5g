---
layout: article
title: Can Clothing Reduce RF Exposure?
section: RF Materials
section_url: /Research/rf-materials/
description: An engineering review of conductive textiles, electromagnetic shielding effectiveness, garment limitations, and what MPE and SAR do—and do not—say about protective clothing.
previous_title: RF Materials, Permittivity and Wireless Propagation
previous_url: /Research/rf-materials/materials-and-propagation.html
---

## 1. Start with the right question

Conductive textiles capable of attenuating radio-frequency fields exist. Silver-coated yarns, copper or stainless-steel fibers, metal-coated fabrics, conductive polymers, carbon-based composites and multilayer magnetic/conductive textiles have all demonstrated electromagnetic shielding in laboratory measurements.

That does not make every “anti-radiation” garment protective in realistic use. Three different claims must be separated:

1. A flat fabric coupon attenuates a field in a specified test fixture.
2. A completed garment reduces the field or absorbed power at particular points on a body.
3. Wearing it is necessary for, or produces, a health benefit under exposures already compliant with applicable limits.

Evidence for the first claim is common. The second requires garment- and exposure-specific testing. The third cannot be inferred from shielding-effectiveness numbers alone.

## 2. MPE and SAR are not materials

**Maximum Permissible Exposure (MPE)** is a regulatory exposure limit expressed through quantities such as electric-field strength, magnetic-field strength or incident power density. It is commonly used for environmental or more distant exposure evaluations.

**Specific Absorption Rate (SAR)** is the rate at which RF energy is absorbed per unit mass:

```text
SAR = absorbed power / tissue mass   [W/kg]
```

SAR is commonly used for close-to-body portable transmitters at lower RF frequencies. Above 6 GHz, compliance assessment increasingly uses incident or absorbed power-density quantities because energy deposition becomes more superficial. IEC/IEEE 63195-2, for example, specifies computational power-density assessment procedures from 6 to 300 GHz.

A garment therefore does not “protect from MPE” or “block SAR” as if those were radiation types. It may change the fields around the body, which may in turn change incident power density or local absorption. That change must be measured or computed for the complete configuration.

## 3. How a conductive fabric shields

An RF shield attenuates transmission through reflection, absorption and repeated internal interactions. Shielding effectiveness is commonly reported as:

```text
SE = 10 log10(Pincident / Ptransmitted) dB
```

Idealized examples are:

```text
10 dB  → 10× lower transmitted power
20 dB  → 100× lower transmitted power
30 dB  → 1,000× lower transmitted power
```

High electrical conductivity creates a strong impedance mismatch and reflection. Sufficient thickness and loss allow absorption. Magnetic constituents can improve attenuation of some near-field magnetic components, particularly where a purely conductive sheet is less effective.

Ordinary cotton, wool or polyester is generally not a strong RF shield. Shielding textiles introduce conductive material through:

- silver-, copper- or nickel-coated yarn;
- woven stainless-steel filaments;
- electroless metal plating;
- silver-nanowire or other conductive coatings;
- carbon nanotube, graphene or conductive-polymer composites;
- multilayer conductive and magnetic structures.

## 4. What laboratory results show

Peer-reviewed studies demonstrate that engineered fabrics can achieve high attenuation over their tested bands. Silver-coated knitted polyamide has shown substantial shielding between 0.9 and 2.4 GHz. Silver-coated PET research has reported more than 70 dB across 8–18 GHz under a particular coupon test configuration. Other fabrics trade maximum shielding for flexibility, breathability, cost or durability.

The phrase **over their tested bands** is essential. A result at 8–12 GHz does not establish performance at 700 MHz, 2.4 GHz, 28 GHz or in a reactive near field. Test methods, sample dimensions and reported metrics must be examined before comparing products.

## 5. Why a shirt is not a Faraday cage

A material coupon can cover a fixture aperture continuously. Clothing contains a neck, sleeves, waist, seams, fasteners, folds and gaps. Fields diffract through openings and currents terminate or concentrate at discontinuities.

```text
Ideal coupon test                 Real garment

┌──────────────────┐            neck opening
│ continuous sheet │          ┌──────  ──────┐
└──────────────────┘          seams   body   sleeves
                              └──────  ──────┘
                                  waist opening
```

Performance also depends on:

- how much of the body is covered;
- fit and spacing from the skin;
- orientation and polarization of the incident field;
- frequency and distance from the source;
- whether the source is outside or inside the garment;
- electrical continuity between fabric panels;
- sweat, bending, stretching and washing;
- coupling to the body and nearby conductive objects.

A garment can reduce exposure in one region while redirecting fields or producing edge concentrations elsewhere. A phone carried inside a shielding pocket or used beneath a partially shielding garment is a different electromagnetic problem from an external plane wave. A connected device may also increase transmit power when link quality is degraded.

## 6. Near field versus far field

In the far field, electric and magnetic fields have a predictable relationship and a plane-wave shielding test can be informative. Close to an antenna, the field is reactive and geometry dependent. Electric and magnetic components may need different mitigation strategies.

This distinction matters for phones, body-worn radios, industrial RF sources and wearable antennas. A far-field attenuation specification cannot automatically predict local SAR next to a handset. The handset, body and garment need to be modeled or measured together.

## 7. Durability is an RF property

Conductivity can be damaged by laundering, detergent chemistry, abrasion, flexing, oxidation and stretching. Research on silver-coated polyamide fabrics has measured declining shielding after repeated wet and dry cleaning because the conductive coating is damaged.

Durable designs use embedded conductive yarn, improved adhesion or protective polymer layers. Even then, performance should be specified after representative wash and wear cycles—not only for a new sample.

IEC 63203-201-2 provides measurement methods for basic electrical and general properties of conductive fabrics used in e-textiles. It does not itself certify a garment as protection from human RF exposure.

## 8. How a protective garment should be evaluated

A technically credible evaluation should include:

1. **Frequency coverage:** test every relevant band, not a single convenient frequency.
2. **Coupon shielding effectiveness:** use a documented fixture and standard method.
3. **Garment-level mapping:** measure fields around an anatomically representative phantom or validated computational body model.
4. **Exposure metric:** calculate SAR where applicable and power density where applicable.
5. **Source scenarios:** external far-field source, nearby transmitter and any device carried inside the clothing.
6. **Openings and polarization:** rotate the body and source and test seams, neck, cuffs and waist.
7. **Use conditioning:** repeat after washing, sweat exposure, stretching and abrasion.
8. **Uncertainty:** report calibration, repeatability and worst-case configurations.

Only this system-level process can support a claim about exposure reduction for a specific use.

## 9. When conductive clothing is established

Conductive garments have legitimate specialist uses. IEC 60895 covers conductive clothing for trained personnel performing live work on very-high-voltage electrical installations. Its purpose and field regime are different from consumer RF apparel, and the standard explicitly defines garment continuity and test requirements.

RF shielding is also used around occupational sources, sensitive electronics and medical or laboratory systems. In such environments, source control, interlocks, barriers, distance, power reduction and engineered enclosures are usually preferred before relying on personal protective equipment.

## 10. Practical conclusion

Yes, fabrics capable of strongly attenuating RF exist. No, a fabric attenuation number by itself does not establish that a shirt or blanket reduces a person's SAR or guarantees compliance with an MPE limit.

For ordinary public wireless exposure, applicable guidelines are designed to prevent established adverse effects from excessive tissue heating. WHO guidance emphasizes controlling strong sources with measures such as barriers where limits could be exceeded. If an occupational environment may exceed limits, it requires a formal RF safety assessment rather than reliance on an unverified consumer garment.

The research opportunity is still real: broadband, breathable, washable garments whose complete-body exposure effects are validated across far-field and near-field scenarios. The hard problem is not only inventing a conductive fabric. It is controlling the electromagnetic boundary conditions of a moving, lossy, irregular human body without creating gaps, hot spots or unintended transmitter behavior.

## References

1. FCC, [Radiofrequency exposure limits and evaluation framework](https://docs.fcc.gov/public/attachments/FCC-19-126A1_Rcd.pdf).
2. IEC/IEEE, [63195-2:2022—Computational procedures for incident power-density assessment from 6 GHz to 300 GHz](https://webstore.iec.ch/en/publication/62754).
3. IEC, [63203-201-2:2022—Measurement methods for conductive fabrics and insulation materials](https://webstore.iec.ch/en/publication/63309).
4. IEC, [60895:2020—Live working conductive clothing](https://webstore.iec.ch/en/publication/29896).
5. S. Brnada et al., [“Electromagnetic Shielding Properties of Knitted Fabric Made from Polyamide Threads Coated with Silver”](https://pmc.ncbi.nlm.nih.gov/articles/PMC7962651/), *Materials*, 2021.
6. S. M. Abbas et al., [“Stretchable and wash durable reactive silver ink coatings for electromagnetic interference shielding”](https://doi.org/10.1016/j.porgcoat.2023.107506), *Progress in Organic Coatings*, 2023.
7. World Health Organization, [Electromagnetic fields: questions and answers](https://www.who.int/news-room/questions-and-answers/item/radiation-electromagnetic-fields).
