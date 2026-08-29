---
layout: article
title: "Why 15 kHz and 14 Symbols? OFDM Orthogonality and NR Numerology"
section: 5G NR
section_url: /5G/
description: Derive OFDM subcarrier orthogonality, reconstruct the exact LTE timing arithmetic behind 15 kHz and 14 symbols, test a complete hypothetical 10 kHz design, and show how NR scales SCS, cyclic prefix and slot duration.
math: true
mermaid: true
next_title: MIMO — From the Channel Matrix to NR Channel Estimation
next_url: /5G/physical-layer/mimo-channel-estimation.html
---

## 1. The real question: which numbers are mathematical and which are design choices?

Four statements are often memorized together:

- LTE uses 15 kHz subcarrier spacing;
- a 15 kHz subcarrier has a 66.667 µs useful symbol duration;
- LTE normal cyclic prefix gives 7 symbols in a 0.5 ms slot; and
- NR normal cyclic prefix gives 14 symbols in a slot whose duration depends on numerology.

Only one relationship is imposed directly by the usual OFDM construction:

\\[
T_u=\frac{1}{\Delta f},
\\]

where \\(T_u\\) is the useful FFT interval and \\(\Delta f\\) is the subcarrier spacing. Neither 15 kHz nor 14 is a law of Fourier analysis. A system could use 10 kHz, 12.5 kHz or another spacing and could define 10, 12 or another number of symbols per scheduling interval.

The specific LTE/NR values are a **joint system design**. They were selected so that orthogonal waveforms, cyclic-prefix protection, radio-frame boundaries, sampling clocks, FFT sizes, scheduling intervals, mobility and implementation cost fit together.

<div class="technical-callout">
<p><strong>Standardized fact versus engineering interpretation:</strong> 3GPP specifications define the resulting timing and waveform. They do not contain one sentence proving that 15 kHz is the unique optimum. The choice is best understood as a compromise among several competing requirements.</p>
</div>

## 2. Orthogonality establishes the SCS–symbol-duration relationship

Consider two complex baseband OFDM subcarriers:

\\[
s_k(t)=e^{j2\pi f_k t},
\\]

\\[
s_m(t)=e^{j2\pi f_m t}.
\\]

The receiver tests their orthogonality over the useful symbol interval by evaluating the inner product

\\[
I_{k,m}
=\int_0^{T_u}s_k(t)s_m^*(t)\,dt.
\\]

Because complex conjugation reverses the phase rotation of \\(s_m(t)\\),

\\[
s_k(t)s_m^*(t)
=e^{j2\pi(f_k-f_m)t}.
\\]

Let the subcarrier frequencies lie on the grid

\\[
f_k=f_0+k\Delta f.
\\]

Then

\\[
f_k-f_m=(k-m)\Delta f,
\\]

and

\\[
I_{k,m}
=\int_0^{T_u}e^{j2\pi(k-m)\Delta f t}\,dt.
\\]

For \\(k\ne m\\),

\\[
I_{k,m}
=\frac{e^{j2\pi(k-m)\Delta fT_u}-1}
{j2\pi(k-m)\Delta f}.
\\]

The numerator becomes zero when

\\[
\Delta fT_u=N,
\qquad N\in\mathbb Z.
\\]

The shortest positive observation interval uses \\(N=1\\):

\\[
\boxed{\Delta fT_u=1}
\\]

and therefore

\\[
\boxed{T_u=\frac{1}{\Delta f}}.
\\]

### 2.1 Physical meaning

After the receiver multiplies one subcarrier by the conjugate of another, the common RF frequency disappears. The product is a complex vector rotating at the **difference frequency**.

For adjacent subcarriers, that difference is \\(\Delta f\\). During \\(T_u=1/\Delta f\\), the vector completes exactly one circle. Contributions from every phase direction cancel when accumulated by the FFT:

\\[
\int_0^{T_u}e^{j2\pi\Delta f t}\,dt=0.
\\]

The initial QAM phases do not need to be coordinated. If

\\[
x_k(t)=X_ke^{j2\pi k\Delta ft}
\\]

and

\\[
x_m(t)=X_me^{j2\pi m\Delta ft},
\\]

then

\\[
\int_0^{T_u}x_k(t)x_m^*(t)\,dt
=X_kX_m^*I_{k,m}=0.
\\]

