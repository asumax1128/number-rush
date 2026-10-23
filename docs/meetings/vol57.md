# NUMBER×RUSH Vol.57｜残り168区間の全件探索・Variety安全再送・TRIPLE問題確定点
日付: 2026-10-23
**全方針は暫定案・正式承認前。**

## 指定
1. G4検証：ローカルで残り168区間を分割検証し、全192区間を集約。
2. Variety Engine：保存失敗イベントの安全な再送キューを実装。
3. TRIPLE統計：ゲーム本体の問題確定点との接続仕様を具体化。

## 1. G4検証結果
**ローカル全192区間の探索が完了（Vol.55先頭24区間＋Vol.57残り168区間）。**
- 今回の残り168区間はすべて正常終了。40,824盤面、1,904,684,544盤面×キュー組、31,385,304,576 TARGET状態、119,995,126,272 TARGET一致ルート。FREE zero=0。
- 今回の実行時間501.5693秒、区間平均2.9854秒、最大RSS123,264KiB。
- Vol.55と集約した全192区間：46,656盤面、**2,176,782,336盤面×キュー組**、**35,474,889,600 TARGET状態**、**137,137,287,168 TARGET一致ルート**、**NEXT FREE候補なし0件**。
- 結果を`docs/reports/vol57-full-local-coverage.md`に保存。区間別24件×7バッチの所要時間とMISSION別補足を収録。
- 数学的解釈：限定されたVol.41モデルの**共通NEXT FREE候補存在**の全件探索であり、無限G4固定点、全MISSION・全特殊タイル・REFRESH・本番キュー生成の保証ではない。
- GitHub Actions全192区間の手動実行は未実施。今回の完了は**ローカル検証**。

## 2. Variety Engine：安全な再送キュー
`src/telemetry/variety-retry-queue-v57.mjs`を追加。
- `createVarietyRetryQueue({retry,maxPending=128,onWarning})`：Vol.56から渡された**元の凍結済み確定イベントとanswerId**を最大128件保持。
- 同一IDの重複登録は抑止、同一IDで異なるoutcome/使用枚数なら衝突として拒否。MISSはキューに入れない。
- `drain()`は明示的に呼ぶ。複数同時呼び出しは同一Promiseで共有。保存成功（`saved===true`）のときだけ削除し、失敗・例外はキューに残す。再送で新IDを発行しない。
- `createVarietyRetryCoordinator({committer,...})`はVol.56ゲートの`commit`と`retry`をつなぎ、保存失敗したCLEARイベントをキューへ登録。
- 永続ストレージに未保存イベントを無防備に書かない。Web Locks非対応時は再送しても安全に保存できないため、そのまま保持。自動無限再試行はしない。
- 制限：**メモリ内限定**、ページ再読み込みで消失、満杯なら新規追加拒否、再起動後のexactly-once保証なし。再送キューを永続化する場合は安全な別設計が必要。
- `src/telemetry/variety-retry-queue-v57.test.mjs`：再送ID不変、重複、上限、競合drain、失敗保持、MISS拒否、コーディネータ接続を検証。

## 3. TRIPLE統計：問題確定点との接続仕様
`docs/integration-question-commit-vol57.md`を追加。
- Safety Engineの安全候補確認→Variety Engineの問題選択→ゲーム本体のTARGET・MISSION・盤面・公開NEXT5枚・内部予約6枚目の確定→`createQuestionCommitter().commit`という**唯一の問題確定点**を定義。
- 必須イベント項目：`questionKey`、`finalized:true`、`difficulty`、`safeMissions`、`selectedMission`、`missionClearSolutions`、`targetTileCountKinds`。
- 問題キーはゲーム本体が一度発行し、同一問題の重複通知には同じキーを使う。TRIPLE保存の失敗でゲーム状態を変更しない。
- 二重発火防止はVol.56のメモリゲート（最大512件）による。再起動後のキー→ID対応の永続性は未解決。
- **実ゲーム本体のHTML・生成関数がこのリポジトリに存在しないため、実本体への配線は未実施。**

## 4. CI・保存
`.github/workflows/number-rush-safety.yml`にVol.57再送キューのNodeテストを追加。GitHub Actions上の実行履歴の確認は議事録作成時点では限定的。追加したコードはユーザーの正式承認前。
全件検証の集約報告は`docs/reports/vol57-full-local-coverage.md`に保存。

## Vol.58候補
1. G4：限定モデルの全件結果から**無限G4固定点を別途構成・検証**／GitHub Actionsで全192区間の再現実行。
2. Variety：メモリ内再送キューの保存・復旧設計／再送失敗時のHUD通知と手動再試行UI。
3. TRIPLE：問題確定イベントのゲーム本体統合用アダプタ実装／問題キーと問題IDの再起動後継続性設計。
