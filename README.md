# Solar Irrigation Firebase Project

This project uses Firebase Realtime Database as the live backend.

Real hardware data flow:

```text
ESP32 irrigation_system.ino -> Firebase Realtime Database -> Web dashboard + Mobile app
```

There is no local backend server required when the real ESP32 is running.
The `backend/` folder is only for testing without hardware.

## Firebase Data Paths

The ESP32 writes:

```text
/sensors/eau
/sensors/pluie
/sensors/etat
/sensors/pump
/sensors/motor
/sensors/lastSeen
```

The dashboard and mobile app write commands:

```text
/controls/pump
/controls/motor
```

The ESP32 reads those commands and controls the relay/motor.

## Real Hardware Run

1. Open `arduino/irrigation_system.ino` in Arduino IDE.
2. Replace the placeholder WiFi and Firebase values at the top of the sketch with your own credentials.
3. Select the ESP32 board and port.
4. Upload the sketch to the ESP32.
5. Open Serial Monitor at `115200`.
6. Confirm you see:

```text
WiFi Connected
Firebase write test OK
SYSTEME PRET
```

7. Open Firebase Realtime Database and check that `/sensors` is updating.

Do not run `backend/esp32Simulator.js` while using the real ESP32, because the simulator also writes to `/sensors` and can overwrite real hardware data.

## Web Dashboard

From `PFA/frontend`:

```bash
npm install
npm.cmd run dev
```

Open the Vite URL, usually:

```text
http://localhost:5173
```

The web dashboard reads directly from Firebase.

## Mobile App

From `PFA/irrigation-mobile`:

```bash
npm install
npm.cmd start
```

The mobile app reads and writes directly to Firebase.

## Backend Folder

Use `backend/` only when you do not have the ESP32 connected and want fake live data for testing.

From `PFA/backend`:

```bash
npm.cmd start
```

Stop it before testing the real ESP32.
