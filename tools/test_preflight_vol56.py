import importlib.util
from pathlib import Path
import unittest
P=Path(__file__).with_name('preflight_vol56.py')
S=importlib.util.spec_from_file_location('preflight_vol56',P)
M=importlib.util.module_from_spec(S)
S.loader.exec_module(M)
class TestPreflight(unittest.TestCase):
 def test_real_workflow(self):
  txt=(P.parents[1]/'.github/workflows/number-rush-vol51-batch.yml').read_text()
  result=M.verify_workflow(txt)
  self.assertEqual(result['partitions'],192)
  self.assertEqual(result['boards'],46656)
 def test_missing_aggregate_is_rejected(self):
  txt=(P.parents[1]/'.github/workflows/number-rush-vol51-batch.yml').read_text()
  with self.assertRaises(AssertionError):M.verify_workflow(txt.replace('--aggregate full-summary.tsv','--skip full-summary.tsv'))
if __name__=='__main__':unittest.main()
