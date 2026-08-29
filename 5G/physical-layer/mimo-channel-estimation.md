---
layout: article
title: "MIMO: From the Channel Matrix to NR Channel Estimation"
section: 5G NR
section_url: /5G/
description: Derive MIMO capacity, follow NR reference signals into LS/LMMSE channel estimation, and see how propagation and radio hardware reduce usable spatial rank.
math: true
---

## 1. The problem: antennas do not create capacity by themselves

Multiple-input multiple-output (MIMO) is often summarized as “more antennas give more throughput.” That statement hides the actual engineering problem.

Several transmit antennas can launch several signals at the same time and frequency. Several receive antennas observe mixtures of those signals. The receiver can separate the mixtures only when:

1. the propagation channel provides sufficiently independent spatial dimensions;
2. the receiver has a sufficiently accurate estimate of those dimensions;
3. the transmitter and receiver hardware can preserve them; and
4. the baseband can solve the resulting matrix problem within the slot deadline.

The central object is therefore not the antenna count. It is the **channel matrix**.

~~~text
transmit streams          propagation              receive samples

    x₁ ───────┐          h₁₁  h₁₂                  ┌──── y₁
              ├──────→   h₂₁  h₂₂   ──────────────┤
    x₂ ───────┘                                     └──── y₂
~~~

This article develops three connected questions:

- Why can a MIMO channel carry parallel spatial streams?
- How does an NR receiver learn the channel from known reference signals?
- Which propagation and hardware limits reduce the number of useful spatial dimensions?

## 2. The narrowband MIMO model

For one subcarrier during one interval in which the channel is approximately constant, use the complex baseband model

\\[
\mathbf y=\mathbf H\mathbf x+\mathbf n.
\\]

The dimensions are

\\[
\mathbf x\in\mathbb C^{N_t},\qquad
\mathbf y\in\mathbb C^{N_r},\qquad
\mathbf H\in\mathbb C^{N_r\times N_t}.
\\]

Here:

- \\(N_t\\) is the number of transmit dimensions;
- \\(N_r\\) is the number of receive dimensions;
- \\(h_{ij}\\) is the complex channel from transmit dimension \\(j\\) to receive dimension \\(i\\);
- \\(\mathbf n\sim\mathcal{CN}(\mathbf 0,N_0\mathbf I_{N_r})\\) is circular complex Gaussian noise.

A “dimension” may correspond to a physical antenna, an RF-chain output, an antenna port or an already precoded layer. These are not always the same object in an implementation.

### 2.1 Why this model also applies to OFDM

A wideband multipath channel is frequency selective. OFDM converts it into many approximately flat subcarrier channels after cyclic-prefix removal and the FFT, provided the cyclic prefix covers the relevant channel memory and the channel does not vary too much within one OFDM symbol:

\\[
\mathbf y[k,\ell]
=
\mathbf H[k,\ell]\mathbf x[k,\ell]
+\mathbf n[k,\ell],
\\]

where \\(k\\) is the subcarrier index and \\(\ell\\) is the OFDM-symbol index.

The matrix is therefore a time-frequency surface, not one permanent value. Channel estimation must recover \\(\mathbf H[k,\ell]\\) at reference-signal resource elements and infer it at nearby data resource elements.

## 3. The theoretical result: a matrix channel becomes parallel scalar channels

The compact singular value decomposition (SVD) of a known channel is

\\[
\mathbf H=\mathbf U_r\boldsymbol\Sigma_r\mathbf V_r^{\mathrm H},
\\]

where the columns of \\(\mathbf U_r\in\mathbb C^{N_r\times r}\\) and \\(\mathbf V_r\in\mathbb C^{N_t\times r}\\) are orthonormal and

\\[
\boldsymbol\Sigma_r
=
\operatorname{diag}(\sigma_1,\ldots,\sigma_r),\qquad
r=\operatorname{rank}(\mathbf H).
\\]

Choose the transmitted vector as

\\[
\mathbf x=\mathbf V_r\mathbf s
\\]

and multiply the received vector by \\(\mathbf U_r^{\mathrm H}\\):

\\[
\begin{aligned}
\mathbf z
&=\mathbf U_r^{\mathrm H}\mathbf y\\
&=\mathbf U_r^{\mathrm H}\mathbf H\mathbf V_r\mathbf s
  +\mathbf U_r^{\mathrm H}\mathbf n\\
&=\boldsymbol\Sigma_r\mathbf s+\tilde{\mathbf n}.
\end{aligned}
\\]

The orthonormal receive projection preserves white Gaussian noise in the retained \\(r\\)-dimensional subspace, so

\\[
\tilde{\mathbf n}\sim\mathcal{CN}(\mathbf 0,N_0\mathbf I_r).
\\]

The coupled antenna channel has become \\(r\\) independent scalar subchannels:

\\[
z_i=\sigma_i s_i+\tilde n_i,\qquad i=1,\ldots,r.
\\]

This proves the spatial-eigenmode mechanism. A full-rank \\(4\times4\\) matrix can expose four non-zero singular modes; a rank-one \\(4\times4\\) matrix still exposes only one, regardless of its antenna count.

