---
layout: article
title: "5G NR Random Access in Detail: From SSB and SIB1 to Msg1, RAR, Msg3 and Msg4"
section: 5G NR
section_url: /5G/
description: A complete standards-guided walk through contention-based 4-step NR random access: cell acquisition, MIB and SIB1 bootstrap, CORESET and SearchSpace, PRACH configuration, Msg1, RA-RNTI, RAR monitoring, Timing Advance, Msg3 UL grant, Temporary C-RNTI, contention resolution, collisions, timers and retries.
evidence_type: Standards-guided protocol analysis
reference_basis: 3GPP TS 38.300, TS 38.211, TS 38.212, TS 38.213, TS 38.321 and TS 38.331
last_reviewed: 2026-09-06
mermaid: true
math: true
previous_title: Why QFI and DRB Are Separate
previous_url: /5G/protocol-stack/qfi-vs-drb-sdap.html
---

## 1. The entire journey in one picture

The Random Access procedure is often taught as four messages:

```text
Msg1 → Msg2 → Msg3 → Msg4
```

That is useful, but it hides the most important part of initial access: **the UE cannot transmit Msg1 until it first discovers the cell and learns the common RACH configuration**.

For an initially idle UE, the complete bootstrap is closer to:

```text
UE powers on / searches for a cell
        ↓
SSB
├── PSS
├── SSS
├── PBCH
└── PBCH DM-RS
        ↓
MIB
        ↓
CORESET#0 / SearchSpace#0
        ↓
PDCCH carrying DCI for SIB1
        ↓
PDSCH carrying SIB1
        ↓
cell selection / camping
        ↓
RACH-ConfigCommon + PDCCH common configuration
        ↓
              RANDOM ACCESS STARTS
        ↓
Msg1: PRACH preamble
        ↓
RA-RNTI derived from the PRACH occasion
        ↓
monitor Type-1 PDCCH Common Search Space
        ↓
Msg2: PDCCH DCI 1_0 → PDSCH carrying RAR
        ↓
RAR gives Timing Advance + Msg3 UL Grant + Temporary C-RNTI
        ↓
Msg3: scheduled PUSCH, e.g. RRCSetupRequest on UL CCCH
        ↓
contention-resolution timer
        ↓
Msg4: contention resolution on DL
        ↓
Random Access success
        ↓
RRC establishment continues
```

The important boundary is:

> **SSB → MIB → SIB1 is not itself the four-step RACH procedure. It is the bootstrap that gives the UE enough information to start RACH correctly.**

<div class="technical-callout">
<p><strong>Scope.</strong> This article follows the ordinary <strong>contention-based 4-step Random Access</strong> path for initial access. NR also supports contention-free random access and 2-step random access. Those branches differ in important details and are not the main path here.</p>
</div>

## 2. Why does a UE need Random Access?

Suppose the UE has found a cell and decoded SIB1, but has no active connected-mode radio relationship with the gNB.

Several things are still missing:

```text
gNB does not yet have a normal dedicated scheduling context for this access.

UE does not yet have a new established C-RNTI for this access.

The network needs the UE's uplink arrival timing well enough to align future UL transmissions.

Several idle UEs may attempt access at the same time.

The UE needs a way to obtain an initial scheduled PUSCH opportunity.
```

Random Access therefore solves several problems at once:

1. give an unscheduled UE a standardized uplink entry point;
2. let the gNB detect the UE's PRACH transmission and estimate timing;
3. return a Timing Advance command;
4. provide an initial PUSCH grant for Msg3;
5. assign a temporary radio identity;
6. carry identifying/signalling information in Msg3; and
7. resolve collisions when two UEs selected the same contention-based resource.

Random Access is also used in other situations—loss of UL synchronization, handover-related procedures, beam-failure recovery, PDCCH-order-triggered RA and others—but initial access is the cleanest way to understand the mechanism.

## 3. Before RACH: how does the UE even find the cell?

A newly powered UE does not begin by monitoring arbitrary PDCCHs. It first performs cell search and SS/PBCH acquisition.

An SS/PBCH Block contains:

```text
SSB
├── PSS
├── SSS
├── PBCH
└── PBCH DM-RS
```

At a physical implementation level:

- PSS and SSS are predefined synchronization sequences;
- PSS/SSS processing lets the UE derive synchronization information and the physical cell identity;
- PBCH uses a predefined bootstrap physical format rather than a dynamically selected PDSCH MCS; and
- PBCH carries the MIB together with additional PBCH payload information.

This is why the UE can acquire an SSB even though it does not yet know a PDSCH MCS, a dedicated BWP configuration or a C-RNTI.

The bootstrap order deliberately avoids a circular dependency:

```text
PSS/SSS
  ↓
cell/timing knowledge
  ↓
PBCH
  ↓
MIB
  ↓
initial PDCCH location
  ↓
SIB1
  ↓
fuller common configuration
```

