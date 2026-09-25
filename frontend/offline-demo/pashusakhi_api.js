/**
 * PashuSakhi Offline-Safe API Mock
 * Allows frontend to operate 100% client-side without a running backend server
 */
(function(window) {
  'use strict';
  window.PashuSakhiApi = {
    baseUrl: 'offline',
    getToken: () => localStorage.getItem('psk_token') || null,
    setToken: (t) => { if (t) localStorage.setItem('psk_token', t); else localStorage.removeItem('psk_token'); },
    checkHealth: async () => ({ success: true, data: { status: 'offline_mode' } }),
    login: async () => ({ success: true, data: { token: 'mock_token' } }),
    register: async () => ({ success: true, data: { token: 'mock_token' } }),
    isOfflineMode: true
  };
})(window);
