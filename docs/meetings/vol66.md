# NUMBER×RUSH Vol.66｜G3同条件ベンチマーク・IndexedDB障害注入結果確認・TRIPLE原子的保存
日付：2026-10-23
**すべて暫定案、正式承認前。**

## 1. G3：Vol.63 vs Vol.65同条件実測比較
- `tools/benchmark-refresh-compare-v66.mjs`を追加。両検証器に**同一盤面、同一予約6枚、同一TARGET/MISSION/NEXT、同一深さ、同一maxStates**を与え、`performance.now()`で測る。4代表盤面×深さ1/2、繰返し2回（環境変数で調整可能）。
- 記録：実行時間、訪問状態数、unknown、証明済みマスク数、証明済み率の下限、キャッシュヒット数。
- **重要：** 片方でもunknownの場合、探索順序や打ち切りの影響で比較が偏るため、確定的な高速化倍率`speedupIfComplete`はnullにする。
- `.github/workflows/number-rush-vol66-validation.yml`に手動実行ジョブを追加し、`g3-v66.json`をartifact保存。
- **実測結果は未取得**。現環境ではGitHubコードのローカル取得に失敗し、GitHub Actionsのワークフロー実行・ログ参照も確認できなかったため、速度改善の数値を作らない。ベンチマークをGitHubへ実装・保存した段階であり、「実測比較が完了した」とは扱わない。

## 2. Variety Engine：Vol.65 IndexedDB障害注入Chromiumテストの実行結果
- 既存`tools/browser-idb-fault-v65.mjs`をレビューし、正常保存、同一answerKeyの矛盾によるabort、`IDBObjectStore.add`の重複キー故障注入、再読み込み後の履歴・元記録保持を確認するテスト設計を継続採用。
- Vol.66手動ワークフローの`chromium-triple`ジョブで再実行するように設定。
- **実行ログを取得できず、成功・失敗・所要時間は未確認**。現時点では設計レビューおよび再実行設定の追加まで。結果が出たらログ、exit code、各アサーション、ブラウザバージョンを確認する。
- OS強制終了、ストレージ容量不足、旧localStorage移行は対象外。

## 3. TRIPLE：問題ID予約と統計を単一IndexedDBトランザクションへ統合
- `src/telemetry/triple-atomic-store-v66.mjs`を追加。専用DB内の`questions`と`meta`を**同じreadwriteトランザクション**で更新。
- 1つの`commit`で、正規questionId生成、questionKey主キーの永続登録、MISSION・難易度・解法数・使用枚数種類数の統計、直近100問履歴を確定。
- 同じquestionKey・同じfingerprintの複数タブ同時書込は、正規IDを共有して1件のみ記録。fingerprintが異なる場合はabort。ID発行やトランザクション失敗時に片方だけ保存することはない。
- `tests/browser/vol66-triple-atomic-fixture.html`、`tools/browser-triple-atomic-v66.mjs`で2タブ同時書込、重複排除、履歴1件、再読み込み後の永続化、矛盾書込拒否をアサート。
- **注意：** これは新規独立プロトタイプで、現行`question-commit-v56`/旧localStorage TRIPLE保存を自動で置き換えない。現行ゲーム本体の接続、旧データ移行、障害注入によるトランザクションabort検証は別工程。exactly-onceは同じDBの同じquestionKeyに対するトランザクション内の重複排除に限られ、端末間・データ削除後の保証ではない。
- Chromiumテスト実行結果は未確認。

## 保存したファイル
- `tools/benchmark-refresh-compare-v66.mjs`
- `src/telemetry/triple-atomic-store-v66.mjs`
- `tests/browser/vol66-triple-atomic-fixture.html`
- `tools/browser-triple-atomic-v66.mjs`
- `.github/workflows/number-rush-vol66-validation.yml`
- `docs/meetings/vol66.md`

## Vol.67検討候補
1. G3：Vol.66のActionsベンチマークを実行しログ分析／完走可能な代表状態で正確な安全マスク率を測定。
2. Variety：Vol.65障害注入Chromiumの実行ログを取得・修正／Vol.66原子的ストアの故障注入を拡充。
3. TRIPLE：Vol.66原子的ストアを現行question-commit-v56に接続／既存v1-v2統計の非破壊移行を設計。
