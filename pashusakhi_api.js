/**
 * PashuSakhi Unified API Client
 * Connects Frontend Web Applications to the Live PashuSakhi Backend
 * Base URL: http://localhost:5000/api/v1
 */

(function (window) {
  const API_BASE = "http://localhost:5000/api/v1";

  function getToken() {
    try {
      return localStorage.getItem("psk_token") || null;
    } catch (e) {
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) {
        localStorage.setItem("psk_token", token);
      } else {
        localStorage.removeItem("psk_token");
      }
    } catch (e) {}
  }

  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = json?.message || `Request failed with status ${response.status}`;
        console.warn(`[PashuSakhi API Error] ${endpoint}:`, errorMsg);
        return { success: false, statusCode: response.status, message: errorMsg, data: null, error: json?.error };
      }

      return json;
    } catch (err) {
      console.warn(`[PashuSakhi API Offline] Could not reach ${url}:`, err.message);
      return {
        success: false,
        statusCode: 0,
        message: "Backend server is offline or unreachable.",
        data: null,
        error: err,
        isOffline: true,
      };
    }
  }

  const PashuSakhiApi = {
    baseUrl: API_BASE,
    getToken,
    setToken,

    // Health
    async checkHealth() {
      try {
        const res = await fetch("http://localhost:5000/api/health");
        return await res.json();
      } catch (e) {
        return { success: false, data: { status: "offline" } };
      }
    },

    // Auth
    async login(email, password) {
      const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.data?.token) {
        setToken(res.data.token);
      }
      return res;
    },

    async register(userData) {
      const res = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      if (res.success && res.data?.token) {
        setToken(res.data.token);
      }
      return res;
    },

    async getMe() {
      return request("/auth/me");
    },

    // User Profile
    async getProfile() {
      return request("/users/profile");
    },

    async updateProfile(profileData) {
      return request("/users/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });
    },

    // Animals / Livestock
    async getAnimals() {
      return request("/animals");
    },

    async getAnimalById(id) {
      return request(`/animals/${id}`);
    },

    async createAnimal(animalData) {
      return request("/animals", {
        method: "POST",
        body: JSON.stringify(animalData),
      });
    },

    async updateAnimal(id, updateData) {
      return request(`/animals/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
    },

    async deleteAnimal(id) {
      return request(`/animals/${id}`, {
        method: "DELETE",
      });
    },

    async getAnimalHistory(id) {
      return request(`/animals/${id}/history`);
    },

    // Telemedicine Consultations
    async getConsultations() {
      return request("/consultations");
    },

    async getConsultationById(id) {
      return request(`/consultations/${id}`);
    },

    async createConsultation(data) {
      return request("/consultations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async updateConsultationStatus(id, status) {
      return request(`/consultations/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    async sendChatMessage(consultationId, messageText, category = "general") {
      return request(`/consultations/${consultationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ messageText, category }),
      });
    },

    // Treatments
    async getActiveTreatments() {
      return request("/treatments/active");
    },

    async createTreatment(data) {
      return request("/treatments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async updateTreatment(id, data) {
      return request(`/treatments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    // AI Diagnostics / Screening
    async submitSymptomScreening(data) {
      if (!getToken()) {
        try {
          console.log("[PashuSakhiApi] Authenticating as demo farmer...");
          await PashuSakhiApi.login("farmer@pashusakhi.in", "farmer123");
        } catch (e) {
          console.warn("[PashuSakhiApi] Auto-login fallback failed:", e);
        }
      }
      console.log("🐾 [PashuSakhiApi] Sending request to Live Gemini Backend (/diagnostics/symptoms)...", data);
      const res = await request("/diagnostics/symptoms", {
        method: "POST",
        body: JSON.stringify(data),
      });
      console.log("✨ [PashuSakhiApi] Backend triage response:", res);
      return res;
    },


    async getScreeningReports() {
      return request("/diagnostics/reports");
    },

    async updateReportStatus(id, status, vetReviewNotes) {
      return request(`/diagnostics/reports/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, vetReviewNotes }),
      });
    },

    // Emergencies
    async getEmergencies() {
      return request("/emergencies");
    },

    async createEmergency(data) {
      return request("/emergencies", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async acceptEmergency(id) {
      return request(`/emergencies/${id}/accept`, {
        method: "POST",
      });
    },

    async updateEmergencyStatus(id, status) {
      return request(`/emergencies/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    // Notifications
    async getNotifications() {
      return request("/notifications");
    },

    async markNotificationRead(id) {
      return request(`/notifications/${id}/read`, {
        method: "PATCH",
      });
    },

    // Surveillance Hotspots
    async getHotspots() {
      return request("/surveillance/hotspots");
    },

    async getHotspotById(id) {
      return request(`/surveillance/hotspots/${id}`);
    },

    // Complaints
    async submitComplaint(data) {
      return request("/complaints", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async getAdminComplaints() {
      return request("/admin/complaints");
    },

    async updateComplaint(id, data) {
      return request(`/admin/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  };

  window.PashuSakhiApi = PashuSakhiApi;

  // Purge any stale hardcoded reports from previous prototype sessions
  try {
    const rawReports = localStorage.getItem("psk_shared_reports");
    if (rawReports) {
      const parsed = JSON.parse(rawReports);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(r => !r.id || !String(r.id).startsWith("rep_10"));
        localStorage.setItem("psk_shared_reports", JSON.stringify(cleaned));
      }
    }
  } catch (e) {}

  // Seamless auto-authentication on initialization for seamless testing & UI sync
  try {
    if (!getToken()) {
      PashuSakhiApi.login("farmer@pashusakhi.in", "farmer123").then(res => {
        if (res?.success) console.log("[PashuSakhiApi] Auto-authenticated demo farmer session.");
      }).catch(err => {
        console.warn("[PashuSakhiApi] Auto-login check:", err);
      });
    }
  } catch (e) {}
})(window);


