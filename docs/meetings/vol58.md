# NUMBER×RUSH Vol.58｜無限G4固定点・Variety永続再送設計・TRIPLE問題確定アダプタ
日付: 2026-10-23
**すべて暫定案・正式承認前。**

## 指定事項
1. Vol.57の全192区間結果を踏まえ、無限G4固定点の構成・検証。
2. Variety未保存イベントの安全な永続化・復旧方式を設計。
3. TRIPLE統計のゲーム本体問題確定イベント用統合アダプタを実装。

## 1. G4：FREE安全核の構成的証明
`docs/proofs/vol58-free-core-fixed-point.md`に定理・証明・前提・範囲を記録。
- 状態`(board, reservedQueue6, target, FREE)`のうち現ボードでTARGETを作れるすべてを`K_FREE`とする。
- Vol.57の全件検証結果は、全状態で、**すべてのTARGET一致回答分岐に共通するNEXT FREE TARGET**が少なくとも1つ存在するという補題。
- この共通NEXT TARGETを回答前に公開し、どの回答でも補充後のボードでTARGETを作れる。回答後の次キューが同じ6種類のどの値でも`K_FREE`に含まれる。よって`K_FREE⊆Pre(K_FREE)`、帰納法により**限定モデルのFREE核は無限ターン閉じている**。
- 独立の小規模検算として`tools/fixedpoint_mini_vol58.py`を作成。4位置、4種類（1〜2 NORMAL/DOUBLE）、256×256のボード・キュー、468,992 FREE状態、共通NEXT FREE候補なし0件。ローカル実行で確認。
- **限定事項:** この構成はVol.57の全件補題を前提にした数学的証明であり、別の6位置独立全件検証を再実行したものではない。全MISSION、REFRESH、REVERSE、実ゲームの全仕様の無限G4は未証明。BONUS等も別途検証が必要。

## 2. Variety：永続pendingストアと復旧方式の設計
`docs/variety-pending-recovery-design-vol58.md`を作成。
- v2履歴とは別名前空間のpending v1ストア、Web Locksによる排他、同じanswerIdで再送、保存成功後だけ削除。
- 書込前クラッシュ、履歴保存後pending削除前クラッシュ、破損・QuotaExceeded・未知スキーマ・複数タブ・128件上限などの失敗窓を列挙。
- 現行Vol.56のcommit APIでは、ID発行後すぐに履歴保存するため、完全なwrite-ahead永続化にはID発行と履歴保存の境界をリファクタリングする必要がある。
- **今回は設計のみ**。Vol.57のメモリ再送キューは残り、リロード後の復旧はまだ実装されていない。

## 3. TRIPLE：問題確定イベントの統合アダプタ
`src/telemetry/triple-question-adapter-v58.mjs`を追加。
- `createGameQuestionTelemetryAdapter({committer,onWarning})`は、ゲーム本体が安全認定済み・盤面確定・TARGET確定・MISSION確定・公開5枚＋予約6枚目確定を宣言したイベントだけをVol.56の`question-commit`へ渡す。
- `initializeGameQuestionTelemetry({hud,storage,locks,cryptoProvider,onWarning})`は実ゲームから呼ぶ初期化入口。HUDとTRIPLE永続保存機能を接続。
- 未確定イベント、公開キュー不足、予約6枚目不足を拒否。保存失敗は警告し、ゲームの盤面・点数・時間を変更しない。
- `src/telemetry/triple-question-adapter-v58.test.mjs`に正常確定、早期発火拒否、保存失敗隔離のテストを追加。
- **制限:** このリポジトリにゲーム本体HTML/問題生成関数が存在しないため、ゲーム本体の確定イベントへの実配線は未実施。アダプタのフラグはゲーム本体からの申告であり、アダプタ自身がG4を再証明するものではない。

## 4. CI・保存
`.github/workflows/number-rush-safety.yml`にVol.58の小規模固定点検算とTRIPLEアダプタテストを追加。GitHub Actionsの成功は作成時点では未確認。

## Vol.59候補
1. G4：FREE核に安全に帰還できるPAIR/TRIPLE/ODD/EVENチャレンジ状態を形式化／BONUSをFREE核に加える。
2. Variety：write-ahead型の永続pendingストアの最小実装／失敗窓テストを先に構築。
3. TRIPLE：ゲーム本体との結合を模したE2Eテスト／実ゲームのHTMLと生成関数の所在を確認して接続。
