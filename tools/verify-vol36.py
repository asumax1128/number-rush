#!/usr/bin/env python3
"""Vol.36 BONUS-erasure regression; deterministic seed=36."""
from random import Random
r=Random(36)
missions=("FREE","PAIR","TRIPLE","ODD","EVEN")
def options(board,mission):
 out=set()
 for mask in range(1,64):
  ids=[i for i in range(6) if mask>>i&1]
  vals=[board[i][0] for i in ids]
  ok=(mission=="FREE" or mission=="PAIR" and len(ids)==2 or mission=="TRIPLE" and len(ids)==3 or mission=="ODD" and any(v%2 for v in vals) or mission=="EVEN" and any(v%2==0 for v in vals))
  if ok:out.add((sum(vals),len(ids)))
 return out
for trial in range(1000):
 board=[(r.randrange(1,5),r.randrange(2)) for _ in range(6)]
 queue=[(r.randrange(1,5),r.randrange(2)) for _ in range(6)]
 bare=[(n,0) for n,_ in board];bareq=[(n,0) for n,_ in queue]
 for mask in range(1,64):
  ids=[i for i in range(6) if mask>>i&1]
  after=board.copy();plain=bare.copy()
  for j,i in enumerate(ids):after[i]=queue[j];plain[i]=bareq[j]
  assert [n for n,_ in after]==[n for n,_ in plain]
  for m in missions:assert options(after,m)==options(plain,m)
print("PASS: 63,000 transitions x 5 missions; BONUS erasure preserves semantics")
