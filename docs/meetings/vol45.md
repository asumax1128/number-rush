# NUMBER×RUSH Vol.45｜Actionsパイロット再確認・TARGET一致20件履歴・再起動後重複防止
日付: 2026-10-23
**すべて暫定案・正式承認前。G4全件保証は未確定。**

## ユーザーの決定
1. Vol.43の3ジョブGitHub Actionsパイロットの実行結果を再確認し、計測ログを分析する。
2. Variety Engineの使用枚数履歴は直近20件のTARGET一致回答を暫定採用する。
3. TRIPLE統計は再起動後の重複記録を防ぐ識別子を設計する。

## GitHub Actions実行履歴の再確認
2026-10-23時点、GitHub REST `GET /repos/asumax1128/number-rush/actions/runs`で19件を確認。すべて`NUMBER RUSH Safety Verification`のpushイベントであり、Vol.43の`number-rush-vol43-pilot.yml`のworkflow_dispatch実行は**0件**。
通常CI run 39903522091 はcompleted/success（https://github.com/asumax1128/number-rush/actions/runs/39903522091）。これはパイロットではない。
よって**Vol.43の3ジョブ計測ログは存在せず、GitHub Actions上の起動・コンパイル・実行オーバーヘッドの実測分析はできなかった**。数値を推測して実測と偽らない。
Vol.42のローカル参考値は243盤面×予約全46,656通りが平均2.82秒。192区間の純粋な探索時間単純合計約9分。Actions runner準備・checkout・compile・artifact等は別。
手動実行先: https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol43-pilot.yml
GitHub接続で新規workflow_dispatch操作が利用できないため、手動実行が必要。パイロット実行後、run/jobのcreated_at/started_at/completed_atとログ中のcompile_seconds/compute_secondsを突き合わせる。3ジョブがすべて成功した場合も全192区間のG4証明とは異なる。

## Variety Engine履歴の暫定定義
Vol.44の`tools/outcome_history_vol44.py`を採用。
- 履歴は直近20件の**TARGET一致かつ盤面を進めた回答**の実使用枚数。
- MISSION CLEARを記録、TARGET CLEARも記録。MISSはタイルを消費しないため記録しない。
- 20件の窓は「直近20出題」ではなく「直近20件のTARGET一致回答」。この差を明記する。
- 同一回答イベントはanswer_idで重複排除。Vol.44のPythonコードはプロセス内の重複防止のみであり永続保存は別課題。
- Variety候補はSafety合格後、最悪値→平均値→解法ルート等確率仮定による予測分布と履歴の期待重複率の順に比較。
- 等確率モデルは実プレイでの解法選択頻度を意味しない。

## TRIPLE再起動後の重複防止
`src/telemetry/triple-idempotent.mjs`を追加。
- 形式v2、キー`number-rush:triple-telemetry:v2`。保存データ: schemaVersion=2, kind, recentQuestionIds, telemetryV1（v1イベントJSONの文字列）。
- IDはゲーム側で生成する不透明なセッションnonce＋単調増加する問題連番。氏名・アカウントID・時刻は含めない。ID長1〜96文字、英数字・_・-のみ。**ID生成自体はゲーム本体未実装のため、呼び出し側の責任**。
- 直近300件のIDを保持。保存済みIDの再入力は記録しない。
- 既存統計を複製→候補イベント記録→IDを追加→単一のstorage.setItemでイベントとIDを同時保存。書き込み失敗時はメモリのイベントとIDを更新せず、安全に再試行できる。
- 破損・未知v2形式は元データを保存したまま拒否し、ユーザー承認による明示的初期化時にのみ上書き。初期化前の生データを戻り値として返す。
- v1の自動移行は未実装。移行時の重複ID情報はv1に存在しないので、既存データの取り込みには慎重な移行設計が必要。
- 制限: 300件より古いIDの再入力、複数タブからの同時書き込み、ブラウザストレージの消去やデバイス間同期に対する厳密な保証はない。
- `src/telemetry/triple-idempotent.test.mjs`に再起動後の重複排除、保存失敗後の再試行、破損データ保護、不正ID拒否のテストを追加。
- 実ゲームへの配線は未実施。TRIPLE補正倍率は引き続き1.0で無効。

## CI
`.github/workflows/number-rush-safety.yml`にVol.45のNodeテストを追加。今回追加テストのGitHub Actions上の成功は未確認。

## Vol.46の承認待ち
1. G4: Vol.43の3ジョブを手動起動して結果確認／ジョブ数削減の設計に切り替える。
2. Variety: 直近20件履歴をブラウザで永続化する／難易度別に20件履歴を分ける。
3. TRIPLE: v1→v2の安全な移行を設計する／複数タブ同時更新への対策を優先する。
