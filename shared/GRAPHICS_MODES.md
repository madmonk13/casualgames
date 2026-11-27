# Graphics modes: Auto / High / Medium / Low

How the Just games (Just Roll, Just Hoop, Just Bowl, Just Golf, Just Putt) handle graphics quality, written so another three.js game can adopt the same scheme. The reference implementation is `skeeball/index.html` (Just Roll); search it for the names used below.

## What the player sees

- **Settings → Graphics:** four choices, **Auto · High · Medium · Low**. Under Auto, a small label shows the tier it picked, for example "Auto · Medium".
- **Changing the choice reloads the page** and reopens Settings, because a tier changes how the scene is built.
- **Auto picks a tier on first load** from the GPU name. While playing, it then lowers resolution, and if needed the tier, when the game runs slow.
- **Auto tier drops happen at a natural break,** such as a new game or next hole. A note then says: "Graphics set to Medium for smoother play. You can change it in Settings."
- **A "Show frame rate" toggle** in Settings displays fps, frame time, CPU time, hitches, tier, pixel ratio, draw calls and triangles.

## Settings and storage

```js
const settings = { /* …game settings… */ gfx: 'auto', gfxAuto: null, fps: false };
const GFX_NAMES = ['Low', 'Medium', 'High'];
let PERF = false, GFX = 2, RES_SCALE = 1;   // GFX: 0 Low, 1 Medium, 2 High. PERF === (GFX === 0)
```

- **`settings.gfx`:** the player's choice, one of `'auto'`, `'high'`, `'medium'` or `'low'`.
- **`settings.gfxAuto`:** the tier Auto settled on, from 0 to 2. It is saved, so Auto remembers a step-down between visits. Choosing Auto again in Settings resets it to `null`, so detection runs again.
- **`RES_SCALE`:** a runtime resolution trim used only by Auto. It is not saved.
- **Migration:** older games had an `optimized` checkbox. When loading settings, `if(raw.gfx==null && raw.optimized) settings.gfx='low';`. Keep writing `settings.optimized = PERF` for anything that still reads it.

## Auto-detect on load

```js
function gpuGuess(){ try{ const c=document.createElement('canvas'), gl=c.getContext('webgl'); if(!gl) return 0;
    const e=gl.getExtension('WEBGL_debug_renderer_info'), s=String(e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)), lose=gl.getExtension('WEBGL_lose_context'); if(lose) lose.loseContext();
    if(/swiftshader|llvmpipe|software|basic render/i.test(s)) return 0;     // software rendering → Low
    if(/nvidia|geforce|quadro|radeon (rx|pro)|apple m\d (pro|max|ultra)|apple m[3-9]/i.test(s)) return 2;   // discrete / big Apple GPUs → High
    return 1; }catch(e){ return 1; } }                                     // everything else (phones, tablets, integrated) → Medium
function resolveGfx(){ const g=settings.gfx; if(g==='high') return 2; if(g==='medium') return 1; if(g==='low') return 0;
  if(settings.gfxAuto==null){ settings.gfxAuto=gpuGuess(); saveSettings(); } return Math.max(0,Math.min(2,settings.gfxAuto|0)); }
```

Call `resolveGfx()` once at scene build, before creating the renderer:

```js
GFX=resolveGfx(); PERF=GFX===0; settings.optimized=PERF;
renderer=new THREE.WebGLRenderer({antialias:GFX===2, powerPreference:PERF?'low-power':'high-performance'});
```

Notes:
- **Pick conservatively.** The guess only has to be a reasonable start, because the runtime step-down corrects it. Phones and tablets start at Medium. An older device that struggles drops to Low on its own within a game or two.
- **Release the probe context.** The canvas probe uses its own WebGL context, so call `loseContext()` on it right away to avoid holding a second context.

## What each tier changes

The tier is read once at build time; every choice below is a plain `GFX===2` / `PERF` check where the object is made.

