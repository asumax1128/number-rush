# NUMBER×RUSH Vol.56｜全192区間の最終準備・回答二重発火防止・問題ID連携
日付: 2026-10-23
**すべて暫定案・正式承認前。無限G4は未証明。**

## 1. G4全192区間の最終準備と実測状況
GitHub Actions実行履歴72件を照会。Vol.51全192区間バッチ、Vol.52先頭24区間ベンチマークとも実行0件。したがって**GitHub Actions実測ログ・課金時間・全件検証結果は未取得**。
既存`.github/workflows/number-rush-vol51-batch.yml`の8ジョブ×24区間（192区間）、max-parallel=4、各区間全46,656キュー、artifact収集、aggregateによる全件検査を確認。
`tools/preflight_vol56.py`と`tools/test_preflight_vol56.py`を追加し、ワークフローの静的整合性と全区間被覆をCI検査。実行手順・失敗判定・検証範囲を`docs/vol56-g4-runbook.md`へ保存。
Vol.55の先頭24区間ローカル実測：合計74.140秒、最大RSS123,264KiB、FREE反例0件。残り168区間とGitHub Actions上の全件実測は未実施。
**証明範囲の限定:** 現検証器は数字1〜3/NORMAL・DOUBLE限定モデルの全分岐に共通NEXT FREE TARGET候補があるかを探索。全MISSION・無限G4固定点・本番ランダムキューを含む証明ではない。

## 2. Variety Engine：回答確定イベントの二重発火防止
`src/telemetry/answer-commit-gate-v56.mjs`を追加。
- `createGuardedAnswerCommitter({storage,locks,cryptoProvider,...})`はVol.54の確定判定フックを内包。
- ゲーム本体は一意な`answerKey`と`finalized:true`を渡して`commit`。同じキーの同時呼び出しは同じPromiseを返し、二重の回答ID発行・保存を防ぐ。
- 同じキーで結果または消費枚数が違う場合は衝突エラー。未確定イベントや不正な枚数は拒否。
- 処理済みキーを最大512件メモリに保持。範囲を超えた古いキーの再使用やページ再起動後の重複発火は防止できない。保存失敗時の同じキー再呼出は同じ結果を返すため、明示的な`retry(event)`が必要。
- `src/telemetry/answer-commit-gate-v56.test.mjs`で同時発火、確定後の重複、矛盾、未確定拒否をテスト。
- ゲーム本体の判定関数そのものは本リポジトリに存在しないため、実際のゲーム本体への接続は未実施。

## 3. TRIPLE統計：問題ID生成と問題確定イベントの結合
`src/telemetry/question-commit-v56.mjs`を追加。
- `createQuestionCommitter({hud,storage,locks,cryptoProvider,...})`がVol.52の暗号学的乱数セッションID生成とVol.54のHUD表示を統合。
- Safety/Varietyが出題を確定した後に`commit({questionKey,finalized:true,difficulty,safeMissions,selectedMission,missionClearSolutions,targetTileCountKinds})`を呼ぶ。
- `q_<32桁sessionHex>_<通番>`形式のIDを発行。最大96文字、Vol.45の永続IDバリデーションに適合。
- 同じquestionKeyの並行確定イベントは同じPromise・問題IDを返し、二重記録を防ぐ。選択MISSIONが安全候補にない場合、未確定の場合は拒否。保存結果に応じHUDを更新。
- `src/telemetry/question-commit-v56.test.mjs`で正常記録、重複、データ衝突、安全性未確認、Web Locks不在をテスト。
- セッション内最大512件のメモリゲート。ページ再起動後・複数タブ間の問題ID発行の完全一意性は保証しない（乱数衝突確率は極小）。実ゲーム本体への呼出箇所挿入は未実施。

## 4. CI・検証状況
`.github/workflows/number-rush-safety.yml`にVol.56のNodeテストとPythonプリフライトテストを追加。CIのpush/PRパスフィルタにも検証ツールを追加。
GitHub Actions上での追加テスト成功は未確認。ワークフロー全件検証は手動起動が必要。

## Vol.57の議題候補
1. G4: 全192区間のActions実測ログ取得・分析／残り168区間のローカル分割検証。
2. Variety: 回答キーの再起動後重複防止／保存失敗イベントの安全な再送キュー。
3. TRIPLE: 問題IDの再起動後継続性／ゲーム本体の問題確定点との接続仕様と実装準備。
