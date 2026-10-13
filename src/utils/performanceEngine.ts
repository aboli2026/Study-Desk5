import { useState, useEffect, useRef } from 'react';

export interface DisplayPerformanceStats {
  refreshRate: number;      // Target monitor Hz (e.g. 60, 90, 120, 144)
  fps: number;              // Current live FPS
  frameTimeMs: number;      // Target frame budget in ms (e.g. 16.6ms for 60Hz, 8.33ms for 120Hz)
  is120HzOrHigher: boolean; // True if high-refresh rate display detected
  isSynced: boolean;        // True when app is hitting display target
}

/**
 * Quantizes measured raw frame rate into standard display refresh rates
 */
function quantizeRefreshRate(rawHz: number): number {
  if (rawHz >= 220) return 240;
  if (rawHz >= 155) return 165;
  if (rawHz >= 135) return 144;
  if (rawHz >= 110) return 120;
  if (rawHz >= 85) return 90;
  if (rawHz >= 70) return 75;
  return 60;
}

/**
 * High-precision display refresh rate detector using requestAnimationFrame timestamps
 */
export function detectDisplayRefreshRate(): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime = 0;
    const sampleLimit = 40; // Samples over ~0.3-0.6s to accurately detect 60Hz or 120Hz
    const deltas: number[] = [];
    let lastTime = 0;

    const onFrame = (timestamp: number) => {
      if (frameCount === 0) {
        startTime = timestamp;
        lastTime = timestamp;
        frameCount++;
        requestAnimationFrame(onFrame);
        return;
      }

      const delta = timestamp - lastTime;
      lastTime = timestamp;
      if (delta > 0 && delta < 50) {
        deltas.push(delta);
      }

      frameCount++;
      if (frameCount < sampleLimit) {
        requestAnimationFrame(onFrame);
      } else {
        // Compute average frame delta excluding outliers
        deltas.sort((a, b) => a - b);
        // Trim 10% highest and lowest
        const trim = Math.floor(deltas.length * 0.15);
        const valid = deltas.slice(trim, deltas.length - trim);
        const avgDelta = valid.length > 0 
          ? valid.reduce((sum, d) => sum + d, 0) / valid.length 
          : (timestamp - startTime) / frameCount;

        const calculatedHz = 1000 / avgDelta;
        const quantized = quantizeRefreshRate(calculatedHz);
        resolve(quantized);
      }
    };

    requestAnimationFrame(onFrame);
  });
}

/**
 * Hook to monitor live display refresh rate, FPS, and VSync synchronization
 */
export function useDisplayRefreshRate(): DisplayPerformanceStats {
  const [stats, setStats] = useState<DisplayPerformanceStats>({
    refreshRate: 60,
    fps: 60,
    frameTimeMs: 16.67,
    is120HzOrHigher: false,
    isSynced: true,
  });

  const rafRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastSampleTimeRef = useRef(performance.now());
  const detectedRateRef = useRef(60);

  useEffect(() => {
    let active = true;

    // 1. Initial high precision calibration
    detectDisplayRefreshRate().then((detectedHz) => {
      if (!active) return;
      detectedRateRef.current = detectedHz;
      const budget = Number((1000 / detectedHz).toFixed(2));
      setStats((prev) => ({
        ...prev,
        refreshRate: detectedHz,
        frameTimeMs: budget,
        is120HzOrHigher: detectedHz >= 120,
      }));

      // Set CSS variables on :root for precise animation timing
      document.documentElement.style.setProperty('--app-target-hz', `${detectedHz}Hz`);
      document.documentElement.style.setProperty('--app-frame-budget', `${budget}ms`);
    });

    // 2. Real-time lightweight FPS monitoring loop (syncs with VSync)
    const monitorLoop = (timestamp: number) => {
      frameCountRef.current++;
      const elapsed = timestamp - lastSampleTimeRef.current;

      // Update stats once every 800ms
      if (elapsed >= 800) {
        const currentFps = Math.min(
          detectedRateRef.current,
          Math.round((frameCountRef.current * 1000) / elapsed)
        );
        const targetHz = detectedRateRef.current;
        const isSynced = Math.abs(currentFps - targetHz) <= 4;

        if (active) {
          setStats({
            refreshRate: targetHz,
            fps: currentFps,
            frameTimeMs: Number((1000 / targetHz).toFixed(2)),
            is120HzOrHigher: targetHz >= 120,
            isSynced,
          });
        }

        frameCountRef.current = 0;
        lastSampleTimeRef.current = timestamp;
      }

      rafRef.current = requestAnimationFrame(monitorLoop);
    };

    rafRef.current = requestAnimationFrame(monitorLoop);

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return stats;
}
