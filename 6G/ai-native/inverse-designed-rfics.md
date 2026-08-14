---
layout: article
title: "Inverse-Designed RFICs: When AI Starts Solving Maxwell"
section: 6G
section_url: /6G/
description: How deep-learning electromagnetic surrogates and reinforcement learning are changing RFIC design from topology selection and parameter tuning into specification-driven synthesis.
previous_title: Why 6G May Need an AI Plane
previous_url: /6G/ai-native/ai-plane.html
---

## 1. The research question

RF engineers traditionally begin a design with a recognizable circuit structure: a transformer, Wilkinson divider, transmission-line matching network, balun, hybrid, filter or power-combining network. Analysis and experience provide the initial topology; optimization then adjusts dimensions and component values until circuit and electromagnetic simulations approach the required response.

Recent work from Kaushik Sengupta's group at Princeton asks a more disruptive question:

> What if the designer specifies the required electrical behavior and physical constraints, but does not specify the RF geometry—or even the complete circuit topology?

This is **inverse design**. The forward problem asks what response a given structure produces. The inverse problem begins with the desired response and searches for a physical structure that produces it.

```text
Conventional RF design

Specifications
     ↓
Known topology selected by an engineer
     ↓
Initial dimensions and device parameters
     ↓
Circuit and EM simulation
     ↓
Repeated tuning
     ↓
Layout, extraction and verification


Inverse-designed RFIC

Specifications + process constraints
     ↓
Architecture, topology and geometry search
     ↓
Learned EM surrogate + optimization
     ↓
Candidate physical layout
     ↓
Conventional circuit/EM verification
     ↓
Fabrication and measurement
```

The important advance is not merely using machine learning to tune transistor widths. It is expanding the search to include structures that an engineer may never have chosen as the starting point.

## 2. Why the geometry can look unintuitive

Human-designed microwave structures are usually regular and symmetric because those properties make them easier to analyze, parameterize and debug. Maxwell's equations impose no equivalent requirement that the optimum conductor pattern resemble a familiar textbook component.

An inverse-designed region may therefore look pixelated or irregular:

```text
██   ███      █
 ████   ██ ███
██  █ █████
   ██ █   ████
███    ███
```

The geometry is not random. Each conducting or non-conducting region contributes to distributed inductance, capacitance, coupling, phase and radiation. The optimizer is exploiting the complete electromagnetic structure rather than assembling a circuit only from recognizable lumped or transmission-line elements.

This matters increasingly at millimeter-wave and sub-terahertz frequencies. Interconnects, discontinuities and passive structures occupy electrically significant dimensions, so the boundary between a circuit and its electromagnetic layout becomes difficult to maintain.

## 3. From RF specifications to an electromagnetic structure

Consider a simplified target such as:

```text
|S₁₁(f)| < −15 dB
```

over a specified band, together with targets for insertion loss, impedance transformation, isolation, area or radiation pattern. A conventional workflow selects a topology before optimizing it. An inverse-design workflow treats the spatial distribution of conductor and dielectric as part of the optimization variable.

In the Princeton work, an electromagnetic design region can be represented as a binary pixel grid. A 25 × 25 grid contains 625 binary decisions and therefore

```text
2⁶²⁵ ≈ 10¹⁸⁸
```

possible geometries.

Exhaustively simulating that space is impossible. Even a tiny fraction would require far too many full-wave finite-element or method-of-moments solutions.

## 4. The learned EM surrogate

The enabling mechanism is a deep-learning **surrogate model**. It learns the forward relationship

```text
geometry → S-parameters and/or radiation response
```

After training on electromagnetic simulation data, the surrogate can evaluate candidate structures far faster than invoking a full-wave solver for every search step. An optimizer can then explore a much larger and less intuitive design space.

```text
Candidate geometry
        ↓
Learned EM surrogate
        ↓
Predicted S-parameters / radiation
        ↓
Objective and constraint evaluation
        ↓
Updated candidate geometry
```

The surrogate does not replace Maxwell's equations in final sign-off. It makes the search computationally tractable. Promising candidates must still be checked with conventional electromagnetic and circuit simulation, design-rule verification and, ultimately, measured silicon.

## 5. What the 2024 work demonstrated

The group's 2024 *Nature Communications* paper generalized inverse design to arbitrary-shaped, multi-port RF and sub-terahertz passive structures co-designed with active circuits. The reported examples included filters, antennas, multi-port networks and integrated millimeter-wave circuits.

This was not only a simulated layout-generation exercise. Structures and circuits were fabricated in a 90-nm SiGe BiCMOS process, while candidate designs were checked with established electromagnetic verification flows, including full-wave and full-die simulations.

Multi-port synthesis is especially important. A useful RF front end requires more than a single input impedance match: power division and combination, differential conversion, isolation, phase control and interaction with active devices all create coupled constraints.

