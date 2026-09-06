---
layout: article
title: NR-NTN Timing Advance — From SIB19 Epoch to gNB
section: NR NTN
section_url: /NTN/
description: A numerical explanation of transparent payloads, the uplink synchronization reference point, current SFN acquisition, future epoch time, Common TA, service-link compensation and random access through a moving satellite.
evidence_type: Standards-guided numerical analysis
reference_basis: 3GPP Release 17
last_reviewed: 2026-09-06
math: true
body_class: ntn-epoch-page
mermaid: true
previous_title: NR NTN — From Satellite State to Radio Link
previous_url: /NTN/nr-ntn.html
next_title: LEO Orbits, Beams and Elevation
next_url: /NTN/leo-orbits-beams-and-elevation.html
---

## 1. The three statements to remember

NR-NTN timing becomes much easier once three terms are kept separate:

1. **The UE calculates the satellite-to-UE service-link RTT** from its GNSS position and the satellite ephemeris.
2. **The network broadcasts Common TA, which is the RTT between the uplink synchronization reference point (RP) and the satellite payload.**
3. **The UE advances its uplink by the service-link RTT plus Common TA**, with ordinary NR TA corrections and fixed offsets added when applicable.

In the simplified time domain,

\\[
T_{TA}\approx RTT_{UE\leftrightarrow satellite}
          +RTT_{satellite\leftrightarrow RP}
          +T_{residual}
          +T_{fixed}.
\\]

`k_mac` is not another propagation term added to the transmitted waveform. It describes the timing relationship between the RP and gNB when they are not colocated.

<div class="technical-callout">
<p><strong>Direct definition:</strong> Common TA is the configured timing offset equal to the RTT between the UL synchronization RP and the NTN payload. The service-link term is calculated separately by each UE.</p>
</div>

## 2. Transparent and regenerative payloads

### 2.1 Transparent payload

A transparent, or bent-pipe, payload does not terminate the NR protocol stack. It can filter, amplify, frequency-convert and route the radio waveform between beams, but it does not decode a UE's MAC PDU and create a new NR transmission.

<div class="mermaid">
flowchart LR
    UE[UE] -->|Service link| SAT[Transparent payload]
    SAT -->|Feeder link| GW[NTN gateway]
    GW --> GNB[Ground gNB]
</div>

The waveform is not literally bit-for-bit identical after the satellite: carrier frequency, power, noise, delay and Doppler can change. The important architectural point is that the satellite is not the NR protocol endpoint; the ground gNB remains the endpoint.

### 2.2 Regenerative payload

A regenerative payload terminates some or all radio functions on board. A complete onboard gNB, or a split gNB architecture, can decode and regenerate transmissions before forwarding traffic toward the ground network.

| Payload | Onboard NR decoding | Main benefit | Main cost |
|---|---:|---|---|
| Transparent | No | Simpler spacecraft; ground software is easier to upgrade | Feeder delay and gateway continuity remain in the radio path |
| Regenerative | Yes, for the functions placed onboard | Shorter control loop for onboard functions; possible onboard routing | Space-qualified compute, power, thermal management and upgrade complexity |

The timing examples below use a transparent payload.

## 3. The reference point splits radio alignment from gNB timing

Consider this topology:

<div class="mermaid">
flowchart LR
    GNB[gNB] -->|1 ms| RP[UL synchronization RP]
    RP -->|1 ms| SAT[Satellite]
    SAT -->|2 ms| UE[UE]
</div>

The one-way delays are:

| Segment | One-way delay | Corresponding RTT |
|---|---:|---:|
| gNB ↔ RP | 1 ms | 2 ms |
| RP ↔ satellite | 1 ms | 2 ms |
| Satellite ↔ UE | 2 ms | 4 ms |

Therefore:

\\[
TA_{common}=RTT_{RP\leftrightarrow satellite}=2\text{ ms},
\\]

\\[
TA_{UE}=RTT_{satellite\leftrightarrow UE}=4\text{ ms},
\\]

\\[
T_{TA}=TA_{common}+TA_{UE}=6\text{ ms}.
\\]

The RP-to-gNB RTT is approximately 2 ms, so the network may configure

\\[
k_{mac}\approx 2\text{ ms}.
\\]

The purpose of \\(k_{mac}\\) is to repair protocol timing when the DL and UL frames are aligned at the RP but not at the gNB. It is used, for example, in NTN random-access response-window timing and MAC-command application timing. It is not added to the 6 ms radio timing advance.

