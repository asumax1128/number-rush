/** Vol.51: UI adapter for TRIPLE persistence state.
 * Safe text-only view model. The game renders the returned object in its UI.
 * Does not change scoring, gameplay, mission probabilities, or stored telemetry.
 */
import {tripleStorageView,tripleStorageMessage} from './triple-storage-ui-v50.mjs';
export function createTripleStorageUIAdapter({runtime,onChange=()=>{}}){
 if(!runtime||typeof runtime.commitQuestion!=='function')throw TypeError('TRIPLE runtime required');
 let current={severity:'pending',code:'pending',title:'統計の保存状態を確認中',message:'保存機能を確認しています。',canPlay:true,canRetry:false};
 const publish=view=>{current=view;onChange({...view});return view;};
 const ready=Promise.resolve(runtime.ready).then(async ok=>{
  const status=await Promise.resolve(runtime.status);
  return publish(tripleStorageView({ready:ok===true,status}));
 }).catch(()=>publish(tripleStorageView({ready:false,status:'init-lock-failed'})));
 const commitQuestion=async(questionId,event)=>{
  await ready;
  let result;
  try{result=await runtime.commitQuestion(questionId,event);}
  catch{result={status:'lock-failed',recorded:false,saved:false};}
  const failure=tripleStorageMessage(result);
  if(failure)publish(failure);
  else if(current.severity!=='ok')publish(tripleStorageView({ready:true,status:'restored'}));
  return result;
 };
 return {ready,commitQuestion,getView:()=>({...current})};
}
