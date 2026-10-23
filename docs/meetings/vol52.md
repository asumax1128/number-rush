# NUMBER×RUSH Vol.52｜先頭1バッチ性能測定・回答ID・TRIPLE DOM表示
日付: 2026-10-23
**全項目暫定案。正式承認前。G4全件保証は未確定。**

## ユーザー指定
1. G4: 8ジョブ方式の最初の1バッチを実測し、性能を確認。
2. Variety: 回答IDの生成・一意性ルールを確定（暫定）。
3. TRIPLE: 保存状態を実ゲーム画面に描画するUIを実装。

## G4: 先頭1バッチの計測準備
2026-10-23にGitHub RESTのActions runsを確認。全55件、Vol.51の8ジョブバッチの実行履歴0件。接続されたGitHub操作にはworkflow_dispatch新規起動アクションがないため、**Actions上の実測を起動できなかった**。未実行を実測済みと扱わない。
`.github/workflows/number-rush-vol52-benchmark.yml`を追加（workflow_dispatch）。先頭24区間 i=0..23、各区間盤面[243i,243(i+1))、全46,656キュー。単一ジョブ内でVol.41検証器をコンパイルし、24区間を順次検査。コンパイル時間/ピークRSS、各区間の実行時間/ピークRSS、開始/計算終了epoch、ログ、集計TSVを成果物として保存。
`tools/benchmark-vol52-report.py`を追加し、実測ログから区間数・合計/平均/最大探索秒数・最大RSS・コンパイル秒数・計算終了までの経過時間をJSON集計。実測が不完全ならstatus=partial、GitHub請求時間は測定対象外(null)。timeout 120分は暫定値。
実行先: https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol52-benchmark.yml → Run workflow → main → Run workflow。
**実行未着手、実測値なし。** Vol.41検証器の対象は限定モデルのNEXT FREE候補探索であり、全MISSION・無限G4固定点の証明ではない。

## Variety: 回答IDルール
`src/telemetry/answer-id-v52.mjs`を追加。
- ブラウザの暗号学的乱数`crypto.getRandomValues`で生成した128-bit（16バイト）のセッション識別子を32桁のhexで表す。
- セッション中単調増加する回答通番（base36）と連結し`a_<sessionHex>_<ordinalBase36>`。例 `a_00112233445566778899aabbccddeeff_1`。既存のVol.47のID正規表現（英数字、アンダースコア、ハイフン、96文字以下）に適合。
- ゲームセッションごとにfactoryを1回作成。ゲーム再スタートで通番をリセットしない。回答の判定確定時に一度だけ`makeCommittedAnswer`を呼ぶ。
- リトライ・複数保存先へ送るときは**同じ確定イベントとIDを再利用**。保存失敗時に新しいIDを発行しない。MISSにもIDを付与するがVariety履歴には保存しない。
- 暗号学的乱数が利用できない場合はID生成を拒否。乱数衝突確率は極小だが数学的に絶対ゼロではない。端末を跨ぐ全世界一意性は保証しない。
- `src/telemetry/answer-id-v52.test.mjs`で連番、セッション差、再試行でのID安定、乱数不可時拒否、不正イベントを検証。
- **制限:** このfactoryはゲーム本体の実際の判定イベントには未接続。20件窓から外れた古い回答IDの再送はVol.47履歴だけでは排除できない。

## TRIPLE: DOM表示レンダラー
`src/telemetry/triple-dom-status-v52.mjs`を追加。
- `renderTripleStorageStatus(element,view)`はVol.50/51のUI view-modelを受け、DOM要素にstrong見出しとspan本文を`textContent`で安全に描画。`innerHTML`を使わない。
- 状態は`element.dataset.tripleStorage`へ設定。role=status, aria-live=polite, aria-atomic=trueを設定。ゲームのプレイを妨げない。
- `mountTripleStorageStatus({element,ui})`は初期表示と`update(view)`を提供。ゲーム側では`createTripleStorageUIAdapter({runtime,onChange:view=>mount.update(view)})`のように接続する。onChange配線はゲーム本体側の作業。
- `src/telemetry/triple-dom-status-v52.test.mjs`で通常描画、悪意のあるHTML文字列のテキスト化、初期表示・更新をテスト。
- **制限:** DOM描画部品は実装済みだが、リポジトリに存在する実ゲーム画面のHUD/HTMLへの挿入とブラウザ実機テストは未実施。Web Locks非対応時は保存せず、UIに明示。TRIPLE出題補正は引き続き1.0で無効。

## CI
`.github/workflows/number-rush-safety.yml`にVol.52のNodeテストを追加。追加テストのGitHub Actions上の成功は未確認。

## Vol.53候補
1. G4: 先頭1バッチのActions実測ログ確認／ローカル小規模ベンチマークで先行校正。
2. Variety: 回答IDとゲーム本体の判定確定イベントを結合／直近20件を超える重複排除の方式を設計。
3. TRIPLE: HUDの具体的なDOM配置・表示切替を結合／保存可否のブラウザ実機テスト。
