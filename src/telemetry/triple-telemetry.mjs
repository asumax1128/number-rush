/** Vol.41 adapter for the future game generator. Logging only; never changes selection. */
export const DIFFICULTIES = Object.freeze(['EASY', 'NORMAL', 'HARD']);
export class TripleTelemetry {
  constructor(limit = 100) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit');
    this.limit = limit;
    this.history = Object.fromEntries(DIFFICULTIES.map(d => [d, []]));
  }
  /** Call after Safety Engine determines safe missions and the generator commits a choice.
   * missionClearSolutions counts MISSION CLEAR routes, not TARGET matching routes.
   */
  recordQuestion({ difficulty, safeMissions, selectedMission, missionClearSolutions, targetTileCountKinds }) {
    if (!DIFFICULTIES.includes(difficulty)) throw new RangeError('difficulty');
    if (!Array.isArray(safeMissions) || !safeMissions.every(m => typeof m === 'string')) throw new TypeError('safeMissions');
    if (!safeMissions.includes(selectedMission)) throw new Error('chosen mission must be safety-certified');
    if (!Number.isInteger(missionClearSolutions) || missionClearSolutions < 0) throw new RangeError('missionClearSolutions');
    if (!Number.isInteger(targetTileCountKinds) || targetTileCountKinds < 0 || targetTileCountKinds > 6) throw new RangeError('targetTileCountKinds');
    const event = Object.freeze({ available: safeMissions.includes('TRIPLE'), selected: selectedMission === 'TRIPLE', missionClearSolutions, targetTileCountKinds });
    const h = this.history[difficulty]; h.push(event);
    if (h.length > this.limit) h.shift();
    return event;
  }
  summary(difficulty) {
    if (!DIFFICULTIES.includes(difficulty)) throw new RangeError('difficulty');
    const h = this.history[difficulty], observed = h.length;
    const available = h.filter(x => x.available).length;
    const selected = h.filter(x => x.selected).length;
    return { observed, available, selected,
      availabilityRate: observed ? available / observed : null,
      selectionRate: observed ? selected / observed : null,
      selectionGivenAvailable: available ? selected / available : null,
      correctionEnabled: false, correctionMultiplier: 1.0 };
  }
  snapshot() { return Object.fromEntries(DIFFICULTIES.map(d => [d, { ...this.summary(d), events: [...this.history[d]] }])); }
}
/** Integration after generator commit:
 * const safeMissions = safetyEngine.safeNextMissions(state);
 * const selectedMission = varietyEngine.select(safeMissions);
 * telemetry.recordQuestion({ difficulty, safeMissions, selectedMission,
 *   missionClearSolutions: countMissionClearRoutes(...),
 *   targetTileCountKinds: countDistinctTargetMatchingRouteSizes(...) });
 */
