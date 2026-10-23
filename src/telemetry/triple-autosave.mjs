/** Vol.44: save after a committed question, recover without overwriting corrupt data.
 * No network; injected storage. LocalStorage is best-effort, not durable storage.
 */
import {TripleTelemetry} from './triple-telemetry.mjs';
import {STORAGE_KEY,serializeTelemetry,deserializeTelemetry} from './triple-storage.mjs';

export class TripleAutoSave {
  constructor(storage, {onWarning=()=>{}}={}) {
    if (!storage || typeof storage.getItem!=='function' || typeof storage.setItem!=='function') throw new TypeError('storage adapter');
    this.storage=storage;this.onWarning=onWarning;
    this.telemetry=new TripleTelemetry();
    this.status='new';
    this._lastCommittedQuestionId=null;
  }
  restore() {
    let raw;
    try {raw=this.storage.getItem(STORAGE_KEY);}
    catch(error){this.status='storage-unavailable';this.onWarning('storage-read-failed',error);return this.telemetry;}
    if(raw===null){this.status='empty';return this.telemetry;}
    try {
      this.telemetry=deserializeTelemetry(raw);
      this.status='restored';
    } catch(error) {
      // Do not overwrite malformed stored bytes. Let user export/reset explicitly.
      this.status='corrupt';
      this.onWarning('corrupt-telemetry',error);
    }
    return this.telemetry;
  }
  /** Call exactly once when the next question is committed by the generator.
   * Repeated call with the same question ID is idempotent for the current session.
   * Invalid event is rejected before the save attempt.
   */
  commitQuestion(questionId,event) {
    if (!['string','number'].includes(typeof questionId) || String(questionId)==='') throw new TypeError('questionId');
    if(this.status==='corrupt') throw new Error('corrupt saved data must be explicitly reset or exported before writing');
    if(questionId===this._lastCommittedQuestionId) return {recorded:false,saved:this.status==='saved'};
    this.telemetry.recordQuestion(event);
    this._lastCommittedQuestionId=questionId;
    try {
      this.storage.setItem(STORAGE_KEY,serializeTelemetry(this.telemetry));
      this.status='saved';
      return {recorded:true,saved:true};
    } catch(error) {
      this.status='save-failed';
      this.onWarning('storage-write-failed',error);
      return {recorded:true,saved:false};
    }
  }
  /** User-initiated recovery only; returns previous bytes so caller can offer export. */
  resetCorruptData() {
    if(this.status!=='corrupt') throw new Error('not corrupt');
    const previous=this.storage.getItem(STORAGE_KEY);
    this.storage.setItem(STORAGE_KEY,serializeTelemetry(new TripleTelemetry()));
    this.telemetry=new TripleTelemetry();
    this.status='saved';
    this._lastCommittedQuestionId=null;
    return previous;
  }
}
