# Vol.32｜独立全件再検証とCI自動化
日付: 2026-10-23
**すべて暫定案・未正式承認。**

## ユーザーの選択
- 数字1〜3の全件独立再検証とCI化を優先。
- 回答後の未公開末尾は、Safety Engineで安全性を満たす全候補からVariety Engineが選ぶ。
- ODD・EVENの出題可能率補正は直近100問を基本窓とし、20問未満は倍率1.0。補正上限1.25倍。
- 既存の難易度別MISSION CLEAR解法数帯（EASY3〜8、NORMAL2〜5、HARD1〜3）と同種MISSION連続回避はソフト制約。

## 独立再検証（実行済み）
新しいC++17検証器 `tools/verify-vol32.cpp` を作成し、ローカルでコンパイル・実行。
数字1〜3の6位置盤面729種×6枚予約キュー729種=531,441組。全63非空部分集合から現在TARGET一致ルートを列挙し、すべての回答後盤面で共通のNEXT TARGETが存在するかをFREE/PAIR別に検査。位置IDを区別し、MISSION未達のTARGET CLEARも含む。現在TARGETは非空部分集合和で出現するものを全対象とする。
実測出力:
```
board_queue=531441 states=6234408 routes=33480783
FREE zero=0 candidates_total=69060354 min=4 max=15
PAIR zero=0 candidates_total=20908809 min=1 max=5
```
全件でNEXT FREEおよびNEXT PAIR候補ゼロの状態は0。Vol.30の集計と一致。
検証器は状態数、回答ルート数、候補総数、候補ゼロ数、最小最大候補数をassert相当の非ゼロ終了で回帰検査する。

## CI
`.github/workflows/number-rush-safety.yml` を追加。検証コード/ワークフロー変更時のpush・PR、および手動workflow_dispatchでUbuntu上にC++17検証器をビルドして実行する。失敗はexit code 1でCIを落とす。
**GitHub Actions上での実行成功はこの議事録の作成時点では未確認。** ワークフローの保存とローカル実行の成功を区別する。

## 限定モデルのG4構成
状態K={(B,Q,T,M): B,Q∈{1,2,3}^6、M∈{FREE,PAIR}、現在MISSION CLEARが存在}。
- 回答前にNEXT=(PAIR,t')を確定する。全TARGET一致ルート後にPAIR(t')が成立する共通t'の存在は全件検査で確認。
- 消費k枚を予約Qの先頭k枚で補充。残存Q[k..5]は変更不可。
- 回答後、未予約末尾k枚を{1,2,3}から生成。どの合法な末尾を選んでも新Q'∈{1,2,3}^6なので次状態はKに含まれる。
- よって帰納的に任意回の継続が可能。生成側がNEXTをFREE/PAIRの範囲で選べることが条件。NEXTを事後改変しない。
- これは一般の実ゲーム（SPECIAL、他MISSION、REFRESH、値1〜9等）のG4証明ではない。ゲーム品質や解法多様性の保証でもない。

## Variety Engineと末尾生成
安全集合K内では合法な{1,2,3}末尾の全候補が閉包性を維持するため、Variety Engineが数字・解法の多様性を優先して選択可能。ただし本番の複雑なモデルでは候補ごとにSafety Engine検証が必要。
消費k枚の生成候補数は3^k（k=1..6）。現在公開済みNEXT TARGET/MISSIONと残存予約は変更不可。

## ODD・EVEN直近100問の運用案
直近100問のリングバッファに、各MISSIONの安全候補の有無と実際に選んだMISSIONを記録。20件未満の間は補正倍率1.0。20件以上ではp=安全候補あり件数/観測件数、倍率=min(1.25,1/max(p,ε))。出題不能MISSIONに倍率を適用しない。
これはODD/EVENを実装した本番Safety Engineが出題可能性を判定した場合にのみ適用。FREE/PAIRだけの限定モデルの検証結果をODD/EVEN実測値として流用しない。

## 未解決
- CIのGitHub上の実行確認、必要に応じて修正。
- NEXT MISSIONにTRIPLEを含める安全集合の構成。
- 直近100問の集計範囲を難易度別に分けるか。
- 生成候補の3^k全列挙が本番の数字範囲で高コストとなる場合の枝刈り・キャッシュ。
- REFRESH、特殊タイル、公開5枚と非公開予約の多段先読み。

## Vol.33の選択肢（未承認）
1. 次のG4拡張：TRIPLE追加／数字1〜4に拡張。
2. CI：毎回のpushでも検証／関連ファイル変更時のみ検証（現状）。
3. Variety Engine：末尾生成の数字多様性を優先／解法枚数の多様性を優先。