The complex coefficients \\(X_k\\) and \\(X_m\\) may therefore carry arbitrary allowed QAM amplitudes and phases without destroying basis-function orthogonality.

### 2.2 Numerical comparison

| SCS \\(\Delta f\\) | Useful duration \\(T_u=1/\Delta f\\) | Relative rotation of adjacent tones during \\(T_u\\) |
|---:|---:|---:|
| 10 kHz | 100 µs | 1 cycle |
| 15 kHz | 66.667 µs | 1 cycle |
| 30 kHz | 33.333 µs | 1 cycle |
| 60 kHz | 16.667 µs | 1 cycle |
| 120 kHz | 8.333 µs | 1 cycle |

Doubling SCS makes the relative phasor rotate twice as fast, so the shortest orthogonal observation interval halves.

## 3. Why not simply choose the smallest possible SCS?

SCS controls more than symbol rate. It changes how the waveform behaves under multipath, Doppler, oscillator error, phase noise and implementation constraints.

### 3.1 Smaller SCS: the advantages

A smaller SCS produces a longer useful symbol. For a fixed absolute CP duration, the CP occupies a smaller fraction of the transmitted time. It also gives finer frequency resolution, so a frequency-selective channel is more likely to look approximately flat within one subcarrier.

These properties favour smaller SCS when:

- delay spread is relatively large;
- Doppler and oscillator errors are small;
- latency requirements are relaxed; or
- narrow allocations need fine frequency granularity.

### 3.2 Smaller SCS: the costs

A frequency error becomes more damaging relative to a smaller bin spacing. Define normalized frequency offset as

\\[
\epsilon=\frac{f_{error}}{\Delta f}.
\\]

Assume a UE travels at 350 km/h at a 2 GHz carrier. Its speed is

\\[
v=\frac{350}{3.6}=97.222\text{ m/s}.
\\]

The maximum line-of-sight Doppler magnitude is approximately

\\[
f_D=\frac{v}{c}f_c
=\frac{97.222}{299{,}792{,}458}(2\times10^9)
\approx648.6\text{ Hz}.
\\]

For 10 kHz SCS,

\\[
\epsilon_{10}=\frac{648.6}{10{,}000}=0.0649=6.49\%.
\\]

For 15 kHz SCS,

\\[
\epsilon_{15}=\frac{648.6}{15{,}000}=0.0432=4.32\%.
\\]

The same physical Doppler therefore consumes a smaller fraction of the 15 kHz spacing. This does not by itself prove that 15 kHz is optimal, but it demonstrates one side of the trade-off.

A smaller SCS also means more active subcarriers for a fixed occupied bandwidth and a longer baseband processing interval. For an 18 MHz active bandwidth:

\\[
N_{SC,15}=\frac{18\text{ MHz}}{15\text{ kHz}}=1200,
\\]

whereas

\\[
N_{SC,10}=\frac{18\text{ MHz}}{10\text{ kHz}}=1800.
\\]

The 10 kHz design needs 50% more active frequency bins to describe the same occupied bandwidth.

### 3.3 Larger SCS has the opposite trade-off

Increasing SCS gives:

- shorter useful symbols and shorter transmission intervals;
- better tolerance to a given absolute Doppler or oscillator error;
- improved robustness to phase variation during one symbol; and
- fewer subcarriers for a fixed bandwidth.

But if the propagation channel still requires the same absolute CP duration, the CP consumes a larger fraction of every symbol. Very wide SCS may also make the channel vary appreciably across one subcarrier.

The base 15 kHz LTE spacing is therefore best viewed as a terrestrial-mobile compromise, not a mathematically privileged number.

## 4. The exact LTE 15 kHz implementation grid

LTE defines the basic time unit

\\[
T_s=\frac{1}{15{,}000\times2048}
=\frac{1}{30.72\times10^6}
=32.5520833\text{ ns}.
\\]

For the largest LTE FFT size,

\\[
N_{FFT}=2048.
\\]

Therefore the useful symbol contains 2048 samples:

\\[
T_u=2048T_s
=66.6666667\ \mu s.
\\]

The frequency-bin spacing is

\\[
\Delta f=\frac{F_s}{N_{FFT}}
=\frac{30.72\text{ MHz}}{2048}
=15\text{ kHz}.
\\]

These are three views of the same construction:

