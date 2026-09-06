---
layout: article
title: "5G NR Random Access in Detail: From SSB and SIB1 to Msg1, RAR, Msg3 and Msg4"
section: 5G NR
section_url: /5G/
description: A complete standards-guided walk through contention-based 4-step NR random access, beginning with synchronization-raster scanning, PSS/SSS correlation and the exact 4-symbol SS/PBCH block resource map, then MIB, SIB1, PRACH, RAR, Msg3 and Msg4.
evidence_type: Standards-guided protocol analysis
reference_basis: 3GPP TS 38.104, TS 38.300, TS 38.211, TS 38.212, TS 38.213, TS 38.321 and TS 38.331
last_reviewed: 2026-09-06
mermaid: true
math: true
previous_title: Why QFI and DRB Are Separate
previous_url: /5G/protocol-stack/qfi-vs-drb-sdap.html
---

## 1. Start from zero: what does a newly powered UE actually do?

A newly powered UE does **not** know the physical cell ID, system-frame number, SIB1 location, PRACH occasions, Msg1 preambles, RA-RNTI or a serving-cell C-RNTI.

It cannot begin by asking the gNB for any of those things because it has not yet established a radio relationship with the gNB.

What the UE *does* already know is the **3GPP-defined acquisition procedure** implemented in its modem:

- which NR bands and bandwidths the hardware supports;
- the synchronization-raster rules for candidate SS/PBCH block frequencies;
- the mathematical definitions of every possible PSS and SSS sequence;
- the time-frequency structure of an SS/PBCH block;
- how PBCH and PBCH DM-RS are generated and mapped;
- how MIB is decoded; and
- the standardized tables used to derive initial PDCCH monitoring from the MIB.

So the beginning of initial access is fundamentally a **known-pattern search problem**.

At a simplified implementation level:

```text
UE powers on
    ↓
select a band / frequency range to search
    ↓
tune to candidate SS/PBCH frequency positions
from the 3GPP synchronization raster
    ↓
correlate received samples against the 3 known PSS candidates
    ↓
strong PSS correlation peak found
    ↓
obtain N_ID^(2) + a timing/frequency synchronization anchor
    ↓
correlate against the SSS candidate set for that N_ID^(2)
    ↓
obtain N_ID^(1)
    ↓
derive physical cell ID
    ↓
use the now-known SS/PBCH structure and PCI
for PBCH-DMRS/PBCH hypotheses and decoding
    ↓
PBCH decoded
    ↓
MIB
    ↓
CORESET#0 / SearchSpace#0
    ↓
PDCCH: DCI 1_0 associated with SI-RNTI
    ↓
PDSCH carrying SIB1
    ↓
common cell + RACH configuration known
    ↓
UE can camp / access the cell as applicable
    ↓
             4-STEP RANDOM ACCESS
    ↓
Msg1 → Msg2/RAR → Msg3 → Msg4
```

This ordering is the key to understanding the rest of the article.

> **PSS and SSS are not arbitrary sequences that the gNB invents and tells the UE later. Their candidate sequences are defined by 3GPP and are already implemented in the UE. The UE finds them by correlation.**

A terminology point matters here: **PSS and SSS are physical signals; PBCH is a physical channel.** Together with PBCH DM-RS they occupy the SS/PBCH block, commonly called the SSB.

### 1.1 The UE does not scan every possible subcarrier blindly

When the SS/PBCH position is not already explicitly known, NR defines a **synchronization raster** for system acquisition. Candidate SS/PBCH reference frequencies are represented by GSCN/SSREF values, with band-specific applicable raster entries.

So conceptually the search is closer to:

```text
candidate SSREF / GSCN #1
    ↓
look for a PSS correlation peak
    ↓
not found

candidate SSREF / GSCN #2
    ↓
look for a PSS correlation peak
    ↓
not found

candidate SSREF / GSCN #3
    ↓
strong PSS peak
    ↓
continue with SSS and PBCH acquisition
```

Commercial implementations can optimize this heavily using stored frequencies, operator information, previous camping history and parallel DSP processing, but the standards-level concept is that the UE looks for the synchronization block on valid synchronization-raster positions rather than needing prior dedicated signalling from the cell.

### 1.2 Why this bootstrap has to be predefined

Suppose PBCH required DCI before it could be decoded:

```text
Need DCI to decode PBCH
       ↑
Need MIB to find initial PDCCH
       ↑
Need PBCH to obtain MIB
```

That is a circular dependency.

NR avoids it by making the first acquisition stages deterministic from the specification:

```text
known PSS/SSS candidates
        ↓
known SS/PBCH resource structure
        ↓
known PBCH bootstrap processing
        ↓
MIB
        ↓
initial PDCCH configuration
        ↓
SIB1
        ↓
fuller common configuration
```

Only after this bootstrap does normal dynamically scheduled communication begin.

## 2. PSS and SSS are already known by the UE: correlation is the search mechanism

The important mental model is not:

```text
gNB sends PSS
UE somehow "decodes" an unknown PSS
```

It is:

```text
3GPP defines a finite set of synchronization sequences
        ↓
UE stores/implements how to generate those sequences
        ↓
UE receives an unknown mixture of signal + channel distortion + noise
        ↓
UE correlates the received waveform against each allowed candidate
        ↓
large correlation peak identifies the most likely candidate and timing
```

### 2.1 PSS: only three candidate identities

NR defines:

\[
N_{ID}^{(2)} \in \{0,1,2\}
\]

Therefore there are only **three PSS sequence candidates**.

Each PSS sequence contains **127 sequence elements**, and when placed inside the SS/PBCH block it occupies 127 consecutive subcarriers.

The UE can conceptually generate:

```text
PSS candidate 0
PSS candidate 1
PSS candidate 2
```

and correlate each one against the received signal.

A simplified correlation metric for candidate \(i\) is:

\[
C_i(\tau)=\left|\sum_{n=0}^{126} r[n+\tau]s_i^{*}[n]\right|
\]

where:

- \(r[n]\) is the received complex signal;
- \(s_i[n]\) is the known candidate PSS sequence;
- \(^*\) denotes complex conjugation; and
- \(\tau\) is a timing hypothesis.

The UE searches for a strong peak over candidate identity and timing.

For a deliberately simplified numerical picture:

```text
maximum correlation with PSS 0 =   8.7
maximum correlation with PSS 1 = 121.4   ← strong peak
maximum correlation with PSS 2 =   6.2
```

The UE therefore identifies:

```text
N_ID^(2) = 1
```

and the location of the peak provides a synchronization anchor for where that PSS arrived.

The real receiver is more sophisticated: carrier-frequency offset, channel gain, multipath, noise and implementation-specific detection thresholds all matter. But the core operation remains **correlation against standardized known candidates**.

### 2.2 Why simple equality is not enough

Over the air, the received sequence is not generally:

```text
received[n] == known[n]
```

Instead, even in a simple flat-channel model:

\[
r[n] = h\,s[n]e^{j2\pi \Delta f nT_s}+w[n]
\]

where the signal may be changed by:

```text
channel amplitude and phase h
carrier-frequency offset Δf
noise w[n]
possible multipath / filtering
```

Therefore a test such as:

