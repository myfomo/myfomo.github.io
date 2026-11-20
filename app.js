{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TAGS=['דייט','מתאים לחברים','כשר','טבעוני-פרנדלי','ישיבה בחוץ','צריך להזמין מראש','ארוחת בוקר','האפי אוור','אירוע מיוחד','מקום שקט'];
const VERD={must:'חובה להזמין',ok:'סבבה',skip:'לא שוב'};
const OCC={'':'ביקור רגיל',date:'דייט',bday:'יום הולדת',anniv:'יום נישואין',celeb:'חגיגה',friends:'עם חברים',family:'עם המשפחה'};
const SPECIAL=['bday','anniv','celeb'];
const ICON={pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',nav:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-8-8 18-2-8z"/></svg>',share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>',link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',vote:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16M6 20V10h3v10M11 20V5h3v15M16 20v-7h3v7"/></svg>',card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 13h16M8 17h8"/></svg>',me:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>'};

const CFG=window.APP_CONFIG||{};
// invite link: ?join=CODE — remember it through sign-up, then clean the address bar
let joinCode='';try{const u=new URL(location.href);const j=u.searchParams.get('join');if(j){localStorage.setItem('rs-join',j);u.searchParams.delete('join');history.replaceState(null,'',u.pathname+u.search+u.hash)}joinCode=localStorage.getItem('rs-join')||''}catch{}
let lists=[],cur=null,myName='',chan=null,openF=false;
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
const lastVisit=r=>visitsOf(r).filter(v=>v.d<=today()).map(v=>v.d).sort().pop()||'';
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
const GRADS=[['#FF9A3C','#FF4E6A'],['#FFC24B','#FF7A2F'],['#2BD9A8','#14B88A'],['#FF8FB8','#FF4E8A'],['#8E7CFF','#5FD3F3'],['#FFD166','#FF8A5C']];
function plate(name){const h=hue(name),g=GRADS[h%GRADS.length],t=h%3,id='pg'+h;const glass=t===0?'<path d="M268 118h48l-24 36z" fill="#ffffff40" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M292 154v38M276 194h32" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="306" cy="118" r="8" fill="#FFD166" stroke="#fff" stroke-width="3"/>':t===1?'<path d="M272 110h40c0 30-7 46-20 48c-13-2-20-18-20-48z" fill="#ffffff40" stroke="#fff" stroke-width="4"/><path d="M292 158v34M276 194h32" stroke="#fff" stroke-width="4" stroke-linecap="round"/>':'<rect x="272" y="118" width="38" height="76" rx="8" fill="#ffffff40" stroke="#fff" stroke-width="4"/><circle cx="284" cy="150" r="3" fill="#fff"/><circle cx="296" cy="166" r="2.5" fill="#fff"/><circle cx="290" cy="136" r="2" fill="#fff"/>';return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/><circle cx="70" cy="40" r="90" fill="#ffffff22"/><circle cx="360" cy="280" r="110" fill="#ffffff18"/><ellipse cx="180" cy="206" rx="78" ry="14" fill="#00000018"/><circle cx="180" cy="150" r="70" fill="#fff"/><circle cx="180" cy="150" r="50" fill="none" stroke="${g[0]}" stroke-opacity=".35" stroke-width="3"/>${glass}<text x="180" y="170" text-anchor="middle" font-family="Rubik,sans-serif" font-weight="800" font-size="56" fill="${g[1]}">${esc((name||'?').trim().charAt(0))}</text></svg>`}

/* ---------- photos (private storage, signed URLs) ---------- */
const urlCache={};
const photoImg=(p,extra='')=>p&&p.path?`<img data-path="${esc(p.path)}" alt="" ${extra}${urlCache[p.path]?` src="${esc(urlCache[p.path])}"`:''}>`:'';
async function hydrate(){const els=[...document.querySelectorAll('img[data-path]:not([src])')];if(!els.length||!sb)return;
  const paths=[...new Set(els.map(e=>e.dataset.path))].filter(p=>!urlCache[p]);
  if(paths.length){try{const {data}=await sb.storage.from('photos').createSignedUrls(paths,60*60*24*7);for(const d of data||[])if(d.signedUrl)urlCache[d.path]=d.signedUrl}catch{}}
  for(const e of document.querySelectorAll('img[data-path]:not([src])'))if(urlCache[e.dataset.path])e.src=urlCache[e.dataset.path]}
async function shrink(f){try{const bm=await createImageBitmap(f,{imageOrientation:'from-image'});const k=Math.min(1,1600/Math.max(bm.width,bm.height));const c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return await new Promise(res=>c.toBlob(b=>res(b||f),'image/jpeg',.85))}catch{return f}}
async function upload(files,id){
  const r=byId(id);if(!r||!files.length)return false;
  if(!navigator.onLine){for(const f of files){try{await idbAdd({rid:id,blob:await shrink(f),by:myId,at:Date.now()})}catch{}}toast('אין חיבור. התמונות נשמרו במכשיר ויעלו כשהחיבור יחזור.');return true}const st=()=>$('#upst'),added=[];
  for(let i=0;i<files.length;i++){if(st())st().textContent=`מעלה ${i+1} מתוך ${files.length}…`;
    try{const b=await shrink(files[i]);const path=`${id}/${uuid()}.jpg`;const {error}=await sb.storage.from('photos').upload(path,b,{contentType:b.type||'image/jpeg',upsert:false});if(error)throw error;added.push({path,by:myId,at:Date.now()})}catch(e){toast('העלאת תמונה נכשלה: '+errMsg(e))}}
  let ok=false;if(added.length){const cur=byId(id);ok=await save(id,{photos:[...((cur&&cur.photos)||[]),...added],updatedAt:Date.now()});if(ok){toast(added.length===1?'התמונה נשמרה':`${added.length} תמונות נשמרו`);logAct('photo',id,`העלה/תה ${added.length===1?'תמונה':added.length+' תמונות'} ב${r.name}`)}}
  if(st())st().textContent='';return ok}

/* ---------- data ---------- */
function applyPatch(r,p){const o={...r,...p};if(p.ratings)o.ratings={...(r.ratings||{}),...p.ratings};if(p.votes)o.votes={...(r.votes||{}),...p.votes};return o}
async function loadAll(){if(!cur)return;const lid=cur.id;const {data,error}=await sb.from('restaurants').select('id,data').eq('list_id',lid).order('updated_at',{ascending:false});if(!cur||cur.id!==lid)return;if(error){const c=lsGet('rs-cache-'+lid,null);if(c&&isNetErr(error)){rows=c;loaded=true;render();setOffline();return}$('#status').textContent='הרשימה לא נטענה: '+errMsg(error);return}
  rows=(data||[]).map(x=>({...(x.data||{}),id:x.id}));const pend=lsGet('rs-outbox',[]).filter(o=>o.lid===lid);for(const o of pend){if(o.isNew){if(!byId(o.id))rows.unshift({...o.patch,id:o.id})}else rows=rows.map(r=>r.id===o.id?applyPatch(r,o.patch):r)}
  loaded=true;$('#status').textContent='';setOffline();cacheRows();fixLegacy();render();if(openId&&mode==='view')renderDetail();checkAch()}
function save(id,patch,isNew){
  const prev=byId(id);
  if(isNew)rows.unshift({...patch,id});else if(prev)rows=rows.map(r=>r.id===id?applyPatch(r,patch):r);
  render();if(openId===id&&mode==='view')renderDetail();
  const lid=cur.id;if(!navigator.onLine){queueOp({id,patch,isNew,lid});return Promise.resolve(true)}
  const run=()=>isNew?sb.from('restaurants').insert({id,list_id:lid,data:patch}):sb.rpc('patch_restaurant',{rid:id,patch});
  const p=(queues[id]||Promise.resolve()).then(run).then(({error})=>{if(error)throw error});
  queues[id]=p.catch(()=>{});
  return p.then(()=>{cacheRows();setTimeout(checkAch,300);return true},e=>{if(isNetErr(e)){queueOp({id,patch,isNew,lid});return true}toast(errMsg(e));loadAll();return false})}
async function removeRow(r){const {error}=await sb.from('restaurants').delete().eq('id',r.id);if(error){toast(errMsg(error));return false}
  rows=rows.filter(x=>x.id!==r.id);const paths=(r.photos||[]).map(p=>p.path).filter(Boolean);if(paths.length)sb.storage.from('photos').remove(paths).catch(()=>{});render();return true}
function subscribe(){if(chan)return;chan=sb.channel('restaurants-live').on('postgres_changes',{event:'*',schema:'public',table:'restaurants'},pl=>{
  if(pl.eventType==='DELETE'){const id=pl.old&&pl.old.id;if(!byId(id))return;rows=rows.filter(r=>r.id!==id);if(openId===id&&mode==='view')closeSheet()}
  else{const n=pl.new;if(!n||!cur||n.list_id!==cur.id)return;const row={...(n.data||{}),id:n.id};const i=rows.findIndex(r=>r.id===n.id);if(i>=0)rows[i]=row;else rows.unshift(row)}
  render();if(openId&&mode==='view')renderDetail()})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'activity'},pl=>{const n=pl.new;if(!n||!cur||n.list_id!==cur.id||acts.some(a=>a.id===n.id))return;acts.unshift(n);renderBell();if(n.user_id!==myId)toast(`${nm(n.user_id)} ${n.text}`)})
  .on('postgres_changes',{event:'*',schema:'public',table:'comments'},pl=>{if(pl.eventType==='DELETE'){const id=pl.old&&pl.old.id;for(const k in cmts)if(cmts[k])cmts[k]=cmts[k].filter(c=>c.id!==id)}else{const n=pl.new;if(!n||!cur||n.list_id!==cur.id)return;if(cmts[n.restaurant_id]&&!cmts[n.restaurant_id].some(c=>c.id===n.id))cmts[n.restaurant_id].push(n)}if(openId&&mode==='view')renderDetail()})
  .on('postgres_changes',{event:'*',schema:'public',table:'polls'},pl=>{if(pl.eventType==='DELETE'){polls=polls.filter(p=>p.id!==(pl.old&&pl.old.id))}else{const n=pl.new;if(!n||!cur||n.list_id!==cur.id)return;const i=polls.findIndex(p=>p.id===n.id);const was=i>=0&&polls[i].closed;if(i>=0)polls[i]=n;else polls.unshift(n);if(n.closed&&!was&&mode==='poll'&&openPoll===n.id)confetti()}renderNotices();if(mode==='poll')renderPoll()})
  .subscribe()}
// ratings imported from the first version are stored under "owner": hand them to the list owner
function fixLegacy(){if(!cur||cur.role!=='owner')return;for(const r of rows)if(r.ratings&&Number(r.ratings.owner)>0&&!(r.ratings[myId]>0))save(r.id,{ratings:{[myId]:Number(r.ratings.owner),owner:0}})}
async function loadLists(){const {data,error}=await sb.from('list_members').select('role,list_id,lists(id,name,join_code)').eq('user_id',myId);if(error)throw error;
  lists=(data||[]).filter(x=>x.lists).map(x=>({id:x.lists.id,name:x.lists.name,join_code:x.lists.join_code,role:x.role})).sort((a,b)=>a.name.localeCompare(b.name,'he'));lsSet('rs-lists',lists)}
async function loadMembers(){if(!cur)return;const {data,error}=await sb.from('list_members').select('user_id,email,role,last_seen,added_at').eq('list_id',cur.id).order('added_at');if(error){members=lsGet('rs-names-'+cur.id,[]);names={};for(const m of members)names[m.user_id]=m.name||String(m.email||'').split('@')[0]||'מישהו';return}members=data||[];
  const ids=members.map(m=>m.user_id);let profs=[];if(ids.length){const {data:p}=await sb.from('profiles').select('user_id,name').in('user_id',ids);profs=p||[]}
  lsSet('rs-names-'+cur.id,members);names={};for(const m of members){const p=profs.find(x=>x.user_id===m.user_id);m.name=(p&&p.name)||'';names[m.user_id]=m.name||m.email.split('@')[0]||'מישהו'}}
function setTitle(){const t=cur?cur.name:'Fomo';$('#app h1').textContent=t;document.title=cur?cur.name+' · Fomo':'Fomo'}
async function switchList(id){const l=lists.find(x=>x.id===id)||lists[0];if(!l)return;cur=l;try{localStorage.setItem('rs-list',l.id)}catch{}
  rows=[];loaded=false;fitted=false;view='all';cuisF='';closeSheet();setTitle();render();
  acts=[];polls=[];renderBell();renderNotices();sb.rpc('touch_list',{lid:l.id}).then(()=>{},()=>{});await loadMembers();await loadAll();if(page==='list')animIn();loadActivity();loadPolls()}

/* ---------- list ---------- */
function filtered(){const t=q.trim().toLowerCase();let list=rows.filter(r=>(!openF||(openState(r)||{}).open)&&(view==='all'||(view==='match'?isMatch(r):r.status===view))&&(!cuisF||r.cuisine===cuisF)&&(!t||[r.name,r.city,r.address,r.cuisine,r.notes,r.recBy,...(r.tags||[]),...(r.dishes||[]).map(d=>d.name)].join(' ').toLowerCase().includes(t)));
  const s={recent:(a,b)=>(b.updatedAt||0)-(a.updatedAt||0),rating:(a,b)=>avg(b)-avg(a),visit:(a,b)=>lastVisit(b).localeCompare(lastVisit(a)),name:(a,b)=>String(a.name).localeCompare(String(b.name),'he'),near:(a,b)=>(distKm(a)??1e9)-(distKm(b)??1e9)}[sort]||((a,b)=>0);return list.sort(s)}
function renderHead(){const been=rows.filter(r=>r.status==='been').length,want=rows.length-been,m=rows.filter(isMatch).length;
  $('#stats').innerHTML=loaded?`היינו ב־<b>${been}</b> · רוצים לנסות <b>${want}</b>${m?` · <b>${m}</b> ששנינו רוצים השבוע`:''}`:'טוען…'}
function renderList(){
  const cs=[...new Set(rows.map(r=>r.cuisine).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he'));
  if(cuisF&&!cs.includes(cuisF))cuisF='';
  const hasHours=rows.some(r=>r.hours&&Object.keys(r.hours).length);
  $('#cuis').innerHTML=(hasHours?`<button type="button" class="chip openchip" data-open-f="1" aria-pressed="${openF}">פתוח עכשיו</button>`:'')+(cs.length>1?[`<button type="button" class="chip" data-c="" aria-pressed="${!cuisF}">כל הסוגים</button>`,...cs.map(c=>`<button type="button" class="chip" data-c="${esc(c)}" aria-pressed="${cuisF===c}">${esc(c)}</button>`)].join(''):'');renderNotices();
  const g=$('#grid');
  if(!loaded){g.innerHTML='<div class="skel"></div><div class="skel"></div><div class="skel"></div>';return}
  if(!rows.length){g.innerHTML=`<div class="empty"><h2>עוד אין כאן מסעדות</h2><p>הוסיפו מקום שהייתם בו או מקום שאתם חולמים עליו, והרשימה תתחיל להתמלא.</p><button class="btn pri" type="button" data-act="add">הוסיפו את הראשונה</button></div>`;return}
  const list=filtered();
  if(!list.length){g.innerHTML=`<div class="empty"><h2>${view==='match'?'עוד אין מקום ששניכם בחרתם השבוע':'לא נמצא כלום'}</h2><p>${view==='match'?'לחצו "בא לי" על מקומות שבא לכם ללכת אליהם. כששניכם בוחרים אותו מקום, הוא יופיע כאן.':'נסו חיפוש אחר או הסירו סינון.'}</p></div>`;return}
  g.innerHTML=list.map((r,idx)=>{const p=(r.photos||[]).find(x=>x.path),a=avg(r),mv=iVoted(r),mt=isMatch(r);return `<article class="card" tabindex="0" data-id="${esc(r.id)}" style="--i:${Math.min(idx,12)}"><div class="cover">${p?photoImg(p,'loading="lazy"'):plate(r.name)}<div class="badges"><span class="badge ${r.status==='been'?'been':''}">${r.status==='been'?'היינו':'רוצים ללכת'}</span>${mt?'<span class="badge match">שנינו רוצים!</span>':''}${(()=>{const u=upcoming().find(x=>x.r.id===r.id);return u?`<span class="badge plan">${esc(whenTxt(u.v))}</span>`:''})()}${hhNow(r)?'<span class="badge hh">האפי אוור עכשיו</span>':''}</div>${r.fav?'<span class="heart" aria-label="מועדף">♥</span>':''}</div><div class="cbody"><h3>${esc(r.name)}</h3><p class="meta">${[r.cuisine,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).map(esc).join(' · ')||'&nbsp;'}</p><div class="mrow">${a?`<span class="rate"><i>★</i> ${a.toFixed(1)}</span>`:''}${(()=>{const o=openState(r);return o?`<span class="open ${o.open?'on':''}">${o.open?'פתוח':'סגור'}</span>`:''})()}${distKm(r)!=null?`<span class="dist">${esc(distTxt(distKm(r)))}</span>`:''}</div><div class="acts"><a class="btn sm" href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">${ICON.pin}מפות</a><a class="btn sm" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}Waze</a><button type="button" class="btn sm ${mv?'on':''} ${popId===r.id?'pop':''}" data-vote="${esc(r.id)}" aria-pressed="${mv}">${mv?'♥':'♡'} בא לי</button></div></div></article>`}).join('');
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
function allVisits(){const out=[];const td=today();for(const r of rows)for(const v of visitsOf(r))if(v.d<=td)out.push({r,v});return out.sort((a,b)=>b.v.d.localeCompare(a.v.d))}
function renderTimeline(){
  let vs=allVisits();const now=new Date(),md=d=>d.slice(5);
  const mem=vs.filter(({v})=>{const y=Number(v.d.slice(0,4));if(y>=now.getFullYear())return false;const t=new Date(now.getFullYear()+'-'+md(v.d)+'T12:00');return Math.abs(t-now)<3*864e5});
  $('#memory').innerHTML=mem.slice(0,3).map(({r,v})=>{const n=now.getFullYear()-Number(v.d.slice(0,4));return `<div class="memory">לפני ${n===1?'שנה':n+' שנים'}, ב־${esc(fmtD(v.d,{day:'numeric',month:'long'}))}, הייתם ב<a href="#timeline" data-open="${esc(r.id)}">${esc(r.name)}</a>${v.occ?' · '+esc(OCC[v.occ]||''):''}</div>`}).join('');
  if(tlF==='special')vs=vs.filter(({v})=>SPECIAL.includes(v.occ)||v.occ==='date');
  const el=$('#tl');if(!loaded){el.innerHTML='';return}
  const up=upcoming();const upH=up.length?`<div class="tl-month"><h3>בקרוב</h3><span class="meta">${up.length} יציאות מתוכננות</span></div>`+up.map(({r,v})=>`<div class="tl-item upc" data-open="${esc(r.id)}" tabindex="0"><span class="tl-day">${Number(v.d.slice(8))}</span><div class="tl-main"><b>${esc(r.name)}</b><div class="meta">${esc(fmtD(v.d,{weekday:'long',day:'numeric',month:'long'}))}${v.t?' · '+esc(v.t):''}</div></div><span class="occ sp">${esc(whenTxt(v))}</span></div>`).join(''):'';
  if(!vs.length&&upH){el.innerHTML=upH;return}
  if(!vs.length){el.innerHTML=`<div class="empty"><h2>${tlF==='special'?'עוד אין ימים מיוחדים':'עוד אין ביקורים'}</h2><p>בכל מקום אפשר להוסיף ביקור עם תאריך, סכום וסוג אירוע. הם יופיעו כאן לפי הסדר.</p></div>`;return}
  const groups={};for(const x of vs)(groups[x.v.d.slice(0,7)]=groups[x.v.d.slice(0,7)]||[]).push(x);
  el.innerHTML=upH+Object.entries(groups).map(([m,xs])=>{const sum=xs.reduce((a,{v})=>a+(Number(v.cost)||0),0);return `<div class="tl-month"><h3>${esc(fmtD(m+'-15',{month:'long',year:'numeric'}))}</h3><span class="meta">${xs.length} ${xs.length===1?'ביקור':'ביקורים'}${sum?' · '+ils(sum):''}</span></div>`+
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
  const newPlaces=rows.map(r=>visitsOf(r).filter(v=>v.d<=today()).map(v=>v.d).sort()[0]).filter(Boolean).filter(inY).length;
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
  const must=rows.flatMap(r=>(r.dishes||[]).filter(d=>d.v==='must').map(d=>({d:d.name,r})));const s2=achStats();
  el.innerHTML=`<button type="button" class="recap-btn" data-act="recap"><span class="rp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span><span><b>הסיכום שלנו ${stYear==='all'?'מאז ומעולם':'ב-'+esc(stYear)}</b><small>סיפור קצר עם התמונות, המקומות והמנות שלכם</small></span></button>
<div class="tiles">${tiles.map(([n,k])=>`<div class="tile"><div class="n">${esc(n)}</div><div class="k">${k}</div></div>`).join('')}</div>
<div class="panels">
<div class="panel wide"><h3>המנות שחובה להזמין</h3>${must.length?`<ul class="toplist dishes">${must.slice(0,12).map(x=>`<li data-open="${esc(x.r.id)}"><span>${esc(x.d)}</span><span class="meta">${esc(x.r.name)}</span></li>`).join('')}</ul>`:'<p class="note">סמנו מנות כ"חובה להזמין" בדף של כל מקום, והן יתרכזו כאן.</p>'}</div>
<div class="panel wide"><h3>ההישגים שלנו <small class="meta">${ACH.filter(a=>a[3](s2)).length} מתוך ${ACH.length}</small></h3><div class="achs">${ACH.map(a=>`<div class="ach ${a[3](s2)?'on':''}">${medal(a[4],a[3](s2))}<b>${esc(a[1])}</b><small>${esc(a[2])}</small></div>`).join('')}</div></div>
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
  render();if(page==='list')animIn()}
window.addEventListener('hashchange',route);

/* ---------- sheet ---------- */
let fmap=null,fmarker=null;
function killFormMap(){if(fmap){fmap.remove();fmap=null;fmarker=null}}
function openSheet(){$('#ov').hidden=false;document.body.style.overflow='hidden'}
function closeSheet(){if(story){clearTimeout(story.t);story=null}$('#ov').classList.remove('story-ov');$('#ov').hidden=true;document.body.style.overflow='';openId=null;mode='view';clearInterval(pickTimer);killFormMap()}
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
${hoursForm(r)}
<label class="l full">הערות<textarea class="f" name="notes" maxlength="2000" placeholder="מה שמענו, למה רוצים ללכת…">${esc(r.notes)}</textarea></label>
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

function visitForm(){return `<p class="note" style="margin:10px 0 0">תאריך עתידי נשמר כיציאה מתוכננת, עם תזכורת ביומן.</p><form class="addrow" id="visitF"><input class="f" type="date" name="d" value="${today()}" aria-label="תאריך" style="flex:0 1 160px"><input class="f" type="time" name="t" aria-label="שעה (לא חובה)" style="flex:0 1 120px"><input class="f" type="number" name="cost" min="0" step="1" inputmode="numeric" placeholder="₪ כמה שילמנו" aria-label="סכום" style="flex:0 1 140px"><select class="f" name="occ" aria-label="סוג הביקור" style="flex:1 1 150px">${Object.entries(OCC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><input class="f" name="note" maxlength="100" placeholder="הערה קצרה (לא חובה)" aria-label="הערה"><label class="btn sm rcpt-b">${ICON.cam}סריקת קבלה<input type="file" accept="image/*" capture="environment" hidden class="rcpt"></label><button class="btn pri" type="submit">שמירה</button><span class="note" id="rcptSt" style="flex:1 1 100%;margin:0"></span></form>`}

function renderDetail(){
  const r=byId(openId),box=$('#sb');
  if(!r){if(mode!=='new')closeSheet();return}
  if(mode==='edit'){if(!$('#ef')){box.innerHTML=formHtml(r);initFormMap()}return}
  if(mode==='confirm'){box.innerHTML=`<div class="sec dh"><h2>למחוק את ${esc(r.name)}?</h2><p>המקום, הדירוגים, המנות, הביקורים והתמונות יימחקו לתמיד.</p><div class="row"><button class="btn pri" type="button" data-act="reallyDel">כן, למחוק</button><button class="btn" type="button" data-act="cancel">ביטול</button></div></div>`;return}
  const ae=document.activeElement;if(ae&&box.contains(ae)&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName))return;
  const ratings=r.ratings||{},others=Object.keys(ratings).filter(k=>k!==myId&&k!=='owner'&&ratings[k]>0),vt=voters(r).filter(k=>k!==myId);
  const mine=ratings[myId]||0,site=safeUrl(r.site),dishes=r.dishes||[],photos=(r.photos||[]).filter(p=>p.path),visits=visitsOf(r).sort((a,b)=>b.d.localeCompare(a.d)),spent=visits.filter(v=>v.d<=today()).reduce((a,v)=>a+(Number(v.cost)||0),0),mv=iVoted(r);
  const old=$('#gframe'),keep=old&&old.dataset.src===gEmbed(r)?old:null;
  box.innerHTML=`<div class="sec dh"><div class="row" style="margin-bottom:8px"><span class="badge ${r.status==='been'?'been':''}">${r.status==='been'?'היינו':'רוצים ללכת'}</span>${isMatch(r)?'<span class="badge match">שנינו רוצים השבוע!</span>':''}${(r.tags||[]).map(t=>`<span class="chip" style="cursor:default">${esc(t)}</span>`).join('')}</div>
<h2>${esc(r.name)}</h2><p class="meta" style="margin-top:6px">${[r.cuisine,r.address,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).map(esc).join(' · ')}</p>
${r.recBy?`<p class="meta" style="margin-top:4px">המליץ/ה: <b style="color:var(--ink)">${esc(r.recBy)}</b></p>`:''}
<div class="row" style="margin-top:14px"><a class="btn pri" href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">${ICON.pin}גוגל מפות</a><a class="btn pri" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}ניווט ב־Waze</a>${site?`<a class="btn" href="${esc(site)}" target="_blank" rel="noopener">${ICON.link}אתר / הזמנה</a>`:''}<button class="btn" type="button" data-act="share">${ICON.share}שליחת מיקום</button><button class="btn" type="button" data-act="shareCard">${ICON.card}כרטיס לשיתוף</button>${exact(r)?`<button class="btn" type="button" data-act="copyLL">${ICON.copy}העתקת קואורדינטות</button>`:''}</div>
<div class="mini" id="gwrap"></div>
<p class="note">${exact(r)?'מיקום מדויק נשמר.':hasLL(r)?'המיקום משוער. אפשר לדייק אותו בעריכה.':'עוד אין מיקום מדויק. בעריכה אפשר לחפש את המקום או לסמן אותו על המפה.'}</p></div>
${hoursView(r)}<div class="sec"><h4>בא לנו השבוע?</h4><div class="row"><button class="btn ${mv?'on':''}" type="button" data-act="vote" aria-pressed="${mv}">${mv?'♥ בא לי!':'♡ בא לי השבוע'}</button><span class="meta">${vt.length?vt.map(k=>esc(nm(k))).join(', ')+' גם רוצה':'עוד אף אחד אחר לא בחר'}</span></div><p class="note">הבחירה תקפה לשבוע. כששניכם בוחרים, המקום עולה לראש ההגרלה.</p></div>
<div class="sec"><h4>הדירוג שלנו</h4><div class="rlist"><div class="r"><b style="min-width:56px">אני</b><span class="stars" role="group" aria-label="הדירוג שלי">${[1,2,3,4,5].map(n=>`<button type="button" class="${n<=mine?'on':''}" data-act="rate" data-v="${n}" aria-label="${n} כוכבים">★</button>`).join('')}</span></div>${others.map(k=>`<div class="r"><b>${esc(nm(k))}</b><span class="rate"><i>${'★'.repeat(ratings[k])}</i><span style="color:var(--line)">${'★'.repeat(5-ratings[k])}</span></span></div>`).join('')}</div></div>
${commentsHtml(r)}<div class="sec"><h4>תמונות</h4>${photos.length?`<div class="gal">${(r.photos||[]).map((p,i)=>p.path?`<div class="ph">${photoImg(p,`loading="lazy" data-act="zoom" data-i="${i}"`)}<button type="button" data-act="rmPhoto" data-i="${i}" aria-label="הסרת תמונה">×</button></div>`:'').join('')}</div>`:'<p class="note">עוד אין תמונות. צלמו את המנות, את הקוקטיילים או את שניכם.</p>'}
<div class="row" style="margin-top:12px"><label class="btn pri">${ICON.cam}צלמו עכשיו<input type="file" accept="image/*" capture="environment" hidden class="up"></label><label class="btn">${ICON.img}מהגלריה<input type="file" accept="image/*" multiple hidden class="up"></label><span class="note" id="upst" style="margin:0"></span></div></div>
<div class="sec"><h4>ביקורים${spent?` · סה"כ ${ils(spent)}`:''}</h4>${visits.length?visits.map(v=>`<div class="vrow ${v.d>today()||(v.d===today()&&v.t)?'plan':''}"><b>${esc(fmtD(v.d))}${v.t?' · '+esc(v.t):''}</b>${v.d>today()||(v.d===today()&&v.t)?`<span class="occ sp">${esc(whenTxt(v))}</span><a class="btn sm" href="${icsData(r,v)}" download="fomo.ics">${ICON.cal}ליומן</a><a class="btn sm" href="${esc(gcalUrl(r,v))}" target="_blank" rel="noopener">Google</a>`:''}${v.occ?`<span class="occ ${SPECIAL.includes(v.occ)?'sp':''}">${esc(OCC[v.occ]||'')}</span>`:''}${v.note?`<span class="meta">${esc(v.note)}</span>`:''}<span class="money">${Number(v.cost)?ils(v.cost):''}</span><button type="button" class="del" data-act="rmVisit" data-i="${v.i}" aria-label="הסרת ביקור">×</button></div>`).join(''):'<p class="note">עוד לא רשמתם ביקור.</p>'}
${visitForm()}</div>
<div class="sec"><h4>מנות ומשקאות</h4>${dishes.length?dishes.map((d,i)=>`<div class="dish"><span>${esc(d.name)}</span><button type="button" class="v ${d.v||'ok'}" data-act="verd" data-i="${i}" title="לחצו להחלפה">${VERD[d.v]||VERD.ok}</button><button type="button" class="del" data-act="rmDish" data-i="${i}" aria-label="הסרה">×</button></div>`).join(''):'<p class="note">רשמו מה הזמנתם, ומה חובה להזמין בפעם הבאה.</p>'}
<form class="addrow" id="dishF"><input class="f" name="d" maxlength="80" placeholder="מנה או קוקטייל" aria-label="שם המנה"><button class="btn" type="submit">הוספה</button></form></div>
${r.notes?`<div class="sec"><h4>הערות</h4><p style="margin:0;white-space:pre-wrap">${esc(r.notes)}</p></div>`:''}
<div class="sec row"><button class="btn" type="button" data-act="fav">${r.fav?'♥ מועדף':'♡ סמנו כמועדף'}</button><button class="btn" type="button" data-act="edit">עריכה</button><button class="btn" type="button" data-act="del" style="color:var(--bad)">מחיקה</button></div>`;
  const gw=$('#gwrap');if(keep)gw.appendChild(keep);else gw.innerHTML=`<iframe id="gframe" data-src="${esc(gEmbed(r))}" src="${esc(gEmbed(r))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="מפת גוגל"></iframe>`;
  hydrate();
}

/* ---------- picker ---------- */
let pickF={price:0,tag:'',near:false,open:false};
async function pick(m,keep){
  killFormMap();openId=null;mode='pick';openSheet();if(!keep)pickF={price:0,tag:'',near:false,open:false};
  if(pickF.near)await getLoc();
  const fil=r=>(!cuisF||r.cuisine===cuisF)&&(!pickF.price||(r.price&&r.price<=pickF.price))&&(!pickF.tag||(r.tags||[]).includes(pickF.tag))&&(!pickF.open||(openState(r)||{}).open)&&(!pickF.near||((distKm(r)??99)<=5));
  const matches=rows.filter(r=>isMatch(r)&&fil(r)),wants=rows.filter(r=>r.status!=='been'&&fil(r)),favs=rows.filter(r=>(r.fav||avg(r)>=4)&&fil(r));
  if(!m)m=matches.length?'match':'want';
  const pool=m==='match'?matches:m==='fav'?favs:wants;
  const seg=`<div class="seg" role="group" aria-label="מאיפה להגריל" style="margin-top:10px"><button type="button" data-act="pickm" data-m="want" aria-pressed="${m==='want'}">רוצים ללכת (${wants.length})</button><button type="button" data-act="pickm" data-m="match" aria-pressed="${m==='match'}">שנינו רוצים (${matches.length})</button><button type="button" data-act="pickm" data-m="fav" aria-pressed="${m==='fav'}">מקומות שאהבנו (${favs.length})</button></div>`;
  const ch=(k,v,t,on)=>`<button type="button" class="chip" data-act="pf" data-k="${k}" data-v="${v}" data-m="${m}" aria-pressed="${on}">${t}</button>`;
  const hasH=rows.some(r=>r.hours&&Object.keys(r.hours).length);
  const filters=`<div class="pfil"><div class="chips">${ch('price',0,'כל מחיר',!pickF.price)}${ch('price',2,'עד ₪₪',pickF.price===2)}${ch('price',3,'עד ₪₪₪',pickF.price===3)}</div><div class="chips">${ch('tag','','כל אירוע',!pickF.tag)}${ch('tag','דייט','דייט',pickF.tag==='דייט')}${ch('tag','מתאים לחברים','עם חברים',pickF.tag==='מתאים לחברים')}</div><div class="chips">${ch('near',pickF.near?'':'1','עד 5 ק״מ ממני',pickF.near)}${hasH?ch('open',pickF.open?'':'1','פתוח עכשיו',pickF.open):''}</div></div>`;
  const pollB=`<button class="btn" type="button" data-act="pollNew" style="margin-top:16px">${ICON.vote}הצבעה עם חברים</button>`;
  const s=$('#sb');
  if(!pool.length){s.innerHTML=`<div class="pick"><h2>לאן הולכים הערב?</h2>${seg}${filters}<p class="note" style="margin-top:18px">${pickF.price||pickF.tag||pickF.near||pickF.open?'אין מקום שמתאים לסינון. נסו להרחיב אותו.':m==='match'?'עוד אין מקום ששניכם לחצתם עליו "בא לי" השבוע.':m==='fav'?'עוד אין מקומות מועדפים או עם דירוג 4 ומעלה.':'הוסיפו מקומות לרשימת "רוצים ללכת", וההגרלה תבחר בשבילכם.'}</p>${pollB}</div>`;return}
  s.innerHTML=`<div class="pick"><h2>לאן הולכים הערב?</h2>${seg}${filters}${cuisF?`<p class="note">רק ${esc(cuisF)}</p>`:''}<div class="nm" id="pn" aria-live="polite"></div><p class="meta" id="pm"></p><div class="row" id="pa"></div>${pollB}</div>`;
  const choice=pool[Math.floor(Math.random()*pool.length)];
  const done=()=>{$('#pn').textContent=choice.name;$('#pm').textContent=[choice.cuisine,choice.city,distKm(choice)!=null?distTxt(distKm(choice)):''].filter(Boolean).join(' · ');$('#pa').innerHTML=`<a class="btn pri" href="${esc(wazeUrl(choice))}" target="_blank" rel="noopener">${ICON.nav}יוצאים! Waze</a><button class="btn" type="button" data-act="open" data-id="${esc(choice.id)}">פרטים</button><button class="btn" type="button" data-act="pickm" data-m="${m}">הגרלה נוספת</button>`};
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
<div class="sec"><h4>מראה</h4><div class="seg" role="group" aria-label="ערכת צבעים">${[['auto','אוטומטי'],['light','בהיר'],['dark','כהה']].map(([k,t])=>`<button type="button" data-act="theme" data-t="${k}" aria-pressed="${curTheme()===k}">${t}</button>`).join('')}</div></div>
<div class="sec"><h4>ייבוא</h4><button class="btn" type="button" data-act="import">${ICON.pin}ייבוא מקומות שמורים מגוגל מפות</button></div>
<div class="sec"><h4>התקנה במסך הבית</h4>${isStandalone()?'<p class="note" style="margin:0">האפליקציה כבר מותקנת במכשיר הזה.</p>':installEvt?'<button class="btn pri" type="button" data-act="install">התקנת האפליקציה</button>':isIOS()?'<ol class="steps"><li>פותחים את הקישור ב־Safari.</li><li>לוחצים על כפתור השיתוף (ריבוע עם חץ למעלה).</li><li>בוחרים "הוספה למסך הבית" ולוחצים "הוספה".</li></ol>':'<ol class="steps"><li>פותחים את הקישור ב־Chrome.</li><li>תפריט שלוש הנקודות, ואז "התקנת האפליקציה" או "הוספה למסך הבית".</li></ol>'}
</div>
<div class="sec"><button class="btn" type="button" data-act="signout">התנתקות</button></div>`}
const codeFrom=v=>{v=String(v||'').trim();try{const u=new URL(v);return u.searchParams.get('join')||''}catch{}return /^[a-f0-9]{8,40}$/i.test(v)?v:''};
async function doCreateList(name){const {data,error}=await sb.rpc('create_list',{list_name:name});if(error){toast(errMsg(error));return null}await loadLists();return data}
async function doJoin(code){const {data,error}=await sb.rpc('join_list',{code});if(error){toast(errMsg(error));return null}if(!data){toast('קישור ההזמנה לא תקף. אולי אופס? בקשו קישור חדש.');return null}await loadLists();return data}

/* ================= features: offline ================= */
const isNetErr=e=>!navigator.onLine||/fetch|network|load failed|NetworkError/i.test(String(e&&(e.message||e))||'');
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
function cacheRows(){if(cur)lsSet('rs-cache-'+cur.id,rows)}
let offToast=0;
function queueOp(op){const q=lsGet('rs-outbox',[]);q.push(op);lsSet('rs-outbox',q);if(Date.now()-offToast>8000){offToast=Date.now();toast('אין חיבור. השינוי נשמר במכשיר ויסונכרן כשהחיבור יחזור.')}cacheRows();setOffline()}
let flushing=false;
async function flushOutbox(){if(flushing||!navigator.onLine||!sb)return;flushing=true;let q=lsGet('rs-outbox',[]),done=0;
  while(q.length){const op=q[0];try{const {error}=op.isNew?await sb.from('restaurants').insert({id:op.id,list_id:op.lid,data:op.patch}):await sb.rpc('patch_restaurant',{rid:op.id,patch:op.patch});if(error&&isNetErr(error))break;q.shift();done++;lsSet('rs-outbox',q)}catch(e){if(isNetErr(e))break;q.shift();lsSet('rs-outbox',q)}}
  flushing=false;await flushPhotos();if(done){toast('השינויים שנשמרו במכשיר סונכרנו');loadAll()}setOffline()}
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('fomo',1);r.onupgradeneeded=()=>r.result.createObjectStore('up',{autoIncrement:true});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function idbAdd(v){const d=await idb();return new Promise(r=>{const t=d.transaction('up','readwrite');t.objectStore('up').add(v);t.oncomplete=()=>r()})}
async function idbAll(){const d=await idb();return new Promise(r=>{const out=[];const t=d.transaction('up');t.objectStore('up').openCursor().onsuccess=e=>{const c=e.target.result;if(c){out.push({k:c.key,v:c.value});c.continue()}else r(out)}})}
async function idbDel(k){const d=await idb();return new Promise(r=>{const t=d.transaction('up','readwrite');t.objectStore('up').delete(k);t.oncomplete=()=>r()})}
async function flushPhotos(){if(!navigator.onLine)return;let items=[];try{items=await idbAll()}catch{return}
  for(const {k,v} of items){try{const path=`${v.rid}/${uuid()}.jpg`;const {error}=await sb.storage.from('photos').upload(path,v.blob,{contentType:'image/jpeg'});if(error)throw error;
    let r=byId(v.rid);if(!r){const {data}=await sb.from('restaurants').select('data').eq('id',v.rid).maybeSingle();r=data&&data.data}
    if(r){const photos=[...(r.photos||[]),{path,by:v.by,at:v.at}];if(byId(v.rid))await save(v.rid,{photos,updatedAt:Date.now()});else await sb.rpc('patch_restaurant',{rid:v.rid,patch:{photos}})}
    await idbDel(k)}catch(e){if(isNetErr(e))return}}}
function setOffline(){const n=lsGet('rs-outbox',[]).length;const el=$('#status');if(!el)return;if(!navigator.onLine)el.textContent='אין חיבור לאינטרנט · מוצגים הנתונים השמורים במכשיר'+(n?` · ${n} שינויים ממתינים לסנכרון`:'');else if(el.textContent.startsWith('אין חיבור'))el.textContent=''}
window.addEventListener('online',()=>{setOffline();flushOutbox()});window.addEventListener('offline',setOffline);

/* ================= activity feed ================= */
let acts=[];
const relT=t=>{const m=(Date.now()-new Date(t))/6e4;return m<1?'עכשיו':m<60?`לפני ${Math.round(m)} דק׳`:m<1440?`לפני ${Math.round(m/60)} שע׳`:m<2880?'אתמול':fmtD(String(t).slice(0,10),{day:'numeric',month:'short'})};
function logAct(kind,rid,text){if(!cur||!navigator.onLine)return;sb.from('activity').insert({list_id:cur.id,kind,restaurant_id:rid||null,text}).then(()=>{},()=>{})}
async function loadActivity(){if(!cur)return;const lid=cur.id;try{const {data}=await sb.from('activity').select('*').eq('list_id',lid).order('created_at',{ascending:false}).limit(60);if(cur&&cur.id===lid){acts=data||[];renderBell()}}catch{}}
const seenKey=()=>'rs-seen-'+(cur&&cur.id);
function unread(){const s=lsGet(seenKey(),0);return acts.filter(a=>a.user_id!==myId&&new Date(a.created_at).getTime()>s).length}
function renderBell(){const n=unread();document.querySelectorAll('.bell-n').forEach(b=>{b.textContent=n>9?'9+':String(n);b.hidden=!n})}
const ACT_IC={add:'plus',photo:'cam',comment:'chat',visit:'pin',plan:'cal',match:'heart',poll:'vote'};
function feedSheet(){killFormMap();openId=null;mode='feed';openSheet();lsSet(seenKey(),Date.now());renderBell();
  $('#sb').innerHTML=`<div class="sec dh"><h2>מה חדש</h2><p class="meta" style="margin-top:6px">מה קורה ברשימה "${esc(cur.name)}"</p></div><div class="sec"><ul class="feed">${acts.length?acts.map(a=>`<li ${a.restaurant_id?`data-act="open" data-id="${esc(a.restaurant_id)}"`:''}><span class="av" style="--h:${hue(a.user_id)}">${esc((nm(a.user_id)||'?').charAt(0))}</span><span class="ft"><b>${esc(nm(a.user_id))}</b> ${esc(a.text)}<small>${relT(a.created_at)}</small></span></li>`).join(''):'<li class="note">עוד לא קרה כלום. ברגע שמישהו יוסיף מקום, תמונה או תגובה, זה יופיע כאן.</li>'}</ul></div>`}

/* ================= comments ================= */
const cmts={};
async function loadComments(rid){cmts[rid]=cmts[rid]||null;try{const {data}=await sb.from('comments').select('*').eq('restaurant_id',rid).order('created_at');cmts[rid]=data||[];if(openId===rid&&mode==='view')renderDetail()}catch{cmts[rid]=[]}}
const EMO=['❤️','🔥','😋','🤤','👌','🍸','🍷','👏'];
function commentsHtml(r){if(cmts[r.id]===undefined){cmts[r.id]=null;loadComments(r.id)}const arr=cmts[r.id];
  return `<div class="sec"><h4>שיחה על המקום</h4><div class="cmts">${arr===null?'<p class="note">טוען…</p>':arr.length?arr.map(c=>`<div class="cmt ${c.user_id===myId?'me':''}"><span class="av" style="--h:${hue(c.user_id)}">${esc(nm(c.user_id).charAt(0))}</span><div class="bub"><b>${esc(nm(c.user_id))}</b><p>${esc(c.body)}</p><small>${relT(c.created_at)}</small></div>${c.user_id===myId||isOwner()?`<button type="button" class="del" data-act="rmCmt" data-cid="${esc(c.id)}" aria-label="מחיקת תגובה">×</button>`:''}</div>`).join(''):'<p class="note">עוד אין תגובות. מה דעתכם על המקום?</p>'}</div>
<div class="emo">${EMO.map(e=>`<button type="button" class="emo-b" data-act="emo" data-e="${e}">${e}</button>`).join('')}</div>
<form class="addrow" id="cmtF"><input class="f" name="c" maxlength="500" placeholder="כתבו משהו…" aria-label="תגובה"><button class="btn pri" type="submit">שליחה</button></form></div>`}
async function sendComment(r,body){body=String(body||'').trim().slice(0,500);if(!body)return;if(!navigator.onLine){toast('צריך חיבור לאינטרנט כדי להגיב');return}
  const {data,error}=await sb.from('comments').insert({list_id:cur.id,restaurant_id:r.id,body}).select().single();if(error){toast(errMsg(error));return}
  cmts[r.id]=[...(cmts[r.id]||[]).filter(c=>c.id!==data.id),data];logAct('comment',r.id,`הגיב/ה על ${r.name}: "${body.slice(0,60)}"`);renderDetail()}

/* ================= confetti & celebration ================= */
function confetti(n=90){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const box=document.createElement('div');box.className='confetti';const cs=['#FF9A3C','#FF5E4D','#FF3D7F','#FFD166','#14B88A','#8E7CFF'];
  for(let i=0;i<n;i++){const s=document.createElement('i');s.style.cssText=`left:${Math.random()*100}%;background:${cs[i%cs.length]};animation-delay:${Math.random()*.6}s;animation-duration:${2+Math.random()*1.6}s;transform:rotate(${Math.random()*360}deg);width:${6+Math.random()*7}px;height:${8+Math.random()*10}px`;box.appendChild(s)}
  document.body.appendChild(box);setTimeout(()=>box.remove(),4200)}

/* ================= polls ================= */
let polls=[],openPoll=null;
async function loadPolls(){if(!cur)return;const lid=cur.id;try{const since=new Date(Date.now()-3*864e5).toISOString();const {data}=await sb.from('polls').select('*').eq('list_id',lid).gte('created_at',since).order('created_at',{ascending:false});if(cur&&cur.id===lid){polls=data||[];renderNotices()}}catch{}}
function pollCounts(p){const c={};for(const v of Object.values(p.votes||{}))c[v]=(c[v]||0)+1;return c}
function pollWinner(p){const c=pollCounts(p);let best=null,bn=-1;for(const o of p.options||[]){if((c[o]||0)>bn){bn=c[o]||0;best=o}}return best}
function pollSheet(pid){const p=polls.find(x=>x.id===pid);if(!p)return;killFormMap();openId=null;mode='poll';openPoll=pid;openSheet();renderPoll()}
function renderPoll(){const p=polls.find(x=>x.id===openPoll);if(!p||mode!=='poll')return;const c=pollCounts(p),tot=Object.keys(p.votes||{}).length,mine=(p.votes||{})[myId],canEnd=p.created_by===myId||isOwner();
  const voters=o=>Object.entries(p.votes||{}).filter(([,v])=>v===o).map(([u])=>nm(u));
  if(p.closed){const w=byId(pollWinner(p));$('#sb').innerHTML=`<div class="pick"><p class="meta">${esc(p.title)} · ${tot} הצביעו</p><h2 style="margin-top:8px">והמנצח הוא…</h2><div class="nm">${esc(w?w.name:'—')}</div>${w?`<p class="meta">${esc([w.cuisine,w.city].filter(Boolean).join(' · '))}</p><div class="row"><a class="btn pri" href="${esc(wazeUrl(w))}" target="_blank" rel="noopener">${ICON.nav}יוצאים! Waze</a><button class="btn" type="button" data-act="open" data-id="${esc(w.id)}">פרטים</button></div>`:''}${canEnd?'<button class="link-btn" type="button" data-act="pollDel">מחיקת ההצבעה</button>':''}</div>`;return}
  $('#sb').innerHTML=`<div class="sec dh"><h2>${esc(p.title)}</h2><p class="meta" style="margin-top:6px">${tot} הצביעו · ${mine?'אפשר לשנות את ההצבעה':'בחרו את המקום שהכי בא לכם'}</p></div><div class="sec"><div class="popts">${(p.options||[]).map(o=>{const r=byId(o),n=c[o]||0,pc=tot?Math.round(n/tot*100):0;return `<button type="button" class="popt ${mine===o?'sel':''}" data-act="pollVote" data-o="${esc(o)}"><span class="pb" style="width:${pc}%"></span><span class="pt"><b>${esc(r?r.name:'מקום שנמחק')}</b><small>${esc(r?[r.cuisine,r.city].filter(Boolean).join(' · '):'')}${voters(o).length?' · '+esc(voters(o).join(', ')):''}</small></span><span class="pn">${n}</span></button>`}).join('')}</div>
<div class="row" style="margin-top:16px">${canEnd?'<button class="btn pri" type="button" data-act="pollClose">סיום והכרזה על המנצח</button><button class="btn" type="button" data-act="pollDel" style="color:var(--bad)">מחיקה</button>':''}<button class="btn" type="button" data-act="shareInvite">${ICON.share}הזמנת חברים להצביע</button></div><p class="note">חברים צריכים להיות ברשימה כדי להצביע. אפשר לשלוח להם את קישור ההזמנה.</p></div>`}
function pollNewSheet(){killFormMap();openId=null;mode='pollnew';openSheet();const cands=rows.filter(r=>r.status!=='been'||r.fav||avg(r)>=4);
  $('#sb').innerHTML=`<form id="pollF" class="sec dh"><h2>הצבעה עם חברים</h2><p class="meta" style="margin-top:6px">בחרו 2 עד 4 מקומות, וכל מי שברשימה יצביע.</p><label class="l" style="margin-top:14px">כותרת<input class="f" name="t" maxlength="60" value="לאן יוצאים הערב?"></label><div class="chips" style="margin-top:14px">${cands.map(r=>`<label class="chip"><input type="checkbox" name="o" value="${esc(r.id)}"><span>${esc(r.name)}</span></label>`).join('')||'<p class="note">אין עדיין מקומות ברשימה.</p>'}</div><p class="note" id="pollErr"></p><div class="row" style="margin-top:12px"><button class="btn pri" type="submit">פתיחת הצבעה</button></div></form>`}
async function createPoll(fm){const opts=[...fm.querySelectorAll('input[name=o]:checked')].map(i=>i.value);if(opts.length<2||opts.length>4){$('#pollErr').textContent='בחרו בין 2 ל-4 מקומות';return}
  const title=fm.elements.t.value.trim()||'לאן יוצאים הערב?';const {data,error}=await sb.from('polls').insert({list_id:cur.id,title,options:opts}).select().single();if(error){toast(errMsg(error));return}
  polls.unshift(data);renderNotices();logAct('poll',null,`פתח/ה הצבעה: ${title}`);pollSheet(data.id)}

/* ================= planned dates ================= */
const isPast=v=>v.d<=today();
const upcoming=()=>{const out=[];for(const r of rows)for(const v of visitsOf(r))if(v.d>=today()&&(v.d>today()||v.t))out.push({r,v});return out.filter(({v})=>!(v.d===today()&&!v.t)).sort((a,b)=>(a.v.d+(a.v.t||'')).localeCompare(b.v.d+(b.v.t||'')))};
const daysTo=d=>Math.round((new Date(d+'T12:00')-new Date(today()+'T12:00'))/864e5);
const whenTxt=v=>{const n=daysTo(v.d);return (n===0?'היום':n===1?'מחר':`בעוד ${n} ימים`)+(v.t?` ב-${v.t}`:'')};
function icsData(r,v){const d=v.d.replace(/-/g,''),t=(v.t||'').replace(':','');const st=t?`DTSTART:${d}T${t}00`:`DTSTART;VALUE=DATE:${d}`;
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Fomo//HE','BEGIN:VEVENT',`UID:${r.id}-${d}@fomo`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}Z`,st,t?'DURATION:PT2H':'DURATION:P1D',`SUMMARY:${r.name} · Fomo`,`LOCATION:${[r.address,r.city].filter(Boolean).join(', ')}`,`URL:${mapsUrl(r)}`,'BEGIN:VALARM','TRIGGER:-PT2H','ACTION:DISPLAY',`DESCRIPTION:${r.name}`,'END:VALARM','END:VEVENT','END:VCALENDAR'];
  return 'data:text/calendar;charset=utf-8,'+encodeURIComponent(L.join('\r\n'))}
function gcalUrl(r,v){const d=v.d.replace(/-/g,'');let dates;if(v.t){const [h,m]=v.t.split(':').map(Number);const e=new Date(2000,0,1,h+2,m);dates=`${d}T${v.t.replace(':','')}00/${d}T${String(e.getHours()).padStart(2,'0')}${String(e.getMinutes()).padStart(2,'0')}00`}else{const n=new Date(v.d+'T12:00');n.setDate(n.getDate()+1);dates=`${d}/${n.toLocaleDateString('en-CA').replace(/-/g,'')}`}
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(r.name+' · Fomo')+'&dates='+dates+'&location='+encodeURIComponent([r.address,r.city].filter(Boolean).join(', '))}

/* ================= opening hours ================= */
const DAYS=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
const hm=s=>{const [h,m]=String(s||'').split(':').map(Number);return h*60+(m||0)};
function openState(r){const H=r.hours;if(!H||!Object.keys(H).length)return null;const n=new Date(),d=n.getDay(),m=n.getHours()*60+n.getMinutes();
  const y=H[(d+6)%7];if(y&&hm(y[1])<hm(y[0])&&m<hm(y[1]))return {open:true,until:y[1]};
  const t=H[d];if(t===undefined)return null;if(t===null)return {open:false};const o=hm(t[0]),c=hm(t[1]);
  if(c>o?(m>=o&&m<c):(m>=o||m<c))return {open:true,until:t[1]};return {open:false,from:m<o?t[0]:null}}
function hhNow(r){const h=r.hh;if(!h||!h.f||!h.t)return false;const n=new Date(),m=n.getHours()*60+n.getMinutes(),o=hm(h.f),c=hm(h.t);return c>o?(m>=o&&m<c):(m>=o||m<c)}
function hoursForm(r){const H=r.hours||{},hh=r.hh||{};return `<details class="hours full"${Object.keys(H).length||hh.f?' open':''}><summary>שעות פתיחה והאפי אוור</summary><div class="hgrid">${DAYS.map((dn,i)=>{const h=H[i];return `<div class="hrow"><span class="hd">${dn}</span><input class="f" type="time" name="ho${i}" value="${h?esc(h[0]):''}" aria-label="פתיחה ${dn}"><span>עד</span><input class="f" type="time" name="hc${i}" value="${h?esc(h[1]):''}" aria-label="סגירה ${dn}"><label class="chip sm"><input type="checkbox" name="hx${i}" ${h===null?'checked':''}><span>סגור</span></label></div>`}).join('')}
<button type="button" class="btn sm" data-act="copyHours">העתקת יום א׳ לכל השבוע</button>
<div class="hrow hhrow"><span class="hd">האפי אוור</span><input class="f" type="time" name="hhf" value="${esc(hh.f||'')}" aria-label="האפי אוור מ"><span>עד</span><input class="f" type="time" name="hht" value="${esc(hh.t||'')}" aria-label="האפי אוור עד"></div></div></details>`}
function readHours(fd){const H={};for(let i=0;i<7;i++){if(fd.get('hx'+i)){H[i]=null;continue}const o=fd.get('ho'+i),c=fd.get('hc'+i);if(o&&c)H[i]=[String(o),String(c)]}const f=fd.get('hhf'),t=fd.get('hht');return {hours:H,hh:f&&t?{f:String(f),t:String(t)}:null}}
function hoursView(r){const H=r.hours||{};if(!Object.keys(H).length&&!(r.hh&&r.hh.f))return '';const st=openState(r),d=new Date().getDay();
  return `<div class="sec"><h4>שעות פתיחה ${st?`<span class="open ${st.open?'on':''}">${st.open?'פתוח עכשיו'+(st.until?' · עד '+esc(st.until):''):'סגור עכשיו'+(st.from?' · נפתח ב-'+esc(st.from):'')}</span>`:''}</h4><div class="htab">${DAYS.map((dn,i)=>H[i]===undefined?'':`<div class="${i===d?'today':''}"><span>${dn}</span><span${H[i]===null?'':' dir="ltr"'}>${H[i]===null?'סגור':esc(H[i][0])+'–'+esc(H[i][1])}</span></div>`).join('')}${r.hh&&r.hh.f?`<div class="hh ${hhNow(r)?'now':''}"><span>האפי אוור</span><span><bdi dir="ltr">${esc(r.hh.f)}–${esc(r.hh.t)}</bdi>${hhNow(r)?' · עכשיו!':''}</span></div>`:''}</div></div>`}

/* ================= near me ================= */
let myLoc=null;
function getLoc(){return new Promise(res=>{if(myLoc&&Date.now()-myLoc.at<6e5)return res(myLoc);if(!navigator.geolocation)return res(null);navigator.geolocation.getCurrentPosition(p=>{myLoc={lat:p.coords.latitude,lng:p.coords.longitude,at:Date.now()};res(myLoc)},()=>res(null),{enableHighAccuracy:false,timeout:10000,maximumAge:3e5})})}
function distKm(r){if(!myLoc||!hasLL(r))return null;const R=6371,t=x=>x*Math.PI/180,dl=t(r.lat-myLoc.lat),dg=t(r.lng-myLoc.lng);const a=Math.sin(dl/2)**2+Math.cos(t(myLoc.lat))*Math.cos(t(r.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(a))}
const distTxt=d=>d==null?'':(d<1?Math.round(d*1000/10)*10+' מ׳':d.toFixed(d<10?1:0)+' ק״מ')+' · ~'+Math.max(2,Math.round(d*2.2+2))+' דק׳';

/* ================= notices (today plans + polls) ================= */
function renderNotices(){const el=$('#pollBar');if(!el)return;const tp=upcoming().filter(({v})=>daysTo(v.d)<=1);const op=polls.filter(p=>!p.closed);
  el.innerHTML=[...tp.map(({r,v})=>`<button type="button" class="notice plan" data-open="${esc(r.id)}"><span class="ni">${ICON.cal}</span><span class="nt"><b>${esc(whenTxt(v))}: ${esc(r.name)}</b><small>${esc([r.address,r.city].filter(Boolean).join(', ')||'יציאה מתוכננת')}</small></span><span class="ng">פרטים</span></button>`),
   ...op.map(p=>{const n=Object.keys(p.votes||{}).length,mine=(p.votes||{})[myId];return `<button type="button" class="notice" data-poll="${esc(p.id)}"><span class="ni">${ICON.vote}</span><span class="nt"><b>${esc(p.title)}</b><small>${n} הצביעו · ${mine?'הצבעת':'עוד לא הצבעת'}</small></span><span class="ng">להצבעה</span></button>`})].join('')}

/* ================= share card ================= */
async function signed(path){if(urlCache[path])return urlCache[path];try{const {data}=await sb.storage.from('photos').createSignedUrls([path],604800);const u=data&&data[0]&&data[0].signedUrl;if(u)urlCache[path]=u;return u}catch{return null}}
const loadImg=src=>new Promise(res=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src});
function rr(x,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath()}
async function drawCard(r,withPhoto){const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#FF9A3C');g.addColorStop(.5,'#FF5E4D');g.addColorStop(1,'#FF3D7F');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.globalAlpha=.25;x.fillStyle='#FFD166';x.beginPath();x.arc(120,90,260,0,7);x.fill();x.fillStyle='#C2185B';x.beginPath();x.arc(1000,1300,300,0,7);x.fill();x.globalAlpha=1;
  let img=null;const p=withPhoto&&(r.photos||[]).find(p=>p.path);if(p){const u=await signed(p.path);if(u)img=await loadImg(u)}
  if(!img){const s=plate(r.name).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');img=await loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s))}
  x.save();rr(x,60,60,960,700,48);x.clip();if(img){const k=Math.max(960/img.width,700/img.height),w=img.width*k,h=img.height*k;x.drawImage(img,60+(960-w)/2,60+(700-h)/2,w,h)}x.restore();
  x.save();x.shadowColor='#0000002e';x.shadowBlur=40;x.shadowOffsetY=12;x.fillStyle='#fff';rr(x,60,700,960,500,48);x.fill();x.restore();
  x.direction='rtl';x.textAlign='right';x.fillStyle='#2A1630';let fs=78;x.font=`800 ${fs}px Rubik, sans-serif`;while(x.measureText(r.name).width>860&&fs>40){fs-=4;x.font=`800 ${fs}px Rubik, sans-serif`}x.fillText(r.name,970,800);
  x.font='600 38px Assistant, sans-serif';x.fillStyle='#8B7380';x.fillText([r.cuisine,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).join(' · '),970,860);
  let y=940;const a=avg(r);if(a){x.font='800 46px Rubik, sans-serif';x.fillStyle='#FFB547';x.fillText('★'.repeat(Math.round(a))+'☆'.repeat(5-Math.round(a)),970,y);x.fillStyle='#2A1630';x.textAlign='left';x.fillText(a.toFixed(1),110,y);x.textAlign='right';y+=70}
  const must=(r.dishes||[]).filter(d=>d.v==='must').map(d=>d.name).slice(0,3);if(must.length){x.font='700 34px Assistant, sans-serif';x.fillStyle='#FF5E4D';x.fillText('חובה להזמין:',970,y);x.fillStyle='#2A1630';x.font='600 36px Assistant, sans-serif';let line=must.join(' · ');while(x.measureText(line).width>860&&line.length>4)line=line.slice(0,-2);x.fillText(line,970,y+50);y+=110}
  if(r.recBy&&y<1150){x.font='600 32px Assistant, sans-serif';x.fillStyle='#8B7380';x.fillText('המליץ/ה: '+r.recBy,970,Math.min(y,1150))}
  x.textAlign='center';x.direction='ltr';x.fillStyle='#fff';x.font='italic 800 58px "Playfair Display", Georgia, serif';x.fillText('Fomo',W/2,1278);x.direction='rtl';x.font='700 30px Assistant, sans-serif';x.fillText('המקומות שאסור לפספס',W/2,1322);
  return new Promise((res,rej)=>{try{c.toBlob(b=>b?res(b):rej(new Error('blob')),'image/jpeg',.9)}catch(e){rej(e)}})}
async function shareCard(r,btn){if(btn)btn.disabled=true;try{await document.fonts.ready;let blob;try{blob=await drawCard(r,true)}catch{blob=await drawCard(r,false)}
  const file=new File([blob],'fomo-'+String(r.name).replace(/[^\w֐-׿]+/g,'-')+'.jpg',{type:'image/jpeg'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:r.name,text:shareText(r)});return}catch(e){if(e&&e.name==='AbortError')return}}
  const u=URL.createObjectURL(blob);mode='card';$('#sb').innerHTML=`<div class="sec dh"><h2>כרטיס לשיתוף</h2><p class="meta" style="margin-top:6px">שמרו את התמונה ושלחו בוואטסאפ או באינסטגרם.</p><img src="${u}" alt="כרטיס של ${esc(r.name)}" style="width:100%;border-radius:20px;margin-top:14px;box-shadow:var(--shadow)"><div class="row" style="margin-top:14px"><a class="btn pri" href="${u}" download="${esc(file.name)}">הורדת התמונה</a><button class="btn" type="button" data-act="open" data-id="${esc(r.id)}">חזרה למקום</button></div></div>`}
  catch(e){toast('לא הצלחנו ליצור כרטיס')}finally{if(btn)btn.disabled=false}}

/* ================= achievements ================= */
const ACH=[['first','ההתחלה','ביקור ראשון שנרשם',s=>s.visits>=1,'flag'],['v10','יוצאים קבועים','10 ביקורים',s=>s.visits>=10,'fire'],['v25','אלופי היציאות','25 ביקורים',s=>s.visits>=25,'trophy'],['p5','חוקרים','5 מקומות שונים',s=>s.places>=5,'map'],['p20','מפת טעמים','20 מקומות שונים',s=>s.places>=20,'map'],['c3','סביב העולם','3 סוגי מטבח',s=>s.cuisines>=3,'globe'],['c6','אזרחי העולם','6 סוגי מטבח',s=>s.cuisines>=6,'globe'],['city3','על הדרך','מקומות ב-3 ערים',s=>s.cities>=3,'pin'],['ph10','צלמי אוכל','10 תמונות',s=>s.photos>=10,'cam'],['date','רומנטיקנים','דייט ראשון שנרשם',s=>s.dates>=1,'heart'],['anniv','חוגגים ביחד','יום הולדת או יום נישואין',s=>s.special>=1,'cake'],['must5','יודעים מה להזמין','5 מנות "חובה"',s=>s.must>=5,'star'],['match','באותו ראש','מקום ששניכם רוצים',s=>s.match>=1,'heart'],['loyal','נאמנים','3 ביקורים באותו מקום',s=>s.loyal>=3,'trophy'],['wish10','חולמים בגדול','10 מקומות ברשימת החלומות',s=>s.wish>=10,'star']];
const ACH_IC={flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',fire:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 2 0-2-1-3 0-5z"/>',trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',pin:'<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',cake:'<path d="M4 20h16v-7H4zM4 15c2 1.5 4 1.5 5.3 0 1.4 1.5 4 1.5 5.4 0 1.3 1.5 3.3 1.5 5.3 0M12 13V9M12 6v.5"/>',star:'<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8z"/>'};
const medal=(ic,on)=>`<span class="medal ${on?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ACH_IC[ic]}</svg></span>`;
function achStats(){const past=allVisits(),pl=new Set(past.map(({r})=>r.id));const per={};for(const {r} of past)per[r.id]=(per[r.id]||0)+1;
  return {visits:past.length,places:pl.size,cuisines:new Set(past.map(({r})=>r.cuisine).filter(Boolean)).size,cities:new Set(past.map(({r})=>r.city).filter(Boolean)).size,photos:rows.reduce((a,r)=>a+(r.photos||[]).filter(p=>p.path).length,0),dates:past.filter(({v})=>v.occ==='date').length,special:past.filter(({v})=>v.occ==='anniv'||v.occ==='bday').length,must:rows.reduce((a,r)=>a+(r.dishes||[]).filter(d=>d.v==='must').length,0),match:rows.filter(isMatch).length,loyal:Math.max(0,...Object.values(per)),wish:rows.filter(r=>r.status!=='been').length}}
function checkAch(){if(!cur||!loaded)return;const s=achStats(),got=ACH.filter(a=>a[3](s)).map(a=>a[0]),key='rs-ach-'+cur.id,seen=lsGet(key,null);lsSet(key,got);if(seen===null)return;const fresh=got.filter(i=>!seen.includes(i));if(fresh.length){const a=ACH.find(x=>x[0]===fresh[0]);setTimeout(()=>achPop(a),500)}}
function achPop(a){const el=document.createElement('div');el.className='achpop';el.innerHTML=`${medal(a[4],true)}<div><small>הישג חדש!</small><b>${esc(a[1])}</b><span>${esc(a[2])}</span></div>`;document.body.appendChild(el);confetti(70);el.addEventListener('click',()=>el.remove());setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),500)},4200)}

/* ================= year recap story ================= */
let story=null;
function recapSheet(year){const inY=d=>year==='all'||d.startsWith(year);const vs=allVisits().filter(({v})=>inY(v.d));if(!vs.length){toast('אין עדיין ביקורים בתקופה הזו');return}
  const per={},cu={};for(const {r} of vs){per[r.id]=(per[r.id]||0)+1;if(r.cuisine)cu[r.cuisine]=(cu[r.cuisine]||0)+1}
  const topR=byId(Object.entries(per).sort((a,b)=>b[1]-a[1])[0][0]),topC=Object.entries(cu).sort((a,b)=>b[1]-a[1])[0],spend=vs.reduce((a,{v})=>a+(Number(v.cost)||0),0);
  const newP=rows.filter(r=>{const f=visitsOf(r).filter(isPast).map(v=>v.d).sort()[0];return f&&inY(f)}).length;
  const pics=[...new Set(vs.map(({r})=>r.id))].flatMap(id=>(byId(id).photos||[]).filter(p=>p.path)).slice(0,9);
  const best=rows.filter(r=>avg(r)>0&&per[r.id]).sort((a,b)=>avg(b)-avg(a))[0];const must=rows.filter(r=>per[r.id]).flatMap(r=>(r.dishes||[]).filter(d=>d.v==='must').map(d=>({d:d.name,r:r.name}))).slice(0,5);
  const label=year==='all'?'מאז ומעולם':year;
  const S=[`<div class="st-in"><div class="st-logo">Fomo</div><h2>הסיכום שלנו</h2><div class="st-big">${esc(label)}</div><p>מוכנים? הנה מה שאכלנו, שתינו וחגגנו</p></div>`,
   `<div class="st-in"><p>יצאנו</p><div class="st-big">${vs.length}</div><p>פעמים${newP?`, ו-${newP} מהן למקומות שלא היינו בהם קודם`:''}</p></div>`];
  if(topC)S.push(`<div class="st-in"><p>הסוג האהוב עלינו</p><div class="st-big st-word">${esc(topC[0])}</div><p>${topC[1]} ביקורים</p></div>`);
  if(topR)S.push(`<div class="st-in"><p>המקום שהכי חזרנו אליו</p>${(topR.photos||[]).find(p=>p.path)?`<div class="st-ph">${photoImg((topR.photos||[]).find(p=>p.path))}</div>`:''}<div class="st-big st-word">${esc(topR.name)}</div><p>${per[topR.id]} ביקורים</p></div>`);
  if(spend)S.push(`<div class="st-in"><p>על חוויות טעימות הוצאנו</p><div class="st-big">${ils(spend)}</div><p>וכל שקל היה שווה את זה</p></div>`);
  if(pics.length>=3)S.push(`<div class="st-in"><p>הרגעים שלנו</p><div class="st-grid">${pics.map(p=>photoImg(p)).join('')}</div></div>`);
  if(best)S.push(`<div class="st-in"><p>הדירוג הכי גבוה</p><div class="st-big st-word">${esc(best.name)}</div><p class="st-stars">${'★'.repeat(Math.round(avg(best)))} ${avg(best).toFixed(1)}</p></div>`);
  if(must.length)S.push(`<div class="st-in"><p>המנות שאסור לפספס</p><ul class="st-list">${must.map(m=>`<li><b>${esc(m.d)}</b><small>${esc(m.r)}</small></li>`).join('')}</ul></div>`);
  S.push(`<div class="st-in"><div class="st-logo">Fomo</div><h2>ממשיכים לגלות</h2><p>${rows.filter(r=>r.status!=='been').length} מקומות עוד מחכים לנו ברשימה</p><button class="btn" type="button" data-act="closeStory" style="margin-top:20px;background:#fff;color:#FF4E50;border-color:#fff">סגירה</button></div>`);
  killFormMap();openId=null;mode='story';openSheet();$('#ov').classList.add('story-ov');
  $('#sb').innerHTML=`<div class="story"><div class="st-bars">${S.map(()=>'<i><b></b></i>').join('')}</div><div class="st-slide"></div><button class="st-nav prev" type="button" data-act="stPrev" aria-label="הקודם"></button><button class="st-nav next" type="button" data-act="stNext" aria-label="הבא"></button></div>`;
  story={S,i:-1,t:null};stGo(0)}
function stGo(i){if(!story||mode!=='story')return;if(i<0)i=0;if(i>=story.S.length){return}story.i=i;clearTimeout(story.t);const sl=$('.st-slide');if(!sl)return;sl.innerHTML=story.S[i];sl.dataset.bg=i%4;
  document.querySelectorAll('.st-bars i').forEach((b,j)=>{b.className=j<i?'done':j===i?'cur':''});hydrate();if(i<story.S.length-1)story.t=setTimeout(()=>stGo(i+1),5000)}
function stClose(){if(story)clearTimeout(story.t);story=null;$('#ov').classList.remove('story-ov');closeSheet()}

/* ================= receipt scan ================= */
const loadScript=src=>new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src===src))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)});
async function scanReceipt(file){const st=$('#rcptSt'),fm=$('#visitF');if(!fm)return;st.textContent='מזהה סכום… (בפעם הראשונה זה לוקח קצת יותר זמן)';
  try{await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');const img=await shrink(file);const {data}=await Tesseract.recognize(img,'eng');const txt=data.text||'';
    const num=s=>Number(String(s).replace(/,(?=\d{3}\b)/g,'').replace(',','.'));const all=[...txt.matchAll(/\d{1,3}(?:,\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g)].map(m=>num(m[0])).filter(n=>n>0&&n<20000);
    let pick=null;for(const line of txt.split('\n'))if(/total|tota|sum|amount|pay|לתשלום|סה/i.test(line)){const m=[...line.matchAll(/\d+(?:[.,]\d{1,2})?/g)].map(x=>num(x[0])).filter(n=>n>0&&n<20000);if(m.length)pick=Math.max(...m)}
    if(pick==null){const dec=all.filter(n=>!Number.isInteger(n));pick=(dec.length?Math.max(...dec):all.length?Math.max(...all):null)}
    if(pick==null){st.textContent='לא הצלחנו לזהות סכום. אפשר להקליד ידנית.';return}fm.elements.cost.value=Math.round(pick);st.textContent=`זיהינו ${ils(pick)}. בדקו שזה נכון.`}
  catch{st.textContent='הסריקה לא הצליחה. אפשר להקליד את הסכום ידנית.'}}

/* ================= Google Maps import ================= */
let impItems=[];
function parseCSV(t){const out=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===','){row.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);out.push(row);row=[];f=''}else f+=c}if(f||row.length){row.push(f);out.push(row)}return out.filter(r=>r.some(x=>x.trim()))}
function fromGeo(j){return (j.features||[]).map(f=>{const p=f.properties||{},loc=p.location||p.Location||{},co=(f.geometry&&f.geometry.coordinates)||[];const lat=+co[1],lng=+co[0];
  return {name:p.Title||p.name||loc.name||loc['Business Name']||'',address:loc.address||loc.Address||p.address||'',mapsUrl:p.google_maps_url||p['Google Maps URL']||'',note:p.Comment||p.comment||'',lat:lat&&lng?lat:null,lng:lat&&lng?lng:null}})}
