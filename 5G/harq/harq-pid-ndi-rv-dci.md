---
layout: article
title: "HARQ PID, NDI and RV in NR: How DCI Identifies New Data and Retransmissions"
section: 5G NR
section_url: /5G/
description: Explain how dynamically scheduled NR transmissions carry HARQ process number, NDI and RV in DCI, how retransmissions are recognized, and how UL and DL HARQ state machines stay synchronized.
evidence_type: MAC/PHY control analysis
reference_basis: 3GPP TS 38.212, TS 38.214 and TS 38.321
last_reviewed: 2026-08-31
math: true
mermaid: true
next_title: LDPC Parity Bits, Rate Matching and Incremental Redundancy
next_url: /5G/harq/ldpc-parity-rate-matching-rv.html
---

## 1. There is usually no standalone "Transport Block ID"

A common misconception is that every transport block carries a unique TB sequence number over the air. In normal dynamic scheduling, that is not how HARQ identity works.

The receiver tracks the current TB **inside a HARQ process context**. The most important control quantities are:

```text
HARQ process number -> which transaction context?
NDI                 -> new data or current TB?
RV                  -> which redundancy-version selection?
```

For a dynamically scheduled transmission, these fields are signalled in the relevant DCI format.

## 2. HARQ PID comes from DCI for dynamic scheduling

For a normal dynamically scheduled DL PDSCH, the gNB sends a PDCCH/DCI assignment containing fields that include, depending on the DCI format and configuration:

```text
frequency-domain allocation
time-domain allocation
MCS
HARQ process number
NDI
RV
other control fields
```

Example:

```text
HARQ PID = 5
NDI      = 0
RV       = 0
```

The UE does not inspect PDSCH payload bits and guess which HARQ process they belong to. The scheduling control information establishes the context.

The same principle applies to dynamically scheduled UL PUSCH grants: the DCI identifies the UL HARQ process used by the transmission.

<div class="technical-callout">
<p><strong>Scope nuance:</strong> “HARQ PID always comes from DCI” is too broad. Configured-grant / configured-scheduling procedures can derive the HARQ process using configured timing rules instead of receiving a fresh PID field in dynamic DCI every time. This article focuses first on the normal dynamic-scheduling case.</p>
</div>

## 3. NDI distinguishes a new TB from the current TB

NDI means **New Data Indicator**.

Suppose process 5 currently stores a TB transaction with NDI state 0.

### Initial/new transmission

```text
PID = 5
NDI = 0   <- toggled relative to previous generation
RV  = 0
```

The receiver recognizes a **new TB** for process 5 and initializes the receive state for that transaction.

### Retransmission

Later:

```text
PID = 5
NDI = 0   <- unchanged
RV  = 2
```

The same process is referenced and the NDI has not toggled, so the receiver treats it as another transmission of the current TB and combines it with stored soft information as required by the HARQ procedure.

### Reuse for a later TB

After the earlier transaction completes:

```text
PID = 5
NDI = 1   <- toggled
RV  = 0
```

Now process 5 carries **new data**, not another retransmission of the old TB.

A useful timeline is:

| PID | NDI | RV | Interpretation |
|---:|---:|---:|---|
| 5 | 0 | 0 | new TB A |
| 5 | 0 | 2 | retransmission of TB A |
| 5 | 0 | 3 | another retransmission of TB A |
| 5 | 1 | 0 | new TB B |
| 5 | 1 | 2 | retransmission of TB B |

The exact standardized procedures include special cases, but this is the correct core model for dynamic HARQ.

## 4. RV does not identify new versus retransmitted data

Do not use this rule:

```text
RV0 = new transmission
RV2 = retransmission
```

That is an unreliable shortcut.

**NDI is the principal new-data indicator.** RV tells PHY which redundancy-version/rate-matching selection to use for the current transmission.

A retransmission can use different RV values according to the scheduling procedure. The RV sequence is an implementation/scheduling choice constrained by the specification, not a TB identity field.

## 5. Downlink example: gNB decides when PID 5 is retransmitted

Assume the gNB scheduler sends:

```text
slot n
DCI: PID 5, NDI 0, RV 0
PDSCH: TB A
```

The UE performs:

