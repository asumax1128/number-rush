# NUMBER×RUSH Vol.43｜Actions少数ジョブ実測準備・解法ルート等確率・TRIPLE安全保存
日付: 2026-10-23
**すべて暫定案・正式承認前。G4全件保証は未確定。**

## 今回の決定
1. 数字1〜3 NORMAL/DOUBLEのG4全件検証に先立ち、GitHub Actionsの少数ジョブで起動・コンパイル・計算のオーバーヘッドを測定する。
2. Variety Engineの使用枚数予測分布は解法ルート等確率を暫定採用する。
3. TRIPLEの実データ保存形式を安全に整備する。

## GitHub Actionsパイロット
`.github/workflows/number-rush-vol43-pilot.yml`を追加。workflow_dispatchによる**手動実行のみ**、shard=[0,95,191]の3ジョブ、ubuntu-latest、max-parallel=3、各15分上限。
各ジョブはVol.41の最適化C++検証器をコンパイルし、該当243盤面×予約46,656種類を全件検査。FREE zero=0を確認し、ログと計測値をartifactに14日間保存。
ログにはジョブ開始後の経過時間、コンパイル時間、計算時間、/usr/bin/timeによる経過秒・最大RSSを記録。**GitHub側のキュー待ち時間（runner割当まで）はジョブ内から測定できない**ため、実行後にActionsのrun/jobタイムスタンプも確認する必要がある。
現時点でGitHub接続ツールにworkflow_dispatchの実行操作がないため、**パイロットは作成したが起動していない**。実測したと主張しない。ユーザーがActions画面で手動実行した後にログを回収・分析する。
GitHub Actions標準ホストランナーは公開リポジトリで無料という公式の現行ドキュメントを参照。実際の課金条件はリポジトリ公開状態・ランナー種別・アカウント設定に依存する。
Vol.42のローカル計算時間平均2.82秒/243盤面は参考値であり、GitHub Actions上の測定値ではない。
192ジョブの全件実行は未着手。全件G4保証は未証明。

## Variety Engine
Vol.42の`tools/variety_distribution_vol42.py`を採用。各候補問題の解法ルートを等確率で選ぶ仮定から、使用枚数kの予測分布p(k)=route_count(k)/total_routesを算出。
直近20問の実選択使用枚数履歴h20(k)と掛け合わせR=sum_k p(k)h20(k)を第3タイブレークとして使う。安全候補限定→最悪分岐最大→平均最大→R最小。
**等確率は初期仮定であり実際のプレイヤー選択傾向の観測値ではない。** MISSION CLEARの解法とTARGET一致全ルートは目的に応じて区別し、定義を混同しない。Varietyの補正はSafetyのG1〜G4を変更しない。
実ゲーム本体のVariety Engineへの配線は未完了。

## TRIPLE保存形式
`src/telemetry/triple-storage.mjs`を追加。localStorage等のstorage adapterを注入する方式で、外部通信なし。
キー: `number-rush:triple-telemetry:v1`。JSON `{schemaVersion:1,kind:'number-rush-triple-telemetry',events:{EASY:[],NORMAL:[],HARD:[]}}`。
各難易度の直近100問のみ保存。イベントはavailable:boolean, selected:boolean, missionClearSolutions:0..63, targetTileCountKinds:0..6に限定。氏名、ID、日時、seed等は保存しない。復元時に件数、型、矛盾、未知フィールド、最大JSON長65,536文字を検証。未知スキーマを拒否。
`serializeTelemetry`, `deserializeTelemetry`, `saveTelemetry`, `loadTelemetry`を提供。storageが空なら新規履歴、壊れたデータならfail closed。
`src/telemetry/triple-storage.test.mjs`に往復復元、破損データ拒否、空データのテストを追加。既存のCSV/JSON/HTML出力とは分離。
**実ゲーム本体への配線とブラウザ実機テストは未実施**。ブラウザのlocalStorageは消去される可能性があり永続保証はない。補正倍率は引き続き1.0で無効。

## CI
関連ファイル変更時の`.github/workflows/number-rush-safety.yml`に保存形式テストを追加。GitHub Actionsのテスト実行成功は未確認。

## Vol.44の承認待ち
1. G4パイロット: GitHub Actionsで3ジョブを実行して計測結果を分析／CIをより少ないジョブ数にまとめてから実測。
2. Variety Engine: 等確率モデルを実ゲームに接続する設計／使用枚数履歴のMISS・TARGET CLEARの記録基準を確定。
3. TRIPLE保存: 自動保存タイミングと破損時の復旧方針を定義／CSV・HTMLダウンロードUIを先行。