## 4. How the UE knows the current SFN before reading SIB19

An SS/PBCH block contains PSS, SSS and PBCH:

- PSS and SSS provide initial synchronization and physical cell identity;
- PBCH carries the MIB plus additional physical-layer timing bits;
- the MIB provides 6 MSBs of the 10-bit System Frame Number;
- four additional PBCH payload bits provide the remaining SFN LSBs.

Suppose the current SFN is decimal 99:

\\[
99_{10}=0001100011_2.
\\]

The UE obtains:

```text
MIB systemFrameNumber = 000110    (6 MSBs)
Additional PBCH bits  = 0011      (4 LSBs)
Full SFN              = 0001100011 = 99
```

The half-frame indication, detected SS/PBCH candidate position and known SSB timing pattern establish the position inside the radio frame. The UE then maintains counters such as:

```text
SFN 99:  sf0 sf1 sf2 sf3 sf4 sf5 sf6 sf7 sf8 sf9
SFN 100: sf0 sf1 sf2 sf3 sf4 sf5 sf6 sf7 sf8 sf9
```

Every subframe is 1 ms and every frame is 10 ms. SFN increments modulo 1024. The UE tracks wraparounds after acquisition.

By the time it receives SIB19 on PDSCH, the UE already knows the SFN and subframe in which that SIB19 instance was received.

<h2 id="epoch-clock-mapping">5. How does an SFN epoch become seconds before or after now?</h2>

The UE already has a running radio clock from SSB/PBCH acquisition. `epochTime` names a boundary on that clock. It contains `sfn-r17` (0–1023) and `subFrameNR-r17` (0–9), identifying the **start of a downlink subframe at the uplink synchronization reference point (RP)**. It is not UTC or a count of seconds since a global epoch.

The normative anchor is the `epochTime` description under **NTN-Config in TS 38.331 §6.3.2**; the precise [Release 17 edition is linked here](https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/17.10.00_60/ts_138331v171000p.pdf). The clock examples below are independent engineering explanations of that reference-point definition.

### 5.1 First associate received radio time with a local clock

Synchronization supplies timing boundaries, PBCH provides the SFN context, and the modem tracks the frame/subframe sequence with its local clock and ongoing synchronization. An illustrative association is:

| Received boundary | Local hardware timestamp |
|---|---:|
| SFN 100 / subframe 0 | 50.000 s |
| SFN 100 / subframe 1 | 50.001 s |
| SFN 100 / subframe 7 | 50.007 s |
| SFN 101 / subframe 0 | 50.010 s |

The clock origin is arbitrary; these could be seconds since a modem counter started. UTC is unnecessary just to calculate a difference between two consistently referenced instants.

Suppose the current received timing is SFN 100/subframe 7, and SIB19 identifies epoch SFN 102/subframe 3. Ignoring wraparound for now:

\\[
\delta_{received}=(102-100)\times10+(3-7)=16\text{ ms}.
\\]

The corresponding epoch-labelled boundary will be received at approximately 50.023 s. If the current instant is partway through a subframe, include that measured fractional-subframe time too; the epoch itself identifies the start of its subframe.

### 5.2 The received boundary and the epoch at the RP are different events

Assume a constant one-way RP-to-UE propagation delay of 6 ms. This is a teaching approximation; actual geometry changes with time.

If the epoch-labelled boundary is received at local timestamp 50.023 s, the same boundary occurs at the RP approximately at:

\\[
t_{epoch,RP}\approx50.023-0.006=50.017\text{ s}.
\\]

At local time 50.007 s, the physical epoch is therefore 10 ms ahead at the RP, although its corresponding received boundary is 16 ms ahead.

| Question | Answer in this example |
|---|---:|
| When will the UE receive the epoch-labelled boundary? | 16 ms from now |
| When does that epoch occur at the RP? | Approximately 10 ms from now |

Expressing both events in the same local-clock coordinate gives:

\\[
t_{now}-t_{epoch,RP}\approx t_{now}-t_{epoch,received}+\tau_{RP\rightarrow UE}.
\\]

This is the physical elapsed-time interpretation for evaluating state at the current instant in this simplified model. **Subtracting SFN labels alone gives a difference on the received downlink timeline, not automatically the physical age of the satellite state.** Propagation preserves the frame label while delaying its observation.

