#!/usr/bin/env python3
"""Vol.51: independently check partition coverage and FREE counterexamples.
This verifies Vol.41 finite-partition output, NOT the full G4 fixed-point.
"""
import re,sys,pathlib
LINE=re.compile(r'^board_range=(\d+):(\d+) queue_range=(\d+):(\d+) pairs=(\d+) states=(\d+) routes=(\d+)$')
FREE=re.compile(r'^FREE valid=(\d+) zero=(\d+)$')
def load_rows(path):
 rows=[]
 for line in pathlib.Path(path).read_text().splitlines():
  p=line.split('\t')
  if len(p)!=7 or not all(x.isdigit() for x in p):raise ValueError('invalid summary row')
  rows.append(tuple(map(int,p)))
 return rows
def validate(rows,expected):
 if len(rows)!=len(expected):raise ValueError('incorrect partition count')
 seen=set()
 for i,b,e,pairs,states,routes,zero in rows:
  if i in seen or i not in expected:raise ValueError('duplicate/unexpected partition')
  seen.add(i)
  if b!=i*243 or e!=(i+1)*243 or pairs!=243*46656:raise ValueError('incorrect partition range')
  if zero!=0:raise ValueError('FREE counterexample')
 if seen!=set(expected):raise ValueError('missing partitions')
 return dict(partitions=len(rows),pairs=sum(r[3] for r in rows),states=sum(r[4] for r in rows),routes=sum(r[5] for r in rows))
def main(args):
 if args[0]=='--validate-batch':
  rows=load_rows(args[1]);batch=int(args[2]);print(validate(rows,range(batch*24,(batch+1)*24)));return
 if args[0]=='--aggregate':
  rows=load_rows(args[1]);print(validate(rows,range(192)));return
 path=pathlib.Path(args[0]);i=int(args[1])
 lines=path.read_text().splitlines()
 match=next((LINE.fullmatch(s) for s in lines if LINE.fullmatch(s)),None)
 free=next((FREE.fullmatch(s) for s in lines if FREE.fullmatch(s)),None)
 if match is None or free is None or 'RESULT: no FREE counterexample in tested partition' not in lines:raise ValueError('missing expected verifier output')
 b,e,qs,qe,pairs,states,routes=map(int,match.groups())
 valid,zero=map(int,free.groups())
 if qs!=0 or qe!=46656 or valid<0:raise ValueError('incorrect queue coverage')
 print('\t'.join(map(str,(i,b,e,pairs,states,routes,zero))))
if __name__=='__main__':
 try:main(sys.argv[1:])
 except (ValueError,IndexError) as e:print(e,file=sys.stderr);sys.exit(1)
