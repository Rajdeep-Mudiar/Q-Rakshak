import apiClient from "./client";
import { ENDPOINTS } from "./config";

export const consultationsApi = {
  async listDoctors(specialty = null, status = "verified") {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_DOCTORS(specialty, status));
  },

  async getDoctorProfile(doctorId) {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_DOCTOR_PROFILE(doctorId));
  },

  async holdSlot(doctorId, slotTime, patientId = null) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_SLOTS_HOLD, {
      doctor_id: doctorId,
      slot_time: slotTime,
      patient_id: patientId,
    });
  },

  async checkTriage(symptoms, vitals = {}) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_TRIAGE, {
      symptoms,
      ...vitals,
    });
  },

  async bookConsultation(bookingPayload) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_BOOK, bookingPayload);
  },

  async listBookings(patientId = null, doctorId = null) {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_BOOKINGS(patientId, doctorId));
  },

  async getBooking(bookingId) {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_BOOKING_DETAILS(bookingId));
  },

  async transitionBooking(bookingId, status, reason = "") {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_BOOKING_TRANSITION(bookingId), {
      status,
      reason,
    });
  },

  async getRoom(bookingId) {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_ROOM(bookingId));
  },

  async admitPatient(bookingId) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_ROOM_ADMIT(bookingId), {});
  },

  async sendChatMessage(bookingId, sender, text) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_ROOM_CHAT(bookingId), {
      sender,
      text,
    });
  },

  async publishSignal(bookingId, signalType, payload, senderRole = null, senderId = null) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_ROOM_PUBLISH_SIGNAL(bookingId), {
      signal_type: signalType,
      payload,
      sender_role: senderRole,
      sender_id: senderId,
    });
  },

  async listSignals(bookingId, afterId = 0, role = null) {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_ROOM_SIGNALS(bookingId, afterId, role));
  },

  async checkDrugInteractions(candidateDrugs, currentMedications = []) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_DRUG_INTERACTIONS, {
      candidate_drugs: candidateDrugs,
      current_medications: currentMedications,
    });
  },

  async getPharmaCatalog() {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_PHARMA_CATALOG);
  },

  async analyzePharma(medications = [], dietaryItems = [], patientId = null) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_PHARMA_ANALYZE, {
      medications,
      dietary_items: dietaryItems,
      patient_id: patientId,
    });
  },

  async createPrescription(prescriptionPayload) {
    return apiClient.post(ENDPOINTS.CONSULTATIONS_PRESCRIPTION_CREATE, prescriptionPayload);
  },

  async listPrescriptions(patientId = null, doctorId = null) {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_PRESCRIPTIONS(patientId, doctorId));
  },

  async getPrescription(prescriptionId) {
    return apiClient.get(ENDPOINTS.CONSULTATIONS_PRESCRIPTION_DETAILS(prescriptionId));
  },

  /**
   * Establishes real-time bi-directional WebSocket connection for WebRTC signaling and chat
   */
  connectWebSocket(bookingId, { onSignal, onChat, onRoomState, onOpen, onClose, onError } = {}) {
    const wsUrl = ENDPOINTS.CONSULTATIONS_WS_ROOM(bookingId);
    let socket = null;
    let pingTimer = null;
    try {
      socket = new WebSocket(wsUrl);
      socket.onopen = (evt) => {
        // Periodic keepalive ping every 25 seconds to keep cloud proxy open
        pingTimer = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
        if (onOpen) onOpen(evt);
      };
      socket.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === "pong") return; // Keepalive handshake ack
          if (data.type === "signal" && onSignal) onSignal(data);
          else if (data.type === "chat" && onChat) onChat(data);
          else if (data.type === "room_state" && onRoomState) onRoomState(data);
        } catch (e) {
          console.warn("[WebSocket Parse Error]", e);
        }
      };
      socket.onerror = (err) => {
        if (onError) onError(err);
      };
      socket.onclose = (evt) => {
        if (pingTimer) clearInterval(pingTimer);
        if (onClose) onClose(evt);
      };
    } catch (e) {
      if (pingTimer) clearInterval(pingTimer);
      if (onError) onError(e);
    }
    return socket;
  },
};
