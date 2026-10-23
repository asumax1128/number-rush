# NUMBER×RUSH Vol.56｜全192区間G4 Actions実行手順と検証範囲（暫定）
日付: 2026-10-23

## 実行前の確認
1. `python3 tools/preflight_vol56.py`：8バッチ、各24区間、全192区間、盤面0〜46,655の被覆、各区間全46,656キュー、集約チェックが設定されているかを静的検査。
2. `python3 -m unittest discover -s tools -p 'test_preflight_vol56.py' -v`：設定変更で検証が壊れないかのテスト。
3. `node --test src/telemetry/answer-commit-gate-v56.test.mjs src/telemetry/question-commit-v56.test.mjs`：新しい統計イベントゲートのテスト。
4. GitHub Actions利用枠と実行時間上限を確認する。Vol.55ローカル実測は先頭24区間74.140秒、最大RSS約120MiB。残り168区間やGitHub Actions起動時間は未実測。

## 手動実行
1. https://github.com/asumax1128/number-rush/actions/workflows/number-rush-vol51-batch.yml を開く。
2. **Run workflow** → branch `main` → **Run workflow**。
3. `verify-partitions`の8ジョブ（batch 0..7）の完了を確認。各ジョブは24区間を順次検査し、ログと`summary.tsv`をartifactとして保存。
4. `aggregate`ジョブが成功したことを確認。192区間の欠落・重複、範囲の不一致、FREE zero>0は失敗として扱う。
5. 実行結果、実行ID、各ジョブの所要時間、最長ジョブ、最大RSS、集約結果、成果物の有無を議事録に追記する。

## 結果の読み方
- `aggregate=success`であれば、限定モデルの全192区間について「NEXT FREE候補が存在しない状態がない」ことの検証完了と記載できる。
- **無限G4固定点が証明された、実ゲーム全体のG4が証明されたとは記載しない。** 現検証器は共通NEXT FREEターゲットの反例探索であり、全MISSION・全特殊タイル・全ランダムキューを含まない。
- `aggregate`失敗またはジョブの中断は未完了として扱い、成功区間だけを全件保証へ外挿しない。
- 今回のツールからGitHub Actions `workflow_dispatch`を直接発火する操作は利用できず、**2026-10-23時点のActions実行履歴72件にVol.51全件実行とVol.52先頭バッチ実行はともに0件**。手動実行は未実施。

## 回答・問題イベントの新しいゲート
- `createGuardedAnswerCommitter(...).commit({answerKey,finalized:true,outcome,consumedTileCount})`：同一回答キーの同時呼び出しは同じPromiseを返し、回答IDは一度だけ発行。矛盾する結果で同じキーを使うと拒否。セッション内最大512件を保持。
- `createQuestionCommitter(...).commit({questionKey,finalized:true,difficulty,safeMissions,selectedMission,missionClearSolutions,targetTileCountKinds})`：問題IDを一度発行し、TRIPLE保存・HUD更新へ接続。同一問題キーの二重発火は抑制し、矛盾する問題データを拒否。セッション内最大512件を保持。
- 保存不能時もゲームのスコア・時間・盤面は変更しない。再送に同じIDを使う。
- **制限:** 512件より古いキーの再利用、ブラウザ再起動、異なるタブでのイベント確定、保存失敗後の自動再送は、このメモリ内ゲートだけでは保証しない。実ゲームの判定・出題確定点への接続は未実施（本体HTML・ゲームコードがリポジトリに存在しない）。
