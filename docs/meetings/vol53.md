# NUMBER×RUSH Vol.53｜G4先頭バッチ結果確認・回答確定イベント橋渡し・TRIPLE HUD結合
日付: 2026-10-23
**すべて暫定案・正式承認前。G4全件保証は未確定。**

## 今回の指定
1. G4: Vol.52先頭1バッチ計測結果・実測ログ分析。
2. Variety: 回答ID生成をゲーム本体の判定確定イベントと結合。
3. TRIPLE: HUDの保存状態表示と更新処理を結合。

## G4ベンチマーク状況
GitHub Actions実行履歴60件を確認したが`number-rush-vol52-benchmark.yml`に対応する実行は0件。先頭24区間のGitHub Actions実測ログ・時間・RSS・実行費用は未取得。通常Safety CIとは別のworkflow_dispatchで、現GitHub接続には手動ワークフロー新規起動の機能がない。実行は https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol52-benchmark.yml の Run workflow → main → Run workflow が必要。**未実測のため性能分析数値は報告できない。** G4全件保証も未証明。

## Variety回答確定イベント結合
`src/telemetry/committed-answer-bridge-v53.mjs`を追加。
- `createCommittedAnswerBridge({storage,locks,cryptoProvider,onWarning,onPersistenceStatus})`がVol.52の`createAnswerIdFactory`とVol.51の`createVarietyAnswerAdapter`を統合。
- 判定確定時に`await bridge.commit({outcome,consumedTileCount})`を1回呼ぶ。128-bitセッション乱数+通番でIDを発行し、MISSION CLEAR/TARGET CLEARを履歴に記録。MISSは記録しない。
- 戻り値`{event,persistence}`に確定イベントと保存結果を返す。保存失敗時もイベントを返し、ゲームの得点や盤面を変更しない。
- 保存の再試行は`bridge.retry(event)`に**元の確定イベントを渡す**。新しいIDを発行しない。Vol.50 Web Locks排他を継承。
- `src/telemetry/committed-answer-bridge-v53.test.mjs`でID生成→記録→重複再試行、MISS除外、保存不能時をテスト。
- **制限:** リポジトリ内の実際のゲーム判定関数への呼び出し挿入は未実施。現時点では本体が呼び出せる接続モジュール。20件窓から外れた古いID再送は保証外。factoryはページランタイム中に1回生成する。

## TRIPLE HUD結合
`src/telemetry/triple-hud-bridge-v53.mjs`を追加。
- `connectTripleHUD({element,storage,locks,onWarning})`がVol.49の`initializeTripleRuntime`、Vol.51の`createTripleStorageUIAdapter`、Vol.52の`renderTripleStorageStatus`を接続。
- HUD要素へ初期状態「確認中」を即時表示。初期化成功で「保存は有効」、Web Locks未対応で「統計の自動保存は利用できません」などに更新。
- `await bridge.commitQuestion(questionId,event)`で保存結果に応じた表示を自動更新。UIはテキスト描画・ARIA status対応。ゲームプレイを妨げない。
- `src/telemetry/triple-hud-bridge-v53.test.mjs`でWeb Locksなし／ありの初期表示遷移をテスト。
- **制限:** HUD用の既存DOM要素へ接続する統合部品を実装。ゲーム本体HTMLへの要素挿入、実際の問題確定イベントへの呼び出し挿入、ブラウザ実機テストは未実施。保存失敗で自動初期化しない。TRIPLE補正倍率は引き続き1.0。

## CI
`.github/workflows/number-rush-safety.yml`にVol.53の2つのNodeテストを追加。Actions上での成功は未確認。

## Vol.54候補
1. G4: Vol.52先頭バッチの手動実行後にログ分析／小規模ローカル実測で先行校正。
2. Variety: ゲーム本体の実際の判定関数へのイベント発火箇所を実装／再起動後の未保存イベント再送キューを設計。
3. TRIPLE: ゲーム画面にHUD要素を追加して統合／問題確定イベントと`commitQuestion`を接続。
