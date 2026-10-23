import unittest
from outcome_history_vol44 import OutcomeTileCountRecorder
class OutcomeHistoryTests(unittest.TestCase):
 def test_target_clear_and_mission_clear(self):
  r=OutcomeTileCountRecorder()
  self.assertTrue(r.record(answer_id="a",outcome="MISSION_CLEAR",consumed_tile_count=3))
  self.assertTrue(r.record(answer_id="b",outcome="TARGET_CLEAR",consumed_tile_count=2))
  self.assertEqual(r.history.snapshot(),[3,2])
 def test_miss_not_counted(self):
  r=OutcomeTileCountRecorder()
  self.assertFalse(r.record(answer_id="m",outcome="MISS"))
  self.assertEqual(r.history.snapshot(),[])
 def test_duplicate_and_invalid(self):
  r=OutcomeTileCountRecorder()
  r.record(answer_id=1,outcome="TARGET_CLEAR",consumed_tile_count=1)
  self.assertFalse(r.record(answer_id=1,outcome="TARGET_CLEAR",consumed_tile_count=1))
  with self.assertRaises(ValueError):r.record(answer_id=2,outcome="MISS",consumed_tile_count=2)
  with self.assertRaises(ValueError):r.record(answer_id=3,outcome="TARGET_CLEAR",consumed_tile_count=0)
if __name__=="__main__":unittest.main()
