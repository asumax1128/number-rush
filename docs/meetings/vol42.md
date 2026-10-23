# NUMBER×RUSH Vol.42｜G4性能測定・Variety予測分布補正・TRIPLE可視化
日付: 2026-10-23
**すべて暫定案。正式承認前。G4全件保証は未確定。**

## 決定
1. 数字1〜3、NORMAL/DOUBLEの全192分割G4検証を起動する前に、複数区間で性能測定し実行費用を見積もる。
2. Variety Engineの直近20問使用枚数重複率を、候補の予測使用枚数分布で補正する。
3. TRIPLE統計をCSV/JSONでエクスポートし、オフラインHTMLレポートで可視化する。

## G4性能測定（実測）
Vol.41の最適化検証器`tools/verify-vol41.cpp`を使い、各区間で予約キュー46,656種類をすべて検査。ローカル環境で/usr/bin/timeを使用（コンパイル時間・Actionsジョブ起動時間は含まず）。
| 盤面区間 | 検査組数 | wall time | peak RSS | NEXT FREE zero |
|---|---:|---:|---:|---:|
| [0,243) | 11,337,408 | 2.77秒 | 123,136KB | 0 |
| [23000,23243) | 11,337,408 | 3.00秒 | 123,136KB | 0 |
| [46413,46656) | 11,337,408 | 2.68秒 | 123,264KB | 0 |
平均2.8167秒/区間。192区間の計算処理だけの単純推計=540.8秒=約9.0分（総CPU実行時間に近い見積りであり、並列ジョブの壁時計時間でもGitHub Actions請求時間でもない）。
Actionsは192ジョブ各々で起動・checkout・コンパイル・artifactアップロードを行うため、課金対象時間の推計には1ジョブあたりの固定オーバーヘッドと料金体系が必要。例えば仮に固定オーバーヘッドが1分/ジョブなら約192分＋計算9分=約201ジョブ分相当となる（仮定であり実測でも請求額でもない）。料金はリポジトリ公開設定・利用プラン・ランナー・当該時点のGitHub料金条件で異なるため、円建て金額は断定しない。
`tools/benchmark_vol42.py`に任意の3区間の再現可能なベンチマークと単純推計JSON出力を実装。全件192ジョブは未実行。検証済み3区間でFREE反例0、全件G4は未証明。

## Variety Engineの直近20問履歴補正
`tools/variety_distribution_vol42.py`を追加。
過去20問で実際に選択された使用枚数kの頻度h20(k)と、候補問題での使用枚数kの予測分布p_c(k)を用い、R(c)=sum_{k=1}^6 p_c(k)h20(k)を計算。小さい方を第3タイブレークとして優先。
これにより候補の回答可能な使用枚数種類が多いほど一律に罰するVol.41の単純集合重複率の偏りを軽減する。
`from_solution_counts`は使用枚数別解法ルート数からp_cを計算。**解法ルートが等確率で選択される仮定**であり、実プレイでの選択確率とは限らない。将来は実プレイログから推定。
候補選定順はSafety Engine合格 → MISSION内min-max正規化 → 最悪分岐の多様性最大 → 平均値最大 → R(c)最小 → 決定的タイブレーク。Safety EngineのG1〜G4は変更しない。
`tools/test_variety_distribution_vol42.py`で分布補正、履歴なし、解法数からの変換、不正確率を検査。

## TRIPLEエクスポート・可視化
`src/telemetry/triple-export.mjs`を追加:
- `exportTripleCSV(telemetry)`: difficulty, question_index, triple_available, triple_selected, mission_clear_solutions, target_tile_count_kinds
- `exportTripleJSON(telemetry)`: schemaVersion=1、難易度別100問履歴、observed/available/selected/各比率、correctionEnabled=false
- `renderTripleHTML(telemetry)`: 外部依存なしのHTML、EASY/NORMAL/HARD別に出題可能率・実出題率のバー、出題可能時の採用率
- `src/telemetry/triple-export.test.mjs`: 空の難易度、出力値、100問窓を検査
- 個人識別子やネットワーク送信は追加しない。実ゲームのデータ接続は未完了。可視化の架空数値は実測として扱わない。
- TRIPLEの目標出題頻度は実プレイ統計で決める。出題不足補正は引き続き無効（倍率1.0）。

## CI
`.github/workflows/number-rush-safety.yml`の関連ファイル変更時検証にVol.42のPythonとNodeテストを追加。GitHub Actionsの成功は未確認。192分割手動実行は変更せず未実行。

## Vol.43の承認待ち
1. G4実行計画: 少数ジョブをActionsで実測してオーバーヘッドを確定／192分割全件を起動
2. Variety予測分布: 解法ルート等確率を暫定採用／難易度別の選択傾向をログ収集して推定
3. TRIPLE可視化: CSV/HTMLダウンロードをUIに統合する準備／安全な実データ保存形式を先に整備