## 6. From passive inverse design to end-to-end RFIC synthesis

At ISSCC 2025, the work expanded from electromagnetic passive synthesis toward an end-to-end design flow combining reinforcement learning and inverse EM methods.

The search covered multiple levels:

1. Circuit architecture
2. Circuit topology
3. Active-device and circuit parameters
4. Passive electromagnetic structures
5. Physical layout consistent with fabrication constraints

The reported silicon included a power amplifier operating approximately from 34 to 70 GHz, with a peak saturated output power of 21.2 dBm and maximum power-added efficiency of 26%. A second design operated from 100 to 120 GHz and reached 12.6 dBm peak saturated output power.

Those results make the work more consequential than parameter optimization around a human-selected RF topology. The design question can begin to shift from

> Use this architecture and matching network; find the best dimensions.

to

> Here are the RF specifications, process rules and physical limits; search for the architecture and its electromagnetic realization.

## 7. Why this is not an autonomous AI radio designer

The phrase “AI designed a chip” hides substantial human and engineering input. Designers still define:

- the semiconductor process and available metal stack;
- ports, frequency bands and source/load conditions;
- power, gain, bandwidth, efficiency and linearity objectives;
- chip area and routing constraints;
- permitted design region and geometric resolution;
- training data, loss functions and optimization strategy;
- verification, fabrication and measurement methodology.

Surrogate models can also be inaccurate outside their training distribution. An optimizer may exploit prediction errors and produce a candidate that looks excellent to the model but fails full-wave verification. Manufacturing variation, thermal behavior, breakdown, stability, reliability, packaging and interaction with the rest of the transceiver remain physical engineering problems.

The correct interpretation is therefore not that RF expertise has become unnecessary. The advance changes where expertise is applied: engineers define the problem, constraints and verification envelope while algorithms search a design space too large and irregular for manual exploration.

## 8. Why this matters for 6G hardware

Candidate 6G systems are expected to investigate upper-mmWave and sub-THz operation, very wide bandwidths, dense antenna integration, joint communication and sensing, and more tightly integrated radio and packaging technologies. These directions increase the importance of distributed electromagnetic effects while multiplying design objectives.

Inverse design could help explore:

- broadband matching and power combining at mmWave and sub-THz frequencies;
- compact multi-port structures for phased arrays and MIMO radios;
- antennas and front ends co-designed with active circuits;
- frequency-selective and spatially selective structures;
- joint communication-and-sensing RF hardware;
- unconventional structures adapted to process and packaging constraints.

The connection to 6G should still be stated carefully. The demonstrated chips are research prototypes and inverse-designed RFICs are not a defined 6G requirement. Their importance is methodological: as frequency rises and the design space becomes more electromagnetic, specification-driven synthesis may uncover hardware architectures that conventional template-based design would not reach.

## 9. The deeper transition

Traditional electronic design automation usually optimizes parameters inside a structure selected by a human. Inverse RF design begins to make the structure itself a search variable.

```text
Earlier automation

Human chooses architecture and topology
                 ↓
Tool optimizes parameters


Emerging inverse-design automation

Human defines objectives and constraints
                 ↓
Tool searches architecture, topology,
parameters and electromagnetic geometry
```

That is the real research frontier. AI is not “solving Maxwell” by replacing electromagnetic physics. It is learning fast approximations to electromagnetic behavior so that optimization can explore designs humans cannot enumerate—and then returning to Maxwell-based tools and measured hardware to determine whether the result is real.

## References

1. E. A. Karahan et al., [“Deep-learning enabled generalized inverse design of multi-port radio-frequency and sub-terahertz passives and integrated circuits,”](https://www.nature.com/articles/s41467-024-54178-1) *Nature Communications*, vol. 15, article 10734, 2024.
2. J. Zhou et al., [“AI-Enabled Design Space Discovery and End-to-End Synthesis for RFICs with Reinforcement Learning and Inverse Methods Demonstrating mm-Wave/sub-THz PAs between 30 and 120 GHz,”](https://collaborate.princeton.edu/en/publications/ai-enabled-design-space-discovery-and-end-to-end-synthesis-for-rf/) *IEEE International Solid-State Circuits Conference (ISSCC)*, 2025.
3. K. Sengupta et al., [“AI Enabling Discovery and Design of Radio and High-Frequency Wireless Chips Beyond Human Intuition,”](https://collaborate.princeton.edu/en/publications/ai-enabling-discovery-and-design-of-radio-and-high-frequency-wire/) *Computer*, vol. 58, no. 8, 2025.
4. K. Sengupta, [“AI-enabled RF-to-terahertz chip design beyond human intuition,”](https://opg.optica.org/ao/abstract.cfm?uri=ao-64-30-F55) *Applied Optics*, vol. 64, no. 30, 2025.