| | High (2) | Medium (1) | Low (0) |
|---|---|---|---|
| Antialias | on | off | off |
| Pixel ratio | `min(1.5, dpr)` | `min(1, dpr)` | `min(1, dpr)` |
| Shadows | key light 2048, plus a second shadow light | key light 1024 | off: no shadow map, no `castShadow` or `receiveShadow` |
| Anisotropy | up to 8 | 2 | 2 |
| Materials | Physical (clearcoat), bump maps | Standard, bump maps | Standard without bump, clearcoat or roughness maps (Lambert if spotlights aren't key to the look) |
| Lights | all | all | hemisphere plus 1–2 key lights only; no fill or accent lights. Raise the hemisphere to keep brightness |
| Canvas textures | full size (1024) | full size | half or quarter size (256–512) |
| Geometry segments | full | full | about half (spheres, lathes, cylinders) |
| Scenery | full | full | fewer neighbors and props, decorative extras skipped |
| Static meshes | separate | separate | baked into one mesh per material (see below) |
| Frame rate while playing | 60 | 60 | a steady 30 |

```js
function applyQuality(){ if(!renderer) return; const dpr=window.devicePixelRatio||1;
  renderer.setPixelRatio(Math.min(GFX===2?1.5:1,dpr)*RES_SCALE); resize(); }
```

## Low tier: what actually helps on older iPads

These made the biggest difference in Just Roll, Just Hoop and Just Bowl, in this order:

1. **Draw calls.** Aim for under about 80. Bake static scenery into one mesh per material. Leave out anything that moves, swaps material or toggles visibility at runtime, or re-bake after those changes. The helper from Just Roll:

```js
const BAKED=[];   // {root, baked:[], hidden:[], skip:Set of moving sub-groups}
function unbake(N){ for(const m of N.baked){ N.root.remove(m); m.geometry.dispose(); } for(const o of N.hidden) o.visible=true; N.baked=[]; N.hidden=[]; }
function bakeAll(){ if(!PERF) return; const M4=new THREE.Matrix4();
  const cat=a=>{ let n=0; for(const x of a) n+=x.length; const r=new Float32Array(n); let k=0; for(const x of a){ r.set(x,k); k+=x.length; } return r; };
  for(const N of BAKED){ unbake(N); N.root.updateMatrixWorld(true); const inv=N.root.matrixWorld.clone().invert(), groups=new Map();
    N.root.traverse(o=>{ if(!o.isMesh||Array.isArray(o.material)||!o.geometry.attributes.position) return; for(let p=o;p&&p!==N.root;p=p.parent) if(!p.visible||N.skip.has(p)) return;
      const A=o.geometry.attributes, key=o.material.uuid+(A.normal?'n':'')+(A.uv?'u':''); if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(o); });
    for(const list of groups.values()){ if(list.length<2) continue; const A0=list[0].geometry.attributes, pos=[], nor=[], uv=[];
      for(const o of list){ const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(); M4.multiplyMatrices(inv,o.matrixWorld); g.applyMatrix4(M4);
        pos.push(g.attributes.position.array); if(A0.normal) nor.push(g.attributes.normal.array); if(A0.uv) uv.push(g.attributes.uv.array); g.dispose(); o.visible=false; N.hidden.push(o); }
      const bg=new THREE.BufferGeometry(); bg.setAttribute('position',new THREE.BufferAttribute(cat(pos),3));
      if(A0.normal) bg.setAttribute('normal',new THREE.BufferAttribute(cat(nor),3)); if(A0.uv) bg.setAttribute('uv',new THREE.BufferAttribute(cat(uv),2));
      const m=new THREE.Mesh(bg,list[0].material); N.root.add(m); N.baked.push(m); } } }
```

   Wire it in like this:
   - Register a group when you build it, e.g. `BAKED.push({root, baked:[], hidden:[], skip:new Set([movingGroup])})`.
   - Call `bakeAll()` after the scene and theme are built.
   - Around a theme change or a show/hide setting, call `BAKED.forEach(unbake)` first, make the change, then call `bakeAll()` again.

   Materials stay shared, so retinting a material still works on baked meshes. Static decals such as arrows or dots can simply be built as one geometry from the start, at every tier.
2. **Lights.** Each light is paid for on every lit pixel with Standard and Physical materials. In Low, don't add fill or accent lights to the scene. Keep the light objects themselves so theme code can still set their color and intensity. Raise the hemisphere light to match.
   - To set the boost, measure the average frame brightness for each theme with and without the extra lights: render, call `gl.readPixels`, and average the luminance.
   - Just Roll ended up at 2.1× and Just Hoop at 2.3×.
3. **Materials.** No `MeshPhysicalMaterial` in Low. Route every material through one `mat(params, physical)` factory that strips clearcoat and bump maps when `PERF` is set. Also check for stray `new THREE.MeshPhysicalMaterial` calls outside it.
4. **Canvas textures that animate** (marquees, scoreboards, rain): every `needsUpdate=true` re-uploads the whole canvas to the GPU, which causes periodic stutter on old devices. In Low:
   - Draw into the full-size canvas as usual, then copy it into a quarter-size canvas and upload only that copy.
   - Update half as often.
   - Only redraw scoreboards when the value changes.
5. **Frame pacing.** Hold Low at a steady 30 fps rather than letting it wobble between 35 and 55; that reads as lag even when the average is higher. See below.

Physics was never the bottleneck: 1000+ substeps a second cost well under a millisecond. Measure before trimming it.

## Frame pacing and idle

The loop skips frames to hit a target that lands on whole display refreshes. It slows down when nothing moves, and stops drawing entirely once the picture is still.

```js
let _busyT=0, _idle=false, _frameN=0, _rafPrev=0, _refresh=16.67, _target=16.67; const _rafD=[];
function noteRaf(t){ if(_rafPrev){ const d=t-_rafPrev; if(d>2&&d<60){ _rafD.push(d); if(_rafD.length>=45){ _rafD.sort((a,b)=>a-b); _refresh=_rafD[22]; _rafD.length=0; } } } _rafPrev=t; }
function wake(){ _busyT=performance.now(); }
['pointerdown','pointermove','keydown','wheel','touchstart','resize','visibilitychange'].forEach(ev=>window.addEventListener(ev,wake,{passive:true}));
function gfxActive(){ return /* anything moving: ball in play, animations, dragging */ ; }
function gfxStill(){ return false; }   // true when the scene has nothing animated at all (then idle frames are skipped entirely)
function frameGap(t){ if(gfxActive()) _busyT=t; _idle=t-_busyT>1500;
  const want=_idle?(t-_busyT>3000?66.7:(PERF?50:33.3)):(PERF?33.3:16.7), r=_refresh, k=Math.max(1,Math.floor(want/r+0.25)); _target=k*r; return _target-r*0.5; }
function gfxFrameSkip(t){ return t-lastT<frameGap(t)||(_idle&&t-_busyT>3000&&_frameN>30&&gfxStill()); }

function loop(t){
  noteRaf(t);
  if(gfxFrameSkip(t)){ requestAnimationFrame(loop); return; }
  const c0=performance.now(), raw=t-lastT; _frameN++;
  const dt=Math.min(raw/1000,0.033); lastT=t;
  /* …step and render… */
  perfSample(raw,performance.now()-c0);
  requestAnimationFrame(loop);
}
```

If shadows are on, set `renderer.shadowMap.autoUpdate=false` and update them every frame while active, or every other frame while idle.

## Auto step-down while playing

```js
const PF={t:0,n:0,sum:0,max:0,cpu:0,hitch:0,el:null,skip:0}, AT={t:0,n:0,sum:0,fast:0,hold:0}; let gfxPending=false;
function gfxSettle(){ AT.hold=2500; AT.t=AT.n=AT.sum=0; PF.skip=2; }   // call after loading / a new game / a theme change
function perfSample(raw,cpu){
  if(raw>250||document.hidden||PF.skip>0){ PF.skip--; return; }
  if(raw>_target*2.5&&!_idle) PF.hitch++;
  if(settings.fps){ /* accumulate and every 500 ms write fps, ms, worst, cpu, hitches, tier, pixel ratio, renderer.info.render.calls / triangles into #fps */ }
  if(settings.gfx!=='auto'||_idle||!gfxPlaying()) return;
  if(AT.hold>0){ AT.hold-=raw; return; }
  AT.sum+=raw; AT.n++; AT.t+=raw; if(AT.t<3000) return;
  const a=AT.sum/AT.n; AT.t=AT.sum=AT.n=0;
  if(a>_target*1.3){ AT.fast=0;
    if(RES_SCALE>0.76){ RES_SCALE=Math.max(0.75,RES_SCALE-0.125); applyQuality(); AT.hold=800; }      // first trim the resolution
    else if(GFX>0&&!gfxPending){ settings.gfxAuto=GFX-1; saveSettings(); gfxPending=true; } }      // then drop a tier at the next break
  else if(a<_target*1.08&&RES_SCALE<1){ if(++AT.fast>=2){ AT.fast=0; RES_SCALE=Math.min(1,RES_SCALE+0.125); applyQuality(); AT.hold=800; } }
  else AT.fast=0;
}
function gfxSwitch(){ if(!gfxPending) return false; try{ sessionStorage.setItem('gfxAutoReload','1'); }catch(e){} location.reload(); return true; }
function gfxSwitched(){ try{ if(!sessionStorage.getItem('gfxAutoReload')) return false; sessionStorage.removeItem('gfxAutoReload'); }catch(e){ return false; }
  setTimeout(()=>gfxNote('Graphics set to '+GFX_NAMES[GFX]+' for smoother play. You can change it in Settings.'),600); return true; }
```

- **When to switch:** call `if(gfxSwitch()) return;` at natural breaks, such as starting a new game or moving to the next hole.
- **Resuming play:** save the game state first, so that after the reload `gfxSwitched()` can pick up where play left off.
- **Never mid-shot:** don't reload while the player is mid-shot.
- **Scope:** Auto never steps back up a tier on its own, only the resolution, and it never acts while idle or in menus.

## Settings UI

```html
<div class="sec"><div class="sec-label" id="gfxLbl">Graphics</div>
  <div class="seg" role="radiogroup" aria-labelledby="gfxLbl">
    <label><input type="radio" name="gfx" value="auto"><span>Auto<small id="gfxAutoLbl"></small></span></label>
    <label><input type="radio" name="gfx" value="high"><span>High</span></label>
    <label><input type="radio" name="gfx" value="medium"><span>Medium</span></label>
    <label><input type="radio" name="gfx" value="low"><span>Low</span></label>
  </div>
</div>
<button class="toggle" id="setFps"></button>
<!-- outside the panel -->
<div id="fps"></div><div id="gfxNote"></div>
```

```js
function gfxNote(txt){ const n=document.getElementById('gfxNote'); n.textContent=txt; n.classList.add('show'); setTimeout(()=>n.classList.remove('show'),5000); }
function gfxRadios(beforeReload){ const gr=[...document.querySelectorAll('input[name="gfx"]')]; document.getElementById('gfxAutoLbl').textContent=settings.gfx==='auto'?GFX_NAMES[resolveGfx()]:'';
  gr.forEach(r=>{ r.checked=(r.value===settings.gfx); r.addEventListener('change',()=>{ if(!r.checked) return; settings.gfx=r.value; if(r.value==='auto') settings.gfxAuto=null; saveSettings(); if(beforeReload) beforeReload();
    try{ sessionStorage.setItem('lowgfxReload','1'); }catch(e){} location.reload(); }); }); }
```

On startup, after the scene is built: if `sessionStorage.lowgfxReload` is set, remove it and reopen Settings, so the reload feels like an in-place change. The `beforeReload` hook is where to save an in-progress game.

CSS used in the Just games:

```css
#fps{position:fixed;left:50%;top:62px;transform:translateX(-50%);z-index:20;display:none;font:600 11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#eafff0;background:rgba(0,0,0,.6);padding:3px 9px;border-radius:6px;pointer-events:none;white-space:pre;text-align:center}
#gfxNote{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:35;max-width:86vw;font:600 .85rem 'Segoe UI',Arial,sans-serif;color:#fff;background:rgba(20,14,34,.88);border:1px solid #3d3058;padding:9px 14px;border-radius:9px;opacity:0;transition:opacity .4s;pointer-events:none}
#gfxNote.show{opacity:1}
```

## Checklist for adding this to a game

- [ ] `settings.gfx` / `gfxAuto` / `fps` saved with the game's settings; migrate `optimized` → `'low'`.
- [ ] `gpuGuess()` + `resolveGfx()`; read `GFX` / `PERF` once before building the renderer and scene.
- [ ] Every quality choice in the build code keyed off `GFX` / `PERF` (table above), including all materials going through one factory.
- [ ] Low: fewer lights (hemisphere boosted to match brightness), static meshes baked, animated canvas textures downsized and throttled, 30 fps cap.
- [ ] `applyQuality()` for pixel ratio × `RES_SCALE`.
- [ ] Loop with `noteRaf` / `gfxFrameSkip` / `perfSample`; `gfxActive()` and `gfxStill()` written for this game.
- [ ] `gfxSettle()` after loads and big changes; `gfxSwitch()` at natural breaks; `gfxSwitched()` on startup.
- [ ] Settings radios with reload-and-reopen; Show frame rate toggle; `#fps` and `#gfxNote` elements.

## Testing it

- **Compare tiers by counts.** Set each tier in a separate browser tab, after backing up the game's localStorage settings, and compare `renderer.info.render.calls`, `.triangles` and `.programs`, plus the lights and material types found by traversing the scene. Low should show far fewer draw calls, three or so lights, and no Physical materials.
- **Check brightness.** Compare average frame luminance per theme between Low and the old look, and keep it within about ±10%.
- **Check the step-down.** Throttle the CPU or force slow frames and confirm Auto trims the resolution first. Only at the next break should it drop a tier, reload, and show the note.
- **Clean up.** Restore the backed-up settings afterwards.