\\[
\boxed{
F_s=N_{FFT}\Delta f,
\qquad
T_u=\frac{N_{FFT}}{F_s},
\qquad
T_u=\frac{1}{\Delta f}
}
\\]

### 4.1 The 20 MHz LTE example

A 20 MHz LTE carrier uses 100 resource blocks. Each resource block contains 12 subcarriers, so

\\[
N_{active}=100\times12=1200.
\\]

The resource-grid width is

\\[
B_{grid}=1200\times15\text{ kHz}=18\text{ MHz}.
\\]

Thus the design has:

| Quantity | Value |
|---|---:|
| Nominal channel bandwidth | 20 MHz |
| Resource blocks | 100 |
| Active subcarriers | 1200 |
| Active resource-grid width | 18 MHz |
| FFT size | 2048 |
| Sampling rate | 30.72 MHz |
| Unused FFT bins | \\(2048-1200=848\\) |

The unused bins and RF filtering provide guard regions and implementation margin. The IFFT converts the populated frequency bins into one complex time-domain waveform; the receiver FFT performs the conjugated correlations that recover the individual bins.

### 4.2 Numerical power allocation and why orthogonality matters

Assume a simplified transmitter delivers

\\[
P_{total}=1\text{ W}=30\text{ dBm}
\\]

equally across the 1200 active LTE subcarriers. The average contribution per subcarrier is

\\[
P_{SC}=\frac{1}{1200}
=0.0008333\text{ W}
=0.8333\text{ mW}.
\\]

In dBm,

\\[
P_{SC,dBm}
=30-10\log_{10}(1200)
=-0.792\text{ dBm}.
\\]

Each 12-subcarrier resource block receives

\\[
P_{RB}=12(0.8333\text{ mW})
=10\text{ mW}
=10\text{ dBm}.
\\]

The total energy transmitted during one useful 15 kHz symbol is

\\[
E_{u}=P_{total}T_u
=1(66.667\ \mu s)
=66.667\ \mu J.
\\]

This power is not divided by 14 merely because a normal-CP subframe contains 14 symbols. If the transmitter continuously operates at 1 W average power, each symbol interval still has 1 W average power; the energy is power multiplied by that interval's duration.

Orthogonality explains why average subcarrier powers add cleanly. If

\\[
x(t)=\sum_k X_ks_k(t),
\\]

then

\\[
\int_0^{T_u}|x(t)|^2dt
=\sum_k|X_k|^2E_k
+\sum_{k\ne m}X_kX_m^*
\int_0^{T_u}s_k(t)s_m^*(t)dt.
\\]

The cross terms vanish for orthogonal subcarriers, leaving

\\[
\int_0^{T_u}|x(t)|^2dt
=\sum_k|X_k|^2E_k.
\\]

Instantaneous samples can still become large when several subcarriers temporarily align in phase. This creates OFDM's high peak-to-average power ratio; orthogonality guarantees zero cross-term **average over the useful symbol**, not constant instantaneous envelope power.

For comparison, the 100 MHz, 30 kHz NR example has

\\[
N_{active}=273\times12=3276
\\]

active subcarriers and resource-grid width

\\[
B_{grid}=3276\times30\text{ kHz}=98.28\text{ MHz}.
\\]

If the same simplified 1 W is divided equally,

\\[
P_{SC}=\frac{1}{3276}=0.3053\text{ mW}
=-5.15\text{ dBm},
\\]

and

\\[
P_{RB}=12P_{SC}=3.663\text{ mW}
=5.64\text{ dBm}.
\\]

Real NR power is not necessarily uniform: scheduling, precoding, power control, DM-RS scaling, muted REs and PA backoff change the allocation. The example isolates the arithmetic of average power across orthogonal tones.

## 5. Why normal CP produces seven LTE symbols in 0.5 ms

The cyclic prefix is a copy of the end of the useful IFFT output placed before the symbol. It provides a guard interval against channel memory and allows the receiver to treat sufficiently contained multipath as circular convolution after discarding the CP.

For LTE normal CP, one 0.5 ms slot contains:

- one symbol whose CP is 160 samples; and
- six symbols whose CP is 144 samples.

The first CP duration is

\\[
T_{CP,long}=160T_s
=5.2083333\ \mu s.
\\]

The regular CP duration is

\\[
T_{CP,regular}=144T_s
=4.6875\ \mu s.
\\]

