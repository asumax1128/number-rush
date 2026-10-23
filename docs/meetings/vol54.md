# NUMBER×RUSH Vol.54｜ローカル実測・Variety判定確定フック・TRIPLE HUD挿入
日付: 2026-10-23
**全項目暫定案・正式承認前。G4全件保証は未確定。**

## 指定
1. G4: 小規模ローカルベンチマークを実測してActions実行前に性能評価。
2. Variety: ゲーム本体の実際の回答判定関数にイベント発火を接続。
3. TRIPLE: ゲーム画面にHUD要素を追加して表示統合。

## 1. G4ローカル実測
GitHub `tools/verify-vol41.cpp` のソースを取得し、同内容をローカルコンテナで再現。コンパイル `g++ -O3 -std=c++17 -Wall -Wextra`、Linux `/usr/bin/time`を使用。
- コンパイル実測: 0.82秒、ピークRSS 70,952 KiB。
- `verify 0 2 0 46656`: 0.38秒、ピークRSS 123,264 KiB、盤面・キュー組93,312、状態606,528、ルート5,878,656。FREE valid606,528 zero0、PAIR valid139,968 zero0、TRIPLE valid139,968 zero0、ODD valid606,528 zero320、EVEN valid279,936 zero170,240。
- `verify 0 8 0 46656`: 0.32秒、ピークRSS 123,264 KiB、盤面・キュー組373,248、状態2,939,328、ルート23,514,624。FREE valid2,939,328 zero0、PAIR valid746,496 zero0、TRIPLE valid746,496 zero47,232、ODD valid2,939,328 zero1,856、EVEN valid1,166,400 zero813,824。
- 8盤面の方が短かったのは測定ばらつきと初期化・キャッシュ影響が大きいことを示す。これらの短時間測定を比例外挿して24区間の実行時間・GitHub請求時間を断定しない。
- 既存のVol.41検証器は**共通NEXT FREEターゲット候補の反例探索**。全MISSIONを含む無限G4固定点の完全証明ではない。今回のFREE反例0は測定範囲内に限る。
- Vol.52のGitHub Actionsベンチマークは引き続き未実行。ローカル測定はGitHub Actions実測ではない。

## 2. Variety回答判定確定フック
`src/telemetry/variety-adjudication-v54.mjs`を追加。
- `connectVarietyToAdjudication({storage,locks,cryptoProvider,onWarning,onPersistenceStatus})`がVol.53の回答確定ブリッジをラップ。
- ゲーム本体は得点・盤面・結果が確定した後、`await hook.onAdjudicated({finalized:true,outcome,consumedTileCount})`を呼ぶ。未確定イベントは拒否。MISSは消費0としてIDを発行するが履歴対象外。
- 戻り値の`event`を再送時に`hook.retry(event)`へ渡し、回答IDを再発行しない。Web Locksの履歴排他制御を継承。保存失敗でもゲーム結果は変更しない。
- `src/telemetry/variety-adjudication-v54.test.mjs`で確定イベント、再試行、未確定拒否を検証。
- **制限:** リポジトリには`src/telemetry`以外のゲーム本体実装（HTML/ゲーム判定関数）が存在しないことをGitHubのディレクトリ一覧で確認。したがって実際のゲーム本体の判定関数そのものへのコード挿入はできず、**実ゲームが呼ぶための確定フックまでの実装**。本体への配線は未実施。

## 3. TRIPLE HUD要素追加
`src/telemetry/triple-hud-mount-v54.mjs`を追加。
- `mountTripleStatusInGame({hud,storage,locks,onWarning})`は既存HUDコンテナに`div[data-number-rush-triple-status]`を追加し、Vol.53の`connectTripleHUD`に接続。すでに要素があれば再利用。
- 「確認中」→「保存有効」または「保存不可」などのUI更新をDOMへ描画。aria-liveを継承。ゲーム進行を停止しない。
- `src/telemetry/triple-hud-mount-v54.test.mjs`でHUD要素追加、ロック非対応表示、要素の二重生成防止を検証。
- **制限:** このリポジトリにゲーム本体のHTML/HUDがないため、実際のHTMLファイルへの挿入はできず、既存HUDを受け取るマウント機能として実装。実ブラウザ確認は未実施。TRIPLE補正倍率は引き続き1.0。

## CI
`.github/workflows/number-rush-safety.yml`にVol.54の2つのNodeテストを追加。GitHub Actionsでの成功確認は未実施。

## Vol.55候補
1. G4: 24区間のローカル実測でジョブ時間をより正確に推定／Vol.52のGitHub Actions計測を手動起動して分析。
2. Variety: 実ゲーム本体コードを別リポジトリ・実装場所から取得し接続／回答確定フックの呼出契約を文書化。
3. TRIPLE: 実ゲームHTML/HUDへ部品を配置／統計イベントと保存状態表示の統合テストを拡充。
