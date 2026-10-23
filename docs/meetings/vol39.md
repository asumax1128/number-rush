# NUMBER×RUSH Vol.39｜数字1〜3・NORMAL/DOUBLE分割全件探索
日付: 2026-10-23
状態: **すべて暫定案、正式承認前。G4全件保証は未確定。**

## 決定
1. 数字1〜3、NORMAL/DOUBLEの全件探索を目指す。
2. Variety Engineの分岐先評価は最悪値を主指標、平均値を同点判定。
3. TRIPLEの難易度別ログをまず収集する。目標出題率未設定、出題不足補正はまだ有効化しない。

## 検証モデル
1枚はNORMAL(1,2,3)またはDOUBLE(1,2,3)の6種類。元数字nとDOUBLEフラグdを別管理し、実効値n*(1+d)、ODD/EVENは元数字で判定。6枚盤面と予約6枚、公開済み5枚+内部予約6枚目は回答前に不変。全63選択マスク（MISSION未達TARGET CLEARを含む）を列挙。消費k枚は予約先頭k枚から位置昇順に補充。回答後の未公開末尾生成は任意の合法6種類。
盤面数6^6=46,656、予約キュー数46,656、合計6^12=2,176,782,336組。全盤面を一度に実行したという主張は禁止。

## 分割検証器
`tools/verify-vol39.cpp` を追加。board_begin, board_end, queue_begin, queue_endを引数に指定でき、範囲の全(B,Q,T)とTARGET一致回答を厳密に列挙。各NEXT MISSIONに対して全回答ルートの後で共通NEXT TARGETがあるか調べる。
全件検証には互いに重ならないboard区間で[0,46656)をすべて覆い、各区間でqueue=[0,46656)を実行する必要がある。各区間のログと終了コードを保管し、漏れ・重複を検査すること。現時点で全区間は未実行。

## 実測済み部分結果
C++17をローカルでコンパイルして実行:
```
/tmp/verify_vol39 0 128 0 46656
board_range=0:128 queue_range=0:46656 pairs=5971968 states=64525248 routes=376233984
FREE valid=64525248 zero=0
PAIR valid=24587712 zero=102576
TRIPLE valid=27433728 zero=1333512
ODD valid=64525248 zero=54344
EVEN valid=37698048 zero=17151020
RESULT: no FREE counterexample in tested partition
```
ここでzeroは現在の全TARGET一致回答後に共通NEXT TARGETが存在しない(B,Q,T)数。検証した盤面は46,656中128種類（約0.274%）、予約は各盤面ですべて。未検査盤面についてのFREE/G4の断定は禁止。
検証済み区間ではNEXT FREEが全状態で可能。全区間でも成立すると確認できれば、Vol.38と同様のK5閉包構成が可能だが、現段階では**未証明**。
一般的な安全ゲームのcontrollable predecessorと最大不動点: https://par.nsf.gov/servlets/purl/10100579

## Variety Engine（暫定）
Safety Engineに合格したNEXT候補cだけを評価。現在の全TARGET一致回答aの遷移先ごとに、MISSION CLEAR解法とTARGET一致全ルートの使用枚数種類数を算出し、MISSION内候補群のmin-max正規化（同値のみなら中立0.5）。
主順位はmin_a score(c,a)、同点なら回答分岐平均値mean_a score(c,a)、なお同点なら決定的シードでタイブレーク。
PAIR/TRIPLEはMISSION CLEAR使用枚数が固定なのでTARGET一致全ルートを主評価。解法数帯はソフト制約。公開NEXT/予約キューをVarietyのために改変しない。

## TRIPLE難易度別ログ（補正無効）
EASY/NORMAL/HARDごとに独立した直近100問の履歴を収集。
各出題機会のdifficulty、TRIPLEが安全に出題可能だったか、実際にTRIPLEを出したか、MISSION CLEAR解法数、TARGET一致解法の使用枚数種類数、任意のseed/時刻を記録。
出題可能機会の率と実出題率を別集計。20問未満は倍率1.0、補正上限1.25倍という既存設計は保持するが**Vol.39では倍率を適用しない**。目標頻度は実プレイ統計で決定。

## CI
既存Vol.32〜38の検証を維持。Vol.39は関連ファイル変更時に小区間のスモークテスト（board=[0,128), queue=[0,46656)）を実行し、件数とゼロ状態を確認する。全2,176,782,336組の分割実行は別途計画・監査が必要で、CIスモーク成功を全件成功と誤認しない。
GitHub Actionsの成功は未確認。

## Vol.40の承認待ち
1. 全件検証の進め方: 分割ジョブで全46,656盤面を検査／FREE不変性の構造的証明を先に探索。
2. Variety同点判定: 平均値のみ／平均値後に直近の使用枚数パターンを比較。
3. TRIPLEログ: まず集計形式とテストを実装／ゲーム本体への計測実装を優先。