The first complete OFDM symbol lasts

\\[
T_{sym,long}=2048T_s+160T_s
=2208T_s
=71.875\ \mu s.
\\]

Each of the next six lasts

\\[
T_{sym,regular}=2048T_s+144T_s
=2192T_s
=71.3541667\ \mu s.
\\]

Add all seven:

\\[
\begin{aligned}
T_{slot}
&=(2048+160)T_s
 +6(2048+144)T_s\\
&=(2208+6\times2192)T_s\\
&=15360T_s\\
&=500\ \mu s.
\end{aligned}
\\]

Therefore

\\[
\boxed{7\text{ normal-CP symbols}=0.5\text{ ms LTE slot}.}
\\]

### 5.1 Why one CP is slightly longer

If all seven CPs were 144 samples, the slot would contain

\\[
7(2048+144)=15344\text{ samples}.
\\]

That is 16 samples short of the required 15360-sample slot. Making the first CP

\\[
144+16=160\text{ samples}
\\]

closes the timing gap exactly.

The longer CP is therefore also a frame-alignment correction. It should not be interpreted as the first symbol necessarily experiencing a worse propagation channel.

### 5.2 From seven to fourteen

LTE defines one 1 ms subframe as two consecutive 0.5 ms slots:

\\[
T_{subframe}=2T_{slot}=1\text{ ms}.
\\]

Consequently,

\\[
N_{symb,subframe}=2\times7=14.
\\]

~~~text
LTE normal CP

0 ms                         0.5 ms                         1 ms
|---- slot 0: 7 symbols -----|---- slot 1: 7 symbols ------|
|------------------ one subframe: 14 symbols --------------|
~~~

<div class="mermaid">
flowchart TD
    A[15 kHz SCS] --> B[66.667 µs useful symbol]
    B --> C[Add normal CP]
    C --> D[7 symbols in 0.5 ms LTE slot]
    D --> E[2 slots = 14 symbols in 1 ms subframe]
</div>

## 6. A complete hypothetical 10 kHz design

Now replace 15 kHz with

\\[
\Delta f=10\text{ kHz}.
\\]

Orthogonality requires the minimum useful duration

\\[
T_{u,10}=\frac{1}{10{,}000}=100\ \mu s.
\\]

This is valid OFDM. The difficulty is not orthogonality; the difficulty is fitting the waveform into the chosen frame and scheduling grid.

### 6.1 A concrete 10 kHz FFT grid

Suppose the hypothetical system retains a 2048-point FFT. Its sampling rate would be

\\[
F_{s,10}=2048\times10\text{ kHz}
=20.48\text{ MHz}.
\\]

The sample period would be

\\[
T_{s,10}=\frac{1}{20.48\times10^6}
=48.828125\text{ ns}.
\\]

The useful symbol still contains 2048 samples:

\\[
2048T_{s,10}=100\ \mu s.
\\]

An 18 MHz active grid would require

\\[
\frac{18\text{ MHz}}{10\text{ kHz}}=1800
\\]

active bins, leaving

\\[
2048-1800=248
\\]

unused bins. The comparison is therefore:

| Quantity | 15 kHz LTE grid | Hypothetical 10 kHz grid |
|---|---:|---:|
| FFT size | 2048 | 2048 |
| Sampling rate | 30.72 MHz | 20.48 MHz |
| Useful duration | 66.667 µs | 100 µs |
| Active bins for 18 MHz | 1200 | 1800 |
| Unused FFT bins | 848 | 248 |

The 10 kHz design is implementable, but it produces a different clock, a denser resource grid and much less unused FFT-bin margin at the same FFT size.

### 6.2 Attempt A: ten symbols inside the existing 1 ms interval

Ten useful portions alone consume

\\[
10\times100\ \mu s=1000\ \mu s=1\text{ ms}.
\\]

The remaining time for CP is

\\[
1\text{ ms}-1\text{ ms}=0.
\\]

So the apparently attractive combination “10 kHz and 10 symbols in 1 ms” cannot include a non-zero CP.

### 6.3 Attempt B: keep approximately the LTE normal-CP duration

Suppose every 10 kHz symbol uses a 4.6875 µs CP. One complete symbol lasts

\\[
100+4.6875=104.6875\ \mu s.
\\]

Ten symbols require

