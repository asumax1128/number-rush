/** NUMBER×RUSH Vol.43: versioned local-only telemetry persistence.
 * Never sends data over the network. Stores only aggregated per-question game metrics.
 * Storage adapter is injected: e.g. browser localStorage, not accessed automatically.
 */
import { TripleTelemetry, DIFFICULTIES } from './triple-telemetry.mjs';
export const STORAGE_KEY = 'number-rush:triple-telemetry:v1';
export const SCHEMA_VERSION = 1;
const EVENT_FIELDS = ['available','selected','missionClearSolutions','targetTileCountKinds'];
function validateEvent(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) throw new Error('invalid event');
  if (typeof e.available !== 'boolean' || typeof e.selected !== 'boolean') throw new Error('invalid flags');
  if (e.selected && !e.available) throw new Error('selected without availability');
  if (!Number.isSafeInteger(e.missionClearSolutions) || e.missionClearSolutions < 0 || e.missionClearSolutions > 63) throw new Error('invalid solution count');
  if (!Number.isSafeInteger(e.targetTileCountKinds) || e.targetTileCountKinds < 0 || e.targetTileCountKinds > 6) throw new Error('invalid kinds');
  if (Object.keys(e).some(k=>!EVENT_FIELDS.includes(k))) throw new Error('unexpected event field');
  return Object.fromEntries(EVENT_FIELDS.map(k=>[k,e[k]]));
}
export function serializeTelemetry(telemetry) {
  const snapshot=telemetry.snapshot();
  const events=Object.fromEntries(DIFFICULTIES.map(d=>[d,snapshot[d].events.map(validateEvent)]));
  return JSON.stringify({schemaVersion:SCHEMA_VERSION,kind:'number-rush-triple-telemetry',events});
}
export function deserializeTelemetry(raw) {
  if (typeof raw !== 'string' || raw.length > 65536) throw new Error('invalid or oversized payload');
  const parsed=JSON.parse(raw);
  if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION || parsed.kind !== 'number-rush-triple-telemetry') throw new Error('unsupported schema');
  if (!parsed.events || Object.keys(parsed.events).sort().join(',')!==[...DIFFICULTIES].sort().join(',')) throw new Error('invalid difficulties');
  const t=new TripleTelemetry();
  for (const d of DIFFICULTIES) {
    const events=parsed.events[d];
    if (!Array.isArray(events) || events.length > 100) throw new Error('invalid history length');
    for (const e of events) {
      const v=validateEvent(e);
      // Rehydrate validated records without reconstructing the full generator context.
      t.history[d].push(Object.freeze(v));
    }
  }
  return t;
}
export function saveTelemetry(storage,telemetry) {
  if (!storage || typeof storage.setItem !== 'function') throw new TypeError('storage adapter');
  storage.setItem(STORAGE_KEY,serializeTelemetry(telemetry));
}
export function loadTelemetry(storage) {
  if (!storage || typeof storage.getItem !== 'function') throw new TypeError('storage adapter');
  const raw=storage.getItem(STORAGE_KEY);
  if (raw===null) return new TripleTelemetry();
  return deserializeTelemetry(raw); // fail closed; caller may explicitly reset or export corrupt data
}