The one-way delay estimate uses the service-link geometry and common-delay assistance. In a pure-delay reciprocal example it is half the autonomous NTN round-trip contribution. Do not blindly divide total commanded TA plus K_mac by two: fixed/calibrated offsets and the RP-to-gNB timing relationship must be distinguished. A real implementation uses a consistent event-time model for changing geometry and for the transmission/reception instant it needs to predict.

### 5.3 An epoch can already be in the past

Keep the current received timing at SFN 100/subframe 7, but let the epoch be SFN 100/subframe 2. Its corresponding received boundary was 5 ms ago. With the same illustrative 6 ms one-way delay, the epoch at the RP was approximately 11 ms ago:

\\[
\Delta t\approx(7-2)\text{ ms}+6\text{ ms}=0.011\text{ s}.
\\]

A model evaluated at the current physical instant uses that elapsed time in this example. Its sign means that the state is propagated forward from the epoch. For an epoch still physically ahead, the elapsed time is negative; mathematical extrapolation does not by itself establish that a particular assistance set is applicable before its configured epoch/validity interval.

### 5.4 How the UE resolves SFN wraparound

SFN repeats every 1024 frames, or 10.24 seconds. The number alone cannot distinguish successive occurrences.

For serving-cell assistance, TS 38.331 identifies the current occurrence when the signalled SFN is current, or the next upcoming occurrence of the indicated SFN after the reception frame. This does not mean the field must always be the immediately following frame number. Neighbour and target-cell occurrence rules differ and must not be replaced with this serving-cell rule.

For current received timing SFN 1022/subframe 8 and serving epoch SFN 1/subframe 3, the forward difference across wrap is:

\\[
\delta_{received}=\left[(10\times1+3)-(10\times1022+8)\right]\bmod10240=25\text{ ms}.
\\]

| Segment | Duration |
|---|---:|
| SFN 1022/subframe 8 to SFN 1023/subframe 0 | 2 ms |
| SFN 1023 | 10 ms |
| SFN 0 | 10 ms |
| SFN 1/subframe 0 to subframe 3 | 3 ms |
| Total | 25 ms |

Do not apply a positive modulo blindly to every subframe difference: an epoch in the current frame can be earlier than the current subframe, as in section 5.3.

After selecting the correct occurrence, an implementation can store an unwrapped local epoch timestamp and count elapsed time across subsequent SFN wraps. It should not reinterpret stored assistance as newly future every 10.24 seconds. Counter tracking does not extend assistance validity.

### 5.5 A future-epoch example using the earlier article's values

Suppose SIB19 is received in SFN 90/subframe 2 and identifies SFN 100/subframe 0. Its corresponding received boundary is:

\\[
(100-90)\times10+(0-2)=98\text{ ms}
\\]

ahead on the received radio timeline. With a constant 3 ms RP-to-UE delay, its physical epoch at the RP is approximately 95 ms ahead. The network need not know which UE will decode SIB19: it publishes a common model at a named RP boundary, and each UE relates that boundary to its own received timing and path.

### 5.6 Omitted epochs, assistance refresh and vendor responsibility

For serving-cell broadcast assistance, if the explicit epoch is absent, TS 38.331 uses the end of the SI window in which SIB19 is scheduled. An explicit epoch is mandatory for dedicated NTN configuration. The validity duration is measured from epoch; obtaining or reusing the same SFN label later does not renew it.

The SFN/subframe meaning, occurrence rule, reference point and validity behavior are standardized. Internal clock-counter representation, timestamp storage and numerical implementation are vendor choices. Ephemeris, epoch and common-TA updates have specific SI change-notification exceptions, so ordinary value-tag changes alone are not a sufficient freshness mechanism.

For the surrounding SSB → SIB1 → SIB19 → Msg1–Msg4 sequence, see [NR NTN Random Access](/NTN/nr-ntn-random-access.html).

## 6. Understanding the Common TA polynomial

3GPP expresses the one-way RP-to-satellite delay using the decoded SIB19 parameters:

\\[
d_{common}(t)=
\frac{TA_{common,0}}{2}
+\frac{D}{2}\Delta t
+\frac{V}{2}\Delta t^2,
\\]

or equivalently,

\\[
d_{common}(t)=
\frac{TA_{common,0}+D\Delta t+V\Delta t^2}{2}.
\\]

| Term | Meaning | Unit |
|---|---|---:|
| \\(TA_{common,0}\\) | RP↔satellite RTT at epoch | µs |
| \\(D\\) | rate of change of Common RTT | µs/s |
| \\(V\\) | quadratic drift coefficient | µs/s² |
| \\(\Delta t=t-t_{epoch}\\) | elapsed time relative to epoch | s |
| \\(d_{common}(t)\\) | current one-way RP→satellite delay | µs |

