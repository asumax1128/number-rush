# NUMBER×RUSH Vol.46｜G4パイロット再確認・20件ブラウザ永続化・TRIPLE v1→v2移行
日付: 2026-10-23
**すべて暫定案・正式承認前。G4全件保証は未確定。**

## 今回の決定
1. Vol.43の3ジョブGitHub Actionsパイロットの実行結果を確認し、所要時間を分析する。
2. Variety Engineの直近20件のTARGET一致回答履歴をブラウザに永続化する。
3. TRIPLE統計のv1→v2安全移行を設計する。

## GitHub Actions確認
GitHub REST `GET /repos/asumax1128/number-rush/actions/runs?per_page=50`の2026-10-23時点の結果はtotal_count=22。対象`.github/workflows/number-rush-vol43-pilot.yml`の実行は0件、すべて通常の`NUMBER RUSH Safety Verification`。最新通常CI run 39904009075 はcompleted/success。
**3ジョブパイロットは未実行であり、GitHub Actions上の実測ログ・起動オーバーヘッド・総所要時間は未取得**。Vol.42のローカル平均2.82秒/区間、192区間の探索時間単純合計約9分は参考値でありActions実測ではない。
手動起動: https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol43-pilot.yml → Run workflow → main → Run workflow。
G4全192区間の保証は未証明。今後実行ログ取得後にジョブの待機・checkout・コンパイル・探索・artifact時間を分解する。

## Variety Engine：直近20件TARGET一致回答のブラウザ永続化
`src/telemetry/variety-history-storage.mjs`を追加。
- localStorage互換のstorage adapter注入、キー`number-rush:variety-target-history:v1`、`{schemaVersion:1,counts:[1..6]}`。
- MISSION CLEAR/TARGET CLEARで実際に消費した枚数1〜6を記録、MISSは消費0枚のため記録しない。
- 直近20件のTARGET一致回答を保持。新規回答で古いものを削除。
- restoreで保存履歴を読み込み、破損データや未知形式は上書きせずstatus=corrupt。明示的resetCorruptで元文字列を返してから初期化。
- 保存失敗時は履歴を更新しない（ゲーム本体のスコアや回答判定を変更しない）。
- `src/telemetry/variety-history-storage.test.mjs`で20件窓、TARGET CLEAR/MISSION CLEAR、MISS除外、復元、破損時の保全、保存失敗を検証。
- **制限:** ブラウザのlocalStorageは恒久保証ではない。実ゲームへの接続は未実施。今回の保存モジュールはanswer_idの重複排除を持たないため、呼び出し側で回答確定イベントの重複を防ぐ必要がある。複数タブ同時更新は未対策。

## TRIPLE v1→v2安全移行
`src/telemetry/triple-migrate-v46.mjs`を追加。
- v1保存キー`number-rush:triple-telemetry:v1`を検証し、v2キー`number-rush:triple-telemetry:v2`が未存在の場合に限って新規作成。
- v1の全難易度の統計イベントをv2内のtelemetryV1として引き継ぐ。v1の保存文字列は**削除・上書きしない**。
- v1に問題IDがないため、v2のrecentQuestionIdsは空で初期化する。既存のv1履歴に遡及して重複防止を保証できない。移行後の新規問題からIDによる重複防止を適用。
- v2がすでに存在する場合は上書きしない。破損v2は明示的復旧が必要。破損v1や保存失敗時も元のv1を保護。
- `src/telemetry/triple-migrate-v46.test.mjs`で往復移行、v1保全、再実行時の上書き防止、破損データ、保存失敗を検証。
- **制限:** localStorageの複数タブ競合、v1とv2の二重書き込み、古いv1データの再移行は自動解決しない。実ゲーム本体への配線・ブラウザ実機テストは未実施。

## CI
`.github/workflows/number-rush-safety.yml`にVol.46のNodeテストを追加。今回の変更のGitHub Actions上の成功は未確認。
TRIPLE補正は引き続き無効（倍率1.0）。Varietyは安全候補限定、最悪分岐→平均分岐→等確率解法モデルの直近20件重複率。

## Vol.47の承認待ち
1. G4: Vol.43の3ジョブを手動実行してログ分析／192区間を少数ジョブに束ねる設計を優先。
2. Variety: 履歴保存に回答IDの重複防止を追加／難易度別の20件履歴に拡張。
3. TRIPLE: v1→v2移行と自動保存を単一の初期化フローに統合／複数タブ同時更新の安全性を優先。
