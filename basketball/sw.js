// Just Hoop service worker: precaches the app shell, caches anything else as it's used.
// Bump VERSION when shipping changes to force a fresh precache.
const VERSION='justhoop-v1';
const SHELL=[
  './', 'index.html', 'manifest.webmanifest', 'lib/three.min.js', 'sfx/roll.mp3',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k.startsWith('justhoop-') && k!==VERSION).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

// network-first for pages & manifests, so updates show up as soon as you're online
async function networkFirst(req){
  const cache=await caches.open(VERSION);
  try{
    const res=await fetch(req);
    if(res.ok) cache.put(req, res.clone());
    return res;
  }catch(err){
    const hit=await cache.match(req, {ignoreSearch:true}) || (req.mode==='navigate' && await cache.match('index.html'));
    if(hit) return hit;
    throw err;
  }
}

// stale-while-revalidate for scripts, sounds, icons
async function staleWhileRevalidate(e){
  const cache=await caches.open(VERSION);
  const hit=await cache.match(e.request);
  const net=fetch(e.request).then(res=>{ if(res.ok) cache.put(e.request, res.clone()); return res; });
  if(hit){ e.waitUntil(net.catch(()=>{})); return hit; }
  return net;
}

self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET' || new URL(req.url).origin!==location.origin) return;
  if(req.headers.has('range')) return;
  const path=new URL(req.url).pathname;
  if(req.mode==='navigate' || path.endsWith('/') || /\.(html|json|webmanifest)$/.test(path))
    e.respondWith(networkFirst(req));
  else
    e.respondWith(staleWhileRevalidate(e));
});
