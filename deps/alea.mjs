/**
 * Adapted for block-garden
 * Bundled by jsDelivr using Rollup v2.79.2 and Terser v5.39.0.
 * Original file: /npm/alea@1.0.1/alea.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self&&self;var n={exports:{}},t=n.exports=function(){return n.importState=function(t){
  //@ts-ignore
  var e=new n;
  return e.importState(t),e},n;function n(){return function(n){var e=0,r=0,o=0,a=1;0==n.length&&(n=[+new Date]);var u=t();e=u(" "),r=u(" "),o=u(" ");for(var i=0;i<n.length;i++)(e-=u(n[i]))<0&&(e+=1),(r-=u(n[i]))<0&&(r+=1),(o-=u(n[i]))<0&&(o+=1);u=null;var f=function(){var n=2091639*e+2.3283064365386963e-10*a;return e=r,r=o,o=n-(a=0|n)};return f.next=f,f.uint32=function(){return 4294967296*f()},f.fract53=function(){return f()+11102230246251565e-32*(2097152*f()|0)},f.version="Alea 0.9",f.args=n,f.exportState=function(){return[e,r,o,a]},f.importState=function(n){e=+n[0]||0,r=+n[1]||0,o=+n[2]||0,a=+n[3]||0},f}(Array.prototype.slice.call(arguments))}function t(){var n=4022871197,t=function(t){t=t.toString();for(var e=0;e<t.length;e++){var r=.02519603282416938*(n+=t.charCodeAt(e));r-=n=r>>>0,n=(r*=n)>>>0,n+=4294967296*(r-=n)}return 2.3283064365386963e-10*(n>>>0)};return t.version="Mash 0.9",t}}();export{t as default};
//# sourceMappingURL=/sm/9adba281fe299b0e535acaa1a57234f53d0c70086be5098c8600f82e06ebdefa.map
