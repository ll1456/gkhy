/* 亳州考公·创业情报站 · Service Worker：资源离线缓存，数据每次联网刷新 */
var CACHE = 'bz-intel-v3';
var ASSETS = ['./','./index.html','./login.html','./app.css','./app.js','./data.js','./manifest.json','./icon-192.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  /* js/data.js 走网络优先，失败回缓存，保证数据新鲜 */
  if(req.url.indexOf('data.js')>-1){
    e.respondWith(fetch(req).then(function(r){ var cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(req,cp); }); return r; }).catch(function(){ return caches.match(req); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){ return hit || fetch(req).then(function(r){ var cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(req,cp); }); return r; }); }));
});
