#!/usr/bin/env python3
"""Vol.56 static preflight for full 192-partition Actions batch workflow.
Does not launch GitHub Actions or claim a completed verification.
"""
from pathlib import Path
import re
import sys
ROOT=Path(__file__).resolve().parents[1]
def verify_workflow(text):
 required=[
  'workflow_dispatch:', 'batch: [0, 1, 2, 3, 4, 5, 6, 7]',
  'max-parallel: 4','start=$((batch * 24))','stop=$((start + 24))',
  'b=$((i * 243))','e=$((b + 243))',
  '/tmp/verify51 "$b" "$e" 0 46656',
  '--validate-batch results/summary.tsv "$batch"',
  '--aggregate full-summary.tsv',
  'actions/upload-artifact@v4','actions/download-artifact@v4',
  'test "${{ needs.verify-partitions.result }}" = success'
 ]
 missing=[s for s in required if s not in text]
 if missing:raise AssertionError(f'workflow missing: {missing}')
 ranges=[(i*243,(i+1)*243) for i in range(192)]
 assert ranges[0][0]==0 and ranges[-1][1]==46656
 assert all(a[1]==b[0] for a,b in zip(ranges,ranges[1:]))
 assert len(set(ranges))==192
 return {'batches':8,'partitions_per_batch':24,'partitions':192,
         'boards':46656,'queues_per_partition':46656,'max_parallel_jobs':4}
if __name__=='__main__':
 p=ROOT/'.github/workflows/number-rush-vol51-batch.yml'
 print(verify_workflow(p.read_text()))
