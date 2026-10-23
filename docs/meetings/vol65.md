# NUMBER×RUSH Vol.65｜連続REFRESH最適化・IndexedDB障害注入・TRIPLE同一問題タブ競合
日付：2026-10-23
**すべて暫定案・正式承認前。**

## 1. G3：深さ2の連続REFRESH探索を最適化
- `src/safety/safety-refresh-optimized-v65.mjs`を追加。
- Vol.63の安全性定義を保持：現在G1＋公開済みNEXTの全TARGET一致回答G2（STOP安全）を各段階で検査し、REFRESH後に生成し得る未予約末尾の全候補を全称検査。
- 対象モデル：数字1〜3、NORMAL/DOUBLE、盤面6位置、予約キュー6枚、REFRESH1〜5枚、最大2回。
- メモ化を3層に分離：(a) 盤面＋MISSIONの達成TARGET集合、(b) 盤面＋予約キューのSTOP安全性、(c) 盤面＋予約キュー＋残りREFRESH回数の安全性。
- 63の非空TARGET選択ルートを毎回作り直さないためSTOP安全性をキャッシュし、REFRESH後に現在MISSIONを満たさない盤面をG1で早期除外。マスクの消費位置は事前計算。
- 状態探索上限に達したら`unknown`とし、その分岐は証明済みに入れない。結果には`certifiedMasks`、証明済み率の下限、キャッシュヒット数、状態数を含む。
- `src/safety/safety-refresh-optimized-v65.test.mjs`でVol.63オラクルと深さ0・1の結果を比較し、深さ2の上限不足を安全と誤認しない回帰テストを追加。
- **限界**：深さ2の全盤面の完走や正確な安全マスク率の測定は未実施。性能改善倍率の実測も未確認。未知の分岐がある場合は不許可の保守的判定。G4の全ゲーム保証ではない。

## 2. Variety：IndexedDB原子的保存の障害注入・再起動
- `tools/browser-idb-fault-v65.mjs`を追加（Playwright Chromium）。
- Vol.64 `createAtomicVarietyStoreV64`を使い、(a) 正常保存、(b) 同一answerKeyで異なるoutcome/枚数を送信した場合のabort、(c) `IDBObjectStore.add`へ既存キー重複を注入した場合のConstraintError→トランザクションabort、(d) 再読み込み後の履歴と元回答保持、失敗回答不存在をアサート。
- answersとmetaが同一readwriteトランザクションに含まれるため、abortで両方ロールバックされる設計。IndexedDBのトランザクション原子性の仕様に基づく。
- **限界**：実ブラウザテストの実行成功は未確認。強制OSクラッシュ、容量超過、ストレージ削除、IndexedDB非対応、旧localStorageからの移行は未検証。

## 3. TRIPLE：既存question-commit-v56の跨タブ同一questionKey対策
- `src/telemetry/triple-question-ledger-v65.mjs`を追加。IndexedDB`questions`ストアの`questionKey`主キーにより、同一キーの同時予約を原子的に重複排除する。
- 保存するのは`questionKey`、正規`questionId`、確定問題のfingerprint。fingerprint不一致ならトランザクションをabort。
- `src/telemetry/question-commit-v56.mjs`の`createQuestionCommitter`に**任意**の`questionLedger`引数を追加し、指定時は予約済みquestionIdを使用。別タブですでに予約されていた場合、二重送信を防ぐため`duplicate-reservation-unverified`を返して再記録しない。
- `src/telemetry/triple-question-adapter-v58.mjs`にも任意の`questionLedger`引数を通す。未指定時は旧処理を維持する。
- `tools/browser-question-key-v65.mjs`でChromium 2タブ同一questionKey同時予約→正規ID一致、片方のみ新規、異なるfingerprintの拒否をアサート。
- `.github/workflows/number-rush-vol65-browser-e2e.yml`を追加し、障害注入と同一キー競合の2テストを手動実行可能にする。
- **重要な制約**：予約レコードと既存TRIPLE統計の保存は別トランザクション。予約後にクラッシュすると統計は未保存のまま`duplicate-reservation-unverified`で隔離される可能性がある。二重計上防止を優先した設計であり、欠落なしのexactly-once保証ではない。旧経路から新経路への自動切替はしていない。実ゲーム側の呼び出しで`questionLedger`を明示的に注入する必要がある。
- ブラウザテストの成功・実行時間は未確認。手動実行URL：https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol65-browser-e2e.yml

## 4. 保存ファイル
- `src/safety/safety-refresh-optimized-v65.mjs`
- `src/safety/safety-refresh-optimized-v65.test.mjs`
- `tools/browser-idb-fault-v65.mjs`
- `src/telemetry/triple-question-ledger-v65.mjs`
- `src/telemetry/question-commit-v56.mjs`（後方互換の任意注入）
- `src/telemetry/triple-question-adapter-v58.mjs`（後方互換の任意注入）
- `tools/browser-question-key-v65.mjs`
- `.github/workflows/number-rush-vol65-browser-e2e.yml`
- `.github/workflows/number-rush-safety.yml`
- `docs/meetings/vol65.md`

## Vol.66候補
1. G3：最適化前後の同条件ベンチマークを実測／深さ2の代表状態で探索完走率を測定。
2. Variety：IndexedDB障害注入Chromium実行結果を確認／旧localStorageの非破壊移行設計。
3. TRIPLE：問題ID予約と統計保存を同一IndexedDBトランザクションへ統合／実ゲームの初期化経路で任意ledgerを有効化。
