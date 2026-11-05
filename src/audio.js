// Audio (beeps con WebAudio) y vibración. Verbatim del juego original.
/** @type {AudioContext | null} */
let actx = null;

/**
 * @param {number} [freq] Hz
 * @param {number} [dur] segundos
 * @param {number} [vol]
 */
export function beep (freq = 880, dur = 0.12, vol = 0.4) {
  try {
    // webkitAudioContext: Safari viejo.
    if (!actx) actx = new (window.AudioContext || /** @type {Window & { webkitAudioContext?: typeof AudioContext }} */ (window).webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch {}
}
export function endChime () { beep(660, 0.18); setTimeout(() => beep(880, 0.18), 170); setTimeout(() => beep(1175, 0.3), 360); }
/** @param {number | number[]} p */
export function vibrate (p) { if (navigator.vibrate) navigator.vibrate(p); }
