# NUMBER×RUSH Vol.44｜Actions実行状況・使用枚数履歴・TRIPLE自動保存
日付: 2026-10-23
**すべて暫定案。正式承認前。全件G4保証は未確定。**

## ユーザーの決定
1. GitHub ActionsのVol.43少数3ジョブ実測結果を確認し、実行費用と所要時間を分析する。
2. Variety EngineでMISSとTARGET CLEARを含む使用枚数履歴の記録基準を定める。
3. TRIPLE統計の自動保存タイミングと破損時の復旧方針を定める。

## GitHub Actionsの確認結果
2026-10-23時点でGitHub REST `GET /repos/asumax1128/number-rush/actions/runs`を照会し、取得した16件のworkflow runsはすべて`NUMBER RUSH Safety Verification`（push）であり、`number-rush-vol43-pilot.yml`のworkflow_dispatchによる3ジョブ実行は確認できなかった。
例: run 39903171714 はcompleted/success（https://github.com/asumax1128/number-rush/actions/runs/39903171714）。これは通常CIであり、3ジョブパイロットではない。
したがって**GitHub Actions上の3ジョブ起動オーバーヘッドは未測定**。Vol.42のローカル243盤面平均約2.82秒は参考値に留まり、Actions上の実測として扱わない。192分割のローカル計算時間単純推計約9分も、runner起動・checkout・compile・artifact等を含まない。
公開リポジトリの標準GitHub-hosted runnerはGitHub公式の無料対象だが、実際の請求は公開設定・ランナー・アカウント・利用条件による。3ジョブの実行が確認できた後、ジョブ作成時刻・開始時刻・終了時刻とpilot計測ログを突き合わせる。
手動実行: https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol43-pilot.yml → Run workflow → main → Run workflow。現GitHub接続にworkflow_dispatchを新規起動する機能がないため、こちらでは起動できない。
**全192区間のG4全件証明は未実施・未確定。**

## Variety Engine：使用枚数履歴の定義
`tools/outcome_history_vol44.py`を追加。過去20件の実消費タイル枚数を保存。
- MISSION CLEAR: TARGET一致で盤面を進め、消費した1〜6枚を記録。
- TARGET CLEAR: MISSION未達でもTARGET一致で盤面を進めるので、消費した1〜6枚を記録。
- MISS: 盤面不変・消費0枚なので使用枚数履歴に記録しない。MISSそのものの分析は別のイベントログが必要。
- 1つの確定回答はanswer_idで重複排除。ボタンのタップ回数ではなく確定した回答単位。
- この履歴は「直近20問」という旧呼称と異なり、厳密には**直近20件の盤面を進めた正しいTARGET回答**である。MISSを含む直近20出題と同じ窓ではない。ユーザー承認待ちの暫定定義。
- Varietyの第3同点判定はVol.43の等確率ルート仮定に基づく予測分布と直近20件の実使用枚数履歴の期待重複率。Safety Engine通過→最悪分岐→平均分岐→履歴重複率の順。
- `tools/test_outcome_history_vol44.py`でMISSION CLEAR/TARGET CLEAR/MISS/重複ID/不正枚数をテスト。

## TRIPLE統計：保存タイミングと破損時復旧
`src/telemetry/triple-autosave.mjs`を追加。
- 問題生成側でSafety Engineが候補を確定しVariety EngineがNEXT問題を確定した時点で`commitQuestion(questionId,event)`を1回呼ぶ。回答時やMISSごとに保存しない。
- 同一セッション内で同一questionIdの重複呼び出しを排除。記録後にVol.43のバージョン付きJSONをstorage adapterへ書き込む。
- 保存失敗（quota/ブラウザ設定）時はゲームを停止させず、メモリ上の統計を保持して警告する。実ゲームへのUI警告配線は未実施。
- 復元時に壊れたデータや未知スキーマを検出したら`status='corrupt'`、元の保存文字列を上書きせず、通常の書き込みを拒否。
- `resetCorruptData()`は**ユーザーが明示的に初期化を選んだ場合にだけ**呼ぶ設計。元の文字列を戻り値として返してから初期化する。ユーザー操作UI・実機テストは未実装。
- 保存形式は氏名・ID・時刻等を含まない各難易度最大100件のイベントJSON。外部送信なし。
- `src/telemetry/triple-autosave.test.mjs`で往復復元、重複ID、破損保存の保全と明示的初期化、保存失敗時の継続をテスト。
- **重要な未解決事項**: 同一questionIdの重複排除は現在の実行セッション内で直近1件に限られる。アプリ再起動後の重複記録や非連続の重複IDに対する厳密な冪等性は未保証。次回以降の改良対象。
- ゲーム本体がまだこのリポジトリにないため実ゲーム接続は未実施。ブラウザのlocalStorageは永続性・同期を保証しない。
- TRIPLE出題補正は引き続き無効（倍率1.0）。実データ収集と可視化を先行。

## CI
関連ファイル変更時の`.github/workflows/number-rush-safety.yml`にVol.44のPython履歴テストとNode保存テストを追加。GitHub Actions上での今回の追加テストの成功は未確認。

## Vol.45の承認待ち
1. G4: Vol.43の3ジョブパイロットを実際に起動してログ確認／少数ジョブを束ねる方式へ設計変更。
2. Variety: 直近20件のTARGET一致回答を正式な履歴窓の暫定定義として継続／MISSを含む直近20出題窓へ変更。
3. TRIPLE保存: 再起動後も重複保存を防ぐ識別子設計／ブラウザでのエクスポート・復旧UIを先に整備。
