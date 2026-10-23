# NUMBER×RUSH Vol.59｜PAIR・TRIPLE・ODD・EVENからFREE核への帰還定理（暫定）
日付: 2026-10-23

## 対象
Vol.58の数字1〜3、NORMAL/DOUBLE、位置付き6タイル、予約キュー6枚、全TARGET一致ルートを許す有限モデル。現MISSIONは`m∈{PAIR,TRIPLE,ODD,EVEN}`。FREE安全核を`K_FREE`とする。

## 定義
`H_m(b)`をボード`b`でMISSION CLEAR可能なTARGETの集合、`H_FREE(b)`をTARGET一致可能なTARGET集合とする。現状態`(b,q,t,m)`のG1は`t∈H_m(b)`。
`A(b,t)`は**MISSION CLEARに限らず**すべてのTARGET一致非空部分集合（TARGET CLEARも含む）。
`b_a=T(b,q,a)`は予約キューを位置昇順で補充した後のボード。
`C_FREE(b,q,t)=⋂_{a∈A(b,t)}H_FREE(b_a)`。

## 帰還定理
Vol.57全件探索の補題`C_FREE(b,q,t)≠∅`は、**現MISSIONとは独立**に、現ボードでTARGETが成立するすべての`(b,q,t)`について成り立つ。
ゆえに任意の`m∈{PAIR,TRIPLE,ODD,EVEN}`と`t∈H_m(b)`について、`t∈H_FREE(b)`なので`A(b,t)`は非空であり、`t'∈C_FREE(b,q,t)`を現在の回答前に選べる。
全回答`a∈A(b,t)`の後で`t'∈H_FREE(b_a)`。未消費キューを保持し後続を同じ6種類から生成すれば、どの次キュー`q'`でも`(b_a,q',t',FREE)∈K_FREE`。
したがって**G1を満たす現MISSION状態は、NEXT FREEを選べば全TARGET一致回答分岐で1手後にFREE核へ帰還できる**。

## 何が証明できたか
- 5種類の現MISSIONすべてで、G1成立状態からNEXT FREEに帰還する「1手の安全性」。
- G1を満たす現MISSIONを初期状態として、次をFREEとし、以降FREEを維持すれば、限定モデルで無限継続可能。
- 現MISSIONの解法数やプレイヤーの回答の選び方には依存しない（TARGET一致ならすべて列挙）。

## 何を証明していないか
- NEXT PAIR/TRIPLE/ODD/EVENを常に公開できるとは言えない。Vol.57には各MISSIONの共通候補ゼロの状態が存在する。
- 現MISSIONのG1を満たさない状態を安全とは呼べない。
- 多MISSIONを無制限に繰り返しても多様性を保てる、という保証はない。MISSION切替の候補は毎回`⋂_{a∈A(b,t)}H_{m'}(b_a)`で検証し、なければNEXT FREEに退避する。
- REFRESHを含むG3、REVERSE、数字4〜9、実ゲームの全キュー生成・タイミング、特殊タイルの追加は未証明。
- 本Vol.59では6位置の全件探索を再実行していない。**Vol.57の全件検証を補題として用いる論理的帰結**である。

## Varietyへの指針
1. まず安全候補`m',t'`を列挙。候補は全回答分岐の共通集合のみ。
2. その中でVariety Engineが解法数・使用枚数種類数・MISSION頻度を最適化。
3. PAIR/TRIPLE/ODD/EVENの候補がない場合はFREEに退避する。
4. FREE帰還可能性は証明されたが、REFRESH操作の安全性は別途検証する。
