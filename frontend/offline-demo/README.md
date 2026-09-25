# Pashu Sakhi - Farmer Dashboard (Pure Frontend)

This folder contains a complete, standalone version of the **Pashu Sakhi Farmer Dashboard**.
It runs **100% in the browser** without needing:
- Any backend server (Node, Python, PHP, etc.)
- Any local web server (`localhost:3000`, `http://...`)
- Any internet connection (all React, ReactDOM, and Lucide icons are bundled locally in `vendor/`)

---

## How to Run
Simply **double-click `index.html`** or drag and drop it into any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, etc.).
It opens immediately using `file://` protocol with zero configuration!

---

## Files Included
- **`index.html`**: Main frontend entry point.
- **`style.css`**: Complete design system, colors, animations, responsive layout styles.
- **`app.js`**: Pre-compiled vanilla JavaScript application containing the entire Farmer Dashboard with all features:
  - Livestock health tracking
  - AI Help (Integrated Disease Detection & Screening + Audio Voice Recording)
  - Chat with Vet with previous consultations & current live chats
  - IVR Quick Access
  - Multilingual support
  - Dark / Light modes & accessibility
- **`bridge.js`**: Client-side storage engine (`localStorage`) managing reports, emergencies, and animal records.
- **`pashusakhi_api.js`**: Offline-safe API client interface.
- **`vendor/`**: Bundled React, ReactDOM, and Lucide icon libraries for offline execution.
- **`farmer_standalone.html`**: An all-in-one self-contained single file copy.
- **`pashu_sakhi_logo.jpg`**: Official Pashu Sakhi logo asset.
