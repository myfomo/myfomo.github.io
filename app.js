{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TAGS=['דייט','מתאים לחברים','כשר','טבעוני-פרנדלי','ישיבה בחוץ','צריך להזמין מראש','ארוחת בוקר','האפי אוור','אירוע מיוחד','מקום שקט'];
const VERD={must:'חובה להזמין',ok:'סבבה',skip:'לא שוב'};
const OCC={'':'ביקור רגיל',date:'דייט',bday:'יום הולדת',anniv:'יום נישואין',celeb:'חגיגה',friends:'עם חברים',family:'עם המשפחה'};
const SPECIAL=['bday','anniv','celeb'];
const ICON={pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',nav:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-8-8 18-2-8z"/></svg>',share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>',link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',me:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>'};

const CFG=window.APP_CONFIG||{};
// invite link: ?join=CODE — remember it through sign-up, then clean the address bar
let joinCode='';try{const u=new URL(location.href);const j=u.searchParams.get('join');if(j){localStorage.setItem('rs-join',j);u.searchParams.delete('join');history.replaceState(null,'',u.pathname+u.search+u.hash)}joinCode=localStorage.getItem('rs-join')||''}catch{}
let lists=[],cur=null,myName='',chan=null;
let sb=null,session=null,me=null,myId='',members=[],names={};
let rows=[],loaded=false,view='all',q='',cuisF='',sort='recent',openId=null,mode='view',pickTimer=null,page='list',tlF='all',stYear=String(new Date().getFullYear());
let installEvt=null;
const queues={};

/* ---------- helpers ---------- */
function toast(m){if(!m)return;const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,3500)}
function errMsg(e){const m=String(e&&(e.message||e.error_description)||'');if(/row-level|permission|not allowed|42501/i.test(m))return 'אין לך הרשאה לפעולה הזו.';if(/fetch|network|Failed/i.test(m))return 'אין חיבור לאינטרנט כרגע.';return 'משהו השתבש, נסו שוב.'}
const byId=id=>rows.find(r=>r.id===id);
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
const qText=r=>[r.name,r.address,r.city].filter(Boolean).join(' ');
const hasLL=r=>Number.isFinite(r.lat)&&Number.isFinite(r.lng)&&Math.abs(r.lat)<=90&&Math.abs(r.lng)<=180;
const exact=r=>hasLL(r)&&(!r.llLevel||r.llLevel==='place');
const mapsUrl=r=>safeUrl(r.mapsUrl)||(exact(r)?`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(qText(r)));
const wazeUrl=r=>exact(r)?`https://waze.com/ul?ll=${r.lat},${r.lng}&navigate=yes`:'https://waze.com/ul?q='+encodeURIComponent(qText(r))+'&navigate=yes';
const gEmbed=r=>'https://maps.google.com/maps?hl=iw&z=16&output=embed&q='+encodeURIComponent(exact(r)?`${r.lat},${r.lng}`:qText(r));
const shareText=r=>r.name+(r.address||r.city?'\n'+[r.address,r.city].filter(Boolean).join(', '):'')+'\nגוגל מפות: '+mapsUrl(r)+'\nWaze: '+wazeUrl(r);
const avg=r=>{const v=Object.values(r.ratings||{}).map(Number).filter(n=>n>0);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0};
const nv=v=>typeof v==='string'?{d:v}:(v&&typeof v==='object'&&typeof v.d==='string'?v:null);
const visitsOf=r=>(r.visits||[]).map((v,i)=>{const o=nv(v);return o&&{...o,i}}).filter(Boolean);
const lastVisit=r=>visitsOf(r).map(v=>v.d).sort().pop()||'';
const today=()=>new Date().toLocaleDateString('en-CA');
const fmtD=(d,o)=>{try{return new Date(d+'T12:00').toLocaleDateString('he-IL',o||{day:'numeric',month:'short',year:'numeric'})}catch{return d}};
const ils=n=>'₪'+Math.round(n).toLocaleString('he-IL');
const WEEK=7*864e5;
const voters=r=>Object.entries(r.votes||{}).filter(([,t])=>Number(t)&&Date.now()-t<WEEK).map(([k])=>k);
const iVoted=r=>voters(r).includes(myId);
const isMatch=r=>voters(r).length>=2;
const nm=id=>id===myId?'אני':(names[id]||'מישהו');
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const uuid=()=>(crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g,()=>(Math.random()*16|0).toString(16)));
function plate(name){const h=hue(name),t=h%3;const glass=t===0?'<path d="M262 120h44l-22 34z" fill="#f4ead233" stroke="#f4ead2" stroke-width="3"/><path d="M284 154v40M268 196h32" stroke="#f4ead2" stroke-width="3" stroke-linecap="round"/><circle cx="296" cy="122" r="6" fill="#c2504a"/>':t===1?'<path d="M266 112h36c0 30-6 44-18 46c-12-2-18-16-18-46z" fill="#8c2a2a" stroke="#f4ead2" stroke-width="3"/><path d="M284 158v36M268 196h32" stroke="#f4ead2" stroke-width="3" stroke-linecap="round"/>':'<rect x="266" y="120" width="34" height="76" rx="6" fill="#c9a22766" stroke="#f4ead2" stroke-width="3"/><path d="M270 136h26" stroke="#f4ead2" stroke-width="3"/>';return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="lg${h}" cx="50%" cy="10%" r="80%"><stop offset="0" stop-color="#c9a227" stop-opacity=".55"/><stop offset=".55" stop-color="#c9a227" stop-opacity="0"/></radialGradient></defs><rect width="400" height="300" fill="hsl(${150+(h%40)} 45% 16%)"/><rect width="400" height="300" fill="url(#lg${h})"/><path d="M200 0v38" stroke="#c9a227" stroke-width="3"/><path d="M178 58q22-30 44 0z" fill="#c9a227"/><circle cx="200" cy="60" r="6" fill="#fff6d8"/><path d="M0 214h400v86H0z" fill="#3b2418"/><path d="M0 214h400" stroke="#c9a227" stroke-width="3"/><ellipse cx="200" cy="208" rx="70" ry="12" fill="#00000055"/><ellipse cx="200" cy="200" rx="66" ry="16" fill="#f4ead2"/><ellipse cx="200" cy="198" rx="44" ry="9" fill="none" stroke="#d9cfb8" stroke-width="2"/>${glass}<text x="200" y="150" text-anchor="middle" font-family="Frank Ruhl Libre,serif" font-weight="900" font-size="64" fill="#f4ead2">${esc((name||'?').trim().charAt(0))}</text></svg>`}

/* ---------- photos (private storage, signed URLs) ---------- */
const urlCache={};
const photoImg=(p,extra='')=>p&&p.path?`<img data-path="${esc(p.path)}" alt="" ${extra}${urlCache[p.path]?` src="${esc(urlCache[p.path])}"`:''}>`:'';
async function hydrate(){const els=[...document.querySelectorAll('img[data-path]:not([src])')];if(!els.length||!sb)return;
  const paths=[...new Set(els.map(e=>e.dataset.path))].filter(p=>!urlCache[p]);
  if(paths.length){try{const {data}=await sb.storage.from('photos').createSignedUrls(paths,60*60*24*7);for(const d of data||[])if(d.signedUrl)urlCache[d.path]=d.signedUrl}catch{}}
  for(const e of document.querySelectorAll('img[data-path]:not([src])'))if(urlCache[e.dataset.path])e.src=urlCache[e.dataset.path]}
async function shrink(f){try{const bm=await createImageBitmap(f,{imageOrientation:'from-image'});const k=Math.min(1,1600/Math.max(bm.width,bm.height));const c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return await new Promise(res=>c.toBlob(b=>res(b||f),'image/jpeg',.85))}catch{return f}}
async function upload(files,id){
  const r=byId(id);if(!r||!files.length)return false;const st=()=>$('#upst'),added=[];
  for(let i=0;i<files.length;i++){if(st())st().textContent=`מעלה ${i+1} מתוך ${files.length}…`;
    try{const b=await shrink(files[i]);const path=`${id}/${uuid()}.jpg`;const {error}=await sb.storage.from('photos').upload(path,b,{contentType:b.type||'image/jpeg',upsert:false});if(error)throw error;added.push({path,by:myId,at:Date.now()})}catch(e){toast('העלאת תמונה נכשלה: '+errMsg(e))}}
  let ok=false;if(added.length){const cur=byId(id);ok=await save(id,{photos:[...((cur&&cur.photos)||[]),...added],updatedAt:Date.now()});if(ok)toast(added.length===1?'התמונה נשמרה':`${added.length} תמונות נשמרו`)}
  if(st())st().textContent='';return ok}

/* ---------- data ---------- */
function applyPatch(r,p){const o={...r,...p};if(p.ratings)o.ratings={...(r.ratings||{}),...p.ratings};if(p.votes)o.votes={...(r.votes||{}),...p.votes};return o}
async function loadAll(){if(!cur)return;const lid=cur.id;const {data,error}=await sb.from('restaurants').select('id,data').eq('list_id',lid).order('updated_at',{ascending:false});if(!cur||cur.id!==lid)return;if(error){$('#status').textContent='הרשימה לא נטענה: '+errMsg(error);return}
  rows=(data||[]).map(x=>({...(x.data||{}),id:x.id}));loaded=true;$('#status').textContent='';fixLegacy();render();if(openId&&mode==='view')renderDetail()}
function save(id,patch,isNew){
  const prev=byId(id);
  if(isNew)rows.unshift({...patch,id});else if(prev)rows=rows.map(r=>r.id===id?applyPatch(r,patch):r);
  render();if(openId===id&&mode==='view')renderDetail();
  const lid=cur.id;const run=()=>isNew?sb.from('restaurants').insert({id,list_id:lid,data:patch}):sb.rpc('patch_restaurant',{rid:id,patch});
  const p=(queues[id]||Promise.resolve()).then(run).then(({error})=>{if(error)throw error});
  queues[id]=p.catch(()=>{});
  return p.then(()=>true,e=>{toast(errMsg(e));loadAll();return false})}
async function removeRow(r){const {error}=await sb.from('restaurants').delete().eq('id',r.id);if(error){toast(errMsg(error));return false}
  rows=rows.filter(x=>x.id!==r.id);const paths=(r.photos||[]).map(p=>p.path).filter(Boolean);if(paths.length)sb.storage.from('photos').remove(paths).catch(()=>{});render();return true}
function subscribe(){if(chan)return;chan=sb.channel('restaurants-live').on('postgres_changes',{event:'*',schema:'public',table:'restaurants'},pl=>{
  if(pl.eventType==='DELETE'){const id=pl.old&&pl.old.id;if(!byId(id))return;rows=rows.filter(r=>r.id!==id);if(openId===id&&mode==='view')closeSheet()}
  else{const n=pl.new;if(!n||!cur||n.list_id!==cur.id)return;const row={...(n.data||{}),id:n.id};const i=rows.findIndex(r=>r.id===n.id);if(i>=0)rows[i]=row;else rows.unshift(row)}
  render();if(openId&&mode==='view')renderDetail()}).subscribe()}
// ratings imported from the first version are stored under "owner": hand them to the list owner
function fixLegacy(){if(!cur||cur.role!=='owner')return;for(const r of rows)if(r.ratings&&Number(r.ratings.owner)>0&&!(r.ratings[myId]>0))save(r.id,{ratings:{[myId]:Number(r.ratings.owner),owner:0}})}
async function loadLists(){const {data,error}=await sb.from('list_members').select('role,list_id,lists(id,name,join_code)').eq('user_id',myId);if(error)throw error;
  lists=(data||[]).filter(x=>x.lists).map(x=>({id:x.lists.id,name:x.lists.name,join_code:x.lists.join_code,role:x.role})).sort((a,b)=>a.name.localeCompare(b.name,'he'))}
async function loadMembers(){if(!cur)return;const {data}=await sb.from('list_members').select('user_id,email,role,last_seen,added_at').eq('list_id',cur.id).order('added_at');members=data||[];
  const ids=members.map(m=>m.user_id);let profs=[];if(ids.length){const {data:p}=await sb.from('profiles').select('user_id,name').in('user_id',ids);profs=p||[]}
  names={};for(const m of members){const p=profs.find(x=>x.user_id===m.user_id);m.name=(p&&p.name)||'';names[m.user_id]=m.name||m.email.split('@')[0]||'מישהו'}}
function setTitle(){const t=cur?cur.name:'המסעדות שלנו';$('#app h1').textContent=t;document.title=t}
async function switchList(id){const l=lists.find(x=>x.id===id)||lists[0];if(!l)return;cur=l;try{localStorage.setItem('rs-list',l.id)}catch{}
  rows=[];loaded=false;fitted=false;view='all';cuisF='';closeSheet();setTitle();render();
  sb.rpc('touch_list',{lid:l.id}).then(()=>{},()=>{});await loadMembers();await loadAll()}

/* ---------- list ---------- */
function filtered(){const t=q.trim().toLowerCase();let list=rows.filter(r=>(view==='all'||(view==='match'?isMatch(r):r.status===view))&&(!cuisF||r.cuisine===cuisF)&&(!t||[r.name,r.city,r.address,r.cuisine,r.notes,r.recBy,...(r.tags||[]),...(r.dishes||[]).map(d=>d.name)].join(' ').toLowerCase().includes(t)));
  const s={recent:(a,b)=>(b.updatedAt||0)-(a.updatedAt||0),rating:(a,b)=>avg(b)-avg(a),visit:(a,b)=>lastVisit(b).localeCompare(lastVisit(a)),name:(a,b)=>String(a.name).localeCompare(String(b.name),'he')}[sort];return list.sort(s)}
function renderHead(){const been=rows.filter(r=>r.status==='been').length,want=rows.length-been,m=rows.filter(isMatch).length;
  $('#stats').innerHTML=loaded?`היינו ב־<b>${been}</b> · רוצים לנסות <b>${want}</b>${m?` · <b>${m}</b> ששנינו רוצים השבוע`:''}`:'טוען…'}
function renderList(){
  const cs=[...new Set(rows.map(r=>r.cuisine).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he'));
  if(cuisF&&!cs.includes(cuisF))cuisF='';
  $('#cuis').innerHTML=cs.length>1?[`<button type="button" class="chip" data-c="" aria-pressed="${!cuisF}">כל הסוגים</button>`,...cs.map(c=>`<button type="button" class="chip" data-c="${esc(c)}" aria-pressed="${cuisF===c}">${esc(c)}</button>`)].join(''):'';
  const g=$('#grid');
  if(!loaded){g.innerHTML='';return}
  if(!rows.length){g.innerHTML=`<div class="empty"><h2>עוד אין כאן מסעדות</h2><p>הוסיפו מקום שהייתם בו או מקום שאתם חולמים עליו, והרשימה תתחיל להתמלא.</p><button class="btn pri" type="button" data-act="add">הוסיפו את הראשונה</button></div>`;return}
  const list=filtered();
  if(!list.length){g.innerHTML=`<div class="empty"><h2>${view==='match'?'עוד אין מקום ששניכם בחרתם השבוע':'לא נמצא כלום'}</h2><p>${view==='match'?'לחצו "בא לי" על מקומות שבא לכם ללכת אליהם. כששניכם בוחרים אותו מקום, הוא יופיע כאן.':'נסו חיפוש אחר או הסירו סינון.'}</p></div>`;return}
  g.innerHTML=list.map(r=>{const p=(r.photos||[]).find(x=>x.path),a=avg(r),mv=iVoted(r),mt=isMatch(r);return `<article class="card" tabindex="0" data-id="${esc(r.id)}"><div class="cover">${p?photoImg(p,'loading="lazy"'):plate(r.name)}<div class="badges"><span class="badge ${r.status==='been'?'been':''}">${r.status==='been'?'היינו':'רוצים ללכת'}</span>${mt?'<span class="badge match">שנינו רוצים!</span>':''}</div>${r.fav?'<span class="heart" aria-label="מועדף">♥</span>':''}</div><div class="cbody"><h3>${esc(r.name)}</h3><p class="meta">${[r.cuisine,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).map(esc).join(' · ')||'&nbsp;'}</p>${a?`<span class="rate"><i>★</i> ${a.toFixed(1)}</span>`:''}<div class="acts"><a class="btn sm" href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">${ICON.pin}מפות</a><a class="btn sm" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}Waze</a><button type="button" class="btn sm ${mv?'on':''}" data-vote="${esc(r.id)}" aria-pressed="${mv}">${mv?'♥':'♡'} בא לי</button></div></div></article>`}).join('');
  hydrate();
}

/* ---------- map (Leaflet + OpenStreetMap) ---------- */
let lmap=null,layer=null,meMarker=null,fitted=false;
const TILE='https://tile.openstreetmap.org/{z}/{x}/{y}.png',ATTR='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const pinIcon=r=>L.divIcon({className:'pin-wrap',html:`<div class="pin ${r.status==='been'?'b':'w'} ${exact(r)?'':'apx'}"></div>`,iconSize:[26,26],iconAnchor:[13,26],popupAnchor:[0,-24]});
function ensureMap(){if(lmap)return;lmap=L.map('lmap',{zoomControl:true}).setView([32.08,34.78],12);L.tileLayer(TILE,{maxZoom:19,attribution:ATTR}).addTo(lmap);layer=L.layerGroup().addTo(lmap);
  lmap.on('popupopen',e=>{const el=e.popup.getElement();el&&el.addEventListener('click',ev=>{const o=ev.target.closest('[data-open]');if(o){lmap.closePopup();openDetail(o.dataset.open)}})})}
function drawMap(){if(page!=='map')return;ensureMap();setTimeout(()=>lmap.invalidateSize(),50);layer.clearLayers();
  const pts=rows.filter(hasLL);
  for(const r of pts){L.marker([r.lat,r.lng],{icon:pinIcon(r),title:r.name}).bindPopup(`<b>${esc(r.name)}</b>${esc([r.cuisine,r.address||r.city].filter(Boolean).join(' · '))}${exact(r)?'':'<br><small>מיקום משוער</small>'}<div class="row"><button class="btn sm pri" type="button" data-open="${esc(r.id)}">פרטים</button><a class="btn sm" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">Waze</a><a class="btn sm" href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">גוגל</a></div>`).addTo(layer)}
  if(!fitted&&pts.length){fitAll();fitted=true}
  renderNoMap()}
function fitAll(){const pts=rows.filter(hasLL);if(!lmap||!pts.length)return;lmap.fitBounds(L.latLngBounds(pts.map(r=>[r.lat,r.lng])).pad(.2),{maxZoom:15})}
function locateMe(cb){if(!navigator.geolocation){toast('המכשיר לא תומך באיתור מיקום');return}
  navigator.geolocation.getCurrentPosition(p=>cb(p.coords.latitude,p.coords.longitude,p.coords.accuracy),()=>toast('לא הצלחנו לאתר את המיקום. בדקו שהרשאת המיקום פתוחה.'),{enableHighAccuracy:true,timeout:12000})}
function renderNoMap(){const miss=rows.filter(r=>!hasLL(r)),el=$('#nomap');if(!loaded||!miss.length){el.innerHTML='';return}
  el.innerHTML=`<div class="panel" style="margin-top:14px"><h3>${miss.length} מקומות בלי מיקום</h3><p class="note" style="margin:0 0 10px">לחצו על מקום כדי לחפש אותו או לסמן אותו על המפה.</p><div class="chips">${miss.map(r=>`<button type="button" class="chip" data-edit="${esc(r.id)}">${esc(r.name)}</button>`).join('')}</div></div>`}

/* ---------- timeline ---------- */
function allVisits(){const out=[];for(const r of rows)for(const v of visitsOf(r))out.push({r,v});return out.sort((a,b)=>b.v.d.localeCompare(a.v.d))}
function renderTimeline(){
  let vs=allVisits();const now=new Date(),md=d=>d.slice(5);
  const mem=vs.filter(({v})=>{const y=Number(v.d.slice(0,4));if(y>=now.getFullYear())return false;const t=new Date(now.getFullYear()+'-'+md(v.d)+'T12:00');return Math.abs(t-now)<3*864e5});
  $('#memory').innerHTML=mem.slice(0,3).map(({r,v})=>{const n=now.getFullYear()-Number(v.d.slice(0,4));return `<div class="memory">לפני ${n===1?'שנה':n+' שנים'}, ב־${esc(fmtD(v.d,{day:'numeric',month:'long'}))}, הייתם ב<a href="#timeline" data-open="${esc(r.id)}">${esc(r.name)}</a>${v.occ?' · '+esc(OCC[v.occ]||''):''}</div>`}).join('');
  if(tlF==='special')vs=vs.filter(({v})=>SPECIAL.includes(v.occ)||v.occ==='date');
  const el=$('#tl');if(!loaded){el.innerHTML='';return}
  if(!vs.length){el.innerHTML=`<div class="empty"><h2>${tlF==='special'?'עוד אין ימים מיוחדים':'עוד אין ביקורים'}</h2><p>בכל מקום אפשר להוסיף ביקור עם תאריך, סכום וסוג אירוע. הם יופיעו כאן לפי הסדר.</p></div>`;return}
  const groups={};for(const x of vs)(groups[x.v.d.slice(0,7)]=groups[x.v.d.slice(0,7)]||[]).push(x);
  el.innerHTML=Object.entries(groups).map(([m,xs])=>{const sum=xs.reduce((a,{v})=>a+(Number(v.cost)||0),0);return `<div class="tl-month"><h3>${esc(fmtD(m+'-15',{month:'long',year:'numeric'}))}</h3><span class="meta">${xs.length} ${xs.length===1?'ביקור':'ביקורים'}${sum?' · '+ils(sum):''}</span></div>`+
    xs.map(({r,v})=>{const p=(r.photos||[]).find(x=>x.path);return `<div class="tl-item" data-open="${esc(r.id)}" tabindex="0"><span class="tl-day">${Number(v.d.slice(8))}</span>${p?photoImg(p,'loading="lazy"'):`<span class="ph0">${plate(r.name)}</span>`}<div class="tl-main"><b>${esc(r.name)}</b><div class="meta">${[fmtD(v.d,{weekday:'long'}),r.city].filter(Boolean).map(esc).join(' · ')}${v.note?' · '+esc(v.note):''}</div></div>${v.occ?`<span class="occ ${SPECIAL.includes(v.occ)?'sp':''}">${esc(OCC[v.occ]||'')}</span>`:''}${Number(v.cost)?`<span class="money">${ils(v.cost)}</span>`:''}</div>`}).join('')}).join('');
  hydrate();
}

/* ---------- stats ---------- */
function renderStats(){
  const years=[...new Set(allVisits().map(({v})=>v.d.slice(0,4)))];const cy=String(new Date().getFullYear());if(!years.includes(cy))years.push(cy);years.sort().reverse();
  const ys=$('#stYear');ys.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('')+'<option value="all">מאז ומעולם</option>';if(![...years,'all'].includes(stYear))stYear=cy;ys.value=stYear;
  $('#stTitle').textContent=stYear==='all'?'הסטטיסטיקות שלנו':'השנה שלנו ב־'+stYear;
  const inY=d=>stYear==='all'||d.startsWith(stYear);
  const vs=allVisits().filter(({v})=>inY(v.d));
  const newPlaces=rows.map(r=>visitsOf(r).map(v=>v.d).sort()[0]).filter(Boolean).filter(inY).length;
  const costs=vs.map(({v})=>Number(v.cost)||0).filter(n=>n>0),spend=costs.reduce((a,b)=>a+b,0);
  const rated=rows.filter(r=>avg(r)>0),avgR=rated.length?rated.reduce((a,r)=>a+avg(r),0)/rated.length:0;
  const count=f=>{const m={};for(const x of vs){const k=f(x);if(k)m[k]=(m[k]||0)+1}return Object.entries(m).sort((a,b)=>b[1]-a[1])};
  const byC=count(({r})=>r.cuisine),byCity=count(({r})=>r.city),byR=count(({r})=>r.id);
  const el=$('#st');if(!loaded){el.innerHTML='';return}
  const tiles=[[vs.length,'ביקורים'],[newPlaces,'מקומות חדשים שניסינו'],[spend?ils(spend):'—','הוצאנו על יציאות'],[costs.length?ils(spend/costs.length):'—','ממוצע לביקור'],[avgR?avgR.toFixed(1)+'★':'—','דירוג ממוצע (כל הזמנים)'],[rows.filter(r=>r.status!=='been').length,'עוד ברשימת החלומות']];
  const bars=arr=>{const mx=arr.length?arr[0][1]:1;return arr.slice(0,6).map(([k,n])=>`<div class="bar"><span>${esc(k)}</span><span class="t"><i style="width:${(n/mx*100).toFixed(1)}%"></i></span><span>${n}</span></div>`).join('')};
  let months=[];if(stYear==='all'){const d=new Date();for(let i=11;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);months.push(x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'))}}else for(let i=1;i<=12;i++)months.push(stYear+'-'+String(i).padStart(2,'0'));
  const ms=months.map(m=>allVisits().filter(({v})=>v.d.startsWith(m)).reduce((a,{v})=>a+(Number(v.cost)||0),0)),mmx=Math.max(1,...ms);
  const top=rows.filter(r=>avg(r)>0).sort((a,b)=>avg(b)-avg(a)).slice(0,5);
  el.innerHTML=`<div class="tiles">${tiles.map(([n,k])=>`<div class="tile"><div class="n">${esc(n)}</div><div class="k">${k}</div></div>`).join('')}</div>
<div class="panels">
<div class="panel"><h3>הסוג האהוב עלינו</h3>${byC.length?`<div class="big1">${esc(byC[0][0])}</div>${bars(byC)}`:'<p class="note">יופיע אחרי שתוסיפו ביקורים.</p>'}</div>
<div class="panel"><h3>איפה אנחנו יוצאים</h3>${byCity.length?`<div class="big1">${esc(byCity[0][0])}</div>${bars(byCity)}`:'<p class="note">יופיע אחרי שתוסיפו ביקורים.</p>'}</div>
<div class="panel"><h3>הוצאות לפי חודש</h3>${ms.some(Boolean)?`<div class="cols">${months.map((m,i)=>`<div title="${esc(fmtD(m+'-15',{month:'long',year:'numeric'}))}: ${ils(ms[i])}"><em>${ms[i]?ils(ms[i]):''}</em><i style="height:${(ms[i]/mmx*100).toFixed(1)}%"></i><span>${esc(fmtD(m+'-15',{month:'narrow'}))}</span></div>`).join('')}</div>`:'<p class="note">הוסיפו סכום כשאתם רושמים ביקור, ותראו כאן כמה הוצאתם בכל חודש.</p>'}</div>
<div class="panel"><h3>הכי חזרנו אליהם</h3>${byR.length?`<ul class="toplist">${byR.slice(0,5).map(([id,n])=>{const r=byId(id);return r?`<li data-open="${esc(id)}"><span>${esc(r.name)}</span><span>${n} ${n===1?'ביקור':'ביקורים'}</span></li>`:''}).join('')}</ul>`:'<p class="note">עוד אין ביקורים בתקופה הזו.</p>'}</div>
<div class="panel"><h3>הכי אהבנו (כל הזמנים)</h3>${top.length?`<ul class="toplist">${top.map(r=>`<li data-open="${esc(r.id)}"><span>${esc(r.name)}</span><span class="rate"><i>★</i> ${avg(r).toFixed(1)}</span></li>`).join('')}</ul>`:'<p class="note">דרגו מקומות כדי לראות כאן את המובילים.</p>'}</div>
</div>`}

/* ---------- routing ---------- */
function render(){renderHead();if(page==='list')renderList();else if(page==='map')drawMap();else if(page==='timeline')renderTimeline();else renderStats()}
function route(){const h=location.hash.replace('#','');page=['map','timeline','stats'].includes(h)?h:'list';document.body.dataset.page=page;window.scrollTo(0,0);
  document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!=='v-'+page);
  document.querySelectorAll('nav.tabs a,.tabbar a').forEach(a=>{if(a.dataset.v===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  render()}
window.addEventListener('hashchange',route);

/* ---------- sheet ---------- */
let fmap=null,fmarker=null;
function killFormMap(){if(fmap){fmap.remove();fmap=null;fmarker=null}}
function openSheet(){$('#ov').hidden=false;document.body.style.overflow='hidden'}
function closeSheet(){$('#ov').hidden=true;document.body.style.overflow='';openId=null;mode='view';clearInterval(pickTimer);killFormMap()}
function openDetail(id){killFormMap();openId=id;mode='view';openSheet();renderDetail();$('#ov').scrollTop=0}

function formHtml(r){r=r||{status:'want',tags:[]};const tg=r.tags||[];const ll=hasLL(r)?`${r.lat}, ${r.lng}`:'';return `<form id="ef" class="sec dh"><h2 style="margin-bottom:18px">${r.id?'עריכת מקום':'מקום חדש'}</h2>
<div class="quick"><label class="l">חיפוש המקום (שם ועיר)<div class="addrow" style="margin-top:0"><input class="f" id="placeQ" placeholder="למשל: בל בוי תל אביב" value="${esc(r.id?[r.name,r.city].filter(Boolean).join(' '):'')}"><button class="btn" type="button" data-act="placeSearch">${ICON.search}חיפוש</button></div></label><ul class="res" id="placeRes"></ul>
<label class="l" style="margin-top:12px">או הדביקו קישור / "שיתוף" מגוגל מפות<textarea class="f paste" id="paste" dir="auto" placeholder="https://www.google.com/maps/place/…"></textarea></label><p class="note" id="fillSt"></p></div>
<div class="grid2">
<label class="l full">שם המקום *<input class="f" name="name" required maxlength="80" value="${esc(r.name)}"></label>
<label class="l">סוג<input class="f" name="cuisine" list="cuisList" maxlength="40" value="${esc(r.cuisine)}" placeholder="מסעדת שף, בר יין…"></label>
<label class="l">עיר<input class="f" name="city" maxlength="40" value="${esc(r.city)}"></label>
<label class="l full">כתובת<input class="f" name="address" maxlength="120" value="${esc(r.address)}" placeholder="רחוב ומספר"></label>
<div class="full"><div class="l">מיקום מדויק במפה</div><p class="note" style="margin:2px 0 0">לחצו על המפה או גררו את הסיכה למקום המדויק.</p><div class="mini" id="fmap"></div>
<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="fHere">${ICON.me}אני נמצא שם עכשיו</button><input class="f" name="ll" dir="ltr" value="${esc(ll)}" placeholder="32.0853, 34.7818" aria-label="קואורדינטות" style="flex:1 1 180px;width:auto"></div></div>
<label class="l">מצב<select class="f" name="status"><option value="want" ${r.status!=='been'?'selected':''}>רוצים ללכת</option><option value="been" ${r.status==='been'?'selected':''}>היינו</option></select></label>
<label class="l">רמת מחיר<select class="f" name="price"><option value="">לא ידוע</option>${[1,2,3,4].map(n=>`<option value="${n}" ${r.price==n?'selected':''}>${'₪'.repeat(n)}</option>`).join('')}</select></label>
<label class="l full">מי המליץ?<input class="f" name="recBy" maxlength="80" value="${esc(r.recBy)}" placeholder="חבר, כתבה, אינסטגרם…"></label>
<label class="l">קישור לגוגל מפות<input class="f" name="mapsUrl" type="url" dir="ltr" value="${esc(r.mapsUrl)}" placeholder="https://maps.app.goo.gl/…"></label>
<label class="l">אתר / הזמנת מקום<input class="f" name="site" type="url" dir="ltr" value="${esc(r.site)}" placeholder="https://…"></label>
<input type="hidden" name="llLevel" value="${esc(r.llLevel||'')}">
<div class="full"><div class="l" style="margin-bottom:6px">תגיות</div><div class="chips">${TAGS.map(t=>`<label class="chip"><input type="checkbox" name="tags" value="${esc(t)}" ${tg.includes(t)?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div></div>
<label class="l full">הערות<textarea class="f" name="notes" maxlength="2000" placeholder="שעות האפי אוור, מה שמענו, למה רוצים ללכת…">${esc(r.notes)}</textarea></label>
</div><div class="row" style="margin-top:14px"><button class="btn pri" type="submit">שמירה</button><button class="btn" type="button" data-act="cancel">ביטול</button></div></form>`}

function initFormMap(){const f=$('#ef');if(!f)return;killFormMap();
  const m=String(f.elements.ll.value).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
  const has=m&&Math.abs(+m[1])<=90;const c=has?[+m[1],+m[2]]:[32.08,34.78];
  fmap=L.map('fmap').setView(c,has?17:12);L.tileLayer(TILE,{maxZoom:19,attribution:ATTR}).addTo(fmap);
  if(has)setPin(+m[1],+m[2],false);
  fmap.on('click',e=>setPin(e.latlng.lat,e.latlng.lng,true));
  setTimeout(()=>fmap&&fmap.invalidateSize(),120)}
function setPin(lat,lng,manual,zoom){const f=$('#ef');if(!f||!fmap)return;lat=+lat.toFixed(6);lng=+lng.toFixed(6);
  if(!fmarker){fmarker=L.marker([lat,lng],{draggable:true,icon:L.divIcon({className:'pin-wrap',html:'<div class="pin w"></div>',iconSize:[26,26],iconAnchor:[13,26]})}).addTo(fmap);fmarker.on('dragend',()=>{const p=fmarker.getLatLng();setPin(p.lat,p.lng,true)})}
  else fmarker.setLatLng([lat,lng]);
  if(zoom)fmap.setView([lat,lng],17);
  f.elements.ll.value=`${lat}, ${lng}`;f.elements.llLevel.value='place';
  if(manual)reverseFill(lat,lng)}
async function reverseFill(lat,lng){const f=$('#ef');if(!f||(f.elements.address.value.trim()&&f.elements.city.value.trim()))return;
  try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=he&lat=${lat}&lon=${lng}`);const j=await r.json();const a=j.address||{};
    const city=a.city||a.town||a.village||a.municipality||'',addr=[a.road,a.house_number].filter(Boolean).join(' ');
    if(!f.elements.address.value.trim()&&addr)f.elements.address.value=addr;if(!f.elements.city.value.trim()&&city)f.elements.city.value=city}catch{}}
async function placeSearch(){const qv=$('#placeQ').value.trim(),ul=$('#placeRes');if(!qv)return;ul.innerHTML='<li><small>מחפש…</small></li>';
  const go=async cc=>{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=7&accept-language=he${cc?'&countrycodes=il':''}&q=${encodeURIComponent(qv)}`);return r.json()};
  try{let res=await go(true);if(!res.length)res=await go(false);
    if(!res.length){ul.innerHTML='<li><small>לא נמצא. נסו שם אחר, או סמנו את המקום ישירות על המפה למטה.</small></li>';return}
    placeSearch.res=res;ul.innerHTML=res.map((x,i)=>`<li data-act="placePick" data-i="${i}"><b>${esc(x.name||x.display_name.split(',')[0])}</b><small>${esc(x.display_name)}</small></li>`).join('')}
  catch{ul.innerHTML='<li><small>החיפוש לא זמין כרגע. אפשר לסמן ידנית על המפה.</small></li>'}}
function placePick(i){const x=(placeSearch.res||[])[i],f=$('#ef');if(!x||!f)return;const a=x.address||{};
  const name=x.name||'';if(name&&!f.elements.name.value.trim())f.elements.name.value=name;
  const city=a.city||a.town||a.village||a.municipality||'',addr=[a.road,a.house_number].filter(Boolean).join(' ');
  if(addr)f.elements.address.value=addr;if(city)f.elements.city.value=city;
  const kind={bar:'בר',pub:'פאב',cafe:'קפה ובראנץ\''}[x.type];if(kind&&!f.elements.cuisine.value)f.elements.cuisine.value=kind;
  setPin(+x.lat,+x.lon,false,true);$('#placeRes').innerHTML='';$('#fillSt').textContent='מילאנו מהחיפוש. בדקו שהסיכה על המקום הנכון, ואם צריך גררו אותה.'}

function parseMaps(txt){const out={};txt=String(txt||'');const um=txt.match(/https?:\/\/\S+/);const url=um?um[0].replace(/[)\].,]+$/,''):'';
  if(url){out.mapsUrl=url;let m=url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);if(m){out.lat=+m[1];out.lng=+m[2];out.exact=true}else if((m=url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/))){out.lat=+m[1];out.lng=+m[2];out.exact=true}else if((m=url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/))){out.lat=+m[1];out.lng=+m[2]}
    m=url.match(/\/maps\/place\/([^/@?]+)/);if(m){try{out.name=decodeURIComponent(m[1].replace(/\+/g,' ')).replace(/[‎‏‪-‮]/g,'').split(',')[0].trim()}catch{}}
    out.short=/goo\.gl|g\.co\//.test(url)}
  const lines=txt.replace(url,'').split(/\n/).map(s=>s.trim()).filter(s=>s&&!/^https?:/.test(s));
  if(lines.length&&!out.name){const parts=lines[0].split(/\s*[,،]\s*/);out.name=parts[0];const rest=[...parts.slice(1),...lines.slice(1)].join(', ').split(/\s*,\s*/).filter(p=>p&&!/^(ישראל|israel|\d{5,7})$/i.test(p));if(rest.length){out.city=rest.length>1?rest.pop().replace(/\d+/g,'').trim():'';out.address=rest.join(', ')}}
  return out}

function visitForm(){return `<form class="addrow" id="visitF"><input class="f" type="date" name="d" value="${today()}" aria-label="תאריך" style="flex:0 1 160px"><input class="f" type="number" name="cost" min="0" step="1" inputmode="numeric" placeholder="₪ כמה שילמנו" aria-label="סכום" style="flex:0 1 140px"><select class="f" name="occ" aria-label="סוג הביקור" style="flex:1 1 150px">${Object.entries(OCC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><input class="f" name="note" maxlength="100" placeholder="הערה קצרה (לא חובה)" aria-label="הערה"><button class="btn pri" type="submit">הוספת ביקור</button></form>`}

function renderDetail(){
  const r=byId(openId),box=$('#sb');
  if(!r){if(mode!=='new')closeSheet();return}
  if(mode==='edit'){if(!$('#ef')){box.innerHTML=formHtml(r);initFormMap()}return}
  if(mode==='confirm'){box.innerHTML=`<div class="sec dh"><h2>למחוק את ${esc(r.name)}?</h2><p>המקום, הדירוגים, המנות, הביקורים והתמונות יימחקו לתמיד.</p><div class="row"><button class="btn pri" type="button" data-act="reallyDel">כן, למחוק</button><button class="btn" type="button" data-act="cancel">ביטול</button></div></div>`;return}
  const ae=document.activeElement;if(ae&&box.contains(ae)&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName))return;
  const ratings=r.ratings||{},others=Object.keys(ratings).filter(k=>k!==myId&&k!=='owner'&&ratings[k]>0),vt=voters(r).filter(k=>k!==myId);
  const mine=ratings[myId]||0,site=safeUrl(r.site),dishes=r.dishes||[],photos=(r.photos||[]).filter(p=>p.path),visits=visitsOf(r).sort((a,b)=>b.d.localeCompare(a.d)),spent=visits.reduce((a,v)=>a+(Number(v.cost)||0),0),mv=iVoted(r);
  const old=$('#gframe'),keep=old&&old.dataset.src===gEmbed(r)?old:null;
  box.innerHTML=`<div class="sec dh"><div class="row" style="margin-bottom:8px"><span class="badge ${r.status==='been'?'been':''}">${r.status==='been'?'היינו':'רוצים ללכת'}</span>${isMatch(r)?'<span class="badge match">שנינו רוצים השבוע!</span>':''}${(r.tags||[]).map(t=>`<span class="chip" style="cursor:default">${esc(t)}</span>`).join('')}</div>
<h2>${esc(r.name)}</h2><p class="meta" style="margin-top:6px">${[r.cuisine,r.address,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).map(esc).join(' · ')}</p>
${r.recBy?`<p class="meta" style="margin-top:4px">המליץ/ה: <b style="color:var(--ink)">${esc(r.recBy)}</b></p>`:''}
<div class="row" style="margin-top:14px"><a class="btn pri" href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">${ICON.pin}גוגל מפות</a><a class="btn pri" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}ניווט ב־Waze</a>${site?`<a class="btn" href="${esc(site)}" target="_blank" rel="noopener">${ICON.link}אתר / הזמנה</a>`:''}<button class="btn" type="button" data-act="share">${ICON.share}שליחת מיקום</button>${exact(r)?`<button class="btn" type="button" data-act="copyLL">${ICON.copy}העתקת קואורדינטות</button>`:''}</div>
<div class="mini" id="gwrap"></div>
<p class="note">${exact(r)?'מיקום מדויק נשמר.':hasLL(r)?'המיקום משוער. אפשר לדייק אותו בעריכה.':'עוד אין מיקום מדויק. בעריכה אפשר לחפש את המקום או לסמן אותו על המפה.'}</p></div>
<div class="sec"><h4>בא לנו השבוע?</h4><div class="row"><button class="btn ${mv?'on':''}" type="button" data-act="vote" aria-pressed="${mv}">${mv?'♥ בא לי!':'♡ בא לי השבוע'}</button><span class="meta">${vt.length?vt.map(k=>esc(nm(k))).join(', ')+' גם רוצה':'עוד אף אחד אחר לא בחר'}</span></div><p class="note">הבחירה תקפה לשבוע. כששניכם בוחרים, המקום עולה לראש ההגרלה.</p></div>
<div class="sec"><h4>הדירוג שלנו</h4><div class="rlist"><div class="r"><b style="min-width:56px">אני</b><span class="stars" role="group" aria-label="הדירוג שלי">${[1,2,3,4,5].map(n=>`<button type="button" class="${n<=mine?'on':''}" data-act="rate" data-v="${n}" aria-label="${n} כוכבים">★</button>`).join('')}</span></div>${others.map(k=>`<div class="r"><b>${esc(nm(k))}</b><span class="rate"><i>${'★'.repeat(ratings[k])}</i><span style="color:var(--line)">${'★'.repeat(5-ratings[k])}</span></span></div>`).join('')}</div></div>
<div class="sec"><h4>תמונות</h4>${photos.length?`<div class="gal">${(r.photos||[]).map((p,i)=>p.path?`<div class="ph">${photoImg(p,`loading="lazy" data-act="zoom" data-i="${i}"`)}<button type="button" data-act="rmPhoto" data-i="${i}" aria-label="הסרת תמונה">×</button></div>`:'').join('')}</div>`:'<p class="note">עוד אין תמונות. צלמו את המנות, את הקוקטיילים או את שניכם.</p>'}
<div class="row" style="margin-top:12px"><label class="btn pri">${ICON.cam}צלמו עכשיו<input type="file" accept="image/*" capture="environment" hidden class="up"></label><label class="btn">${ICON.img}מהגלריה<input type="file" accept="image/*" multiple hidden class="up"></label><span class="note" id="upst" style="margin:0"></span></div></div>
<div class="sec"><h4>ביקורים${spent?` · סה"כ ${ils(spent)}`:''}</h4>${visits.length?visits.map(v=>`<div class="vrow"><b>${esc(fmtD(v.d))}</b>${v.occ?`<span class="occ ${SPECIAL.includes(v.occ)?'sp':''}">${esc(OCC[v.occ]||'')}</span>`:''}${v.note?`<span class="meta">${esc(v.note)}</span>`:''}<span class="money">${Number(v.cost)?ils(v.cost):''}</span><button type="button" class="del" data-act="rmVisit" data-i="${v.i}" aria-label="הסרת ביקור">×</button></div>`).join(''):'<p class="note">עוד לא רשמתם ביקור.</p>'}
${visitForm()}</div>
<div class="sec"><h4>מנות ומשקאות</h4>${dishes.length?dishes.map((d,i)=>`<div class="dish"><span>${esc(d.name)}</span><button type="button" class="v ${d.v||'ok'}" data-act="verd" data-i="${i}" title="לחצו להחלפה">${VERD[d.v]||VERD.ok}</button><button type="button" class="del" data-act="rmDish" data-i="${i}" aria-label="הסרה">×</button></div>`).join(''):'<p class="note">רשמו מה הזמנתם, ומה חובה להזמין בפעם הבאה.</p>'}
<form class="addrow" id="dishF"><input class="f" name="d" maxlength="80" placeholder="מנה או קוקטייל" aria-label="שם המנה"><button class="btn" type="submit">הוספה</button></form></div>
${r.notes?`<div class="sec"><h4>הערות</h4><p style="margin:0;white-space:pre-wrap">${esc(r.notes)}</p></div>`:''}
<div class="sec row"><button class="btn" type="button" data-act="fav">${r.fav?'♥ מועדף':'♡ סמנו כמועדף'}</button><button class="btn" type="button" data-act="edit">עריכה</button><button class="btn" type="button" data-act="del" style="color:var(--bad)">מחיקה</button></div>`;
  const gw=$('#gwrap');if(keep)gw.appendChild(keep);else gw.innerHTML=`<iframe id="gframe" data-src="${esc(gEmbed(r))}" src="${esc(gEmbed(r))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="מפת גוגל"></iframe>`;
  hydrate();
}

/* ---------- picker ---------- */
function pick(m){
  killFormMap();openId=null;mode='pick';openSheet();
  const matches=rows.filter(r=>isMatch(r)&&(!cuisF||r.cuisine===cuisF)),wants=rows.filter(r=>r.status!=='been'&&(!cuisF||r.cuisine===cuisF));
  if(!m)m=matches.length?'match':'want';
  const pool=m==='match'?matches:m==='fav'?rows.filter(r=>r.fav||avg(r)>=4):wants;
  const seg=`<div class="seg" role="group" aria-label="מאיפה להגריל" style="margin-top:10px"><button type="button" data-act="pickm" data-m="want" aria-pressed="${m==='want'}">רוצים ללכת (${wants.length})</button><button type="button" data-act="pickm" data-m="match" aria-pressed="${m==='match'}">שנינו רוצים (${matches.length})</button><button type="button" data-act="pickm" data-m="fav" aria-pressed="${m==='fav'}">מקומות שאהבנו</button></div>`;
  const s=$('#sb');
  if(!pool.length){s.innerHTML=`<div class="pick"><h2>לאן הולכים הערב?</h2>${seg}<p class="note" style="margin-top:18px">${m==='match'?'עוד אין מקום ששניכם לחצתם עליו "בא לי" השבוע.':m==='fav'?'עוד אין מקומות מועדפים או עם דירוג 4 ומעלה.':'הוסיפו מקומות לרשימת "רוצים ללכת", וההגרלה תבחר בשבילכם.'}</p></div>`;return}
  s.innerHTML=`<div class="pick"><h2>לאן הולכים הערב?</h2>${seg}${cuisF?`<p class="note">רק ${esc(cuisF)}</p>`:''}<div class="nm" id="pn" aria-live="polite"></div><p class="meta" id="pm"></p><div class="row" id="pa"></div></div>`;
  const choice=pool[Math.floor(Math.random()*pool.length)];
  const done=()=>{$('#pn').textContent=choice.name;$('#pm').textContent=[choice.cuisine,choice.city].filter(Boolean).join(' · ');$('#pa').innerHTML=`<a class="btn pri" href="${esc(wazeUrl(choice))}" target="_blank" rel="noopener">${ICON.nav}יוצאים! Waze</a><button class="btn" type="button" data-act="open" data-id="${esc(choice.id)}">פרטים</button><button class="btn" type="button" data-act="pickm" data-m="${m}">הגרלה נוספת</button>`};
  clearInterval(pickTimer);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||pool.length<2){done();return}
  let n=0;pickTimer=setInterval(()=>{const el=$('#pn');if(!el){clearInterval(pickTimer);return}el.textContent=pool[n++%pool.length].name;if(n>14){clearInterval(pickTimer);done()}},80)}

/* ---------- phone mode ---------- */
let camId=null;
function camSheet(){killFormMap();openId=null;mode='cam';camId=null;openSheet();
  $('#sb').innerHTML=`<div class="sec dh"><h2>צילום במקום</h2><p class="meta" style="margin-top:6px">איפה אתם?</p><input class="search" id="camQ" type="search" placeholder="חיפוש מקום" aria-label="חיפוש מקום" style="width:100%;margin-top:12px"><ul class="toplist" id="camL" style="margin-top:8px"></ul><div class="row" style="margin-top:12px"><button class="btn" type="button" data-act="camNear">${ICON.me}הכי קרוב אליי</button><button class="btn" type="button" data-act="add">+ מקום חדש</button></div></div>`;
  camList('');$('#camQ').addEventListener('input',e=>camList(e.target.value))}
function camList(t,near){t=t.trim().toLowerCase();const td=today();
  let list=rows.filter(r=>!t||[r.name,r.city].join(' ').toLowerCase().includes(t));
  if(near){const d=r=>hasLL(r)?(r.lat-near[0])**2+((r.lng-near[1])*0.85)**2:1e9;list.sort((a,b)=>d(a)-d(b))}
  else list.sort((a,b)=>(lastVisit(b)===td)-(lastVisit(a)===td)||(b.updatedAt||0)-(a.updatedAt||0));
  $('#camL').innerHTML=list.slice(0,8).map(r=>`<li data-act="camPick" data-id="${esc(r.id)}" tabindex="0"><span>${esc(r.name)}</span><span class="meta">${esc(r.city||'')}</span></li>`).join('')||'<li><span class="meta">לא נמצא מקום</span></li>'}
function camStep(id){const r=byId(id);if(!r)return;camId=id;mode='cam';const vt=lastVisit(r)===today();
  $('#sb').innerHTML=`<div class="sec dh"><h2>${esc(r.name)}</h2><p class="meta" style="margin-top:6px">${esc([r.cuisine,r.city].filter(Boolean).join(' · '))}</p>
  <label class="chip" style="margin-top:14px"><input type="checkbox" id="camVisit" ${vt?'':'checked'} ${vt?'disabled':''}><span>${vt?'הביקור של היום כבר רשום':'לרשום שהיינו כאן היום'}</span></label>
  <div style="display:grid;gap:12px;margin-top:18px"><label class="btn pri big">${ICON.cam}צלמו עכשיו<input type="file" accept="image/*" capture="environment" hidden class="camUp"></label><label class="btn big">${ICON.img}בחירה מהגלריה<input type="file" accept="image/*" multiple hidden class="camUp"></label></div>
  <p class="note" id="upst"></p><button class="btn" type="button" data-act="open" data-id="${esc(id)}" style="margin-top:8px">לפרטי המקום</button></div>`}
async function camUpload(files){const id=camId,r=byId(id);if(!r||!files.length)return;
  const cb=$('#camVisit');if(cb&&cb.checked&&!cb.disabled)await save(id,{visits:[...(r.visits||[]),{d:today()}],status:'been',updatedAt:Date.now()});
  await upload(files,id);openDetail(id)}

/* ---------- settings ---------- */
const inviteUrl=()=>location.origin+location.pathname+(cur&&cur.join_code?'?join='+encodeURIComponent(cur.join_code):'');
const ago=t=>{if(!t)return 'עוד לא נכנס/ה';const m=(Date.now()-new Date(t))/6e4;return m<60?'פעיל/ה עכשיו':m<1440?'פעיל/ה היום':'פעיל/ה לפני '+Math.round(m/1440)+' ימים'};
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isOwner=()=>cur&&cur.role==='owner';
function listsSheet(){killFormMap();openId=null;mode='lists';openSheet();
  $('#sb').innerHTML=`<div class="sec dh"><h2>הרשימות שלי</h2><p class="meta" style="margin-top:6px">כל רשימה היא עולם משלה: מקומות, תמונות, דירוגים ומשתתפים.</p>
<ul class="toplist" style="margin-top:12px">${lists.map(l=>`<li data-act="pickList" data-id="${esc(l.id)}" tabindex="0"><span>${esc(l.name)}${cur&&l.id===cur.id?' <small class="meta">· פתוחה עכשיו</small>':''}</span><span class="meta">${l.role==='owner'?'שלי':'הצטרפתי'}</span></li>`).join('')}</ul></div>
<div class="sec"><h4>רשימה חדשה</h4><form class="addrow" id="newListF"><input class="f" name="n" maxlength="40" placeholder="למשל: דייטים, ארוחות עבודה, טיול באיטליה" aria-label="שם הרשימה" required><button class="btn pri" type="submit">יצירה</button></form></div>
<div class="sec"><h4>הצטרפות לרשימה של מישהו אחר</h4><form class="addrow" id="joinF"><input class="f" name="c" dir="ltr" placeholder="הדביקו כאן קישור הזמנה" aria-label="קישור הזמנה" required><button class="btn" type="submit">הצטרפות</button></form></div>`}
async function loadPk(){const el=$('#pkList');if(!el)return;try{const {data,error}=await sb.auth.passkey.list();if(error)throw error;const arr=Array.isArray(data)?data:(data&&(data.passkeys||data.items))||[];el.innerHTML=arr.length?arr.map(p=>`<div class="mem"><span><b>${esc(p.friendly_name||p.friendlyName||'מפתח גישה')}</b><br><small class="meta">נוסף ${esc(fmtD(String(p.created_at||p.createdAt||'').slice(0,10)))}</small></span><button class="del" type="button" data-act="pkDel" data-id="${esc(p.id)}" aria-label="הסרה">×</button></div>`).join(''):'עוד לא הופעל באף מכשיר.';return arr}catch{el.textContent='';return null}}
function settingsSheet(){killFormMap();openId=null;mode='settings';openSheet();const own=isOwner();setTimeout(loadPk,0);
  $('#sb').innerHTML=`<div class="sec dh"><h2>הגדרות</h2><p class="meta" style="margin-top:6px">מחובר/ת בתור <span dir="ltr">${esc(me.email)}</span></p>
<form class="addrow" id="nameF"><input class="f" name="n" maxlength="30" value="${esc(myName)}" placeholder="השם שלי" aria-label="השם שלי"><button class="btn" type="submit">שמירת שם</button></form></div>
<div class="sec"><h4>הרשימה "${esc(cur.name)}"</h4>${own?`<form class="addrow" id="renameF" style="margin-top:0"><input class="f" name="n" maxlength="40" value="${esc(cur.name)}" aria-label="שם הרשימה"><button class="btn" type="submit">שינוי שם</button></form>`:'<p class="note" style="margin:0">הצטרפת לרשימה הזו בהזמנה.</p>'}
<div class="row" style="margin-top:10px"><button class="btn" type="button" data-act="lists">כל הרשימות שלי / רשימה חדשה</button></div></div>
<div class="sec"><h4>הזמנת חברים לרשימה הזו</h4><p class="note" style="margin:0 0 10px">מי שפותח את הקישור יוצר חשבון עם המייל והסיסמה שלו ומצטרף לרשימה. הוא יוכל גם לפתוח רשימות משלו.</p><div class="row"><button class="btn pri" type="button" data-act="shareInvite">${ICON.share}שליחת קישור הזמנה</button><button class="btn" type="button" data-act="copyInvite">${ICON.copy}העתקה</button></div><p class="note" dir="ltr" style="word-break:break-all">${esc(inviteUrl())}</p>${own?'<button class="link" type="button" data-act="resetInvite" style="background:none;border:0;color:var(--mute);text-decoration:underline;cursor:pointer;padding:6px 0">איפוס הקישור (הקישור הישן יפסיק לעבוד)</button>':''}</div>
<div class="sec"><h4>מי ברשימה (${members.length})</h4>${members.map(m=>`<div class="mem"><span><b>${esc(m.name||m.email.split('@')[0])}</b>${m.user_id===myId?' <small class="meta">(אני)</small>':''}${m.role==='owner'?' <small class="meta">· מנהל/ת</small>':''}<br><small class="meta" dir="ltr">${esc(m.email)}</small> <small class="meta">· ${ago(m.last_seen)}</small></span>${own&&m.user_id!==myId?`<button class="del" type="button" data-act="rmMember" data-u="${esc(m.user_id)}" aria-label="הסרה מהרשימה">×</button>`:''}</div>`).join('')}
<div class="row" style="margin-top:12px">${own?'<button class="btn" type="button" data-act="delList" style="color:var(--bad)">מחיקת הרשימה</button>':'<button class="btn" type="button" data-act="leaveList" style="color:var(--bad)">יציאה מהרשימה</button>'}</div></div>
${pkOK()?`<div class="sec"><h4>כניסה עם ${bioName()}</h4><p class="note" style="margin:0 0 10px">מפעילים פעם אחת בכל מכשיר, ומשם נכנסים בלי סיסמה.</p><div id="pkList" class="note">טוען…</div><button class="btn pri" type="button" data-act="pkAdd" style="margin-top:10px">הפעלת ${bioName()} במכשיר הזה</button></div>`:''}
<div class="sec"><h4>התקנה במסך הבית</h4>${isStandalone()?'<p class="note" style="margin:0">האפליקציה כבר מותקנת במכשיר הזה.</p>':installEvt?'<button class="btn pri" type="button" data-act="install">התקנת האפליקציה</button>':isIOS()?'<ol class="steps"><li>פותחים את הקישור ב־Safari.</li><li>לוחצים על כפתור השיתוף (ריבוע עם חץ למעלה).</li><li>בוחרים "הוספה למסך הבית" ולוחצים "הוספה".</li></ol>':'<ol class="steps"><li>פותחים את הקישור ב־Chrome.</li><li>תפריט שלוש הנקודות, ואז "התקנת האפליקציה" או "הוספה למסך הבית".</li></ol>'}
</div>
<div class="sec"><button class="btn" type="button" data-act="signout">התנתקות</button></div>`}
const codeFrom=v=>{v=String(v||'').trim();try{const u=new URL(v);return u.searchParams.get('join')||''}catch{}return /^[a-f0-9]{8,40}$/i.test(v)?v:''};
async function doCreateList(name){const {data,error}=await sb.rpc('create_list',{list_name:name});if(error){toast(errMsg(error));return null}await loadLists();return data}
async function doJoin(code){const {data,error}=await sb.rpc('join_list',{code});if(error){toast(errMsg(error));return null}if(!data){toast('קישור ההזמנה לא תקף. אולי אופס? בקשו קישור חדש.');return null}await loadLists();return data}

/* ---------- events ---------- */
async function toggleVote(id){const r=byId(id);if(!r)return;await save(id,{votes:{[myId]:iVoted(r)?0:Date.now()}})}
async function shareOrCopy(title,text,url){if(navigator.share){try{await navigator.share(url?{title,text,url}:{title,text});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(text+(url?'\n'+url:''));toast('הועתק. אפשר להדביק בוואטסאפ.')}catch{toast('לא הצלחנו להעתיק')}}
function newForm(){killFormMap();openId=null;mode='new';openSheet();$('#sb').innerHTML=formHtml(null);initFormMap();$('#placeQ').focus()}

function bindUI(){
$('#grid').addEventListener('click',e=>{if(e.target.closest('a'))return;const vb=e.target.closest('[data-vote]');if(vb){toggleVote(vb.dataset.vote);return}if(e.target.closest('[data-act=add]')){newForm();return}const c=e.target.closest('.card');if(c)openDetail(c.dataset.id)});
$('#grid').addEventListener('keydown',e=>{const c=e.target.closest('.card');if(c&&(e.key==='Enter'||e.key===' ')&&e.target===c){e.preventDefault();openDetail(c.dataset.id)}});
for(const sel of ['#v-timeline','#v-stats'])$(sel).addEventListener('click',e=>{const o=e.target.closest('[data-open]');if(o){e.preventDefault();openDetail(o.dataset.open)}});
$('#v-timeline').addEventListener('keydown',e=>{const o=e.target.closest('.tl-item');if(o&&e.key==='Enter')openDetail(o.dataset.open)});
$('#nomap').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b){killFormMap();openId=b.dataset.edit;mode='edit';openSheet();$('#sb').innerHTML='';renderDetail()}});
$('#locMe').addEventListener('click',()=>locateMe((la,ln)=>{ensureMap();if(meMarker)meMarker.remove();meMarker=L.circleMarker([la,ln],{radius:9,color:'#fff',weight:3,fillColor:'#2b7bd6',fillOpacity:1}).addTo(lmap).bindPopup('אתם כאן');lmap.setView([la,ln],15)}));
$('#fitAll').addEventListener('click',fitAll);
document.querySelectorAll('#v-list .seg button').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;document.querySelectorAll('#v-list .seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderList()}));
document.querySelectorAll('[data-tl]').forEach(b=>b.addEventListener('click',()=>{tlF=b.dataset.tl;document.querySelectorAll('[data-tl]').forEach(x=>x.setAttribute('aria-pressed',x===b));renderTimeline()}));
$('#stYear').addEventListener('change',e=>{stYear=e.target.value;renderStats()});
$('#q').addEventListener('input',e=>{q=e.target.value;renderList()});
$('#sort').addEventListener('change',e=>{sort=e.target.value;try{localStorage.setItem('rs-sort',sort)}catch{}renderList()});
$('#cuis').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b){cuisF=b.dataset.c;renderList()}});
$('#pickBtn').addEventListener('click',()=>pick());
$('#fab').addEventListener('click',camSheet);
$('#addBtn').addEventListener('click',newForm);
$('#setBtn').addEventListener('click',settingsSheet);
$('#listBtn').addEventListener('click',listsSheet);
$('#app h1').addEventListener('click',listsSheet);
$('#addBtnM').addEventListener('click',newForm);
$('#pickBtnM').addEventListener('click',()=>pick());
$('#closeBtn').addEventListener('click',closeSheet);
$('#ov').addEventListener('click',e=>{if(e.target.id==='ov')closeSheet()});
$('#lb').addEventListener('click',()=>$('#lb').hidden=true);
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('#lb').hidden)$('#lb').hidden=true;else if(!$('#ov').hidden)closeSheet()});

