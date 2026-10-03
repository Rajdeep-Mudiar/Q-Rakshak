/**
 * Emergency Web Audio Synthesizer for Q-Rakshak Distress Telemetry.
 * Zero external dependencies. Uses browser native Web Audio API.
 * Safely handles mobile autoplay restrictions and audio context lifecycles.
 */

let sharedAudioContext = null;
let activeAlarmOscillator = null;
let activeAlarmGain = null;
let sirenInterval = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioCtx();
  }

  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
}

/**
 * Play a single countdown tick beep
 * @param {number} freq - frequency in Hz (default 880 for tick, 1320 for final)
 * @param {number} duration - duration in seconds
 */
export function playCountdownTick(freq = 880, duration = 0.18) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    // Autoplay or audio context initialization blocked
  }
}

/**
 * Start an ongoing alternating emergency siren loop
 */
export function startEmergencySiren() {
  stopEmergencySiren();

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);

    activeAlarmOscillator = osc;
    activeAlarmGain = gain;

    let isHigh = false;
    sirenInterval = setInterval(() => {
      try {
        if (!activeAlarmOscillator || !sharedAudioContext) return;
        const now = sharedAudioContext.currentTime;
        const targetFreq = isHigh ? 650 : 920;
        activeAlarmOscillator.frequency.cancelScheduledValues(now);
        activeAlarmOscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.18);
        isHigh = !isHigh;
      } catch (_) {}
    }, 280);
  } catch (err) {
    // Audio context initialization blocked
  }
}

/**
 * Cleanly stop any active emergency siren
 */
export function stopEmergencySiren() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }

  if (activeAlarmOscillator) {
    try {
      if (activeAlarmGain && sharedAudioContext) {
        activeAlarmGain.gain.cancelScheduledValues(sharedAudioContext.currentTime);
        activeAlarmGain.gain.setValueAtTime(0, sharedAudioContext.currentTime);
      }
      activeAlarmOscillator.stop();
      activeAlarmOscillator.disconnect();
    } catch (_) {}
    activeAlarmOscillator = null;
    activeAlarmGain = null;
  }
}