```text
PDSCH reception
 -> equalization/demapping
 -> rate recovery
 -> LDPC decoding
 -> TB CRC
 -> FAIL
```

The receiving HARQ context for PID 5 retains useful soft information and the UE generates the applicable HARQ-ACK feedback indicating failure.

The gNB scheduler now knows that the current TB associated with DL process 5 was not successfully received. It can continue scheduling other processes while deciding when to retry PID 5.

Later:

```text
slot n+k
DCI: PID 5, NDI 0, RV 2
PDSCH: another transmission of TB A
```

The UE sees:

```text
same PID + unchanged NDI
```

and routes the rate-recovered soft information into the existing PID-5 HARQ state for combining and another decode attempt.

## 6. Uplink example: retransmission must use the same TB

For UL dynamic scheduling:

```text
gNB grant: PID 5, NDI 0, RV 0
```

For a **new transmission**, UE MAC creates/selects the MAC PDU according to the MAC procedure and stores it in the HARQ buffer associated with process 5.

If the gNB later requests retransmission of that same process with NDI unchanged:

```text
gNB grant: PID 5, NDI 0, RV 2
```

the UE does not build a completely new MAC PDU from whatever happens to be in its logical-channel queues. It retransmits the TB already associated with that HARQ process, with PHY applying the requested transmission parameters/rate matching.

This is essential: otherwise the gNB would combine LLRs from two **different** transport blocks and corrupt the decode.

## 7. Why the process number is sufficient without a global TB number

At any instant, each HARQ process tracks at most its current outstanding TB generation in the relevant direction/context.

So the receiver needs to know:

```text
Which process? -> PID
Same generation or new generation? -> NDI
Which coded-bit selection? -> RV
```

A separate globally increasing TB identifier would duplicate state that is already represented by the stop-and-wait HARQ process plus NDI.

## 8. UL and DL HARQ PID 5 are different contexts

Do not picture a single bidirectional process 5.

```text
DL HARQ PID 5 -> gNB TX / UE RX transaction
UL HARQ PID 5 -> UE TX / gNB RX transaction
```

They belong to independent HARQ entities/state in the two transmission directions.

## 9. DCI is control; PDSCH/PUSCH carries the coded data

A useful separation is:

```text
PDCCH / DCI
  -> where/when to receive or transmit
  -> HARQ PID
  -> NDI
  -> RV
  -> MCS and other scheduling information

PDSCH / PUSCH
  -> actual coded transport-block transmission
```

This is why HARQ identification belongs naturally in control information rather than in the user payload itself.

## 10. What happens if the retransmission uses different physical resources?

The same TB does not have to appear on exactly the same PRBs or in the same slot.

A later retransmission can be scheduled at a different time/frequency allocation with the appropriate control parameters. PHY rate recovery uses the signalled RV and coding configuration to map the received soft information back into the correct encoded-bit positions before combining.

The logical invariant is:

```text
same HARQ process + current NDI generation -> same TB transaction
```

not "same PRBs as last time."

## 11. Dynamic scheduling versus configured grant

For **dynamic** PDSCH/PUSCH scheduling, the relevant DCI format explicitly carries HARQ control fields.

For **configured grant** operation, UL HARQ-process selection can be derived from configured parameters and timing rather than requiring a fresh dynamic DCI HARQ-process field on every transmission.

This distinction matters in standards discussions and interview answers: always state the scheduling mode before claiming how PID is obtained.

## 12. Standards trail

Primary references:

- **3GPP TS 38.212** — DCI formats/field definitions and channel coding.
- **3GPP TS 38.214** — physical-layer PDSCH/PUSCH procedures and HARQ operation.
- **3GPP TS 38.321** — MAC HARQ entity/process behavior, new-transmission/retransmission determination and HARQ buffers.

ETSI specification families:

- <https://www.etsi.org/deliver/etsi_ts/138200_138299/138212/>
- <https://www.etsi.org/deliver/etsi_ts/138200_138299/138214/>
- <https://www.etsi.org/deliver/etsi_ts/138300_138399/138321/>

The next article goes inside RV itself: **where systematic bits and LDPC parity bits come from, what the circular buffer contains, and why a retransmission can provide new redundancy rather than merely repeating the packet.**