```text
received[n] / known[n] == 1
```

would fail in a real radio even when the correct PSS is present.

Correlation is robust because the correct candidate adds coherently while unrelated candidates/noise tend not to.

### 2.3 SSS: PSS narrows the next search

After PSS detection the UE knows \(N_{ID}^{(2)}\). It then searches for the **Secondary Synchronization Signal**.

NR defines:

\[
N_{ID}^{(1)} \in \{0,1,\ldots,335\}
\]

The SSS sequence also contains **127 elements**. Its generation depends on both \(N_{ID}^{(1)}\) and the already determined \(N_{ID}^{(2)}\).

So, conceptually:

```text
PSS result:
    N_ID^(2) = 1

then test SSS hypotheses:
    N_ID^(1) = 0
    N_ID^(1) = 1
    ...
    N_ID^(1) = 335
```

Again, the UE uses correlation/detection metrics rather than waiting for a field that explicitly says "my cell identity is 301".

Suppose the strongest SSS hypothesis is:

```text
N_ID^(1) = 100
```

Then the physical-layer cell identity is:

\[
N_{ID}^{cell}=3N_{ID}^{(1)}+N_{ID}^{(2)}
\]

Therefore:

\[
N_{ID}^{cell}=3(100)+1=301
\]

This is where the familiar PCI formula belongs in the procedure: **after the UE has actually detected the PSS and SSS identities from known standardized sequences**.

Because:

```text
N_ID^(1): 336 possibilities
N_ID^(2):   3 possibilities
```

NR has:

\[
336\times3=1008
\]

physical-layer cell identities:

```text
PCI = 0 ... 1007
```

The PCI is therefore **derived from synchronization-signal detection**; it is not simply transmitted as a normal field inside the MIB.

## 3. The exact SS/PBCH block: 4 OFDM symbols × 240 contiguous subcarriers

This is the structural detail that makes the acquisition flow concrete.

3GPP TS 38.211 defines one SS/PBCH block as:

```text
TIME:       4 consecutive OFDM symbols
            l = 0, 1, 2, 3 within the SSB

FREQUENCY:  240 contiguous subcarriers
            k = 0, 1, ... , 239 within the SSB
```

The 240 subcarriers correspond to:

```text
240 / 12 = 20 resource blocks
```

at the SSB subcarrier spacing.

So an SSB is literally a **4-symbol × 240-subcarrier rectangular resource region**, with PSS, SSS, PBCH and PBCH DM-RS placed at standardized positions inside that rectangle.

### 3.1 Exact PSS and SSS placement

The synchronization signals each occupy 127 consecutive subcarriers:

```text
PSS:
    OFDM symbol l = 0
    subcarriers k = 56 ... 182

SSS:
    OFDM symbol l = 2
    subcarriers k = 56 ... 182
```

Because:

```text
182 - 56 + 1 = 127
```

These are **fixed positions relative to the start of the SS/PBCH block**.

The absolute RF frequency of the SSB can of course vary according to the band and synchronization-raster position, but once the UE hypothesizes an SSB location, the internal resource map is standardized.

### 3.2 Exact four-symbol picture

A useful resource-grid view is:

```text
Relative subcarrier k within the SSB

        0          47 48   55 56                 182 183 191 192        239
        |-----------| |-----| |-------------------| |------| |-----------|

l = 0   ZERO / unused          PSS (127 SC)                    ZERO / unused
        k=0..55                k=56..182                       k=183..239

l = 1   PBCH + PBCH DM-RS across the 240-subcarrier SSB region

l = 2   PBCH+DMRS   ZERO       SSS (127 SC)        ZERO       PBCH+DMRS
        k=0..47     48..55     k=56..182           183..191   k=192..239

l = 3   PBCH + PBCH DM-RS across the 240-subcarrier SSB region
```

More formally:

| SSB symbol \(l\) | Standardized use |
|---:|---|
| 0 | PSS on \(k=56\ldots182\); remaining SSB REs in this symbol are set to zero as specified |
| 1 | PBCH over \(k=0\ldots239\), excluding REs used by PBCH DM-RS |
| 2 | SSS on \(k=56\ldots182\); PBCH in the outer regions \(k=0\ldots47\) and \(192\ldots239\); PBCH DM-RS in its defined REs; guard REs around SSS are set to zero |
| 3 | PBCH over \(k=0\ldots239\), excluding REs used by PBCH DM-RS |

PBCH DM-RS is interleaved with PBCH. Its comb offset depends on:

\[
v=N_{ID}^{cell}\bmod4
\]

which is one reason acquiring the PCI from PSS/SSS is important before reliable PBCH processing.

### 3.3 Visualizing what the UE already knows before receiving anything

Before seeing the cell, the UE already knows this **template**:

```text
symbol 0:        [          PSS          ]
symbol 1: [------------- PBCH + DMRS -------------]
symbol 2: [PBCH] [       SSS       ] [PBCH]
symbol 3: [------------- PBCH + DMRS -------------]

frequency extent of entire SSB = 240 contiguous subcarriers
```

It does not know yet:

```text
which candidate SSB frequency actually contains a cell
which PSS candidate is present
which SSS candidate is present
what the PCI is
which beam / SSB index hypothesis is the correct one
what MIB says
```

But it absolutely knows **where PSS, SSS, PBCH and DM-RS would be relative to an SSB candidate if one is present**.

That difference—known structure versus unknown instance—is the essence of initial synchronization.

### 3.4 How wide is an SSB in frequency?

The frequency width is simply:

\[
B_{SSB}=240\Delta f_{SSB}
\]

Examples:

| SSB SCS | 240-subcarrier span |
|---:|---:|
| 15 kHz | 3.6 MHz |
| 30 kHz | 7.2 MHz |
| 120 kHz | 28.8 MHz |
| 240 kHz | 57.6 MHz |

The allowed SS/PBCH block SCS depends on the applicable NR band/frequency-range rules.

The important invariant is not one fixed MHz width; it is the **240-subcarrier × 4-symbol standardized SSB structure**.

### 3.5 PSS and SSS do not themselves span all four symbols

Be careful with the wording:

```text
SSB spans 4 OFDM symbols.

PSS occupies 1 of those symbols: l = 0.
SSS occupies 1 of those symbols: l = 2.
PBCH occupies resources in l = 1, 2 and 3.
PBCH DM-RS is interleaved with PBCH resources.
```

So saying "PSS spans four symbols" would be wrong. The **SS/PBCH block** spans four symbols.

## 4. Why can the UE decode PBCH without first knowing an MCS?

This is another place where normal PDSCH intuition can mislead.

For ordinary dynamically scheduled data:

```text
PDCCH / DCI
    ↓
tells UE time/frequency allocation + MCS + other scheduling information
    ↓
UE decodes PDSCH
```

PBCH cannot work that way because there is no initial PDCCH configuration yet.

Instead, PBCH is itself part of the standardized bootstrap.

The specification defines the PBCH processing chain and physical mapping, including standardized choices for concepts such as:

```text
PBCH payload construction
scrambling rules
channel coding / Polar coding
rate matching
QPSK modulation
PBCH resource mapping
PBCH DM-RS generation and placement
```