\\[
10\times104.6875=1046.875\ \mu s.
\\]

They exceed 1 ms by

\\[
1046.875-1000=46.875\ \mu s.
\\]

If one of the ten symbols instead used the LTE-like 5.2083 µs longer CP, the total would be

\\[
9(104.6875)+(100+5.2083)
=1047.3958\ \mu s.
\\]

The interval is now 4.74% longer than 1 ms.

### 6.4 Attempt C: keep 1 ms and use nine symbols

Nine symbols with a 4.6875 µs CP require

\\[
9(100+4.6875)=942.1875\ \mu s.
\\]

The unused time is

\\[
1000-942.1875=57.8125\ \mu s.
\\]

The designer could distribute this time among CPs, guard periods or another timing structure. If it were divided equally among nine CPs, the average CP would be

\\[
\frac{1000-9(100)}{9}
=11.111\ \mu s.
\\]

That would give nine exactly equal 111.111 µs complete symbols, but CP would occupy 10% of the transmitted interval—larger overhead than LTE normal CP.

### 6.5 Attempt D: keep ten symbols, normal-like CP and the 1 ms boundary

Suppose ten symbols must fit in 1 ms and each must retain 4.6875 µs CP. The useful duration would have to be

\\[
T_u=\frac{1000\ \mu s}{10}-4.6875\ \mu s
=95.3125\ \mu s.
\\]

The corresponding orthogonal SCS would be

\\[
\Delta f=\frac{1}{95.3125\ \mu s}
\approx10.4918\text{ kHz}.
\\]

It would no longer be a 10 kHz waveform.

### 6.6 What the 10 kHz example actually proves

The comparison does **not** prove that 10 kHz is bad. It proves that SCS, CP, symbol count and frame duration cannot be selected independently.

| Requirement | 10 kHz consequence |
|---|---|
| Orthogonality | Valid with 100 µs useful symbol |
| 10 useful symbols in 1 ms | Leaves zero time for CP |
| 10 symbols with 4.6875 µs CP | Requires 1.046875 ms |
| 9 symbols with 4.6875 µs CP | Uses 0.9421875 ms and leaves 57.8125 µs |
| 10 symbols, 4.6875 µs CP, exactly 1 ms | Requires about 10.4918 kHz SCS |

A standards body could build a complete 10 kHz system, but it would need a different timing design, reference-signal mapping, scheduler grid and likely different FFT and clock choices.

## 7. Why 14 is not fundamental: the extended-CP counterexample

LTE extended CP uses

\\[
T_{CP,extended}=512T_s
=16.6667\ \mu s.
\\]

The complete symbol duration becomes

\\[
T_{sym,extended}
=66.6667+16.6667
=83.3334\ \mu s.
\\]

Only six such symbols fit in 0.5 ms:

\\[
6\times83.3333\ \mu s=500\ \mu s.
\\]

Therefore an extended-CP LTE subframe contains

\\[
2\times6=12\text{ symbols},
\\]

not 14.

This is direct evidence that symbol count follows the joint timing and CP design. Fourteen is a standardized normal-CP scheduling structure, not a property required by OFDM.

## 8. How NR inherited and scaled the LTE foundation

NR retained 15 kHz as the base of a power-of-two numerology family:

\\[
\boxed{\Delta f_\mu=15\times2^\mu\text{ kHz}.}
\\]

For the useful duration,

\\[
T_{u,\mu}
=\frac{1}{15\times2^\mu\text{ kHz}}
=\frac{66.6667}{2^\mu}\ \mu s.
\\]

With normal CP, an NR slot contains 14 symbols and has duration

\\[
\boxed{T_{slot,\mu}=\frac{1\text{ ms}}{2^\mu}.}
\\]

| \\(\mu\\) | SCS | Useful symbol \\(T_u\\) | Slots per 1 ms subframe | Slot duration | Normal-CP symbols per slot |
|---:|---:|---:|---:|---:|---:|
| 0 | 15 kHz | 66.667 µs | 1 | 1 ms | 14 |
| 1 | 30 kHz | 33.333 µs | 2 | 0.5 ms | 14 |
| 2 | 60 kHz | 16.667 µs | 4 | 0.25 ms | 14 |
| 3 | 120 kHz | 8.333 µs | 8 | 0.125 ms | 14 |
| 4 | 240 kHz | 4.167 µs | 16 | 0.0625 ms | 14 |

