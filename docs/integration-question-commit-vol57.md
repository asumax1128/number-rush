# NUMBER×RUSH Vol.57｜問題確定点とTRIPLE統計の接続仕様（暫定）
日付: 2026-10-23

## 接続する場所
本リポジトリにはゲーム本体の判定・問題生成HTML/JSが未収録。したがって以下は**実装側への具体的な接続契約**であり、本体へコードを差し込んだという意味ではない。

### 1. 初期化はページ起動時に一度だけ
```js
import {createQuestionCommitter} from '../src/telemetry/question-commit-v56.mjs';
const triple = createQuestionCommitter({
  hud: document.querySelector('[data-game-hud]'),
  storage: localStorage,
  locks: navigator.locks,
  cryptoProvider: crypto,
  onWarning: (code,error)=>console.warn(code,error)
});
```
- ゲーム画面には`[data-game-hud]`コンテナを設置。DOMマウントは既存HUDを壊さない。
- Web Locksなしでは保存を無効にし、プレイは続行。
- `crypto.getRandomValues`が使えない場合は統計機能の初期化を失敗として扱い、ゲーム本体の進行は止めない。

### 2. 問題の唯一の確定点
**Safety Engine**がG1/G2/G3/G4対象の安全性を確認し、**Variety Engine**が候補を選び、ゲーム本体がTARGET・MISSION・盤面・公開NEXT5枚と内部予約6枚目を確定してから、次の呼び出しを1回だけ行う。
```js
const telemetry = await triple.commit({
  questionKey: gameSessionKey + '_' + questionSequence, // 同一問題で不変
  finalized: true,
  difficulty: 'NORMAL',
  safeMissions: ['FREE','PAIR','TRIPLE'], // Safety Engineで確認済み
  selectedMission: 'TRIPLE',
  missionClearSolutions: 3,
  targetTileCountKinds: 2
});
```
- `questionKey`は英数字、`_`、`-`のみ、長さ1〜96文字。**ゲーム本体が確定前に一度作り、同一問題の重複通知には同じ値を渡す**。
- `safeMissions`は「この状態から安全に出題可能と証明した候補」のみ。単にMISSION CLEAR解が存在するだけでG4保証を満たすとみなさない。
- `selectedMission`は必ず`safeMissions`に含む。
- `missionClearSolutions`は現問題のMISSION CLEARルート数、`targetTileCountKinds`はTARGET一致全ルートの使用枚数種類数。
- 問題IDは`q_<128bit-session>_<ordinal>`で生成され、`commit`の戻り値`questionId`に含まれる。保存に失敗しても同じ`questionKey`の再通知は同じIDを返す。
- 同一`questionKey`で異なる問題内容を送信した場合は衝突として拒否。
- 統計はゲームのTARGET・MISSION・NEXT QUEUEや得点を**絶対に変更しない**。

### 3. 失敗と復旧
- 統計の書き込み失敗・ロック非対応・破損データはHUDに警告を出し、ゲームは継続。
- Vol.56のメモリゲートは直近512件のみ。再起動後に同一問題キーを再通知しても新IDが発行され得る。これを**再起動後の完全な重複防止**とは扱わない。
- TRIPLE統計の永続層はquestionId単位の冪等保存を行う。ゲーム本体は問題の生成時点で確定キーを保持し、問題の再表示・アニメーション再実行で二度目の`commit`を呼ばない。
- 永続的な「問題キー→ID」の対応付け、保存失敗時の自動再送は今後の課題。Web Locksがない環境でlocalStorageへの危険な直接書き込みにフォールバックしない。

### 4. 実ゲーム統合の受け入れテスト
1. 出題確定前には統計イベントを発火しない。
2. 正式に確定した問題で1回のみ統計記録。
3. 重複イベントは同一questionIdを返し、統計が二重計上されない。
4. 異なるMISSIONや解法数を同じquestionKeyで送ると拒否。
5. 保存失敗でもゲームのTARGET、公開キュー、得点、時計は不変。
6. Web Locks非対応、複数タブ、再読み込み、保存データ破損を実ブラウザで確認。
7. 本体コード未収録のため、これらは**未実施**。

## Variety再送との関係
Vol.57の`createVarietyRetryCoordinator`は、回答確定イベントを扱う**別の**機能。TRIPLE問題確定イベントをVariety回答再送キューに混ぜない。Variety再送は元のanswerIdを保持し、Web Locksで安全に保存できるときだけ明示的に`drain()`する。メモリキューは再読み込みで消える。
