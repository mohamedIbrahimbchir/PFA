# Firebase Backend Simulator Only

This folder is not needed for real ESP32 hardware.

The real data path is:

```text
ESP32 irrigation_system.ino -> Firebase Realtime Database -> dashboard/mobile
```

This backend only simulates the ESP32 device for the web dashboard and mobile app
when you do not have the hardware connected.
It writes live values to `sensors/`, reads commands from `controls/`, and mirrors
the pump/motor command state back into `sensors/`.

Do not run this simulator at the same time as the real ESP32, because both will
write to `/sensors` and the simulator can overwrite real hardware data.

## Run

From `PFA/backend`:

```bash
npm start
```

Quick one-shot test:

```bash
npm run once
```

Both old entrypoints also work:

```bash
node esp32Simulator.js
node deviceSimulator.js
```

## Required `.env`

```env
FIREBASE_URL=...
FIREBASE_API_KEY=...
FIREBASE_EMAIL=...
FIREBASE_PASSWORD=...
```

The simulator authenticates with Firebase Auth when email/password credentials
are present. If they are missing, it falls back to public Realtime Database
access.