The terminology differs from LTE:

| System | “Slot” with normal CP | 1 ms interval |
|---|---|---|
| LTE | 7 symbols, 0.5 ms | 2 slots, 14 symbols |
| NR at 15 kHz | 14 symbols, 1 ms | 1 slot, 14 symbols |
| NR at 30 kHz | 14 symbols, 0.5 ms | 2 slots, 28 symbols |

NR effectively promoted the LTE 1 ms, 14-symbol normal-CP structure into the \\(\mu=0\\) slot and then scaled the complete structure by powers of two.

### 8.1 A 30 kHz NR numerical example

For \\(\mu=1\\),

\\[
\Delta f=30\text{ kHz},
\\]

so

\\[
T_u=\frac{1}{30\text{ kHz}}
=33.3333\ \mu s.
\\]

Using a 4096-point IFFT,

\\[
F_s=4096\times30\text{ kHz}
=122.88\text{ MHz}.
\\]

At this sample rate, the regular normal CP is 288 samples:

\\[
T_{CP,regular}
=\frac{288}{122.88\times10^6}
=2.34375\ \mu s.
\\]

To make the 0.5 ms slot land exactly on the NR time grid, the first CP in the slot is 352 samples:

\\[
T_{CP,long}
=\frac{352}{122.88\times10^6}
=2.86458\ \mu s.
\\]

The corresponding complete durations are

\\[
T_{sym,regular}=33.3333+2.34375
=35.67708\ \mu s,
\\]

and

\\[
T_{sym,long}=33.3333+2.86458
=36.19792\ \mu s.
\\]

One longer symbol and thirteen regular symbols give

\\[
36.19792+13(35.67708)=500\ \mu s,
\\]

which is exactly one 30 kHz normal-CP slot.

### 8.2 Why power-of-two scaling is useful

The family \\(15\times2^\mu\\) kHz makes timing relationships simple:

- doubling SCS halves useful symbol and CP durations;
- doubling SCS doubles the number of slots in a 1 ms subframe;
- different numerologies periodically align on common time boundaries;
- FFT and sampling-clock families can be reused through powers-of-two scaling; and
- networks can select wider SCS for higher carrier frequencies, Doppler, phase noise or lower latency without abandoning the common frame structure.

NR's study phase explicitly treated SCS as frequency-range dependent and evaluated feasible families rather than assuming one universal spacing.

## 9. What CP does—and what it does not do

The useful duration \\(T_u\\) creates orthogonality in the ideal FFT interval. The CP protects that construction against channel memory.

If the channel impulse response fits inside the CP and the receiver selects the correct FFT window, delayed copies appear as circular convolution. The FFT then converts that convolution into a per-subcarrier multiplication:

\\[
Y[k]=H[k]X[k]+N[k].
\\]

If significant channel energy extends beyond the CP, one symbol contaminates the next and the receiver loses the clean circular-convolution model. Timing error, carrier-frequency offset, Doppler and phase noise can also destroy orthogonality even when the nominal SCS and useful duration are correct.

For NTN, the satellite's large absolute propagation delay is not something CP is intended to cover. Timing advance and scheduling offsets handle bulk path delay. CP is concerned with the residual channel memory and timing uncertainty seen around the selected FFT window.

## 10. Transmitter and receiver implementation

For an \\(N\\)-point OFDM symbol, the transmitter places complex QAM values in frequency bins:

\\[
X[0],X[1],\ldots,X[N-1].
\\]

Unused bins are zero. The IFFT produces one composite time-domain waveform:

\\[
x[n]=\frac{1}{N}\sum_{k=0}^{N-1}
X[k]e^{j2\pi kn/N}.
\\]

The transmitter then prefixes a copy of the last \\(N_{CP}\\) samples, applies DAC/RF processing and transmits one waveform.

At the receiver:

1. timing and frequency synchronization locate the symbol;
2. the CP is removed;
3. the FFT correlates the samples with every conjugated basis tone; and
4. one complex QAM estimate is produced for each active bin.

For an undesired adjacent bin, the discrete correlation contains

\\[
\sum_{n=0}^{N-1}e^{j2\pi n/N}=0.
\\]

The \\(N\\) complex terms are the roots of unity distributed around a complete circle. For the desired bin, the rotations cancel and all \\(N\\) terms add coherently.