const S=$('#sb');
S.addEventListener('input',e=>{
  if(e.target.id==='paste'){const o=parseMaps(e.target.value),f=$('#ef');if(!f)return;
    for(const k of ['name','city','address','mapsUrl'])if(o[k]&&(k==='mapsUrl'||!f.elements[k].value.trim()))f.elements[k].value=o[k];
    if(Number.isFinite(o.lat)){setPin(o.lat,o.lng,false,true);if(!o.exact)f.elements.llLevel.value='street'}
    $('#fillSt').textContent=o.short?'קישור מקוצר: הניווט יעבוד דרכו. כדי שהמקום יופיע במפה, חפשו אותו למעלה או סמנו אותו על המפה.':(o.name||Number.isFinite(o.lat)?(o.exact?'מילאנו מהקישור, כולל המיקום המדויק.':'מילאנו מהקישור. כדאי לבדוק שהסיכה על המקום.'):'')}
  if(e.target.name==='ll'){const f=$('#ef'),m=e.target.value.match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);if(f&&m&&Math.abs(+m[1])<=90&&fmap){if(!fmarker)setPin(+m[1],+m[2],false,true);else{fmarker.setLatLng([+m[1],+m[2]]);fmap.setView([+m[1],+m[2]],17)}f.elements.llLevel.value='place'}}});
