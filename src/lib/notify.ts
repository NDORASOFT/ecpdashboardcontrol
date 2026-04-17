// Lightweight chime via WebAudio so we don't ship an audio file.
let ctx: AudioContext | null = null;

export function playChime() {
  try {
    ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [880, 1175, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.4);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.45);
    });
  } catch {
    /* no-op */
  }
}

export async function ensureNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function fireNotification(title: string, body?: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  } catch {
    /* no-op */
  }
  playChime();
}
