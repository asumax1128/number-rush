# NUMBER×RUSH Vol.64｜連続REFRESH実測・IndexedDB原子的保存・同一問題複数タブE2E
日付：2026-10-23
**すべて暫定案、正式承認前。**

## 1. G3：最大2回の連続REFRESHの性能・安全マスク率
- Vol.63の`createRepeatedRefreshVerifierV63`のロジックをJavaScriptで再現し、3種類の小規模サンプルを実測。測定はGitHub Actions実行環境ではなく検証用JavaScript環境。
- 条件：6位置・値1〜3・NORMAL/DOUBLE・固定予約6枚・NEXT FREE。1回上限2,000状態、2回上限500状態。全ケースが予算超過で`unknown=true`。**安全率の正確な値ではなく、証明済みマスク数の下限**。
- 実測結果（同一計測セッション、参考値）：

| 盤面 | 最大REFRESH | 時間 | 訪問状態数 | 証明済みマスク | 結果 |
|---|---:|---:|---:|---:|---|
| 全部1 | 1 | 761ms | 2000 | 56/62以上 | unknown |
| 1,2,3混合 | 1 | 1014ms | 2000 | 19/62以上 | unknown |
| EVEN要求 | 1 | 747ms | 2000 | 22/62以上 | unknown |
| 全部1 | 2 | 209ms | 500 | 0/62以上 | unknown |
| 1,2,3混合 | 2 | 230ms | 500 | 0/62以上 | unknown |
| EVEN要求 | 2 | 178ms | 500 | 0/62以上 | unknown |

- 2回の0/62は危険なマスクが62個あることを示さない。証明が探索予算内に終わらなかったため。
- 再現用`tools/benchmark-refresh-v64.mjs`を追加。5種類のサンプル×深さ1/2、`elapsedMs`、`statesChecked`、`certifiedMasks`、`unknown`、下限率をJSONで出力。**追加したベンチマーク自体のGitHub Actions実行ログは未確認**。
- 結論：深さ2をUI同期処理に直接組み込む前に、キャッシュ/候補枝刈り/ワーカー化/事前証明書を検討する必要がある。実プレイ上の許可率はまだ推定できない。

## 2. Variety Engine：IndexedDB単一トランザクション試作
- `src/telemetry/variety-indexeddb-atomic-v64.mjs`を追加。
- `answers`ストア（永続answerKey主キー）と`meta`ストア（直近20件履歴）を**同一IndexedDB readwriteトランザクション**で更新。
- 同一answerKeyの競合は直列化され、最初の書込が採用したanswerIdを2件目にも返す。同じキーでoutcome/消費枚数が食い違えばトランザクションをabortし、記録を変えない。
- 直近20件を超えてもanswersの主キーは保持される。これはVol.62 localStorage方式とは独立した**プロトタイプ**であり、移行・実ゲーム配線は未実施。
- 限界：同一answerKeyを複数の異なる実回答で誤再利用した場合の区別は上流のauthoritative ID設計に依存。DB容量、ストレージ消去、プライベートブラウジング、強制終了、IDB非対応、移行、エラーUIは今後の課題。TRIPLE問題確定ログへの統合は未実施。
- 原子的保存の根拠：IndexedDB readwriteトランザクション内で複数object storeを扱う設計。テスト実行成功は未確認。

## 3. TRIPLE統計：同一questionKeyの複数タブ競合E2E
- `tests/browser/vol64-idb-fixture.html`、`tools/browser-e2e-vol64.mjs`、手動Actions`.github/workflows/number-rush-vol64-browser-e2e.yml`を追加。
- 同じorigin/同じIndexedDBにアクセスする2タブから、同一`answerKey=shared_question_64`を同時確定する。
- 両方の結果が`saved:true`、正規answerId一致、片方だけ`duplicate:true`、履歴件数1、ページエラー0をアサート。
- **これは回答保存の同一answerKey競合テストであり、既存TRIPLE question-commit-v56の同一questionKey重複排除を修正したものではない。** 現行TRIPLE本体の同一questionKey複数タブ問題は別途解決が必要。ゲーム本体がこのリポジトリにないため本体への接続も未実施。
- Chromium/Actionsの実行成功・時間は未確認。手動実行URL：https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol64-browser-e2e.yml

## Vol.65候補
1. G3：深さ2探索のメモ化・枝刈り最適化を実装／状態を固定して正確な安全マスク率を完走測定。
2. Variety：IndexedDB原子的保存の障害注入・再起動・データ移行テスト／Vol.62 localStorageからの非破壊移行設計。
3. TRIPLE：現行question-commit-v56の同一questionKeyを跨ぐタブ競合を解消／Vol.64 Chromiumワークフローの実行結果を確認。
