# NUMBER×RUSH Vol.37｜DOUBLE導入とVariety正規化
日付: 2026-10-23
**すべて暫定案・正式承認前**。

## ユーザーの選択
1. 特殊タイルDOUBLEを次の数学的検証対象にする。
2. Variety Engineの使用枚数種類数はMISSION内候補群のmin-max正規化。
3. TRIPLEの目標出題率は固定せず、実プレイ計測から決める。直近100問の不足補正上限1.25倍、20問未満倍率1.0は維持。

## DOUBLE仕様と検証範囲
- 通常タイルNORMAL(n)の実効値=n、DOUBLE(n)の実効値=2n。
- 1タイルに複数特殊属性は重複しない。
- FREE、PAIR、TRIPLEは使用枚数を、ODD/EVENは**元数字**の奇偶を判定する（DOUBLE(3)の実効値6でもODDを満たす）。
- 予約キューの公開5枚+内部予約6枚目は数字と特殊属性をセットで固定。現在TARGET一致の全回答ルート（MISSION未達TARGET CLEARを含む）を考慮し、選択した位置へキュー先頭k枚を昇順に補充する。
- 今回の標本モデルは数字1〜4、NORMAL/DOUBLE、現行5MISSION、REFRESHなし、BONUSなし、REVERSEなし。
- DOUBLEは合計値を変えるのでVol.36 BONUS属性消去のG4証明は適用不可。

## 実行済み予備探索（全件ではない）
`tools/verify-vol37.py` にseed=37の再現可能な標本テストを追加。2500盤面×予約キューを生成し、63非空部分集合を位置IDで区別して、各現在TARGETに対する全回答ルートの後の共通NEXT TARGETを検査。
```
sample_board_queue_pairs 2500
states 47108
mission  no_common_next_target
FREE    0
PAIR    11
TRIPLE  204
ODD     1422
EVEN    1475
```
各件数の分母は47,108。標本中にFREEの失敗例がなかっただけで、任意のDOUBLE盤面・予約キューでNEXT FREEが存在する保証ではない。
PAIR等の共通NEXT候補がない反例を実際に検出。例（元数字,DOUBLEフラグ0/1）:
board=[(1,0),(1,1),(3,1),(3,0),(4,1),(2,0)]
queue=[(1,1),(4,1),(2,1),(4,1),(2,1),(4,0)]
TARGET=8。NEXT PAIRの共通TARGETは存在しない。
この予備探索はG2の共通NEXT候補を確認するもので、G4固定点計算ではない。DOUBLE導入後のG4は**未証明**。
今後、全件列挙、反例探索、または構造的証明と安全集合固定点の検証が必要。
一般の安全ゲームでは、生成側の存在選択とプレイヤー側の全行動を含むcontrollable predecessorの最大固定点を求める（https://par.nsf.gov/servlets/purl/10100579）。

## Variety Engine：MISSION別min-max正規化（暫定）
Safety Engine合格済みのNEXT候補をMISSIONごとにグループ化。
Dm=MISSION CLEAR解法の使用枚数種類数、Dt=TARGET一致全ルートの使用枚数種類数。
各MISSIONの候補群内で norm(x)=(x-min)/(max-min)。max=minの場合は中立値0.5。
PAIR/TRIPLEはDm=1に固定されるためDmの比較能力がない。これらのMISSIONではDtを主指標とする。FREE/ODD/EVENはDmとDtを併用。
複数の現回答ルートにより次盤面が分岐する場合、評価の対象盤面を恣意的に1つ選ばない。分岐先全体の平均・最悪値などの集約方法は次回承認待ち。
MISSION CLEARとTARGET CLEARを混同しない。正規化スコアが低くても安全候補は除外しない。
EASY3〜8、NORMAL2〜5、HARD1〜3のMISSION CLEAR解法数帯はソフト制約を維持。

## TRIPLE目標出題頻度
直近100問で「TRIPLEが安全に出題可能だったか」と「実際に出題したか」を別記録。
20問未満は不足補正倍率1.0、20問以上は最大1.25倍。
**目標出題率は未設定**。実プレイの難易度別・出題可能機会別の統計を蓄積してから決定する。安全候補なしでTRIPLEを強制しない。

## CI
`tools/verify-vol37.py` を追加。関連ファイル変更時のみ既存Vol.32〜36検証と一緒に実行。標本の決定的回帰テストはG4の全件証明を代替しない。
GitHub Actions上の成功は未確認。

## Vol.38の承認待ち
1. DOUBLEの次の検証: 数字1〜2・NORMAL/DOUBLEを全件列挙／数字1〜4の反例探索を強化。
2. 分岐先のVariety集約: 最悪値を重視／平均値を重視。
3. TRIPLE統計: 難易度別に分けて記録／全難易度で共通の100問窓。
