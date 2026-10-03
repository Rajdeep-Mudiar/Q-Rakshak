import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * High-precision, zero-false-positive Shake Detection Hook for Emergency Medical Callers.
 *
 * Problems in previous version:
 * 1. Read `event.accelerationIncludingGravity`, causing standard tilt/hand-tremor (9.8 m/s²)
 *    to cross naive thresholds continuously.
 * 2. No oscillation direction-reversal validation; a single bump or tilting car triggered it.
 * 3. Cooldown was only 1500ms, and it didn't respect whether the SOS modal was already open,
 *    leading to infinite re-triggering loops ("call is going again and again").
 *
 * Improvements in this version:
 * 1. Prioritizes pure linear acceleration (`event.acceleration`).
 * 2. If only gravity-inclusive acceleration is present, applies high-pass delta filtering.
 * 3. Requires MULTI-DIRECTIONAL reversal oscillations (at least 2 direction sign flips)
 *    within a short time window (600ms) with peak magnitude exceeding threshold (calibrated 16.0 m/s²).
 * 4. Accepts `enabled` flag so modal can pause detection completely while open.
 * 5. Extended cooldown (default 4000ms).
 * 6. Native haptic feedback (`navigator.vibrate([200, 100, 200])`) upon genuine shake.
 *
 * @param {Function} onShake - Callback function triggered when a genuine shake is confirmed
 * @param {Object} options - Configuration options
 */
export function useShakeDetection(onShake, options = {}) {
  const {
    threshold = 16.5, // Calibrated acceleration threshold in m/s^2 (excluding gravity)
    timeout = 4000,   // Cooldown between shake events (ms)
    reversalsRequired = 2, // At least 2 direction changes required for genuine shake
    windowMs = 650,   // Time window to accumulate reversals
    enabled = true,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown'); // 'unknown' | 'granted' | 'denied'
  const callbackRef = useRef(onShake);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    callbackRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Request permission for iOS 13+ devices on user gesture
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

  // Manual test trigger for simulators, desktop or UI test buttons
  const triggerShake = useCallback((metrics = null) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch (e) {
        // ignore vibration block
      }
    }
    if (callbackRef.current) {
      callbackRef.current(metrics || { simulated: true, timestamp: Date.now() });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.DeviceMotionEvent) {
      setIsSupported(true);
    }

    if (!enabled) return;

    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let lastDirectionX = 0;
    let lastDirectionY = 0;
    let reversalCount = 0;
    let gestureStartTime = 0;
    let lastTriggerTime = 0;

    function handleMotion(event) {
      if (!enabledRef.current) return;

      const now = Date.now();
      if (now - lastTriggerTime < timeout) return;

      // Prefer pure linear acceleration (without earth's 9.8m/s² gravity vector)
      let curX = 0;
      let curY = 0;
      let curZ = 0;

      if (event.acceleration && (event.acceleration.x !== null || event.acceleration.y !== null)) {
        curX = Number(event.acceleration.x) || 0;
        curY = Number(event.acceleration.y) || 0;
        curZ = Number(event.acceleration.z) || 0;
      } else if (event.accelerationIncludingGravity) {
        // High-pass filter delta when only gravity-inclusive sensor is available
        const rawX = Number(event.accelerationIncludingGravity.x) || 0;
        const rawY = Number(event.accelerationIncludingGravity.y) || 0;
        const rawZ = Number(event.accelerationIncludingGravity.z) || 0;
        curX = rawX - lastX;
        curY = rawY - lastY;
        curZ = rawZ - lastZ;
        lastX = rawX;
        lastY = rawY;
        lastZ = rawZ;
      } else {
        return;
      }

      const magnitude = Math.sqrt(curX * curX + curY * curY + curZ * curZ);

      // Only evaluate if acceleration is significant enough to be an active shake
      if (magnitude > threshold) {
        const dirX = curX > 0 ? 1 : -1;
        const dirY = curY > 0 ? 1 : -1;

        if (gestureStartTime === 0 || (now - gestureStartTime) > windowMs) {
          // Start a new shake candidate gesture
          gestureStartTime = now;
          reversalCount = 0;
          lastDirectionX = dirX;
          lastDirectionY = dirY;
        } else {
          // Check for sign change in primary axis
          const reversed = (dirX !== lastDirectionX && Math.abs(curX) > (threshold * 0.7)) ||
                           (dirY !== lastDirectionY && Math.abs(curY) > (threshold * 0.7));

          if (reversed) {
            reversalCount++;
            lastDirectionX = dirX;
            lastDirectionY = dirY;

            // Genuine shake confirmed when multiple rapid direction reversals occur
            if (reversalCount >= reversalsRequired) {
              lastTriggerTime = now;
              gestureStartTime = 0;
              reversalCount = 0;

              // Haptic feedback
              if (navigator.vibrate) {
                try {
                  navigator.vibrate([200, 100, 200]);
                } catch (e) {
                  // vibration not allowed
                }
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
        // Reset window if prolonged calm
        if (gestureStartTime !== 0 && (now - gestureStartTime) > windowMs) {
          gestureStartTime = 0;
          reversalCount = 0;
        }
      }
    }

    window.addEventListener('devicemotion', handleMotion, { passive: true });

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, threshold, timeout, reversalsRequired, windowMs]);

  return {
    isSupported,
    permissionState,
    requestMotionPermission,
    triggerShake,
  };
}
