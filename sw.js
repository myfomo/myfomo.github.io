// Fomo service worker: always tries the network first (fresh version), falls back to cache offline.
const CACHE='fomo-v47';
const SHELL=['./','index.html','style.css','app.js','version.json','config.js','manifest.webmanifest','vendor/supabase.js','vendor/leaflet.js','vendor/leaflet.css','vendor/leaflet.markercluster.js','vendor/markercluster.css','icons/icon-192.png','icons/icon-512.png'];
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

// push notifications
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch{d={title:'Fomo',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Fomo',{body:d.body||'',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:d.tag||undefined,renotify:!!d.tag,data:{url:d.url||'./'},dir:'rtl',lang:'he'}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if(c.url.startsWith(self.registration.scope)&&'focus' in c){return c.focus().then(w=>w&&w.navigate?w.navigate(url):null).catch(()=>clients.openWindow(url))}}return clients.openWindow(url)}))});