Therefore the UE does **not** need a dynamically signalled PDSCH MCS to decode PBCH.

Conceptually:

```text
PSS correlation
    ↓
N_ID^(2), timing anchor
    ↓
SSS correlation
    ↓
N_ID^(1)
    ↓
PCI
    ↓
known SS/PBCH resource map
    ↓
PBCH DM-RS / allowed SSB-index hypotheses
    ↓
channel estimation + PBCH demodulation
    ↓
PBCH decoding
    ↓
MIB + associated PBCH timing information
```

Depending on frequency range and the SS/PBCH-block set, the receiver may need to test allowed SS/PBCH block-index / DM-RS hypotheses. That is still a **finite standardized hypothesis search**, not an unknown dynamic MCS problem.

This gives the clean bootstrap chain:

```text
3GPP-defined synchronization raster
        ↓
known PSS candidates → correlation
        ↓
known SSS candidates → correlation
        ↓
PCI + SSB timing context
        ↓
predefined PBCH processing
        ↓
MIB
        ↓
initial PDCCH configuration
        ↓
DCI for SIB1
        ↓
PDSCH carrying SIB1
        ↓
RACH configuration
```

Only now is the UE ready to enter the ordinary four-step Random Access procedure.

## 5. What the MIB contains

After PBCH decoding, the UE obtains the NR MIB.

Important MIB fields include:

```text
MIB
├── systemFrameNumber
├── subCarrierSpacingCommon
├── ssb-SubcarrierOffset
├── dmrs-TypeA-Position
├── pdcch-ConfigSIB1
│   ├── controlResourceSetZero
│   └── searchSpaceZero
├── cellBarred
├── intraFreqReselection
└── spare
```

### `systemFrameNumber`

The radio frame number has a 10-bit range:

```text
0 ... 1023
```

The MIB ASN.1 field carries the specified most-significant part; additional PBCH payload processing contributes the remaining SFN-related bits needed by the UE. At a procedure level, the UE reconstructs the usable SFN/timing context.

### `subCarrierSpacingCommon`

This identifies the common SCS alternative relevant to the common channels. In FR1 the useful interpretation is the 15/30 kHz family; in FR2 it maps to the corresponding common-channel alternatives.

### `ssb-SubcarrierOffset`

This contributes the frequency relationship between the SS/PBCH block and the common resource grid.

### `dmrs-TypeA-Position`

This indicates the Type-A DM-RS position choice, `pos2` or `pos3`.

### `cellBarred`

This tells the UE whether normal cell selection/camping is barred for the cell.

### `intraFreqReselection`

This contributes to idle-mode reselection behavior.

### `pdcch-ConfigSIB1`

For the initial-access story, this is the key MIB field. It lets the UE derive the initial PDCCH configuration needed to find SIB1.

## 6. How MIB tells the UE where to look for SIB1

`pdcch-ConfigSIB1` contains indices commonly described as:

```text
controlResourceSetZero
searchSpaceZero
```

The UE combines those values with the applicable specification tables and SS/PBCH context to derive:

```text
CORESET#0
SearchSpace#0
```

This answers the next bootstrap problem:

> **How does a UE know which PDCCH to monitor if it has never been configured by dedicated RRC signalling?**

It does not search every possible PDCCH resource. The MIB narrows the problem to a standardized initial common control region and search space.

## 7. CORESET and SearchSpace are different concepts

This distinction is fundamental.

### CORESET: where PDCCH resources physically exist

A Control Resource Set defines a bounded time-frequency region for PDCCH.

Conceptually:

```text
                frequency →

symbol 0     |========== CORESET ==========|
symbol 1     |========== CORESET ==========|
symbol 2     |                              |
...
```

It constrains things such as:

```text
which frequency-domain resources belong to the control region
how many OFDM symbols the control region spans
```

Inside the CORESET, PDCCH resources are organized through REG/CCE structures.

### SearchSpace: which candidates the UE actually tries

A SearchSpace determines the monitoring pattern and candidates within an associated CORESET.

At a high level it tells the UE:

```text
which CORESET to use
which slots are monitoring occasions
which symbol(s) can start monitoring
how many PDCCH candidates exist at each aggregation level
what type of SearchSpace this is
```

A useful memory aid is:

```text
CORESET     = WHERE PDCCH can physically be mapped
SearchSpace = WHEN and WHICH PDCCH candidates the UE should attempt
RNTI        = WHO / WHICH PROCEDURE the successfully decoded DCI belongs to
```

## 8. Blind PDCCH decoding

Even with a SearchSpace, the UE does not know which candidate actually contains valid control information.

Suppose a monitoring occasion defines:

```text
AL4 candidate 0
AL4 candidate 1
AL8 candidate 0
```

The UE can conceptually try:

```text
AL4 candidate 0
    ↓
decode expected DCI format
    ↓
CRC/RNTI check
    ↓
FAIL

AL4 candidate 1
    ↓
decode
    ↓
CRC/RNTI check
    ↓
PASS
```

That is why this is called blind decoding: the candidate set is constrained, but the exact successful candidate is not known in advance.

## 9. How SIB1 is received

For SIB1 acquisition, the conceptual chain is:

```text
MIB
 ↓
CORESET#0 / SearchSpace#0
 ↓
Type-0 PDCCH Common Search Space
 ↓
DCI format 1_0 associated with SI-RNTI
 ↓
PDSCH scheduling information
 ↓
PDSCH
 ↓
SIB1
```

Two important distinctions:

1. **PDCCH does not carry SIB1.** It carries DCI that schedules the PDSCH.
2. **PDSCH carries SIB1.**

So the UE first learns *how to receive the data channel* from DCI, then decodes the data channel containing system information.

This is the second bootstrap layer:

```text
MIB tells UE where to look for initial control.
Control tells UE where/how to receive SIB1.
SIB1 tells UE how the cell operates, including how Random Access is configured.
```

## 10. What does it mean for the UE to be camped on the cell?

After cell selection and acquisition of the system information required for normal idle operation, a UE can select the cell as its current idle-mode cell. This is commonly described as being **camped on the cell**.

Camped does not mean RRC_CONNECTED.

A camped UE:

```text
has selected this cell for idle-mode service
maintains the required synchronization/measurements
monitors paging according to its paging occasions
uses this cell as the anchor for cell reselection decisions
can initiate access procedures such as RACH on this cell
```

A useful separation is:

```text
camped      = radio cell selected for idle operation
registered  = NAS/core-network registration state
connected   = active RRC_CONNECTED radio relationship
```

Those are not synonyms.

When an application needs service, or the network pages the UE, a camped UE may start Random Access on the selected cell rather than performing a full band search again.

## 11. What does the UE know immediately before starting RACH?

From SIB1 and related common configuration, the UE has enough information to determine legal PRACH behavior.

Important random-access parameters include concepts such as:

| Parameter | Why it matters |
|---|---|
| `prach-ConfigurationIndex` | Determines PRACH occasion timing/pattern |
| `msg1-FDM` | Number of frequency-domain PRACH occasions |
| `msg1-FrequencyStart` | Frequency placement of Msg1 PRACH |
| `prach-RootSequenceIndex` | PRACH sequence generation configuration |
| `zeroCorrelationZoneConfig` | Preamble cyclic-shift / correlation-zone configuration |
| `preambleReceivedTargetPower` | Initial target receive power for PRACH |
| `powerRampingStep` | Power increase on subsequent attempts |
| `preambleTransMax` | Maximum preamble-transmission attempts before failure handling |
| `ra-ResponseWindow` | How long the UE waits for a matching RAR |
| `totalNumberOfRA-Preambles` | Number of configured RA preambles |
| `ssb-perRACH-OccasionAndCB-PreamblesPerSSB` | Association among SSBs, ROs and contention-based preambles |
| `ra-ContentionResolutionTimer` | Waiting period for contention resolution after Msg3 |

The exact structures are nested inside the common RRC configuration, but the behavioral result is simple:

> The UE knows **when and where Msg1 is allowed, which preambles it can choose, how much power to use, how long to wait for Msg2, and how to monitor the subsequent random-access response**.

## 12. What is a RACH Occasion?

A **RACH Occasion (RO)** is a time-frequency opportunity in which a UE is allowed to transmit a PRACH preamble.

Think of the network broadcasting a common calendar:

```text
slot 10, frequency occasion 0 → PRACH allowed
slot 20, frequency occasion 0 → PRACH allowed
slot 20, frequency occasion 1 → PRACH allowed
slot 30, frequency occasion 0 → PRACH allowed
...
```

The gNB is not yet telling one idle UE:

> "UE 123, transmit Msg1 in slot 20."

Instead the cell tells all eligible UEs:

> "These are the common Random Access opportunities. If you need access, choose according to the configured procedure."

That is why Msg1 does **not** require a normal dynamic UL grant.

## 13. SSB-to-RACH association and beam context

NR can associate PRACH resources with SS/PBCH blocks.

Suppose a UE's selected/detected beam corresponds to:

```text
SSB index 3
```

and the cell configuration maps SSB 3 to a defined set of RACH occasions/preambles.

Then conceptually:

```text
SSB 0 → one configured RO/preamble association
SSB 1 → another
SSB 2 → another
SSB 3 → another
```

This lets the network infer useful beam information from the PRACH resource used by the UE.

The principle is especially intuitive in beamformed FR2 operation: the UE's Msg1 resource can be tied to the SSB/beam on which it acquired the cell.

## 14. UE chooses a contention-based PRACH preamble

A PRACH occasion can provide up to 64 preamble indices, depending on configuration and partitioning.

For a simple example, assume contention-based preambles are:

```text
0 ... 63
```

The UE selects:

```text
PREAMBLE_INDEX = 37
```

This is where the word **contention-based** matters. Another UE can independently choose the same preamble in the same RO.

If that happens, there is no coordination preventing the collision at Msg1.

## 15. Msg1: PRACH has no preceding dynamic UL grant

Suppose the UE needs access and determines:

```text
next valid RACH occasion:
    slot 20
    frequency occasion 1

selected preamble:
    37
```

Then:

```text
slot 20
UE ------------------------------------------> gNB
                  Msg1 / PRACH
                  preamble 37
```

The critical distinction is:

```text
Msg1 / PRACH
    no normal dynamic UE-specific UL grant
    resource comes from common RACH configuration

Msg3 / PUSCH
    dynamically scheduled by the UL grant received in Msg2/RAR
```

## 16. PRACH transmit power and power ramping

The UE must also determine Msg1 transmit power.

At a high level, the UE targets the configured PRACH receive-power state after accounting for estimated downlink path loss, while respecting its maximum transmit-power limit.

Illustrative example:

```text
configured target receive power = -100 dBm
estimated path loss             = 115 dB

rough required TX level         ≈ 15 dBm
```

subject to the exact standardized procedure and UE power constraints.

If attempts fail, the configured `powerRampingStep` can increase the target for subsequent preamble transmissions.

Example:

```text
Attempt 1 target: -100 dBm
Attempt 2 target:  -98 dBm
Attempt 3 target:  -96 dBm
```

for an illustrative 2 dB step.

The purpose is to improve the probability that the gNB detects the preamble without immediately forcing every UE to transmit PRACH at maximum power.

## 17. What does the gNB learn from Msg1?

The gNB detects the PRACH preamble on a known RACH occasion.

At a high level it obtains:

```text
a detected preamble index
which RACH occasion carried it
uplink arrival-timing information from PRACH
beam/resource context implied by the configured RO association
```

The gNB does **not yet know a normal permanent radio identity for an initial-access UE simply from the preamble**.

That is why Msg2 and later Msg3/Msg4 are required.

## 18. RA-RNTI: how UE and gNB identify the RAR context

After Msg1, UE and gNB independently derive an **RA-RNTI** from the PRACH occasion.

For the ordinary 4-step path, the familiar expression is:

\[
RA\text{-}RNTI = 1 + s_{id} + 14t_{id} + 14\cdot80f_{id} + 14\cdot80\cdot8\cdot ul\_carrier_{id}
\]

Conceptually:

- \(s_{id}\): starting symbol index of the PRACH occasion;
- \(t_{id}\): time/slot index used by the RA-RNTI construction;
- \(f_{id}\): frequency-domain PRACH occasion index; and
- `ul_carrier_id`: identifies the applicable uplink-carrier case.

The essential interpretation is:

> **RA-RNTI identifies the Random Access occasion/context, not one unique UE.**

If two UEs use the same RACH occasion, they calculate the same RA-RNTI.

## 19. After Msg1, how does the UE know which PDCCH to monitor?

SIB1's common downlink control configuration can provide `ra-SearchSpace` for Random Access Response monitoring.

The chain is:

```text
SIB1
 ↓
PDCCH-ConfigCommon
 ↓
ra-SearchSpace
 ↓
SearchSpace configuration
 ↓
associated CORESET
monitoring periodicity / offset
monitoring symbols
PDCCH candidates
```

The UE then combines that search-space knowledge with the RA-RNTI it derived from Msg1.

So:

```text
SearchSpace/CORESET
    → where and when should I try PDCCH decoding?

RA-RNTI
    → which decoded DCI belongs to my Random Access occasion?
```

The RNTI does not tell the UE the physical location of PDCCH. The SearchSpace narrows the location/candidates; the RNTI validates the procedure/addressing context.

## 20. The RAR response window

After transmitting Msg1, the UE performs RAR monitoring according to `ra-ResponseWindow` and the applicable Type-1 PDCCH Common Search Space monitoring occasions.

A simplified example:

```text
Msg1 transmitted around slot 20

configured response interval contains monitoring occasions at:
slot 21
slot 23
slot 25
slot 27
```

The UE may conceptually do:

```text
slot 21 → blind-decode configured PDCCH candidates
slot 22 → not a configured monitoring occasion
slot 23 → blind-decode candidates
slot 24 → not a monitoring occasion
slot 25 → try again
slot 27 → try again
```

The exact start/end timing follows the standardized response-window rules; the key concept is that the UE is **not blindly decoding every PDCCH resource in every slot**.

## 21. What exactly is the UE looking for on PDCCH?

For the ordinary RAR path, the UE attempts to detect the appropriate **DCI format 1_0 whose CRC is associated with the corresponding RA-RNTI** in the Type-1 PDCCH Common Search Space.

