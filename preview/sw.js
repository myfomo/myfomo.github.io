// Preview of the next update: no caching here (so it never touches the live app's offline copy), only notifications.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch{d={title:'Fomo',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'Fomo',{body:d.body||'',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:d.tag||undefined,dir:'rtl',lang:'he',data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow((e.notification.data&&e.notification.data.url)||'./'))});
