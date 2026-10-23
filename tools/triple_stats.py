"""Vol.40: per-difficulty rolling TRIPLE statistics; logging only, no correction."""
from collections import deque
from dataclasses import dataclass
DIFFICULTIES=("EASY","NORMAL","HARD")
@dataclass(frozen=True)
class TripleEvent:
    available: bool
    selected: bool
    mission_clear_solutions: int
    target_tile_count_kinds: int
    def __post_init__(self):
        if self.selected and not self.available: raise ValueError("TRIPLE selected without safe candidate")
        if self.mission_clear_solutions < 0 or not 0 <= self.target_tile_count_kinds <= 6: raise ValueError("invalid metrics")
class TripleStats:
    def __init__(self): self.events={d:deque(maxlen=100) for d in DIFFICULTIES}
    def record(self,difficulty,event):
        if difficulty not in self.events: raise ValueError("unknown difficulty")
        if not isinstance(event,TripleEvent): raise TypeError("expected TripleEvent")
        self.events[difficulty].append(event)
    def summary(self,difficulty):
        events=self.events[difficulty];n=len(events)
        available=sum(x.available for x in events);selected=sum(x.selected for x in events)
        return dict(observed=n,available=available,selected=selected,
            availability_rate=available/n if n else None,
            selection_rate=selected/n if n else None,
            selection_given_available=selected/available if available else None,
            correction_multiplier=1.0,correction_enabled=False)