Conceptually:

```text
candidate AL4 #0
    ↓
try DCI 1_0
    ↓
CRC/RNTI check using RA-RNTI
    ↓
FAIL

candidate AL4 #1
    ↓
try DCI 1_0
    ↓
CRC/RNTI check
    ↓
PASS
```

A successful control decode tells the UE how to receive the associated PDSCH.

## 22. Msg2 is PDCCH + PDSCH, not one magical "RAR channel"

At procedure level we say:

```text
Msg2 = RAR
```

At radio-channel level:

```text
PDCCH
    └── DCI 1_0 associated with RA-RNTI
            ↓
            schedules
            ↓
PDSCH
    └── MAC PDU containing Random Access Response information
```

The DCI tells the UE the scheduling information required to receive PDSCH, including the applicable time/frequency resource assignment and MCS-related information.

So:

```text
UE does not know RAR PDSCH location in advance
        ↓
find valid PDCCH candidate
        ↓
decode DCI
        ↓
now know where/how to receive PDSCH
        ↓
decode PDSCH
        ↓
obtain RAR MAC PDU
```

## 23. Why RA-RNTI is not enough: RAPID

Suppose three UEs transmit in the same PRACH occasion but choose different preambles:

```text
UE A → preamble 5
UE B → preamble 17
UE C → preamble 42
```

Because the RO is the same:

```text
RA-RNTI(A) = RA-RNTI(B) = RA-RNTI(C)
```

The gNB can form a RAR MAC PDU containing responses associated with different **Random Access Preamble IDs (RAPIDs)**:

```text
RAR MAC PDU

RAPID 5  → response for preamble 5
RAPID 17 → response for preamble 17
RAPID 42 → response for preamble 42
```

UE B therefore filters in stages:

```text
1. SearchSpace / CORESET
   Where do I try to decode PDCCH?

2. RA-RNTI
   Is this DCI for my PRACH occasion?

3. RAPID = 17
   Is this RAR entry for the preamble I actually transmitted?
```

This **SearchSpace → RA-RNTI → RAPID** progression is one of the best ways to remember RAR reception.

## 24. What does a successful RAR contain?

For ordinary 4-step RA, the fixed RAR payload contains three critical pieces:

```text
Timing Advance Command     12 bits
UL Grant                   27 bits
Temporary C-RNTI           16 bits
```

The RAR MAC PDU also contains the subheader/RAPID structure needed to associate a response with a detected preamble.

For the UE, a matching RAR entry answers three immediate questions:

```text
How should I correct my uplink timing?
Where/how do I transmit Msg3?
What temporary radio identity should I use during this access?
```

## 25. Why Timing Advance is returned in Msg2

The UE transmitted Msg1 without having an established UE-specific timing advance for this access.

The gNB observes PRACH arrival timing and derives a correction.

Without correction:

```text
gNB expected UL boundary: |----------------|
UE contribution arrives:       |----------------|
                               late
```

With Timing Advance:

```text
UE transmits earlier
        ↓
gNB receives the uplink aligned with the intended timing reference
```

The TA command therefore establishes/adjusts the uplink timing relationship needed for subsequent scheduled transmissions such as Msg3.

## 26. Where exactly does the UE get the Msg3 TX grant?

> **The UL grant for Msg3 is carried inside the Random Access Response.**

The RAR UL grant contains the information needed to configure the initial Msg3 PUSCH transmission. At a high level it represents fields for concepts such as:

```text
frequency hopping indication
PUSCH frequency-domain allocation
PUSCH time-domain allocation
MCS
TPC command for PUSCH
CSI request
```

The standardized RAR UL grant is 27 bits.

Therefore:

```text
Msg1:
    resource selected from common PRACH configuration
    NO dedicated dynamic UL grant beforehand

Msg3:
    PUSCH resource is determined from the UL grant in Msg2/RAR
```

## 27. Temporary C-RNTI

The RAR also assigns a **Temporary C-RNTI (TC-RNTI)** for the initial-access case when the UE does not already have an appropriate valid C-RNTI for the procedure.

Conceptually:

```text
before RACH:
    no newly established dedicated radio identity for this access

Msg1/Msg2 phase:
    RA-RNTI identifies the RO/RAR context

RAR accepted:
    TC-RNTI = 0x1234
```

The TC-RNTI supports the temporary scheduling/identity context while contention resolution is still pending.

It is not yet proof that this UE uniquely owns that identity, because a same-preamble collision can cause two UEs to accept the same RAR.

## 28. Msg3: actual scheduled PUSCH

Msg3 is no longer PRACH. It is an actual scheduled **PUSCH** transmission using the grant from RAR.

For initial RRC establishment, Msg3 commonly carries an **UL CCCH SDU containing `RRCSetupRequest`**.

Conceptually:

```text
RRC
    creates RRCSetupRequest
        ↓
UL CCCH SDU
        ↓
MAC includes it in the Msg3 transport
        ↓
PUSCH carries Msg3 using RAR UL grant
```

This is also an important HARQ boundary:

```text
Msg1 / PRACH
    not a normal PUSCH HARQ transmission

Msg3 / PUSCH
    scheduled UL-SCH/PUSCH behavior with HARQ-related processing
```

If Msg3 requires retransmission, subsequent scheduling/retransmission behavior follows the specified RA/HARQ procedures rather than simply retransmitting PRACH.

## 29. What identity is carried inside `RRCSetupRequest`?

For the initial establishment path, `RRCSetupRequest` contains an `ue-Identity` choice.

Conceptually:

```text
InitialUE-Identity
├── ng-5G-S-TMSI-Part1   (39 bits)
└── randomValue          (39 bits)
```

### If a suitable 5G-S-TMSI is available

The UE can use the specified 39-bit part of the temporary 5G identity.

### Otherwise

The UE generates a 39-bit random value.

The important point is that two independently accessing UEs will ordinarily have different Msg3 CCCH content even if they collided on the same Msg1 preamble.

## 30. Why do we still need Msg4 after a successful RAR?

Because a contention-based collision may remain unresolved.

Suppose:

```text
UE A:
    same RO X
    preamble 37

UE B:
    same RO X
    preamble 37
```

Then:

```text
same RO
    ↓
same RA-RNTI

same preamble
    ↓
same RAPID
```

The gNB may detect one preamble-37 event and send one RAR:

```text
RAPID = 37
TA = 22
Msg3 grant = G
TC-RNTI = 0x1234
```

Both UEs say:

```text
I transmitted preamble 37.
This RAR contains RAPID 37.
Therefore this response matches my Msg1.
```

Both accept it.

Now they also have:

```text
same Msg3 UL grant G
same TC-RNTI 0x1234
```

Therefore RA-RNTI, RAPID and TC-RNTI are all insufficient to distinguish them.

## 31. The Msg3 collision

Both UEs transmit Msg3 using the same grant:

```text
UE A Msg3 ─────┐
               ├── same scheduled PUSCH resource ──> gNB
UE B Msg3 ─────┘
```

Possible outcomes include:

### Neither Msg3 decodes

