let ctx: AudioContext | null = null;
let initialized = false;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

export function initSound() {
  if (initialized) return;
  initialized = true;
  const c = getContext();
  if (c && c.state === "suspended") {
    c.resume();
  }
}

export function playNotificationSound() {
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") {
    c.resume();
  }
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, c.currentTime + 0.15);
    gain.gain.setValueAtTime(0.5, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.3);
  } catch {}
}

export function playBeepSound() {
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") {
    c.resume();
  }
  try {
    const beep = (startTime: number, freq: number) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    };
    beep(c.currentTime, 660);
    beep(c.currentTime + 0.2, 880);
  } catch {}
}