function fromCSV(t){const r=parseCSV(t);if(!r.length)return[];const h=r[0].map(x=>x.trim().toLowerCase());const ix=k=>h.indexOf(k);return r.slice(1).map(c=>{const url=c[ix('url')]||'',pm=parseMaps(url);return {name:c[ix('title')]||pm.name||'',address:'',mapsUrl:url,note:c[ix('note')]||c[ix('comment')]||'',lat:Number.isFinite(pm.lat)?pm.lat:null,lng:Number.isFinite(pm.lng)?pm.lng:null}})}
function importSheet(){killFormMap();openId=null;mode='import';openSheet();impItems=[];
  $('#sb').innerHTML=`<div class="sec dh"><h2>ייבוא מגוגל מפות</h2><p class="meta" style="margin-top:6px">מעבירים את המקומות השמורים שלכם מגוגל מפות לרשימה "${esc(cur.name)}".</p></div><div class="sec"><h4>איך מוציאים את הקובץ מגוגל</h4><ol class="steps"><li>נכנסים ל-<a href="https://takeout.google.com" target="_blank" rel="noopener">takeout.google.com</a> עם חשבון הגוגל שלכם.</li><li>לוחצים "ביטול הבחירה" ומסמנים רק את <b>Saved</b> (הרשימות השמורות) ואת <b>Maps (your places)</b>.</li><li>לוחצים "השלב הבא" ← "יצירת ייצוא". גוגל ישלח קישור להורדה במייל.</li><li>מורידים ופותחים את קובץ ה-ZIP, ובוחרים כאן את <b>Saved Places.json</b> או את קבצי ה-CSV של הרשימות.</li></ol>
<label class="btn pri" style="margin-top:12px">בחירת קבצים<input type="file" accept=".json,.geojson,.csv,application/json,text/csv" multiple hidden id="impFile"></label><div id="impList"></div></div>`}
async function readImport(files){let items=[];for(const f of files){try{const t=await f.text();if(/\.csv$/i.test(f.name))items.push(...fromCSV(t));else items.push(...fromGeo(JSON.parse(t)))}catch{toast('לא הצלחנו לקרוא את '+f.name)}}
  const have=new Set(rows.map(r=>String(r.name).trim().toLowerCase()));const seen=new Set();impItems=items.filter(x=>x.name&&!seen.has(x.name.toLowerCase())&&seen.add(x.name.toLowerCase())).map(x=>({...x,dup:have.has(x.name.trim().toLowerCase())}));
  $('#impList').innerHTML=impItems.length?`<p class="note" style="margin-top:14px">נמצאו ${impItems.length} מקומות. בטלו את הסימון ממה שלא תרצו להעביר.</p><div class="implist">${impItems.map((x,i)=>`<label class="impi"><input type="checkbox" data-i="${i}" ${x.dup?'':'checked'}><span><b>${esc(x.name)}</b><small>${esc(x.dup?'כבר ברשימה':(x.address||(x.lat?'עם מיקום מדויק':'')))}</small></span></label>`).join('')}</div><button class="btn pri" type="button" data-act="impGo" style="margin-top:14px">ייבוא המקומות המסומנים</button>`:'<p class="note">לא נמצאו מקומות בקבצים האלה.</p>'}
