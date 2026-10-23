# NUMBER×RUSH Vol.59｜MISSIONからFREE核への帰還・永続pendingストア・模擬ゲームE2E
日付: 2026-10-23
**全事項暫定案・正式承認前。**

## 1. G4：PAIR/TRIPLE/ODD/EVENからFREE安全核への帰還
`docs/proofs/vol59-mission-return-to-free.md`に形式化。
- Vol.57の全件補題`C_FREE(b,q,t)≠∅`は現MISSIONに依存しない。
- `t∈H_m(b)`（G1）を満たす任意の現MISSION `m∈{PAIR,TRIPLE,ODD,EVEN}`は、全TARGET一致回答分岐を含めて、共通NEXT FREEを公開すれば1手後に`K_FREE`へ帰還できる。
- その後はVol.58のFREE核閉包性により、限定モデルで無限継続可能。
- **限界:** 任意のNEXT非FREE MISSIONの安全性やREFRESHのG3は証明していない。6位置モデルの全件検証はVol.57の実測結果を利用し、今回再実行していない。

## 2. Variety：write-ahead永続pendingストアの最小実装
`src/telemetry/variety-pending-store-v59.mjs`を追加。
- `createDurableVarietyPendingStore({storage,locks,maxPending=128,onWarning})`。
- `stage(originalEvent)`：履歴保存より前にCLEAR確定イベントの`answerId,outcome,consumedTileCount`をlocalStorageに永続保存。Web Locks専用ロックで複数タブを直列化。
- `list()`：スキーマ検証済みpendingを復元。`recover(retry)`：元のanswerIdで再送、`saved===true`を確認した場合だけ`acknowledge(answerId)`で削除。
- 上限128件、破損JSON・ID衝突・未知スキーマ・容量不足・Web Locks非対応はfail-closed。古いデータを勝手に破棄しない。
- `src/telemetry/variety-pending-store-v59.test.mjs`：再起動復元、再送失敗保持、ロック非対応、破損保護、複数タブ、満杯をテスト。
- **未完成:** Vol.56の現行commitはID発行と履歴保存が一体なので、実ゲームで必ず`stage→履歴保存`の順になる接続は未実装。現在の`recover`は同時タブ間の重複再送を完全には排除しない（履歴v2の直近20件ID冪等性に依存）。古いIDが履歴から消えた場合のexactly-onceは保証しない。メモリキューVol.57を置き換えたわけではない。

## 3. TRIPLE：模擬ゲームE2E統合テスト
`src/telemetry/game-simulation-e2e-v59.test.mjs`を追加。
- ゲーム状態（盤面・TARGET・MISSION・予約6枚）を模した確定イベント→Vol.58アダプタ→Vol.56問題ID発行→実TRIPLE保存→HUD表示までを通す。
- 同じquestionKeyの二重通知でID再発行なし、保存不能でもゲーム状態を変更しない。
- pendingストアのstage後クラッシュを模した新インスタンス復旧もテスト。
- **制限:** Nodeの疑似DOM・疑似Web Locks。実ゲームHTMLやブラウザ実機E2Eではない。

## 4. CIと保存
`.github/workflows/number-rush-safety.yml`にVol.59の2テストファイルを追加。GitHub Actions上の新テスト成功は未確認。新規ソースと議事録は`asumax1128/number-rush`に保存。

## Vol.60の選択肢
1. G4：非FREE MISSIONを安全に連続出題する判定アルゴリズムを実装／REFRESHのG3検証へ。
2. Variety：回答ID発行→pending stage→履歴保存→ackの実際のwrite-ahead接続を実装／複数タブ同時recoverの冪等性を強化。
3. TRIPLE：実ブラウザE2Eのテストハーネス構築／ゲーム本体コードの所在確認と実配線。
