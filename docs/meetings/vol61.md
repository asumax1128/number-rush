# NUMBER×RUSH Vol.61｜G3 REFRESH・複数タブ復旧・Chromium E2E結果確認
日付：2026-10-23
**全事項暫定案。正式承認前。**

## 1. G3：REFRESHの安全性検証
- `src/safety/safety-refresh-g3-v61.mjs`とテストを追加。
- 6位置・数字1〜3・NORMAL/DOUBLEの限定モデル。REFRESHは1〜5タイルの62部分集合。位置昇順で予約キューから補充。
- REFRESHのあとも現在のTARGETとMISSIONが成立する（G1）ことを検査。
- その状態でVol.60の全TARGET一致回答ルート（TARGET CLEAR含む）を列挙し、**すでに公開したNEXT TARGET・MISSION**が全回答分岐の後でも成立する（G2）ことを検査。
- G4はVol.58 FREE核への帰還定理を前提とする。REFRESH後のG1/G2が通れば、限定モデルの次状態からFREE核へ帰還可能。
- 重要：REFRESH最大5枚＋回答最大6枚で、**現在の盤面に加えてキュー先頭11枚を確定・不変として供給**することを要求。公開5枚＋予約6枚目だけでは、REFRESH後の回答のための6枚を確定できず、完全なG3検証はできない。追加の内部予約または将来生成に関する全称量化が必要。
- `enumerateRefreshG3V61`で全62マスクを検査し、許可・不許可と理由を返す。REFRESHストック、制限時間、実ゲームの生成タイミングは未接続。
- **証明の範囲**：指定された11枚キューに対する局所的G1/G2の証明。実ゲームが11枚を予約していない場合にそのまま利用できない。未予約末尾の任意生成に対する全称保証は未実装。G3/G4の実ゲーム全体への一般化は不可。

## 2. Variety：複数タブ同時復旧と20件窓を超えたID重複対策
- `src/telemetry/variety-safe-recovery-v61.mjs`とテストを追加。
- Web Locksの`number-rush:variety-recovery:v61:global`を使い、**同じ協調プロトコルを利用する複数タブの復旧を直列化**。
- 20件の表示履歴とは独立した`number-rush:variety-answer-ledger:v1`を導入し、回答IDを自動で削除しない（maxIds=10,000の上限に達したら新規登録拒否）。重複防止のため古いIDを無断でevictしない。
- 復旧時にledgerへ`started`を永続書込→既存履歴へ保存→`saved`を永続書込→pending ackの順序。保存済みIDは再送せずpending ack、`started`で中断したIDは**書込済みか未書込か不明**なので自動再送せず隔離。
- これにより20件を超えた古いIDの**自動再送による二重計上を防止する保守的方針**を実装。代わりに不確定イベントが統計に未反映のまま残る可能性があり、exactly-once（欠落なし＋重複なし）は保証しない。
- 既存Vol.60の新規回答コミット経路はこのledgerと統合されていない。**復旧経路用の最小実装**であり、既存writerや古いタブを含めた完全な排他保証ではない。ledgerの増加に伴う容量上限、手動照合・解除UIが今後の課題。
- 競合復旧、`started`の不確定状態、破損データ、ロック非対応をテスト。

## 3. Chromium E2E：実行結果の確認
- Vol.60の手動実行用ワークフロー`.github/workflows/number-rush-vol60-browser-e2e.yml`とPlaywrightハーネス`tools/browser-e2e-vol60.mjs`は存在する。
- GitHub連携のコミット関連Actions取得でVol.60議事録コミット`a8e0a51dd1a2b7a2b31fc89b9eafcda5448c8f53`のワークフロー実行は**0件**と返った。ただしこの取得APIはPR関連に限定され、手動`workflow_dispatch`の有無を網羅しない。
- Actionsの特定ワークフロー実行一覧APIを試したが、連携ツール側の許可対象URL制限で取得不可。公開ワークフローページからも実測ログ・成功/失敗・所要時間を確認できなかった。
- **したがって「Chromium E2Eが成功した」とは判定しない。実行履歴・ジョブログ・所要時間は未確認。** 実行を要求する場合はGitHub Actions UIの`NUMBER RUSH Vol60 Browser E2E`→`Run workflow`で起動し、実行URLを共有するか対応ツールでログ取得する必要がある。
- 事前確認事項：Playwright依存関係、Chromium起動、localhostのSecure ContextでのWeb Locks/localStorage、HUDのDOMセレクタ、同一questionKeyのID保持、ブラウザコンソール例外、結果保存の有無。

## 4. CIと保存
- `.github/workflows/number-rush-safety.yml`にVol.61のNodeテスト2本を追加。
- GitHubへの保存は確認したが、新規CIの成功は未確認。

## Vol.62の検討項目
1. G3：公開5枚＋予約6枚目の仕様を保持しつつ、**未予約末尾の全候補**に対するREFRESH安全性の全称検証／キュー11枚予約方式の正式採否を比較。
2. Variety：Vol.60新規回答コミット経路とVol.61 ID ledgerを統合し、不確定started状態の照合・解除フローを設計／復旧ログとHUD通知を追加。
3. TRIPLE：GitHub ActionsのChromium手動実行ログを入手して解析／ブラウザE2Eに再起動・複数タブシナリオを追加。
