---
layout: article
title: NR NTN — From Satellite State to Radio Link
section: NR NTN
section_url: /NTN/
description: How 5G NR operates through satellites, how a UE tracks satellite position and velocity, and why GEO and LEO require different timing, Doppler and mobility strategies.
math: true
---

## 1. The problem: NR was designed around a nearly stationary cell

Terrestrial NR normally assumes that the base station position is fixed, propagation time is short, and most relative motion comes from the UE. A satellite link reverses several of those assumptions:

- the radio platform may travel at several kilometres per second;
- propagation delay can be milliseconds to hundreds of milliseconds;
- delay and Doppler vary across a large beam footprint;
- a beam, satellite and gateway may each change while a session remains active;
- free-space loss, UE power and satellite effective isotropic radiated power constrain the link budget.

The engineering question is therefore not simply whether an NR waveform can reach a satellite. It is whether NR timing, frequency synchronization, random access, HARQ, mobility and network architecture can remain coherent while the geometry changes.

## 2. NTN and NR NTN are not synonyms

**Non-terrestrial network (NTN)** is the broad system category: a network, or part of one, whose access involves an airborne or spaceborne platform. It can include GEO, MEO and LEO satellites as well as high-altitude platforms, and it does not imply a particular radio interface. Proprietary satellite broadband, satellite IoT and satellite backhaul can all be NTN.

**NR NTN** is the 3GPP adaptation of the 5G New Radio access technology for non-terrestrial operation. Release 17 established the first normative NR NTN feature set. It reuses the 5G system and NR protocol stack while adding satellite-specific RF requirements and procedures for timing, Doppler, mobility and system information.

| Question | Generic NTN | NR NTN |
|---|---|---|
| What does the name identify? | A non-terrestrial network category | A 3GPP NR radio-access solution for NTN |
| Air interface | Any standardized or proprietary waveform | 5G NR with NTN-specific extensions |
| Core integration | Implementation-dependent | Designed for integration with the 5G system |
| Terminal assumptions | May require a proprietary terminal | Defined NR UE capabilities and satellite-access RF requirements |
| Interoperability | System-specific | Based on 3GPP specifications and conformance requirements |

NR NTN should also be kept distinct from **IoT NTN**, which applies NTN support to LTE-based NB-IoT/eMTC rather than the NR air interface.

## 3. Existing NR NTN architecture

The Release 17 baseline is a transparent, or “bent-pipe,” satellite payload:

```text
 UE ── service link ── satellite payload ── feeder link ── NTN gateway ── gNB ── 5GC
```

The payload frequency-converts and amplifies/forwards the radio signal; the gNB remains on the ground. A regenerative payload instead terminates some or all radio protocols on board. Regenerative architectures are an important evolution path, but they must not be assumed when explaining the Release 17 baseline.

The two radio paths matter geometrically:

1. **Service link:** UE to satellite.
2. **Feeder link:** satellite to NTN gateway.

The total network-side timing term can therefore contain more than the UE-to-satellite delay alone.

## 4. Satellite tracking begins with a timestamped state

The commonly used acronym is **ECEF: Earth-Centered, Earth-Fixed**, not “ECFS.” Its origin is at Earth's centre of mass and its axes rotate with Earth:

- (x): from Earth's centre toward the equator at longitude (0^\circ);
- (y): toward the equator at longitude (90^\circ\) east;
- (z): toward the conventional north pole.

The conventional Cartesian state order is

\[
\mathbf{s}(t_0)=
[x,\;y,\;z,\;v_x,\;v_y,\;v_z]^{\mathsf T},
\]

where position is in metres, velocity is in metres per second, and both correspond to the same epoch (t_0). An (x,z,y) ordering is not another coordinate system; it is a field-ordering choice that must be documented and converted before using standard equations.

In 3GPP RRC signalling, `ephemerisInfo` can describe the satellite using either a position/velocity state vector or orbital parameters. The state-vector position and velocity are expressed in ECEF; the orbital-element representation is associated with an inertial frame. `epochTime` binds the ephemeris to a radio time. A receiver must never propagate a state without knowing its frame, units and epoch.

### 4.1 UE position in the same frame

A GNSS receiver normally provides geodetic latitude (\varphi), longitude (\lambda) and ellipsoidal height (h). Using the WGS-84 ellipsoid,

\[
N(\varphi)=\frac{a}{\sqrt{1-e^2\sin^2\varphi}},
\]

\[
\begin{aligned}
x_u &= (N+h)\cos\varphi\cos\lambda,\\
y_u &= (N+h)\cos\varphi\sin\lambda,\\
z_u &= (N(1-e^2)+h)\sin\varphi.
\end{aligned}
\]

Now the UE and satellite occupy one frame and can be subtracted safely.

### 4.2 Line of sight, range and propagation delay

