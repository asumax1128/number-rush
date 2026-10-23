# NUMBER×RUSH Vol.41｜G4計算最適化・直近20問Variety履歴・TRIPLE計測アダプター
日付: 2026-10-23
**すべて暫定案。正式承認前。全46,656盤面のG4検証は未完了。**

## 今回のユーザー決定
1. 数字1〜3、NORMAL/DOUBLEのG4全件検証に先立ち、対称性・キャッシュによる計算負荷最適化を優先する。
2. Variety Engineの追加同点判定に直近20問の使用枚数パターンを使う。
3. TRIPLE統計をゲーム本体へ接続するための設計・アダプター・テストを実装する。

## リポジトリの現状と実装境界
現行リポジトリのルートはREADME.md、docs/、tools/、.github/であり、実際のゲーム本体（問題生成器・Safety Engine・Variety Engineの稼働JSコード）は含まれていなかった。そのため`src/telemetry/triple-telemetry.mjs`に**将来のゲーム本体から呼び出せるアダプター**を新設。稼働ゲーム本体への実配線や実プレイログ取得を完了したとは扱わない。接続点の設計と独立テストまで完了。

## G4最適化：キュー先頭一致のキャッシュ
`tools/verify-vol41.cpp`を追加。Vol.39と同じ数字1〜3・NORMAL/DOUBLEの6種、盤面6枚、予約キュー6枚、FREE/PAIR/TRIPLE/ODD/EVEN、TARGET一致全63マスク（TARGET CLEAR含む）、消費位置昇順補充。
k枚を消費する回答の次盤面は、予約キューの先頭k枚にしか依存しない。各盤面b・選択マスクa・キューprefix（長さpopcount(a)）について次盤面のMISSION別可能TARGETビット集合をキャッシュ。予約キュー全6枚を列挙する際は`q % 6^k`で同じ先頭k枚のキャッシュを参照する。これは単なる計算共有であり、公開5枚+内部予約6枚目の不変性を破らない。
位置入替による一般的な対称性は採用しない。タイルの補充位置と順序の対応を壊す可能性があるため、数学的に厳密な同値関係だけを使う。
最適化版のローカル実行（board=[0,128), queue=[0,46656)）: 約1.41秒、5,971,968盤面×予約組、64,525,248 TARGET付き状態、376,233,984 TARGET一致ルート。MISSION別zero: FREE=0, PAIR=102576, TRIPLE=1333512, ODD=54344, EVEN=17151020。Vol.39の同区間の結果と一致。**旧版との速度比は未計測。**
CIでは旧版と最適化版の同一区間出力を`diff`で比較する。手動192分割ワークフロー`.github/workflows/number-rush-vol40-full.yml`も最適化版を使うよう変更。192ジョブはまだ実行していない。全件G4は未証明。

## Variety Engine：直近20問
既存の優先順位: (1)最悪分岐の多様性を最大化 (2)平均値を最大化 (3)直近の使用枚数パターンとの重複を最小化。
`tools/tile_count_history_vol41.py`で選択使用枚数1〜6を直近20問のdequeに保存。候補問題の回答可能な使用枚数集合と履歴の重なり率を計算する参考実装を追加。少ない方を優先。使用枚数は実際にプレイヤーが選択した回答ルートを記録する。未回答やMISSの扱いは今後要定義。
安全候補のみを比較し、MISSION内候補群min-max正規化、MISSION CLEARとTARGET一致全ルートの区別を維持。
重要な設計上の留保: 候補に使用枚数種類が多いほど履歴重複率が増える指標は、多様性を不当に罰する可能性がある。次回、候補の予測分布で正規化する等の改善を検討する。

## TRIPLE統計：将来のゲーム本体接続
`src/telemetry/triple-telemetry.mjs`（ES module）:
- 難易度EASY/NORMAL/HARD別、各100問リングバッファ
- `recordQuestion({difficulty,safeMissions,selectedMission,missionClearSolutions,targetTileCountKinds})`
- Safety Engineが安全候補を確定し、Variety Engineが選択した直後、NEXT問題を公開する前に**1問につき1回だけ**呼び出すことを想定
- selectedMissionがsafeMissionsに含まれない場合は例外。TRIPLE出題機会availableと実際のselectedを別記録
- summaryはobserved,available,selected,availabilityRate,selectionRate,selectionGivenAvailableを返す
- correctionEnabled=false, correctionMultiplier=1.0を固定し、出題補正を無効のまま維持
- `snapshot()`で履歴の読み出しが可能（永続化/送信は未実装）
- `src/telemetry/triple-telemetry.test.mjs`で100問窓、難易度独立、危険な選択拒否、機会と実出題の分離を検証。ローカル`node --test`で3件PASS
- **ゲーム本体がリポジトリに存在しないため、稼働ゲームへの配線は未実施**。本体追加後に呼び出し接続とE2Eテストが必要。

## CI
`.github/workflows/number-rush-safety.yml`にVol.41最適化版とVol.39旧版の128盤面比較、直近20問の履歴テスト、Nodeテレメトリテストを追加。関連ファイル変更時のみ実行。GitHub Actions上の成功は未確認。
全件192ジョブは手動起動専用。次回以降、実行予算と監査を確認して起動する。

## Vol.42の選択肢
1. G4: 最適化版で全192ジョブを実行し監査／まず数ジョブの性能測定と費用見積もり
2. Variety履歴: 使用枚数の重複率を予測分布で補正／現行の単純重複率を仮運用
3. TRIPLE: ゲーム本体の追加・統合を準備／計測ログのエクスポート・可視化を先に作る