Using \\(\mathbf V_r\\) as the transmit precoder requires suitable channel knowledge at the transmitter. The SVD still reveals the channel's spatial modes when only the receiver knows \\(\mathbf H\\), but the transmitter cannot generally align its signals to those modes exactly.

## 4. Capacity proof

Assume a deterministic channel \\(\mathbf H\\), perfect channel knowledge at the receiver, channel knowledge available for transmit-covariance design, Gaussian noise and a short-term total transmit-power constraint

\\[
\operatorname{tr}(\mathbf Q)\le P,\qquad
\mathbf Q=\mathbb E[\mathbf x\mathbf x^{\mathrm H}]\succeq0.
\\]

The receiver-only instantaneous-CSI case is separated after the water-filling result.

The mutual information conditioned on \\(\mathbf H\\) is

\\[
I(\mathbf x;\mathbf y\mid\mathbf H)
=h(\mathbf y\mid\mathbf H)-h(\mathbf y\mid\mathbf x,\mathbf H).
\\]

Once \\(\mathbf x\\) is known, the only uncertainty in \\(\mathbf y\\) is \\(\mathbf n\\), hence

\\[
h(\mathbf y\mid\mathbf x,\mathbf H)=h(\mathbf n).
\\]

The receive covariance is

\\[
\mathbf R_y
=
\mathbf H\mathbf Q\mathbf H^{\mathrm H}+N_0\mathbf I_{N_r}.
\\]

For a fixed covariance, a circular complex Gaussian vector maximizes differential entropy. Therefore

\\[
\begin{aligned}
I(\mathbf x;\mathbf y\mid\mathbf H)
&\le
\log_2\det\!\left(
\pi e\left(\mathbf H\mathbf Q\mathbf H^{\mathrm H}+N_0\mathbf I_{N_r}\right)
\right)\\
&\quad-\log_2\det(\pi eN_0\mathbf I_{N_r})\\
&=
\log_2\det\!\left(
\mathbf I_{N_r}+\frac{1}{N_0}\mathbf H\mathbf Q\mathbf H^{\mathrm H}
\right).
\end{aligned}
\\]

Equality is achieved by a zero-mean Gaussian input with covariance \\(\mathbf Q\\). The channel capacity is consequently

\\[
\boxed{
C=
\max_{\mathbf Q\succeq0,\ \operatorname{tr}(\mathbf Q)\le P}
\log_2\det\!\left(
\mathbf I_{N_r}+\frac{1}{N_0}\mathbf H\mathbf Q\mathbf H^{\mathrm H}
\right)
}
\\]

in bits per complex channel use, or bit/s/Hz under the usual normalized signaling-rate and bandwidth convention.

This is the key information-theoretic MIMO result derived by Telatar. It is the exact coding limit for the stated idealized model and an upper benchmark for a practical link—not a direct prediction of NR user throughput.

For a random fading channel, this is instantaneous capacity under per-realization transmitter and receiver CSI and the stated short-term power constraint. Ergodic capacity, outage capacity and finite-codeword performance require additional assumptions about channel evolution, coding and CSI availability.

### 4.1 Optimal power allocation

Write the input covariance in the right-singular-vector basis:

\\[
\mathbf Q
=
\mathbf V_r\operatorname{diag}(p_1,\ldots,p_r)\mathbf V_r^{\mathrm H}.
\\]

The determinant becomes

\\[
C=\sum_{i=1}^{r}
\log_2\left(1+\frac{p_i\sigma_i^2}{N_0}\right),
\qquad
\sum_i p_i\le P.
\\]

The Karush-Kuhn-Tucker conditions give water-filling:

\\[
p_i=
\left(\mu-\frac{N_0}{\sigma_i^2}\right)^+,
\\]

where \\(\mu\\) is chosen so that the allocated powers sum to \\(P\\). Strong modes receive more power; modes below the water level receive none.

If the transmitter has no instantaneous channel knowledge and uses equal power,

\\[
\mathbf Q=\frac{P}{N_t}\mathbf I_{N_t},
\\]

then

\\[
\boxed{
I_{\text{eq}}(\mathbf H)=
\log_2\det\left(
\mathbf I_{N_r}
+\frac{\rho}{N_t}\mathbf H\mathbf H^{\mathrm H}
\right),\qquad
\rho=\frac{P}{N_0}.
}
\\]

For receiver-only instantaneous CSI and an isotropic fading law such as i.i.d. fading, equal power is optimal and \\(\mathbb E_{\mathbf H}[I_{\text{eq}}(\mathbf H)]\\) is the ergodic capacity. Equal power is not universally optimal when the transmitter knows useful channel statistics, for example persistent spatial correlation.

### 4.2 Why rank determines the high-SNR multiplexing gain

Let \\(\lambda_i=\sigma_i^2\\) be the non-zero eigenvalues of \\(\mathbf H\mathbf H^{\mathrm H}\\). With equal power,

\\[
I_{\text{eq}}(\mathbf H)=\sum_{i=1}^{r}
\log_2\left(1+\frac{\rho}{N_t}\lambda_i\right).
\\]

