# NUMBER×RUSH Vol.38｜DOUBLEの数字1〜2全件検証・最悪分岐重視・TRIPLE難易度別統計
日付: 2026-10-23
**すべて暫定案・未正式承認**。

## ユーザーの決定
- DOUBLEの数学的検証: 数字1〜2、NORMAL/DOUBLEを全件列挙。
- Variety Engine: 複数の現在回答ルートの遷移先評価では**最悪値**を重視。
- TRIPLEの出題統計: EASY/NORMAL/HARD別に直近100問を記録。目標出題頻度は実プレイ統計が得られるまで未設定。
- ODD/EVEN/TRIPLEの出題補正は直近100問、20問未満倍率1.0、上限1.25倍を維持。

## モデル
6位置の盤面と6枚の予約キュー。各タイルは NORMAL(1), NORMAL(2), DOUBLE(1), DOUBLE(2) の4通り（元数字nとDOUBLEフラグd∈{0,1}）。実効和への寄与はn*(1+d)。ODD/EVENは実効値でなく**元数字**で判定。FREE, PAIR, TRIPLEは使用枚数を判定。
公開5枚＋非公開予約6枚目は固定。現在TARGETに一致する全非空選択マスク（63通り）をプレイヤー行動とし、MISSION未達TARGET CLEARも含む。消費k枚を予約キュー先頭k枚で位置昇順に補充。回答後の未予約末尾k枚は4種の合法タイルから生成できる。REFRESH、BONUS、REVERSE、その他MISSIONなし。

## C++17の独立全件検証（実行済み）
4^6盤面×4^6予約キュー=16,777,216組。すべての現在TARGET一致ルートを列挙し、全回答後の盤面で共通NEXT TARGETが存在するかMISSION別に検査。
```
pairs 16777216 states 202088448 routes 1056964608
FREE valid 195125248 zero 0 total 2206872136 min 3 max 15
PAIR valid 68714496 zero 11520 total 722221844 min 0 max 6
TRIPLE valid 76496896 zero 1218912 total 750783188 min 0 max 7
ODD valid 187203584 zero 8206720 total 2018166124 min 0 max 15
EVEN valid 174182400 zero 7218176 total 1890978868 min 0 max 14
```
valid=現在MISSION CLEARが存在する(B,Q,T)状態数。zero=現在の全TARGET一致ルート後で共通NEXT TARGETがない(B,Q,T)状態数。zeroの分母は202,088,448。total=共通NEXT TARGET候補数の総和。
NEXT候補あり率（全状態均等）: FREE100%, PAIR約99.9943%, TRIPLE約99.3968%, ODD約95.938%, EVEN約96.428%。

## G4の構成的証明（限定モデル）
K38={(B,Q,T,M): B,Q∈{NORMAL(1),NORMAL(2),DOUBLE(1),DOUBLE(2)}^6, M∈{FREE,PAIR,TRIPLE,ODD,EVEN}, 現在MISSION CLEARが存在する}。
全(B,Q,T)で、全TARGET一致回答ルート後に共通して成立するNEXT FREE TARGETが存在（zero=0）。生成側が回答前にNEXT=(FREE,t')を確定すれば、プレイヤーのどのTARGET一致回答後もFREE(t')成立。残存予約を変更せず、回答後の未公開末尾をどの合法4種で生成しても新予約Q'は同じモデルに属する。よってK38へ戻る。
この閉包不変集合により無期限G4継続を保証。PAIR/TRIPLE/ODD/EVENも共通NEXT TARGETがある場合のみ選択可能。数字1〜4+DOUBLE、BONUS併存、REFRESH、REVERSE、実ゲーム全体のG4は未証明。
一般的な安全ゲームの最大固定点に関する説明: https://prasitagit.github.io/papers/MTechThesis.pdf

## Variety Engine：最悪分岐重視（暫定）
安全候補NEXT問題cに対し、現在TARGET一致の全回答ルートaの遷移先盤面B_aを列挙。
各分岐先でMISSION CLEARの使用枚数種類数Dm(a,c)と、TARGET一致全ルートの使用枚数種類数Dt(a,c)をタイルID区別で計算。
MISSION別の候補群でmin-max正規化（同一値なら0.5）。PAIR/TRIPLEはDmが固定なのでDt側を主評価。
**最悪分岐の多様性** `worst(c)=min_a score(B_a,c)` を主評価とし、平均値を同点判定に使う案。これにより一部の回答だけが多様な問題を過大評価しない。
安全性をソフト評価で置き換えず、全回答分岐で安全な候補のみ採用。EASY3〜8/NORMAL2〜5/HARD1〜3のMISSION CLEAR解法数帯はソフト制約。
未承認: 最悪値と平均値の重み、min-maxの正規化単位（各MISSION/各盤面など）。

## TRIPLE統計：難易度別直近100問
EASY/NORMAL/HARDそれぞれ最大100問のリングバッファを設け、各問について(1)TRIPLE安全候補の有無(2)実際のTRIPLE出題(3)MISSION CLEAR解法数(4)使用枚数多様性を記録。
難易度ごとに20問未満なら補正倍率1.0、20問以上でも上限1.25倍。出題可能率と実出題率は別集計。
目標出題率は固定しない。実プレイ計測で決める。サンプル数が少ない難易度の補正は他難易度の履歴を流用しない。

## CI
`tools/verify-vol38.cpp`を追加し、回帰値を検査。GitHub Actionsは関連検証コード・ワークフロー変更時のみ起動し、Vol.32〜38を検査。GitHub Actions上の成功は未確認。

## Vol.39の承認待ち
1. DOUBLEの次の保証拡張: 数字1〜3+DOUBLEの全件探索へ進む／BONUSとの共存を先に形式化。
2. 最悪分岐の評価: 最悪値を主・平均値をタイブレーク／最悪値80%+平均値20%。
3. TRIPLEの統計活用: まずログ収集のみ／安全候補からの出題不足補正を難易度別に有効化。
