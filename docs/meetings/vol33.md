# Vol.33｜TRIPLEを含む安全集合への拡張
日付: 2026-10-23
状態: **すべて暫定案・未正式承認**。実ゲーム全体のG4は未証明。

## ユーザーの決定
- G4安全集合にTRIPLEを追加。
- CIは関連ファイル変更時のみ実行。
- Variety Engineは使用枚数・解法の多様性を優先。
- 既存方針: Safety Engine/Variety Engine分離、公開5枚と内部予約6枚目は変更不可、回答後に未公開末尾生成、直近100問のODD/EVEN統計は20問未満補正倍率1.0、上限1.25倍、EASY3〜8/NORMAL2〜5/HARD1〜3解法数帯はソフト制約。

## 実行済み全探索
C++17を新規作成しローカルでコンパイル・実行。数字1〜3の6枚盤面729種×任意の6枚予約キュー729種=531,441組。TARGETは盤面の非空部分集合和、全63選択マスクを位置IDで区別。現在のMISSIONが未達でも合計一致のTARGET CLEARは遷移に含む。予約キュー先頭k枚を選択位置昇順に補充。
```
states 6234408 routes 33480783
FREE   current 6234408 zero 0     total 69060354 min 4 max 15
PAIR   current 2088585 zero 0     total 20908809 min 1 max 5
TRIPLE current 2307285 zero 17820 total 21523251 min 0 max 6
```
- `current`: 現在MISSIONを達成するルートがある(盤面,予約キュー,TARGET)状態数。
- `zero`: 現在の**全TARGET一致ルート**の遷移先に共通して成立するNEXT TARGETが、指定NEXT MISSIONに対して0の状態数。
- NEXT TRIPLEは17,820状態（約0.286%）で事前公開できない。NEXT FREE/PAIRは全状態で候補がある。

## G4の構成
K={(B,Q,T,M) | B,Q∈{1,2,3}^6, M∈{FREE,PAIR,TRIPLE}, 現在MISSION CLEARが存在}。
任意S∈Kで、現在のすべてのTARGET一致ルートの後にPAIR成立する共通NEXT TARGET t'を、回答前に確定可能（全件検査でゼロ状態0）。
プレイヤーの任意のTARGET一致回答a後、次盤面B'はPAIR(t')成立。消費済みk枚の予約を補充した後、残存予約を変更せず、未公開末尾k枚を任意の{1,2,3}値で生成したQ'も{1,2,3}^6に含まれる。よって次状態(B',Q',t',PAIR)∈K。
Kは安全戦略「常にNEXT PAIR」に対して閉じる。帰納法により無期限継続できる。さらにNEXT TRIPLEの共通TARGETが存在する状態ではTRIPLEを選んでも遷移先はK内なので、任意回のTRIPLE挿入が可能。
**注意**: NEXT TRIPLEを強制できるわけではなく、毎回TRIPLEを出せる保証はない。数字1〜9、他MISSION、特殊タイル、REFRESHの保証でもない。

## Variety Engineの評価提案（未承認）
安全候補のみに対し、(1) MISSION CLEAR解法の使用枚数種類数、(2) TARGET CLEARも含む使用枚数種類数、(3) MISSION CLEARルート数の難易度帯適合、(4) 直近の解法枚数パターンとの重複、(5) 同種MISSION連続回避をソフト評価する。
PAIR/TRIPLEのMISSION CLEARはそれぞれ使用枚数固定のため、「使用枚数の多様性」は全TARGET一致ルートに対して別途測る。TARGET CLEARをMISSION CLEARとして誤算しない。
解法数や使用枚数多様性は安全性の絶対条件にしない。

## CI
`tools/verify-vol33.cpp` に全探索と集計値の回帰assert相当の終了コードを追加。
`.github/workflows/number-rush-safety.yml` を更新し、関連ファイル変更時のpush/PRと手動実行に限定。Vol.32とVol.33の両検証を実行。
**GitHub Actionsでの成功は未確認**。ローカル全探索の成功と混同しない。

## 次の会議 Vol.34 選択肢
1. G4拡張: ODD/EVENを安全集合へ追加／数字1〜4へ拡張。
2. Variety評価: 使用枚数の種類数を主指標／MISSION CLEARの解法数を主指標。
3. TRIPLE出題: 安全候補があれば積極採用／既存頻度を維持。