S.addEventListener('keydown',e=>{const pl=e.target.closest('[data-act=pickList]');if(pl&&e.key==='Enter')switchList(pl.dataset.id);if(e.target.id==='placeQ'&&e.key==='Enter'){e.preventDefault();placeSearch()}const li=e.target.closest('[data-act=camPick]');if(li&&e.key==='Enter')camStep(li.dataset.id)});
S.addEventListener('submit',async e=>{
  e.preventDefault();const fm=e.target;
  if(fm.id==='dishF'){const inp=fm.elements.d,v=inp.value.trim(),r=byId(openId);if(!v||!r)return;inp.value='';inp.blur();await save(r.id,{dishes:[...(r.dishes||[]),{name:v,v:'ok'}],updatedAt:Date.now()});return}
  if(fm.id==='visitF'){const r=byId(openId);if(!r)return;const d=fm.elements.d.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){toast('בחרו תאריך');return}
    const v={d,cost:Math.max(0,Math.round(Number(fm.elements.cost.value)||0)),occ:OCC[fm.elements.occ.value]!==undefined?fm.elements.occ.value:'',note:fm.elements.note.value.trim().slice(0,100)};
    document.activeElement&&document.activeElement.blur();await save(r.id,{visits:[...(r.visits||[]),v],status:'been',updatedAt:Date.now()});toast('הביקור נרשם');return}
  if(fm.id==='nameF'){const n=fm.elements.n.value.trim().slice(0,30);const {error}=await sb.from('profiles').upsert({user_id:myId,name:n});if(error)toast(errMsg(error));else{myName=n;toast('השם נשמר');await loadMembers();render()}return}
  if(fm.id==='renameF'){const n=fm.elements.n.value.trim().slice(0,40);if(!n)return;const {error}=await sb.from('lists').update({name:n}).eq('id',cur.id);if(error)toast(errMsg(error));else{cur.name=n;await loadLists();cur=lists.find(l=>l.id===cur.id)||cur;setTitle();toast('השם עודכן');settingsSheet()}return}
  if(fm.id==='newListF'){const n=fm.elements.n.value.trim();if(!n)return;const id=await doCreateList(n);if(id){await switchList(id);toast('הרשימה נוצרה! אפשר להוסיף מקומות ולהזמין חברים.')}return}
  if(fm.id==='joinF'){const c=codeFrom(fm.elements.c.value);if(!c){toast('זה לא נראה כמו קישור הזמנה');return}const id=await doJoin(c);if(id){await switchList(id);toast('הצטרפת לרשימה!')}return}
  if(false&&fm.id==='memF'){const em=fm.elements.e.value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(em))return;const {error}=await sb.from('members').insert({email:em});if(error&&!/duplicate/i.test(error.message))toast(errMsg(error));else{toast('נוסף. שלחו לה/לו את הקישור.');await loadMembers();settingsSheet()}return}
  if(fm.id!=='ef')return;
  const fd=new FormData(fm),llm=String(fd.get('ll')).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
  const d={name:String(fd.get('name')).trim(),cuisine:String(fd.get('cuisine')).trim(),city:String(fd.get('city')).trim(),address:String(fd.get('address')).trim(),status:fd.get('status')==='been'?'been':'want',price:Number(fd.get('price'))||0,recBy:String(fd.get('recBy')).trim(),mapsUrl:safeUrl(fd.get('mapsUrl')),site:safeUrl(fd.get('site')),tags:fd.getAll('tags').map(String),notes:String(fd.get('notes')).trim(),updatedAt:Date.now()};
  if(llm&&Math.abs(+llm[1])<=90&&Math.abs(+llm[2])<=180){d.lat=+llm[1];d.lng=+llm[2];d.llLevel=String(fd.get('llLevel')||'place')}else{d.lat=null;d.lng=null;d.llLevel=''}
  if(!d.name)return;
  const btn=fm.querySelector('[type=submit]');btn.disabled=true;fitted=false;killFormMap();
  if(mode==='new'){const id=uuid();const ok=await save(id,{...d,fav:false,ratings:{},votes:{},dishes:[],photos:[],visits:[],addedBy:myId,createdAt:Date.now()},true);if(ok){openId=id;mode='view';renderDetail()}else btn.disabled=false}
  else{mode='view';const ok=await save(openId,d);if(!ok)mode='edit';renderDetail()}
});
S.addEventListener('change',e=>{if(e.target.classList.contains('up')){upload([...e.target.files],openId);e.target.value=''}if(e.target.classList.contains('camUp')){camUpload([...e.target.files]);e.target.value=''}});
S.addEventListener('click',async e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,i=Number(b.dataset.i);
  if(a==='pickm'){pick(b.dataset.m);return}
  if(a==='open'){clearInterval(pickTimer);openDetail(b.dataset.id);return}
  if(a==='add'){newForm();return}
  if(a==='camPick'){camStep(b.dataset.id);return}
  if(a==='camNear'){locateMe((la,ln)=>camList($('#camQ').value,[la,ln]));return}
  if(a==='placeSearch'){placeSearch();return}
  if(a==='placePick'){placePick(i);return}
  if(a==='fHere'){locateMe((la,ln,acc)=>{setPin(la,ln,true,true);if(acc>60)toast(`דיוק המיקום כ־${Math.round(acc)} מטר. אפשר לגרור את הסיכה.`)});return}
  if(a==='cancel'){killFormMap();if(mode==='new'){closeSheet();return}mode='view';renderDetail();return}
  if(a==='install'){if(installEvt){installEvt.prompt();installEvt=null;settingsSheet()}return}
  if(a==='shareInvite'){shareOrCopy('המסעדות שלנו','הצטרפו לרשימת המסעדות שלנו! פותחים את הקישור, יוצרים חשבון עם מייל וסיסמה, וזהו:',inviteUrl());return}
  if(a==='copyInvite'){try{await navigator.clipboard.writeText(inviteUrl());toast('הקישור הועתק')}catch{toast('לא הצלחנו להעתיק')}return}
  if(a==='resetInvite'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='בטוח? לחצו שוב לאיפוס';return}const {data,error}=await sb.rpc('reset_list_code',{lid:cur.id});if(error)toast(errMsg(error));else{cur.join_code=data;toast('נוצר קישור חדש');settingsSheet()}return}
  if(a==='lists'){listsSheet();return}
  if(a==='pkAdd'){b.disabled=true;await registerBio();b.disabled=false;loadPk();return}
  if(a==='pkDel'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='הסר?';b.style.fontSize='14px';return}try{const {error}=await sb.auth.passkey.delete({passkeyId:b.dataset.id});if(error)throw error;toast('הוסר')}catch(e){toast(errMsg(e))}loadPk();return}
  if(a==='pkOffer'){b.disabled=true;await registerBio();closeSheet();return}
  if(a==='pkLater'){closeSheet();return}
  if(a==='pickList'){await switchList(b.dataset.id);return}
  if(a==='leaveList'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='בטוח? לחצו שוב ליציאה';return}const {error}=await sb.from('list_members').delete().eq('list_id',cur.id).eq('user_id',myId);if(error){toast(errMsg(error));return}await afterListGone('יצאת מהרשימה');return}
  if(a==='delList'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='למחוק את כל הרשימה לתמיד? לחצו שוב';return}const paths=rows.flatMap(r=>(r.photos||[]).map(p=>p.path).filter(Boolean));if(paths.length)await sb.storage.from('photos').remove(paths).catch(()=>{});const {error}=await sb.from('lists').delete().eq('id',cur.id);if(error){toast(errMsg(error));return}await afterListGone('הרשימה נמחקה');return}
  if(a==='shareApp'){shareOrCopy('המסעדות שלנו','האפליקציה שלנו למעקב אחרי מסעדות וברים:',location.origin+location.pathname);return}
  if(a==='signout'){await sb.auth.signOut();location.reload();return}
  if(a==='rmMember'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='הסר?';b.style.fontSize='14px';return}const {error}=await sb.from('list_members').delete().eq('list_id',cur.id).eq('user_id',b.dataset.u);if(error)toast(errMsg(error));await loadMembers();settingsSheet();return}
  const r=byId(openId);if(!r)return;const now=Date.now();
  if(a==='share'){shareOrCopy(r.name,shareText(r));return}
  if(a==='copyLL'){try{await navigator.clipboard.writeText(`${r.lat}, ${r.lng}`);toast('הקואורדינטות הועתקו')}catch{toast(`${r.lat}, ${r.lng}`)}return}
  if(a==='zoom'){const p=(r.photos||[])[i];if(p&&urlCache[p.path]){$('#lbImg').src=urlCache[p.path];$('#lb').hidden=false}return}
  if(a==='edit'){mode='edit';$('#sb').innerHTML='';renderDetail();return}
  if(a==='del'){mode='confirm';renderDetail();return}
  if(a==='reallyDel'){if(await removeRow(r)){closeSheet();toast('נמחק')}return}
  if(a==='vote'){await toggleVote(r.id);return}
  if(a==='rate'){const v=Number(b.dataset.v);const cur=(r.ratings||{})[myId]||0;await save(r.id,{ratings:{[myId]:cur===v?0:v},updatedAt:now});return}
  if(a==='fav'){await save(r.id,{fav:!r.fav,updatedAt:now});return}
  if(a==='verd'){const ds=(r.dishes||[]).map(d=>({...d}));if(!ds[i])return;const order=['ok','must','skip'];ds[i].v=order[(order.indexOf(ds[i].v||'ok')+1)%3];await save(r.id,{dishes:ds,updatedAt:now});return}
  if(a==='rmDish'){await save(r.id,{dishes:(r.dishes||[]).filter((_,j)=>j!==i),updatedAt:now});return}
  if(a==='rmPhoto'){const p=(r.photos||[])[i];const ok=await save(r.id,{photos:(r.photos||[]).filter((_,j)=>j!==i),updatedAt:now});if(ok&&p&&p.path)sb.storage.from('photos').remove([p.path]).catch(()=>{});return}
  if(a==='rmVisit'){await save(r.id,{visits:(r.visits||[]).filter((_,j)=>j!==i),updatedAt:now});return}
});
}