If the UE needed DCI before decoding PBCH, while needing PBCH before finding PDCCH, acquisition would be impossible.

## 4. What PSS and SSS give the UE

The physical cell identity is built from two synchronization-sequence identities:

\[
N_{ID}^{cell} = 3N_{ID}^{(1)} + N_{ID}^{(2)}
\]

where:

```text
N_ID2 ∈ {0,1,2}
N_ID1 ∈ {0,...,335}
```

which produces 1008 physical cell IDs.

Conceptually:

```text
PSS detection
    ↓
N_ID2 + coarse timing/synchronization information

SSS detection
    ↓
N_ID1

combine
    ↓
PCI
```

The PCI is **not a field carried in the MIB**. It is derived from PSS/SSS processing.

Similarly, an SSB index is associated with which SS/PBCH block / beam was detected; it is not simply a normal MIB field.

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

This identifies the common SCS alternative relevant to the common channels. In FR1 the useful interpretation is the 15/30 kHz family; in FR2 it maps to the corresponding 60/120 kHz family.

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

This is the first stage in answering:

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
CORESET    = WHERE PDCCH can physically be mapped
SearchSpace = WHEN and WHICH PDCCH candidates the UE should attempt
RNTI       = WHO / WHICH PROCEDURE the successfully decoded DCI belongs to
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
MIB tells UE where to look for control.
Control tells UE where to receive SIB1.
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

Then:

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

The UE randomly chooses:

```text
PREAMBLE_INDEX = 37
```

This is where the word **contention-based** matters. Another UE can independently choose the same preamble in the same RO.

If that happens, there is no coordination preventing the collision at Msg1.

## 15. Msg1: PRACH has no preceding dynamic UL grant

Suppose the UE needs access at slot 15 and determines:

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

The critical interview distinction is:

```text
Msg1 / PRACH
    no normal dynamic UE-specific UL grant
    resource comes from common RACH configuration

Msg3 / PUSCH
    YES: dynamically scheduled by the UL grant received in the RAR
```

## 16. PRACH transmit power and power ramping

The UE must also determine Msg1 transmit power.

A useful high-level representation is:

\[
P_{PRACH} = \min\left(P_{CMAX}, P_{target} + PL\right)
\]

where:

- \(P_{CMAX}\) is the UE's applicable maximum transmit power;
- \(PL\) is the UE's downlink-based path-loss estimate; and
- \(P_{target}\) represents the configured PRACH target receive-power state including applicable offsets and ramping.

Illustrative example:

```text
configured target receive power = -100 dBm
estimated path loss             = 115 dB

approximate required TX power   = 15 dBm
```

subject to the UE power limit and the exact standardized formula.

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

This was one of the key questions in our discussion.

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

The RNTI does not magically tell the UE the physical location of PDCCH. The SearchSpace does the narrowing; the RNTI validates the procedure/addressing context.

## 20. The RAR response window

After transmitting Msg1, the UE begins the RAR waiting procedure according to `ra-ResponseWindow` and the applicable PDCCH monitoring occasions.

A simplified example:

```text
Msg1 transmitted in slot 20

RAR response interval considered here:
slot 21 ... slot 28

configured Type-1 CSS monitoring occasions:
slot 21
slot 23
slot 25
slot 27
```

Then the UE may conceptually do:

```text
slot 21 → blind-decode configured PDCCH candidates
slot 22 → not a configured monitoring occasion
slot 23 → blind-decode candidates
slot 24 → not a monitoring occasion
slot 25 → try again
slot 27 → try again
```

The exact standard timing is defined in terms of the configured response window and the relevant PDCCH monitoring occasions; the important concept is that the UE is **not blindly decoding every PDCCH resource in every slot**.

## 21. What exactly is the UE looking for on PDCCH?

For the ordinary RAR path, the UE attempts to detect the appropriate **DCI format 1_0 associated with the corresponding RA-RNTI** in the Type-1 PDCCH Common Search Space.

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

This is the key contrast:

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

That distinction should be interview-ready.

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

The gNB may detect one preamble 37 event and send one RAR:

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

This is one of the most subtle parts of the procedure.

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

MAC does not have to parse the RRC meaning of those bits. It simply preserves/compares the first 48 bits of the CCCH SDU as specified for contention resolution.

This is a clean cross-layer contract:

```text
RRC understands the semantic UE identity.
MAC understands the byte/bit sequence it transmitted in Msg3.
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

This is one of the best interview summaries:

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

Assume the UE has acquired:

```text
PCI = 301
selected SSB index = 2
```

It decodes MIB, finds CORESET#0/SearchSpace#0, receives SIB1 and becomes ready for access.

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
SIB1
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
SS/PBCH acquisition
PDCCH/PDSCH reception
PRACH generation/detection
PUSCH transmission/reception
Timing Advance application
power-control behavior
```

