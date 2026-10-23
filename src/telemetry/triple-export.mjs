/** Vol.42: local export and self-contained HTML summary. No network calls. */
import { DIFFICULTIES } from './triple-telemetry.mjs';
const quote = v => '"' + String(v ?? '').replaceAll('"','""') + '"';
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function exportTripleCSV(telemetry) {
  const rows=[['difficulty','question_index','triple_available','triple_selected','mission_clear_solutions','target_tile_count_kinds']];
  const data=telemetry.snapshot();
  for(const d of DIFFICULTIES) data[d].events.forEach((e,i)=>rows.push([d,i+1,e.available,e.selected,e.missionClearSolutions,e.targetTileCountKinds]));
  return rows.map(row=>row.map(quote).join(',')).join('\n')+'\n';
}
export function exportTripleJSON(telemetry) {
  return JSON.stringify({ schemaVersion:1,kind:'number-rush-triple-telemetry',correctionEnabled:false,difficulties:telemetry.snapshot() },null,2);
}
export function renderTripleHTML(telemetry) {
  const data=telemetry.snapshot();
  const blocks=DIFFICULTIES.map(d=>{
    const s=data[d],denom=s.observed||1;
    const available=(100*s.available/denom).toFixed(1),selected=(100*s.selected/denom).toFixed(1);
    return '<section><h2>'+esc(d)+'</h2><p>'+s.observed+'問 / TRIPLE出題可能 '+s.available+'問 / 実出題 '+s.selected+'問</p>'+
      '<div class="label">出題可能率 '+available+'%</div><div class="bar"><div class="available" style="width:'+available+'%"></div></div>'+
      '<div class="label">実出題率 '+selected+'%</div><div class="bar"><div class="selected" style="width:'+selected+'%"></div></div>'+
      '<p>出題可能時の採用率 '+(s.selectionGivenAvailable===null?'—':(s.selectionGivenAvailable*100).toFixed(1)+'%')+'</p></section>';
  }).join('');
  return '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>NUMBER×RUSH TRIPLE telemetry</title><style>body{font:16px system-ui;margin:2rem auto;max-width:720px;padding:0 1rem;background:#f8fafc;color:#172033}section{background:white;padding:1.3rem;border-radius:12px;margin:1rem 0}.bar{height:14px;background:#e5e7eb;border-radius:8px;overflow:hidden}.bar>div{height:100%}.available{background:#467ac7}.selected{background:#18a999}.label{margin-top:.8rem;font-size:.9rem}</style>'+
    '<h1>NUMBER×RUSH｜TRIPLE出題統計</h1><p>難易度別・直近100問。補正は無効（倍率1.0）。</p>'+blocks+'</html>';
}
