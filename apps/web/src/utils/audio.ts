// Web Audio API luxury synthesizer chimes (No external audio file dependencies, 100% browser-safe)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a crystal-clear luxury 2-tone hospitality chime
 * @param type 'order' for incoming kitchen tickets, 'service' for diner concierge calls
 */
export function playNotificationChime(type: 'order' | 'service' = 'order') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'order') {
      // 3-tone ascending culinary ticket bell (587.33Hz D5 -> 739.99Hz F#5 -> 880Hz A5)
      const notes = [587.33, 739.99, 880];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, now + index * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.5);
      });
    } else {
      // 2-tone bright concierge bell (659.25Hz E5 -> 987.77Hz B5)
      const notes = [659.25, 987.77];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.15);

        gain.gain.setValueAtTime(0, now + index * 0.15);
        gain.gain.linearRampToValueAtTime(0.4, now + index * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 0.65);
      });
    }
  } catch (err) {
    console.warn('Audio chime playback prevented:', err);
  }
}