At high SNR,

\\[
I_{\text{eq}}(\mathbf H)
\approx
r\log_2\rho
+\sum_{i=1}^{r}\log_2\left(\frac{\lambda_i}{N_t}\right).
\\]

The slope with respect to \\(\log_2\rho\\) is \\(r\\). Since

\\[
r\le\min(N_t,N_r),
\\]

the often-quoted \\(\min(N_t,N_r)\\) spatial-multiplexing gain requires a full-rank channel. Antenna count supplies the *maximum possible* rank; propagation supplies the actual rank.

### 4.3 A fair \\(2\times2\\) comparison

Consider two channels with the same squared Frobenius norm:

\\[
\mathbf H_{\text{orth}}=
\begin{bmatrix}
1&0\\
0&1
\end{bmatrix},
\qquad
\mathbf H_{\text{corr}}=
\frac{1}{\sqrt2}
\begin{bmatrix}
1&1\\
1&1
\end{bmatrix}.
\\]

The first has two singular values equal to one. The second has one non-zero singular value \\(\sqrt2\\). Their equal-power mutual informations are

\\[
I_{\text{eq,orth}}
=2\log_2\left(1+\frac{\rho}{2}\right),
\\]

\\[
I_{\text{eq,corr}}
=\log_2(1+\rho).
\\]

At high SNR, the orthogonal channel grows with two spatial degrees of freedom while the correlated channel grows with one. The rank-one channel may still provide coherent array gain; what it loses is the second independent stream.

## 5. What MIMO can trade

The same antennas can be used for different objectives:

| Objective | Mechanism | Primary benefit | Main requirement |
|---|---|---|---|
| Array gain | Add signals coherently | Higher received SNR | Phase-aligned channel knowledge |
| Diversity | Send redundancy across independently fading paths | Lower outage/error probability | Independent or weakly correlated paths |
| Spatial multiplexing | Send independent streams on distinct modes | Higher spectral efficiency | Sufficient channel rank and per-stream SINR |
| Multi-user MIMO | Spatially separate different UEs | Concurrent users on the same resources | Accurate CSI, scheduling and manageable inter-user interference |

These gains are not all maximized simultaneously. Sending more layers divides power, increases receiver complexity and can place data on weak singular modes. A scheduler therefore chooses rank, precoder, modulation and coding jointly rather than always selecting the largest possible layer count.

## 6. Channel estimation from known symbols

The receiver cannot invert or equalize \\(\mathbf H\\) unless it has an estimate. Suppose \\(T_p\\) known pilot vectors form

\\[
\mathbf X_p\in\mathbb C^{N_t\times T_p}
\\]

and the observations are

\\[
\mathbf Y_p=\mathbf H\mathbf X_p+\mathbf N_p.
\\]

### 6.1 Least-squares estimate

The least-squares (LS) estimate minimizes

\\[
J(\widehat{\mathbf H})
=
\left\|
\mathbf Y_p-\widehat{\mathbf H}\mathbf X_p
\right\|_{\mathrm F}^2.
\\]

Setting its matrix derivative to zero gives

\\[
\widehat{\mathbf H}_{\text{LS}}\mathbf X_p\mathbf X_p^{\mathrm H}
=
\mathbf Y_p\mathbf X_p^{\mathrm H}.
\\]

If \\(\mathbf X_p\mathbf X_p^{\mathrm H}\\) is invertible,

\\[
\boxed{
\widehat{\mathbf H}_{\text{LS}}
=
\mathbf Y_p\mathbf X_p^{\mathrm H}
\left(\mathbf X_p\mathbf X_p^{\mathrm H}\right)^{-1}.
}
\\]

Invertibility requires \\(\operatorname{rank}(\mathbf X_p)=N_t\\), so this conventional training model needs at least \\(N_t\\) independent pilot dimensions. In NR, those dimensions represent distinguishable effective channels associated with DM-RS antenna ports. Layers are mapped to ports, but neither a layer nor a port need correspond one-to-one with a physical array element.

For orthogonal equal-energy pilots,

\\[
\mathbf X_p\mathbf X_p^{\mathrm H}=E_p\mathbf I_{N_t},
\\]

so

\\[
\widehat{\mathbf H}_{\text{LS}}
=
\frac{1}{E_p}\mathbf Y_p\mathbf X_p^{\mathrm H}.
\\]

Orthogonality separates antenna-port channels cleanly, but pilot time-frequency resources are finite. Non-orthogonal pilot reuse—or loss of designed orthogonality through interference or channel variation—introduces estimation ambiguity.

### 6.2 LMMSE estimate

LS needs no channel statistics but treats every estimate independently. A linear minimum mean-square-error (LMMSE) estimator exploits channel and noise covariance.

Vectorize the pilot model:

\\[
\mathbf z
=\operatorname{vec}(\mathbf Y_p)
=
\underbrace{\left(\mathbf X_p^{\mathsf T}\otimes\mathbf I_{N_r}\right)}_{\mathbf A}
\mathbf h+\mathbf n,
\qquad
\mathbf h=\operatorname{vec}(\mathbf H).
\\]

