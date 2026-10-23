# Vol.29｜公開5枚と内部予約キューの安全状態モデル
日付: 2026-10-23
状態: **全項目暫定・未正式承認**。周期キュー限定モデルの再検証であり、任意キューのG4保証は未証明。

## ユーザー選択
1. 公開NEXT QUEUE 5枚と内部予約キューを状態へ組み込む。
2. ODD/EVENの出題調整は安全な候補の出現率に応じて補正。
3. MISSION拡張は保留し、FREE/PAIR/TRIPLE/ODD/EVENの保証モデルを先に強化。
既存のSafety Engine / Variety Engine分離、複数解法ソフト制約、難易度別解法数帯（EASY3〜8/NORMAL2〜5/HARD1〜3）を維持。

## 状態と不変条件
S=(盤面B, 現在TARGET T, 現在MISSION M, 公開5枚Qpub, 内部予約Qres, 生成器内部状態H, 公開済みNEXT TARGET/MISSION)。
- 公開5枚はプレイヤーが確認でき、生成側は後から変更できない。
- 予約済み6枚目などもプレイヤーには見えないが変更不可。
- 現在の回答で6枚消費される可能性があるため、最大6枚分を事前予約する。追加予約が必要なREFRESH等は別途検証。
- 消費k枚のとき、予約列の先頭k枚を消費位置昇順に補充。残りは順序を保ち、新たな末尾候補を生成する。
- NEXT TARGET/MISSIONは現在回答前に確定し、すべてのTARGET一致ルートに対して保証を確認する。MISSION未達TARGET CLEARも含む。
- 未予約部分の生成は合法な範囲に限り、既存公開情報・予約情報を上書きしない。

## 今回の再検証（実行済み）
モデル: 通常タイル6枚、数字1〜3、MISSION FREE/PAIR/TRIPLE/ODD/EVEN、現在TARGET1〜18、REFRESHなし。補充は無限周期1→2→3。キュー位相pが定まれば公開5枚は (q_p,...,q_{p+4})、予約6枚目はq_{p+5} と一意に定まる。回答後の位相はp+k mod3。これは以前の位相モデルと**同値**であり、任意のキュー予約を新たに検証したことにはならない。
Pythonで729盤面×3位相×全63部分集合を再列挙した。
- 盤面×位相: 2,187
- 現在FREE成立の(盤面,位相,TARGET): 25,656
- 全合計一致ルート後に共通NEXT TARGETを持つ状態:
  - NEXT FREE: 25,656（ゼロ0）
  - NEXT PAIR: 25,656（ゼロ0）
  - NEXT TRIPLE: 25,656（ゼロ0）
  - NEXT ODD: 25,643（ゼロ13）
  - NEXT EVEN: 24,232（ゼロ1,424）
- 固定周期での既存G4閉包性は維持される。一般の公開5枚＋任意の予約6枚目に対するG4は未証明。
- 例: board=[1,2,3,1,2,3],TARGET12,公開キュー=[1,2,3,1,2],予約6枚目=3。6枚消費で予約済み6枚を順に補充。6枚目を事後的に変えてはならない。

## ODD/EVEN出題可能率による補正案（未承認）
候補を安全性でフィルタした後にのみVariety Engineで重みづけ。
出題可能率p_mを安全候補集合に対する可否の割合として計測し、基礎重みw_mに補正係数 min(cap,1/max(p_m,epsilon)) を掛ける案。例えば今回の**均等に列挙した限定状態**ではODD=25643/25656≈99.949%、EVEN=24232/25656≈94.450%。補正倍率はそれぞれ約1.0005、1.0588（cap=1.25案）。
実プレイの訪問状態分布は均等ではないため、これらの割合を本番の確率とみなしてはいけない。将来は実際の到達可能状態・難易度・MISSION帯ごとの統計で再推定する。
安全な候補がないMISSIONには補正を適用しない。補正は絶対保証より下位のソフト制約。

## 次の技術的課題
- 任意の公開5枚+予約6枚目で安全な状態集合が非空か、固定点計算する。
- 未公開末尾生成の選択タイミングを厳密にする（回答前に予約済みか、回答後に新規生成できるか）。
- 先頭5枚を常に公開する際のスライド/補充処理をモデル化し、生成不可能時に公開内容を書き換えない。
- REFRESHで消費し得る予約枚数と連続操作の扱いは未検証。
- 出題可能率に基づく重み補正の上限、履歴窓、難易度別統計は未決。

## 再現用コード（簡易）
```python
from itertools import product
from collections import Counter
seq=(1,2,3)
missions=('FREE','PAIR','TRIPLE','ODD','EVEN')
masks=[tuple(i for i in range(6) if m>>i&1) for m in range(1,64)]
possible={}
for board in product(seq,repeat=6):
    poss={m:set() for m in missions}
    for ix in masks:
        t=sum(board[i] for i in ix)
        poss['FREE'].add(t)
        if len(ix)==2: poss['PAIR'].add(t)
        if len(ix)==3: poss['TRIPLE'].add(t)
        if any(board[i]%2 for i in ix): poss['ODD'].add(t)
        if any(board[i]%2==0 for i in ix): poss['EVEN'].add(t)
    possible[board]=poss
zero=Counter()
for board in possible:
    for phase in range(3):
        successors={}
        for ix in masks:
            t=sum(board[i] for i in ix)
            new=list(board)
            for j,i in enumerate(ix): new[i]=seq[(phase+j)%3]
            successors.setdefault(t,[]).append(tuple(new))
        for t,boards in successors.items():
            for m in missions:
                common=set(range(1,19))
                for b in boards: common.intersection_update(possible[b][m])
                if not common: zero[m]+=1
print(zero)
```

## Vol.30選択肢（回答待ち）
1. 任意の公開キューの検証範囲: 1〜3の全5枚+予約1枚／先に公開5枚を固定し予約6枚目だけ変更。
2. 生成のタイミング: 補充前に必要枚数を全予約／回答後の未公開部分のみ生成を許す。
3. 出題可能率補正: 上限1.25倍の暫定導入／履歴統計が整うまで保留。
