import importlib.util
import pathlib
import tempfile
import unittest

SPEC=importlib.util.spec_from_file_location("partition",pathlib.Path(__file__).with_name("parse-vol51-partition.py"))
MOD=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)

class TestVol51Partitions(unittest.TestCase):
 def test_all_192_unique(self):
  rows=[(i,i*243,(i+1)*243,243*46656,1,2,0) for i in range(192)]
  self.assertEqual(MOD.validate(rows,range(192))["partitions"],192)
 def test_missing_duplicate_and_nonzero(self):
  rows=[(i,i*243,(i+1)*243,243*46656,1,2,0) for i in range(192)]
  for broken in [rows[:-1],rows[:-1]+[rows[0]],rows[:-1]+[(191,191*243,192*243,243*46656,1,2,1)]]:
   with self.assertRaises(ValueError):MOD.validate(broken,range(192))
 def test_parse_one_partition(self):
  with tempfile.TemporaryDirectory() as d:
   path=pathlib.Path(d)/'p.log'
   path.write_text('board_range=0:243 queue_range=0:46656 pairs=11337408 states=5 routes=9\nFREE valid=5 zero=0\nRESULT: no FREE counterexample in tested partition\n')
   import io,contextlib
   out=io.StringIO()
   with contextlib.redirect_stdout(out):MOD.main([str(path),'0'])
   self.assertEqual(out.getvalue().strip().split('\t'),['0','0','243','11337408','5','9','0'])

if __name__=='__main__':unittest.main()
