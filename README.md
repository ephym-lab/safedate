# SafeDate 💬📍

**A safety companion layer for online dating — built for the Matchmakers Hackathon (Nairobi, Kenya).**

SafeDate isn't a dating app. It's the safety net dating apps forgot to build. Log your date, and SafeDate quietly watches your back — checking in via SMS, detecting when you arrive, listening for signs of distress, and alerting your emergency contacts if something feels wrong.

> Built by [Your Team Name] for the Matchmakers Hackathon 2026.

---

## The Problem

Meeting someone from a dating app for the first time is still one of the most vulnerable moments in modern dating. Existing apps offer almost no safety infrastructure beyond "share your location with a friend" — and that relies on someone remembering to actually do it, and actually checking in later.

In the African context specifically:
- Physical safety on first meetups is a real, common fear — especially for women.
- Data costs and patchy connectivity make heavy safety apps impractical.
- Most safety tools are generic, not built around the *actual moment of risk*: the date itself.

**SafeDate plugs into that gap** — not by replacing your dating app, but by sitting alongside it as a lightweight safety layer for the meetup itself.

---

## How It Works

1. **Log your date** — who you're meeting, where, when, and your emergency contact(s).
2. **Arrival detection** — SafeDate detects when you reach the date location and sends a friendly check-in SMS.
3. **Periodic check-ins** — automated SMS check-ins throughout the date: reply `OKAY` or `HELP`.
4. **Duress safe-word** — a disguised phrase you can text instead of `HELP` if it's not safe to ask openly — triggers the same alert silently.
5. **Passive sound detection** *(on-device, opt-in)* — listens for signs of distress (screaming, crashing, shouting) during the date window and auto-triggers a check-in if detected.
6. **Emergency escalation** — if you reply `HELP`, don't respond, or a distress sound is detected, SafeDate immediately alerts your emergency contact via SMS (and optionally a call) with a live location link.

```
Log Date → Arrive → Check-in (OKAY / HELP) → 
   ↳ OKAY → continue monitoring → session ends safely
   ↳ HELP / no response / distress sound detected → escalate to emergency contact
```

---

## Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Date logging (partner, location, time, emergency contacts) | ✅ MVP |
| 2 | Geofenced arrival detection | ✅ MVP |
| 3 | Arrival check-in SMS | ✅ MVP |
| 4 | Periodic check-in SMS | ✅ MVP |
| 5 | Two-way SMS handling (OKAY / HELP / no response) | ✅ MVP |
| 6 | Duress safe-word | ✅ MVP |
| 7 | Emergency contact escalation (SMS + live location link) | ✅ MVP |
| 8 | Passive sound anomaly detection (on-device, pretrained model) | 🔶 Stretch |

---

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Python + Flask
- **Database:** Firebase Firestore / Supabase (or SQLite for a quick local demo)
- **Scheduler:** APScheduler (for periodic check-ins)
- **SMS & Voice:** [Africa's Talking API](https://africastalking.com/) (Python SDK, sandbox)
- **Sound Detection:** TensorFlow.js + YAMNet (pretrained audio event classifier, runs on-device in the browser)
- **Location:** Browser Geolocation API

---

## Project Structure

```
safedate/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Dashboard, Log Date, Active Session, Settings
│   │   ├── services/       # API service layer (api.js)
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routes/         # API endpoints (Flask blueprints)
│   │   ├── services/       # SMS, geofencing, scheduler logic
│   │   ├── models/         # DB schema/models
│   │   └── __init__.py     # Flask app factory
│   ├── requirements.txt
│   └── run.py
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- An [Africa's Talking](https://africastalking.com/) sandbox account (free)
- A Firebase or Supabase project

### 1. Clone the repo
```bash
git clone https://github.com/[your-org]/safedate.git
cd safedate
```

### 2. Backend setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # add your Africa's Talking API key + DB credentials
flask run
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Environment variables
Create a `.env` file in `backend/` with:
```
AT_API_KEY=your_africas_talking_key
AT_USERNAME=sandbox
DB_URL=your_database_url
FLASK_APP=run.py
FLASK_ENV=development
PORT=5000
```

---

## Demo Flow (for judges)

1. Log a date session with a real phone number.
2. Simulate arrival at the location (or use the "Simulate Arrival" debug button).
3. Watch the arrival SMS land on the demo phone live.
4. Reply `OKAY` — show the status update in the dashboard.
5. Trigger a simulated distress sound (or reply `HELP` / the duress word).
6. Show the emergency contact receiving an alert SMS with a live location link.

---

## Privacy & Safety Principles

- **Opt-in only** — monitoring is only active during a session you explicitly start.
- **Time-boxed** — sessions auto-expire after a set window; nothing runs indefinitely in the background.
- **On-device audio processing** — raw audio is never uploaded or stored; only classification results are used.
- **You're always in control** — end a session manually at any time.

---

## Roadmap / Future Work

- Native mobile app (iOS/Android) for true background location and mic access
- Direct API integrations with dating apps (pending partnerships)
- Multi-language SMS support (Swahili, Sheng, etc.)
- Community trust network — vouch for a match via mutual friends
- Voice-call check-ins as an alternative to SMS

---

## Team

- [Name] — [Role]
- [Name] — [Role]
- [Name] — [Role]
- [Name] — [Role]

---

## License

Built for the Matchmakers Hackathon 2026. [Add license if applicable, e.g. MIT.]# safedate
