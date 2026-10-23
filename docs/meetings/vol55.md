# NUMBER×RUSH Vol.55｜24区間ローカル実測・Variety接続契約・TRIPLE統合テスト
日付: 2026-10-23
**すべて暫定案。正式承認前。ゲーム全体のG4は未証明。**

## 指定事項
1. G4：ローカルで24区間を実測し、8ジョブ方式の性能を再評価。
2. Variety Engine：ゲーム本体の回答判定関数との接続契約を文書化。
3. TRIPLE統計：保存イベントとHUD表示の統合テストを拡充。

## 1. G4実測完了
`tools/verify-vol41.cpp`のGitHub版と同内容をローカルでコンパイルし、盤面0..5831を24区間に分割、各区間全46,656キューを実行。全24区間正常終了。
- 合計74.140秒、平均3.089秒、中央値3.051秒、最短2.726秒、最長3.8726秒。
- 最大RSS 123,264KiB（約120.4MiB）。
- 盤面×キュー272,097,792組、TARGET状態4,089,585,024件、TARGET一致ルート17,142,160,896件。
- 共通NEXT FREEターゲットの反例0件（検査した24区間）。
- コンパイル0.52秒、ピークRSS 70,952KiB。
- 192区間を単純外挿したCPU計算時間は約593秒（約9.9分）。GitHub Actionsの起動・アップロード・課金や並列競合を含まないため予測値。8ジョブ方式は暫定維持し、実Actions計測で再評価する。
- Vol.52 GitHub Actions先頭バッチの実行履歴は未確認（Vol.55時点の照会では0件）。
- 詳細: `docs/reports/vol55-local-benchmark.md`。
- **限定モデルのFREE反例探索であり、全MISSION・無限G4固定点の証明ではない。**

## 2. Variety Engine接続契約
`docs/integration-contract-vol55.md`を作成。
- 初期化時に`connectVarietyToAdjudication`を1回生成。
- ゲーム本体がTARGET判定、MISSION分類、得点、時間、タイル消費・補充、次問の確定を行った**後**、`onAdjudicated({finalized:true,outcome,consumedTileCount})`を回答ごとに一度だけ呼ぶ。
- `MISSION_CLEAR`、`TARGET_CLEAR`、`MISS`の厳密な値と使用枚数の範囲を規定。
- 元の確定イベントを保持して`retry(event)`に渡す。再送時に新IDを発行しない。回答確定イベントの二重発火はゲーム本体が抑制。
- 保存不能でもゲームのスコア・時間・盤面・勝敗に影響させない。Web Locks非対応なら保存しない。
- **現リポジトリにゲーム本体のHTML・判定関数が存在しないため、実本体への直接配線は未実施。**

## 3. TRIPLE保存イベントとHUD表示の統合テスト
`src/telemetry/triple-hud-integration-v55.test.mjs`を追加。既存の`mountTripleStatusInGame`から`initializeTripleRuntime`、`commitTripleWithLock`、`TriplePersistentRecorder`、HUDのDOM表示まで実際のモジュールを通してテスト。
- 正常時: HUD pending→ok、問題確定の初回保存成功、同一questionIdの再送は記録せず、HUD正常。
- 複数タブ相当: 共通storageとlockで同一questionIdを並列コミットし1件のみ記録。
- Web Locks非対応: 保存なし、HUD unavailable、プレイ継続可。
- v2破損データ: 保存拒否、元データを上書きせず、HUD警告。
- 保存書き込み失敗: 保存成功と誤表示せず、HUD警告、プレイ継続可。
- `.github/workflows/number-rush-safety.yml`にVol.55のNodeテストを追加。
- **制限:** Nodeの疑似DOM・疑似ロックによる統合テスト。実ゲームHTMLやブラウザ実機テストではない。GitHub Actions上の成功は未確認。TRIPLE出題補正倍率は引き続き1.0。

## Vol.56候補
1. G4: 全192区間のActions実測／ローカルの残り168区間を分割して全件探索。
2. Variety: 本体のイベント配線に備え、二重発火防止ゲートを実装／未保存イベント再送設計。
3. TRIPLE: 実ブラウザWeb LocksとlocalStorageの動作確認／questionId生成と問題確定イベントの結合。