async function doImport(btn){const sel=[...document.querySelectorAll('.implist input:checked')].map(i=>impItems[+i.dataset.i]);if(!sel.length)return;btn.disabled=true;let n=0;
  for(const x of sel){btn.textContent=`מייבא ${++n} מתוך ${sel.length}…`;const d={name:x.name.slice(0,80),address:x.address.slice(0,120),city:'',cuisine:'',status:'want',price:0,mapsUrl:safeUrl(x.mapsUrl),notes:x.note.slice(0,2000),tags:[],fav:false,ratings:{},votes:{},dishes:[],photos:[],visits:[],addedBy:myId,createdAt:Date.now(),updatedAt:Date.now()};if(x.lat!=null){d.lat=x.lat;d.lng=x.lng;d.llLevel='place'}await save(uuid(),d,true)}
  logAct('add',null,`ייבא/ה ${sel.length} מקומות מגוגל מפות`);toast(`${sel.length} מקומות יובאו לרשימה`);closeSheet()}

/* ================= theme ================= */
function setTheme(t){try{if(t==='auto')localStorage.removeItem('rs-theme');else localStorage.setItem('rs-theme',t)}catch{}if(t==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t;const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='dark'?'#160E13':'#FF5E4D'}
const curTheme=()=>{try{return localStorage.getItem('rs-theme')||'auto'}catch{return 'auto'}};

/* ---------- events ---------- */
let popId='';
function animIn(){const g=$('#grid');if(!g)return;g.classList.remove('anim');void g.offsetWidth;g.classList.add('anim');clearTimeout(animIn.t);animIn.t=setTimeout(()=>g.classList.remove('anim'),1400)}
async function toggleVote(id){const r=byId(id);if(!r)return;if(!iVoted(r)){popId=id;setTimeout(()=>{popId=''},700);if(voters(r).length>=1&&!isMatch(r))setTimeout(()=>{const x=byId(id);if(x&&isMatch(x)){logAct('match',id,`גם רוצה את ${x.name}! שניכם רוצים ללכת`);confetti(50)}},50)}await save(id,{votes:{[myId]:iVoted(r)?0:Date.now()}})}
async function shareOrCopy(title,text,url){if(navigator.share){try{await navigator.share(url?{title,text,url}:{title,text});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(text+(url?'\n'+url:''));toast('הועתק. אפשר להדביק בוואטסאפ.')}catch{toast('לא הצלחנו להעתיק')}}
function newForm(){killFormMap();openId=null;mode='new';openSheet();$('#sb').innerHTML=formHtml(null);initFormMap();$('#placeQ').focus()}

function bindUI(){$('#v-stats').addEventListener('click',e=>{const b=e.target.closest('[data-act=recap]');if(b)recapSheet(stYear)});
$('#grid').addEventListener('click',e=>{if(e.target.closest('a'))return;const vb=e.target.closest('[data-vote]');if(vb){toggleVote(vb.dataset.vote);return}if(e.target.closest('[data-act=add]')){newForm();return}const c=e.target.closest('.card');if(c)openDetail(c.dataset.id)});
$('#grid').addEventListener('keydown',e=>{const c=e.target.closest('.card');if(c&&(e.key==='Enter'||e.key===' ')&&e.target===c){e.preventDefault();openDetail(c.dataset.id)}});
for(const sel of ['#v-timeline','#v-stats'])$(sel).addEventListener('click',e=>{const o=e.target.closest('[data-open]');if(o){e.preventDefault();openDetail(o.dataset.open)}});
$('#v-timeline').addEventListener('keydown',e=>{const o=e.target.closest('.tl-item');if(o&&e.key==='Enter')openDetail(o.dataset.open)});
$('#nomap').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b){killFormMap();openId=b.dataset.edit;mode='edit';openSheet();$('#sb').innerHTML='';renderDetail()}});
$('#locMe').addEventListener('click',()=>locateMe((la,ln)=>{ensureMap();if(meMarker)meMarker.remove();meMarker=L.circleMarker([la,ln],{radius:9,color:'#fff',weight:3,fillColor:'#2b7bd6',fillOpacity:1}).addTo(lmap).bindPopup('אתם כאן');lmap.setView([la,ln],15)}));
$('#fitAll').addEventListener('click',fitAll);
document.querySelectorAll('.bell-btn').forEach(b=>b.addEventListener('click',feedSheet));
$('#pollBar').addEventListener('click',e=>{const p=e.target.closest('[data-poll]');if(p){pollSheet(p.dataset.poll);return}const o=e.target.closest('[data-open]');if(o)openDetail(o.dataset.open)});
document.querySelectorAll('#v-list .seg button').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;document.querySelectorAll('#v-list .seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderList()}));
document.querySelectorAll('[data-tl]').forEach(b=>b.addEventListener('click',()=>{tlF=b.dataset.tl;document.querySelectorAll('[data-tl]').forEach(x=>x.setAttribute('aria-pressed',x===b));renderTimeline()}));
$('#stYear').addEventListener('change',e=>{stYear=e.target.value;renderStats()});
$('#q').addEventListener('input',e=>{q=e.target.value;renderList()});
$('#sort').addEventListener('change',async e=>{sort=e.target.value;if(sort==='near'){const l=await getLoc();if(!l){toast('צריך הרשאת מיקום כדי למיין לפי מרחק');}}try{localStorage.setItem('rs-sort',sort)}catch{}renderList()});
$('#cuis').addEventListener('click',e=>{if(e.target.closest('[data-open-f]')){openF=!openF;renderList();return}const b=e.target.closest('[data-c]');if(b){cuisF=b.dataset.c;renderList()}});
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
    const t=fm.elements.t&&fm.elements.t.value;if(t)v.t=t;const fut=d>today()||(d===today()&&t&&t>new Date().toTimeString().slice(0,5));
    document.activeElement&&document.activeElement.blur();await save(r.id,{visits:[...(r.visits||[]),v],...(fut?{}:{status:'been'}),updatedAt:Date.now()});
    if(fut){toast('היציאה נקבעה! אפשר להוסיף אותה ליומן');logAct('plan',r.id,`קבע/ה יציאה ל${r.name} ${whenTxt(v)}`)}else{toast('הביקור נרשם');logAct('visit',r.id,`סימן/ה ביקור ב${r.name}`)}renderNotices();return}
  if(fm.id==='cmtF'){const r=byId(openId);if(!r)return;const v=fm.elements.c.value;fm.elements.c.value='';fm.elements.c.blur();await sendComment(r,v);return}
  if(fm.id==='pollF'){await createPoll(fm);return}
  if(fm.id==='nameF'){const n=fm.elements.n.value.trim().slice(0,30);const {error}=await sb.from('profiles').upsert({user_id:myId,name:n});if(error)toast(errMsg(error));else{myName=n;toast('השם נשמר');await loadMembers();render()}return}
  if(fm.id==='renameF'){const n=fm.elements.n.value.trim().slice(0,40);if(!n)return;const {error}=await sb.from('lists').update({name:n}).eq('id',cur.id);if(error)toast(errMsg(error));else{cur.name=n;await loadLists();cur=lists.find(l=>l.id===cur.id)||cur;setTitle();toast('השם עודכן');settingsSheet()}return}
  if(fm.id==='newListF'){const n=fm.elements.n.value.trim();if(!n)return;const id=await doCreateList(n);if(id){await switchList(id);toast('הרשימה נוצרה! אפשר להוסיף מקומות ולהזמין חברים.')}return}
  if(fm.id==='joinF'){const c=codeFrom(fm.elements.c.value);if(!c){toast('זה לא נראה כמו קישור הזמנה');return}const id=await doJoin(c);if(id){await switchList(id);toast('הצטרפת לרשימה!')}return}
  if(false&&fm.id==='memF'){const em=fm.elements.e.value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(em))return;const {error}=await sb.from('members').insert({email:em});if(error&&!/duplicate/i.test(error.message))toast(errMsg(error));else{toast('נוסף. שלחו לה/לו את הקישור.');await loadMembers();settingsSheet()}return}
  if(fm.id!=='ef')return;
  const fd=new FormData(fm),llm=String(fd.get('ll')).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
  const d={name:String(fd.get('name')).trim(),cuisine:String(fd.get('cuisine')).trim(),city:String(fd.get('city')).trim(),address:String(fd.get('address')).trim(),status:fd.get('status')==='been'?'been':'want',price:Number(fd.get('price'))||0,recBy:String(fd.get('recBy')).trim(),mapsUrl:safeUrl(fd.get('mapsUrl')),site:safeUrl(fd.get('site')),tags:fd.getAll('tags').map(String),notes:String(fd.get('notes')).trim(),...readHours(fd),updatedAt:Date.now()};
  if(llm&&Math.abs(+llm[1])<=90&&Math.abs(+llm[2])<=180){d.lat=+llm[1];d.lng=+llm[2];d.llLevel=String(fd.get('llLevel')||'place')}else{d.lat=null;d.lng=null;d.llLevel=''}
  if(!d.name)return;
  const btn=fm.querySelector('[type=submit]');btn.disabled=true;fitted=false;killFormMap();
  if(mode==='new'){const id=uuid();logAct('add',id,`הוסיף/ה את ${d.name}`);const ok=await save(id,{...d,fav:false,ratings:{},votes:{},dishes:[],photos:[],visits:[],addedBy:myId,createdAt:Date.now()},true);if(ok){openId=id;mode='view';renderDetail()}else btn.disabled=false}
  else{mode='view';const ok=await save(openId,d);if(!ok)mode='edit';renderDetail()}
});
S.addEventListener('change',e=>{if(e.target.classList.contains('rcpt')){const f=e.target.files[0];if(f)scanReceipt(f);e.target.value='';return}if(e.target.id==='impFile'){readImport([...e.target.files]);return}if(e.target.classList.contains('up')){upload([...e.target.files],openId);e.target.value=''}if(e.target.classList.contains('camUp')){camUpload([...e.target.files]);e.target.value=''}});
S.addEventListener('click',async e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,i=Number(b.dataset.i);
  if(a==='pickm'){pick(b.dataset.m,true);return}
  if(a==='pf'){const k=b.dataset.k,v=b.dataset.v;pickF[k]=k==='price'?Number(v):k==='tag'?v:!!v;pick(b.dataset.m,true);return}
  if(a==='pollNew'){clearInterval(pickTimer);pollNewSheet();return}
  if(a==='pollVote'){const p=polls.find(x=>x.id===openPoll);if(!p)return;p.votes={...(p.votes||{}),[myId]:b.dataset.o};renderPoll();renderNotices();const {error}=await sb.rpc('vote_poll',{pid:p.id,choice:b.dataset.o});if(error)toast(errMsg(error));return}
  if(a==='pollClose'){const p=polls.find(x=>x.id===openPoll);if(!p)return;const {error}=await sb.from('polls').update({closed:true}).eq('id',p.id);if(error){toast(errMsg(error));return}p.closed=true;renderPoll();renderNotices();confetti();const w=byId(pollWinner(p));if(w)logAct('poll',w.id,`סגר/ה את ההצבעה: יוצאים ל${w.name}!`);return}
  if(a==='pollDel'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='בטוח? לחצו שוב';return}await sb.from('polls').delete().eq('id',openPoll);polls=polls.filter(p=>p.id!==openPoll);renderNotices();closeSheet();return}
  if(a==='recap'){recapSheet(stYear);return}
  if(a==='stNext'){if(story&&story.i<story.S.length-1)stGo(story.i+1);return}
  if(a==='stPrev'){if(story)stGo(story.i-1);return}
  if(a==='closeStory'){stClose();return}
  if(a==='theme'){setTheme(b.dataset.t);settingsSheet();return}
  if(a==='import'){importSheet();return}
  if(a==='impGo'){doImport(b);return}
  if(a==='copyHours'){const f=$('#ef');if(!f)return;for(let j=1;j<7;j++){f.elements['ho'+j].value=f.elements.ho0.value;f.elements['hc'+j].value=f.elements.hc0.value;f.elements['hx'+j].checked=f.elements.hx0.checked}toast('הועתק לכל הימים');return}
  if(a==='open'){clearInterval(pickTimer);openDetail(b.dataset.id);return}
  if(a==='add'){newForm();return}
  if(a==='camPick'){camStep(b.dataset.id);return}
  if(a==='camNear'){locateMe((la,ln)=>camList($('#camQ').value,[la,ln]));return}
  if(a==='placeSearch'){placeSearch();return}
  if(a==='placePick'){placePick(i);return}
  if(a==='fHere'){locateMe((la,ln,acc)=>{setPin(la,ln,true,true);if(acc>60)toast(`דיוק המיקום כ־${Math.round(acc)} מטר. אפשר לגרור את הסיכה.`)});return}
  if(a==='cancel'){killFormMap();if(mode==='new'){closeSheet();return}mode='view';renderDetail();return}
  if(a==='install'){if(installEvt){installEvt.prompt();installEvt=null;settingsSheet()}return}
  if(a==='shareInvite'){shareOrCopy('Fomo',`הצטרפו לרשימה "${cur?cur.name:''}" ב-Fomo! פותחים את הקישור, יוצרים חשבון עם מייל וסיסמה, וזהו:`,inviteUrl());return}
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
  if(a==='shareApp'){shareOrCopy('Fomo','Fomo – המקומות שאסור לפספס:',location.origin+location.pathname);return}
  if(a==='signout'){await sb.auth.signOut();location.reload();return}
  if(a==='rmMember'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='הסר?';b.style.fontSize='14px';return}const {error}=await sb.from('list_members').delete().eq('list_id',cur.id).eq('user_id',b.dataset.u);if(error)toast(errMsg(error));await loadMembers();settingsSheet();return}
  const r=byId(openId);if(!r)return;const now=Date.now();
  if(a==='share'){shareOrCopy(r.name,shareText(r));return}
  if(a==='shareCard'){shareCard(r,b);return}
  if(a==='emo'){await sendComment(r,b.dataset.e);return}
  if(a==='rmCmt'){const {error}=await sb.from('comments').delete().eq('id',b.dataset.cid);if(error){toast(errMsg(error));return}cmts[r.id]=(cmts[r.id]||[]).filter(c=>c.id!==b.dataset.cid);renderDetail();return}
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
const bioIcon=()=>/iphone|ipad|ipod|macintosh/i.test(navigator.userAgent)?'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10V7a3 3 0 0 1 3-3h3M22 4h3a3 3 0 0 1 3 3v3M28 22v3a3 3 0 0 1-3 3h-3M10 28H7a3 3 0 0 1-3-3v-3"/><path d="M11 12v2M21 12v2M16 12v6h-1.5M12 21.5c2.2 2 5.8 2 8 0"/></svg>':/android/i.test(navigator.userAgent)?'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 9.5a10 10 0 0 1 14 0M6.5 14a12 12 0 0 1 2-3.5M25.5 10.5A12 12 0 0 1 27 16v2"/><path d="M10 26c1.5-3 2-6 2-9a4 4 0 0 1 8 0c0 2.5-.3 5-1 7"/><path d="M16 17c0 4-1 7.5-3 10.5M23.5 21c-.3 2-.8 3.8-1.5 5.5M7 18v1c0 2-.5 3.5-1 5"/></svg>':'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="16" r="5.5"/><path d="M16.5 16H28M24 16v4M28 16v3"/><circle cx="11" cy="16" r="1.5" fill="currentColor"/></svg>';
const devName=()=>/iphone/i.test(navigator.userAgent)?'iPhone':/ipad/i.test(navigator.userAgent)?'iPad':/android/i.test(navigator.userAgent)?'Android':/mac/i.test(navigator.userAgent)?'Mac':/windows/i.test(navigator.userAgent)?'Windows':'מכשיר';
const pkCancelled=e=>/abort|cancel|NotAllowed|timed out/i.test(String(e&&(e.name||'')+' '+(e.message||'')));
async function registerBio(){try{const {data,error}=await sb.auth.registerPasskey();if(error)throw error;try{const id=data&&(data.id||(data.passkey&&data.passkey.id));if(id)await sb.auth.passkey.update({passkeyId:id,friendlyName:devName()})}catch{}try{localStorage.setItem('rs-pk','1')}catch{}toast(bioName()+' הופעל! מעכשיו אפשר להיכנס בלי סיסמה.');return true}
  catch(e){if(!pkCancelled(e))toast('לא הצלחנו להפעיל את '+bioName()+': '+(e.message||''));return false}}
