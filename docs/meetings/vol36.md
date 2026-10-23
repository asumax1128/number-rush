# NUMBER×RUSH Vol.36｜BONUS属性の導入・MISSION別正規化・TRIPLE補正
日付: 2026-10-23
状態: **すべて暫定案・正式承認前**。

## 今回の選択
1. 数字1〜4の限定モデルに特殊タイルBONUSを追加する。
2. Variety Engineの使用枚数種類数はMISSION別正規化を採用する。
3. TRIPLEの直近100問出題不足補正は最大1.25倍とする。
従来のODD/EVEN統計の直近100問窓、20問未満補正倍率1.0、最大1.25倍を維持。

## BONUSの仕様上の重要点
- NORMAL(n)とBONUS(n)の実効和への寄与はともにn。
- 現行MISSION FREE, PAIR, TRIPLE, ODD, EVENは元数字と使用枚数のみで判定し、BONUSフラグを参照しない。
- BONUS使用枚数はMISSION CLEAR時の得点に影響するが、TARGET一致やMISSION CLEAR可否、消費タイル位置には影響しない。
- 予約キュー内のBONUSフラグは数字と一体で固定し、公開5枚・内部予約6枚目の情報を書き換えない。
- 回答後に生成する未予約末尾のBONUSフラグは合法な生成規則の範囲で決定する。

## 数学的G4の拡張（BONUS属性の消去）
数字1〜4の任意の6枚盤面・予約キューについて、Vol.35でNEXT FREEの共通TARGETが必ず存在することを全件検証済み。
BONUSフラグ付き状態Sからフラグだけを取り除く写像πを考える。すべての選択マスクaについて、実効合計とMISSION述語はπ(S)とSで一致。消費位置と予約先頭k枚の補充も数字成分で一致するため、
π(Next(S,a)) = Next(π(S),a)
が成立する。
よって数字のみの安全集合K4の逆像π^-1(K4)は、BONUSフラグをどのように割り当てても、数字1〜4・通常/BONUSのみ・現行5MISSION・REFRESHなしの限定モデルで閉包性を維持する。生成側はNEXT FREE共通TARGETへ退避可能。G4はBONUSフラグに関して保存される。
**注意**: 全BONUS組合せを総当たりしたわけではなく、遷移の属性消去に関する構成的証明と決定的サンプルテスト。BONUSが合計値・MISSION条件・補充位置・許可行動に影響する将来変更では、この証明を再評価する。
- 得点/CHAIN/出現確率のバランス保証、DOUBLE/REVERSE、REFRESH、数字1〜9、他MISSIONは未証明。

## 検証実行
`tools/verify-vol36.py` を作成。決定的乱数seed=36で数字1〜4の1000個の盤面/予約キューと各63選択マスクを検査。合計63,000遷移×5MISSIONについて、BONUSあり/属性消去後で数字遷移と(MISSION, TARGET, 使用枚数)候補が完全一致。
ローカル実行結果: `PASS: 63,000 transitions x 5 missions; BONUS erasure preserves semantics`。
これは構成的証明の実装回帰テストであり、全BONUS状態の総当たり実測とは区別する。

## Variety Engine：MISSION別正規化（暫定）
- Dm: MISSION CLEAR解法の使用枚数種類数（タイルID区別）。
- Dt: TARGET一致全ルートの使用枚数種類数。
- PAIR/TRIPLEではDmが必ず1のため、全MISSION共通の単純比較を避ける。
- まずMISSIONごとの候補集合内でDm/Dtを正規化（例: 候補群内の最小最大に基づく0〜1スケール。分母0なら中立値0.5）。PAIR/TRIPLEではDt側を重視する。
- 合成重み案: FREE/ODD/EVENでは0.4*Dm正規化+0.6*Dt正規化、PAIR/TRIPLEではDtを主評価。ただし係数はプレイテスト前の未承認案。
- Safety Engine合格後のみVariety Engineを評価。難易度別解法数帯EASY3〜8/NORMAL2〜5/HARD1〜3はソフト制約。

## TRIPLEの直近100問出題不足補正
- 直近100問の各出題機会について、TRIPLE安全候補の有無と実際のTRIPLE選択を別々に記録。
- 観測20問未満では倍率1.0。
- 20問以上は、TRIPLEの出題可能率と実出題率の差を使って出題不足を補正。倍率は最大1.25。
- 候補なしではTRIPLEを選ばない。出題不足補正は安全性に優先しない。
- 出題不足の具体的な目標頻度と補正式は未決。出題可能率の逆数をそのまま不足補正とみなさない。

## CI
`tools/verify-vol36.py`を追加し、GitHub Actionsで関連ファイル変更時に既存Vol.32〜35検証と一緒に実行する設定へ更新する。GitHub Actions上での実行成功は未確認。

## Vol.37の承認待ち
1. 次の数学的拡張: DOUBLEを導入／REVERSEを導入。
2. Variety正規化: MISSION内の候補群min-max正規化／固定された基準表で正規化。
3. TRIPLE目標頻度: 出題可能機会の20%を目標／まず実プレイ計測で決定。