/* ---------- sign-in gate ---------- */
const pkOK=()=>!!(window.PublicKeyCredential&&navigator.credentials);
const bioName=()=>/iphone|ipad|ipod|macintosh/i.test(navigator.userAgent)?'Face ID':/android/i.test(navigator.userAgent)?'טביעת אצבע':'מפתח גישה';
const devName=()=>/iphone/i.test(navigator.userAgent)?'iPhone':/ipad/i.test(navigator.userAgent)?'iPad':/android/i.test(navigator.userAgent)?'Android':/mac/i.test(navigator.userAgent)?'Mac':/windows/i.test(navigator.userAgent)?'Windows':'מכשיר';
const pkCancelled=e=>/abort|cancel|NotAllowed|timed out/i.test(String(e&&(e.name||'')+' '+(e.message||'')));
async function registerBio(){try{const {data,error}=await sb.auth.registerPasskey();if(error)throw error;try{const id=data&&(data.id||(data.passkey&&data.passkey.id));if(id)await sb.auth.passkey.update({passkeyId:id,friendlyName:devName()})}catch{}try{localStorage.setItem('rs-pk','1')}catch{}toast(bioName()+' הופעל! מעכשיו אפשר להיכנס בלי סיסמה.');return true}
  catch(e){if(!pkCancelled(e))toast('לא הצלחנו להפעיל את '+bioName()+': '+(e.message||''));return false}}
