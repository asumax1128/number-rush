#!/usr/bin/env python3
"""Vol.42 benchmark selected shards and estimate total work; not a G4 proof."""
import argparse,json,subprocess,time,re,statistics
SHARDS=192;SIZE=243;QUEUES=46656
def run(binary,indices):
 results=[]
 for i in indices:
  start=i*SIZE;end=start+SIZE
  tic=time.perf_counter()
  p=subprocess.run([binary,str(start),str(end),"0",str(QUEUES)],capture_output=True,text=True,check=True)
  elapsed=time.perf_counter()-tic
  if f"board_range={start}:{end} queue_range=0:{QUEUES}" not in p.stdout:raise RuntimeError("bad coverage")
  if not re.search(r"^FREE valid=\\d+ zero=0$",p.stdout,re.M):raise RuntimeError("FREE failed")
  results.append({"shard":i,"board_start":start,"board_end":end,"seconds":round(elapsed,4),"free_zero":0})
 mean=statistics.mean(x["seconds"] for x in results)
 return {"samples":results,"sample_mean_seconds":round(mean,4),"estimated_192_shard_compute_seconds":round(mean*SHARDS,2),"estimated_compute_only_minutes":round(mean*SHARDS/60,2),"caveat":"local compute only; runner setup, checkout, compilation, scheduling, and artifacts not included; full G4 not verified"}
if __name__=="__main__":
 ap=argparse.ArgumentParser();ap.add_argument("binary");ap.add_argument("--shards",default="0,95,191");args=ap.parse_args()
 print(json.dumps(run(args.binary,[int(x) for x in args.shards.split(",")]),indent=2))
