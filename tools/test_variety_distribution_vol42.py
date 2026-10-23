import unittest
from tile_count_history_vol41 import TileCountHistory
from variety_distribution_vol42 import expected_overlap,from_solution_counts
class Tests(unittest.TestCase):
 def test_predictive_weighting(self):
  h=TileCountHistory()
  for k in [2,2,2,3]:h.record(k)
  self.assertAlmostEqual(expected_overlap(h,{2:.25,3:.25,4:.5}),.25)
  self.assertAlmostEqual(expected_overlap(h,{4:1.0}),0)
 def test_no_history(self):
  self.assertEqual(expected_overlap(TileCountHistory(),{1:1.0}),0)
 def test_solution_counts(self):
  self.assertEqual(from_solution_counts({2:1,3:3}),{2:.25,3:.75})
 def test_bad_probabilities(self):
  with self.assertRaises(ValueError):expected_overlap(TileCountHistory(),{1:.3})
if __name__=="__main__":unittest.main()
