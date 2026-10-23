# Vol.28｜周期キュー変更への頑健性検証
日付: 2026-10-23
状態: **全項目暫定案・未正式承認**。限定モデルの全探索。実ゲームのG4保証は未証明。

## ユーザー選択
- ODD・EVENは安全な候補がある場合に積極的に出す（ただし保証を優先）。
- MISSION CLEAR解法数の適正帯をソフト制約として暫定導入: EASY 3〜8、NORMAL 2〜5、HARD 1〜3。プレイテストで再調整。
- 周期キューのパターン変更による頑健性を検証。
- Safety EngineとVariety Engineを分離、同種MISSION連続回避はソフト制約。
- 周期キューは数学的検証専用。

## 全探索モデル
6枚の位置ID付き通常タイル、値1/2/3、3^6=729盤面。キューは各周期パターンの無限繰り返し。キュー位相を区別。現在TARGETは1..18、MISSION∈{FREE,PAIR,TRIPLE,ODD,EVEN}。全63非空部分集合をタイルIDで区別し、現在TARGETに合計一致する全ルート（MISSION未達のTARGET CLEARを含む）を許可。消費位置昇順でキューから補充。NEXT MISSION/TARGETは現在の回答前に確定する。REFRESH・特殊タイルなし。

## 実計算結果
各(盤面,位相,現在TARGET)について、全TARGET一致ルート後の盤面で共通してMISSION CLEAR可能なNEXT TARGET集合を求め、候補ゼロ件数を数えた。

| キュー | 盤面×位相 | 解答可能状態 | 全TARGET一致ルート | FREEゼロ | PAIRゼロ | TRIPLEゼロ | ODDゼロ | EVENゼロ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1,2,3 | 2,187 | 25,656 | 137,781 | 0 | 0 | 0 | 13 | 1,424 |
| 1,2,3,2 | 2,916 | 34,208 | 183,708 | 0 | 0 | 30 | 26 | 636 |
| 1,1,2,3 | 2,916 | 34,208 | 183,708 | 0 | 0 | 15 | 13 | 3,787 |
| 3,2,1 | 2,187 | 25,656 | 137,781 | 0 | 0 | 45 | 13 | 1,424 |

- FREE共通NEXT候補数は全モデルで最少6・最多15。
- PAIR共通NEXT候補数は全モデルで最少1・最多5。
- TRIPLEの共通候補がゼロの状態は、1,2,3では0、1,2,3,2では30、1,1,2,3では15、3,2,1では45。
- ODD・EVENは出題不能な状態があり、キューの数字頻度・順序に依存する。
- 4パターンすべてで、生成側がNEXT MISSION/TARGETを選択できるときFREE共通NEXT候補が常に存在。したがってFREE成立状態全体を不変集合として採用でき、有限モデル内のG4は成立（帰納法）。すべてのMISSIONを任意のタイミングで出せるという意味ではない。
- 実ゲームの公開5枚+内部予約、ランダムキュー、特殊タイル、REFRESH、BIG等は未証明。

## 再現用Python
```python
from itertools import product
from collections import Counter
boards=list(product((1,2,3),repeat=6))
masks=[tuple(i for i in range(6) if m>>i&1) for m in range(1,64)]
missions=('FREE','PAIR','TRIPLE','ODD','EVEN')
def run(seq):
    L=len(seq); zero=Counter(); states=routes=0
    for b in boards:
      for phase in range(L):
        groups={}
        for ix in masks:
          target=sum(b[i] for i in ix)
          bb=list(b)
          for j,i in enumerate(ix): bb[i]=seq[(phase+j)%L]
          groups.setdefault(target,[]).append(tuple(bb))
        for target,successors in groups.items():
          states+=1; routes+=len(successors)
          common={m:set(range(1,19)) for m in missions}
          for bb in successors:
            possible={m:set() for m in missions}
            for ix in masks:
              t=sum(bb[i] for i in ix)
              possible['FREE'].add(t)
              if len(ix)==2: possible['PAIR'].add(t)
              if len(ix)==3: possible['TRIPLE'].add(t)
              if any(bb[i]%2 for i in ix): possible['ODD'].add(t)
              if any(bb[i]%2==0 for i in ix): possible['EVEN'].add(t)
            for m in missions: common[m].intersection_update(possible[m])
          for m in missions:
            if not common[m]: zero[m]+=1
    return states,routes,dict(zero)
for q in [(1,2,3),(1,2,3,2),(1,1,2,3),(3,2,1)]:
    print(q,run(q))
```

## 設計上の新提案（未承認）
- Variety EngineにMISSIONごとの出題可能率と実出題率を分けて記録する。
- ODD/EVENを安全な候補内で積極的に出すが、無理な強制はしない。
- 解法数帯は難易度別のソフト制約。安全性の足切りに使わない。
- 周期キューは検証用に留め、ゲームの本番キューを周期に固定しない。

## Vol.29の選択肢（回答待ち）
1. 次の検証: 周期キューを全列挙／公開5枚+内部予約を状態へ組み込む。
2. ODD/EVEN出題調整: 出題可能率に応じた補正／単純な優先ボーナス。
3. 次のMISSION: BIGのため値1〜9へ拡張／まず現行5MISSIONのモデルを強化。
