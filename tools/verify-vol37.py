#!/usr/bin/env python3
"""Vol.37 DOUBLE deterministic sample, NOT exhaustive G4 verification."""
from random import Random
from collections import Counter
r=Random(37)
masks=range(1,64)
def targets(board,mission):
 out=set()
 for mask in masks:
  ids=[i for i in range(6) if mask>>i&1]
  ok=(mission==0 or mission==1 and len(ids)==2 or mission==2 and len(ids)==3 or mission==3 and any(board[i][0]%2 for i in ids) or mission==4 and any(board[i][0]%2==0 for i in ids))
  if ok:out.add(sum(board[i][0]*(1+board[i][1]) for i in ids))
 return out
zeros=Counter();states=0;examples={}
for trial in range(2500):
 board=[(r.randint(1,4),r.randint(0,1)) for _ in range(6)]
 queue=[(r.randint(1,4),r.randint(0,1)) for _ in range(6)]
 successors={}
 for mask in masks:
  ids=[i for i in range(6) if mask>>i&1]
  t=sum(board[i][0]*(1+board[i][1]) for i in ids)
  after=board.copy()
  for j,i in enumerate(ids):after[i]=queue[j]
  successors.setdefault(t,[]).append(after)
 for t,after_boards in successors.items():
  states+=1
  for mission in range(5):
   common=None
   for after in after_boards:
    opts=targets(after,mission)
    common=opts if common is None else common & opts
    if not common:break
   if not common:
    zeros[mission]+=1
    examples.setdefault(mission,(board,queue,t))
print("seed=37 samples=2500 states=",states)
print("no_common_next_target:",[zeros[m] for m in range(5)])
print("first_counterexamples:",examples)
assert states==47108
assert [zeros[m] for m in range(5)]==[0,11,204,1422,1475]
print("PASS: deterministic DOUBLE sample regression; NOT a G4 proof")
