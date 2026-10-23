import unittest
from fixedpoint_mini_vol58 import verify
class FixedPointMini(unittest.TestCase):
    def test_four_positions_full_fixed_point(self):
        result=verify(4)
        self.assertEqual(result['board_count'],256)
        self.assertEqual(result['queue_count'],256)
        self.assertEqual(result['free_states'],468992)
        self.assertEqual(result['zero_common_next_free'],0)
if __name__=='__main__':unittest.main()