The units explain the equation:

\\[
(\mu s/s)(s)=\mu s,
\qquad
(\mu s/s^2)(s^2)=\mu s.
\\]

The division by two exists because the broadcast Common TA terms describe an RTT while \\(d_{common}\\) is one-way delay. The quadratic coefficient is applied exactly as signalled; an additional \\(1/2\\) from a textbook acceleration Taylor series must not be inserted.

### 6.1 Numerical epoch and drift example

Assume the decoded assistance is:

```text
epochTime                  = SFN 100 / subframe 0
ntn-UlSyncValidityDuration = 10 s
TA_common,0                = 2000 µs
D                          = +4 µs/s
V                          = +0.02 µs/s²
```

At epoch, \\(\Delta t=0\\):

\\[
d_{common}(t_{epoch})=\frac{2000}{2}=1000\ \mu s.
\\]

Five seconds later **on the RP-referenced timeline**, the frame is SFN 600/subframe 0. The following arithmetic assumes that the event time has already been mapped to that reference; it is not a claim that a UE receiving the same label observes the RP simultaneously:

\\[
\Delta t=(600-100)\times10\text{ ms}=5\text{ s}.
\\]

Then

\\[
d_{common}(t)=
\frac{2000+4(5)+0.02(5^2)}{2}
=\frac{2020.5}{2}
=1010.25\ \mu s.
\\]

The current Common TA RTT is therefore 2020.5 µs.

A negative elapsed time can be inserted mathematically into the polynomial, but this alone does not establish pre-epoch applicability. Use a consistent RP-referenced event time and applicable assistance; section 5 distinguishes received-label differences from physical epoch differences.

### 6.2 RRC field encoding example

TS 38.331 defines these RRC granularities:

| Field | Raw value | Granularity | Decoded value |
|---|---:|---:|---:|
| `ta-Common` | 491159 | 0.004072 µs | 1999.999448 µs |
| `ta-CommonDrift` | 20000 | 0.0002 µs/s | 4 µs/s |
| `ta-CommonDriftVariant` | 1000 | 0.00002 µs/s² | 0.02 µs/s² |

The numbers used above round the first decoded value to 2000 µs for readability.

## 7. The same epoch timestamps satellite position

The UE also treats the broadcast satellite state as valid at `epochTime`. In a one-dimensional teaching example, suppose the satellite-to-UE range and relative radial velocity at epoch are

\\[
R_0=599{,}584.916\text{ m},
\qquad v_r=-1000\text{ m/s}.
\\]

The minus sign means closing range. At epoch,

\\[
d_{service}(t_0)=\frac{R_0}{c}=2\text{ ms},
\\]

so the service-link RTT is 4 ms.

After five seconds, using a constant-radial-velocity approximation,

\\[
R(5)=599{,}584.916-1000(5)=594{,}584.916\text{ m},
\\]

\\[
d_{service}(5)=\frac{594{,}584.916}{299{,}792{,}458}
=1.983321795\text{ ms}.
\\]

The service-link RTT becomes

\\[
TA_{UE}(5)=3.966643590\text{ ms}.
\\]

Combining it with the time-updated Common TA,

\\[
T_{TA}(5)=3.966643590+2.0205
=5.987143590\text{ ms}.
\\]

A real implementation propagates the full three-dimensional state and computes

\\[
R(t)=\|\mathbf r_s(t)-\mathbf r_u(t)\|,
\\]

rather than assuming one constant radial velocity.

## 8. Why the UE advances by RTT although DL is delayed only one way

Return to the clean snapshot:

```text
RP → satellite = 1 ms one way
satellite → UE = 2 ms one way
RP → UE        = 3 ms one way
Total NTN TA   = 6 ms
```

Let DL frame 100 cross the RP at \\(t=0\\). It reaches the UE at \\(t=3\\) ms but still carries SFN 100.

The UE positions the corresponding UL frame 6 ms before the received DL-frame boundary:

\\[
t_{UE,TX}=3-6=-3\text{ ms}.
\\]

The UL then takes 3 ms to travel back:

\\[
-3+3=0\text{ ms}.
\\]

<div class="mermaid">
sequenceDiagram
    participant RP as Sync RP
    participant SAT as Satellite
    participant UE as UE
    RP->>SAT: DL frame 100 at t=0
    SAT->>UE: Arrives at t=3 ms
    UE-->>SAT: UL frame 100 sent at t=-3 ms
    SAT-->>RP: Arrives at t=0