For a zero-mean channel with covariance \\(\mathbf R_h\\), white-noise covariance \\(N_0\mathbf I_{N_r T_p}\\) and \\(\mathbb E[\mathbf h\mathbf n^{\mathrm H}]=\mathbf 0\\),

\\[
\boxed{
\widehat{\mathbf h}_{\text{LMMSE}}
=
\mathbf R_h\mathbf A^{\mathrm H}
\left(
\mathbf A\mathbf R_h\mathbf A^{\mathrm H}+N_0\mathbf I_{N_r T_p}
\right)^{-1}\mathbf z.
}
\\]

LMMSE can suppress noise and exploit time, frequency and spatial correlation. Its cost is covariance knowledge, matrix operations, memory and sensitivity to a mismatched statistical model.

## 7. The NR correction: known resource elements, not normally known slots

In NR with normal cyclic prefix, a slot contains 14 OFDM symbols. A resource element (RE) is one subcarrier in one OFDM symbol. NR normally places deterministic reference-signal values on selected REs within configured or scheduled resources; it does **not** reserve every channel-estimation opportunity as a whole slot whose contents are known.

Those reference symbols are not an unlimited promise that the channel stays unchanged. For PDSCH, TS 38.211 Clause 7.2 permits a PDSCH-symbol channel to be inferred from same-port DM-RS only when both are within the same scheduled PDSCH resource, slot and precoding resource-block group. For PUSCH, Clause 6.2 defines same-slot inferability for the basic no-hopping, no-repetition-Type-B case; otherwise the boundary follows the applicable repetition, frequency hop or configured DM-RS-bundling window. Reusing an estimate outside those bounds requires another applicable assumption or an implementation model of channel continuity.

One valid single-layer example—a mapping-type-A PDSCH spanning all 14 symbols, \\(l_0=2\\), single-symbol DM-RS and `dmrs-AdditionalPosition=pos1`—looks like:

~~~text
OFDM symbol       0  1  2  3  4  5  6  7  8  9 10 11 12 13
scheduled PDSCH   D  D  R  D  D  D  D  D  D  D  D  R  D  D
                       ↑                          ↑
                 front-loaded                additional
                    DM-RS                       DM-RS

D = data-bearing REs in the scheduled allocation
R = some REs in a DM-RS-bearing symbol, not necessarily the whole symbol
~~~

Actual positions depend on mapping type, allocation duration, DM-RS configuration, antenna ports and higher-layer/DCI configuration. Even a “DM-RS symbol” generally contains a frequency-domain pattern of DM-RS REs alongside other usable or reserved REs.

### 7.1 PDSCH and PUSCH DM-RS: estimate the data-bearing channel

The demodulation reference signal (DM-RS) is tied to a physical channel:

- downlink PDSCH DM-RS lets the UE estimate the channel needed to demodulate its PDSCH;
- uplink PUSCH DM-RS lets the gNB estimate the channel needed to demodulate that UE's PUSCH.

For one DM-RS RE with known non-zero symbol \\(x_p[k,\ell]\\),

\\[
y_p[k,\ell]
=
h[k,\ell]x_p[k,\ell]+n[k,\ell],
\\]

and the scalar LS estimate is simply

\\[
\widehat h_{\text{LS}}[k,\ell]
=
\frac{y_p[k,\ell]}{x_p[k,\ell]}.
\\]

In MIMO, NR uses antenna ports, frequency patterns and code-division multiplexing to make the reference observations distinguishable. The receiver de-spreads the appropriate port, estimates the channel on DM-RS REs, then interpolates or filters the result over the scheduled data REs.

For downlink precoding \\(\mathbf W\\),

\\[
\mathbf y=\mathbf H\mathbf W\mathbf s+\mathbf n.
\\]

The PDSCH DM-RS follows the relevant antenna-port/precoding relationship, so the UE can estimate the **effective channel**

\\[
\mathbf H_{\text{eff}}=\mathbf H\mathbf W
\\]

needed for demodulation without necessarily reconstructing every element-to-element coefficient of the physical array.

NR supports front-loaded DM-RS, mapping types A and B, single- or double-symbol DM-RS, two frequency-domain configuration types and configured additional DM-RS positions. Additional positions can improve tracking in a time-varying channel but consume REs that could otherwise carry data.

### 7.2 CSI-RS: measure the downlink for adaptation

Channel-state-information reference signals (CSI-RS) serve a different purpose from data DM-RS. Configured non-zero-power CSI-RS (NZP-CSI-RS) resources let the UE measure properties used for channel-state reporting, beam selection and link adaptation. CSI-RS resources and CSI reports are configured separately; each has applicable periodic, semi-persistent and aperiodic procedures.

A simplified control loop is

~~~text
gNB transmits configured NZP-CSI-RS
              ↓
UE estimates/measures the downlink channel
              ↓
UE derives configured CSI quantities
              ↓
RI / PMI / CQI and related reports
              ↓
gNB selects rank, precoder, MCS and scheduling
~~~

