# Vol.30｜任意の公開5枚＋予約6枚目の全探索
日付: 2026-10-23
状態: **すべて暫定案・未正式承認**。任意6枚予約キューのG2全探索は実行済み。回答後の未公開末尾生成を含むG4は未証明。

## ユーザー選択
1. 数字1〜3の公開5枚+予約6枚目の全組み合わせを検証。
2. 予約済み部分を守り、回答後に未公開末尾を生成可能とする。
3. ODD/EVENの出題可能率補正を上限1.25倍で暫定導入。
現行MISSIONはFREE,PAIR,TRIPLE,ODD,EVEN。Safety Engine/Variety Engine分離、解法数ソフト制約(EASY3〜8、NORMAL2〜5、HARD1〜3)、同種MISSION連続回避ソフト制約を維持。

## 予約キューの意味論
- 盤面Bの6枚、公開5枚Q[0..4]、非公開だが確定した予約6枚目Q[5]。
- 現在TARGETに一致する回答がk枚を消費すると、Q[0..k-1]を消費位置昇順に補充。
- 回答後の残存予約Q[k..5]は変更不可。残りの予約枠を未公開末尾の合法な値で埋め、次の公開5枚を表示する。
- **回答前に既に公開済みのNEXT TARGET/MISSIONは固定。** 回答後に新たに公開する次々問題の選択と、予約末尾の生成のタイミングはG4固定点モデルで厳密化する。
- 予約末尾の生成は、既存の予約を上書きしたり並び替えたりしない。

## 全探索モデルと実測
- 6枚の位置ID付き通常タイルB∈{1,2,3}^6（729盤面）。
- Q∈{1,2,3}^6（729通り、先頭5枚公開・6枚目内部予約）。
- 現在TARGET=1..18、MISSION=FREE/PAIR/TRIPLE/ODD/EVEN。
- 全63非空部分集合をタイルIDで区別。現在TARGETに一致する全ルートをプレイヤー行動として列挙（MISSION未達TARGET CLEARを含む）。
- 盤面×キュー: **531,441**。
- 解答可能な(盤面,Q,現在TARGET): **6,234,408**。
- 全TARGET一致ルートの総数: **33,480,783**。
- 各ルートでQの先頭k枚を補充し、補充後盤面でMISSION CLEAR可能なTARGET集合を算出。現在のすべての合計一致ルートに対して共通するNEXT TARGET集合をMISSION別に求めた。
- 共通NEXT TARGETがゼロの状態:
  - FREE: **0**（出題可能率100%）
  - PAIR: **0**（100%）
  - TRIPLE: **17,820**（約99.714%で出題可能）
  - ODD: **22,344**（約99.642%）
  - EVEN: **1,039,260**（約83.331%）
- 共通NEXT TARGET候補数の分布:
  - FREE: 4〜15個（0件なし）
  - PAIR: 1〜5個（0件なし）
  - TRIPLE: 0〜6個
  - ODD: 0〜14個
  - EVEN: 0〜13個
- **この計算はG2のみ。** 新規生成する予約末尾の合法性と、その後の公開キューの不変性を含む無期限G4固定点は未実施。FREE/PAIRの共通候補が全状態に存在することだけでは、全状態がG4安全であるとは言えない。

## 検証コード
コンパイル済みC++17による完全列挙。以下は簡略化した中核ロジック:
```cpp
for (board : all_3_power_6_boards)
 for (queue : all_3_power_6_queues) {
   map<int, vector<Board>> successors;
   for (mask=1; mask<64; ++mask) {
     target = sum_selected(board,mask);
     next = board;
     int k=0;
     for (i=0;i<6;i++)
       if (mask&(1<<i)) next[i]=queue[k++];
     successors[target].push_back(next);
   }
   for (auto [target,afterBoards] : successors)
     for (mission : {FREE,PAIR,TRIPLE,ODD,EVEN}) {
       possibleTargets = {1,...,18};
       for (next : afterBoards)
         possibleTargets &= missionClearTargets(next,mission);
       countCandidateZeroIfEmpty(possibleTargets);
     }
 }
```
完全な再現コードは議事録と同時にGitHubの `tools/verify-vol30.cpp` に保存する。

## ODD/EVEN補正の暫定案
安全候補抽出後にのみVariety Engineで重み補正。
`adjustedWeight = baseWeight * min(1.25, 1/max(availabilityRate, epsilon))`。
今回の全状態均等集計を使った例: ODD約1.0036倍、EVEN約1.20倍。実プレイの到達状態分布は均等でないため、実装時は難易度/ミッション帯/直近の到達可能状態の統計を使う。補正上限1.25は暫定採用。安全候補がないMISSIONには補正を適用しない。

## Vol.31の承認待ち
1. 次のG4検証: まずFREE/PAIRのみで予約キュー固定点を構築／5MISSIONを同時に組み込む。
2. 末尾生成の探索: 全候補を列挙して安全性を確認／安全な生成パターンを先に限定する。
3. ODD/EVENの統計: 直近100問を基本窓とする／難易度別の累積統計を優先する。
