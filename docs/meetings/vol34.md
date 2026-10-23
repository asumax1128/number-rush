# NUMBER×RUSH Vol.34｜ODD・EVEN統合と5MISSION安全集合
日付: 2026-10-23
**全項目暫定案・正式承認前**。

## 今回のユーザー選択
1. G4安全集合へODD・EVENを追加し、現行5MISSION（FREE・PAIR・TRIPLE・ODD・EVEN）を統合する。
2. Variety Engineは使用枚数の**種類数**を主指標とする。
3. TRIPLEは安全候補があれば積極的に出題する。ただし安全性を優先。
従来の直近100問ODD/EVEN出題可能率統計、20問未満補正倍率1.0、上限1.25倍、難易度別MISSION CLEAR解法数ソフト帯を維持。

## 実行済み全件検証
数字1〜3の通常タイル6枚、任意の予約キュー6枚（公開5枚+内部予約6枚目）、63通りの非空部分集合、TARGETは非空部分集合和で達成可能な値すべて。現在MISSION未達のTARGET CLEARもすべてプレイヤー行動として含む。予約キュー先頭k枚を選択位置昇順で補充。回答後に未予約末尾k枚を数字1〜3から生成可能。特殊タイル、REFRESHなし。
新規C++17検証器をローカルでコンパイル・実行:
```
states 6234408 routes 33480783
FREE   current 6234408 zero 0       total 69060354 min 4 max 15
PAIR   current 2088585 zero 0       total 20908809 min 1 max 5
TRIPLE current 2307285 zero 17820   total 21523251 min 0 max 6
ODD    current 5977800 zero 22344   total 64260198 min 0 max 14
EVEN   current 5083317 zero 1039260 total 50723061 min 0 max 13
```
current=現在MISSION CLEAR可能な(B,Q,T)状態数。zero=現在の全TARGET一致ルート後で共通NEXT TARGETが指定NEXT MISSIONに存在しない(B,Q,T)状態数。total=共通NEXT TARGET候補数の総和。
各MISSIONのzeroの分母は6,234,408。NEXT TRIPLE出題可能率99.714%、ODD99.642%、EVEN83.331%（全状態均等であり実プレイ頻度ではない）。
NEXT EVENの反例: 盤面[1,1,1,1,1,1]、予約キュー[1,1,1,1,1,1]、TARGET=1。次盤面は全奇数なのでEVEN不可。

## G4安全集合の構成
K5={(B,Q,T,M) | B,Q∈{1,2,3}^6, M∈{FREE,PAIR,TRIPLE,ODD,EVEN}, 現在MISSION CLEARが存在する}。
全(B,Q,T)に対して、全TARGET一致回答ルート後に共通NEXT PAIR TARGETが存在する（zero=0）。生成側は回答前にNEXT=(PAIR,t')を固定可能。
プレイヤーがどのTARGET一致回答を選んでも次盤面B'はPAIR(t')成立。消費した予約k枚の補充後、残存予約を改変せず、未予約末尾を任意の数字1〜3で埋めた新予約Q'は{1,2,3}^6内。よって(B',Q',t',PAIR)∈K5。帰納的に無期限継続可能。
TRIPLE/ODD/EVENについても、全回答ルートに共通NEXT TARGETがある場合に限って選べば遷移先はK5に入る。**安全集合に入れられることと、毎回そのMISSIONを強制出題できることは異なる。**
厳密なゲーム理論では生成側の選択と全プレイヤー回答に関する不変集合の証明。参考: safety gamesのcontrollable predecessorと最大不動点（https://par.nsf.gov/servlets/purl/10100579）。
実ゲーム全体（数字1〜9、BONUS/DOUBLE/REVERSE、REFRESH、他MISSION）は未証明。

## Variety Engine：使用枚数種類数を主指標
候補NEXT TARGET/MISSIONがSafety Engineに合格した後、各現在盤面/予想後盤面でタイルIDを区別した解法マスクを列挙する。
- 主指標：MISSION CLEAR可能な解法の使用枚数の種類数。ただしPAIR/TRIPLEは仕様上常に1種類なので、TARGET CLEARを含む全TARGET一致解法の使用枚数種類数を**別指標**として評価し、固定枚数MISSIONが不利にならないようにする。
- 副指標：EASY3〜8、NORMAL2〜5、HARD1〜3のMISSION CLEAR解法数帯への適合、直近の使用枚数分布との違い、MISSION連続回避、ODD/EVEN出題可能率補正（最大1.25倍）。
- TRIPLEの積極採用は安全候補に限定し、出題割合や係数は今後調整する。数字の多様性より使用枚数の多様性を優先。
- 多様性のために既公開のNEXT情報や予約タイルを変更しない。
- 安全性を主指標で置き換えない。すべてソフト評価。

## CI
`tools/verify-vol34.cpp`を追加。件数、候補数、最小最大などの回帰チェックで不一致時は非ゼロ終了。
`.github/workflows/number-rush-safety.yml`にVol.34を追加。関連検証コードまたはワークフロー変更時のpush/PRと手動起動のみ実行。
**GitHub Actions上での実行結果は未確認。** ローカル実行と区別する。

## Vol.35の承認待ち
1. 次の保証拡張：数字1〜4への拡張／特殊タイルBONUSの導入。
2. 使用枚数の多様性：MISSION CLEARとTARGET一致全ルートを併用／TARGET一致全ルートのみを主評価。
3. TRIPLEの優先度：直近100問の出題不足を補正／安全候補があるとき一律優先。
