# Vol.23｜周期キューのG2全探索（Ver.0.22案）
日付: 2026-10-23
状態: **暫定・未正式承認**。G2の限定モデル全探索は実施済み、G4は未証明。

## ユーザー選択
1. キューを1→2→3の周期にする限定モデルから検証。
2. 安全な複数NEXT TARGETを許可。
3. 安全性を満たしたうえで問題の多様性を優先。
従来のSafety Engine / Variety Engine分離、同種MISSION連続回避ソフト制約、公開済みキュー不変を維持。

## 検証モデルと結果
- 盤面: 6個の位置ID付きタイル。各タイル値∈{1,2,3}、3^6=729盤面。
- キュー位相: 0,1,2（次の補充が1,2,3のどれか）、729×3=2,187組。
- MISSION=FREE、TARGET=1..18、特殊タイルなし、REFRESHなし。
- すべての非空部分集合63通りについて合計を計算。合計一致した部分集合ごとに選択位置の昇順で1,2,3の周期キューから補充。位相は消費枚数分進める。
- (盤面,位相,TARGET)のうち合計一致ルートが存在する状態数: **25,656**。
- それらの合計一致ルートの総数: **137,781**（重複する数値もタイル位置IDで別ルート）。
- 各状態で全合計一致ルート後の盤面の「可能な非空部分集合合計」の共通部分を取った結果、**共通NEXT TARGETが0個の状態は0**。
- 共通NEXT TARGET候補数の分布（抜粋）: 8個:468、9個:2,263、10個:4,408、11個:5,850、12個:7,135、13個:3,155、14個:1,622、15個:579。その他16個以上:176。
- 具体例: 盤面 [1,2,3,1,2,3]、位相0、TARGET4では共通NEXT TARGETが1〜11の11種類。

## 検証コード（再現用Python）
```python
from itertools import product
vals=(1,2,3)
boards=list(product(vals,repeat=6))
sums={}
for b in boards:
    mask=0
    for m in range(1,64):
        mask |= 1<<sum(b[i] for i in range(6) if m>>i&1)
    sums[b]=mask
states=actions=no_common=0
hist={}
for b in boards:
  for phase in range(3):
    targets={}
    for mask in range(1,64):
      idx=[i for i in range(6) if mask>>i&1]
      target=sum(b[i] for i in idx)
      after=list(b)
      for j,i in enumerate(idx): after[i]=vals[(phase+j)%3]
      targets.setdefault(target,[]).append(tuple(after))
    for target,after_boards in targets.items():
      states+=1
      actions+=len(after_boards)
      common=(1<<19)-1
      for after in after_boards: common &= sums[after]
      common &= ~1
      n=common.bit_count()
      no_common+=(n==0)
      hist[n]=hist.get(n,0)+1
print(len(boards)*3,states,actions,no_common,hist)
```

## 厳密な解釈
- **今回検証したのはG2の存在性のみ**。現在の各解答可能状態で、どの合計一致ルートを取ってもNEXT FREEを解ける共通TARGETが少なくとも1個ある。
- NEXT TARGETの選択は、**プレイヤーの現在の回答前**に共通候補から行う必要がある。
- 公開NEXT以降の継続を保証するG4は未証明。有限状態の固定点計算と、NEXT予告を状態に含めた量化順序の検証が必要。
- 周期キューは実ゲームでの確定仕様ではなく数学的検証モデル。現行の難易度別特殊タイル確率、MISSION多様性、REFRESH等への一般化は未確認。

## 次回の選択肢（ユーザー回答待ち）
1. 次の検証: G4の固定点計算／2〜5問の有限先読みを先行。
2. Variety Engine: 安全候補内で計算難易度優先／数字・解法の多様性優先。
3. 周期キュー: あくまで検証専用／実ゲームでも低頻度で採用可能な候補として残す。
