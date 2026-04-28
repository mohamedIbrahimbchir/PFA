/**
 * Compatibility entrypoint.
 *
 * This project used to have two backend scripts: deviceSimulator.js and
 * esp32Simulator.js. Both now run the same Firebase-backed simulator so either
 * command keeps dashboard/mobile data live and mirrors controls/ into sensors/.
 */

const { runCli } = require('./simulatorCore');

runCli().catch((error) => {
  console.error('Device simulator failed:', error.message);
  process.exit(1);
});
