const CACHE_NAME = "faretrack-shell-v2";
const APP_SHELL = ["./", "./index.html", "./style.css", "./script.js", "./pwa.js", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
 const req=event.request, url=new URL(req.url);
 // Never cache Supabase/auth/API or third-party requests.
 if(url.origin!==self.location.origin || req.method!=="GET") return;
 if(req.mode==="navigate") { event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put("./index.html",copy));return res;}).catch(()=>caches.match("./index.html"))); return; }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy));}return res;})));
});
