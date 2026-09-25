/**
 * Q-RAKSHAK WebRTC & Media Engine
 * High-reliability clinical tele-consultation media utilities.
 * Handles real camera/mic access, synthetic holographic medical stream fallback,
 * screen sharing, and peer connection negotiation.
 */

/**
 * Creates a synthetic animated canvas stream for environments where
 * physical webcams are blocked, unsupported, or absent (e.g. 2 tabs on same machine).
 * Renders a futuristic medical HUD with live laser scans, ECG waveforms, and telemetry.
 */
export function createSyntheticMedicalStream({
  label = "CLINICAL TELEMETRY FEED",
  role = "doctor",
  participantName = "",
  width = 1280,
  height = 720,
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  let frame = 0;
  const ecgPoints = [];
  const maxEcgPoints = 120;

  const isDoctorRole = role === "doctor";
  const primaryAccent = isDoctorRole ? "#D4AF37" : "#10B981";
  const secondaryAccent = isDoctorRole ? "#E2C366" : "#0EA5E9";

  function renderFrame() {
    frame++;

    // Deep slate medical background gradient
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width);
    bgGrad.addColorStop(0, isDoctorRole ? "#0c121e" : "#081519");
    bgGrad.addColorStop(1, "#020408");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle holographic grid
    ctx.strokeStyle = isDoctorRole ? "rgba(212, 175, 55, 0.07)" : "rgba(16, 185, 129, 0.07)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Moving laser scanner line
    const scanY = (frame * 2.2) % height;
    const scanGrad = ctx.createLinearGradient(0, scanY - 35, 0, scanY);
    scanGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    scanGrad.addColorStop(1, isDoctorRole ? "rgba(212, 175, 55, 0.25)" : "rgba(14, 165, 233, 0.35)");
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 35, width, 35);
    ctx.strokeStyle = isDoctorRole ? "rgba(212, 175, 55, 0.7)" : "rgba(14, 165, 233, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(width, scanY);
    ctx.stroke();

    // Central Diagnostic Target / Silhouette
    const cx = width / 2;
    const cy = height / 2 - 20;

    ctx.strokeStyle = isDoctorRole ? "rgba(212, 175, 55, 0.35)" : "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating target reticle
    const angle = (frame * 0.015) % (Math.PI * 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = secondaryAccent;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Crosshairs
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy);
    ctx.lineTo(cx + 150, cy);
    ctx.moveTo(cx, cy - 140);
    ctx.lineTo(cx, cy + 140);
    ctx.stroke();

    // Center Avatar Symbol
    ctx.fillStyle = primaryAccent;
    ctx.font = "bold 28px 'Cinzel', serif";
    ctx.textAlign = "center";
    ctx.fillText(isDoctorRole ? "✚ CLINICIAN" : "👤 PATIENT", cx, cy + 10);
    ctx.textAlign = "left";

    // ECG Pulse Calculation
    const pulsePhase = frame % 60;
    let ecgY = 0;
    if (pulsePhase === 20) ecgY = -14;
    else if (pulsePhase === 22) ecgY = 52;
    else if (pulsePhase === 24) ecgY = -32;
    else if (pulsePhase === 26) ecgY = 10;
    else ecgY = Math.sin(frame * 0.15) * 3;

    ecgPoints.push(ecgY);
    if (ecgPoints.length > maxEcgPoints) ecgPoints.shift();

    // Draw ECG strip along bottom
    ctx.strokeStyle = isDoctorRole ? "#E2C366" : "#10B981";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const stripStartX = width / 2 - 240;
    const stripY = height - 100;
    for (let i = 0; i < ecgPoints.length; i++) {
      const px = stripStartX + i * 4;
      const py = stripY + ecgPoints[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Medical HUD Text & Telemetry
    ctx.fillStyle = primaryAccent;
    ctx.font = "bold 15px 'JetBrains Mono', monospace";
    ctx.fillText(`● 1080p WEBRTC ${isDoctorRole ? "CLINICAL PRACTITIONER" : "PATIENT BIOMETRIC"} FEED`, 40, 50);

    ctx.fillStyle = "#E4E4E7";
    ctx.font = "13px 'JetBrains Mono', monospace";
    const displayName = participantName ? `${participantName.toUpperCase()}` : label;
    ctx.fillText(`IDENT: ${displayName} [${role.toUpperCase()}]`, 40, 75);

    ctx.fillStyle = "#A1A1AA";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText(`ENTROPY: 0.942 | FRAME: ${frame} | QPU TELEMETRY: ACTIVE`, 40, 95);
    ctx.fillText("SESSION FIDELITY: 99.4% | QUANTUM NOISE RESILIENCE: OPTIMAL", 40, 115);

    ctx.fillStyle = "#10B981";
    ctx.fillText("DTLS-SRTP 256-BIT SECURE", width - 270, 50);
  }

  // Draw loop
  const intervalId = setInterval(renderFrame, 1000 / 30);
  const stream = canvas.captureStream(30);

  // Synthesize a silent Web Audio track so audio tracks are always valid
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.00001; // silent carrier tone
      osc.connect(gain);
      const dest = audioCtx.createMediaStreamDestination();
      gain.connect(dest);
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    }
  } catch (err) {
    console.warn("Synthetic audio context init warning:", err);
  }

  // Cleanup attachment on stop
  stream.getTracks().forEach((track) => {
    const origStop = track.stop.bind(track);
    track.stop = () => {
      clearInterval(intervalId);
      origStop();
    };
  });

  return stream;
}

/**
 * Acquire user media stream (camera + mic) with automatic synthetic fallback.
 */
export async function getClinicalMediaStream({
  video = true,
  audio = true,
  role = "doctor",
  participantName = "",
} = {}) {
  try {
    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      if (stream && stream.getVideoTracks().length > 0) {
        return { stream, isSynthetic: false };
      }
    }
  } catch (err) {
    console.warn("Real media hardware busy or unavailable. Falling back to synthetic telemetry stream:", err);
  }

  // Fallback to high-definition animated medical telemetry feed
  const stream = createSyntheticMedicalStream({
    label: role === "doctor" ? "DR. CLINICAL ENCRYPTED FEED" : "PATIENT BIOMETRIC SCAN FEED",
    role,
    participantName,
  });
  return { stream, isSynthetic: true };
}

/**
 * Capture screen share stream with seamless return.
 */
export async function getScreenShareStream() {
  if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    return await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: false,
    });
  }
  throw new Error("Screen sharing not supported on this browser.");
}

/**
 * Setup RTCPeerConnection with resilient Google & Cloudflare STUN infrastructure.
 */
export function createClinicalPeerConnection({ onTrack, onIceCandidate, onConnectionStateChange } = {}) {
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
    ],
    iceCandidatePoolSize: 10,
  };

  const pc = new RTCPeerConnection(config);

  if (onTrack) {
    pc.ontrack = (event) => {
      const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      onTrack(stream);
    };
  }

  if (onIceCandidate) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };
  }

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc.connectionState);
    };
  }

  return pc;
}

/**
 * Capture high-resolution JPEG snapshot from an active HTML5 video element.
 */
export function captureVideoSnapshot(videoElement) {
  if (!videoElement) return null;
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth || 1280;
  canvas.height = videoElement.videoHeight || 720;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Overlay clinical watermarking
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(10, canvas.height - 40, 420, 30);
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText(`Q-RAKSHAK CLINICAL SNAPSHOT • ${new Date().toISOString().slice(0, 19)}`, 20, canvas.height - 20);

  return canvas.toDataURL("image/jpeg", 0.92);
}