Here RI is rank indication, PMI is precoding-matrix indication and CQI is channel-quality indication. They are quantized protocol reports, not a perfect copy of the continuous channel matrix.

### 7.3 SRS: sound the uplink

The sounding reference signal (SRS) is a separately configured uplink reference signal rather than a PUSCH data-demodulation pilot. It lets the gNB measure the uplink over configured time-frequency resources, supporting uplink scheduling, beam management and other channel-dependent decisions.

In time-division duplex (TDD), the physical propagation channel is reciprocal within the coherence interval. A gNB implementation may therefore use uplink measurements to help design downlink spatial processing. This does **not** mean raw uplink and downlink RF measurements are identical:

\\[
\mathbf H_{\text{UL,meas}}
=
\mathbf R_{\text{gNB}}\mathbf H_{\text{prop}}\mathbf T_{\text{UE}},
\\]

\\[
\mathbf H_{\text{DL,meas}}
=
\mathbf R_{\text{UE}}\mathbf H_{\text{prop}}^{\mathsf T}\mathbf T_{\text{gNB}}.
\\]

The transmit and receive RF responses \\(\mathbf T\\) and \\(\mathbf R\\) are not naturally reciprocal. Reciprocity-based coherent downlink precoding requires compensation for their relative responses, especially across the gNB array; 3GPP does not prescribe the calibration algorithm.

In frequency-division duplex (FDD), uplink and downlink use different carrier frequencies. Direct instantaneous reciprocity cannot generally replace downlink measurement and feedback.

### 7.4 PT-RS: track phase, not the full channel

Phase-tracking reference signals (PT-RS) help a receiver follow phase evolution such as common phase error, which becomes more important at high carrier frequency and with oscillator phase noise. PT-RS complements DM-RS; it is not a substitute for DM-RS-based effective-channel estimation.

### 7.5 What 3GPP standardizes—and what it leaves to the modem

3GPP specifies reference-signal sequence generation, antenna ports, resource mapping, configuration and the receiver assumptions needed for interoperable operation. It does not prescribe one universal LS, LMMSE, neural or interpolation implementation.

The following receiver chain is therefore an **engineering implementation**, not a normative algorithm:

~~~text
known RS generation and configuration
                 ↓
extract received RS resource elements
                 ↓
port separation / de-spreading
                 ↓
LS estimates at pilot locations
                 ↓
denoising + time/frequency interpolation
                 ↓
effective channel and noise/interference estimates
                 ↓
MIMO equalization or CSI measurement/reporting
~~~

## 8. Why channel estimation fails to reach the theorem

The capacity proof assumed that the receiver knows \\(\mathbf H\\). An NR modem only has \\(\widehat{\mathbf H}\\). Write

\\[
\mathbf H=\widehat{\mathbf H}+\mathbf E,
\\]

where \\(\mathbf E\\) is the estimation error. Then

\\[
\mathbf y
=
\widehat{\mathbf H}\mathbf x
+\underbrace{\mathbf E\mathbf x+\mathbf n}_{\text{effective disturbance}}.
\\]

The error is multiplied by the transmitted signal. It therefore acts as signal-dependent interference and damages stream separation precisely when the detector relies on accurate spatial nulls.

In a simplified block-fading model with \\(T_c\\) usable time-frequency dimensions and \\(T_p\\) pilot dimensions, a useful overhead accounting is

\\[
\mathrm{SE}_{\text{net}}
\approx
\left(1-\frac{T_p}{T_c}\right)
\sum_i\log_2(1+\mathrm{SINR}_i).
\\]

This is an engineering model, not an NR normative formula. It exposes the basic tension: more pilot dimensions can improve estimation, but they leave fewer dimensions for payload. When Doppler and delay spread shrink the coherence region, that trade-off becomes more severe.

### 8.1 Time selectivity and channel aging

If the channel changes between a reference symbol at \\(\ell_p\\) and data at \\(\ell_d\\),

\\[
\mathbf H[k,\ell_d]\ne\mathbf H[k,\ell_p].
\\]

High UE speed, high carrier frequency and moving scatterers shorten coherence time. More DM-RS positions reduce the interpolation distance, but increase overhead.

### 8.2 Frequency selectivity

Large delay spread shortens coherence bandwidth. A sparse pilot pattern may miss rapid frequency variation, while a dense pattern consumes more subcarriers. Interpolation also becomes biased if its assumed delay profile is wrong.

### 8.3 Pilot interference and finite orthogonality

Only a finite number of orthogonal pilot dimensions fit in a coherence block. Other layers, UEs, cells or beams can leak into the observation. The estimator then learns a mixture rather than the desired channel. Increasing array size does not automatically remove coherent contamination in the estimate.

### 8.4 CSI quantization and delay

Downlink adaptation uses measurements, codebooks and delayed reports. A precoder chosen from a finite codebook cannot represent every singular-vector matrix. By the time the report is applied, mobility may have changed the channel.

### 8.5 Weak singular values

When the estimated channel has full column rank, zero-forcing detection uses, in one form,

