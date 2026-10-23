import unittest
from tile_count_history_vol41 import TileCountHistory
class TileCountHistoryTests(unittest.TestCase):
 def test_window(self):
  h=TileCountHistory()
  for i in range(30):h.record(i%6+1)
  self.assertEqual(len(h.snapshot()),20)
  self.assertEqual(h.snapshot()[0],5)
 def test_overlap(self):
  h=TileCountHistory()
  for n in [2,2,3,2,4]:h.record(n)
  self.assertAlmostEqual(h.overlap([2]),0.6)
  self.assertAlmostEqual(h.overlap([1]),0.0)
 def test_invalid(self):
  with self.assertRaises(ValueError):TileCountHistory().record(0)
if __name__=="__main__":unittest.main()
