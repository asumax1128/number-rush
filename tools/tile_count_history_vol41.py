"""Vol.41: recent 20-question tile-count pattern comparison (no safety decisions)."""
from collections import deque
class TileCountHistory:
    def __init__(self): self._recent=deque(maxlen=20)
    def record(self, selected_tile_count):
        if not isinstance(selected_tile_count,int) or not 1 <= selected_tile_count <= 6: raise ValueError("tile count")
        self._recent.append(selected_tile_count)
    def overlap(self, candidate_counts):
        """Frequency-weighted repetition of available answer sizes in the last 20 questions.
        Lower is better. Requires caller to supply the same normalized score context."""
        counts=set(candidate_counts)
        if not counts or any(not isinstance(x,int) or not 1 <= x <= 6 for x in counts):raise ValueError("candidate counts")
        return sum(x in counts for x in self._recent)/len(self._recent) if self._recent else 0.0
    def snapshot(self):return list(self._recent)
