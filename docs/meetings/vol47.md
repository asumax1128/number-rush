# NUMBER×RUSH Vol.47｜G4パイロット再確認・Variety回答ID・TRIPLE初期化統合
日付: 2026-10-23
**すべて暫定案。正式承認前。G4全件保証は未確定。**

## 今回の方針
1. Vol.43のGitHub Actions 3ジョブパイロットの実行結果を確認・分析する。
2. Variety Engineの直近20件TARGET一致回答履歴に回答IDによる重複防止を追加する。
3. TRIPLE統計のv1→v2移行と自動保存を単一の初期化フローに統合する。

## G4検証：GitHub Actions再確認
2026-10-23にGitHub REST `GET /repos/asumax1128/number-rush/actions/runs?per_page=100`を照会。全27件、`number-rush-vol43-pilot.yml`に該当する実行は0件。最新の通常Safety Verification run 39904815683 はcompleted/success。
したがって**3ジョブパイロットの実測ログは存在せず、Actions上の起動・コンパイル・探索・成果物アップロードの所要時間は測定できていない**。ローカル平均2.82秒/区間、全192区間の探索時間単純合計約9分はActions実測ではない。
実行先 https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol43-pilot.yml → Run workflow → main → Run workflow。
現GitHub接続にworkflow_dispatch実行機能がないためユーザーの手動実行が必要。**全192区間のG4保証は未証明。**

## Variety Engine：回答ID付き履歴
`src/telemetry/variety-history-idempotent-v47.mjs`を追加。
- 保存キー`number-rush:variety-target-history:v2`、形式`{schemaVersion:2,entries:[{id,count}]}`。
- MISSION CLEARとTARGET CLEARだけを保存。MISSはタイル消費なしで除外。
- 直近20件の回答IDと消費枚数1〜6を保持。重複IDの再送は記録しない。ブラウザ再起動後も保存済み20件のIDで重複排除。
- IDは1〜96文字の不透明な英数字/_/-文字列。ID生成はゲーム本体側の責任であり、個人情報を含めない。
- 旧v1保存データが存在しv2がない場合、勝手に消去・上書きせず`v1-needs-migration`で停止。v1にはIDがないため遡及的重複防止は不可能。
- 破損したv2は自動上書きしない。保存失敗時はメモリの履歴を変更しない。
- `src/telemetry/variety-history-idempotent-v47.test.mjs`に再起動後の重複防止、MISS除外、20件窓、旧形式保護、保存失敗を検証。
- 制限: 20件より古いIDの再送、複数タブ同時更新、ゲーム本体への未配線。Varietyの等確率予測分布とSafety優先順位は変更しない。

## TRIPLE：移行と永続保存の統一初期化
`src/telemetry/triple-init-v47.mjs`に`initializeTripleTelemetry(storage,{onWarning})`を追加。
- まずVol.46の`migrateTripleV1ToV2`を実行。v2が既存なら移行しない。v1だけがある場合は検証してv2を新規作成、v1原本は保存。
- その後Vol.45の`TriplePersistentRecorder`を復元し、今後の問題確定時は返されたrecorderの`commit(questionId,event)`だけを呼ぶ。
- v1破損・v2破損・ストレージ読み書き失敗は`ready:false`とし、勝手にデータを消去・上書きしない。
- v1には問題IDがないので移行済みの過去イベントの重複を完全には防げない。v2移行後の新しい問題IDから重複防止。
- `src/telemetry/triple-init-v47.test.mjs`で移行後の新規記録・再起動後重複排除、旧データ保護、破損v1/v2、空ストレージを検証。
- 制限: 実ゲームへの配線、複数タブ同時更新、v1移行済み履歴の過去ID復元、ブラウザ実機テストは未実施。TRIPLE補正倍率は1.0（無効）を維持。

## CI
`.github/workflows/number-rush-safety.yml`にVol.47の2つのNodeテストを追加。GitHub Actionsでの今回の追加テストの成功確認は未実施。

## Vol.48の承認待ち
1. G4: Vol.43の3ジョブを実際に手動起動して計測結果を確認／全192区間のジョブ統合設計を優先。
2. Variety: v1→v2の履歴移行を非破壊で実装／20件を超えるID再送対策を優先。
3. TRIPLE: 複数タブ同時更新への競合対策／ブラウザの保存・復旧UIを先に整備。
