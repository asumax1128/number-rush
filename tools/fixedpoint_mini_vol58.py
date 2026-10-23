#!/usr/bin/env python3
"""Vol.58 independent miniature fixed-point certificate.
4 positions, digits 0..3 map to NORMAL(1,2), DOUBLE(1,2).
The complete six-position 6^6 x 6^6 certificate is archived in Vol.57;
this is a smaller independent algorithmic regression, NOT a replacement.
"""
from itertools import product

def verify(n=4):
    values=(1,2,2,4)
    boards=tuple(product(range(4),repeat=n))
    queues=boards
    available={}
    actions={}
    for board in boards:
        routes={}
        for mask in range(1,1<<n):
            target=sum(values[board[i]] for i in range(n) if mask>>i&1)
            routes.setdefault(target,[]).append(mask)
        actions[board]=routes
        available[board]=frozenset(routes)
    total=0;bad=[]
    for board in boards:
        for queue in queues:
            for target,masks in actions[board].items():
                total+=1
                intersection=None
                for mask in masks:
                    after=list(board)
                    k=0
                    for i in range(n):
                        if mask>>i&1:
                            after[i]=queue[k]
                            k+=1
                    successors=available[tuple(after)]
                    intersection=successors if intersection is None else intersection & successors
                if not intersection:
                    bad.append((board,queue,target))
    # If bad is empty, the universal FREE-valid set is a post-fixed point:
    # each state has a common next FREE target for every legal TARGET route;
    # every successor board and every future queue remains in the set.
    return {'board_count':len(boards),'queue_count':len(queues),
            'free_states':total,'zero_common_next_free':len(bad),
            'sample_counterexample':bad[0] if bad else None}

if __name__=='__main__':
    result=verify()
    print(result)
    assert result['free_states']==468992
    assert result['zero_common_next_free']==0
    print('RESULT: 4-position FREE core is closed (miniature model only)')