const BRASS='style="background:var(--brass);border-color:var(--brass);color:#14251d"';
function gate(html){const g=$('#gate');g.innerHTML=`<div class="box"><h1>המסעדות שלנו</h1>${html}</div>`;g.hidden=false;$('#app').hidden=true}
function showLogin(email,signup){
  gate(`${joinCode?'<p><b>הוזמנתם לרשימת המסעדות!</b></p>':''}<p>${signup?'צרו חשבון עם המייל שלכם ובחרו סיסמה (לפחות 6 תווים).':'כניסה עם המייל והסיסמה שלכם.'}</p>${!signup&&pkOK()?`<button class="btn" type="button" id="pkIn" ${BRASS}>כניסה עם ${bioName()}</button><p class="note" style="color:#f4ead2b0;margin:10px 0 0">או עם מייל וסיסמה:</p>`:''}<form id="lf"><input type="email" id="le" dir="ltr" placeholder="המייל שלך" autocomplete="email" required value="${esc(email||'')}"><input type="password" id="lp" dir="ltr" placeholder="${signup?'סיסמה חדשה':'סיסמה'}" autocomplete="${signup?'new-password':'current-password'}" minlength="6" required><button class="btn" type="submit" ${BRASS}>${signup?'יצירת חשבון וכניסה':'כניסה'}</button></form><div class="err" id="lerr"></div><button class="link" type="button" id="sw">${signup?'כבר יש לי חשבון':'פעם ראשונה כאן? יצירת חשבון'}</button>`);
  $('#sw').onclick=()=>showLogin($('#le').value,!signup);
  const pk=$('#pkIn');if(pk)pk.onclick=async()=>{pk.disabled=true;$('#lerr').textContent='';try{const {error}=await sb.auth.signInWithPasskey();if(error)throw error;start()}catch(e){pk.disabled=false;if(!pkCancelled(e))$('#lerr').textContent='לא מצאנו '+bioName()+' שמחובר לחשבון במכשיר הזה. היכנסו עם מייל וסיסמה, ואז הפעילו '+bioName()+' בהגדרות.'}};
  $('#lf').addEventListener('submit',async e=>{e.preventDefault();const em=$('#le').value.trim().toLowerCase(),pw=$('#lp').value;const b=e.target.querySelector('button');b.disabled=true;$('#lerr').textContent='';
    const {data,error}=signup?await sb.auth.signUp({email:em,password:pw}):await sb.auth.signInWithPassword({email:em,password:pw});b.disabled=false;
    if(error){const m=error.message||'';$('#lerr').textContent=/invalid login/i.test(m)?'המייל או הסיסמה לא נכונים. אם זו הפעם הראשונה, לחצו "יצירת חשבון".':/already registered|already exists/i.test(m)?'למייל הזה כבר יש חשבון. לחצו "כבר יש לי חשבון".':/not confirmed/i.test(m)?'החשבון ממתין לאישור מייל. בקשו ממי שהקים את האפליקציה לכבות את "Confirm email" ב-Supabase.':/password/i.test(m)?'הסיסמה צריכה להיות לפחות 6 תווים.':'הכניסה נכשלה: '+m;return}
    if(signup&&!data.session){$('#lerr').textContent='החשבון נוצר, אבל ממתין לאישור מייל. בקשו ממי שהקים את האפליקציה לכבות את "Confirm email" ב-Supabase.';return}
    start()})}
