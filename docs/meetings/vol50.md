# NUMBER×RUSH Vol.50｜G4パイロット再確認・Variety複数タブ排他・TRIPLE保存不可UI
日付: 2026-10-23
**すべて暫定案・正式承認前。G4全件保証は未確定。**

## 今回の決定
1. Vol.43のGitHub Actions 3ジョブパイロットの実行結果・計測ログを確認する。
2. Variety Engineの複数タブ同時更新への競合対策を追加する。
3. TRIPLE統計のWeb Locks非対応時の安全な取り扱いとUI表示を設計する。

## G4パイロットの状況
GitHub REST `GET /repos/asumax1128/number-rush/actions/runs?per_page=100`を2026-10-23に照会。実行履歴は全45件、`number-rush-vol43-pilot.yml`および`workflow_dispatch`に該当する実行は0件。最新通常Safety CI run 39906364229 はcompleted/success。
**Vol.43の3ジョブパイロットは未実行、Actions上の計測ログは存在しない。** 起動オーバーヘッド・探索時間・実行費用の実測分析は不可能。Vol.42ローカル平均2.82秒/区間と192区間単純合計約9分は参考値でありActions実測ではない。全192区間のG4保証は未証明。
実行先 https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol43-pilot.yml → Run workflow → main → Run workflow。現GitHub接続にはworkflow_dispatch実行機能がないため手動起動が必要。

## Variety Engine：複数タブ競合対策
`src/telemetry/variety-tab-lock-v50.mjs`を追加。
- `initializeLockedVariety({storage,locks,onWarning})`がWeb Locksのexclusiveロック`number-rush:variety-target-history:v2:write`内でVol.49の`initializeVarietyHistory`を実行。v1→v2移行と初期復元を保護。
- `await runtime.recordAnswer({answerId,outcome,consumedTileCount})`が同じ排他ロックの内側で**最新データの復元→ID重複確認→保存**を実行。
- `await runtime.snapshot()`もロック内で最新履歴を再読込。MISSは履歴対象外。履歴は最大20件。
- Web Locks未対応時は移行・書き込みを実行せず`lock-unavailable`で停止。破損データは上書きせず記録を拒否。
- `src/telemetry/variety-tab-lock-v50.test.mjs`で2タブ同一IDの重複排除、別IDの同時記録、移行の排他、Web Locks不在、破損データ保護をテスト。
- 制限: 協調する同一オリジンのタブ間のみ。旧コードのロックなし直接書き込み、別端末、ストレージ消去、20件より古いIDの再送は対象外。実ゲームへの配線・ブラウザ実機テストは未実施。

## TRIPLE統計：Web Locks非対応時の安全なUI
`src/telemetry/triple-storage-ui-v50.mjs`を追加。
- `tripleStorageView({ready,status})`で保存状態に応じたプレイヤー向け表示文言、severity、canRetry、canPlayを返す。
- `tripleStorageMessage(result)`は保存成功ならnull、失敗時は安全な説明を返す。
- Web Locks API非対応は`lock-unavailable`として**統計自動保存は無効・ゲームプレイは継続可**を明示。安全でないlocalStorage直接保存へフォールバックしない。
- 破損v1/v2は自動上書き・初期化しない。保存失敗・ロック失敗は保存成功と表示しない。ユーザー向けメッセージに内部エラー文字列や保存データを含めない。
- `src/telemetry/triple-storage-ui-v50.test.mjs`で非対応、破損データ、保存失敗、正常状態を検証。
- 制限: 現時点では**UI表示用の状態・文言を返すモジュール**であり実ゲームのDOM/UIには未接続。Web Locksの非対応時に統計を保存する代替手段は未導入。TRIPLE補正は引き続き無効（倍率1.0）。

## CI
`.github/workflows/number-rush-safety.yml`にVol.50の2つのNodeテストを追加。追加テストのGitHub Actions上の成功は未確認。

## Vol.51の承認待ち
1. G4: 3ジョブパイロットの実測ログを確認／192区間のバッチジョブ設計に切り替える。
2. Variety: Web Locks非対応時の表示・復旧設計／ゲーム本体の回答確定イベント接続。
3. TRIPLE: 保存状態をゲーム画面に接続するUIアダプタ／統計の保存可否を起動時に診断する仕組み。
