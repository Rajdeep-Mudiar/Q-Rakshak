import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * High-Precision, Cross-Platform Shake Detection Hook for Emergency Medical Callers.
 *
 * Designed specifically for Q-Rakshak Mobile & PWA Emergency Responders:
 * 1. Handles Android Chrome / Samsung Internet where `event.acceleration` is null
 *    by using digital low-pass gravity vector isolation (alpha filter).
 * 2. Handles modern iOS Safari 13+ user-gesture permission model (`requestPermission`).
 * 3. Oscillation Direction Reversal: requires at least 2 sign reversals within a 750ms window
 *    to eliminate false positives from car bumps, footsteps, or tilting the device.
 * 4. Calibrated default threshold (11.8 m/s²) with high/normal/low sensitivity profiles
 *    to accommodate pediatric, elderly, and trauma patients.
 * 5. Native haptic feedback burst upon detection.
 * 6. Enabled-gate: prevents infinite re-triggering loops while the SOS modal is open.
 * 7. Live motion telemetry for accelerometer diagnostic meters.
 *
 * @param {Function} onShake - Callback invoked upon verified emergency shake
 * @param {Object} options - Configuration options
 */

const SENSITIVITY_PRESETS = {
  high: 9.8,    // Easier to shake: recommended for elderly, pediatric, or acute shock
  normal: 11.8, // Balanced: intentional human hand shake, filters out walking & drops
  low: 14.5,    // Stiff: vigorous shaking required, prevents false alarms in vehicles
};

export function useShakeDetection(onShake, options = {}) {
  const {
    sensitivity = 'normal',
    threshold: customThreshold,
    timeout = 4000,
    reversalsRequired = 2,
    windowMs = 750,
    enabled = true,
  } = options;

  const effectiveThreshold = customThreshold !== undefined
    ? Number(customThreshold)
    : (SENSITIVITY_PRESETS[sensitivity] || SENSITIVITY_PRESETS.normal);

  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown'); // 'unknown' | 'granted' | 'denied'
  const [currentMagnitude, setCurrentMagnitude] = useState(0);

  const callbackRef = useRef(onShake);
  const enabledRef = useRef(enabled);
  const lastMeterUpdateRef = useRef(0);

  useEffect(() => {
    callbackRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Request motion permission on iOS 13+ user gesture
  const requestMotionPermission = useCallback(async () => {
    if (typeof window === 'undefined') return false;

    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        setPermissionState(response);
        return response === 'granted';
      } catch (err) {
        console.warn('DeviceMotionEvent permission error:', err);
        setPermissionState('denied');
        return false;
      }
    } else {
      setPermissionState('granted');
      return true;
    }
  }, []);

  // Manual test trigger for simulators, desktop browsers, or preview buttons
  const triggerShake = useCallback((metrics = null) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate([180, 80, 180, 80, 250]);
      } catch (_) {
        // vibration blocked or unsupported
      }
    }
    if (callbackRef.current) {
      callbackRef.current(
        metrics || {
          simulated: true,
          magnitude: effectiveThreshold + 2.5,
          timestamp: Date.now(),
        }
      );
    }
  }, [effectiveThreshold]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.DeviceMotionEvent) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      return;
    }

    if (!enabled) return;

    // Digital gravity low-pass state
    let gravityX = 0;
    let gravityY = 0;
    let gravityZ = 0;
    let initializedGravity = false;

    let lastDirectionX = 0;
    let lastDirectionY = 0;
    let reversalCount = 0;
    let gestureStartTime = 0;
    let lastTriggerTime = 0;

    const ALPHA = 0.82; // Gravity smoothing constant

    function handleMotion(event) {
      if (!enabledRef.current) return;

      const now = Date.now();
      if (now - lastTriggerTime < timeout) return;

      let curX = 0;
      let curY = 0;
      let curZ = 0;

      // Case 1: Pure linear acceleration directly provided (iOS, modern fused sensors)
      if (
        event.acceleration &&
        event.acceleration.x !== null &&
        event.acceleration.y !== null
      ) {
        curX = Number(event.acceleration.x) || 0;
        curY = Number(event.acceleration.y) || 0;
        curZ = Number(event.acceleration.z) || 0;
      }
      // Case 2: Acceleration including gravity (Standard Android Chrome / WebViews)
      else if (event.accelerationIncludingGravity) {
        const rawX = Number(event.accelerationIncludingGravity.x) || 0;
        const rawY = Number(event.accelerationIncludingGravity.y) || 0;
        const rawZ = Number(event.accelerationIncludingGravity.z) || 0;

        if (!initializedGravity) {
          gravityX = rawX;
          gravityY = rawY;
          gravityZ = rawZ;
          initializedGravity = true;
          return;
        }

        // Low-pass filter to isolate Earth's 9.8 m/s² gravity vector across orientations
        gravityX = ALPHA * gravityX + (1 - ALPHA) * rawX;
        gravityY = ALPHA * gravityY + (1 - ALPHA) * rawY;
        gravityZ = ALPHA * gravityZ + (1 - ALPHA) * rawZ;

        // High-pass dynamic linear motion
        curX = rawX - gravityX;
        curY = rawY - gravityY;
        curZ = rawZ - gravityZ;
      } else {
        return;
      }

      // Net dynamic magnitude (m/s²)
      const magnitude = Math.sqrt(curX * curX + curY * curY + curZ * curZ);

      // Throttled UI telemetry meter update (~10 fps to prevent React render saturation)
      if (now - lastMeterUpdateRef.current > 100) {
        lastMeterUpdateRef.current = now;
        setCurrentMagnitude(Math.round(magnitude * 10) / 10);
      }

      // Evaluate kinetic shake oscillation
      if (magnitude > effectiveThreshold) {
        const dirX = curX > 0 ? 1 : -1;
        const dirY = curY > 0 ? 1 : -1;

        if (gestureStartTime === 0 || now - gestureStartTime > windowMs) {
          // Begin gesture observation window
          gestureStartTime = now;
          reversalCount = 0;
          lastDirectionX = dirX;
          lastDirectionY = dirY;
        } else {
          // Check for direction reversal in the primary moving axes
          const reversed =
            (dirX !== lastDirectionX && Math.abs(curX) > effectiveThreshold * 0.65) ||
            (dirY !== lastDirectionY && Math.abs(curY) > effectiveThreshold * 0.65);

          if (reversed) {
            reversalCount++;
            lastDirectionX = dirX;
            lastDirectionY = dirY;

            // Verified genuine shake confirmed
            if (reversalCount >= reversalsRequired) {
              lastTriggerTime = now;
              gestureStartTime = 0;
              reversalCount = 0;

              // Native multi-pulse haptic vibration
              if (navigator.vibrate) {
                try {
                  navigator.vibrate([220, 90, 220, 90, 320]);
                } catch (_) {}
              }

              if (callbackRef.current) {
                callbackRef.current({
                  magnitude: Math.round(magnitude * 10) / 10,
                  reversals: reversalCount,
                  timestamp: now,
                  simulated: false,
                });
              }
            }
          }
        }
      } else {
        // Reset gesture window on prolonged rest
        if (gestureStartTime !== 0 && now - gestureStartTime > windowMs) {
          gestureStartTime = 0;
          reversalCount = 0;
        }
      }
    }

    window.addEventListener('devicemotion', handleMotion, { passive: true });

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, effectiveThreshold, timeout, reversalsRequired, windowMs]);

  return {
    isSupported,
    permissionState,
    currentMagnitude,
    effectiveThreshold,
    requestMotionPermission,
    triggerShake,
  };
}
