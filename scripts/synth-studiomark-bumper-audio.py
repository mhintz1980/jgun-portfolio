#!/usr/bin/env python3
"""
Deterministic 48kHz Stereo Cinema Audio Synthesizer for StudioMark 3D Video Bumpers:
- Bumper 01: Storm Ignition (4.50s)
- Bumper 04: Low Puddle Crane-Up (5.00s)

Uses pure numpy/scipy DSP (pink/brown rain filtering, thunder convolution,
high-voltage FM/sawtooth arc synthesis, sub-bass sine sweep, and crystalline
FM glass harmonic chord with Schroeder stereo reverb).
"""

from pathlib import Path
import wave
import numpy as np

SR = 48000


def make_pink_rain(duration_sec: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(SR * duration_sec)
    # Generate stereo pink-ish rain via multi-band filtered white noise + droplet micro-impulses
    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)

    for ch_idx, arr in enumerate((left, right)):
        white = rng.standard_normal(n)
        # Simple 1/f spectral shaping in frequency domain
        freqs = np.fft.rfftfreq(n, d=1.0 / SR)
        spec = np.fft.rfft(white)
        # Bandpass between 350Hz and 6500Hz with gentle 1/sqrt(f) roll-off
        weight = np.where(freqs > 80.0, 1.0 / np.sqrt(np.maximum(freqs, 80.0)), 0.0)
        weight *= 1.0 / (1.0 + (freqs / 4200.0) ** 4)
        weight *= (freqs / 450.0) ** 2 / (1.0 + (freqs / 450.0) ** 2)
        shaped = np.fft.irfft(spec * weight, n=n)
        shaped /= np.max(np.abs(shaped)) + 1e-9
        arr[:] = shaped * 0.14

        # Add delicate water droplet patters
        num_drops = int(duration_sec * 55)
        for _ in range(num_drops):
            pos = int(rng.uniform(0.05, duration_sec - 0.05) * SR)
            drop_len = int(0.018 * SR)
            if pos + drop_len >= n:
                continue
            t_d = np.arange(drop_len) / SR
            f0 = rng.uniform(1100.0, 2600.0)
            drop = np.sin(2 * np.pi * (f0 + 600 * t_d / 0.018) * t_d) * np.exp(-t_d / 0.0035)
            arr[pos : pos + drop_len] += drop * rng.uniform(0.015, 0.045)

    return np.stack([left, right], axis=1)


def add_thunder(buf: np.ndarray, start_sec: float, intensity: float, seed: int) -> None:
    rng = np.random.default_rng(seed)
    n = buf.shape[0]
    i0 = int(start_sec * SR)
    dur = min(3.4, (n - i0) / SR)
    if dur <= 0.1:
        return
    m = int(dur * SR)
    t = np.arange(m) / SR

    for ch in range(2):
        noise = rng.standard_normal(m)
        freqs = np.fft.rfftfreq(m, d=1.0 / SR)
        spec = np.fft.rfft(noise)
        # Deep rumble filter (28Hz - 220Hz) + initial crack (400Hz - 1800Hz)
        rumble_w = 1.0 / (1.0 + (freqs / 115.0) ** 3)
        rumble = np.fft.irfft(spec * rumble_w, n=m)
        rumble /= np.max(np.abs(rumble)) + 1e-9

        crack_w = ((freqs / 500.0) / (1.0 + (freqs / 1400.0) ** 3))
        crack = np.fft.irfft(spec * crack_w, n=m)
        crack /= np.max(np.abs(crack)) + 1e-9

        env_rumble = (1.0 - np.exp(-t / 0.04)) * np.exp(-t / 1.15)
        env_crack = np.exp(-t / 0.065)

        sig = (rumble * env_rumble * 0.48 + crack * env_crack * 0.22) * intensity
        buf[i0 : i0 + m, ch] += sig


