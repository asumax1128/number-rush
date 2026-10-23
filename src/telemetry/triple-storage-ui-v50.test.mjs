import test from 'node:test';
import assert from 'node:assert/strict';
import {tripleStorageView,tripleStorageMessage} from './triple-storage-ui-v50.mjs';
test('Web Locks unavailable never claims save success',()=>{
 const v=tripleStorageView({ready:false,status:'lock-unavailable'});
 assert.equal(v.severity,'unavailable');assert.equal(v.canPlay,true);
 assert.match(v.message,/保存されません/);
});
test('corrupt data suggests recovery but not silent reset',()=>{
 const v=tripleStorageView({ready:false,status:'v2-corrupt'});
 assert.equal(v.severity,'recovery');assert.equal(v.canRetry,false);
 assert.match(v.message,/上書きは行いません/);
});
test('failed write reports non-persistence',()=>{
 const v=tripleStorageMessage({status:'save-failed',saved:false});
 assert.equal(v.code,'save-failed');assert.equal(v.canRetry,true);
});
test('success suppresses error and shows enabled state',()=>{
 assert.equal(tripleStorageMessage({status:'ok',saved:true}),null);
 assert.equal(tripleStorageView({ready:true,status:'restored'}).severity,'ok');
});