</div>

Thus UL and DL are frame-aligned at the RP. If the UE used only the 4 ms service RTT, the UL would reach the RP 2 ms late—the missing quantity would be Common TA.

The negative time is a steady-state timing proof. A UE performing initial acquisition cannot transmit in the past; after decoding MIB and SIB19 it chooses a future PRACH occasion and applies the same advance to that future occasion.

## 9. Complete numerical random-access trace

This trace adds a small deterministic residual delay to show why the RAR timing-advance command still exists.

### 9.1 Assistance known before Msg1

The UE has acquired:

```text
Service-link RTT from UE position + ephemeris = 4.000000 ms
Common TA from SIB19                           = 2.000000 ms
Initial autonomous NTN advance                = 6.000000 ms
k_mac                                          = 2 ms
```

Assume the real RP-to-UE path also contains 1.5625 µs of fixed group delay in each direction that was not included in Common TA. The actual one-way delay is

\\[
3\text{ ms}+1.5625\ \mu s=3.0015625\text{ ms}.
\\]

The required RTT advance is therefore

\\[
2(3.0015625)=6.003125\text{ ms}.
\\]

### 9.2 Msg1 arrives slightly late

Using only the initial 6 ms advance, Msg1 reaches the RP

\\[
6.003125-6.000000=3.125\ \mu s
\\]

late. Because RP-to-gNB is 1 ms one way, the gNB observes Msg1 at approximately

\\[
1.003125\text{ ms}
\\]

relative to the expected RP frame boundary.

### 9.3 gNB detects PRACH and sends RAR

The exact baseband processing time is implementation-dependent. For this example, assume the gNB needs 1 ms after detection:

```text
Msg1 reaches gNB:       1.003125 ms
Illustrative processing: 1.000000 ms
RAR starts at gNB:      2.003125 ms
```

The physical gNB-to-UE delay is

\\[
1\text{ ms gNB→RP}+1\text{ ms RP→satellite}
+2\text{ ms satellite→UE}+1.5625\ \mu s
=4.0015625\text{ ms}.
\\]

So the UE receives the RAR at

\\[
2.003125+4.0015625=6.0046875\text{ ms}.
\\]

For NTN, the RAR/MsgB response-window timing includes the additional \\(T_{TA}+k_{mac}\\) relationship. In this example,

\\[
T_{TA}+k_{mac}=6+2=8\text{ ms},
\\]

which gives the window enough delay to cover the long path.

### 9.4 RAR corrects the residual

For 15 kHz SCS, one RAR TA step is

\\[
1024T_c=0.520833333\ \mu s,
\\]

where

\\[
T_c=\frac{1}{480000\times4096}=0.508626302\text{ ns}.
\\]

The required residual is exactly six steps:

\\[
6\times0.520833333=3.125\ \mu s.
\\]

The RAR can therefore carry TA command 6. The updated total advance is

\\[
6.000000+0.003125=6.003125\text{ ms}.
\\]

### 9.5 Msg3 reaches the RP exactly

Choose a future RP UL boundary at 20 ms. The corresponding DL boundary reaches the UE at

\\[
20+3.0015625=23.0015625\text{ ms}.
\\]

The UE transmits Msg3 at

\\[
23.0015625-6.003125=16.9984375\text{ ms}.
\\]

After one-way propagation,

\\[
16.9984375+3.0015625=20.0000000\text{ ms}.
\\]

Msg3 is aligned exactly at the RP and reaches the gNB at 21 ms. With another illustrative 1 ms gNB processing interval, Msg4 begins at 22 ms and reaches the UE at

\\[
22+4.0015625=26.0015625\text{ ms}.
\\]

This separates the functions cleanly:

- ephemeris plus GNSS remove the large UE-specific service delay;
- SIB19 Common TA removes the large RP-to-satellite delay;
- RAR/MAC TA commands remove residual timing error measured by the gNB.

## 10. What Common TA may and may not include

The primary meaning is RP-to-satellite RTT. TS 38.331 also allows the network-controlled value to include timing offsets the network considers necessary. A deployment can therefore absorb deterministic common effects such as calibrated gateway, RF-chain or payload group delay into Common TA.

Common TA is not intended to model variable packet scheduling, queueing or software-processing latency. Those do not represent a stable propagation alignment shared by all UEs.

