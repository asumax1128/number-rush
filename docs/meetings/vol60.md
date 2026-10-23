# NUMBER×RUSH Vol.60｜非FREE連続出題・write-ahead回答保存・実ブラウザE2E
日付: 2026-10-23
**すべて暫定案、正式承認前。**

## 1. G4：非FREE MISSIONの連続出題判定アルゴリズム
- `src/safety/safety-consecutive-missions-v60.mjs`を実装。
- `safeNextMissionCandidatesV60({board,reservedQueue,target,currentMission})`は6位置、各数字1〜3、NORMAL/DOUBLEの限定モデルだけを受け付ける。G1（現MISSION CLEAR可能）を検査し、63非空subsetからTARGET一致の全回答を列挙。MISSION CLEAR/TARGET CLEARを**両方**含める。
- 各回答分岐の補充後ボードで、NEXT FREE/PAIR/TRIPLE/ODD/EVENごとの達成可能TARGET集合を求め、その共通部分のみ`options`に採用。公開済み6枚予約キューを回答前に変更しない。
- `chooseNextMissionV60`は安全な非FREE候補があればその中から選択し、なければFREEへ帰還。Varietyの比較関数は安全候補だけを順位付けし、安全条件を緩められない。
- Vol.58 FREE安全核の閉包性を前提に、各安全なNEXT MISSION状態から再びFREEへ帰還できる（Vol.59の帰還定理）。これにより**限定モデル内**の非FREE連続出題は安全性を維持できる。
- `src/safety/safety-consecutive-missions-v60.test.mjs`：TARGET CLEAR分岐、全分岐のMISSION解、EVEN候補なし、G1違反・範囲外タイル拒否をテスト。
- **制限**：REFRESH/G3、REVERSE、数字4以上、未公開キューの生成実装、実ゲーム本体への配線は未検証。非FREE出題頻度の目標達成も未保証。

## 2. Variety：回答ID→pending→履歴→ackのwrite-ahead接続
- `src/telemetry/variety-write-ahead-v60.mjs`を追加。
- `createWriteAheadVarietyBridge({storage,locks,cryptoProvider,onWarning,maxPending})`。
- ゲームが`commit({answerKey,finalized:true,outcome,consumedTileCount})`を呼ぶと、IDを一度発行し、CLEARの場合はVol.59永続pendingへ`stage`し、成功時のみVol.50ロック付き履歴へ`recordAnswer`、保存成功後にpendingを`acknowledge`する。
- 同一answerKeyの重複通知は同じPromise・IDを返す。矛盾した回答内容での同一キー再使用は拒否。MISSは履歴対象外。
- `recover()`は永続pendingを復元し、元のIDで履歴へ再送してからack。
- Web Locks不在・pending破損・容量不足・履歴書込失敗ではfail-closed。pending保存前に履歴を書かない。
- `src/telemetry/variety-write-ahead-v60.test.mjs`：write-ahead順序、同一回答重複、ロック不在、履歴保存失敗→再起動復旧、MISSをテスト。
- **限界**：v2履歴のID保持は直近20件。古いpendingの再送で過去IDが履歴窓から消えている場合、永続的exactly-onceは保証しない。複数タブの同一pending並行recoverは履歴の冪等性に依存。Vol.56旧commitとは別の入口であり、ゲーム本体の確定関数への差し込みは未実施。

## 3. TRIPLE：実ブラウザE2Eテストハーネス
- `tests/browser/vol60-fixture.html`：ゲームの確定イベントを模したブラウザテスト画面。TRIPLEアダプタ、実localStorage、Web Locks、HUDを利用。
- `tools/browser-e2e-vol60.mjs`：Playwright Chromiumを起動し、ローカルHTTPでfixtureを配信。確定イベント→保存→同一問題重複通知→同一ID維持を検査。ページJavaScriptエラーも検知。
- `.github/workflows/number-rush-vol60-browser-e2e.yml`：`workflow_dispatch`手動実行、Node 22、Playwright＋Chromiumをセットアップしハーネスを実行。
- `.github/workflows/number-rush-safety.yml`：Vol.60の安全候補アルゴリズムとwrite-aheadユニットテストを追加。
- **制限**：Chromium実ブラウザテストは実行環境とブラウザインストールが必要。現時点でPlaywrightの実行結果は未確認。fixtureはゲーム本体ではない。実ゲーム画面のテストではない。

## Vol.61の候補
1. G4：REFRESHを含むG3安全性の検証／非FREE候補の出題頻度を定量評価。
2. Variety：複数タブ同時recoverと20件窓を超えたID重複への対策／ゲーム本体へのwrite-ahead接続契約。
3. TRIPLE：Chromium E2Eワークフローを実行しログを分析／再読み込み・複数タブの実ブラウザE2Eを拡充。
