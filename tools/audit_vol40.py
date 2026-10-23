#!/usr/bin/env python3
"""Audit every one of 192 partition logs. Fail closed on any missing/invalid shard."""
import pathlib,re,sys
N=46656;SHARDS=192;SIZE=243
PAT=re.compile(r"board_range=(\\d+):(\\d+) queue_range=(\\d+):(\\d+) pairs=(\\d+) states=(\\d+) routes=(\\d+)".replace("\\\\","\\"))
def audit(directory):
 total_states=total_routes=total_pairs=0
 for i in range(SHARDS):
  p=pathlib.Path(directory)/f"shard-{i:03}.log"
  if not p.is_file():raise ValueError(f"missing {p.name}")
  txt=p.read_text();m=PAT.search(txt)
  if not m:raise ValueError(f"invalid log {p.name}")
  start,end,qs,qe,pairs,states,routes=map(int,m.groups())
  if (start,end,qs,qe,pairs)!=(i*SIZE,(i+1)*SIZE,0,N,SIZE*N):
   raise ValueError(f"bad coverage {p.name}")
  if "RESULT: no FREE counterexample in tested partition" not in txt:
   raise ValueError(f"FREE counterexample or failed result {p.name}")
  if not re.search(r"^FREE valid=\\d+ zero=0$".replace("\\\\","\\"),txt,re.M):
   raise ValueError(f"FREE zero not confirmed {p.name}")
  total_pairs+=pairs;total_states+=states;total_routes+=routes
 if total_pairs!=N*N or total_routes!=N*N*63:raise ValueError("incorrect aggregate counts")
 print(f"PASS FULL COVERAGE: shards={SHARDS} pairs={total_pairs} states={total_states} routes={total_routes} FREE_zero=0")
 return total_states
if __name__=="__main__":
 try:audit(sys.argv[1])
 except (ValueError,OSError,IndexError) as e:print("FAIL:",e,file=sys.stderr);sys.exit(1)