```text
collision too destructive
    ↓
gNB gets no valid Msg3
    ↓
no successful contention-resolution response
    ↓
UE timers eventually expire
    ↓
random-access retry path
```

### One Msg3 decodes

Because of received-power difference, timing/channel conditions or receiver behavior, the gNB may successfully decode one UE's Msg3 while the other is lost.

Suppose UE A is decoded successfully.

Now the network needs a way to tell both UEs:

> "The Msg3 I decoded was UE A's, not UE B's."

That is exactly what contention resolution does.

## 32. Where the 48-bit Msg4 contention identity comes from

For the initial-access case where Msg3 contains an UL CCCH SDU, the gNB does **not invent a new random 48-bit value**.

It uses:

```text
first 48 bits of the successfully decoded Msg3 UL CCCH SDU
```

to form the **UE Contention Resolution Identity MAC CE**.

So:

```text
UE creates RRCSetupRequest
        ↓
RRC message is encoded into UL CCCH SDU
        ↓
Msg3 carries UL CCCH SDU
        ↓
gNB successfully decodes one Msg3
        ↓
first 48 bits of that decoded UL CCCH SDU
        ↓
UE Contention Resolution Identity MAC CE
        ↓
Msg4/downlink contention-resolution transmission
```

## 33. 39-bit RRC identity is not the same as the 48-bit MAC identity

The `RRCSetupRequest` UE identity is 39 bits, but the MAC contention-resolution identity is 48 bits.

It is wrong to think:

```text
39-bit randomValue
    + padding
    = 48-bit Msg4 contention identity
```

The rule works at the **UL CCCH SDU** level.

Conceptually, the encoded RRC message contains:

```text
encoded RRCSetupRequest / UL CCCH SDU

+---------------------------------------------------+
| message-choice / ASN.1 structural bits           |
| ue-Identity choice + 39-bit identity              |
| establishmentCause                                |
| spare / other encoded structure                   |
+---------------------------------------------------+
```

MAC does not have to parse the RRC meaning of those bits. It preserves/compares the first 48 bits of the CCCH SDU as specified for contention resolution.

This is a clean cross-layer contract:

```text
RRC understands the semantic UE identity.
MAC understands the bit sequence transmitted in Msg3.
```

## 34. Bit-level contention-resolution example

Assume UE A's encoded Msg3 UL CCCH SDU begins with this illustrative 48-bit prefix:

```text
UE A:
10110010 01101101 10101000 11001110 01010110 11100101 ...
|-----------------------------------------------------|
                     first 48 bits
```

UE B's independently created `RRCSetupRequest` produces:

```text
UE B:
00101101 11001000 01110101 00110001 10101001 00011010 ...
|-----------------------------------------------------|
                     first 48 bits
```

Suppose the gNB decodes UE A's Msg3.

Then the gNB sends a contention-resolution MAC CE containing:

```text
10110010 01101101 10101000 11001110 01010110 11100101
```

UE A compares:

```text
received = A48
stored from my Msg3 = A48

MATCH
→ contention resolution succeeds
```

UE B compares:

```text
received = A48
stored from my Msg3 = B48

NO MATCH
→ this does not resolve my contention
```

If UE B gets no later valid success condition before the contention-resolution procedure expires, it treats the access as failed and retries according to the RA rules.

## 35. What people call Msg4

"Msg4" is a procedure-level label, not a physical channel named MSG4.

At radio level, the downlink uses ordinary control/data transport:

```text
PDCCH
    ↓
schedules PDSCH
    ↓
DL-SCH / MAC PDU
    ↓
UE Contention Resolution Identity MAC CE
    + RRC signalling such as RRCSetup as applicable
```

The MAC CE resolves the contention. The RRC message advances the RRC connection-establishment procedure.

They are related but not the same semantic function.

## 36. The contention-resolution timer

After Msg3 transmission, the UE starts the configured contention-resolution waiting procedure using `ra-ContentionResolutionTimer` according to MAC rules.

Conceptually:

```text
Msg3 transmitted
    ↓
start contention-resolution timer
    ↓
monitor the applicable PDCCH/downlink response
    ↓
identity match / valid C-RNTI-based condition
       → success

or

timer expires
       → contention resolution failure
```

The timer also interacts with Msg3 retransmission behavior according to the MAC procedure.

## 37. When does TC-RNTI become the established C-RNTI?

For the initial-access path being discussed:

```text
RAR:
    TC-RNTI = 0x1234

Msg3:
    temporary random-access context

Msg4:
    contention-resolution identity matches

success:
    C-RNTI uses the successfully resolved temporary identity context
```

A useful simplified mental model is:

```text
TC-RNTI = temporary while contention is unresolved
C-RNTI  = established radio identity after successful resolution
```

The numeric value can remain the same; the procedure state and meaning change.

## 38. Same RO but different preambles

Now consider:

```text
UE A → RO X, preamble 17
UE B → RO X, preamble 36
```

They still share the same RA-RNTI because they used the same RO.

But the gNB can identify two different preamble detections and create separate RAR entries:

```text
RAPID 17
    UL grant G1
    TC-RNTI A

RAPID 36
    UL grant G2
    TC-RNTI B
```

Therefore:

```text
UE A Msg3 → G1
UE B Msg3 → G2
```

The severe same-grant Msg3 collision can be avoided.

So the difficult contention case is specifically:

```text
same PRACH occasion
+
same contention-based preamble
```

not merely two UEs using the same RACH occasion.

## 39. What if Msg2 never arrives?

Suppose the UE transmits:

```text
Msg1 preamble 37
```

but the response window ends without a matching RAR.

Possible causes include:

```text
gNB did not detect PRACH
RAR scheduling/reception failed
UE never obtained a valid RA-RNTI-addressed DCI/PDSCH response
RAR MAC PDU did not contain the matching RAPID
```

Then the attempt is unsuccessful.

At a high level:

```text
Msg1
 ↓
no matching RAR before response-window failure
 ↓
increment random-access attempt state
 ↓
apply backoff if applicable
 ↓
update power-ramping state as applicable
 ↓
select another permitted RO/preamble
 ↓
retry Msg1
```

If the preamble transmission counter exceeds the configured limit, MAC reports a Random Access problem according to the standard procedure.

## 40. What if the UE decodes a RAR for somebody else's preamble?

Suppose UE transmitted:

```text
PREAMBLE_INDEX = 37
```

and receives a RAR MAC PDU containing:

```text
RAPID 4
RAPID 15
RAPID 29
```

There is no RAPID 37.

Therefore:

```text
this RAR MAC PDU does not contain my response
```

The UE does not declare Random Access success merely because it decoded a PDSCH associated with the same RA-RNTI.

It continues the response-window procedure until a matching RAPID is found or the attempt fails.

## 41. Backoff Indicator

A RAR MAC PDU can also convey a **Backoff Indicator (BI)**.

This helps prevent a congested cell from causing many unsuccessful UEs to retry immediately in lockstep.

Conceptually:

```text
many UEs attempt RACH
    ↓
collisions / overload
    ↓
gNB supplies backoff information
    ↓
failed UE chooses a random delay within the applicable backoff range
    ↓
retries later
```

Without backoff, a group of colliding UEs could repeatedly retransmit together and collide again.

