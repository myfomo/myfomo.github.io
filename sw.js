// Fomo service worker: always tries the network first (fresh version), falls back to cache offline.
const CACHE='fomo-v11';
const SHELL=['./','index.html','style.css','app.js','config.js','manifest.webmanifest','vendor/supabase.js','vendor/leaflet.js','vendor/leaflet.css','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  const nav=e.request.mode==='navigate';
  const fresh=new Request(nav?u.origin+u.pathname:e.request.url,{cache:'no-cache',credentials:'same-origin'});
  e.respondWith(fetch(fresh).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(nav?'index.html':e.request,c))}return r})
    .catch(()=>caches.match(nav?'index.html':e.request).then(r=>r||caches.match('index.html'))));
});
