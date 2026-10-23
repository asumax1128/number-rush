# NUMBER×RUSH Vol.63｜連続REFRESH安全閉包・started照合設計・Chromium複数タブE2E
日付：2026-10-23
**すべて暫定案、正式承認前。**

## 1. G3：回答前にREFRESHを連続使用した場合の安全閉包性
- `src/safety/safety-refresh-repeat-v63.mjs`と`src/safety/safety-refresh-repeat-v63.test.mjs`を追加。
- 6位置・数字1〜3・NORMAL/DOUBLE・予約キュー6枚固定の限定モデル。REFRESHは1〜5枚、62通り。
- 安全状態の条件：その時点でREFRESHをやめて回答しても、現在G1と公開済みNEXTの全回答分岐G2が成立すること。
- REFRESHでk枚消費した場合、既予約6枚からk枚を補充。新たに必要な未予約k枚は`6^k`通りを全称列挙して次の予約キューを構成し、再帰的に安全性を検査する。
- 最大2回の連続REFRESHを対象に、各操作の全未予約生成分岐を確認できたマスクだけ`certifiedMasks`に返す。キャッシュを使用。探索上限`maxStates`に達した場合は`unknown`とし、証明できなかったマスクを許可しない。
- **注意：** この実装は最大2回の連続REFRESHについての局所閉包検証器であり、全状態の全件G3/G4証明を完了したものではない。REFRESH回数を制限しない場合の閉包性、実ゲームのストック/タイマー/生成タイミング、数字4以上、REVERSEなどは対象外。特に未予約タイルをゲーム本体が後から生成する際に予約済み6枚が変わらないことが前提。
- CIへテストを追加したが、CI成功は未確認。

## 2. Variety：started不確定状態の照合・解除設計
- `docs/design/vol63-started-reconciliation.md`に安全設計を保存。
- 20件の表示履歴だけではstartedイベントが保存済みか否かを証明できない。単なる時間経過やユーザー操作で「未保存」とみなして再送しない。
- 全処理をVol.61の共通Web Locksロックで直列化。startedは`unresolved`として隔離し、監査可能な永続コミット証拠がある場合だけ照合する。
- localStorage複数キー更新は原子的でないため、IndexedDBの単一readwriteトランザクションに回答イベント・ID台帳・表示履歴を統合する案を優先検討。証拠が不十分なら保留、無証拠の解除・破棄UIは設けない。
- 故障注入、複数タブ、20件超、再起動、データ移行/ロールバックの検証が必要。
- **照合・解除機能そのものは未実装**。exactly-once保証は未達。

## 3. TRIPLE：Chromium再読み込み・複数タブE2Eの拡充
- `tools/browser-e2e-vol63.mjs`を追加。既存`tests/browser/vol60-fixture.html`を使い、Playwright Chromium上で以下を確認するテスト。
  - 問題確定→統計保存
  - 同一ブラウザコンテキストでページ再読み込み後もlocalStorageキーが残る
  - 同一コンテキスト内の2タブから、**別々のquestionKey**で同時確定した場合に保存が成功し、異なるquestionIdを得る
  - ページJavaScript例外が発生しない
- `.github/workflows/number-rush-vol63-browser-e2e.yml`に手動実行ワークフローを追加。
- **制限：** テストは模擬ゲームfixtureであり本体ではない。同じquestionKeyを2タブで確定する場合の重複防止、ブラウザプロセス強制終了、Web Locks非対応、保存破損のE2Eは未検証。GitHub Actionsでの実行成功・実行時間は未確認。
- 手動実行：https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol63-browser-e2e.yml

## Vol.64候補
1. G3：最大2回の連続REFRESHの実測性能・安全マスク率を測定／最大回数を超える場合の固定点安全核を設計。
2. Variety：IndexedDBの単一トランザクションによる回答保存プロトタイプ／started隔離の読み取り専用HUD。
3. TRIPLE：Chromium E2Eの実行ログを取得して分析／同一questionKeyの複数タブ競合テストを追加。
