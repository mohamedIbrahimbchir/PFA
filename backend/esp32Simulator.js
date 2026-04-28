/**
 * Simulates the ESP32 device against Firebase Realtime Database.
 *
 * Run from the project root:
 *   node backend/esp32Simulator.js
 *
 * Quick connectivity test:
 *   node backend/esp32Simulator.js --once
 */

const { runCli } = require('./simulatorCore');

runCli().catch((error) => {
  console.error('Simulator failed:', error.message);
  process.exit(1);
});
