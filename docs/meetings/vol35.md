# NUMBER×RUSH Vol.35｜数字1〜4へのG4拡張と解法枚数多様性
日付: 2026-10-23
**全項目暫定案・正式承認前**。

## ユーザーの指定
- 数字1〜4へG4保証を拡張する。
- Variety EngineはMISSION CLEARとTARGET一致全ルートを併用して、使用枚数の多様性を評価する。
- TRIPLEの出題不足を直近100問の履歴で補正する。
- 既存方針: 公開5枚と内部予約6枚目は不変、回答後に未公開末尾生成、ODD/EVEN補正は20問未満倍率1.0・上限1.25倍、難易度別解法数ソフト帯（EASY3〜8、NORMAL2〜5、HARD1〜3）。

## 数字1〜4の独立全件検証（実行済み）
6枚盤面B∈{1,2,3,4}^6と予約キューQ∈{1,2,3,4}^6の全組み合わせをC++17で列挙。63非空選択マスクを位置IDで区別。現在TARGET一致のすべての回答ルート（MISSION未達TARGET CLEARを含む）後に、NEXT MISSION別の共通TARGET集合をビット積集合で算出。消費k枚は予約キュー先頭k枚を選択位置昇順に補充。数字1〜4の通常タイルのみ、特殊タイル/REFRESHなし。
```
board_queue_pairs 16777216
states 239894528
target_matching_routes 1056964608
mission  current_possible_states  no_common_next_target  min_candidates  max_candidates
FREE    239894528                0                      3               19
PAIR     82935808                22560                  0                7
TRIPLE   92520448                765780                 0                8
ODD     217071616                7218176                0               17
EVEN    214441984                7851160                0               18
```
出題可能率（全状態均等）:
FREE 100%、PAIR 99.9906%、TRIPLE 99.6808%、ODD 96.9909%、EVEN 96.7273%。
数字1〜3ではNEXT PAIRの共通候補ゼロは0だったが、数字1〜4では22,560件発生。**従来の常にPAIRへ退避する構成的戦略は使えない**。
一方NEXT FREEの共通候補ゼロは0。したがって任意の(B,Q,T)で回答前にNEXT FREEと共通TARGETを選択可能。

## 数字1〜4のG4閉包集合
K4={(B,Q,T,M): B,Q∈{1,2,3,4}^6、M∈{FREE,PAIR,TRIPLE,ODD,EVEN}、現在MISSION CLEARが存在する}。
任意のS∈K4で、全TARGET一致回答ルートに共通するNEXT FREE TARGET t'が必ず存在（全件検証）。NEXT=(FREE,t')を回答前に確定し、プレイヤーがどのTARGET一致ルートを選んでも次盤面B'でFREE(t')が成立。残存予約を変えず、回答後の未公開末尾をどの合法な数字1〜4で埋めても新予約Q'∈{1,2,3,4}^6。ゆえに(B',Q',t',FREE)∈K4。帰納的にG4無期限継続が成立。
PAIR/TRIPLE/ODD/EVENも各NEXT MISSIONに共通TARGETが存在する場合のみ選べば、遷移先はK4内。出題頻度や競技性の保証ではない。実ゲームの数字1〜9、特殊タイル、REFRESH、他MISSIONは未証明。
安全ゲームの固定点/controllable predecessorに関する一般的枠組み: https://par.nsf.gov/servlets/purl/10100579

## Variety Engine（未承認の具体的評価式）
候補NEXT TARGET/MISSIONがSafety Engineに合格した後のみ評価。MISSION CLEARとTARGET一致全ルートを別々に計算。
- MISSION CLEARでの使用枚数種類数 Dm = |{popcount(mask): maskはMISSION CLEAR}|。
- TARGET一致全ルートでの使用枚数種類数 Dt = |{popcount(mask): maskはTARGET一致}|。
- 例として合成評価 D = 0.5*(Dm-1)/5 + 0.5*(Dt-1)/5 を提案。ただしPAIR/TRIPLEではDm=1に固定されるため、MISSION種別ごとの正規化または比較グループ分離が必要。
- 使用枚数種類数を主指標とし、難易度別解法数帯への適合、過去の使用枚数分布との重複回避、同MISSION連続回避を副指標にする。
- 解法数の多いTARGET CLEARをMISSION CLEARとして数えない。安全候補をVariety評価で棄却しない。

## TRIPLEの直近100問補正（未承認の実装案）
直近100問に「TRIPLEが安全に出題可能だったか」「実際にTRIPLEが出題されたか」を記録。
20問未満は補正倍率1.0。20問以上は、TRIPLEの出題可能率と実出題率の差を見て不足分を補正。補正係数は既存ODD/EVEN上限1.25倍に揃える案（TRIPLEの上限値は次回確認）。安全候補がない場合は選ばない。
単純にTRIPLEの出題回数が少ないことと、TRIPLEの出題機会が少ないことを区別する。

## CI
`tools/verify-vol35.cpp` に独立全探索と回帰チェックを追加。CI `.github/workflows/number-rush-safety.yml` は関連検証ファイル変更時のみ自動実行、手動実行も可。Vol.32〜35の4検証器を実行する。数字1〜4の全探索に合わせタイムアウト10分。
ローカルで数字1〜4の全件検証を実行済み。**GitHub Actions上の成功は未確認。**

## Vol.36の選択肢（回答待ち）
1. 次の数学的拡張：数字1〜5を先に調べる／BONUSタイルを導入する。
2. 使用枚数多様性：MISSION別正規化を採用／全MISSION共通スコアにする。
3. TRIPLE出題不足補正：上限1.25倍／上限1.5倍。