| Quantity | Main owner | Purpose |
|---|---|---|
| `ta-Common`, drift, variant | Network NTN timing/configuration | RP↔satellite RTT model and common deterministic offset |
| UE-specific autonomous term | UE PHY using GNSS + ephemeris | Satellite↔UE RTT |
| RAR/MAC TA command | gNB measurement + MAC control | Residual UL arrival error |
| `cellSpecificKoffset` | Network scheduler/RRC | Provide enough scheduling separation for the long NTN path |
| `k_mac` | Network timing configuration | Account for RP↔gNB timing relationship in specified procedures |
| `N_TA,offset` | NR band/duplex configuration | Fixed NR timing offset |

## 11. Where can the synchronization RP be placed?

Under the Release 17 decomposition, the UE-specific term already represents the full satellite↔UE RTT. Common TA is non-negative and adds the satellite↔RP RTT.

| RP placement | Common TA | Total autonomous NTN component |
|---|---:|---:|
| At satellite payload | 0 | Service-link RTT |
| Part-way through feeder path | RTT from that point to satellite | Service RTT + partial feeder RTT |
| At gateway/gNB timing point | Full feeder RTT | Service RTT + full feeder RTT |

A hypothetical RP placed inside the satellite-to-UE service link would require less than the full service-link RTT. That cannot be represented by adding a non-negative Common TA to a UE-specific term that already compensates the complete service RTT. It is therefore not a supported interpretation of this Release 17 timing decomposition.

The RP is generally a logical timing location, not necessarily a box that a packet physically enters. Network timing design determines where UL and DL frames are considered aligned.

## 12. gNB implementation view

The gNB is not one monolithic block “deciding TA.” A practical division is:

1. **NTN control/O&M input** supplies satellite trajectory, gateway schedule/location and calibrated path information.
2. **NTN timing service** selects an epoch and predicts Common TA, drift and drift variant.
3. **RRC system-information generation** encodes the assistance in SIB19.
4. **DU system-information scheduling** broadcasts the applicable SIB19 instance in known PDSCH occasions.
5. **PRACH receiver** detects Msg1 and estimates arrival-time error relative to the expected RP-aligned occasion.
6. **MAC random-access controller** converts residual error into the RAR TA command and schedules the Msg3 grant.
7. **UL PHY/MAC timing tracking** measures later PUSCH/PUCCH/SRS arrival and uses MAC TA commands when additional correction is required.

The UE never needs the RP coordinates. It needs:

- its own position;
- the satellite ephemeris and epoch;
- the network-provided Common TA model;
- its continuously tracked NR frame time.

## 13. Compact interview answer

> In transparent NR-NTN, the UE derives the two-way service-link delay from its GNSS position and the SIB19 satellite ephemeris. The network broadcasts Common TA, which represents the RTT from the UL synchronization RP to the satellite payload and may include calibrated common offsets. Both are referenced to SIB19 epoch time, which is an NR SFN/subframe boundary and can be in the future. The UE tracks the current SFN from PBCH, evolves the ephemeris and Common TA coefficients by the elapsed time from epoch, and advances a future PRACH/PUSCH/PUCCH/SRS transmission by the resulting UE-to-RP RTT. The gNB then removes residual arrival error through RAR or MAC TA commands. `k_mac` accounts for RP-to-gNB procedure timing; it is not another waveform TA component.

## 14. References

1. ETSI / 3GPP TS 38.300, [NR and NG-RAN overall description, clauses 16.14.1–16.14.2](https://www.etsi.org/deliver/etsi_ts/138300_138399/138300/17.08.00_60/ts_138300v170800p.pdf).
2. ETSI / 3GPP TS 38.331, [NR RRC protocol: MIB, SIB19 and NTN-Config](https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/17.13.00_60/ts_138331v171300p.pdf).
3. ETSI / 3GPP TS 38.213, [NR physical-layer control procedures, clause 4.2](https://www.etsi.org/deliver/etsi_ts/138200_138299/138213/17.10.00_60/ts_138213v171000p.pdf).
4. ETSI / 3GPP TS 38.211, [NR physical channels and modulation, clause 4.3.1](https://www.etsi.org/deliver/etsi_ts/138200_138299/138211/17.06.00_60/ts_138211v170600p.pdf).
5. ETSI / 3GPP TS 38.212, [NR multiplexing and channel coding, PBCH payload generation](https://www.etsi.org/deliver/etsi_ts/138200_138299/138212/16.08.00_60/ts_138212v160800p.pdf).
