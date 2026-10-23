# Vol.26｜TRIPLE追加とG4無期限保証の拡張（Ver.0.24案）
日付: 2026-10-23
状態: **暫定案・未正式承認**。限定モデルでの全探索実測。実ゲーム全体のG4は未証明。

## ユーザーが選択した方針
- MISSIONはFREE・PAIRにTRIPLE（ちょうど3枚）を追加。
- 複数解法はソフト制約として優先。必須にはしない。
- 1→2→3の周期キューを維持して段階的にMISSIONを追加検証する。
- Safety Engine / Variety Engineを分離。周期キューは**検証専用**。
- 各会議をGitHubに保存。

## 有限モデル
- 6枚の位置ID付き通常タイル、各値1/2/3、729盤面、キュー位相3通り。
- 現在TARGETは1〜18。現在MISSION∈{FREE, PAIR, TRIPLE}。
- PAIRはちょうど2枚、TRIPLEはちょうど3枚でTARGETを作ること。
- 現在TARGETに合計一致する**全て**の非空部分集合をプレイヤー遷移として扱う。枚数不一致のTARGET CLEARも含む。
- 消費した位置を昇順で周期キューから補充し、位相を消費枚数だけ進める。
- NEXT TARGET/MISSIONは**現在の回答前**に決める。
- REFRESH・特殊タイル・実ゲームのランダムキューは対象外。

## 実測結果
- FREE成立状態: 25,656
- PAIR成立状態: 8,595
- TRIPLE成立状態: 9,495
- 和集合K: **43,746状態**（MISSIONを別状態として数える）。
- 各S∈Kについて、全TARGET一致ルート後の盤面でNEXT MISSIONを満たせるTARGET集合の共通部分を計算。
- NEXT FREE: 候補数最少6・最多15、候補ゼロ状態0。
- NEXT PAIR: 最少1・最多5、候補ゼロ状態0。
- NEXT TRIPLE: 最少1・最多6、候補ゼロ状態0。
- よってKは、各NEXT MISSIONを任意に指定した場合でも、適切なNEXT TARGETを回答前に選ぶことで全回答遷移について閉じている。固定点削除0、限定モデルのG4が成立。
- 現在PAIR成立状態の全合計一致ルートの内訳: MISSION CLEAR 32,805、TARGET CLEARのみ27,858。
- 現在TRIPLE成立状態の全合計一致ルートの内訳: MISSION CLEAR 43,740、TARGET CLEARのみ35,676。

## 具体例
現在盤面[1,2,3,1,2,3]、位相0、TARGET6、MISSION TRIPLE。
- 全TARGET一致ルート10通り。3枚MISSION CLEAR8通り、2枚または4枚TARGET CLEARのみ2通り。
- 使用枚数の種類: {2,3,4}。
- 全10ルート後の共通NEXT TARGET:
  - NEXT FREE: 1,2,3,4,5,6,7,8,9
  - NEXT PAIR: 2,3,4
  - NEXT TRIPLE: 4,5,6

## 証明の論理と制限
K内の各状態で、NEXT MISSIONをFREE/PAIR/TRIPLEのいずれに固定しても、全TARGET一致ルートに共通するNEXT TARGETが存在し、遷移先はKに入る。帰納法により任意回の継続が可能。
**これは周期キューの無限継続が確定している有限モデルのみの結果。** 実際の公開5枚・内部予約キュー、未公開生成自由度、難易度別MISSION、特殊タイル、REFRESH等にはまだ一般化できない。
なお、この結果は「毎回3種類のMISSIONを自由に選べる」ことを示すが、実ゲームの同種MISSION連続回避のソフト制約を実装したわけではない。

## Variety Engine（新提案・未承認）
安全候補に限定し、使用枚数の多様性、MISSION CLEARルート数、直近MISSIONとの差、数字の多様性、安全余裕を評価する。
解法数が多すぎると容易になる可能性があるため、難易度別の適正解法数帯を検討。

## Vol.27の承認待ち
1. 次に追加するMISSION: ODD・EVEN／BIG。
2. Variety Engineの解法数: 難易度別適正範囲を導入／まず多様性のみを評価。
3. 検証キュー: 周期キューでMISSION追加を続行／周期を1,2,3,2等へ変更し耐性検証。
