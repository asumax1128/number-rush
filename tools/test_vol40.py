import tempfile
import unittest
from triple_stats import TripleEvent,TripleStats
from variety_vol40 import choose
from audit_vol40 import audit
class Tests(unittest.TestCase):
 def test_windows_and_difficulties(self):
  s=TripleStats()
  for i in range(110):s.record("EASY",TripleEvent(True,i%2==0,2,3))
  s.record("HARD",TripleEvent(False,False,0,1))
  self.assertEqual(s.summary("EASY")["observed"],100)
  self.assertEqual(s.summary("EASY")["selected"],50)
  self.assertEqual(s.summary("NORMAL")["observed"],0)
  self.assertEqual(s.summary("HARD")["correction_multiplier"],1.0)
  self.assertFalse(s.summary("EASY")["correction_enabled"])
 def test_invalid(self):
  with self.assertRaises(ValueError):TripleEvent(False,True,1,2)
  with self.assertRaises(ValueError):TripleStats().record("INVALID",TripleEvent(True,False,0,1))
 def test_tie_break(self):
  c=[dict(id="A",worst=.6,average=.9,recent_overlap=3),
     dict(id="B",worst=.7,average=.2,recent_overlap=2),
     dict(id="C",worst=.7,average=.2,recent_overlap=1)]
  self.assertEqual(choose(c)["id"],"C")
  self.assertEqual(choose([dict(id="D",worst=.7,average=.3,recent_overlap=5),*c])["id"],"D")
 def test_missing_shards_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaisesRegex(ValueError,"missing"):audit(d)
if __name__=="__main__":unittest.main()