const BRASS='style="background:#fff;border-color:#fff;color:#FF4E50;box-shadow:0 8px 24px #a3123a33"';
function gate(html){const g=$('#gate');g.innerHTML=`<div class="box"><div class="logo">Fomo</div><p class="tag">המקומות שאסור לפספס</p>${html}</div>`;g.hidden=false;$('#app').hidden=true}
function showLogin(email,signup){
  gate(`${joinCode?'<p><b>הוזמנתם לרשימת המסעדות!</b></p>':''}<p>${signup?'צרו חשבון עם המייל שלכם ובחרו סיסמה (לפחות 6 תווים).':(pkOK()?'טוב לראות אותך שוב!':'כניסה עם המייל והסיסמה שלכם.')}</p>${!signup&&pkOK()?`<button class="pk-btn" type="button" id="pkIn"><span class="pk-ic">${bioIcon()}<i class="pk-scan"></i></span><span class="pk-tx"><b>כניסה עם ${bioName()}</b><small>מהיר ובטוח, בלי להקליד סיסמה</small></span><svg class="pk-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><div class="or"><span>או עם מייל וסיסמה</span></div>`:''}<form id="lf"><input type="email" id="le" dir="ltr" placeholder="המייל שלך" autocomplete="email" required value="${esc(email||'')}"><input type="password" id="lp" dir="ltr" placeholder="${signup?'סיסמה חדשה':'סיסמה'}" autocomplete="${signup?'new-password':'current-password'}" minlength="6" required><button class="btn" type="submit" ${BRASS}>${signup?'יצירת חשבון וכניסה':'כניסה'}</button></form><div class="err" id="lerr"></div><button class="link" type="button" id="sw">${signup?'כבר יש לי חשבון':'פעם ראשונה כאן? יצירת חשבון'}</button>`);
  $('#sw').onclick=()=>showLogin($('#le').value,!signup);
  const pk=$('#pkIn');if(pk)pk.onclick=async()=>{pk.disabled=true;pk.classList.add('busy');$('#lerr').textContent='';try{const {error}=await sb.auth.signInWithPasskey();if(error)throw error;start()}catch(e){pk.disabled=false;pk.classList.remove('busy');if(!pkCancelled(e))$('#lerr').textContent='לא מצאנו '+bioName()+' שמחובר לחשבון במכשיר הזה. היכנסו עם מייל וסיסמה, ואז הפעילו '+bioName()+' בהגדרות.'}};
  $('#lf').addEventListener('submit',async e=>{e.preventDefault();const em=$('#le').value.trim().toLowerCase(),pw=$('#lp').value;const b=e.target.querySelector('button');b.disabled=true;$('#lerr').textContent='';
    const {data,error}=signup?await sb.auth.signUp({email:em,password:pw}):await sb.auth.signInWithPassword({email:em,password:pw});b.disabled=false;
    if(error){const m=error.message||'';$('#lerr').textContent=/invalid login/i.test(m)?'המייל או הסיסמה לא נכונים. אם זו הפעם הראשונה, לחצו "יצירת חשבון".':/already registered|already exists/i.test(m)?'למייל הזה כבר יש חשבון. לחצו "כבר יש לי חשבון".':/not confirmed/i.test(m)?'החשבון ממתין לאישור מייל. בקשו ממי שהקים את האפליקציה לכבות את "Confirm email" ב-Supabase.':/password/i.test(m)?'הסיסמה צריכה להיות לפחות 6 תווים.':'הכניסה נכשלה: '+m;return}
    if(signup&&!data.session){$('#lerr').textContent='החשבון נוצר, אבל ממתין לאישור מייל. בקשו ממי שהקים את האפליקציה לכבות את "Confirm email" ב-Supabase.';return}
    start()})}
function welcome(){gate(`<p><b>ברוכים הבאים${myName?', '+esc(myName):''}!</b></p><p>פתחו רשימה משלכם, או הצטרפו לרשימה של מישהו עם קישור ההזמנה שלו.</p>
<form id="wl"><input id="wn" maxlength="40" placeholder="שם הרשימה, למשל: המסעדות שלנו" required><button class="btn" type="submit" ${BRASS}>יצירת רשימה חדשה</button></form>
<form id="wj" style="margin-top:18px"><input id="wc" dir="ltr" placeholder="או הדביקו קישור הזמנה" required><button class="btn" type="submit" style="background:#ffffff26;border-color:#ffffffaa;color:#fff">הצטרפות לרשימה</button></form>
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
    const {data:pr,error:pe}=await sb.from('profiles').select('name').eq('user_id',myId).maybeSingle();if(pe&&isNetErr(pe))throw pe;
    if(!pr)await sb.from('profiles').insert({user_id:myId,name:''});myName=(pr&&pr.name)||'';
    let target=null;
    if(joinCode){const c=joinCode;joinCode='';try{localStorage.removeItem('rs-join')}catch{}const {data:lid}=await sb.rpc('join_list',{code:c});if(lid){target=lid;setTimeout(()=>toast('הצטרפת לרשימה!'),600)}else setTimeout(()=>toast('קישור ההזמנה לא תקף. בקשו קישור חדש.'),600)}
    await loadLists();
    if(!lists.length){welcome();return}
    let saved='';try{saved=localStorage.getItem('rs-list')||''}catch{}
    cur=lists.find(l=>l.id===(target||saved))||lists.find(l=>l.role==='owner')||lists[0];
  }catch(e){const cl=lsGet('rs-lists',[]);if(cl.length&&isNetErr(e)){lists=cl;let saved='';try{saved=localStorage.getItem('rs-list')||''}catch{}cur=lists.find(l=>l.id===saved)||lists[0]}else{gate(`<p>לא הצלחנו להתחבר לשרת. בדקו את החיבור לאינטרנט.</p><button class="btn" type="button" id="rl" ${BRASS}>ניסיון חוזר</button>`);$('#rl').onclick=()=>location.reload();return}}
  $('#gate').hidden=true;$('#app').hidden=false;
  if(!bound){bindUI();bound=true}
  try{const so=localStorage.getItem('rs-sort');if(so){sort=so;$('#sort').value=so}}catch{}
  route();await switchList(cur.id);subscribe();flushOutbox();
  if(!myName)setTimeout(()=>{settingsSheet();toast('איך לקרוא לך? כתבו שם ושמרו.')},500);
  else offerBio();
  if(!visBound){visBound=true;document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&loaded)loadAll()})}
}

/* intro splash on every launch */
{const sp=$('#splash'),t0=Date.now(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const hide=()=>{if(!sp||sp.classList.contains('out'))return;sp.classList.add('out');document.body.classList.remove('splashing');setTimeout(()=>sp.remove(),800)};
 if(sp){sp.addEventListener('click',hide);setTimeout(hide,reduce?500:2600)}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e});
if('serviceWorker' in navigator){let hadCtl=!!navigator.serviceWorker.controller,reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtl&&!reloaded){reloaded=true;location.reload()}});
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}))}

if(!CFG.supabaseUrl||!CFG.supabaseKey||!window.supabase){gate('<p>האפליקציה עוד לא מחוברת למסד הנתונים. צריך למלא את הקובץ config.js.</p>')}
else{sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,experimental:{passkey:true}}});start()}
}