For satellite position \(\mathbf r_s\) and UE position \(\mathbf r_u\),

\[
\boldsymbol\rho=\mathbf r_s-\mathbf r_u,\qquad
R=\|\boldsymbol\rho\|,\qquad
\hat{\boldsymbol\rho}=\frac{\boldsymbol\rho}{R}.
\]

The service-link one-way geometric delay is approximately

\[
\tau_{SL}=\frac{R}{c}.
\]

This is not automatically the complete end-to-end or round-trip delay: a transparent payload also has a feeder path, and implementations add processing and scheduling latency.

### 4.3 Range rate and Doppler

With satellite velocity \(\mathbf v_s\) and UE velocity \(\mathbf v_u\), the instantaneous radial range rate is

\[
\dot R=(\mathbf v_s-\mathbf v_u)\cdot\hat{\boldsymbol\rho}.
\]

Under one common sign convention, the first-order received-frequency offset is

\[
f_D=-\frac{\dot R}{c}f_c.
\]

The sign convention must be stated in software and test vectors. The physical result is simple: closing range raises received frequency and opening range lowers it. NR NTN UEs use their location and broadcast satellite ephemeris to pre-compensate service-link delay and Doppler before and during connection.

### 4.4 Visibility and elevation

The line-of-sight vector can be rotated from ECEF into the UE's local East-North-Up (ENU) frame. If the result is \([e,n,u]\),

\[
\text{azimuth}=\operatorname{atan2}(e,n),\qquad
\text{elevation}=\operatorname{atan2}\!\left(u,\sqrt{e^2+n^2}\right).
\]

A practical tracker applies an elevation mask rather than treating every point above the mathematical horizon as usable. Low elevation increases slant range, clutter loss, atmospheric path length and blockage risk.

## 5. UE-centric and satellite-centric views

These are useful **engineering viewpoints**, not formal 3GPP mode names.

### 5.1 UE-centric view

Place the UE at the origin and express a satellite as relative range, azimuth, elevation, range rate and predicted visibility time:

```text
UE → which satellite/beam is visible, for how long, at what delay and Doppler?
```

This view is natural for terminal acquisition, beam pointing, Doppler compensation and candidate selection. Every UE sees a different range and radial velocity, so compensation is UE-specific even when many UEs share one beam.

### 5.2 Satellite-centric view

Place the satellite or its beam at the centre of the resource problem:

```text
satellite/beam → which UEs and ground region can be served with available power,
                 bandwidth, gateway visibility and dwell time?
```

This view is useful for beam scheduling, power allocation, gateway selection, footprint planning and handover between satellites. A satellite-centric scheduler must still translate decisions into cell- and UE-level NR procedures.

### 5.3 Do not confuse viewpoint with coverage motion

3GPP uses different terms for what happens to a cell footprint:

- **Earth-fixed:** the cell remains over the same geographic area; GEO is the canonical example.
- **Quasi-Earth-fixed:** a steerable NGSO beam serves one geographic area for a limited time, then another.
- **Earth-moving:** a non-steered NGSO beam footprint moves across Earth's surface with the satellite.

A UE-centric calculation can be used with any of these coverage types. Likewise, satellite-centric scheduling does not imply an Earth-moving cell.

## 6. GEO support versus LEO support

NR NTN is not a separate air interface for each orbit, but one implementation cannot treat GEO and LEO as interchangeable channel profiles.

| Property | GEO / GSO case | LEO / NGSO case |
|---|---|---|
| Typical altitude | About 35,786 km for geostationary orbit | Hundreds to roughly 1,500 km in 3GPP/ITU study scenarios |
| Apparent motion | Nearly fixed for a ground observer | Fast pass across the sky |
| Propagation delay | Very large but comparatively stable | Lower but strongly time-varying |
| Doppler from satellite motion | Small for an ideal geostationary satellite | Large and rapidly varying |
| Coverage | Naturally Earth-fixed | Earth-moving or quasi-Earth-fixed beams |
| Mobility pressure | Beam/cell changes can be infrequent | Frequent beam, satellite and possibly gateway switchovers |
| Link budget | Very long path; high satellite/terminal gain is valuable | Shorter path, but tracking and constellation continuity dominate |
| Constellation need | One satellite covers a very large region | Many satellites are required for continuous regional/global service |

For GEO, the central NR difficulties are the long service-plus-feeder delay, HARQ timing, random-access timing, and link budget. “Stationary” does not mean zero Doppler in a real system: UE motion, oscillator error, station-keeping and feeder-link effects remain.

For LEO, lower delay does not make the radio link terrestrial. The satellite's high speed produces a large, time-varying Doppler shift and a short visibility window. Ephemeris age, position error, beam transition, cell reselection/handover and gateway continuity become first-order design variables.

## 7. What NR changes for NTN

