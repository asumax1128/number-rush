/** Vol.50: safe presentation state for TRIPLE statistics persistence.
 * No raw stored values or internal error messages are shown to players.
 * This is a UI view-model, not a DOM implementation.
 */
export function tripleStorageView({ready,status}){
 if(ready===true)return {severity:'ok',code:'available',title:'統計の保存は有効です',message:'TRIPLE統計をこのブラウザに保存できます。',canRetry:false,canPlay:true};
 const states={
  'lock-unavailable':['unavailable','統計の自動保存は利用できません','このブラウザでは複数タブの安全な保存を確認できません。ゲームは続けられますが、統計は保存されません。'],
  'corrupt':['recovery','保存データを確認してください','統計データを安全に読み込めませんでした。自動的な初期化や上書きは行いません。'],
  'v2-corrupt':['recovery','保存データを確認してください','統計データを安全に読み込めませんでした。自動的な初期化や上書きは行いません。'],
  'invalid-v1':['recovery','旧形式の保存データを確認してください','旧データの移行を停止しました。元のデータは保持しています。'],
  'write-failed':['retry','統計を保存できませんでした','保存領域が利用できない可能性があります。ゲームは続けられますが、記録は保証されません。'],
  'save-failed':['retry','統計を保存できませんでした','保存領域が利用できない可能性があります。ゲームは続けられますが、記録は保証されません。'],
  'storage-unavailable':['unavailable','統計の自動保存は利用できません','ブラウザの保存領域を読み込めません。ゲームは続けられますが、統計は保存されません。'],
  'read-failed':['unavailable','統計の自動保存は利用できません','ブラウザの保存領域を読み込めません。ゲームは続けられますが、統計は保存されません。'],
  'lock-failed':['retry','統計の保存を確認できませんでした','ほかのタブとの同期に失敗しました。記録は保証されません。'],
  'init-lock-failed':['retry','統計の初期化を確認できませんでした','ほかのタブとの同期に失敗しました。記録は保証されません。']
 };
 const [severity,title,message]=states[status]??['retry','統計の保存状況を確認できません','統計を保存できるか確認できません。ゲームは続けられます。'];
 return {severity,code:status??'unknown',title,message,canRetry:severity==='retry',canPlay:true};
}
export function tripleStorageMessage(result){
 if(result?.status==='ok'&&result.saved===true)return null;
 return tripleStorageView({ready:false,status:result?.status??'unknown'});
}