## 11. The design cannot be optimized one variable at a time

| Design variable | Increasing it tends to help | Increasing it tends to hurt |
|---|---|---|
| SCS | Doppler/CFO tolerance, phase-noise tolerance, shorter latency | CP efficiency for fixed delay spread, frequency resolution |
| Useful symbol duration | CP efficiency, narrow subcarriers | Doppler/phase variation during the symbol, latency |
| CP duration | Multipath and timing-error tolerance | Spectral/time efficiency |
| Symbols per slot | Time-domain scheduling resolution inside a slot | Control/state complexity if slot duration is fixed |
| FFT size | More bins and bandwidth/frequency resolution | Compute, memory, power and deadline pressure |

The selected waveform must also coexist with:

- HARQ timing;
- TDD switching patterns;
- reference-signal placement;
- random-access occasions;
- scheduler deadlines;
- RF filtering and guard bands;
- oscillator capability; and
- multi-numerology alignment.

This is why replacing 15 kHz with 10 kHz is not a one-line change in a modem. It changes the time-frequency lattice on which PHY and MAC procedures are built.

## 12. Standardized, implementation-specific and open to research

**Standardized:** supported numerologies, time units, frame/subframe/slot structure, CP construction, resource blocks, physical channels and reference-signal mappings.

**Implementation-specific:** FFT architecture, fixed-point scaling, windowing, synchronization estimators, frequency-offset correction, memory layout, clocking, pipeline scheduling and methods for reducing inter-carrier interference.

**Research and optimization:** adaptive numerology selection, mixed-numerology interference cancellation, Doppler-resilient waveforms, windowing/filtering, low-complexity high-resolution synchronization and numerologies for new spectrum or extreme mobility.

## 13. Compact interview answer

> OFDM does not fundamentally require 15 kHz SCS or 14 symbols. Orthogonality only requires the product of SCS and useful symbol duration to be an integer; LTE uses the shortest interval, so \\(T_u=1/\Delta f\\). Fifteen kilohertz gives a 66.667 µs useful symbol and is a practical terrestrial compromise among delay spread, CP overhead, Doppler and frequency-error tolerance, FFT size, sampling clocks and frame timing. With LTE normal CP, one 160-sample CP, six 144-sample CPs and seven 2048-sample useful symbols total exactly 15360 samples, or 0.5 ms at 30.72 MHz. Two such LTE slots form a 1 ms subframe containing 14 symbols. A 10 kHz design is mathematically valid, but its 100 µs useful symbols mean ten useful portions already consume the entire 1 ms, leaving no CP; it therefore needs a different symbol count, CP or frame structure. NR retained 15 kHz as its base and scales SCS by powers of two while keeping 14 normal-CP symbols per scalable slot.

## 14. References

1. ETSI / 3GPP TS 36.211 V8.4.0, [E-UTRA physical channels and modulation](https://www.etsi.org/deliver/etsi_ts/136200_136299/136211/08.04.00_60/ts_136211v080400p.pdf); see Clauses 4, 5.2, 5.6, 6.2 and 6.12 for frame timing, resource blocks and baseband signal generation.
2. ETSI / 3GPP TS 38.211 V18.9.0, [NR physical channels and modulation](https://www.etsi.org/deliver/etsi_ts/138200_138299/138211/18.09.00_60/ts_138211v180900p.pdf); see Clauses 4.1–4.4 and 5.3 for numerologies, slots, resources and OFDM signal generation.
3. ETSI / 3GPP TR 38.912 V19.0.0, [Study on New Radio access technology](https://www.etsi.org/deliver/etsi_tr/138900_138999/138912/19.00.00_60/tr_138912v190000p.pdf); see the frame-structure and RF-feasibility discussions of scalable SCS, symbol alignment, phase noise and FFT size.
4. 3GPP TR 25.814, [Physical layer aspects for evolved UTRA](https://www.3gpp.org/dynareport/25814.htm), the LTE study report preceding the Release 8 physical-layer specification.
5. S. B. Weinstein and P. M. Ebert, [“Data Transmission by Frequency-Division Multiplexing Using the Discrete Fourier Transform”](https://doi.org/10.1109/TCOM.1971.1090705), *IEEE Transactions on Communication Technology*, vol. 19, no. 5, pp. 628–634, 1971.