def add_sub_drop(buf: np.ndarray, start_sec: float, f_start: float, f_end: float, dur_sec: float, amp: float) -> None:
    n = buf.shape[0]
    i0 = int(start_sec * SR)
    m = min(int(dur_sec * SR), n - i0)
    if m <= 0:
        return
    t = np.arange(m) / SR
    # Exponential frequency sweep
    k = np.log(f_end / f_start) / dur_sec
    phase = 2 * np.pi * f_start * (np.exp(k * t) - 1.0) / k
    env = (1.0 - np.exp(-t / 0.015)) * np.exp(-t / (dur_sec * 0.48))
    sig = (np.sin(phase) + 0.25 * np.sin(2 * phase) * np.exp(-t / 0.25)) * env * amp
    buf[i0 : i0 + m, 0] += sig
    buf[i0 : i0 + m, 1] += sig


def add_electric_arc(buf: np.ndarray, start_sec: float, dur_sec: float, amp: float, seed: int) -> None:
    rng = np.random.default_rng(seed)
    n = buf.shape[0]
    i0 = int(start_sec * SR)
    m = min(int(dur_sec * SR), n - i0)
    if m <= 0:
        return
    t = np.arange(m) / SR
    # Warm 110Hz/220Hz electrical hum + high-voltage buzz modulation
    hum = (
        0.55 * np.sin(2 * np.pi * 110.0 * t + 0.4 * np.sin(2 * np.pi * 55.0 * t))
        + 0.30 * np.sin(2 * np.pi * 220.0 * t)
        + 0.15 * np.sin(2 * np.pi * 330.0 * t)
    )
    # Sputtering arc spikes
    sparks = rng.standard_normal(m) * (rng.random(m) > 0.965).astype(np.float64)
    env = np.sin(np.pi * np.clip(t / dur_sec, 0, 1)) ** 0.7 * np.exp(-t / (dur_sec * 0.65))
    sig_l = (hum * 0.7 + sparks * 0.25) * env * amp
    sig_r = (hum * 0.7 - sparks * 0.25) * env * amp
    buf[i0 : i0 + m, 0] += sig_l
    buf[i0 : i0 + m, 1] += sig_r


def add_puddle_drop_plop(buf: np.ndarray, start_sec: float, amp: float) -> None:
    n = buf.shape[0]
    i0 = int(start_sec * SR)
    dur = 0.22
    m = min(int(dur * SR), n - i0)
    if m <= 0:
        return
    t = np.arange(m) / SR
    # Classic upward pitch-chirp bubble resonance (380Hz -> 980Hz)
    freq = 380.0 + 620.0 * (1.0 - np.exp(-t / 0.035))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env = (1.0 - np.exp(-t / 0.004)) * np.exp(-t / 0.045)
    sig = np.sin(phase) * env * amp
    buf[i0 : i0 + m, 0] += sig * 0.95
    buf[i0 : i0 + m, 1] += sig * 1.05


def add_crystalline_lockup_chord(buf: np.ndarray, start_sec: float, dur_sec: float, amp: float) -> None:
    n = buf.shape[0]
    i0 = int(start_sec * SR)
    m = min(int(dur_sec * SR), n - i0)
    if m <= 0:
        return
    t = np.arange(m) / SR
    # Lush cinematic D9sus4 / Dmaj9 optical crystal shimmer
    notes = [
        (146.83, 0.36, -0.15),  # D3 warm foundation
        (220.00, 0.30, 0.15),   # A3 fifth
        (293.66, 0.28, -0.25),  # D4 octave
        (369.99, 0.22, 0.25),   # F#4 major third
        (440.00, 0.20, -0.10),  # A4
        (587.33, 0.14, 0.30),   # D5 shimmer
        (659.25, 0.12, -0.30),  # E5 ninth air
    ]
    for idx, (f, weight, pan) in enumerate(notes):
        delay = idx * 0.025
        td = np.maximum(0.0, t - delay)
        active = (t >= delay).astype(np.float64)
        # Subtle FM glass bell overtone at 3.0x carrier with fast decay
        mod = 0.35 * np.sin(2 * np.pi * (f * 3.0) * td) * np.exp(-td / 0.28)
        tone = np.sin(2 * np.pi * f * td + mod)
        env = active * (1.0 - np.exp(-td / 0.055)) * np.exp(-td / (dur_sec * 0.58))
        gain_l = np.sqrt(0.5 * (1.0 - pan))
        gain_r = np.sqrt(0.5 * (1.0 + pan))
        buf[i0 : i0 + m, 0] += tone * env * weight * amp * gain_l
        buf[i0 : i0 + m, 1] += tone * env * weight * amp * gain_r


