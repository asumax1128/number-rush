"""Vol.44: record tile-count history from committed outcomes only."""
from tile_count_history_vol41 import TileCountHistory

MISSION_CLEAR="MISSION_CLEAR"
TARGET_CLEAR="TARGET_CLEAR"
MISS="MISS"

class OutcomeTileCountRecorder:
    """No mutation of Safety Engine. One record per settled answer, not per tap."""
    def __init__(self, history=None):
        self.history=history if history is not None else TileCountHistory()
        self.seen=set()

    def record(self, *, answer_id, outcome, consumed_tile_count=0):
        if not isinstance(answer_id,(str,int)) or isinstance(answer_id,bool) or not str(answer_id):
            raise ValueError("answer_id")
        if outcome not in (MISSION_CLEAR,TARGET_CLEAR,MISS): raise ValueError("outcome")
        if outcome==MISS:
            if consumed_tile_count!=0: raise ValueError("MISS must consume zero tiles")
        elif not isinstance(consumed_tile_count,int) or isinstance(consumed_tile_count,bool) or not 1<=consumed_tile_count<=6:
            raise ValueError("tile count")
        if answer_id in self.seen:return False
        self.seen.add(answer_id)
        if outcome==MISS:return False
        self.history.record(consumed_tile_count)
        return True