\\[
\mathbf W_{\text{ZF}}
=
\left(\widehat{\mathbf H}^{\mathrm H}\widehat{\mathbf H}\right)^{-1}
\widehat{\mathbf H}^{\mathrm H}.
\\]

If \\(\widehat{\mathbf H}\\) is ill-conditioned, the inverse amplifies noise and estimation error along weak singular directions. For the nominal model that treats \\(\widehat{\mathbf H}\\) as exact and uses \\(\mathbf x\sim\mathcal{CN}(\mathbf 0,E_s\mathbf I_{N_s})\\), MMSE regularization reduces that amplification:

\\[
\mathbf W_{\text{MMSE}}
=
\left(
\widehat{\mathbf H}^{\mathrm H}\widehat{\mathbf H}
+\frac{N_0}{E_s}\mathbf I_{N_s}
\right)^{-1}
\widehat{\mathbf H}^{\mathrm H}.
\\]

The price is residual inter-stream interference. A robust conditional LMMSE receiver would also account for the covariance of \\(\mathbf E\mathbf x\\); the displayed textbook filter does not. A nominal rank of four can therefore support fewer than four useful layers at the current SNR and estimation quality.

## 9. Hardware limits that reduce practical MIMO capability

The capacity formula treats \\(\mathbf x\\), \\(\mathbf y\\) and \\(\mathbf H\\) as ideal numerical quantities. A radio must create and observe them through non-ideal circuits.

A useful first-order limit on independently controlled streams is

\\[
N_s
\le
\min\!\left(
\operatorname{rank}(\mathbf H_{\text{phys}}),
N_{\text{RF,tx}},
N_{\text{RF,rx}}
\right).
\\]

Here \\(\mathbf H_{\text{phys}}\\) is the element-domain propagation channel before analog RF precoding or combining. Pilot identifiability, singular-value strength, standardized layer limits, scheduling and real-time processing can reduce \\(N_s\\) further.

### 9.1 Antenna elements are not RF chains

A fully digital array needs a usable transmit/receive chain and data-converter path for every independently processed antenna signal. Cost, area, power and thermal limits often make the number of RF chains smaller than the number of radiating elements.

A hybrid array applies an analog network before or after a smaller digital MIMO stage:

~~~text
N_s digital streams → N_RF RF chains → analog network → M antennas

              usually N_s ≤ N_RF < M
~~~

The \\(M\\) elements can still provide array gain, but the number of simultaneously controllable digital spatial dimensions is constrained by \\(N_{\text{RF}}\\). In common phase-shifter-based hybrids, phase-only weights, finite phase resolution, insertion loss and restricted connectivity further reduce the set of realizable precoders. Switch, lens and true-time-delay networks impose different constraints.

### 9.2 Aperture, correlation and mutual coupling

Closely spaced antennas can observe strongly correlated channels. Mutual coupling changes element impedance, embedded radiation patterns and radiation efficiency. Its effect is not monotonic: coupling may reduce correlation while also reducing efficiency, so the net spatial-channel benefit must be evaluated with both effects. The physical aperture also limits angular resolution.

For a uniform linear array with approximately half-wavelength spacing,

\\[
D\approx(N-1)\frac{\lambda}{2}.
\\]

At low carrier frequency, a large \\(N\\) requires a physically large aperture. In a compact UE, adding elements without adding aperture can increase correlation more than useful rank. At millimetre-wave frequency, many elements fit in a small area, but blockage, sparse angular paths and RF distribution loss can become limiting.

### 9.3 Power-amplifier nonlinearity

OFDM has a high peak-to-average power ratio. A power amplifier operated near saturation clips or compresses peaks, producing in-band distortion, increased error-vector magnitude and out-of-band emissions. Backing off improves linearity but reduces power efficiency.

In an array, gain and phase mismatch between PA paths distort the intended precoder. Nonlinear distortion can also combine directionally, so “many low-power PAs” does not make distortion disappear.

### 9.4 ADC and DAC limits

Wide bandwidth, many RF chains and high resolution multiply converter and sample-transport power. A common first-order intuition for some converter families is

\\[
P_{\text{ADC}}\propto f_s 2^{b_{\text{eff}}},
\\]

where \\(f_s\\) is sampling rate and \\(b_{\text{eff}}\\) is effective resolution, approximately under a fixed converter figure of merit. This is a technology-dependent scaling heuristic, not a universal device law.

Reducing effective resolution saves power and data movement but adds quantization distortion, reduces dynamic range and makes strong interferers harder to tolerate. The receiver may then be quantization-limited before the spatial detector reaches the thermal-noise limit assumed by theory.

### 9.5 Phase noise, carrier offset and clock distribution

Oscillator phase noise rotates constellation points and can destroy coherent combining. A common local oscillator may create largely common phase error; independent or distributed oscillators can create relative phase drift across antenna paths. PT-RS primarily helps track the effective common phase evolution seen on a configured port. It cannot separately recover differential drift that has already altered the transmitted or received beam across RF branches; oscillator coherence and calibration remain necessary.