function welcome(){gate(`<p><b>ברוכים הבאים${myName?', '+esc(myName):''}!</b></p><p>פתחו רשימה משלכם, או הצטרפו לרשימה של מישהו עם קישור ההזמנה שלו.</p>
<form id="wl"><input id="wn" maxlength="40" placeholder="שם הרשימה, למשל: המסעדות שלנו" required><button class="btn" type="submit" ${BRASS}>יצירת רשימה חדשה</button></form>
<form id="wj" style="margin-top:18px"><input id="wc" dir="ltr" placeholder="או הדביקו קישור הזמנה" required><button class="btn" type="submit" style="background:transparent;border-color:var(--brass);color:#f4ead2">הצטרפות לרשימה</button></form>
<div class="err" id="lerr"></div><button class="link" type="button" id="so">התנתקות</button>`);
  $('#so').onclick=async()=>{await sb.auth.signOut();location.reload()};
  $('#wl').addEventListener('submit',async e=>{e.preventDefault();e.target.querySelector('button').disabled=true;const id=await doCreateList($('#wn').value.trim());if(id){try{localStorage.setItem('rs-list',id)}catch{}start()}else e.target.querySelector('button').disabled=false});
  $('#wj').addEventListener('submit',async e=>{e.preventDefault();const c=codeFrom($('#wc').value);if(!c){$('#lerr').textContent='זה לא נראה כמו קישור הזמנה.';return}const id=await doJoin(c);if(id){try{localStorage.setItem('rs-list',id)}catch{}start()}else $('#lerr').textContent='קישור ההזמנה לא תקף. בקשו קישור חדש.'})}
