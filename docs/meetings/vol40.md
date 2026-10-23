# NUMBER×RUSH Vol.40｜DOUBLE全盤面の分割検証・Variety同点判定・TRIPLE統計基盤
日付: 2026-10-23
**すべて暫定案。正式承認前。全件G4検証は未完了。**

## 今回の決定
1. 数字1〜3、NORMAL/DOUBLE、現行5MISSIONについて、46,656盤面×46,656予約キューを192分割で検査する。
2. Variety Engineは最悪分岐値を主指標、平均値を第2判定、直近の使用枚数パターンとの重複の少なさを第3判定とする。
3. TRIPLEはEASY/NORMAL/HARD別の直近100問ログ形式とテストを先に実装する。補正は無効のまま。

## G4分割検証の実装
Vol.39の`tools/verify-vol39.cpp`を使用。数字1〜3・NORMAL/DOUBLEの6種類タイル、盤面と予約キュー各6枚、現行5MISSION。元数字の奇偶判定を維持。TARGET一致の全63マスク、MISSION未達TARGET CLEARを含む。予約6枚は回答前に固定し、消費枚数kに応じて先頭k枚を補充。REFRESH、BONUS、REVERSEなし。
全探索空間: 6^12=2,176,782,336盤面×予約キュー組。回答マスク列挙の総数は2,176,782,336×63=137,137,287,168（各マスクはちょうど1つのTARGET和に対応）。
`.github/workflows/number-rush-vol40-full.yml`を追加。**手動workflow_dispatch専用**。192ジョブ、各243盤面、各盤面で予約46,656種類全件。max-parallel=8、fail-fast=false。各ジョブの標準出力を`shard-000.log`〜`shard-191.log`としてアップロードし、最後のauditジョブで全192ログを照合する。
`tools/audit_vol40.py`は以下を必須とする: 各区間[i×243,(i+1)×243)、予約[0,46656)、各ジョブの組数243×46656、全192ファイル、NEXT FREE zero=0、全ジョブの正常な検証結果、総組数6^12、総ルート数63×6^12。欠落や異常時はexit1。
監査成功と、すべてのジョブが正常終了したことが揃って初めて、NEXT FREEの全状態での共通TARGET存在を確定できる。さらにその場合に限り、FREEへの退避を使ったK5の無期限G4閉包証明が可能。
**本会議時点で192ジョブは起動しておらず、全件G4保証は未証明。** Vol.39の部分検証（盤面0〜127、予約全件、NEXT FREE zero=0）は既存の結果として保持。CIの作成とCI実行を混同しない。
注意: 192ジョブの大規模計算は実行時間/Actions使用量が大きくなり得る。実行前にクォータとタイムアウトを確認すること。ログの集約監査は偽陽性を避けるためfail closed。

## Variety Engine
`tools/variety_vol40.py`に安全候補だけを入力する純粋な比較関数を追加。
第1指標: min_a V(c,a)（最悪分岐、多い方）。
第2指標: mean_a V(c,a)（平均分岐、多い方）。
第3指標: recent_overlap（最近の使用枚数パターンとの重複、少ない方）。
完全同点時は候補IDの辞書順で決定的に選ぶ。
MISSION別候補群min-max正規化、MISSION CLEARとTARGET一致全ルートの使用枚数種類数の併用を維持。PAIR/TRIPLEのMISSION CLEAR使用枚数は固定なのでTARGET一致側を重視。
今回の比較関数は正規化済みの指標を受け取る設計であり、Safety Engineや実ゲームへの接続は未実装。重複スコア算出方法は後続実装で要定義。

## TRIPLE統計の形式とテスト
`tools/triple_stats.py`: EASY/NORMAL/HARDごとに独立したmaxlen=100のdeque。
TripleEvent: available（安全なTRIPLE候補あり）、selected（TRIPLEが実際に選ばれた）、mission_clear_solutions（MISSION CLEAR解法数）、target_tile_count_kinds（TARGET一致解法の使用枚数種類数）。
selected=trueかつavailable=falseの矛盾、負の解法数、不正な種類数を拒否。summaryでobserved,available,selected,availability_rate,selection_rate,selection_given_availableを返す。観測なしの比率はNone。
correction_multiplier=1.0、correction_enabled=falseで固定。**目標出題頻度未設定、出題補正無効、ゲーム本体への計測組み込み未実装**。
`tools/test_vol40.py`で履歴の100件窓、難易度独立性、不正データ拒否、Varietyの同点順位、監査ファイル欠落を検査。
ローカル実行: `python -m unittest -q test_vol40.py test_audit_vol40.py`、4テストPASS（実装の統合版は`python3 -m unittest discover -s tools -p 'test_vol40.py'`で実行可能）。

## CI
既存の関連ファイル変更時CI`.github/workflows/number-rush-safety.yml`にVol.40単体テストを追加。
全件192分割は別ワークフローで手動実行専用。GitHub Actionsでの実行成功は未確認。

## Vol.41の承認待ち
1. 全件検証: GitHub Actionsで192ジョブを起動して結果を監査／計算負荷を削減する対称性・キャッシュの最適化を先行。
2. Varietyの履歴: 直近20問の使用枚数パターン／直近100問の使用枚数パターン。
3. TRIPLE統計: ゲーム本体に計測を接続／ログのエクスポートと可視化を先行。
