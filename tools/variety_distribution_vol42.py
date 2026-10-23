"""Vol.42: expected-distribution-adjusted repetition penalty, no safety decisions."""
from collections import Counter
from tile_count_history_vol41 import TileCountHistory

def expected_overlap(history, predicted):
    """Expected historical frequency of the chosen tile count.
    predicted: {tile_count: probability}, sum=1. Lower is less repetitive.
    Corrects Vol.41's set-overlap bias against candidates with many answer sizes.
    """
    if not isinstance(history, TileCountHistory): raise TypeError("history")
    if not predicted or any(not isinstance(k,int) or not 1<=k<=6 or not isinstance(v,(int,float)) or v<0 for k,v in predicted.items()):
        raise ValueError("invalid predicted distribution")
    if abs(sum(predicted.values())-1.0)>1e-9: raise ValueError("distribution must sum to one")
    recent=history.snapshot()
    if not recent: return 0.0
    freq=Counter(recent)
    return sum(p*freq[k]/len(recent) for k,p in predicted.items())

def from_solution_counts(counts):
    """Convert tile-count -> number of candidate answer routes into a predicted distribution.
    Uniform over eligible answer routes; an assumption, not observed player behavior.
    """
    if not counts or any(not isinstance(k,int) or not 1<=k<=6 or not isinstance(v,int) or v<0 for k,v in counts.items()):
        raise ValueError("invalid solution counts")
    total=sum(counts.values())
    if total<=0: raise ValueError("no solutions")
    return {k:v/total for k,v in counts.items() if v}
