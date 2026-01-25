/**
 * Adapted for block-garden
 * Bundled by jsDelivr using Rollup v2.79.2 and Terser v5.39.0.
 * Original file: /npm/signal-polyfill@0.2.2/dist/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var e=Object.defineProperty,r=(r,o,t)=>(((r,o,t)=>{o in r?e(r,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[o]=t})(r,"symbol"!=typeof o?o+"":o,t),t),o=(e,r)=>{if(Object(r)!==r)throw TypeError('Cannot use the "in" operator on this value');return e.has(r)},t=(e,r,o)=>{if(r.has(e))throw TypeError("Cannot add the same private member more than once");r instanceof WeakSet?r.add(e):r.set(e,o)},n=(e,r,o)=>(((e,r,o)=>{if(!r.has(e))throw TypeError("Cannot "+o)})(e,r,"access private method"),o);
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function i(e,r){return Object.is(e,r)}
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */let u=null,d=!1,s=1;const c=Symbol("SIGNAL");function a(e){const r=u;return u=e,r}const l={version:0,lastCleanEpoch:0,dirty:!1,producerNode:void 0,producerLastReadVersion:void 0,producerIndexOfThis:void 0,nextProducerIndex:0,liveConsumerNode:void 0,liveConsumerIndexOfThis:void 0,consumerAllowSignalWrites:!1,consumerIsAlwaysLive:!1,producerMustRecompute:()=>!1,producerRecomputeValue:()=>{},consumerMarkedDirty:()=>{},consumerOnSignalRead:()=>{}};function p(e){if(d)throw new Error("undefined"!=typeof ngDevMode&&ngDevMode?"Assertion error: signal read during notification phase":"");if(null===u)return;u.consumerOnSignalRead(e);const r=u.nextProducerIndex++;if(C(u),r<u.producerNode.length&&u.producerNode[r]!==e&&g(u)){m(u.producerNode[r],u.producerIndexOfThis[r])}u.producerNode[r]!==e&&(u.producerNode[r]=e,u.producerIndexOfThis[r]=g(u)?w(e,u,r):0),u.producerLastReadVersion[r]=e.version}function h(e){if(e.dirty||e.lastCleanEpoch!==s){if(!e.producerMustRecompute(e)&&!function(e){C(e);for(let r=0;r<e.producerNode.length;r++){const o=e.producerNode[r],t=e.producerLastReadVersion[r];if(t!==o.version)return!0;if(h(o),t!==o.version)return!0}return!1}(e))return e.dirty=!1,void(e.lastCleanEpoch=s);e.producerRecomputeValue(e),e.dirty=!1,e.lastCleanEpoch=s}}function f(e){if(void 0===e.liveConsumerNode)return;const r=d;d=!0;try{for(const r of e.liveConsumerNode)r.dirty||v(r)}finally{d=r}}function v(e){var r;e.dirty=!0,f(e),null==(r=e.consumerMarkedDirty)||r.call(e.wrapper??e)}function w(e,r,o){var t;if(y(e),C(e),0===e.liveConsumerNode.length){null==(t=e.watched)||t.call(e.wrapper);for(let r=0;r<e.producerNode.length;r++)e.producerIndexOfThis[r]=w(e.producerNode[r],e,r)}return e.liveConsumerIndexOfThis.push(o),e.liveConsumerNode.push(r)-1}function m(e,r){var o;if(y(e),C(e),"undefined"!=typeof ngDevMode&&ngDevMode&&r>=e.liveConsumerNode.length)throw new Error(`Assertion error: active consumer index ${r} is out of bounds of ${e.liveConsumerNode.length} consumers)`);if(1===e.liveConsumerNode.length){null==(o=e.unwatched)||o.call(e.wrapper);for(let r=0;r<e.producerNode.length;r++)m(e.producerNode[r],e.producerIndexOfThis[r])}const t=e.liveConsumerNode.length-1;if(e.liveConsumerNode[r]=e.liveConsumerNode[t],e.liveConsumerIndexOfThis[r]=e.liveConsumerIndexOfThis[t],e.liveConsumerNode.length--,e.liveConsumerIndexOfThis.length--,r<e.liveConsumerNode.length){const o=e.liveConsumerIndexOfThis[r],t=e.liveConsumerNode[r];C(t),t.producerIndexOfThis[o]=r}}function g(e){var r;return e.consumerIsAlwaysLive||((null==(r=null==e?void 0:e.liveConsumerNode)?void 0:r.length)??0)>0}function C(e){e.producerNode??(e.producerNode=[]),e.producerIndexOfThis??(e.producerIndexOfThis=[]),e.producerLastReadVersion??(e.producerLastReadVersion=[])}function y(e){e.liveConsumerNode??(e.liveConsumerNode=[]),e.liveConsumerIndexOfThis??(e.liveConsumerIndexOfThis=[])}
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function N(e){if(h(e),p(e),e.value===x)throw e.error;return e.value}const S=Symbol("UNSET"),T=Symbol("COMPUTING"),x=Symbol("ERRORED"),I=(()=>({...l,value:S,dirty:!0,error:null,equal:i,producerMustRecompute:e=>e.value===S||e.value===T,producerRecomputeValue(e){if(e.value===T)throw new Error("Detected cycle in computations.");const r=e.value;e.value=T;const o=function(e){return e&&(e.nextProducerIndex=0),a(e)}(e);let t,n=!1;try{t=e.computation.call(e.wrapper);n=r!==S&&r!==x&&e.equal.call(e.wrapper,r,t)}catch(r){t=x,e.error=r}finally{!function(e,r){if(a(r),e&&void 0!==e.producerNode&&void 0!==e.producerIndexOfThis&&void 0!==e.producerLastReadVersion){if(g(e))for(let r=e.nextProducerIndex;r<e.producerNode.length;r++)m(e.producerNode[r],e.producerIndexOfThis[r]);for(;e.producerNode.length>e.nextProducerIndex;)e.producerNode.pop(),e.producerLastReadVersion.pop(),e.producerIndexOfThis.pop()}}(e,o)}n?e.value=r:(e.value=t,e.version++)}}))();let O=
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function(){throw new Error};function b(){return p(this),this.value}function E(e,r){!1===(null==u?void 0:u.consumerAllowSignalWrites)&&O(),e.equal.call(e.wrapper,e.value,r)||(e.value=r,function(e){e.version++,s++,f(e)}
/**
 * @license
 * Copyright 2024 Bloomberg Finance L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(e))}const W=(()=>({...l,equal:i,value:void 0}))();const R=Symbol("node");var k;(e=>{var i,s,h,f;i=R,s=new WeakSet,e.isState=e=>"object"==typeof e&&o(s,e),e.State=class{constructor(o,n={}){t(this,s),r(this,i);const u=
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function(e){const r=Object.create(W);r.value=e;const o=()=>(p(r),r.value);return o[c]=r,o}(o),d=u[c];if(this[R]=d,d.wrapper=this,n){const r=n.equals;r&&(d.equal=r),d.watched=n[e.subtle.watched],d.unwatched=n[e.subtle.unwatched]}}get(){if(!(0,e.isState)(this))throw new TypeError("Wrong receiver type for Signal.State.prototype.get");return b.call(this[R])}set(r){if(!(0,e.isState)(this))throw new TypeError("Wrong receiver type for Signal.State.prototype.set");if(d)throw new Error("Writes to signals not permitted during Watcher callback");E(this[R],r)}};h=R,f=new WeakSet,e.isComputed=e=>"object"==typeof e&&o(f,e),e.Computed=class{constructor(o,n){t(this,f),r(this,h);const i=function(e){const r=Object.create(I);r.computation=e;const o=()=>N(r);return o[c]=r,o}(o),u=i[c];if(u.consumerAllowSignalWrites=!0,this[R]=u,u.wrapper=this,n){const r=n.equals;r&&(u.equal=r),u.watched=n[e.subtle.watched],u.unwatched=n[e.subtle.unwatched]}}get(){if(!(0,e.isComputed)(this))throw new TypeError("Wrong receiver type for Signal.Computed.prototype.get");return N(this[R])}},(i=>{var d,s,c,h;i.untrack=function(e){let r,o=null;try{o=a(null),r=e()}finally{a(o)}return r},i.introspectSources=function(r){var o;if(!(0,e.isComputed)(r)&&!(0,e.isWatcher)(r))throw new TypeError("Called introspectSources without a Computed or Watcher argument");return(null==(o=r[R].producerNode)?void 0:o.map((e=>e.wrapper)))??[]},i.introspectSinks=function(r){var o;if(!(0,e.isComputed)(r)&&!(0,e.isState)(r))throw new TypeError("Called introspectSinks without a Signal argument");return(null==(o=r[R].liveConsumerNode)?void 0:o.map((e=>e.wrapper)))??[]},i.hasSinks=function(r){if(!(0,e.isComputed)(r)&&!(0,e.isState)(r))throw new TypeError("Called hasSinks without a Signal argument");const o=r[R].liveConsumerNode;return!!o&&o.length>0},i.hasSources=function(r){if(!(0,e.isComputed)(r)&&!(0,e.isWatcher)(r))throw new TypeError("Called hasSources without a Computed or Watcher argument");const o=r[R].producerNode;return!!o&&o.length>0};d=R,s=new WeakSet,c=new WeakSet,h=function(r){for(const o of r)if(!(0,e.isComputed)(o)&&!(0,e.isState)(o))throw new TypeError("Called watch/unwatch without a Computed or State argument")},e.isWatcher=e=>o(s,e),i.Watcher=class{constructor(e){t(this,s),t(this,c),r(this,d);let o=Object.create(l);o.wrapper=this,o.consumerMarkedDirty=e,o.consumerIsAlwaysLive=!0,o.consumerAllowSignalWrites=!1,o.producerNode=[],this[R]=o}watch(...r){if(!(0,e.isWatcher)(this))throw new TypeError("Called unwatch without Watcher receiver");n(this,c,h).call(this,r);const o=this[R];o.dirty=!1;const t=a(o);for(const e of r)p(e[R]);a(t)}unwatch(...r){if(!(0,e.isWatcher)(this))throw new TypeError("Called unwatch without Watcher receiver");n(this,c,h).call(this,r);const o=this[R];C(o);for(let e=o.producerNode.length-1;e>=0;e--)if(r.includes(o.producerNode[e].wrapper)){m(o.producerNode[e],o.producerIndexOfThis[e]);const r=o.producerNode.length-1;if(o.producerNode[e]=o.producerNode[r],o.producerIndexOfThis[e]=o.producerIndexOfThis[r],o.producerNode.length--,o.producerIndexOfThis.length--,o.nextProducerIndex--,e<o.producerNode.length){const r=o.producerIndexOfThis[e],t=o.producerNode[e];y(t),t.liveConsumerIndexOfThis[r]=e}}}getPending(){if(!(0,e.isWatcher)(this))throw new TypeError("Called getPending without Watcher receiver");return this[R].producerNode.filter((e=>e.dirty)).map((e=>e.wrapper))}},i.currentComputed=function(){var e;return null==(e=u)?void 0:e.wrapper},i.watched=Symbol("watched"),i.unwatched=Symbol("unwatched")})(e.subtle||(e.subtle={}))})(k||(k={}));export{k as Signal};export default null;
//# sourceMappingURL=/sm/a3a271527815be22003270a0a76196ff842735d376c170afc63b4dbaa9750c45.map
/**
 * instead of: import { Signal } from "https://esm.run/signal-polyfill@0.2.2";
 * add required workaround
*/
const Signal = k;

/**
 * Adapted for block-garden
 * Bundled by jsDelivr using Rollup v2.79.2 and Terser v5.39.0.
 * Original file: /npm/signal-utils@0.21.1/dist/index.ts.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
// import{Signal as e}from"https://cdn.jsdelivr.net/npm/signal-polyfill@0.2.2/+esm";
function z(...t){if("accessor"===t[1].kind)return function(t,n){const{get:r}=t;if("accessor"!==n.kind)throw new Error("Expected to be used on an accessor property");return{get(){return r.call(this).get()},set(e){r.call(this).set(e)},init:t=>new e.State(t)}}(...t);if("getter"===t[1].kind)return function(t,n){if("getter"!==n.kind)throw new Error("Can only use @cached on getters.");const r=new WeakMap;return function(){let n=r.get(t);n||(n=new WeakMap,r.set(t,n));let o=n.get(this);return o||(o=new e.Computed((()=>t.call(this))),n.set(this,o)),o.get()}}(...t);throw new Error("@signal can only be used on accessors or getters")}export{z as signal};
// export default null;
//# sourceMappingURL=/sm/09defb0d9a707fff01dd1b323c10a8835d3b27036a2e3d5822b197432a70a0ed.map
/**
 * instead of import { signal } from "https://esm.run/signal-utils@0.21.1"
 */

/**
 * effect implementation from: https://github.com/proposal-signals/signal-polyfill/blob/4cf87cef28aa89e938f079e4d82e9bf10f6d0a4c/README.md
 */
let needsEnqueue = true;

const watcher = new Signal.subtle.Watcher(() => {
  if (needsEnqueue) {
    needsEnqueue = false;

    globalThis.queueMicrotask(processPending);
  }
});

function processPending() {
  needsEnqueue = true;

  for (const pendingSignals of watcher.getPending()) {
    pendingSignals.get();
  }

  watcher.watch();
}

/**
 * Registers a reactive side effect that is executed whenever any signals accessed
 * within the `callback` are updated. If the `callback` returns a cleanup function,
 * it will be called before the next effect execution and when the effect is disposed.
 *
 * Caution: Mutating a signal within its own effect may produce an infinite loop.
 * See the README for details.
 *
 * @param {() => (void | (() => void))} callback -
 *   Function executed when dependent signals change. If it returns a function,
 *   that function is used as a cleanup and called before the next invocation or disposal.
 *
 * @returns {() => void} Dispose function: when called, the effect stops reacting
 *   and any registered cleanup is invoked.
 *
 * @example
 * import { effect, Signal } from 'signal.mjs';
 *
 * const counter = new Signal.State(0);
 * const isEven = new Signal.Computed(() => (counter.get() & 1) === 0);
 * const parity = new Signal.Computed(() => (isEven.get() ? "even" : "odd"));
 *
 * // Logs "even" immediately, then on every counter change
 * const dispose = effect(() => {
 *   console.log(parity.get());
 * });
 *
 * setInterval(() => counter.set(counter.get() + 1), 1000);
 *
 * // To clean up:
 * // dispose();
 */
export function effect(callback) {
  let cleanup;

  const computed = new Signal.Computed(() => {
    typeof cleanup === "function" && cleanup();

    cleanup = callback();
  });

  watcher.watch(computed);
  computed.get();

  return () => {
    watcher.unwatch(computed);

    typeof cleanup === "function" && cleanup();

    cleanup = undefined;
  };
}