## 42. Identity progression through the whole procedure

```text
Before Random Access
────────────────────────────────────
No newly established dedicated C-RNTI for this access

Msg1 / RAR monitoring
────────────────────────────────────
RA-RNTI
    identifies the PRACH occasion / RAR context

RAR MAC PDU
────────────────────────────────────
RAPID
    identifies the response to a detected preamble

Successful RAR
────────────────────────────────────
Temporary C-RNTI
    temporary radio identity while contention is unresolved

Msg3
────────────────────────────────────
UL CCCH SDU / RRCSetupRequest
    carries UE-specific request content

Msg4
────────────────────────────────────
UE Contention Resolution Identity
    = first 48 bits of successfully decoded Msg3 UL CCCH SDU

Random Access Success
────────────────────────────────────
C-RNTI relationship established/confirmed for normal scheduling
```

Each identity solves a different ambiguity.

## 43. A complete numerical-style single-UE example

Assume cell search produced:

```text
PSS winner:
    N_ID^(2) = 1

SSS winner:
    N_ID^(1) = 100

PCI:
    3 × 100 + 1 = 301

selected SSB index / beam context:
    2
```

The UE then decodes PBCH/MIB, finds CORESET#0/SearchSpace#0, receives SIB1 and becomes ready for access.

For illustration, assume SIB1/common configuration effectively gives:

```text
PRACH occasions: every 10 slots in this simplified example
next RO: slot 20
frequency occasion: 1
available CBRA preambles: 0...63
RAR response window: 8 slots
contention-resolution timer: 32 slots

ra-SearchSpace:
    associated CORESET = 0
    monitoring periodicity = 2 slots
    offset = 1
    AL4 candidates = 2
    AL8 candidates = 1
```

The UE selects:

```text
preamble = 37
```

### Slot 20 — Msg1

```text
UE → gNB
PRACH preamble 37
```

UE and gNB derive the same RA-RNTI from that PRACH occasion.

### RAR monitoring

Illustrative Type-1 CSS monitoring occasions:

```text
slot 21
slot 23
slot 25
slot 27
```

At slot 21:

```text
AL4 candidate 0 → fail
AL4 candidate 1 → fail
AL8 candidate 0 → fail
```

At slot 23:

```text
AL4 candidate 0 → fail
AL4 candidate 1 → valid DCI 1_0 for expected RA-RNTI
```

The DCI schedules PDSCH.

UE decodes the PDSCH and obtains:

```text
RAR MAC PDU

RAPID 12 → another response
RAPID 37 →
    TA = 22
    UL Grant = G
    TC-RNTI = 0x1234
```

The UE sees RAPID 37 and accepts that entry.

### Msg3

Grant G says, conceptually:

```text
future Msg3 PUSCH resource = slot 24 / configured PRBs and symbols
MCS = configured grant value
TPC = configured command
```

UE applies TA, stores TC-RNTI, forms `RRCSetupRequest` and transmits Msg3 on PUSCH.

### Msg4

The gNB successfully decodes Msg3 and returns contention-resolution information. The 48-bit identity matches the first 48 bits of the UE's transmitted UL CCCH SDU.

Result:

```text
contention resolved
TC-RNTI context succeeds
Random Access complete
RRC establishment continues
```

## 44. A complete two-UE collision example

Now consider two UEs.

### Msg1

```text
UE A:
    RO = slot 20 / frequency occasion 1
    preamble = 37

UE B:
    RO = slot 20 / frequency occasion 1
    preamble = 37
```

Therefore:

```text
same RA-RNTI
same RAPID
```

### Msg2

The gNB sends:

```text
RAPID = 37
TA = 22
UL Grant = G
TC-RNTI = 0x1234
```

Both UEs accept it.

### Msg3

UE A creates CCCH prefix:

```text
A48 = 10110010 01101101 10101000 11001110 01010110 11100101
```

UE B creates:

```text
B48 = 00101101 11001000 01110101 00110001 10101001 00011010
```

Both transmit on grant G:

```text
UE A Msg3 ───┐
             ├──> gNB
UE B Msg3 ───┘
```

Suppose gNB successfully decodes UE A.

### Msg4

The contention-resolution MAC CE contains:

```text
A48
```

UE A:

```text
received A48 == my A48
→ success
```

UE B:

```text
received A48 != my B48
→ not my contention resolution
→ timer eventually expires / retry path
```

This is why Msg4 is necessary even after both UEs accepted the same RAR.

## 45. What happens after Random Access success?

Random Access success does not mean every core-network and RRC procedure is complete.

For an initial access path, the sequence continues into RRC and NAS establishment, for example:

```text
Random Access success
        ↓
RRCSetup / associated signalling
        ↓
UE obtains dedicated RRC configuration
        ↓
RRCSetupComplete
        ↓
NAS registration / mobility-management signalling as applicable
        ↓
security / bearer establishment / later user-plane operation
```

So keep these concepts separate:

```text
RACH success
    = radio random-access procedure succeeded

RRC connection establishment
    = broader RRC state transition/configuration

5G registration/authentication
    = NAS/core-network procedures
```

## 46. Which layer owns which part?

RACH spans multiple layers.

### RRC

RRC broadcasts/configures much of the common information needed to execute access:

```text
MIB/SIB1-related system information
RACH-ConfigCommon
PDCCH common configuration
other initial-access parameters
```

RRC also creates messages such as `RRCSetupRequest` carried in Msg3 for initial establishment.

### MAC

MAC owns much of the Random Access state machine:

```text
preamble selection procedure
attempt counters
RAR processing
RAPID matching
Temporary C-RNTI handling
backoff
contention-resolution timer
contention-resolution success/failure
```

### PHY

PHY executes the physical transmissions/receptions:

```text
synchronization-raster / SS/PBCH search
PSS/SSS correlation and synchronization
PBCH/PBCH-DMRS processing
PDCCH/PDSCH reception
PRACH generation/detection
PUSCH transmission/reception
Timing Advance application
power-control behavior
```

So RACH is neither "just MAC" nor "just PHY". Initial access is a cross-layer chain involving PHY acquisition, RRC common configuration, MAC Random Access state and PHY execution.

## 47. Common conceptual traps

### Trap 1: "The UE does not know PSS/SSS until the gNB tells it"

Wrong.

The allowed PSS/SSS sequences and their generation are standardized. The UE correlates the received waveform against those known candidates to determine which sequence is present.

### Trap 2: "PSS and SSS span the whole four-symbol SSB"

Wrong.

```text
SSB = 4 OFDM symbols × 240 subcarriers
PSS = symbol 0, subcarriers 56...182
SSS = symbol 2, subcarriers 56...182
PBCH/DM-RS occupy the remaining standardized PBCH resources
```

### Trap 3: "The PCI formula itself explains how the UE discovers the cell"

Incomplete.

First the UE detects \(N_{ID}^{(2)}\) from PSS and \(N_{ID}^{(1)}\) from SSS. **Then** it evaluates:

\[
N_{ID}^{cell}=3N_{ID}^{(1)}+N_{ID}^{(2)}
\]

### Trap 4: "PBCH needs DCI/MCS signalling first"

Wrong.