So RACH is neither "just MAC" nor "just PHY". It is a cross-layer procedure involving RRC configuration, MAC control state and PHY execution.

## 47. Common interview traps

### Trap 1: "UE gets an UL grant before Msg1"

Wrong for contention-based Msg1.

```text
Msg1 uses configured PRACH opportunities.
Msg3 uses the UL grant inside RAR.
```

### Trap 2: "RA-RNTI identifies the UE"

No.

```text
RA-RNTI identifies the PRACH occasion/RAR context.
```

Multiple UEs in the same RO share it.

### Trap 3: "RAPID is the UE identity"

No.

RAPID corresponds to the transmitted PRACH preamble index. Two UEs can choose the same preamble.

### Trap 4: "PDCCH carries RAR"

Not directly.

```text
PDCCH carries DCI.
DCI schedules PDSCH.
PDSCH carries the RAR MAC PDU.
```

### Trap 5: "MIB contains all RACH configuration"

No.

MIB mainly bootstraps initial control-channel discovery. SIB1/common configuration gives the UE the Random Access configuration.

### Trap 6: "Msg4's 48-bit identity is the 39-bit RRC randomValue padded"

No.

For the initial CCCH-based contention-resolution path:

```text
Msg4 contention identity = first 48 bits of the Msg3 UL CCCH SDU
```

### Trap 7: "Camped means connected"

No.

A UE can be camped in idle mode with no active connected-mode scheduling context.

## 48. One compact interview answer for the entire 4-step procedure

A strong concise answer is:

> "Before contention-based four-step RACH, the UE first acquires SSB, decodes MIB, uses `pdcch-ConfigSIB1` to derive CORESET#0/SearchSpace#0, and receives SIB1. SIB1 gives the common PRACH and RAR-monitoring configuration. When access is triggered, the UE chooses an SSB-associated PRACH occasion and contention-based preamble and transmits Msg1 without a dedicated dynamic UL grant. Both UE and gNB derive the RA-RNTI from that PRACH occasion. During the configured RAR response window, the UE monitors the configured Type-1 Common Search Space and blind-decodes DCI 1_0 associated with that RA-RNTI. The DCI schedules PDSCH carrying the RAR MAC PDU. The UE finds the RAR entry whose RAPID matches its transmitted preamble. That RAR provides Timing Advance, a 27-bit UL grant for Msg3 and a Temporary C-RNTI. The UE applies TA and sends Msg3 on PUSCH using that grant, commonly carrying an RRCSetupRequest for initial establishment. After Msg3 it waits for contention resolution. If two UEs used the same RO and same preamble they may have accepted the same RAR, same grant and same TC-RNTI, so Msg4 resolves the contention. For the initial UL-CCCH path, the UE Contention Resolution Identity MAC CE contains the first 48 bits of the successfully decoded Msg3 UL CCCH SDU. The UE whose stored Msg3 prefix matches succeeds; the other eventually retries."

## 49. The three filters for RAR reception

If only one memory aid survives, use this:

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

- **3GPP TS 38.300** — NR/NG-RAN architecture and overall Random Access context.
- **3GPP TS 38.211** — SS/PBCH, PRACH and physical-channel/resource definitions.
- **3GPP TS 38.212** — physical-channel coding, DCI and CRC/RNTI processing.
- **3GPP TS 38.213** — PDCCH monitoring, common SearchSpaces, Random Access physical-layer procedures and RAR UL-grant interpretation.
- **3GPP TS 38.321** — MAC Random Access procedure, RA-RNTI-related behavior, RAR processing, RAPID, Backoff Indicator, Temporary C-RNTI, contention-resolution timer and UE Contention Resolution Identity MAC CE.
- **3GPP TS 38.331** — MIB, SIB1, `pdcch-ConfigSIB1`, `PDCCH-ConfigCommon`, SearchSpace and RACH common configuration, plus `RRCSetupRequest` and its initial UE identity.

Useful ETSI publications:

- TS 38.331 Release 18: <https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/18.08.00_60/ts_138331v180800p.pdf>
- TS 38.321 Release 18: <https://www.etsi.org/deliver/etsi_ts/138300_138399/138321/18.04.00_60/ts_138321v180400p.pdf>
- TS 38.213 Release 18: <https://www.etsi.org/deliver/etsi_ts/138200_138299/138213/18.05.00_60/ts_138213v180500p.pdf>

The central design idea is that NR initial access is a staged reduction of uncertainty:

```text
SSB tells the UE which cell it found.
MIB tells it how to find initial control.
SIB1 tells it how to attempt Random Access.
PRACH occasion gives both sides an RA-RNTI context.
RAPID selects the preamble response.
RAR supplies timing, a Msg3 grant and a temporary identity.
Msg3 supplies UE-specific signalling content.
Msg4 finally resolves same-preamble contention.
```
