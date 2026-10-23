"""Vol.40: tie-break among candidates already approved by Safety Engine."""
def choose(candidates):
    if not candidates: raise ValueError("no safe candidates")
    return sorted(candidates,key=lambda c:(-c["worst"],-c["average"],c["recent_overlap"],str(c["id"])))[0]