PBCH is a predefined bootstrap channel with standardized coding, modulation, DM-RS and resource mapping. That is precisely why it can deliver the MIB before initial PDCCH configuration exists.

### Trap 5: "UE gets an UL grant before Msg1"

Wrong for contention-based Msg1.

```text
Msg1 uses configured PRACH opportunities.
Msg3 uses the UL grant inside RAR.
```

### Trap 6: "RA-RNTI identifies the UE"

No. RA-RNTI identifies the PRACH occasion/RAR context. Multiple UEs in the same RO share it.

### Trap 7: "RAPID is the UE identity"

No. RAPID corresponds to the transmitted PRACH preamble index. Two UEs can choose the same preamble.

### Trap 8: "PDCCH carries RAR"

Not directly.

```text
PDCCH carries DCI.
DCI schedules PDSCH.
PDSCH carries the RAR MAC PDU.
```

### Trap 9: "MIB contains all RACH configuration"

No. MIB mainly bootstraps initial control-channel discovery. SIB1/common configuration gives the UE the Random Access configuration.

### Trap 10: "Msg4's 48-bit identity is the 39-bit RRC randomValue padded"

No.

For the initial CCCH-based contention-resolution path:

```text
Msg4 contention identity = first 48 bits of the Msg3 UL CCCH SDU
```

### Trap 11: "Camped means connected"

No. A UE can be camped in idle mode with no active connected-mode scheduling context.

## 48. One compact summary of the entire 4-step procedure

> A UE begins initial access by searching candidate SS/PBCH positions defined by the NR synchronization raster. The PSS and SSS candidate sequences are already defined by 3GPP and implemented in the UE, so the receiver correlates its incoming waveform against the three PSS candidates, obtains \(N_{ID}^{(2)}\) and a synchronization anchor, then correlates against the SSS candidate set to obtain \(N_{ID}^{(1)}\). It derives the PCI as \(N_{ID}^{cell}=3N_{ID}^{(1)}+N_{ID}^{(2)}\). The SS/PBCH block itself is a standardized rectangle of four OFDM symbols and 240 contiguous subcarriers: PSS occupies symbol 0 on subcarriers 56–182, SSS occupies symbol 2 on the same 127 relative subcarriers, and PBCH/PBCH-DMRS occupy their defined resources in symbols 1–3. Because PBCH coding, QPSK modulation, DM-RS and resource mapping are predefined, the UE can decode PBCH without first receiving a dynamic MCS. PBCH gives the MIB; `pdcch-ConfigSIB1` then lets the UE derive CORESET#0/SearchSpace#0, find DCI 1_0 associated with SI-RNTI and decode PDSCH carrying SIB1. SIB1 provides the common PRACH and RAR-monitoring configuration. When Random Access is triggered, the UE chooses an SSB-associated RACH occasion and contention-based preamble and transmits Msg1 without a dedicated UL grant. UE and gNB derive the same RA-RNTI from that PRACH occasion. The UE monitors the configured Type-1 Common Search Space during the RAR response procedure and detects DCI 1_0 associated with that RA-RNTI; the DCI schedules PDSCH carrying the RAR MAC PDU. A RAR entry whose RAPID matches the transmitted preamble gives Timing Advance, the 27-bit Msg3 UL grant and a Temporary C-RNTI. The UE applies TA and transmits Msg3 on scheduled PUSCH, commonly carrying an `RRCSetupRequest` on UL CCCH for initial establishment. If two UEs selected the same RO and the same preamble, both can accept the same RAR and use the same Msg3 grant/TC-RNTI. Msg4 therefore resolves contention: for the initial UL-CCCH path, the UE Contention Resolution Identity MAC CE carries the first 48 bits of the successfully decoded Msg3 UL CCCH SDU. The UE whose stored Msg3 prefix matches succeeds; the other follows the failure/retry procedure.

## 49. The three filters for RAR reception

If only one Random Access memory aid survives, use this:

```text
SearchSpace / CORESET
    ↓
Where and when do I try PDCCH decoding?

RA-RNTI
    ↓
Is this control information for my PRACH occasion?

RAPID
    ↓
Is this RAR entry for the preamble I transmitted?
```

And after that:

```text
TC-RNTI
    ↓
Temporary radio identity while contention is unresolved

first48(Msg3 UL CCCH SDU)
    ↓
Which same-preamble UE actually won contention?
```

## 50. Standards trail

Primary specifications for the procedure:

- **3GPP TS 38.104** — NR RF requirements including the synchronization raster, SSREF/GSCN definitions and band-specific synchronization-raster entries.
- **3GPP TS 38.300** — NR/NG-RAN architecture and overall Random Access context.
- **3GPP TS 38.211** — PSS/SSS generation, the exact 4-symbol × 240-subcarrier SS/PBCH resource map, PBCH DM-RS, PRACH and physical-channel definitions.
- **3GPP TS 38.212** — PBCH/DCI physical-channel coding and CRC/RNTI-related processing.
- **3GPP TS 38.213** — SS/PBCH monitoring context, PDCCH monitoring, common SearchSpaces, Random Access physical-layer procedures and RAR UL-grant interpretation.
- **3GPP TS 38.321** — MAC Random Access procedure, RA-RNTI behavior, RAR processing, RAPID, Backoff Indicator, Temporary C-RNTI, contention-resolution timer and UE Contention Resolution Identity MAC CE.
- **3GPP TS 38.331** — MIB, SIB1, `pdcch-ConfigSIB1`, `PDCCH-ConfigCommon`, SearchSpace and RACH common configuration, plus `RRCSetupRequest` and its initial UE identity.

Useful ETSI publications:

- TS 38.104 Release 18: <https://www.etsi.org/deliver/etsi_ts/138100_138199/138104/18.07.00_60/ts_138104v180700p.pdf>
- TS 38.211 Release 17: <https://www.etsi.org/deliver/etsi_ts/138200_138299/138211/17.08.00_60/ts_138211v170800p.pdf>
- TS 38.331 Release 18: <https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/18.08.00_60/ts_138331v180800p.pdf>
- TS 38.321 Release 18: <https://www.etsi.org/deliver/etsi_ts/138300_138399/138321/18.04.00_60/ts_138321v180400p.pdf>
- TS 38.213 Release 18: <https://www.etsi.org/deliver/etsi_ts/138200_138299/138213/18.05.00_60/ts_138213v180500p.pdf>

The entire initial-access chain can now be read as a staged reduction of uncertainty:

```text
Synchronization raster
    → where can an SSB plausibly be?

PSS correlation
    → which N_ID^(2), and where is the synchronization peak?

SSS correlation
    → which N_ID^(1)?

PCI + standardized SSB structure
    → how do I process PBCH/DM-RS?

PBCH / MIB
    → how do I find initial PDCCH?

PDCCH / SIB1
    → how is this cell, including RACH, configured?

PRACH occasion
    → common entry point for an unscheduled UE

RA-RNTI
    → which RAR context belongs to this RO?

RAPID
    → which RAR entry corresponds to my preamble?

RAR
    → timing + Msg3 grant + temporary identity

Msg3
    → UE-specific signalling content

Msg4
    → which same-preamble UE actually won contention?
```
