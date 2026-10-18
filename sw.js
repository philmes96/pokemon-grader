const C='cheesegrader-static-v3';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'])));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{e.waitUntil(clients.claim());});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.hostname==='api.pokemontcg.io')return; // API always network
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
      if(r.ok&&url.origin===location.origin)caches.open(C).then(c=>c.put(e.request,r.clone()));
      return r;
    }).catch(()=>hit))
  );
});
