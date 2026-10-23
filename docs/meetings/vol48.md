# NUMBER×RUSH Vol.48｜G4パイロット再確認・Variety v1→v2移行・TRIPLE複数タブ競合
日付: 2026-10-23
**すべて暫定案。正式承認前。G4全件保証は未確定。**

## ユーザーの決定
1. Vol.43の3ジョブパイロットを手動実行した結果を確認・分析。
2. Variety Engineの直近20件TARGET一致回答履歴をv1からv2へ非破壊移行。
3. TRIPLE統計の複数タブ同時更新に対する競合対策を設計。

## G4 Actionsの状況
GitHub REST `GET /repos/asumax1128/number-rush/actions/runs?per_page=100`で2026-10-23時点の全32件を確認。Vol.43 `number-rush-vol43-pilot.yml`の実行は0件。最新の通常Safety CIは取得時点で結論未確定。
**3ジョブのActions計測は未実行。起動オーバーヘッド・探索時間・メモリ使用量のActions実測値はない。** Vol.42のローカル平均約2.82秒/243盤面、192区間の探索時間単純合計約9分は参考値でありActions実測ではない。全192区間のG4保証は未証明。
実行先 https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol43-pilot.yml → Run workflow → main → Run workflow。現GitHub接続にworkflow_dispatch操作がないため手動実行が必要。

## Variety v1→v2非破壊移行
`src/telemetry/variety-history-migrate-v48.mjs`を追加。
- v1キー`number-rush:variety-target-history:v1`を読み取り検証。v2キーがすでに存在する場合は上書きしない。
- v1の1〜6枚の直近最大20件の使用枚数履歴をv2キーに`{schemaVersion:2,kind:'variety-target-history-migrated',legacyCounts:[...],entries:[]}`として保存。
- **v1には回答IDがないため過去のIDは捏造しない。** v1原本は保持し、移行後の新規回答だけにIDを付与。
- `src/telemetry/variety-history-idempotent-v47.mjs`の読み込みを拡張し、legacyCountsを匿名ID（null）の履歴として認識。新規回答保存時には`entries:[{id:null,count},...,{id:'...',count}]`へ正規化し、20件窓を保持。
- 破損v1、既存v2、保存失敗では元データを変更しない。既存v2が破損していても移行処理は上書きしない。
- `src/telemetry/variety-history-migrate-v48.test.mjs`に旧データ保全、移行済み再実行防止、破損v1、保存失敗、移行後の新規回答・再起動・重複排除の統合テストを追加。
- 制限: v1の過去回答に対する重複防止は遡及不可。回答IDが20件窓から外れた後の再送、複数タブでのVariety履歴競合、実ゲーム本体への配線は未解決。

## TRIPLE複数タブ競合対策
`src/telemetry/triple-tab-lock-v48.mjs`を追加。
- 呼び出し側が`navigator.locks`互換のWeb Locks APIを注入。`number-rush:triple-telemetry:v2:write`をexclusive取得。
- **ロックの内側で**保存データを最新状態へrestore→問題IDの重複確認→`TriplePersistentRecorder.commit`を実行。read-modify-write全体を直列化。
- Web Locks APIがない場合は`lock-unavailable`として書き込みを行わない（fail closed）。ロック取得・コミット例外も記録失敗として返す。
- `src/telemetry/triple-tab-lock-v48.test.mjs`に模擬排他ロックで同一ID同時記録が1件だけになること、異なるIDが両方残ること、ロックなしの拒否を検証。
- 制限: Web Locksは同じブラウザの同一オリジンの協調するタブ間のみ。旧コードによる非ロック書き込み、別ブラウザ/別端末、localStorage消去、実ゲーム本体未接続は保証対象外。
- TRIPLE補正は引き続き無効（倍率1.0）。Varietyの予測分布は解法ルート等確率を暫定維持。

## CI
`.github/workflows/number-rush-safety.yml`にVol.48の2つのNodeテストを追加。今回の追加テストのGitHub Actions上での成功確認は未実施。

## Vol.49の承認待ち
1. G4: 3ジョブパイロットを実際に手動起動してログ分析／192区間のジョブ統合設計に切り替える。
2. Variety: v1→v2移行を起動時初期化へ統合／Variety履歴の複数タブ競合対策を追加。
3. TRIPLE: Web Locks方式をゲーム側の保存呼び出しに統合／Web Locks非対応時の代替方式を検討。
