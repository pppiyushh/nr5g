---
layout: article
title: "NR HARQ Processes: State Machines, Soft Buffers and LLR Combining"
section: 5G NR
section_url: /5G/
description: Explain what an NR HARQ process really is, why it is not a CPU thread, what TX and RX buffers contain, how failed decodes preserve soft information, and how retransmissions are combined.
evidence_type: PHY/MAC implementation analysis
reference_basis: 3GPP TS 38.321, TS 38.212 and TS 38.214
last_reviewed: 2026-08-31
math: true
mermaid: true
next_title: HARQ PID, NDI, RV and DCI
next_url: /5G/harq/harq-pid-ndi-rv-dci.html
---

## 1. A HARQ process is not a CPU thread

The CPU-thread analogy is useful for exactly one idea: **multiple operations can be in flight at the same time**. Beyond that, it becomes misleading.

A CPU thread is an execution context with a program counter, registers and a stack. A HARQ process is better thought of as a **numbered protocol transaction context**.

Conceptually:

```text
HARQ process 5
  -> current NDI state
  -> current TB transaction
  -> ACK/NACK state
  -> previous/current RV information
  -> retransmission state
  -> associated TX HARQ buffer or RX soft-buffer state
```

When process 5 is waiting for a retransmission, it is not continuously consuming a decoder. Its state and buffers remain allocated while other HARQ processes can carry other TBs.

## 2. Why multiple HARQ processes exist

Stop-and-wait HARQ has an unavoidable feedback delay:

```text
transmit -> propagate -> decode -> feedback -> scheduler reacts
```

If only one HARQ transaction could exist, the transmitter would repeatedly wait for feedback before sending new data.

With several processes:

```text
slot n     -> PID 5 -> TB A
slot n+1   -> PID 6 -> TB B
slot n+2   -> PID 7 -> TB C
slot n+3   -> PID 8 -> TB D
...
later      -> PID 5 -> retransmission of TB A
```

The radio pipeline can therefore remain busy even while process 5 waits.

## 3. TX and RX HARQ buffers are fundamentally different

This distinction is essential.

### 3.1 Transmitter side

The transmitting MAC HARQ process must retain enough information to retransmit the **same transport block**.

For UL, TS 38.321 defines a HARQ buffer associated with each HARQ process. For a new transmission, the MAC PDU is stored in that buffer; a retransmission uses the already stored TB.

Conceptually:

```text
TX HARQ PID 5
  -> MAC PDU / TB A
  -> NDI state
  -> retransmission metadata
```

The transmitter does **not** have received LLRs for its own transmission.

### 3.2 Receiver side

The receiver needs to preserve decoding evidence from a failed transmission.

Conceptually:

```text
RX HARQ PID 5
  -> rate-recovered soft information
  -> per-code-block soft-buffer state
  -> decode / CRC state
```

Real implementations may store quantized or compressed soft information in dedicated accelerator SRAM or other memory rather than floating-point values.

## 4. What an LLR represents

For a received bit observation, a log-likelihood ratio can be written as

\\[
L(b)=\log \frac{P(b=0\mid y)}{P(b=1\mid y)}.
\\]

A simple sign convention is:

```text
large positive LLR -> strong evidence for 0
small positive LLR -> weak evidence for 0
small negative LLR -> weak evidence for 1
large negative LLR -> strong evidence for 1
```

For example:

```text
coded-bit position   LLR
0                    +2.1
1                    -0.7
2                    +4.3
3                    +0.2
4                    -3.0
```

A hard-decision receiver would throw most of this confidence information away. HARQ soft combining keeps it.

## 5. Where the soft information is stored

The receiver does not simply save a copy of the raw constellation samples forever. The useful abstraction is the **rate-recovered code-bit domain**.

A practical receiver path is:

```text
received symbols
 -> equalization
 -> demapping
 -> LLRs
 -> rate recovery
 -> HARQ soft buffer
 -> LDPC decoder
```

If decoding fails, the rate-recovered soft information remains associated with that HARQ process.

Conceptually:

```text
HARQ soft buffer[5]

CB0: LLRs for LDPC positions ...
CB1: LLRs for LDPC positions ...
CB2: LLRs for LDPC positions ...
```

