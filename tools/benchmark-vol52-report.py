#!/usr/bin/env python3
"""Summarize Vol.52 GitHub Actions benchmark artifacts without inventing values."""
import json,pathlib,re,statistics,sys
def main(folder):
 p=pathlib.Path(folder)
 timings=[]
 for f in sorted(p.glob('partition-*.log.timing')):
  txt=f.read_text()
  e=re.search(r'elapsed_seconds=([0-9.]+)',txt)
  m=re.search(r'peak_rss_kb=(\d+)',txt)
  if not e or not m:raise ValueError(f'invalid timing: {f.name}')
  timings.append({'partition':f.name[10:13],'elapsed_seconds':float(e.group(1)),'peak_rss_kb':int(m.group(1))})
 compile_data=(p/'compile.time').read_text() if (p/'compile.time').exists() else ''
 ce=re.search(r'compile_elapsed_seconds=([0-9.]+)',compile_data)
 start=(p/'job-start-epoch.txt');end=(p/'compute-end-epoch.txt')
 result={
  'status':'complete' if len(timings)==24 and ce and start.exists() and end.exists() else 'partial',
  'completed_partitions':len(timings),
  'expected_partitions':24,
  'compile_seconds':float(ce.group(1)) if ce else None,
  'compute_sum_seconds':round(sum(x['elapsed_seconds'] for x in timings),3),
  'compute_mean_seconds':round(statistics.mean(x['elapsed_seconds'] for x in timings),3) if timings else None,
  'compute_max_seconds':max((x['elapsed_seconds'] for x in timings),default=None),
  'peak_rss_kb':max((x['peak_rss_kb'] for x in timings),default=None),
  'elapsed_until_compute_end_seconds':int(end.read_text())-int(start.read_text()) if start.exists() and end.exists() else None,
  'github_actions_billable_minutes':None,
  'caveat':'The workflow does not measure GitHub billing or full G4 fixed-point proof.'
 }
 print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main(sys.argv[1])
