# NUMBER×RUSH Vol.49｜G4パイロット再確認・Variety起動時移行・TRIPLE排他保存統合
日付: 2026-10-23
**すべて暫定案・正式承認前。G4全件保証は未確定。**

## 今回のユーザー決定
1. Vol.43の3ジョブGitHub Actionsパイロットの実行結果を確認・分析。
2. Variety Engineのv1→v2非破壊移行を起動時初期化フローへ統合。
3. TRIPLE統計のWeb Locks方式を保存呼び出しへ統合。

## G4パイロットの再確認
GitHub REST `GET /repos/asumax1128/number-rush/actions/runs?per_page=100`を2026-10-23に照会。全40件、Vol.43の`number-rush-vol43-pilot.yml`またはworkflow_dispatchの実行は0件。最新の通常Safety Verification run 39906035660 は照会時点でin_progress、直前の通常run 39906023143 はcompleted/success。
**Vol.43パイロットは未実行。3ジョブの実測ログ・起動オーバーヘッド・探索時間は未取得。** Vol.42のローカル平均2.82秒/区間、192区間の探索時間単純合計約9分は参考値でありGitHub Actionsの実測ではない。全192区間のG4保証は未証明。
実行先 https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol43-pilot.yml → Run workflow → main → Run workflow。GitHub接続にworkflow_dispatch実行機能がないためユーザーの手動起動が必要。

## Variety Engine：起動時初期化へv1→v2移行を統合
`src/telemetry/variety-init-v49.mjs`を追加。
- `initializeVarietyHistory(storage,{onWarning})`がVol.48の`migrateVarietyHistoryV1ToV2`を先に実行し、続けてVol.47の`IdempotentTargetHistory.restore()`を実行。
- v1だけがある場合、使用枚数（最大20件）をIDなしでv2に移し、v1原本は保持。v2が既存なら上書きしない。
- 移行失敗・破損v1/v2・保存エラーは`ready:false`として記録開始を止める。勝手に初期化しない。
- 成功時は返された`history.record({answerId,outcome,consumedTileCount})`を使用。MISSION CLEARとTARGET CLEARのみ、MISSは除外。
- `src/telemetry/variety-init-v49.test.mjs`で移行→記録→再起動→重複防止、旧データ保全、破損v1/v2、空ストレージ、保存失敗を検証。
- 制限: 過去のv1履歴には回答IDがなく遡及的な重複排除はできない。直近20件より古いIDの再送や複数タブ同時更新は未保証。実ゲーム本体への接続・実機確認は未実施。

## TRIPLE統計：Web Locksを保存呼び出しに統合
`src/telemetry/triple-runtime-v49.mjs`を追加。
- `initializeTripleRuntime({storage,locks,onWarning})`が起動時にWeb Locks exclusiveロック内でVol.47の`initializeTripleTelemetry`（v1→v2移行と復元）を実行。
- 返り値の`ready`、`status`、`migration`は初期化結果を表すPromise。ゲーム側は`await runtime.ready`してから運用。
- `await runtime.commitQuestion(questionId,event)`は初期化成功後、Vol.48の`commitTripleWithLock`を呼び、**排他ロックの内側で**v2を再読み込み→問題ID重複判定→保存。
- 同一IDの二重記録を防ぎ、異なるIDの同時更新も順序づける。Web Locks API未対応時は`lock-unavailable`として保存を拒否し、安全でないフォールバックは使わない。
- v1破損、v2破損、移行失敗は`ready:false`として以降の書き込みを拒否。旧v1データは保持。
- `src/telemetry/triple-runtime-v49.test.mjs`で移行・2タブ同時記録・同一ID重複排除・Web Locks不在・破損v1保護を検証。
- 制限: 同一オリジンの協調するタブ間のみ。Web Locksを使わない旧コード、別端末、ストレージ消去には非対応。ゲーム本体への配線・ブラウザ実機テストは未実施。TRIPLE補正倍率は引き続き1.0で無効。

## CI
`.github/workflows/number-rush-safety.yml`にVol.49の2つのNodeテストを追加。追加テストのGitHub Actions上の成功は未確認。

## Vol.50の承認待ち
1. G4: Vol.43の3ジョブパイロットを手動起動して計測ログを分析／192区間のジョブ統合方式を先に設計。
2. Variety: 複数タブ競合対策を追加／実ゲームへの保存接続インターフェースを先に設計。
3. TRIPLE: Web Locks非対応時の安全な取り扱いとUI表示／実ゲーム側の問題確定イベントへの接続インターフェース。
