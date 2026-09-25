import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for high-reliability mobile Device Shake detection.
 * Supports iOS 13+ permission prompts, Android accelerometer, and desktop fallback test triggers.
 *
 * @param {Function} onShake - Callback function triggered when a shake is detected
 * @param {Object} options - Configuration options (threshold, timeout, enabled)
 */
export function useShakeDetection(onShake, options = {}) {
  const {
    threshold = 12, // Calibrated sensitivity threshold
    timeout = 1500, // Cooldown debouncing between triggers (ms)
    enabled = true,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown'); // 'unknown' | 'granted' | 'denied'
  const callbackRef = useRef(onShake);

  useEffect(() => {
    callbackRef.current = onShake;
  }, [onShake]);

  // Request permission for iOS 13+ devices on touch/click
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

  // Manual test trigger for simulators or desktop
  const triggerShake = useCallback(() => {
    if (callbackRef.current) {
      callbackRef.current();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    if (window.DeviceMotionEvent) {
      setIsSupported(true);
    }

    let lastX = null;
    let lastY = null;
    let lastZ = null;
    let lastTime = 0;
    let lastTriggerTime = 0;

    function handleMotion(event) {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const now = Date.now();
      if (now - lastTriggerTime < timeout) return;

      const curX = Number(acc.x) || 0;
      const curY = Number(acc.y) || 0;
      const curZ = Number(acc.z) || 0;

      if (lastX === null) {
        lastX = curX;
        lastY = curY;
        lastZ = curZ;
        lastTime = now;
        return;
      }

      const timeDiff = now - lastTime;
      if (timeDiff > 80) {
        const deltaX = Math.abs(curX - lastX);
        const deltaY = Math.abs(curY - lastY);
        const deltaZ = Math.abs(curZ - lastZ);

        // Combined velocity change rate
        const speed = ((deltaX + deltaY + deltaZ) / timeDiff) * 10000;
        const peakAxis = Math.max(deltaX, deltaY, deltaZ);

        // Trigger if overall speed crosses threshold OR any single axis experiences rapid snap
        if (speed > threshold * 8 || peakAxis > threshold * 0.9) {
          lastTriggerTime = now;
          if (callbackRef.current) {
            callbackRef.current();
          }
        }

        lastX = curX;
        lastY = curY;
        lastZ = curZ;
        lastTime = now;
      }
    }

    window.addEventListener('devicemotion', handleMotion, { passive: true });

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, threshold, timeout]);

  return {
    isSupported,
    permissionState,
    requestMotionPermission,
    triggerShake,
  };
}
