# NUMBER×RUSH Vol.62｜未予約末尾の全称G3・回答ID台帳統合・Chromium E2E監査
日付：2026-10-23
**全事項暫定案。正式承認前。**

## 1. G3：公開5枚＋予約6枚目を維持する全称REFRESH判定
- `src/safety/safety-refresh-universal-v62.mjs`、同テストを追加。
- 6位置・数字1〜3・NORMAL/DOUBLEの6種類に限定。公開済みNEXT TARGET/MISSIONと予約キュー先頭6枚を変更しない。
- REFRESHでk枚（1〜5）を交換すると、次の回答で最大6枚を消費するため、6枚の予約キューから残った6-k枚に加え、未予約のk枚を補う必要がある。
- 未予約k枚の全`6^k`候補（k=1:6、2:36、3:216、4:1296、5:7776）を列挙し、すべてについてVol.60の全TARGET一致回答分岐を検査。公開済みNEXT問題が全分岐でMISSION CLEAR可能な場合のみ許可。
- REFRESH後の現在G1が失われれば即不許可。反例となる未予約末尾を返す。最初の反例で早期停止するため、`tailsChecked`は不許可時には理論候補総数未満となり得る。
- `enumerateUniversalRefreshG3V62`は62のREFRESHマスクを評価する。
- **重要な限定**：今回の判定はREFRESH1回→回答1回の局所G3であり、複数回連続REFRESHの閉包性は未検証。Vol.58/59のFREE核帰還の補題を前提にしており、実ゲーム全体・REVERSE・数字4以上・時間・ストック・確率的生成の保証ではない。実ゲームの回答後の予約キュー生成タイミングが理論モデルと一致するかは別途検証が必要。

## 2. Variety：Vol.60新規回答経路とVol.61 ID台帳を統合
- `src/telemetry/variety-ledger-write-ahead-v62.mjs`、同テストを追加。
- 新しい`createLedgerWriteAheadVarietyV62`はWeb Locksの`RECOVERY_LOCK_V61`を新規回答保存と復旧処理の双方で使う。異なるロック名を持つpendingストアと履歴ストアを内部で順序立てて使用。
- 回答ID生成→pending stage→台帳`started`→履歴保存→台帳`saved`→pending ack。
- 同じanswerKeyの重複呼び出しは同一イベントを返す。表示履歴は直近20件、台帳は古いIDを自動削除しない。上限到達時は新規保存を拒否。
- `started`でクラッシュした場合、復旧時に自動再送しない（曖昧状態の隔離）。**欠落なしと重複なしの両方を満たすexactly-onceは未達**。
- テスト：保存順序、24件書込時の20件表示と24件台帳保持、履歴書込失敗後の不確定状態を検証するケースを追加。
- **重要な限定**：ゲーム本体の回答確定関数への実配線は未実施。古いVol.60経路・他タブが別APIを使用する場合の完全な排他は保証しない。複数タブで同じanswerKeyを別インスタンスに同時通知した場合の全局的重複防止は未実装。台帳の手動照合UI、容量管理は今後の課題。

## 3. TRIPLE：Chromium E2E手動実行結果の確認
- Vol.60の手動実行ワークフロー：`.github/workflows/number-rush-vol60-browser-e2e.yml`。
- GitHub連携で手動workflow_dispatch実行履歴を列挙するAPIは利用できず、Vol.61でのコミット関連run取得はPR関連に限られた。現時点で該当するrun ID、job ID、ログ、実行時間、成功/失敗の実測値は取得できていない。
- **結論：Chromium E2Eの成功・失敗・実行費用・所要時間は未確認。実行したとも成功したとも主張しない。**
- ユーザーは`https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol60-browser-e2e.yml`から手動起動し、実行URLまたはログを共有すれば詳細分析できる。起動が必要な場合はUIで`Run workflow`。
- テストコードの追加とGitHubへの保存は確認したが、CIの実行成功は未確認。

## 4. CIと保存
- `.github/workflows/number-rush-safety.yml`にVol.62のG3全称検証とID台帳統合のテストを追加。
- 本議事録を`asumax1128/number-rush`に保存。

## Vol.63候補
1. G3：連続REFRESHの安全閉包性を検証／全称判定の性能測定とキャッシュ最適化。
2. Variety：台帳`started`の照合・解除UI／実ゲームの回答確定点にVol.62統合APIを接続。
3. TRIPLE：Chromium実行URL・ログを入手して分析／再読み込み・複数タブのE2Eシナリオを追加。