## 6. The process can wait without blocking the decoder

Suppose PID 5 fails:

```text
PID 5 -> TB A -> decode FAIL
```

Its context becomes something like:

```text
state             = waiting for retransmission
current NDI       = 0
soft-buffer ptr   = buffer_5
```

The LDPC accelerator can immediately process other scheduled code blocks from PIDs 6, 7, 8, and so on. PID 5 merely retains state and memory until another transmission for that process arrives.

This is why “HARQ process 5 stays idle” is imprecise. It is **occupied but not executing**.

## 7. How retransmission combining works

Assume the first transmission created these rate-recovered soft values:

```text
C0 = +1.5
C1 = -0.4
C2 = +2.2
C3 = +0.3
C4 = -1.7
C5 = no information
```

A later retransmission contributes:

```text
C2 = +1.8
C3 = -0.1
C4 = -1.0
C5 = +3.2
```

When both observations map to the same encoded-bit position, the receiver can accumulate evidence approximately as LLR addition:

\\[
L_{combined}=L_{old}+L_{new}.
\\]

So:

```text
C2: +2.2 + +1.8 = +4.0
C4: -1.7 + -1.0 = -2.7
C5: first useful observation = +3.2
```

The resulting soft buffer is stronger and/or more complete before the next LDPC attempt.

<div class="technical-callout">
<p><strong>Implementation nuance:</strong> real fixed-point decoders use quantization, saturation and implementation-specific buffer formats. Literal floating-point addition is a teaching model, not a mandate on modem architecture.</p>
</div>

## 8. Why different RVs can still be combined

The receiver does not blindly add “LLR number 17 from transmission 1” to “LLR number 17 from transmission 2.”

Instead:

```text
new transmission
 -> demapper
 -> LLRs
 -> rate recovery using the signalled RV
 -> map each LLR to its LDPC circular-buffer/code-bit position
 -> combine with any existing evidence at that position
```

A retransmission can therefore use a different subset of coded bits while still contributing to the same codeword.

## 9. Chase combining vs incremental redundancy

### Chase combining

The retransmission repeats essentially the same coded information:

```text
TX1: A B C D
TX2: A B C D
```

The receiver mainly strengthens existing observations.

### Incremental redundancy

A retransmission contributes at least partly different redundancy:

```text
TX1: A B C D
TX2: C D E F
```

Now C and D may become stronger while E and F supply new information.

NR's LDPC rate-matching and redundancy-version mechanism enables incremental-redundancy behavior.

## 10. What releases the old soft state?

Once the current TB is successfully decoded and the HARQ transaction completes, the process can later be reused for new data.

When the receiver recognizes a **new transmission** for that HARQ process, old soft information belonging to the previous TB must not be combined with it.

That new-vs-retransmission decision is tied to the HARQ process state and **NDI**, which the next article explains in detail.

## 11. An implementation-oriented mental model

A useful conceptual representation is:

```text
harq_rx[5] = {
    state: WAITING_RETX,
    ndi: 0,
    soft_buffer: <pointer>,
    codeblock_state: ...
}
```

Then a retransmission for PID 5 causes:

```text
demodulate
 -> rate recover according to RV
 -> locate harq_rx[5].soft_buffer
 -> combine
 -> LDPC decode
 -> TB CRC
```

On success, the transaction finishes. On failure, the updated soft state is retained for another attempt.

## 12. Standards trail

Primary references:

- **3GPP TS 38.321** — MAC HARQ entities/processes, HARQ buffers and new-transmission/retransmission handling.
- **3GPP TS 38.212** — LDPC coding and rate matching.
- **3GPP TS 38.214** — PDSCH/PUSCH HARQ-related physical-layer procedures.

Current ETSI families:

- <https://www.etsi.org/deliver/etsi_ts/138300_138399/138321/>
- <https://www.etsi.org/deliver/etsi_ts/138200_138299/138212/>
- <https://www.etsi.org/deliver/etsi_ts/138200_138299/138214/>

The next article answers the control question: **how does the receiver know that a scheduled transmission belongs to HARQ process 5, whether it is new data, and which redundancy selection it carries?**