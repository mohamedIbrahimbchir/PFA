const { FirebaseRestClient } = require('./firebaseClient');

const DEFAULT_INTERVAL_MS = 2000;
const RAIN_THRESHOLD = 1500;

function asBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'on', 'yes'].includes(normalized);
  }
  return false;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(value);
}

function buildAlerts(sensorData) {
  const now = new Date().toISOString();
  const alerts = {};

  if (sensorData.eau < 20) {
    alerts.waterCritical = {
      severity: 'danger',
      message: 'Water level critical - immediate action required',
      timestamp: now,
    };
  } else if (sensorData.eau < 40) {
    alerts.waterLow = {
      severity: 'warning',
      message: 'Water level low - consider irrigation',
      timestamp: now,
    };
  }

  if (sensorData.etat === 'PLUIE') {
    alerts.rainDetected = {
      severity: 'info',
      message: 'Rain detected - auto-irrigation paused',
      timestamp: now,
    };
  }

  return alerts;
}

class IrrigationSimulator {
  constructor(options = {}) {
    this.client = options.client || new FirebaseRestClient();
    this.intervalMs = Number(options.intervalMs || DEFAULT_INTERVAL_MS);
    this.tickCount = 0;
    this.interval = null;
    this.waterLevel = 65;
    this.rainRaw = 2800;
    this.lastControls = { pump: false, motor: false };
  }

  async ensureDatabaseShape() {
    const controls = (await this.client.get('controls')) || {};
    const sensors = (await this.client.get('sensors')) || {};

    const nextControls = {
      pump: asBool(controls.pump),
      motor: asBool(controls.motor),
    };

    this.lastControls = nextControls;

    await this.client.patch('controls', nextControls);
    await this.client.patch('sensors', {
      eau: Number.isFinite(Number(sensors.eau)) ? Number(sensors.eau) : round(this.waterLevel),
      pluie: Number.isFinite(Number(sensors.pluie)) ? Number(sensors.pluie) : round(this.rainRaw),
      etat: sensors.etat === 'PLUIE' ? 'PLUIE' : 'SEC',
      pump: asBool(sensors.pump),
      motor: asBool(sensors.motor),
      lastSeen: Math.floor(Date.now() / 1000),
    });
  }

  nextWaterLevel(pumpOn) {
    const drift = (Math.random() - 0.45) * 2.8;
    const pumpEffect = pumpOn ? -0.9 : 0.25;
    this.waterLevel = clamp(this.waterLevel + drift + pumpEffect, 8, 96);
    return round(this.waterLevel);
  }

  nextRainRaw() {
    if (Math.random() < 0.06) {
      this.rainRaw = this.rainRaw < RAIN_THRESHOLD ? 2850 : 850;
    }

    this.rainRaw = clamp(this.rainRaw + (Math.random() - 0.5) * 90, 0, 4095);
    return round(this.rainRaw);
  }

  async readControls() {
    const controls = (await this.client.get('controls')) || {};
    this.lastControls = {
      pump: asBool(controls.pump),
      motor: asBool(controls.motor),
    };
    return this.lastControls;
  }

  async writeSensorData(controls) {
    const pluie = this.nextRainRaw();
    const sensorData = {
      eau: this.nextWaterLevel(controls.pump),
      pluie,
      etat: pluie < RAIN_THRESHOLD ? 'PLUIE' : 'SEC',
      pump: controls.pump,
      motor: controls.motor,
      lastSeen: Math.floor(Date.now() / 1000),
    };

    await this.client.patch('sensors', sensorData);
    await this.client.put('irrigationAlerts', buildAlerts(sensorData));
    return sensorData;
  }

  async tick() {
    this.tickCount += 1;
    const controls = await this.readControls();
    const sensorData = await this.writeSensorData(controls);

    const line =
      `[tick ${String(this.tickCount).padStart(4, '0')}] ` +
      `Eau: ${String(sensorData.eau).padStart(3)}%  ` +
      `Pluie: ${String(sensorData.pluie).padStart(4)}  ` +
      `Etat: ${sensorData.etat.padEnd(5)}  ` +
      `Pump: ${sensorData.pump ? 'ON ' : 'OFF'}  ` +
      `Motor: ${sensorData.motor ? 'ON ' : 'OFF'}`;

    console.log(line);
    return sensorData;
  }

  async start({ once = false } = {}) {
    await this.client.authenticate();
    console.log(`Firebase connected (${this.client.authMode} mode).`);

    await this.ensureDatabaseShape();
    console.log('Database shape verified.');

    await this.tick();
    if (once) return;

    console.log(`Simulator running every ${this.intervalMs} ms. Use Ctrl+C to stop.`);
    this.interval = setInterval(() => {
      this.tick().catch((error) => {
        console.error('Tick error:', error.message);
      });
    }, this.intervalMs);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }
}

function getCliOptions(argv = process.argv.slice(2)) {
  const once = argv.includes('--once');
  const intervalArg = argv.find((arg) => arg.startsWith('--interval='));
  const intervalMs = intervalArg
    ? Number(intervalArg.slice('--interval='.length))
    : DEFAULT_INTERVAL_MS;

  return {
    once,
    intervalMs: Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : DEFAULT_INTERVAL_MS,
  };
}

async function runCli() {
  const options = getCliOptions();
  const simulator = new IrrigationSimulator({ intervalMs: options.intervalMs });

  process.on('SIGINT', () => {
    simulator.stop();
    console.log('\nSimulator stopped.');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    simulator.stop();
    process.exit(0);
  });

  await simulator.start({ once: options.once });
}

module.exports = {
  IrrigationSimulator,
  asBool,
  buildAlerts,
  getCliOptions,
  runCli,
};
