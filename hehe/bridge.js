(function() {
  const _tabId = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const _listeners = new Set();

  function _get(key, defaultVal) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function _set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('PashuSakhiBridge storage write failed:', e);
    }
  }

  function broadcast(event, data) {
    const payload = { event, data, timestamp: Date.now(), sourceId: _tabId };
    try {
      localStorage.setItem('psk_bridge_event', JSON.stringify(payload));
    } catch (e) {}
    _listeners.forEach(fn => {
      try { fn(event, data); } catch (err) { console.error('PashuSakhiBridge listener error:', err); }
    });
  }

  window.addEventListener('storage', function(e) {
    if (e.key === 'psk_bridge_event' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload && payload.sourceId !== _tabId) {
          _listeners.forEach(fn => {
            try { fn(payload.event, payload.data); } catch (err) { console.error('PashuSakhiBridge cross-tab listener error:', err); }
          });
        }
      } catch (err) {}
    }
  });

  window.PashuSakhiBridge = {
    tabId: _tabId,

    setSession: function(sessionObj) {
      _set('psk_session', sessionObj);
      if (sessionObj && sessionObj.language) {
        try {
          localStorage.setItem('psk_language', sessionObj.language);
          localStorage.setItem('lumen_selected_language', sessionObj.language);
        } catch (e) {}
      }
      broadcast('psk:session:updated', sessionObj);
    },

    getSession: function() {
      return _get('psk_session', null);
    },

    clearSession: function() {
      try {
        localStorage.removeItem('psk_session');
        localStorage.removeItem('session:current');
        localStorage.removeItem('pashusakhi_user');
      } catch (e) {}
      broadcast('psk:session:cleared', {});
    },

    getReports: function(filter) {
      const all = _get('psk_shared_reports', []);
      if (!filter || filter === 'All') return all;
      return all.filter(r => (r.status || '').toLowerCase() === filter.toLowerCase());
    },

    addReport: function(report) {
      const reports = _get('psk_shared_reports', []);
      const newRep = {
        id: report.id || ('rep_' + Date.now()),
        type: report.type || 'screening',
        animalId: report.animalId || 'a1',
        animalName: report.animalName || 'Livestock',
        farmerName: report.farmerName || 'Suresh Patil',
        date: report.date || new Date().toISOString().split('T')[0],
        condition: report.condition || 'Suspected condition',
        severity: report.severity || 'attention',
        confidence: report.confidence || 85,
        status: report.status || 'New',
        details: report.details || {}
      };
      reports.unshift(newRep);
      _set('psk_shared_reports', reports);
      broadcast('psk:report:added', newRep);
      return newRep;
    },

    updateReportStatus: function(id, status) {
      const reports = _get('psk_shared_reports', []);
      let updated = null;
      const next = reports.map(r => {
        if (r.id === id) {
          updated = { ...r, status };
          return updated;
        }
        return r;
      });
      _set('psk_shared_reports', next);
      if (updated) broadcast('psk:report:updated', updated);
      return updated;
    },

    getEmergencies: function(filter) {
      const all = _get('psk_shared_emergencies', []);
      if (!filter || filter === 'All') return all;
      return all.filter(e => (e.status || '').toLowerCase() === filter.toLowerCase());
    },

    addEmergency: function(emergency) {
      const emergencies = _get('psk_shared_emergencies', []);
      const newEmg = {
        id: emergency.id || ('emg_' + Date.now()),
        animalId: emergency.animalId || 'a1',
        animalName: emergency.animalName || 'Livestock',
        farmerName: emergency.farmerName || 'Suresh Patil',
        village: emergency.village || 'Wagholi, Pune',
        contact: emergency.contact || '+91 98765 43210',
        severity: emergency.severity || 'critical',
        status: emergency.status || 'new',
        title: emergency.title || 'Emergency Case',
        time: emergency.time || 'Just now',
        assignedVet: emergency.assignedVet || null
      };
      emergencies.unshift(newEmg);
      _set('psk_shared_emergencies', emergencies);
      broadcast('psk:emergency:added', newEmg);
      return newEmg;
    },

    updateEmergencyStatus: function(id, status, vetName) {
      const emergencies = _get('psk_shared_emergencies', []);
      let updated = null;
      const next = emergencies.map(e => {
        if (e.id === id) {
          updated = {
            ...e,
            status,
            assignedVet: vetName || e.assignedVet || 'Dr. Kavita Rao'
          };
          return updated;
        }
        return e;
      });
      _set('psk_shared_emergencies', next);
      if (updated) broadcast('psk:emergency:updated', updated);
      return updated;
    },

    getChats: function(animalId) {
      const chats = _get('psk_shared_chats', {});
      return animalId ? (chats[animalId] || []) : chats;
    },

    sendChat: function(animalId, msg) {
      const chats = _get('psk_shared_chats', {});
      if (!chats[animalId]) chats[animalId] = [];
      const newMsg = {
        id: msg.id || ('msg_' + Date.now()),
        sender: msg.sender || 'farmer',
        text: msg.text || '',
        time: msg.time || 'Just now',
        timestamp: Date.now(),
        animalId: animalId
      };
      chats[animalId].push(newMsg);
      _set('psk_shared_chats', chats);
      broadcast('psk:chat:message', { animalId, message: newMsg });
      return newMsg;
    },

    getAnimals: function() {
      return _get('psk_shared_animals', null);
    },

    addTreatment: function(animalId, treatmentObj) {
      const animalsData = _get('psk_shared_animals', {});
      if (!animalsData[animalId]) animalsData[animalId] = { treatments: [] };
      if (!animalsData[animalId].treatments) animalsData[animalId].treatments = [];
      const entry = {
        id: 'trt_' + Date.now(),
        date: treatmentObj.date || new Date().toISOString().split('T')[0],
        condition: treatmentObj.condition || 'Clinical Treatment',
        medicine: treatmentObj.medicine || 'Prescribed Drug',
        dosage: treatmentObj.dosage || 'Standard dose',
        route: treatmentObj.route || 'Oral',
        duration: treatmentObj.duration || '3 days',
        notes: treatmentObj.notes || 'Recorded by veterinarian',
        vetName: treatmentObj.vetName || 'Dr. Kavita Rao'
      };
      animalsData[animalId].treatments.unshift(entry);
      _set('psk_shared_animals', animalsData);
      broadcast('psk:treatment:added', { animalId, treatment: entry });
      return entry;
    },

    updateUserStatus: function(userId, status) {
      const users = _get('psk_shared_users', {});
      users[userId] = { status, updatedAt: Date.now() };
      _set('psk_shared_users', users);
      broadcast('psk:user:updated', { userId, status });
    },

    updateCase: function(caseId, updates) {
      const cases = _get('psk_shared_cases', {});
      cases[caseId] = { ...(cases[caseId] || {}), ...updates, updatedAt: Date.now() };
      _set('psk_shared_cases', cases);
      broadcast('psk:case:updated', { caseId, updates });
    },

    updateComplaint: function(id, status) {
      const complaints = _get('psk_shared_complaints', {});
      complaints[id] = { status, updatedAt: Date.now() };
      _set('psk_shared_complaints', complaints);
      broadcast('psk:complaint:updated', { id, status });
    },

    onEvent: function(fn) {
      if (typeof fn === 'function') _listeners.add(fn);
    },

    offEvent: function(fn) {
      _listeners.delete(fn);
    },

    seedDefaultData: function() {
      if (!localStorage.getItem('psk_shared_reports')) {
        const defaultReports = [
          { id: "rep_101", type: "detection", animalId: "a1", animalName: "Gauri (Cow)", farmerName: "Suresh Patil", date: new Date().toISOString().split('T')[0], condition: "Suspected Bovine Dermatitis", severity: "attention", confidence: 87, status: "Under Review", details: { title: "Suspected Bovine Dermatitis / Cutaneous Lesions" } },
          { id: "rep_102", type: "detection", animalId: "a2", animalName: "Raju (Bullock)", farmerName: "Suresh Patil", date: new Date().toISOString().split('T')[0], condition: "Suspected Nodular Skin Lesions", severity: "urgent", confidence: 91, status: "New", details: { title: "Suspected Nodular Skin Lesions" } },
          { id: "rep_103", type: "screening", animalId: "a3", animalName: "Lakshmi (Buffalo)", farmerName: "Suresh Patil", date: new Date().toISOString().split('T')[0], condition: "Mild Bloat & Lethargy", severity: "attention", confidence: 82, status: "Resolved", details: { title: "Mild Bloat" } }
        ];
        _set('psk_shared_reports', defaultReports);
      }

      if (!localStorage.getItem('psk_shared_emergencies')) {
        const defaultEmergencies = [
          { id: "emg_101", animalId: "a2", animalName: "Raju (Bullock)", farmerName: "Suresh Patil", village: "Wagholi, Pune", contact: "+91 98765 43210", severity: "critical", status: "new", title: "Severe colic & unable to stand", time: "14 min ago", assignedVet: null },
          { id: "emg_102", animalId: "a1", animalName: "Gauri (Cow)", farmerName: "Suresh Patil", village: "Wagholi, Pune", contact: "+91 98765 43210", severity: "high", status: "accepted", title: "Sudden high fever & respiratory distress", time: "35 min ago", assignedVet: "Dr. Kavita Rao" }
        ];
        _set('psk_shared_emergencies', defaultEmergencies);
      }
    }
  };
})();