Wideband analog phase shifters introduce another effect: a fixed phase shift corresponds to different delays at different frequencies. A beam aligned near the centre frequency can point differently near a band edge—**beam squint**—reducing wideband array gain and making one analog beam imperfect across all OFDM subcarriers.

### 9.6 TDD calibration

Propagation reciprocity is valuable only after estimating the relative transmit/receive response of the antenna paths. Temperature, component aging, gain-state changes and oscillator drift can invalidate calibration. Calibration therefore consumes measurements, processing time and operational complexity.

### 9.7 Baseband compute, memory and deadline

For every scheduled subband or subcarrier, a receiver may need to:

- estimate several port-to-antenna channels;
- interpolate in time and frequency;
- form Gram matrices;
- compute or approximate inverses;
- detect layers and estimate soft bits;
- finish before HARQ and scheduling deadlines.

A direct inverse for an \\(N_s\times N_s\\) matrix scales roughly as \\(O(N_s^3)\\), although practical architectures use factorizations, reuse, iteration and fixed dimensions. Large bandwidth and many receive antennas also create memory-bandwidth and data-movement costs that can dominate arithmetic.

Fixed-point precision saves area and power but adds quantization error. Deep pipelines improve throughput but add latency. A theoretically superior estimator may therefore lose to a simpler estimator that meets the real-time budget.

## 10. Ideal theorem versus deployed link

| Ideal capacity assumption | Practical NR/HW issue | Observable consequence |
|---|---|---|
| Perfect \\(\mathbf H\\) at the receiver | Noisy pilots, interpolation and channel aging | Residual interference and wrong soft metrics |
| Perfect or current CSI at transmitter | Quantized codebook feedback, delay or calibration error | Precoder mismatch and lost array/nulling gain |
| Strong, well-conditioned spatial modes | Correlation, unfavourable line-of-sight geometry, limited aperture or sparse paths | Fewer usable layers than antennas |
| One RF chain per antenna | Hybrid/analog architecture | Fewer digital dimensions and constrained beams |
| Linear, phase-coherent RF | PA distortion, phase noise, IQ/gain/phase mismatch | EVM, spectral regrowth and imperfect combining |
| Infinite numerical precision | ADC/DAC and fixed-point quantization | Distortion floor and reduced dynamic range |
| Unlimited computation | Matrix, memory and slot deadlines | Approximate algorithms and restricted rank |

The number advertised as “64T64R,” the number of antenna ports, the number of RF chains, the channel rank and the number of scheduled layers are therefore different quantities.

## 11. The main design trade-offs

### Reference-signal density versus payload

More pilot REs improve tracking and port separation but reduce data REs. The optimum depends on Doppler, delay spread, SNR, rank and estimator quality.

### More layers versus stronger layers

Activating a weak singular mode increases nominal rank but divides power and can increase error rate. At modest SNR, beamforming one or two strong modes may outperform maximum-rank transmission.

### Digital flexibility versus RF power

Fully digital beamforming offers per-subcarrier control and the richest MIMO processing. Hybrid beamforming lowers converter and RF-chain count but constrains the achievable precoder and complicates wideband estimation.

### TDD reciprocity versus calibration

TDD can avoid scaling full downlink feedback with a large transmit array, but requires coherence, uplink training and calibrated RF paths. FDD avoids the same reciprocity assumption but makes CSI acquisition and feedback scale poorly as the spatial dimension grows.

### Better estimation versus implementation cost

LMMSE, iterative and model-based estimators can outperform LS, but require statistics, matrix operations and memory. A modem must optimize block-error rate per joule and per unit latency, not estimator MSE alone.

## 12. Standardized, implemented and still researched

**Standardized by 3GPP:** NR slot/resource-grid structure; DM-RS, CSI-RS, SRS and PT-RS sequences and mappings; antenna-port relationships; CSI configuration/reporting frameworks; supported MIMO procedures and RF conformance requirements.

**Receiver/vendor implementation:** LS/LMMSE or another channel estimator; interpolation and denoising; covariance tracking; detector architecture; fixed-point precision; calibration algorithm; compute scheduling; the partition between digital and analog beamforming.

**Active research:** low-overhead CSI for very large arrays; high-mobility prediction; near-field and wideband array models; low-resolution data converters; joint calibration and estimation; learning-assisted estimators that generalize outside their training distribution; hardware-aware precoding; scalable cell-free/distributed MIMO synchronization.

## 13. Open engineering questions

1. How should DM-RS density adapt jointly to Doppler, delay spread, selected rank and decoder confidence?
2. Can a receiver expose channel-estimation uncertainty directly to the detector and LDPC decoder instead of treating \\(\widehat{\mathbf H}\\) as exact?
3. When does an additional antenna element create a new spatial mode, and when does it only sample the same aperture more densely?
4. How should CSI feedback be compressed for wideband, high-rank FDD arrays without making the report stale?
5. Which calibration observables best predict downlink beamforming loss under temperature and gain-state changes?
6. How should hybrid arrays estimate per-element impairments that are hidden behind a smaller number of RF chains?
7. What is the best accuracy-per-joule estimator under a hard slot-processing deadline?
8. Can channel prediction remain reliable when blockers, beams and scattering clusters change discontinuously?

