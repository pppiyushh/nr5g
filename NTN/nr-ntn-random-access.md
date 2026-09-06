---
layout: article
title: "NR NTN Random Access: From Doppler-Shifted SSB to SIB19 and Msg1–Msg4"
section: NR NTN
section_url: /NTN/
description: A detailed Release 17 walkthrough of initial SSB acquisition, SIB19 discovery, epoch interpretation, timing advance, Doppler pre-compensation, NTN scheduling and contention resolution, with numerical examples and standards-versus-vendor boundaries.
evidence_type: Standards-guided protocol analysis
reference_basis: 3GPP Release 17; TS 38.211, 38.213, 38.214, 38.300, 38.321, 38.331 and 38.101-5
last_reviewed: 2026-09-06
math: true
mermaid: true
body_class: ntn-rach-page
previous_title: NR Random Access — SSB to Msg4
previous_url: /5G/protocol-stack/nr-rach-msg3-msg4-contention-resolution.html
next_title: SIB19, Epoch Time and Timing Advance
next_url: /NTN/timing-advance-and-epoch-time.html
---

## 1. What changes when random access crosses a satellite?

The central difference is that **the UE prepares uplink timing and frequency before transmitting Msg1**. The Random Access Response (RAR) subsequently supplies the network-commanded timing component, a Msg3 grant and a temporary identity.

This article uses **Release 17 NR NTN, a transparent satellite payload, FR1 and four-step contention-based random access** as its baseline. The satellite relays the radio waveform; the gNB is on the ground. NR NTN must not be confused with NB-IoT NTN, whose physical channels and specifications differ.

