from itertools import product
from collections import Counter

VALUES = (1, 2)
BOARDS = list(product(VALUES, repeat=6))
MASKS = [tuple(i for i in range(6) if (mask >> i) & 1) for mask in range(1, 64)]
POSSIBLE = {}
for board in BOARDS:
    free, pair = set(), set()
    for indices in MASKS:
        target = sum(board[i] for i in indices)
        free.add(target)
        if len(indices) == 2:
            pair.add(target)
    POSSIBLE[board] = (free, pair)

counts = Counter()
for board in BOARDS:
    for queue in BOARDS:
        successors_by_target = {}
        for indices in MASKS:
            target = sum(board[i] for i in indices)
            after = list(board)
            for j, i in enumerate(indices):
                after[i] = queue[j]
            successors_by_target.setdefault(target, []).append(tuple(after))
        for target, successors in successors_by_target.items():
            counts["states"] += 1
            for mission in (0, 1):
                common = set(range(1, 13))
                for after in successors:
                    common.intersection_update(POSSIBLE[after][mission])
                counts[f"no_next_{mission}"] += not bool(common)
                counts[f"total_candidates_{mission}"] += len(common)

print(dict(counts))
assert counts["states"] == 36480
assert counts["no_next_0"] == 0
assert counts["no_next_1"] == 0
assert counts["total_candidates_0"] == 309616
assert counts["total_candidates_1"] == 92636