## 14. References

1. I. E. Telatar, [“Capacity of Multi-antenna Gaussian Channels”](https://doi.org/10.1002/ett.4460100604), *European Transactions on Telecommunications*, vol. 10, no. 6, pp. 585–595, 1999.
2. D. Tse and P. Viswanath, [*Fundamentals of Wireless Communication*](https://stanford.edu/~dntse/wireless_book.html), Cambridge University Press, 2005; see Chapters 7–8 and Appendix B.
3. ETSI / 3GPP TS 38.211 V18.9.0, [NR physical channels and modulation](https://www.etsi.org/deliver/etsi_ts/138200_138299/138211/18.09.00_60/ts_138211v180900p.pdf); see Clauses 4.3.2, 4.4, 6.2, 6.4.1, 7.2 and 7.4.1.
4. ETSI / 3GPP TS 38.214 V18.10.0, [NR physical-layer procedures for data](https://www.etsi.org/deliver/etsi_ts/138200_138299/138214/18.10.00_60/ts_138214v181000p.pdf); see Clauses 5.1/5.2 for downlink procedures and Clause 6.2 for uplink sounding.
5. ETSI / 3GPP TS 38.331 V18.10.0, [NR Radio Resource Control protocol](https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/18.10.00_60/ts_138331v181000p.pdf); see the CSI measurement, DM-RS and SRS configuration information elements.
6. ETSI / 3GPP TS 38.104, [NR base-station radio transmission and reception](https://www.etsi.org/deliver/etsi_ts/138100_138199/138104/), including transmitter/receiver, EVM and OTA requirements.
7. E. Björnson, J. Hoydis and L. Sanguinetti, [*Massive MIMO Networks: Spectral, Energy, and Hardware Efficiency*](https://massivemimobook.com/wp/), *Foundations and Trends in Signal Processing*, vol. 11, nos. 3–4, 2017, doi: 10.1561/2000000093.
8. E. Björnson, J. Hoydis, M. Kountouris and M. Debbah, [“Massive MIMO Systems with Non-Ideal Hardware: Energy Efficiency, Estimation, and Capacity Limits”](https://doi.org/10.1109/TIT.2014.2354403), *IEEE Transactions on Information Theory*, vol. 60, no. 11, pp. 7112–7139, 2014.
9. R. W. Heath Jr. et al., [“An Overview of Signal Processing Techniques for Millimeter Wave MIMO Systems”](https://doi.org/10.1109/JSTSP.2016.2523924), *IEEE Journal of Selected Topics in Signal Processing*, vol. 10, no. 3, pp. 436–453, 2016.
10. J. Zhang, X. Yu and K. B. Letaief, [“Hybrid Beamforming for 5G and Beyond Millimeter-Wave Systems: A Holistic View”](https://doi.org/10.1109/OJCOMS.2019.2959595), *IEEE Open Journal of the Communications Society*, vol. 1, pp. 77–91, 2020.
11. R. Rogalin et al., [“Scalable Synchronization and Reciprocity Calibration for Distributed Multiuser MIMO”](https://doi.org/10.1109/TWC.2014.030314.130474), *IEEE Transactions on Wireless Communications*, vol. 13, no. 4, pp. 1815–1831, 2014.
12. R. H. Walden, [“Analog-to-Digital Converter Survey and Analysis”](https://doi.org/10.1109/49.761034), *IEEE Journal on Selected Areas in Communications*, vol. 17, no. 4, pp. 539–550, 1999.
13. O. Edfors et al., [“OFDM Channel Estimation by Singular Value Decomposition”](https://doi.org/10.1109/26.701321), *IEEE Transactions on Communications*, vol. 46, no. 7, pp. 931–939, 1998.
14. B. Hassibi and B. M. Hochwald, [“How Much Training Is Needed in Multiple-Antenna Wireless Links?”](https://doi.org/10.1109/TIT.2003.809594), *IEEE Transactions on Information Theory*, vol. 49, no. 4, pp. 951–963, 2003.
15. A. S. Y. Poon, R. W. Brodersen and D. N. C. Tse, [“Degrees of Freedom in Multiple-Antenna Channels: A Signal Space Approach”](https://doi.org/10.1109/TIT.2004.840892), *IEEE Transactions on Information Theory*, vol. 51, no. 2, pp. 523–536, 2005.
16. P.-S. Kildal and K. Rosengren, [“Correlation and Capacity of MIMO Systems and Mutual Coupling, Radiation Efficiency, and Diversity Gain of Their Antennas: Simulations and Measurements in a Reverberation Chamber”](https://doi.org/10.1109/MCOM.2004.1367562), *IEEE Communications Magazine*, vol. 42, no. 12, pp. 104–112, 2004.
17. C. Möllén et al., [“Spatial Characteristics of Distortion Radiated from Antenna Arrays with Transceiver Nonlinearities”](https://doi.org/10.1109/TWC.2018.2861872), *IEEE Transactions on Wireless Communications*, vol. 17, no. 10, pp. 6663–6679, 2018.
