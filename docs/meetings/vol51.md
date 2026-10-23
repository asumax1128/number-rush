# NUMBER×RUSH Vol.51｜192区間バッチ設計・Variety回答イベント・TRIPLE画面表示アダプタ
日付: 2026-10-23
**すべて暫定案・正式承認前。G4全件保証は未確定。**

## 承認待ちの3方針
1. G4: 全192区間を少数のバッチジョブへ統合する設計。
2. Variety: ゲーム本体の回答確定イベントへの接続インターフェースを実装。
3. TRIPLE: 保存状態をゲーム画面に接続するUIアダプタを実装。

## 1. G4全192区間バッチジョブ
`.github/workflows/number-rush-vol51-batch.yml`を新規作成。手動起動(`workflow_dispatch`)限定。
- 8マトリックスジョブ（batch 0..7）、各24区間、同時実行最大4、fail-fast=false。
- 区間i=0..191は盤面範囲`[243i,243(i+1))`、キュー範囲`[0,46656)`。8×24=192区間で盤面0..46656を重複・欠落なく分割。
- 各ジョブで`tools/verify-vol41.cpp`をコンパイル、24区間を順次実行。各区間の`FREE valid=N zero=0`、反例なしのRESULTを検査。
- 各区間の標準出力、`/usr/bin/time`のelapsedとpeak RSS、summary.tsvをartifactsへ保存。8ジョブ完了後のaggregateで全192区間の被覆・重複・zero値を再検証。部分失敗の場合はaggregateも失敗。
- `tools/parse-vol51-partition.py`を追加。各ログのboard/queue範囲、FREE zero、各区間の行、全192件の重複欠落をチェック。
- `tools/test_vol51_partition.py`を追加。192区間全件の正常ケース、欠落、重複、反例検出、ログパースを単体テスト。
- timeout-minutes=120は**仮設定**。192区間のGitHub Actions実行時間・費用は未計測。ジョブの実行前に利用枠を確認し、パイロット計測を推奨。
- **数学的限界:** Vol.41検証器が計算するのは数字1〜3×NORMAL/DOUBLEのモデルにおける各盤面・キュー組み合わせの共通NEXT FREE TARGET候補有無の探索であり、全MISSIONの無限G4固定点の独立証明ではない。全192区間を完走しても「対象モデルのFREE反例探索が完了」と表現し、ゲーム全体のG4保証と混同しない。
- ワークフローは作成したが**実行していない**。実測ログと最終検証結果は未取得。

## 2. Variety Engineのゲーム回答確定イベントアダプタ
`src/telemetry/variety-game-adapter-v51.mjs`を追加。
- `createVarietyAnswerAdapter({storage,locks,onWarning,onPersistenceStatus})`はVol.50の`initializeLockedVariety`を利用。
- ゲーム本体は回答判定が**確定した後**に`await adapter.committed({answerId,outcome,consumedTileCount})`を呼ぶ。タイル選択中やアニメーション開始時には呼ばない。
- `MISSION_CLEAR`/`TARGET_CLEAR`を記録、`MISS`は履歴対象外。入力形式を検証。Web Locksで最新データ読込→重複排除→保存。
- 保存失敗は`onPersistenceStatus(status)`で通知。ゲームの得点・残り時間・盤面遷移を変更しない。
- `src/telemetry/variety-game-adapter-v51.test.mjs`で回答種別、同一ID、MISS、保存不能時、無効イベントをテスト。
- **制限:** ゲーム本体の実際のイベント発火箇所にはまだ配線していない。20件窓から外れたIDの再送、旧コードの直接書き込みは未保証。

## 3. TRIPLE統計のUIアダプタ
`src/telemetry/triple-game-ui-adapter-v51.mjs`を追加。
- `createTripleStorageUIAdapter({runtime,onChange})`がVol.49のTRIPLE runtimeとVol.50の`tripleStorageView`を接続。
- 初期状態「統計の保存状態を確認中」、`ready`後に利用可／Web Locks非対応／破損データ等の表示モデルを`onChange(view)`へ通知。
- `await ui.commitQuestion(questionId,event)`が保存結果を受け、成功時はエラーなし、失敗時は安全な文言を画面へ通知。ゲームの継続は可能。
- `getView()`で現在の表示モデルを取得。
- `src/telemetry/triple-game-ui-adapter-v51.test.mjs`でWeb Locks不在、成功→保存失敗、破損データを検証。
- **制限:** DOMの具体的な表示箇所やゲーム本体の問題確定イベントには未接続。Web Locks未対応時に保存成功を偽装しない。TRIPLE出題補正倍率は引き続き1.0で無効。

## CI
`.github/workflows/number-rush-safety.yml`にVol.51のNodeテスト2件とPythonの区間検証テストを追加。関連ツール変更時のCIトリガーも追加。今回の追加テストのGitHub Actions上での成功は未確認。

## Vol.52の承認待ち
1. G4: 8ジョブのパイロットとして最初の1バッチのみを実測／192区間の全バッチを手動実行。
2. Variety: 実ゲームの回答確定イベントへアダプタを配線／回答IDの生成・一意性ルールを先に確定。
3. TRIPLE: 実ゲーム画面に保存ステータスを描画／問題確定イベントとUIアダプタを結合。
