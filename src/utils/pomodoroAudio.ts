import { PomodoroSound } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a minimal, soothing ambient tone using the Web Audio API.
 * High quality harmonic synthesis without requiring external audio assets.
 */
export function playMinimalPomodoroSound(soundType: PomodoroSound = 'crystal', volume: number = 0.6): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const clampedVolume = Math.max(0.01, Math.min(1.0, volume));
    const now = ctx.currentTime;

    switch (soundType) {
      case 'crystal': {
        // Minimal Crystal Chime (C5, G5, C6) - Sparkling, soft and elegant
        const freqs = [523.25, 783.99, 1046.5];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          const startGain = clampedVolume * (0.35 / (idx + 1));
          gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(startGain, now + idx * 0.08 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 1.45);
        });
        break;
      }

      case 'zen': {
        // Gentle Zen Bell / Singing Bowl (432Hz deep soothing fundamental + warm harmonics)
        const harmonics = [432, 864, 1296];
        harmonics.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          const startGain = clampedVolume * (idx === 0 ? 0.4 : 0.15);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(startGain, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 2.25);
        });
        break;
      }

      case 'marimba': {
        // Soft Wooden Marimba double chime (F5 -> A5)
        const notes = [698.46, 880.0];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(clampedVolume * 0.4, now + idx * 0.12 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.7);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.75);
        });
        break;
      }

      case 'bell':
      default: {
        // Classic Gentle Bell (A5 -> D6)
        const notes = [880, 1174.66];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);

          gain.gain.setValueAtTime(0.0001, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(clampedVolume * 0.35, now + idx * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 1.25);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Audio playback not supported or failed:', err);
  }
}

/**
 * Requests browser system notification permission.
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

/**
 * Sends a native browser system notification if permitted.
 */
export function sendBrowserNotification(title: string, body: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      tag: 'pomodoro-timer-alert',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
    });
  } catch (e) {
    console.warn('Browser notification trigger failed:', e);
  }
}