Read the [terrestrial NR random-access walkthrough](/5G/protocol-stack/nr-rach-msg3-msg4-contention-resolution.html) for the exact SSB resource map and the underlying RA-RNTI, RAPID and contention-resolution mechanisms. Here we retain that sequence and explain the satellite-specific preparation and timing. The [epoch and timing article](/NTN/timing-advance-and-epoch-time.html#epoch-clock-mapping) expands the radio-clock mapping in detail.

All numerical values below are teaching examples. A receiver algorithm described as an implementation possibility is not a mandated 3GPP algorithm. Standards references are collected in [section 24](#standards-trail).

## 2. Start with the signal path and propagation budget

The **service link** connects UE and satellite. The **feeder link** connects satellite and gateway. The transparent payload forwards the waveform between these links, potentially changing its carrier frequency; the ground gNB terminates the NR radio protocol. [1]

For a snapshot, assume:

| Quantity | Illustrative value |
|---|---:|
| UE–satellite slant range | 900 km |
| Satellite–gateway slant range | 1,200 km |
| Rounded speed of light | 300,000 km/s |
| Service-link one-way delay | 3 ms |
| Feeder-link one-way delay | 4 ms |
| UE–gNB one-way delay | 7 ms |
| UE–gNB propagation RTT | 14 ms |

The gateway and gNB are treated as colocated. Equipment and additional transport delays are omitted. Satellite motion is frozen only for this propagation-budget example.

Msg1 takes approximately 7 ms to reach the gNB. Even an immediate response needs another 7 ms to return. This produces two different requirements: advance the uplink waveform so it arrives at the intended boundary, and allow sufficient time for grants and responses to travel.

## 3. The complete access sequence and message contents

<div class="mermaid">
flowchart TD
    A["SSB: PSS, SSS, PBCH and PBCH DM-RS"] --> B["PBCH/MIB: radio timing and initial PDCCH configuration"]
    B --> C["SIB1: cell access, PRACH configuration and SI scheduling"]
    C --> D["SIB19: ephemeris, epoch, common TA and scheduling offsets"]
    G["Valid UE position and time tracking"] --> E{"Valid assistance and position?"}
    D --> E
    E -->|No| F["Acquire or refresh required information"]
    F --> E
    E -->|Yes| H["Predict UL timing and service-link Doppler"]
    H --> I["Msg1: pre-compensated PRACH preamble"]
    I --> J["Msg2: RAR with RAPID, TA command, UL grant and TC-RNTI"]
    J --> K["Msg3: PUSCH carrying UL CCCH, commonly RRCSetupRequest"]
    K --> L["Msg4: contention-resolution identity; RRCSetup as applicable"]
    L --> M{"Identity matches?"}
    M -->|Yes| N["RA success; RRC establishment continues"]
    M -->|No success before expiry| O["Failure and retry procedure"]
</div>

SSB and system-information acquisition precede the four RA messages; they are not additional numbered RACH messages. PDCCH schedules the PDSCH carrying SIB1, SIB19, RAR or Msg4; it does not itself carry those payloads.

| Stage | What the UE gains |
|---|---|
| PSS/SSS | Synchronization anchors and physical cell identity |
| PBCH/MIB | SFN context and bootstrap control-channel configuration |
| SIB1 | Access rules, common radio configuration and SI scheduling |
| SIB19 | Time-referenced NTN assistance |
| Msg1 | A preamble detection opportunity at the network |
| Msg2 | Timing command, Msg3 resources and temporary identity |
| Msg3 | UE-specific request content for the network to decode |
| Msg4 | Resolution of ambiguity between contenders |

## 4. How can the UE receive SSB before it knows the satellite Doppler?

The apparent circular dependency is: ephemeris is in SIB19, but receiving SIB19 requires acquiring the downlink first. The way out is that **frequency error can be estimated from a received known waveform without first knowing its physical cause**.

An orbit model predicts Doppler from motion. A receiver can instead test which frequency correction makes a known synchronization waveform detectable. SSB structure and sequence generation are standardized; the detailed acquisition algorithm is vendor-specific. [2]

Consider the simplified signal model:

\\[
r(t)=h\,s(t-\tau)e^{j2\pi f_{err}t}+w(t).
\\]

Here \\(\tau\\) is unknown arrival time, \\(f_{err}\\) is the combined frequency error, \\(h\\) is channel gain and phase, and \\(w(t)\\) is noise. A possible receiver searches over candidate identity, timing and frequency:

\\[
C(i,\tau,f_h)=\left|\sum_n r[n]s_i^*[n-\tau]e^{-j2\pi f_h nT_s}\right|^2.
\\]

In this expression, \\(s_i[n]\\) is a **time-domain PSS reference waveform**. It must not be confused with simply treating the 127 frequency-domain PSS sequence elements as raw ADC samples.

For a received offset of +43 kHz:

| Applied correction | Remaining frequency error | Interpretation |
|---|---:|---|
| 0 kHz | +43 kHz | Large mismatch |
| −30 kHz | +13 kHz | Smaller mismatch |
| −40 kHz | +3 kHz | Promising coarse hypothesis |
| −43 kHz | Approximately zero | Best correction in this simplified model |

After a promising hypothesis, finer estimation and tracking can support SSS/PBCH decoding and later PDCCH/PDSCH reception. The table demonstrates a mechanism; it is neither a standardized search grid nor a guaranteed acquisition range for every compliant UE.

## 5. What is standardized, and what belongs to the vendor?

| Subject | Standards boundary | Implementation choice |
|---|---|---|
| Initial SSB acquisition | Known signals, resource mapping and applicable reception requirements | Search order, hypothesis spacing, thresholds, correlators and tracking loops |
| Uplink NTN synchronization | Required timing and service-link Doppler pre-compensation using valid assistance and position | Numerical implementation, efficient prediction and interpolation |
| Uplink frequency accuracy | Measurable RF accuracy requirement | Estimator, oscillator control and digital correction architecture |
| Feeder-link Doppler/transponder error | Management assigned to network implementation | Network compensation strategy |
| SIB19 discovery and RACH timing | RRC/MAC/PHY procedures and parameter semantics | Internal software partitioning |

TS 38.300 §16.14.2.2 requires valid GNSS position, ephemeris and common TA for the Release 17 uplink baseline, with autonomous timing and service-link Doppler pre-compensation. It explicitly assigns feeder-link Doppler and transponder frequency-error management to network implementation. [1]

As one output constraint, TS 38.101-5 v17.10.0 §6.4.1 specifies ±0.1 ppm uplink frequency accuracy relative to the ideally pre-compensated reference, under its stated measurement conditions. At 2 GHz this corresponds to ±200 Hz. This is **not an SSB acquisition search-range requirement**. Annex A.4 also uses zero Doppler for several receiver/performance tests, so those tests must not be cited as proof that every UE acquires an arbitrary large downlink offset. [7]

## 6. Initial downlink frequency error is not pure service-link Doppler

A useful engineering decomposition is:

\\[
f_{err,DL}=f_{service,Doppler}+f_{residual,network}+f_{oscillator}.
\\]

The receiver initially sees their combined effect. Feeder compensation and frequency translation can affect the residual network term.

One possible network strategy reduces Doppler at a selected beam reference location. If that location has +40 kHz raw Doppler and a particular UE has +43 kHz, a −40 kHz network correction leaves approximately +3 kHz at that UE, before other errors. This is an illustrative strategy, not a mandate to pre-compensate every SSB at beam centre.

GNSS position tells the UE where it is. It does not, by itself, provide the serving communication satellite's state. Also, a measured downlink frequency correction should not simply be copied to uplink: carrier frequencies differ, and the measured error can contain other components.

## 7. MIB leads to SIB1; SIB1 leads to SIB19

The bootstrap is the same as terrestrial NR: decode PBCH/MIB; use `pdcch-ConfigSIB1` and the applicable tables to derive initial CORESET/SearchSpace monitoring; detect SI-RNTI-associated DCI; receive SIB1 on the scheduled PDSCH.

For Release 17 SIB19, inspect SIB1's `si-SchedulingInfo-v1700` / `schedulingInfoList2-r17`. Find the mapping containing `sibType19`. The entry supplies SI periodicity and window position; the window length and SI search-space configuration complete the reception context. [6]

| Information | Question answered |
|---|---|
| SIB mapping | Which SI message contains SIB19? |
| SI window | When should the UE look for that message? |
| SI PDCCH/DCI | Which PDSCH resources carry this particular transmission? |

The UE does not need an established C-RNTI to read broadcast SI. SIB19 is not at one permanently fixed PRB allocation. In the broadcast-assisted baseline, the required assistance is acquired before uplink access; missing valid assistance is not a reason to transmit an uncompensated request.

### 7.1 A numerical SI-window example

Assume 15 kHz SCS, 10 slots per frame, window length \\(w=5\\) slots, window position \\(p=3\\), and periodicity \\(T=16\\) radio frames. For `schedulingInfoList2`:

\\[
x=(p-1)w=10,\qquad a=x\bmod10=0.
\\]

\\[
SFN\bmod16=\lfloor x/10\rfloor=1.
\\]

Thus the window starts at slot 0 in SFN 1, 17, 33, 49 and so on. Its duration is 5 ms, and its recurrence is 160 ms. During it the UE uses the configured SI monitoring to find the actual scheduled transmission. The window calculation is in TS 38.331 §5.2.2.3.2. [6]

## 8. SIB19 supplies a model with a reference time

| Assistance | Purpose |
|---|---|
| `ephemerisInfo` | Satellite state vector or orbital parameters |
| `epochTime` | Reference SFN/subframe for the assistance |
| `ta-Info` | Common timing advance, drift and drift variant |
| `cellSpecificKoffset` | Offset for NTN-modified scheduling relationships |
| `kmac` | Accommodation for gNB DL/UL frame-timing misalignment |
| `ntn-UlSyncValidityDuration` | Maximum assistance applicability duration from epoch |

At 7.5 km/s, a satellite moves approximately 15 km in two seconds. Its slant-range change depends on direction, but a position clearly cannot be treated as timeless. The assistance must be evaluated for the relevant time, with consistent units and coordinate frames.

The Release 17 broadcast ephemeris formats are position/velocity or orbital parameters. If an implementation uses splines internally for efficient trajectory evaluation, distinguish that internal representation from the standardized SIB19 fields. [6]

## 9. How does SFN become seconds before or after the epoch?

The UE already tracks radio timing from synchronization and PBCH. `epochTime` supplies SFN and subframe, identifying the start of a particular downlink subframe at the uplink synchronization RP. [6]

Suppose a local counter associates received SFN 100/subframe 0 with 50.000 s. Received SFN 100/subframe 7 is then at approximately 50.007 s. An epoch of SFN 102/subframe 3 is 16 ms ahead on that received timeline:

\\[
(102-100)10+(3-7)=16\text{ ms}.
\\]

Its corresponding received boundary is at local time 50.023 s. If RP-to-UE one-way delay is a constant 6 ms, the physical epoch at the RP occurs approximately at 50.017 s in the same clock coordinate. From 50.007 s, it is therefore 10 ms ahead at the RP, although its received boundary is 16 ms ahead.

For this constant-delay teaching model:

\\[
t_{now}-t_{epoch,RP}\approx t_{now}-t_{epoch,received}+\tau_{RP\rightarrow UE}.
\\]

The [expanded epoch explanation](/NTN/timing-advance-and-epoch-time.html#epoch-clock-mapping) covers past epochs, the 10.24-second SFN wrap, and storing an unwrapped local timestamp. This clock equation is an engineering interpretation, not a replacement for dynamic propagation modelling. No UTC conversion is necessary merely to measure elapsed time on a consistent local clock.

## 10. Position gives range; velocity gives range rate

Let \\(\mathbf r_s(t),\mathbf v_s(t)\\) be satellite position and velocity, and \\(\mathbf r_u(t),\mathbf v_u(t)\\) the UE state, expressed consistently. Then:

\\[
\boldsymbol\rho=\mathbf r_s-\mathbf r_u,\qquad R=\|\boldsymbol\rho\|.
\\]

\\[
\dot R=\frac{\boldsymbol\rho\cdot(\mathbf v_s-\mathbf v_u)}{R}.
\\]

Positive range rate means separation is increasing; negative means it is decreasing. Do not mix an ECI satellite velocity with an ECEF UE position without the required coordinate conversion.

The first-order narrowband Doppler approximation is:

\\[
f_D\approx-\frac{\dot R}{c}f_c.
\\]

With \\(\dot R=-6000\text{ m/s}\\), \\(c\approx3\times10^8\text{ m/s}\\) and \\(f_{UL}=2\text{ GHz}\\), the predicted uplink Doppler is +40 kHz. The UE applies approximately −40 kHz so their sum is near zero.

At 2.2 GHz, the same range rate produces 44 kHz instead. This is why the uplink calculation uses the uplink carrier frequency rather than blindly reusing a downlink correction.

## 11. Why timing advance compensates a round trip

Suppose the timing reference is at the gNB, one-way propagation is 7 ms, and a downlink boundary leaves at global time 0. The UE receives that boundary at 7 ms.

If the UE launched the corresponding uplink boundary immediately on reception, it would reach the gNB at 14 ms. Relative to its received downlink clock, the UE must therefore advance by approximately 14 ms: 7 ms because its reference arrived late, plus 7 ms for the uplink journey.

This does not require transmitting into the past. The UE predicts a **future** opportunity and launches the waveform early enough to arrive at that future network boundary.

## 12. The four timing-advance components

TS 38.211 §4.3.1 gives:

\\[
T_{TA}=\left(N_{TA}+N_{TA,offset}+N_{TA,adj}^{common}+N_{TA,adj}^{UE}\right)T_c.
\\]

| Component in time units | Role |
|---|---|
| Commanded TA | Network-controlled timing component, including the RAR command |
| Fixed timing offset | Specified DL/UL alignment offset |
| Common NTN adjustment | Satellite-to-RP contribution from broadcast assistance |
| UE-derived NTN adjustment | Service-link contribution calculated using position and ephemeris |

The geometric service contribution is approximately \\(2R/c\\). In our snapshot it is 6 ms. With RP at the gateway/gNB, the common contribution is 8 ms, giving 14 ms before fixed and commanded corrections. [2, 3]

The RP is a logical timing reference, not necessarily a separate hardware box. The UE obtains the common model from the network; it need not derive gateway coordinates from its GNSS position. Do not add `kmac` as another term in this waveform-advance equation.

## 13. Common TA changes with time

In decoded physical units, write the common round-trip contribution as:

\\[
T_{common}(t)=A_0+A_1\Delta t+A_2\Delta t^2,\qquad\Delta t=t-t_{epoch}.
\\]

TS 38.213 §4.2 expresses the associated one-way common delay as half this polynomial. The coefficients correspond to `ta-Common`, `ta-CommonDrift` and `ta-CommonDriftVariant`, after applying the RRC granularities. [3, 6]

For \\(A_0=8000\,\mu s\\), \\(A_1=-10\,\mu s/s\\), \\(A_2=0.2\,\mu s/s^2\\), at two seconds after epoch:

\\[
T_{common}=8000-10(2)+0.2(2^2)=7980.8\,\mu s.
\\]

The one-way common delay is 3990.4 µs. Do not insert an extra factor of one half before the quadratic term by analogy with a position/acceleration equation: \\(A_2\\) is already the polynomial coefficient; the second derivative is \\(2A_2\\).

## 14. Msg1: transmit a pre-compensated preamble

The UE selects an eligible SSB-associated PRACH occasion and contention-based preamble from the common configuration. For this attempt, choose SSB 2 and preamble 37.

| Preparation | Illustrative value |
|---|---:|
| UE-derived timing contribution | 6 ms |
| Common contribution | 8 ms |
| Initial commanded component | 0 |
| Predicted uplink Doppler | +40 kHz |
| Applied uplink frequency correction | −40 kHz |

The UE launches the PRACH waveform with the applicable timing and frequency correction. The gNB receives it after satellite relay and estimates residual arrival error.

Msg1 contains the preamble waveform. It does not contain UE coordinates, satellite ephemeris, the 39-bit random identity or RRCSetupRequest. The assistance controls **how and when the waveform is transmitted**, rather than being inserted into its payload.

The actual advanced launch time must still be feasible. A nominal occasion that looks future on the received DL clock can already be too late to prepare once a large timing advance is applied.

## 15. The RAR window starts later

Under the specified NTN adjustment condition, TS 38.213 §8.2 adds \\(T_{TA}+K_{mac}\text{ ms}\\) to RAR-window start timing. Actual monitoring follows the applicable symbol/CORESET rules; `ra-ResponseWindow` gives the length in slots of the relevant SCS. [3]

**Start displacement and window length are separate.** Shifting the start allows propagation to occur before the useful response-search interval.

Place the end of Msg1 at UE time 0. With 7 ms each way and an illustrative 2 ms gNB processing/scheduling interval:

| Event | Physical time |
|---|---:|
| Msg1 ends at UE | 0 ms |
| Its end reaches gNB | 7 ms |
| Response leaves gNB | Approximately 9 ms |
| Response reaches UE | Approximately 16 ms |

An illustrative useful search interval of 14–24 ms can include this response; 0–10 ms cannot. These rounded boundaries explain causality and are not a substitute for the actual configured monitoring occasions.

## 16. Msg2: RA-RNTI, RAPID and the residual timing component

The UE monitors the configured RAR search space, detects RA-RNTI-associated DCI, decodes its PDSCH, and looks for RAPID 37. A matching RAR supplies the timing command, Msg3 UL grant and TC-RNTI. [3, 5]

For illustration, take command index 10, grant G and TC-RNTI `0x1234`. At 15 kHz SCS, the timing-command step is:

\\[
q=16\times64\times T_c\approx0.520833\,\mu s.
\\]

The commanded component is approximately 5.20833 µs. If the autonomous contribution remains 14 ms at the applicable instant, total advance becomes approximately 14.00520833 ms, omitting the fixed offset.

**RAR updates the commanded component; it does not replace the geometric/common NTN terms.** This remains useful because ephemeris, position, timing references and hardware introduce residual errors. Also distinguish the RAR command mapping from the relative update encoding of a later ordinary TA MAC CE.

## 17. K_offset makes the scheduled uplink causally possible

Suppose a grant is received at downlink-clock time 100 ms and picks an uplink boundary at 104 ms. With 14 ms TA, the required physical launch is 90 ms—before the grant arrived.

An additional scheduling offset moves the uplink opportunity far enough into the future. For equal numerologies in FR1, initial RAR-granted Msg3 timing can be written:

\\[
n_{Msg3}=n_{RAR}+K_2+\Delta+2^\mu K_{offset}.
\\]

The RAR PDSCH reference slot and the Msg3-specific \\(\Delta\\) follow TS 38.214 §6.1.2.1; at 15 kHz, \\(\Delta=2\\) slots. Mixed numerologies require the specified conversion. [4]

Take \\(n_{RAR}=100\\), \\(K_2=4\\), \\(\Delta=2\\), \\(K_{offset}=20\\), \\(\mu=0\\). Then Msg3 uses uplink slot 126. Its boundary is launched at approximately 126−14=112 ms on the simplified received-downlink clock: approximately 12 ms after the RAR slot boundary. The precise processing budget also depends on the symbols occupied by RAR and Msg3.

| Parameter | Operation |
|---|---|
| TA | Advances physical waveform launch |
| K_offset | Moves the scheduled UL opportunity farther ahead |

The signalled cell-specific offset is in 15 kHz slot units; 20 represents 20 ms, or 40 slots at 30 kHz. Before a differential offset is supplied, the initial-access offset comes from the cell value. Later operation can apply the specified differential Koffset mechanism; it is not another geometric TA term. [3, 6]

## 18. K_mac depends on the reference-point timing relationship

The MAC UE–gNB RTT quantity uses TA plus `kmac`. A reference point away from the gNB can leave a round-trip portion outside the waveform's UE-to-RP advance. [5]

Move the RP to the satellite in the same idealized 3 ms service / 4 ms feeder example:

| RP location | Autonomous TA | Illustrative K_mac | Sum |
|---|---:|---:|---:|
| Gateway/gNB | 14 ms | 0 ms | 14 ms |
| Satellite | 6 ms | 8 ms | 14 ms |

The table ignores fixed/residual offsets and quantization. It demonstrates that changing the timing reference changes the decomposition, not the actual propagation RTT. `kmac` describes the relevant gNB timing misalignment; it must not be treated as an arbitrary extra delay to add to every uplink scheduling equation.

## 19. Msg3: update compensation for the actual transmission

For initial establishment, Msg3 commonly carries an RRCSetupRequest on UL CCCH in a PUSCH MAC transport block. Its initial UE identity is the applicable 39-bit temporary-identity part or a 39-bit random value. The RAR grant supplies the initial PUSCH resources. [5, 6]

Msg3 occurs later than Msg1. Suppose service-link range rate is −6 km/s and the time difference is 20 ms. Then:

\\[
\Delta R=-6000(0.020)=-120\text{ m},\qquad
\Delta T_{UE}\approx\frac{2(-120)}{3\times10^8}=-0.8\,\mu s.
\\]

That exceeds one 15 kHz timing-command step. With an illustrative Doppler rate of 500 Hz/s, the Doppler changes by 10 Hz in the same interval. The common contribution can evolve too.

Maintain estimates appropriate to the transmission instant rather than indefinitely reusing Msg1's values. Efficient interpolation is possible; the principle does not mandate rebuilding an entire orbit solution for every sample.

## 20. Msg4: contention resolution with an NTN timer start

If two UEs choose the same preamble in the same occasion, both can accept the same RAR and transmit on grant G. If the gNB decodes UE A's UL CCCH request, the contention-resolution identity identifies that decoded content.

For this path, the UE Contention Resolution Identity MAC CE contains **the first 48 bits of the Msg3 UL CCCH SDU**. It is not a 39-bit random number padded to 48 bits. UE A matches its stored prefix and succeeds; UE B does not obtain success from that identity. [5]

For NTN, the contention-resolution timer starts/restarts after Msg3 transmission plus the UE–gNB RTT. In the relevant repetition case, the reference is the end of all repetitions. [5]

If Msg3 ends at UE time 30 ms, the RTT quantity is 14 ms and the timer duration is 32 ms, the illustrative start is 44 ms and expiry is 76 ms, absent intervening events. The ordinary timer duration is not consumed merely waiting for propagation.

RA success establishes the successful random-access context. RRC establishment, NAS registration, authentication and bearer setup are broader procedures; Msg4 does not mean all of them are complete.

## 21. A coherent physical timeline

Use the 7 ms one-way snapshot, RP at gNB, TA≈14 ms and K_mac=0. Define gNB downlink slot 0 at global time 0; the UE receives that boundary at global time 7 ms. Assume 15 kHz slots and, for illustration, PUSCH starting at its slot boundary. Durations/processing are simplified.

| Event | Global time | Relationship |
|---|---:|---|
| UE launches PRACH for network occasion at 100 ms | 93 ms | 7 ms before its arrival target |
| PRACH reaches network | 100 ms | Intended occasion |
| gNB sends RAR in DL slot 102 | 102 ms | Illustrative response scheduling |
| UE receives RAR slot 102 | 109 ms | 7 ms later |
| Msg3 assigned UL slot 128 | — | 102+4+2+20 |
| UE launches Msg3 slot boundary | 121 ms | Received DL slot-128 boundary would be 135 ms; subtract 14 ms TA |
| Msg3 boundary reaches gNB | 128 ms | Matches allocated uplink slot |

This table shows why a slot number and physical time at the UE are different quantities. Subtracting TA from the UE's received DL boundary and then adding UL propagation produces the intended network arrival. Actual preamble duration, PDSCH decoding and symbol allocations must fit the detailed procedure.

## 22. Synchronization continues after access and through sleep

In the Release 17 baseline, invalid required GNSS position, ephemeris or common TA prevents uplink transmission until validity is restored. Timing and frequency pre-compensation continue during connection. [1]

At 6 km/s range rate, a two-second sleep changes range by approximately 12 km and service-link RTT by 80 µs. A previously successful Msg4 does not make old compensation valid forever. Wake-up processing must preserve or restore a consistent time reference, usable assistance and current correction before uplink.

| First failing stage | Useful engineering checks |
|---|---|
| No PSS | Search coverage, frequency hypotheses, signal level |
| PSS/SSS but no PBCH | Residual frequency error, timing, PBCH DM-RS hypotheses |
| SIB1 but no SIB19 | Mapping, window calculation, SI PDCCH monitoring |
| PRACH not detected | Assistance validity, epoch mapping, TA factor of two, Doppler sign |
| PRACH detected but no RAR | Window displacement, search space, RA-RNTI, downlink decoding |
| RAR succeeds but Msg3 fails | Grant interpretation, K_offset, physical launch time, updated compensation |
| Msg3 decoded but UE fails | Timer start, RTT quantity, Msg4 reception and identity match |
| Failure after sleep | Stale geometry, expired assistance, lost clock mapping |

This is a debugging interpretation, not a prescribed vendor software architecture. Increasing PRACH power cannot correct a wrong epoch or a Doppler correction with the wrong sign.

## 23. Interview questions and concise answers

**How can the UE acquire SSB before SIB19?** A receiver can estimate frequency error from known synchronization waveforms without orbital knowledge. The detailed acquisition search is vendor-specific; it must meet applicable requirements. SIB19 later supports geometry-based uplink pre-compensation.

**Does GNSS alone give the needed Doppler?** No. The UE also needs the serving satellite state, a consistent time reference and the correct link carrier frequency.

**Why is timing advance approximately twice the one-way delay?** The received downlink clock is already late by one propagation interval, and uplink needs another to reach the reference point.

**Why is RAR TA still needed?** It supplies the commanded timing component to correct residual error while the common and UE-derived NTN contributions remain in the total.

**Why both TA and K_offset?** TA controls physical launch relative to the received DL timeline. K_offset makes the scheduled opportunity sufficiently future that the UE can receive and process its grant before launch.

**Is K_mac another TA term?** No. It participates in relevant procedure timing and RTT accounting when gNB DL/UL timing is misaligned; it is not appended to the waveform TA equation.

**Does satellite access change the contention identity?** The initial UL-CCCH path still compares the first 48 bits of the decoded Msg3 CCCH SDU. NTN changes timing around the exchange.

**What does an SFN epoch mean in seconds?** Resolve its occurrence relative to reception, map its frame/subframe boundary onto the tracked clock, and account for the RP reference when evaluating physical state age.

<h2 id="standards-trail">24. Standards trail</h2>

These editions keep the article's baseline explicitly in Release 17. Clause names and field semantics matter more than PDF page numbers.

1. [TS 38.300 v17.9.0](https://www.etsi.org/deliver/etsi_ts/138300_138399/138300/17.09.00_60/ts_138300v170900p.pdf), §16.14.1–16.14.3: architecture, timing, assistance validity, UE service-link pre-compensation and network feeder-link responsibility.
2. [TS 38.211 v17.8.0](https://www.etsi.org/deliver/etsi_ts/138200_138299/138211/17.08.00_60/ts_138211v170800p.pdf), §4.3.1 and §7.4.2–7.4.3: frame timing, TA decomposition and SSB signals/resources.
3. [TS 38.213 v17.9.0](https://www.etsi.org/deliver/etsi_ts/138200_138299/138213/17.09.00_60/ts_138213v170900p.pdf), §4.2, §8 and §13: TA, common-delay model, random-access response and initial control monitoring.
4. [TS 38.214 v17.9.0](https://www.etsi.org/deliver/etsi_ts/138200_138299/138214/17.09.00_60/ts_138214v170900p.pdf), §6.1.2.1 and Table 6.1.2.1.1-5: PUSCH timing and the Msg3-specific delta.
5. [TS 38.321 v17.9.0](https://www.etsi.org/deliver/etsi_ts/138300_138399/138321/17.09.00_60/ts_138321v170900p.pdf), §3.1, §5.1 and §6: NTN RTT definition, RAR, contention resolution and MAC formats.
6. [TS 38.331 v17.10.0](https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/17.10.00_60/ts_138331v171000p.pdf), §5.2.2.3.2 and the SIB19, SI-SchedulingInfo, NTN-Config and RRCSetupRequest definitions: SI discovery, window calculation, assistance fields and epoch interpretation.
7. [TS 38.101-5 v17.10.0](https://www.etsi.org/deliver/etsi_ts/138100_138199/13810105/17.10.00_60/ts_13810105v171000p.pdf), §6.4.1 and Annex A.4: uplink frequency accuracy and scope of RF/performance test conditions.