Release 17 NR NTN added a coordinated set of mechanisms rather than one “satellite mode” switch:

- NTN configuration and satellite ephemeris broadcast in system information;
- common timing-advance information plus UE-specific timing behavior;
- UE autonomous uplink timing and frequency pre-compensation using UE location and ephemeris;
- extended timing relationships and HARQ adaptations for long propagation time;
- NTN-aware cell selection, reselection, mobility and service-time/location assistance;
- satellite-access RF bands, UE/base-station RF requirements and conformance tests.

The separation between **common** and **UE-specific** delay is important. A network can signal a common timing component associated with the reference geometry or network path, while each UE computes the differential service-link term created by its own position within the footprint.

## 8. Implementation constraints

### Ephemeris validity

An ephemeris is an estimate tied to an epoch, not an eternal satellite location. A tracker needs an update policy, propagation model and maximum accepted age. Position error projects into delay error; velocity error projects into residual carrier-frequency error.

### Time and frame discipline

ECEF, Earth-Centered Inertial (ECI), GNSS time, UTC and NR system-frame time are not interchangeable. Leap seconds, Earth rotation and epoch conversion can create failures that look like modem synchronization bugs. Interfaces should carry frame, epoch, time scale, units and axis order explicitly.

### GNSS dependence

The Release 17 design assumes a GNSS-capable UE can obtain its position for autonomous compensation. Indoor blockage, jamming, spoofing and power consumption make GNSS-independent or network-assisted operation a significant evolution and research topic.

### Link and payload constraints

Satellite effective isotropic radiated power, antenna aperture, UE power, polarization loss, atmospheric attenuation, feeder-link availability and payload processing capacity all constrain scheduling. A geometrically visible satellite is not necessarily a usable NR link.

## 9. Trade-offs

- **Transparent payload:** simpler satellite and easier ground-side upgrades, but the feeder path contributes delay and gateway dependence.
- **Regenerative payload:** can reduce some ground-path dependencies and enable on-board routing, but increases on-board processing, power, thermal and upgrade constraints.
- **Earth-moving beams:** avoid aggressive beam steering, but force rapid cell/beam mobility on the ground.
- **Quasi-Earth-fixed beams:** simplify the service-area abstraction, but consume steering and scheduling resources and still require satellite switchovers.
- **GEO:** broad stable coverage with severe delay and path loss.
- **LEO:** better path loss and latency with constellation, tracking and handover complexity.

## 10. Research status and open problems

**Standardized:** Release 17 provides the baseline NR NTN solution, including transparent satellite access, ephemeris-assisted compensation and NTN mobility/timing mechanisms. Later releases evolve coverage, mobility, spectrum, terminal and architecture capabilities.

**Engineering interpretation:** UE-centric and satellite-centric models are useful ways to partition a tracker or scheduler, but are not themselves 3GPP protocol modes.

Important open engineering and research questions include:

1. How accurately must ephemeris and UE position be known for a given carrier frequency and subcarrier spacing?
2. How can a UE retain NTN service when GNSS is unavailable or untrusted?
3. Should handover optimize radio quality, remaining visibility, gateway reachability, load, or all four jointly?
4. How should HARQ and scheduling adapt across mixed GEO/LEO and terrestrial paths?
5. Which functions belong on a regenerative satellite when compute, power and thermal budgets are limited?
6. How can multi-connectivity hide satellite and beam switchovers without duplicating excessive resources?
7. How should orbit, beam and RAN simulators share reference frames and time bases so results remain reproducible?

## 11. References

1. 3GPP, [Non-Terrestrial Networks overview](https://www.3gpp.org/technologies/ntn-overview).
2. 3GPP TR 38.821, [Solutions for NR to support non-terrestrial networks](https://portal.3gpp.org/desktopmodules/Specifications/SpecificationDetails.aspx?specificationId=3525).
3. ETSI / 3GPP TS 38.300, [NR and NG-RAN overall description](https://www.etsi.org/deliver/etsi_ts/138300_138399/138300/).
4. ETSI / 3GPP TS 38.331, [NR Radio Resource Control protocol](https://www.etsi.org/deliver/etsi_ts/138300_138399/138331/).
5. ETSI / 3GPP TS 38.304, [NR UE procedures in idle and inactive states](https://www.etsi.org/deliver/etsi_ts/138300_138399/138304/).
6. ETSI / 3GPP TS 38.101-5, [NR UE satellite-access RF and performance requirements](https://www.etsi.org/deliver/etsi_ts/138100_138199/13810105/).
7. ITU-R Recommendation M.2177, [Detailed specifications of the satellite radio interfaces of IMT-2020](https://www.itu.int/rec/R-REC-M.2177/).
8. NGA, [Department of Defense World Geodetic System 1984, TR8350.2](https://earth-info.nga.mil/php/download.php?file=coord-wgs84).
