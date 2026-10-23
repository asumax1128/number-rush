# NUMBER×RUSH Vol.55｜ゲーム本体とテレメトリーの接続契約（暫定）
日付: 2026-10-23

## 重要：接続対象
本リポジトリの `src` 配下には `telemetry` のみが存在し、ゲーム本体のHTMLや判定関数は未収録。以下は**実ゲーム側が満たすべき接続契約**であり、実ゲームへの配線完了を意味しない。

## 起動時の一度だけの初期化
```js
import {connectVarietyToAdjudication} from './src/telemetry/variety-adjudication-v54.mjs';
import {mountTripleStatusInGame} from './src/telemetry/triple-hud-mount-v54.mjs';
const variety = connectVarietyToAdjudication({
  storage: localStorage, locks: navigator.locks, cryptoProvider: crypto,
  onPersistenceStatus: status => console.warn('Variety storage status', status)
});
const triple = mountTripleStatusInGame({
  hud: document.querySelector('[data-game-hud]'),
  storage: localStorage, locks: navigator.locks
});
```
※サンプルコード。実ゲームのDOMセレクタ・モジュール解決パスはゲーム側で決定する。Web Locks未対応の場合、ゲーム進行を止めず統計書き込みのみ無効化。

## 回答判定の唯一の確定点
**先に**TARGET一致判定、MISSION CLEAR/TARGET CLEAR/MISSの分類、得点/CHAIN/時計、消費タイルと補充、次問の確定をゲーム本体で完了する。**その後**、回答につき一度だけ：
```js
const {event,persistence}=await variety.onAdjudicated({
  finalized:true,
  outcome:'MISSION_CLEAR', // 'TARGET_CLEAR' | 'MISS'
  consumedTileCount:3       // MISS は0
});
```
- `outcome`は厳密に`MISSION_CLEAR`、`TARGET_CLEAR`、`MISS`のいずれか。
- MISSION/TARGET CLEARは消費枚数1〜6。MISSは0。
- `finalized:true`はゲーム本体が判定確定済みと保証する印であり、統計側はゲームの判定を再計算しない。
- 回答IDはVol.52のセッション128-bit乱数＋単調増加通番で、判定確定イベントを初めて送信したとき発行。再送は`variety.retry(event)`に**元のevent**を渡す。再送時に`onAdjudicated`を呼び直さない。
- `onAdjudicated`は保存結果を返すが、ゲームの点数・盤面・時間・勝敗を変更しない。保存失敗はプレイを中断させない。
- 同一回答の二重イベント発火はゲーム側で防ぐ必要がある。別々に`onAdjudicated`を2回呼べば別IDが生成されるため、統計側で同一回答と判定できない。ゲーム本体は単一の回答確定点を設け、処理中フラグ等で再入を防ぐ。
- `MISS`も回答IDは発行されるがVarietyの20件履歴には入らない。
- `crypto.getRandomValues`がない場合は初期化失敗。ゲーム本体は統計を無効にしてプレイを続ける（接続時にtry/catch）。
- 履歴の重複排除はVol.47の直近ID範囲内のみ。セッションを跨ぐ永続的なexactly-once保証はしない。

## 問題確定時のTRIPLE統計
**Safety Engineが出題可能MISSIONを確定→Variety Engineが問題を採用→問題IDと出題情報を固定**した後に一度だけ：
```js
await triple.commitQuestion(questionId,{
  difficulty:'NORMAL',
  safeMissions:['FREE','PAIR','TRIPLE'],
  selectedMission:'TRIPLE',
  missionClearSolutions:3,
  targetTileCountKinds:2
});
```
- `questionId`は英数字、`_`、`-`からなる1〜96文字で、ゲーム本体が生成する。リトライ時は同一IDを再利用する。
- `safeMissions`はSafety Engineで安全性を証明済みのMISSION名のみ。
- `missionClearSolutions`はMISSION CLEARルート数、`targetTileCountKinds`はTARGET一致全ルートの使用枚数種類数。
- 保存失敗時はHUDに警告を出すがゲームは継続。安全でないlocalStorage直書きにはフォールバックしない。
- `triple.ready`をawaitしてから状態確認できる。HUDは`pending`→`ok`/`unavailable`/`recovery`などへ自動更新。
- TRIPLE出題補正はまだ1.0（無効）。統計ログの有無はSafety Engineの判定に影響しない。

## 本体統合の受け入れ条件
1. MISSION CLEAR/TARGET CLEARのみVarietyに記録、MISSは除外。
2. 再送で回答IDを変更しない。重複したIDは直近保持範囲で除外。
3. 問題確定イベントは問題ごとに1回。別タブではWeb Locksで排他保存。
4. HUDは初期表示、保存成功、保存失敗、Web Locks非対応、破損時を表示。
5. 保存不能でもゲーム本体の進行・点数・時間は不変。
6. ブラウザ実機でlocalStorageとWeb Locks、ページ再読み込み、複数タブ、アクセシビリティを検証。
7. ゲーム本体が未収録のため、これらの実ゲーム受け入れ条件は**未達**。