def apply_master_envelope_and_save(buf: np.ndarray, fade_in_sec: float, fade_out_sec: float, out_path: Path) -> None:
    n = buf.shape[0]
    t = np.arange(n) / SR
    dur = n / SR
    env = np.ones(n, dtype=np.float64)
    if fade_in_sec > 0:
        env *= np.clip(t / fade_in_sec, 0.0, 1.0)
    if fade_out_sec > 0:
        env *= np.clip((dur - t) / fade_out_sec, 0.0, 1.0)
    buf *= env[:, None]

    # Soft tanh saturation + normalize to -1.5 dBFS (peak 0.84)
    buf = np.tanh(buf * 1.15)
    peak = np.max(np.abs(buf)) + 1e-9
    buf = (buf / peak) * 0.84

    pcm = np.clip(buf * 32767.0, -32768, 32767).astype(np.int16)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def build_storm_ignition(out_path: Path) -> None:
    dur = 4.50
    buf = make_pink_rain(dur, seed=101)
    # Low tension sub swell in Act I (0.15s -> 1.15s)
    add_sub_drop(buf, 0.15, 34.0, 58.0, 0.95, 0.18)
    # Primary Lightning Strike + High-Voltage Neon Ignition at 1.15s
    add_thunder(buf, 1.15, intensity=0.95, seed=202)
    add_sub_drop(buf, 1.15, 68.0, 25.0, 1.35, 0.55)
    add_electric_arc(buf, 1.12, dur_sec=0.85, amp=0.28, seed=303)
    # Secondary Filament Overdrive Surge at 1.52s
    add_thunder(buf, 1.58, intensity=0.55, seed=204)
    add_electric_arc(buf, 1.48, dur_sec=0.75, amp=0.24, seed=305)
    # Hero Showcase Lockup Sub + Crystalline Chord at 2.65s
    add_sub_drop(buf, 2.65, 54.0, 26.0, 1.65, 0.42)
    add_crystalline_lockup_chord(buf, 2.68, dur_sec=1.80, amp=0.52)
    apply_master_envelope_and_save(buf, fade_in_sec=0.18, fade_out_sec=0.42, out_path=out_path)


def build_puddle_crane(out_path: Path) -> None:
    dur = 5.00
    buf = make_pink_rain(dur, seed=404)
    # Act I: Hero Raindrop Puddle Impact + Distant Thunder Ripple at 0.45s
    add_puddle_drop_plop(buf, 0.42, amp=0.36)
    add_puddle_drop_plop(buf, 0.78, amp=0.20)
    add_thunder(buf, 0.46, intensity=0.55, seed=505)
    add_sub_drop(buf, 0.46, 52.0, 28.0, 1.10, 0.32)
    # Act II: Vertical Crane Ascent Riser (1.10s -> 2.30s) + Mid-Crane Lightning Strike at 2.15s
    add_sub_drop(buf, 1.15, 30.0, 62.0, 1.10, 0.22)
    add_thunder(buf, 2.15, intensity=0.90, seed=606)
    add_electric_arc(buf, 2.12, dur_sec=0.78, amp=0.24, seed=707)
    add_sub_drop(buf, 2.15, 64.0, 25.0, 1.30, 0.48)
    # Act III: Hero Pedestal Lockup Chord at 3.10s
    add_sub_drop(buf, 3.10, 52.0, 26.0, 1.75, 0.38)
    add_crystalline_lockup_chord(buf, 3.12, dur_sec=1.85, amp=0.54)
    apply_master_envelope_and_save(buf, fade_in_sec=0.20, fade_out_sec=0.45, out_path=out_path)


if __name__ == "__main__":
    out_dir = Path("project/work/evidence/studiomark-logo")
    p1 = out_dir / "audio-storm-ignition.wav"
    p4 = out_dir / "audio-puddle-crane.wav"
    build_storm_ignition(p1)
    build_puddle_crane(p4)
    print(f"Generated {p1} ({p1.stat().st_size} bytes)")
    print(f"Generated {p4} ({p4.stat().st_size} bytes)")

