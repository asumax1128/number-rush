# NUMBER×RUSH Vol.67｜G3 Actions実測確認・IndexedDB障害注入監査・TRIPLE原子的保存の既存経路接続
日付：2026-10-23
**すべて暫定案、正式承認前。**

## 1. G3：Vol.66ベンチマークをActionsで実行・ログ分析
- `tools/benchmark-refresh-compare-v66.mjs`はVol.63/Vol.65を同条件で比較するコード。Vol.67では`.github/workflows/number-rush-vol67-validation.yml`を追加し、手動`workflow_dispatch`で実行し、`g3-vol67-results`アーティファクトにJSONを保存する。
- 現在接続済みGitHubツールにはworkflow_dispatchの起動APIがなく、GitHub Actionsのrun一覧取得APIもない。commitに紐づくPR-triggered runのみの検索では手動実行を発見できない。公開WebからのVol.66ワークフロー参照も取得できなかった。
- **よってユーザーが依頼した「Actionsで実行してログ分析」は完了していない。実測値・速度比・成功失敗は未確認。** 自動実行したと偽らない。
- 手動実行先：https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol67-validation.yml
- 実行後に`g3-vol67-results` JSONとジョブURLを共有してもらえれば、unknown率・訪問状態数・時間・速度比の比較分析が可能。
- `unknown=true`がある場合は最適化倍率を確定させない。

## 2. Variety：Vol.65障害注入Chromiumテストの確認と不具合対応
- `tools/browser-idb-fault-v65.mjs`をコードレビュー：正常保存→同一キーの矛盾更新でabort→IDBObjectStore.addへ重複キーを注入→abort→ページ再読み込み後に正常記録だけ残ることを検査。
- `.github/workflows/number-rush-vol67-validation.yml`の`chromium-faults`ジョブへ再実行設定を追加。
- **Actionsの実行ログ未取得のため、実行時の不具合の有無は未確認。原因の特定・修正は行っていない。** テストの成功やバグ修正完了を主張しない。
- 追加で検証すべき障害：IndexedDB quota、タブ強制終了、blocked upgrade、旧localStorageとの混在、テストの故障注入が全更新を確実にrollbackするか。

## 3. TRIPLE：Vol.66原子的保存を既存question-commit-v56に接続
- `src/telemetry/question-commit-v56.mjs`に任意`atomicTripleStore`を追加。指定時は既存localStorage`ui.commitQuestion`を呼ばず、`atomicTripleStore.commit({questionKey,finalized:true,...event})`を呼ぶ。返却questionIdは原子的ストアが確定した正規ID。
- `questionLedger`と`atomicTripleStore`の同時指定はTypeError。二重保存経路を防ぐ。
- `src/telemetry/triple-question-adapter-v58.mjs`の`initializeGameQuestionTelemetry`にも任意`atomicTripleStore`を追加し、ゲーム本体の確定イベントから既存アダプタを経由できるようにした。
- `src/telemetry/question-commit-atomic-v67.test.mjs`を追加。原子的ストア経路で旧保存を呼ばないこと、同じquestionKeyの再送は同一結果を返すこと、両方式の同時指定拒否、abort時の例外伝播を検証。
- **限界**：原子的ストアを実ゲーム初期化時に明示注入しなければ従来localStorage経路のまま。HUD表示は旧localStorageに依存しており、原子的ストア使用時の保存状態表示は未統合。旧データ移行・ゲーム本体への実配線・Chromiumテスト成功は未確認。Vol.66の原子的ストアは質問確定統計のみを同一トランザクションで保存し、他のゲーム状態やVariety回答履歴は含まない。

## 4. 保存ファイル
- `src/telemetry/question-commit-v56.mjs`（後方互換オプション）
- `src/telemetry/triple-question-adapter-v58.mjs`（後方互換オプション）
- `src/telemetry/question-commit-atomic-v67.test.mjs`
- `.github/workflows/number-rush-vol67-validation.yml`
- `docs/meetings/vol67.md`

## Vol.68候補
1. G3：Vol.67の手動Actions結果を取得して実測分析／ローカル実測が可能なベンチ環境を構築。
2. Variety：Chromium障害注入ログを取得して不具合を修正／障害注入の検証ケースを拡充。
3. TRIPLE：原子的ストアの保存状態をHUDへ接続／既存localStorageからの非破壊移行設計。