async function offerBio(){if(!pkOK())return;let asked='';try{asked=localStorage.getItem('rs-pk')||''}catch{}if(asked)return;
  try{const {data}=await sb.auth.passkey.list();const arr=Array.isArray(data)?data:(data&&(data.passkeys||data.items))||[];if(arr.length){localStorage.setItem('rs-pk','1');return}}catch{return}
  try{localStorage.setItem('rs-pk','asked')}catch{}
  setTimeout(()=>{if(!$('#ov').hidden)return;openId=null;mode='bio';openSheet();$('#sb').innerHTML=`<div class="pick"><h2>להיכנס בפעם הבאה עם ${bioName()}?</h2><p class="meta" style="margin-top:10px">בלי להקליד מייל וסיסמה. אפשר לשנות בכל רגע בהגדרות.</p><div class="row"><button class="btn pri" type="button" data-act="pkOffer">הפעלת ${bioName()}</button><button class="btn" type="button" data-act="pkLater">לא עכשיו</button></div></div>`},900)}
async function afterListGone(msg){closeSheet();await loadLists();toast(msg);if(!lists.length){cur=null;welcome();return}await switchList(lists[0].id)}

let bound=false,visBound=false;
async function start(){
  const {data:{session:s}}=await sb.auth.getSession();session=s;
  if(!s){showLogin('',!!joinCode);return}
  me={id:s.user.id,email:String(s.user.email||'').toLowerCase()};myId=me.id;
  try{
    const {data:pr}=await sb.from('profiles').select('name').eq('user_id',myId).maybeSingle();
    if(!pr)await sb.from('profiles').insert({user_id:myId,name:''});myName=(pr&&pr.name)||'';
    let target=null;
    if(joinCode){const c=joinCode;joinCode='';try{localStorage.removeItem('rs-join')}catch{}const {data:lid}=await sb.rpc('join_list',{code:c});if(lid){target=lid;setTimeout(()=>toast('הצטרפת לרשימה!'),600)}else setTimeout(()=>toast('קישור ההזמנה לא תקף. בקשו קישור חדש.'),600)}
    await loadLists();
    if(!lists.length){welcome();return}
    let saved='';try{saved=localStorage.getItem('rs-list')||''}catch{}
    cur=lists.find(l=>l.id===(target||saved))||lists.find(l=>l.role==='owner')||lists[0];
  }catch(e){gate(`<p>לא הצלחנו להתחבר לשרת. בדקו את החיבור לאינטרנט.</p><button class="btn" type="button" id="rl" ${BRASS}>ניסיון חוזר</button>`);$('#rl').onclick=()=>location.reload();return}
  $('#gate').hidden=true;$('#app').hidden=false;
  if(!bound){bindUI();bound=true}
  try{const so=localStorage.getItem('rs-sort');if(so){sort=so;$('#sort').value=so}}catch{}
  route();await switchList(cur.id);subscribe();
  if(!myName)setTimeout(()=>{settingsSheet();toast('איך לקרוא לך? כתבו שם ושמרו.')},500);
  else offerBio();
  if(!visBound){visBound=true;document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&loaded)loadAll()})}
}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

if(!CFG.supabaseUrl||!CFG.supabaseKey||!window.supabase){gate('<p>האפליקציה עוד לא מחוברת למסד הנתונים. צריך למלא את הקובץ config.js.</p>')}
else{sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,experimental:{passkey:true}}});start()}
}
