{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TAGS=['דייט','מתאים לחברים','כשר','טבעוני-פרנדלי','צמחוני-פרנדלי','ללא גלוטן','ישיבה בחוץ','נגיש','ידידותי לכלבים','חניה','מתאים לילדים','צריך להזמין מראש','ארוחת בוקר','האפי אוור','אירוע מיוחד','מקום שקט'];
const VERD={must:'חובה להזמין',ok:'סבבה',skip:'לא שוב'};
const OCC={'':'ביקור רגיל',date:'דייט',bday:'יום הולדת',anniv:'יום נישואין',celeb:'חגיגה',friends:'עם חברים',family:'עם המשפחה'};
const SPECIAL=['bday','anniv','celeb'];
const ICON={users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.6c2.6.2 4.4 2 5 4.9"/></svg>',book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 11h16M6 11V8a6 6 0 0 1 12 0v3M3 15h18M7 15v5M17 15v5"/></svg>',game:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="20" height="12" rx="6"/><path d="M7 11v4M5 13h4"/><circle cx="15.5" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="14.5" r="1" fill="currentColor"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',nav:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-8-8 18-2-8z"/></svg>',share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>',link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',vote:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16M6 20V10h3v10M11 20V5h3v15M16 20v-7h3v7"/></svg>',card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 13h16M8 17h8"/></svg>',me:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>'};

const CFG=window.APP_CONFIG||{};
// invite link: ?join=CODE — remember it through sign-up, then clean the address bar
let joinCode='';try{const u=new URL(location.href);const j=u.searchParams.get('join');if(j){localStorage.setItem('rs-join',j);u.searchParams.delete('join');history.replaceState(null,'',u.pathname+u.search+u.hash)}joinCode=localStorage.getItem('rs-join')||''}catch{}
let lists=[],cur=null,myName='',chan=null,openF=false,nearF=false,likeF=false;
let sb=null,session=null,me=null,myId='',members=[],names={};
let rows=[],loaded=false,view='all',q='',cuisF='',sort='recent',openId=null,mode='view',pickTimer=null,page='list',tlF='all',stYear=String(new Date().getFullYear());
let installEvt=null;
const queues={};

/* ---------- helpers ---------- */
function toast(m){if(!m)return;const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,3500)}
function errMsg(e){const m=String(e&&(e.message||e.error_description)||'');if(/rate_limit/.test(m))return 'רגע, יותר מדי פעולות בדקה. נסו שוב עוד כמה שניות.';if(/banned/i.test(m))return 'החשבון הזה הושהה על ידי מנהל האפליקציה.';if(/row-level|permission|not allowed|42501/i.test(m))return 'אין לך הרשאה לפעולה הזו.';if(/fetch|network|Failed/i.test(m))return 'אין חיבור לאינטרנט כרגע.';return 'משהו השתבש, נסו שוב.'}
const byId=id=>rows.find(r=>r.id===id);
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
const qText=r=>[r.name,r.address,r.city].filter(Boolean).join(' ');
const hasLL=r=>Number.isFinite(r.lat)&&Number.isFinite(r.lng)&&Math.abs(r.lat)<=90&&Math.abs(r.lng)<=180;
const exact=r=>hasLL(r)&&(!r.llLevel||r.llLevel==='place');
const mapsUrl=r=>safeUrl(r.mapsUrl)||(exact(r)?`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(qText(r)));
/* Moovit: official deep link (app) + official web link (fallback) */
const moovitOk=r=>hasLL(r);
function moovitUrls(r,v){const n=encodeURIComponent(r.name||''),la=(+r.lat).toFixed(6),lo=(+r.lng).toFixed(6);
  let app=`moovit://directions?dest_lat=${la}&dest_lon=${lo}&dest_name=${n}&partner_id=fomo&auto_run=true`;
  if(v&&v.d&&v.t&&isPlanV(v)){const dt=new Date(`${v.d}T${v.t}:00`);if(!isNaN(dt)){const off=-dt.getTimezoneOffset(),sg=off>=0?'+':'-',hh=String(Math.floor(Math.abs(off)/60)).padStart(2,'0'),mm=String(Math.abs(off)%60).padStart(2,'0');app+='&date='+encodeURIComponent(`${v.d}T${v.t}:00${sg}${hh}:${mm}`)}}
  return {app,web:`https://moovit.com/?to=${n}&tll=${la}_${lo}&lang=he`}}
function openMoovit(r,v){if(!r||!moovitOk(r))return;const u=moovitUrls(r,v);let left=false;const onHide=()=>{if(document.visibilityState==='hidden')left=true};document.addEventListener('visibilitychange',onHide);
  const t0=Date.now();location.href=u.app;setTimeout(()=>{document.removeEventListener('visibilitychange',onHide);if(!left&&document.visibilityState==='visible'&&Date.now()-t0<4000)window.open(u.web,'_blank','noopener')},1600)}
const wazeUrl=r=>exact(r)?`https://waze.com/ul?ll=${r.lat},${r.lng}&navigate=yes`:'https://waze.com/ul?q='+encodeURIComponent(qText(r))+'&navigate=yes';
const gEmbed=r=>'https://maps.google.com/maps?hl=iw&z=16&output=embed&q='+encodeURIComponent(exact(r)?`${r.lat},${r.lng}`:qText(r));
const shareText=r=>r.name+(r.address||r.city?'\n'+[r.address,r.city].filter(Boolean).join(', '):'')+'\nגוגל מפות: '+mapsUrl(r)+'\nWaze: '+wazeUrl(r);
const avg=r=>{const v=Object.values(r.ratings||{}).map(Number).filter(n=>n>0);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0};
const nv=v=>typeof v==='string'?{d:v}:(v&&typeof v==='object'&&typeof v.d==='string'?v:null);
const isHiddenS=v=>!!(v&&v.surprise&&v.surprise.by!==myId&&v.d>today());
const visitsOf=r=>(r.visits||[]).map((v,i)=>{const o=nv(v);return o&&{...o,i}}).filter(v=>v&&!isHiddenS(v));
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
function lsGetEarly(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}}
const urlCache={};{const c=lsGetEarly('rs-urls',{}),now=Date.now();for(const [k,v] of Object.entries(c))if(v&&v.e>now+864e5)urlCache[k]=v.u}
const urlExp={};function saveUrls(){const now=Date.now(),o={};for(const [k,u] of Object.entries(urlCache)){const e=urlExp[k]||(lsGetEarly('rs-urls',{})[k]||{}).e;if(e&&e>now)o[k]={u,e}}try{localStorage.setItem('rs-urls',JSON.stringify(o))}catch{}}
const photoImg=(p,extra='')=>p&&p.path?`<img data-path="${esc(p.path)}" alt="" ${extra}${urlCache[p.path]?` src="${esc(urlCache[p.path])}"`:''}>`:'';
async function hydrate(){const els=[...document.querySelectorAll('img[data-path]:not([src])')];if(!els.length||!sb)return;
  const paths=[...new Set(els.map(e=>e.dataset.path))].filter(p=>!urlCache[p]);
  if(paths.length){try{const {data}=await sb.storage.from('photos').createSignedUrls(paths,60*60*24*7);for(const d of data||[])if(d.signedUrl){urlCache[d.path]=d.signedUrl;urlExp[d.path]=Date.now()+6.5*864e5}saveUrls()}catch{}}
  for(const e of document.querySelectorAll('img[data-path]:not([src])'))if(urlCache[e.dataset.path])e.src=urlCache[e.dataset.path]}
async function shrink(f,max,qual){try{const bm=await createImageBitmap(f,{imageOrientation:'from-image'});const k=Math.min(1,(max||1600)/Math.max(bm.width,bm.height));const c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return await new Promise(res=>c.toBlob(b=>res(b||f),'image/jpeg',qual||.85))}catch{return f}}
/* uploads a photo + a small thumbnail for the list cards */
async function putPhoto(id,blob){const b=await shrink(blob);const k=uuid(),path=`${id}/${k}.jpg`;const {error}=await sb.storage.from('photos').upload(path,b,{contentType:'image/jpeg',upsert:false});if(error)throw error;
  let thumb;try{const t=await shrink(b,520,.78);const tp=`${id}/t_${k}.jpg`;const r=await sb.storage.from('photos').upload(tp,t,{contentType:'image/jpeg',upsert:false});if(!r.error)thumb=tp}catch{}return thumb?{path,thumb}:{path}}
async function upload(files,id){
  const r=byId(id);if(!r||!files.length)return false;
  if(!navigator.onLine){for(const f of files){try{await idbAdd({rid:id,blob:await shrink(f),by:myId,at:Date.now()})}catch{}}toast('אין חיבור. התמונות נשמרו במכשיר ויעלו כשהחיבור יחזור.');return true}const st=()=>$('#upst'),added=[];
  for(let i=0;i<files.length;i++){if(st())st().textContent=`מעלה ${i+1} מתוך ${files.length}…`;
    try{const ph=await putPhoto(id,files[i]);added.push({...ph,by:myId,at:Date.now()})}catch(e){toast('העלאת תמונה נכשלה: '+errMsg(e))}}
  let ok=false;if(added.length){const cur=byId(id);ok=await save(id,{photos:[...((cur&&cur.photos)||[]),...added],updatedAt:Date.now()});if(ok){toast(added.length===1?'התמונה נשמרה':`${added.length} תמונות נשמרו`);logAct('photo',id,`העלה/תה ${added.length===1?'תמונה':added.length+' תמונות'} ב${r.name}`)}}
  if(st())st().textContent='';return ok}

/* ---------- data ---------- */
function applyPatch(r,p){const o={...r,...p};if(p.ratings)o.ratings={...(r.ratings||{}),...p.ratings};if(p.votes)o.votes={...(r.votes||{}),...p.votes};return o}
async function loadAll(){if(!cur)return;const lid=cur.id;const {data,error}=await sb.from('restaurants').select('id,data').eq('list_id',lid).order('updated_at',{ascending:false});if(!cur||cur.id!==lid)return;if(error){const c=lsGet('rs-cache-'+lid,null);if(c&&isNetErr(error)){rows=c;loaded=true;render();setOffline();return}$('#status').textContent='הקבוצה לא נטענה: '+errMsg(error);return}
  rows=(data||[]).map(x=>({...(x.data||{}),id:x.id})).filter(x=>!delQ.has(x.id));takeMeta(lid);const pend=lsGet('rs-outbox',[]).filter(o=>o.lid===lid);for(const o of pend){if(o.t==='del'){rows=rows.filter(r=>r.id!==o.id);continue}if(o.t)continue;if(o.isNew){if(!byId(o.id))rows.unshift({...o.patch,id:o.id})}else rows=rows.map(r=>r.id===o.id?applyPatch(r,o.patch):r)}
  loaded=true;$('#status').textContent='';setOffline();cacheRows();fixLegacy();render();if(openId&&mode==='view')renderDetail();checkAch();setTimeout(backfillGeo,1500);setTimeout(thumbBackfill,9000);setTimeout(loadFriendsLoved,1200)}
function save(id,patch,isNew){
  const prev=byId(id);
  if(isNew)rows.unshift({...patch,id});else if(prev)rows=rows.map(r=>r.id===id?applyPatch(r,patch):r);
  render();if(openId===id&&mode==='view')renderDetail();
  const lid=cur.id;if(!navigator.onLine){queueOp({id,patch,isNew,lid});return Promise.resolve(true)}
  const run=()=>isNew?sb.from('restaurants').insert({id,list_id:lid,data:patch}):sb.rpc('patch_restaurant',{rid:id,patch});
  const p=(queues[id]||Promise.resolve()).then(run).then(({error})=>{if(error)throw error});
  queues[id]=p.catch(()=>{});
  return p.then(()=>{cacheRows();setTimeout(checkAch,300);return true},e=>{if(isNetErr(e)){queueOp({id,patch,isNew,lid});return true}toast(errMsg(e));loadAll();return false})}
async function removeRow(r){if(!navigator.onLine){queueOp({t:'del',id:r.id,lid:cur.id,paths:(r.photos||[]).flatMap(p=>[p.path,p.thumb]).filter(Boolean)});rows=rows.filter(x=>x.id!==r.id);cacheRows();render();return true}const {error}=await sb.from('restaurants').delete().eq('id',r.id);if(error){toast(errMsg(error));return false}
  rows=rows.filter(x=>x.id!==r.id);const paths=(r.photos||[]).flatMap(p=>[p.path,p.thumb]).filter(Boolean);if(paths.length)sb.storage.from('photos').remove(paths).catch(()=>{});render();return true}
function subscribe(){if(chan)return;chan=sb.channel('restaurants-live').on('postgres_changes',{event:'*',schema:'public',table:'restaurants'},pl=>{
  if(pl.eventType==='DELETE'){const id=pl.old&&pl.old.id;if(!byId(id))return;rows=rows.filter(r=>r.id!==id);if(openId===id&&mode==='view')closeSheet()}
  else{const n=pl.new;if(!n||!cur||n.list_id!==cur.id)return;const row={...(n.data||{}),id:n.id};if(row._meta){if(!meta.id||meta.id===row.id){meta={id:row.id,special:row.special||[],diets:row.diets||{}};lsSet('rs-meta-'+cur.id,meta);renderNotices();if(mode==='pick')pick(undefined,true)}return}const i=rows.findIndex(r=>r.id===n.id);if(i>=0)rows[i]=row;else rows.unshift(row)}
  render();if(openId&&mode==='view')renderDetail()})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'activity'},pl=>{const n=pl.new;if(!n||!cur||n.list_id!==cur.id||acts.some(a=>a.id===n.id))return;acts.unshift(n);renderBell();if(n.user_id!==myId)toast(`${nm(n.user_id)} ${n.text}`)})
  .on('postgres_changes',{event:'*',schema:'public',table:'comments'},pl=>{if(pl.eventType==='DELETE'){const id=pl.old&&pl.old.id;for(const k in cmts)if(cmts[k])cmts[k]=cmts[k].filter(c=>c.id!==id)}else{const n=pl.new;if(!n||!cur||n.list_id!==cur.id)return;if(cmts[n.restaurant_id]&&!cmts[n.restaurant_id].some(c=>c.id===n.id))cmts[n.restaurant_id].push(n)}if(openId&&mode==='view')renderDetail()})
  .on('postgres_changes',{event:'*',schema:'public',table:'polls'},pl=>{if(pl.eventType==='DELETE'){polls=polls.filter(p=>p.id!==(pl.old&&pl.old.id))}else{const n=pl.new;if(!n||!cur||n.list_id!==cur.id)return;const i=polls.findIndex(p=>p.id===n.id);const was=i>=0&&polls[i].closed;if(i>=0)polls[i]=n;else polls.unshift(n);if(n.closed&&!was&&mode==='poll'&&openPoll===n.id)confetti()}renderNotices();if(mode==='poll')renderPoll()})
  .on('postgres_changes',{event:'*',schema:'public',table:'events'},pl=>{if(pl.eventType==='DELETE'){events=events.filter(x=>x.id!==(pl.old&&pl.old.id))}else{const n=pl.new;if(!n||!cur||n.list_id!==cur.id)return;const i=events.findIndex(x=>x.id===n.id);if(i>=0)events[i]=n;else if(n.d>=today())events.push(n);events.sort((a,b)=>a.d.localeCompare(b.d))}renderNotices();if(mode==='event')renderEvent()})
  .subscribe()}
// ratings imported from the first version are stored under "owner": hand them to the list owner
function fixLegacy(){if(!cur||cur.role!=='owner')return;for(const r of rows)if(r.ratings&&Number(r.ratings.owner)>0&&!(r.ratings[myId]>0))save(r.id,{ratings:{[myId]:Number(r.ratings.owner),owner:0}})}
async function loadLists(){const {data,error}=await sb.from('list_members').select('role,list_id,lists(id,name,join_code,pub_token,pub_mode)').eq('user_id',myId);if(error)throw error;
  lists=(data||[]).filter(x=>x.lists).map(x=>({id:x.lists.id,name:x.lists.name,join_code:x.lists.join_code,pub_token:x.lists.pub_token,pub_mode:x.lists.pub_mode,role:x.role})).sort((a,b)=>a.name.localeCompare(b.name,'he'));lsSet('rs-lists',lists)}
async function loadMembers(){if(!cur)return;const {data,error}=await sb.from('list_members').select('user_id,email,role,last_seen,added_at').eq('list_id',cur.id).order('added_at');if(error){members=lsGet('rs-names-'+cur.id,[]);names={};for(const m of members)names[m.user_id]=m.name||String(m.email||'').split('@')[0]||'מישהו';return}members=data||[];
  const ids=members.map(m=>m.user_id);let profs=[];if(ids.length){const {data:p}=await sb.from('profiles').select('user_id,name').in('user_id',ids);profs=p||[]}
  lsSet('rs-names-'+cur.id,members);names={};for(const m of members){const p=profs.find(x=>x.user_id===m.user_id);m.name=(p&&p.name)||'';names[m.user_id]=m.name||m.email.split('@')[0]||'מישהו'}}
function setTitle(){const t=cur?cur.name:'Fomo';$('#app h1').textContent=t;document.title=cur?cur.name+' · Fomo':'Fomo'}
async function switchList(id){const l=lists.find(x=>x.id===id)||lists[0];if(!l)return;cur=l;try{localStorage.setItem('rs-list',l.id)}catch{}
  rows=[];loaded=false;fitted=false;view='all';cuisF='';closeSheet();setTitle();render();
  acts=[];polls=[];events=[];gameActs=null;meta={id:null,special:[],diets:{}};renderBell();renderNotices();sb.rpc('touch_list',{lid:l.id}).then(()=>{},()=>{});await loadMembers();await loadAll();if(page==='list')animIn();loadActivity();loadPolls();loadEvents();loadGameActs()}

/* ---------- list ---------- */
function filtered(){const t=q.trim().toLowerCase();let list=rows.filter(r=>(!openF||(openState(r)||{}).open)&&(!likeF||iVoted(r))&&(!hhF||(hhInfo(r)||{}).now)&&(!tagF.size||[...tagF].every(t=>(r.tags||[]).includes(t)))&&(!nearF||(distKm(r)??99)<=3)&&(view==='all'||(view==='match'?isMatch(r):r.status===view))&&(!cuisF||r.cuisine===cuisF)&&(!t||(sxIntent&&sxIntent.q===q.trim()?sxOwnFilter(r,sxIntent):[r.name,r.city,r.address,r.cuisine,r.notes,r.recBy,...(r.tags||[]),...(r.dishes||[]).map(d=>d.name)].join(' ').toLowerCase().includes(t))));
  const s={recent:(a,b)=>(b.updatedAt||0)-(a.updatedAt||0),rating:(a,b)=>avg(b)-avg(a),visit:(a,b)=>lastVisit(b).localeCompare(lastVisit(a)),name:(a,b)=>String(a.name).localeCompare(String(b.name),'he'),near:(a,b)=>(distKm(a)??1e9)-(distKm(b)??1e9)}[sort]||((a,b)=>0);return list.sort(s)}
function renderHead(){const been=rows.filter(r=>r.status==='been').length,want=rows.length-been,m=rows.filter(isMatch).length;
  $('#stats').innerHTML=loaded?`היינו ב־<b>${been}</b> · רוצים לנסות <b>${want}</b>${m?` · <b>${m}</b> ששנינו רוצים השבוע`:''}`:'טוען…';renderGreet()}
function renderList(){document.querySelectorAll('.more-sen').forEach(x=>x.remove());setTimeout(fxChk,0);
  const cs=[...new Set(rows.map(r=>r.cuisine).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he'));
  if(cuisF&&!cs.includes(cuisF))cuisF='';
  const hasHours=rows.some(r=>r.hours&&Object.keys(r.hours).length);
  $('#cuis').innerHTML=(hasHours?`<button type="button" class="chip openchip" data-open-f="1" aria-pressed="${openF}">פתוח עכשיו</button>`:'')+`<button type="button" class="chip" data-qf="near" aria-pressed="${nearF}">📍 קרוב אליי</button><button type="button" class="chip" data-qf="like" aria-pressed="${likeF}">♥ בא לי</button><button type="button" class="chip" data-qf="new" aria-pressed="${view==='want'}">✨ עוד לא ביקרנו</button>`+(rows.some(r=>r.hh&&r.hh.f)?`<button type="button" class="chip" data-qf="hh" aria-pressed="${hhF}">🍹 האפי אוור עכשיו</button>`:'')+`<button type="button" class="chip" data-qf="more" aria-pressed="${moreF||tagF.size>0}" aria-expanded="${moreF}">⚙️ עוד${tagF.size?` (${tagF.size})`:''}</button>`+(cs.length>1?'<span class="chip-sep" aria-hidden="true"></span>':'')+(cs.length>1?[`<button type="button" class="chip" data-c="" aria-pressed="${!cuisF}">כל הסוגים</button>`,...cs.map(c=>`<button type="button" class="chip" data-c="${esc(c)}" aria-pressed="${cuisF===c}">${esc(c)}</button>`)].join(''):'');renderNotices();{const fr=$('#featRow');if(fr){fr.hidden=!moreF;fr.innerHTML=PRACT.map(([t,ic])=>`<button type="button" class="chip" data-tf="${esc(t)}" aria-pressed="${tagF.has(t)}">${ic} ${esc(t)}</button>`).join('')}}renderFriendsLoved();
  const g=$('#grid');
  if(!loaded){g.innerHTML=SKEL.repeat(6);return}
  if(!rows.length){g.innerHTML=`<div class="empty"><h2>עוד אין כאן מסעדות</h2><p>הוסיפו מקום שהייתם בו או מקום שאתם חולמים עליו, והקבוצה תתחיל להתמלא.</p><button class="btn pri" type="button" data-act="add">הוסיפו את הראשונה</button></div>`;return}
  const list=filtered();
  if(!list.length){g.innerHTML=`<div class="empty"><h2>${view==='match'?'עוד אין מקום ששניכם בחרתם השבוע':'לא נמצא כלום'}</h2><p>${view==='match'?'לחצו "בא לי" על מקומות שבא לכם ללכת אליהם. כששניכם בוחרים אותו מקום, הוא יופיע כאן.':'נסו חיפוש אחר או הסירו סינון.'}</p></div>`;sxListAfter(0);return}
  const upM=new Map();for(const u of upcoming())if(!upM.has(u.r.id))upM.set(u.r.id,u);
  const card=(r,idx)=>{const p=(r.photos||[]).find(x=>x.path),a=avg(r),mv=iVoted(r),mt=isMatch(r);return `<article class="card" tabindex="0" data-id="${esc(r.id)}" style="--i:${Math.min(idx,12)}"><div class="cover">${p?photoImg(p.thumb?{path:p.thumb}:p,'loading="lazy" decoding="async"'):plate(r.name)}<div class="badges">${q.trim().length>=2?'<span class="badge sx-in-b">✓ בקבוצה</span>':''}<span class="badge ${r.status==='been'?'been':''}">${r.status==='been'?'היינו':'רוצים ללכת'}</span>${mt?'<span class="badge match">שנינו רוצים!</span>':''}${(()=>{const u=upM.get(r.id);return u?`<span class="badge plan">${esc(whenTxt(u.v))}</span>`:''})()}${(()=>{const h=hhInfo(r);return h?`<span class="badge hh${h.now?'':' soon'}">${esc(h.t)}</span>`:''})()}</div>${r.fav?'<span class="heart" aria-label="מועדף">♥</span>':''}</div><div class="cbody"><h3>${esc(r.name)}</h3><p class="meta">${[r.cuisine,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).map(esc).join(' · ')||'&nbsp;'}</p><div class="mrow">${a?`<span class="rate"><i>★</i> ${a.toFixed(1)}</span>`:''}${liveSt(r)}${distKm(r)!=null?`<span class="dist">${esc(distTxt(distKm(r)))}</span>`:''}</div><div class="acts"><a class="btn sm" href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">${ICON.pin}מפות</a><a class="btn sm" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}Waze</a><button type="button" class="btn sm ${mv?'on':''} ${popId===r.id?'pop':''}" data-vote="${esc(r.id)}" aria-pressed="${mv}">${mv?'♥':'♡'} בא לי</button></div></div></article>`};
  const CH=24;let shown=Math.max(CH,renderList.keep||0);g.innerHTML=list.slice(0,shown).map(card).join('');if(renderList.io)renderList.io.disconnect();
  if(list.length>shown&&'IntersectionObserver' in window){const sen=document.createElement('div');sen.className='more-sen';g.after(sen);renderList.io=new IntersectionObserver(es=>{if(!es.some(e=>e.isIntersecting))return;const nx=list.slice(shown,shown+CH);g.insertAdjacentHTML('beforeend',nx.map((r,i)=>card(r,shown+i)).join(''));shown+=nx.length;renderList.keep=shown;hydrate();if(shown>=list.length){renderList.io.disconnect();sen.remove()}},{rootMargin:'800px'});renderList.io.observe(sen)}else if(list.length>shown){g.innerHTML+=list.slice(shown).map((r,i)=>card(r,shown+i)).join('')}
  hydrate();sxListAfter(list.length);
}

/* ---------- map (Leaflet + OpenStreetMap) ---------- */
let lmap=null,layer=null,meMarker=null,fitted=false;
const TILE='https://tile.openstreetmap.org/{z}/{x}/{y}.png',ATTR='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const pinIcon=r=>L.divIcon({className:'pin-wrap',html:`<div class="pin ${r.status==='been'?'b':'w'} ${exact(r)?'':'apx'}"></div>`,iconSize:[26,26],iconAnchor:[13,26],popupAnchor:[0,-24]});
function ensureMap(){if(lmap)return;if(!window.L||!L.markerClusterGroup){loadLeaflet().then(()=>{if(page==='map')drawMap()}).catch(()=>toast('המפה לא נטענה, בדקו את החיבור'));return}lmap=L.map('lmap',{zoomControl:true}).setView([32.08,34.78],12);L.tileLayer(TILE,{maxZoom:19,attribution:ATTR}).addTo(lmap);layer=(L.markerClusterGroup?L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:46,spiderfyOnMaxZoom:true,iconCreateFunction:c=>{const n=c.getChildCount();return L.divIcon({className:'clu-wrap',html:`<div class="clu">${n}</div>`,iconSize:[40,40]})}}):L.layerGroup()).addTo(lmap);lmap.on('click',hideMapCard);
  lmap.on('popupopen',e=>{const el=e.popup.getElement();el&&el.addEventListener('click',ev=>{const o=ev.target.closest('[data-open]');if(o){lmap.closePopup();openDetail(o.dataset.open)}})})}
function drawMap(){if(page!=='map')return;ensureMap();if(!lmap)return;setTimeout(()=>lmap.invalidateSize(),50);layer.clearLayers();
  const pts=rows.filter(hasLL);
  mkById={};mcSel=null;for(const r of pts){const mk=L.marker([r.lat,r.lng],{icon:pinIcon(r),title:r.name,keyboard:true});mk.on('click',ev=>{if(ev.originalEvent)L.DomEvent.stopPropagation(ev.originalEvent);showMapCard(r)});mkById[r.id]=mk;layer.addLayer(mk)}
  {const mc=$('#mapCard');if(mc&&!mc.hidden){const r=byId(mc.dataset.id);if(r&&hasLL(r))showMapCard(r);else hideMapCard()}}
  if(!fitted&&pts.length){fitAll();fitted=true}
  renderNoMap()}
function fitAll(){const pts=rows.filter(hasLL);if(!lmap||!pts.length)return;lmap.fitBounds(L.latLngBounds(pts.map(r=>[r.lat,r.lng])).pad(.2),{maxZoom:15})}
function locateMe(cb){if(!navigator.geolocation){toast('המכשיר לא תומך באיתור מיקום');return}
  navigator.geolocation.getCurrentPosition(p=>cb(p.coords.latitude,p.coords.longitude,p.coords.accuracy),()=>toast('לא הצלחנו לאתר את המיקום. בדקו שהרשאת המיקום פתוחה.'),{enableHighAccuracy:true,timeout:12000})}
function renderNoMap(){const miss=rows.filter(r=>!hasLL(r)),el=$('#nomap');if(!loaded||!miss.length){el.innerHTML='';return}
  el.innerHTML=`<div class="panel" style="margin-top:14px"><h3>${miss.length} מקומות בלי מיקום</h3><p class="note" style="margin:0 0 10px">לחצו על מקום כדי לחפש אותו או לסמן אותו על המפה.</p><div class="chips">${miss.map(r=>`<button type="button" class="chip" data-edit="${esc(r.id)}">${esc(r.name)}</button>`).join('')}</div></div>`}

/* ---------- timeline ---------- */
function allVisits(){const out=[];const td=today();for(const r of rows)for(const v of visitsOf(r))if(v.d<=td)out.push({r,v});return out.sort((a,b)=>b.v.d.localeCompare(a.v.d))}
function renderTimeline(){renderSoon();
  let vs=allVisits();const now=new Date(),md=d=>d.slice(5);
  const mem=vs.filter(({v})=>{const y=Number(v.d.slice(0,4));if(y>=now.getFullYear())return false;const t=new Date(now.getFullYear()+'-'+md(v.d)+'T12:00');return Math.abs(t-now)<3*864e5});
  $('#memory').innerHTML=mem.slice(0,3).map(({r,v})=>{const n=now.getFullYear()-Number(v.d.slice(0,4));return `<div class="memory">לפני ${n===1?'שנה':n+' שנים'}, ב־${esc(fmtD(v.d,{day:'numeric',month:'long'}))}, הייתם ב<a href="#timeline" data-open="${esc(r.id)}">${esc(r.name)}</a>${v.occ?' · '+esc(OCC[v.occ]||''):''}</div>`}).join('');
  if(tlF==='special')vs=vs.filter(({v})=>SPECIAL.includes(v.occ)||v.occ==='date');
  const el=$('#tl');if(!loaded){el.innerHTML='';return}
  const up=[];const upH=up.length?`<div class="tl-month"><h3>בקרוב</h3><span class="meta">${up.length} יציאות מתוכננות</span></div>`+up.map(({r,v})=>`<div class="tl-item upc" data-open="${esc(r.id)}" tabindex="0"><span class="tl-day">${Number(v.d.slice(8))}</span><div class="tl-main"><b>${esc(r.name)}</b><div class="meta">${esc(fmtD(v.d,{weekday:'long',day:'numeric',month:'long'}))}${v.t?' · '+esc(v.t):''}</div></div><span class="occ sp">${esc(whenTxt(v))}</span></div>`).join(''):'';
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
${leaderHtml()}${withHtml()}<div class="panel wide"><h3>ההישגים שלנו <small class="meta">${ACH.filter(a=>a[3](s2)).length} מתוך ${ACH.length}</small></h3><div class="achs">${ACH.map(a=>`<div class="ach ${a[3](s2)?'on':''}">${medal(a[4],a[3](s2))}<b>${esc(a[1])}</b><small>${esc(a[2])}</small></div>`).join('')}</div></div>
<div class="panel"><h3>הסוג האהוב עלינו</h3>${byC.length?`<div class="big1">${esc(byC[0][0])}</div>${bars(byC)}`:'<p class="note">יופיע אחרי שתוסיפו ביקורים.</p>'}</div>
<div class="panel"><h3>איפה אנחנו יוצאים</h3>${byCity.length?`<div class="big1">${esc(byCity[0][0])}</div>${bars(byCity)}`:'<p class="note">יופיע אחרי שתוסיפו ביקורים.</p>'}</div>
<div class="panel"><h3>הוצאות לפי חודש</h3>${ms.some(Boolean)?`<div class="cols">${months.map((m,i)=>`<div title="${esc(fmtD(m+'-15',{month:'long',year:'numeric'}))}: ${ils(ms[i])}"><em>${ms[i]?ils(ms[i]):''}</em><i style="height:${(ms[i]/mmx*100).toFixed(1)}%"></i><span>${esc(fmtD(m+'-15',{month:'narrow'}))}</span></div>`).join('')}</div>`:'<p class="note">הוסיפו סכום כשאתם רושמים ביקור, ותראו כאן כמה הוצאתם בכל חודש.</p>'}</div>
<div class="panel"><h3>הכי חזרנו אליהם</h3>${byR.length?`<ul class="toplist">${byR.slice(0,5).map(([id,n])=>{const r=byId(id);return r?`<li data-open="${esc(id)}"><span>${esc(r.name)}</span><span>${n} ${n===1?'ביקור':'ביקורים'}</span></li>`:''}).join('')}</ul>`:'<p class="note">עוד אין ביקורים בתקופה הזו.</p>'}</div>
<div class="panel"><h3>הכי אהבנו (כל הזמנים)</h3>${top.length?`<ul class="toplist">${top.map(r=>`<li data-open="${esc(r.id)}"><span>${esc(r.name)}</span><span class="rate"><i>★</i> ${avg(r).toFixed(1)}</span></li>`).join('')}</ul>`:'<p class="note">דרגו מקומות כדי לראות כאן את המובילים.</p>'}</div>
</div>`}

/* ---------- routing ---------- */
function render(){renderHead();if(page==='list')renderList();else if(page==='map')drawMap();else if(page==='timeline')renderTimeline();else if(page==='me')renderMe();else renderStats()}
const PAGES=['list','map','timeline','stats','me'];
function route(){const h=location.hash.replace('#','');const np=PAGES.includes(h)?h:'list';
  const go=()=>{page=np;document.body.dataset.page=page;window.scrollTo(0,0);
    document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!=='v-'+page);
    document.querySelectorAll('nav.tabs a,.tabbar a').forEach(a=>{if(a.dataset.v===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
    if(page!=='map')hideMapCard();render();maybeTour(page,page==='map'?1600:900);if(page==='list'&&!document.startViewTransition)animIn()};
  if(document.startViewTransition&&loaded&&np!==page&&!RM()){document.documentElement.dataset.vt=PAGES.indexOf(np)>PAGES.indexOf(page)?'fwd':'back';document.startViewTransition(go)}else go()}
window.addEventListener('hashchange',route);

/* ---------- sheet ---------- */
let fmap=null,fmarker=null;
function killFormMap(){if(fmap){fmap.remove();fmap=null;fmarker=null}}
function openSheet(){const was=!$('#ov').hidden;$('#ov').hidden=false;document.body.style.overflow='hidden';const fr=flipFrom;flipFrom=null;if(fr&&!was)requestAnimationFrame(()=>requestAnimationFrame(()=>flipIn(fr)))}
function closeSheet(){if(story){clearTimeout(story.t);story=null}if(typeof evMap!=='undefined'&&evMap){evMap.remove();evMap=null}if(gm&&gm.s)clearTimeout(gm.s.t);$('#ov').classList.remove('story-ov');$('#ov').hidden=true;document.body.style.overflow='';openId=null;mode='view';clearInterval(pickTimer);killFormMap()}
function openDetail(id){track('detail');killFormMap();openId=id;mode='view';openSheet();renderDetail();$('#ov').scrollTop=0;maybeTour('detail',1000)}

function formHtml(r){r=r||{status:'want',tags:[]};const tg=r.tags||[];const ll=hasLL(r)?`${r.lat}, ${r.lng}`:'';return `<form id="ef" class="sec dh"><h2 style="margin-bottom:18px">${r.id?'עריכת מקום':'מקום חדש'}</h2>
<div class="quick"><label class="l">חיפוש המקום (שם ועיר)<div class="addrow" style="margin-top:0"><input class="f" id="placeQ" placeholder="למשל: בל בוי תל אביב" value="${esc(r.id?[r.name,r.city].filter(Boolean).join(' '):'')}"><button class="btn" type="button" data-act="placeSearch">${ICON.search}חיפוש</button>${SR?`<button class="btn mic" type="button" data-act="voice" aria-label="הוספה בקול" aria-pressed="false">🎤</button>`:''}</div></label><ul class="res" id="placeRes"></ul>
<label class="l" style="margin-top:12px">או הדביקו קישור / "שיתוף" מגוגל מפות<textarea class="f paste" id="paste" dir="auto" placeholder="https://www.google.com/maps/place/…"></textarea></label><p class="note" id="fillSt"></p><div class="dupn" id="dupN" hidden></div></div>
<div class="grid2">
<label class="l full">שם המקום *<input class="f" name="name" required maxlength="80" value="${esc(r.name)}"></label>
<label class="l">סוג${cuisSelect(r.cuisine)}</label>
<label class="l">עיר<input class="f" name="city" maxlength="40" value="${esc(r.city)}"></label>
<label class="l full">כתובת<input class="f" name="address" maxlength="120" value="${esc(r.address)}" placeholder="רחוב ומספר"></label>
<div class="full"><div class="l">מיקום מדויק במפה</div><p class="note" style="margin:2px 0 0">לחצו על המפה או גררו את הסיכה למקום המדויק.</p><div class="mini" id="fmap"></div>
<div class="row" style="margin-top:8px"><button class="btn sm" type="button" data-act="fHere">${ICON.me}אני נמצא שם עכשיו</button><input class="f" name="ll" dir="ltr" value="${esc(ll)}" placeholder="32.0853, 34.7818" aria-label="קואורדינטות" style="flex:1 1 180px;width:auto"></div></div>
<label class="l">מצב<select class="f" name="status"><option value="want" ${r.status!=='been'?'selected':''}>רוצים ללכת</option><option value="been" ${r.status==='been'?'selected':''}>היינו</option></select></label>
<label class="l">רמת מחיר<select class="f" name="price"><option value="">לא ידוע</option>${[1,2,3,4].map(n=>`<option value="${n}" ${r.price==n?'selected':''}>${'₪'.repeat(n)}</option>`).join('')}</select></label>
<label class="l full">מי המליץ?<input class="f" name="recBy" maxlength="80" value="${esc(r.recBy)}" placeholder="חבר, כתבה, אינסטגרם…"></label>
<label class="l">קישור לגוגל מפות<input class="f" name="mapsUrl" type="url" dir="ltr" value="${esc(r.mapsUrl)}" placeholder="https://maps.app.goo.gl/…"></label>
<label class="l">אתר / הזמנת מקום<input class="f" name="site" type="url" dir="ltr" value="${esc(r.site)}" placeholder="https://…"></label>
<label class="l">קישור לוולט (לא חובה)<input class="f" name="woltUrl" type="url" dir="ltr" value="${esc(r.woltUrl||'')}" placeholder="https://wolt.com/…"><small class="meta" style="font-weight:400">באפליקציית וולט: נכנסים למסעדה ← שיתוף ← העתקה, ומדביקים כאן.</small></label>
<input type="hidden" name="llLevel" value="${esc(r.llLevel||'')}">
<div class="full"><div class="l" style="margin-bottom:6px">תגיות</div><div class="chips">${TAGS.map(t=>`<label class="chip"><input type="checkbox" name="tags" value="${esc(t)}" ${tg.includes(t)?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div></div>
${hoursForm(r)}
<label class="l full">הערות<textarea class="f" name="notes" maxlength="2000" placeholder="מה שמענו, למה רוצים ללכת…">${esc(r.notes)}</textarea></label>
</div><div class="row" style="margin-top:14px"><button class="btn pri" type="submit">שמירה</button><button class="btn" type="button" data-act="cancel">ביטול</button></div></form>`}

function initFormMap(){const f=$('#ef');if(!f)return;if(!window.L){loadLeaflet().then(()=>{if($('#ef')&&!fmap)initFormMap()}).catch(()=>{});return}killFormMap();pendG=null;pendDel=null;formSrc={};formGeocode.auto=!f.elements.ll.value.trim()||f.elements.llLevel.value==='street';
  const m=String(f.elements.ll.value).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
  const has=m&&Math.abs(+m[1])<=90;const c=has?[+m[1],+m[2]]:[32.08,34.78];
  fmap=L.map('fmap').setView(c,has?17:12);L.tileLayer(TILE,{maxZoom:19,attribution:ATTR}).addTo(fmap);
  if(has)setPin(+m[1],+m[2],false);
  fmap.on('click',e=>setPin(e.latlng.lat,e.latlng.lng,true));
  setTimeout(()=>fmap&&fmap.invalidateSize(),120)}
function setPin(lat,lng,manual,zoom){const f=$('#ef');if(!f)return;lat=+lat.toFixed(6);lng=+lng.toFixed(6);if(!fmap){f.elements.ll.value=`${lat}, ${lng}`;f.elements.llLevel.value='place';return}
  if(!fmarker){fmarker=L.marker([lat,lng],{draggable:true,icon:L.divIcon({className:'pin-wrap',html:'<div class="pin w"></div>',iconSize:[26,26],iconAnchor:[13,26]})}).addTo(fmap);fmarker.on('dragend',()=>{const p=fmarker.getLatLng();setPin(p.lat,p.lng,true)})}
  else fmarker.setLatLng([lat,lng]);
  if(zoom)fmap.setView([lat,lng],17);
  f.elements.ll.value=`${lat}, ${lng}`;f.elements.llLevel.value='place';
  if(manual){formGeocode.auto=false;reverseFill(lat,lng)}}
async function reverseFill(lat,lng){const f=$('#ef');if(!f||(f.elements.address.value.trim()&&f.elements.city.value.trim()))return;
  try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=he&lat=${lat}&lon=${lng}`);const j=await r.json();const a=j.address||{};
    const city=a.city||a.town||a.village||a.municipality||'',addr=[a.road,a.house_number].filter(Boolean).join(' ');
    if(!f.elements.address.value.trim()&&addr)f.elements.address.value=addr;if(!f.elements.city.value.trim()&&city)f.elements.city.value=city}catch{}}
function parseMaps(txt){const out={};txt=String(txt||'');const um=txt.match(/https?:\/\/\S+/);const url=um?um[0].replace(/[)\].,]+$/,''):'';
  if(url){out.mapsUrl=url;let m=url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);if(m){out.lat=+m[1];out.lng=+m[2];out.exact=true}else if((m=url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/))){out.lat=+m[1];out.lng=+m[2];out.exact=true}else if((m=url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/))){out.lat=+m[1];out.lng=+m[2]}
    m=url.match(/\/maps\/place\/([^/@?]+)/);if(m){try{out.name=decodeURIComponent(m[1].replace(/\+/g,' ')).replace(/[‎‏‪-‮]/g,'').split(',')[0].trim()}catch{}}
    out.short=/goo\.gl|g\.co\//.test(url)}
  const lines=txt.replace(url,'').split(/\n/).map(s=>s.trim()).filter(s=>s&&!/^https?:/.test(s));
  if(lines.length&&!out.name){const parts=lines[0].split(/\s*[,،]\s*/);out.name=parts[0];const rest=[...parts.slice(1),...lines.slice(1)].join(', ').split(/\s*,\s*/).filter(p=>p&&!/^(ישראל|israel|\d{5,7})$/i.test(p));if(rest.length){out.city=rest.length>1?rest.pop().replace(/\d+/g,'').trim():'';out.address=rest.join(', ')}}
  return out}

function visitForm(){return `<p class="note" style="margin:10px 0 0">תאריך עתידי נשמר כיציאה מתוכננת, עם תזכורת ביומן.</p><form class="addrow" id="visitF"><input class="f" type="date" name="d" value="${today()}" aria-label="תאריך" style="flex:0 1 160px"><input class="f" type="time" name="t" aria-label="שעה (לא חובה)" style="flex:0 1 120px"><input class="f" type="number" name="cost" min="0" step="1" inputmode="numeric" placeholder="₪ כמה שילמנו" aria-label="סכום" style="flex:0 1 140px"><select class="f" name="occ" aria-label="סוג הביקור" style="flex:1 1 150px">${Object.entries(OCC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><input class="f" name="note" maxlength="100" placeholder="הערה קצרה (לא חובה)" aria-label="הערה"><input class="f" name="with" maxlength="120" list="withList" placeholder="עם מי היינו? (דני, רוני)" aria-label="עם מי היינו" style="flex:1 1 100%"><datalist id="withList">${knownWith().map(n=>`<option value="${esc(n)}">`).join('')}</datalist><label class="btn sm rcpt-b">${ICON.cam}סריקת קבלה<input type="file" accept="image/*" capture="environment" hidden class="rcpt"></label><span class="note" id="rcptSt" style="flex:1 1 100%;grid-column:1/-1;margin:0"></span><div id="rcptRev" style="flex:1 1 100%;grid-column:1/-1;min-width:0"></div><button class="btn pri" type="submit" style="grid-column:1/-1">שמירה</button></form>`}

function renderDetail(){
  const r=byId(openId),box=$('#sb');
  if(!r){if(mode!=='new')closeSheet();return}
  if(mode==='edit'){if(!$('#ef')){box.innerHTML=formHtml(r);initFormMap()}return}
  if(mode==='confirm'){box.innerHTML=`<div class="sec dh"><h2>למחוק את ${esc(r.name)}?</h2><p>המקום, הדירוגים, המנות, הביקורים והתמונות יימחקו לתמיד.</p><div class="row"><button class="btn pri" type="button" data-act="reallyDel">כן, למחוק</button><button class="btn" type="button" data-act="cancel">ביטול</button></div></div>`;return}
  const ae=document.activeElement;if(ae&&box.contains(ae)&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName))return;
  const ratings=r.ratings||{},others=Object.keys(ratings).filter(k=>k!==myId&&k!=='owner'&&ratings[k]>0),vt=voters(r).filter(k=>k!==myId);
  const mine=ratings[myId]||0,site=safeUrl(r.site),dishes=r.dishes||[],photos=(r.photos||[]).filter(p=>p.path),visits=visitsOf(r).sort((a,b)=>b.d.localeCompare(a.d)),spent=visits.filter(v=>v.d<=today()).reduce((a,v)=>a+(Number(v.cost)||0),0),mv=iVoted(r);
  const old=$('#gframe'),keep=old&&old.dataset.src===gEmbed(r)?old:null;
  box.innerHTML=`<div class="sec dh"><div class="row" style="margin-bottom:8px"><span class="badge ${r.status==='been'?'been':''}">${r.status==='been'?'היינו':'רוצים ללכת'}</span>${isMatch(r)?'<span class="badge match">שנינו רוצים השבוע!</span>':''}${(r.tags||[]).map(t=>`<span class="chip" style="cursor:default">${TAG_IC[t]?TAG_IC[t]+' ':''}${esc(t)}</span>`).join('')}</div>
<h2>${esc(r.name)}</h2><p class="meta" style="margin-top:6px">${[r.cuisine,r.address,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).map(esc).join(' · ')}</p>
${r.recBy?`<p class="meta" style="margin-top:4px">המליץ/ה: <b style="color:var(--ink)">${esc(r.recBy)}</b></p>`:''}
<div class="row" style="margin-top:14px">${site&&!BOOKRX.test(site)?`<a class="btn" href="${esc(site)}" target="_blank" rel="noopener">${ICON.link}אתר</a>`:''}<button class="btn" type="button" data-act="evNew" data-id="${esc(r.id)}">${ICON.users}ערב עם חברים</button><button class="btn" type="button" data-act="share">${ICON.share}שליחת מיקום</button><button class="btn" type="button" data-act="shareCard">${ICON.card}כרטיס לשיתוף</button>${exact(r)?`<button class="btn" type="button" data-act="copyLL">${ICON.copy}העתקת קואורדינטות</button>`:''}</div>
<div class="mini" id="gwrap"></div>
<p class="note">${exact(r)?'מיקום מדויק נשמר.':hasLL(r)?'המיקום משוער. אפשר לדייק אותו בעריכה.':'עוד אין מיקום מדויק. בעריכה אפשר לחפש את המקום או לסמן אותו על המפה.'}</p></div>
${hoursView(r)}<div class="sec"><h4>בא לנו השבוע?</h4><div class="row"><button class="btn ${mv?'on':''}" type="button" data-act="vote" aria-pressed="${mv}">${mv?'♥ בא לי!':'♡ בא לי השבוע'}</button><span class="meta">${vt.length?vt.map(k=>esc(nm(k))).join(', ')+' גם רוצה':'עוד אף אחד אחר לא בחר'}</span></div><p class="note">הבחירה תקפה לשבוע. כששניכם בוחרים, המקום עולה לראש ההגרלה.</p></div>
<div class="sec"><h4>הדירוג שלנו</h4><div class="rlist"><div class="r"><b style="min-width:56px">אני</b><span class="stars" role="group" aria-label="הדירוג שלי">${[1,2,3,4,5].map(n=>`<button type="button" class="${n<=mine?'on':''}" data-act="rate" data-v="${n}" aria-label="${n} כוכבים">★</button>`).join('')}</span></div>${others.map(k=>`<div class="r"><b>${esc(nm(k))}</b><span class="rate"><i>${'★'.repeat(ratings[k])}</i><span style="color:var(--line)">${'★'.repeat(5-ratings[k])}</span></span></div>`).join('')}</div></div>
${commentsHtml(r)}<div class="sec"><h4>תמונות</h4>${photos.length?`<div class="gal">${(r.photos||[]).map((p,i)=>p.path?`<div class="ph">${photoImg(p,`loading="lazy" data-act="zoom" data-i="${i}"`)}${p.src==='google'?`<span class="gattr">Google${p.attr?' · '+esc(p.attr):''}</span>`:''}<button type="button" data-act="rmPhoto" data-i="${i}" aria-label="הסרת תמונה">×</button></div>`:'').join('')}</div>`:`<p class="note">עוד אין תמונות. צלמו את המנות, את הקוקטיילים או את שניכם.</p>${(window.APP_CONFIG||{}).googleKey?'<button class="btn sm" type="button" data-act="gPhotos" style="margin-top:8px">'+ICON.search+'תמונה מגוגל</button>':''}`}
<div class="row" style="margin-top:12px"><label class="btn pri">${ICON.cam}צלמו עכשיו<input type="file" accept="image/*" capture="environment" hidden class="up"></label><label class="btn">${ICON.img}מהגלריה<input type="file" accept="image/*" multiple hidden class="up"></label><span class="note" id="upst" style="margin:0"></span></div></div>
<div class="sec"><h4>ביקורים${spent?` · סה"כ ${ils(spent)}`:''}</h4>${visits.length?visits.map(v=>`<div class="vrow ${isPlanV(v)?'plan':''}"><b>${esc(fmtD(v.d))}${v.t?' · '+esc(v.t):''}</b>${isPlanV(v)?`<span class="occ sp">${esc(whenTxt(v))}</span><a class="btn sm" href="${icsData(r,v)}" download="fomo.ics">${ICON.cal}ליומן</a><a class="btn sm" href="${esc(gcalUrl(r,v))}" target="_blank" rel="noopener">Google</a>`:''}${v.occ?`<span class="occ ${SPECIAL.includes(v.occ)?'sp':''}">${esc(OCC[v.occ]||'')}</span>`:''}${v.note?`<span class="meta">${esc(v.note)}</span>`:''}${withOf(v).length?`<span class="meta">👥 עם ${esc(withOf(v).join(', '))}</span>`:''}<span class="money">${Number(v.cost)?ils(v.cost):''}</span><button type="button" class="del" data-act="rmVisit" data-i="${v.i}" aria-label="הסרת ביקור">×</button></div>`).join(''):'<p class="note">עוד לא רשמתם ביקור.</p>'}
${visitForm()}</div>
<div class="sec"><h4>מנות ומשקאות</h4>${dishes.length?dishes.map((d,i)=>`<div class="dish"><span>${esc(d.name)}</span><button type="button" class="v ${d.v||'ok'}" data-act="verd" data-i="${i}" title="לחצו להחלפה">${VERD[d.v]||VERD.ok}</button><button type="button" class="del" data-act="rmDish" data-i="${i}" aria-label="הסרה">×</button></div>`).join(''):'<p class="note">רשמו מה הזמנתם, ומה חובה להזמין בפעם הבאה.</p>'}
<form class="addrow" id="dishF"><input class="f" name="d" maxlength="80" placeholder="מנה או קוקטייל" aria-label="שם המנה"><button class="btn" type="submit">הוספה</button></form></div>
${r.notes?`<div class="sec"><h4>הערות</h4><p style="margin:0;white-space:pre-wrap">${esc(r.notes)}</p></div>`:''}
<div class="sec row"><button class="btn" type="button" data-act="fav">${r.fav?'♥ מועדף':'♡ סמנו כמועדף'}</button><button class="btn" type="button" data-act="edit">עריכה</button><button class="btn" type="button" data-act="del" style="color:var(--bad)">מחיקה</button></div>`;
  const gw=$('#gwrap');if(keep)gw.appendChild(keep);else gw.innerHTML=`<iframe id="gframe" data-src="${esc(gEmbed(r))}" src="${esc(gEmbed(r))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="מפת גוגל"></iframe>`;
  box.insertAdjacentHTML('beforeend',dbarHtml(r));{const vs=vouchersFor(r),dh=box.querySelector('.sec.dh');if(vs.length&&dh)dh.insertAdjacentHTML('beforeend',`<button type="button" class="vban" data-vopen="1">🎁 יש לכם שובר כאן! <b>${esc(vs[0].title)}${vs[0].amount?' · ₪'+esc(String(vs[0].amount)):''}</b> <small>${esc(vExpTxt(vs[0]))}</small></button>`)}
  hydrate();
}

/* ---------- picker ---------- */
let pickF={price:0,tag:'',near:false,open:false,fit:false};
async function pick(m,keep){
  killFormMap();openId=null;mode='pick';openSheet();if(!keep)pickF={price:0,tag:'',near:false,open:false,fit:dietUsers().length>0};
  if(pickF.near)await getLoc();
  const fil=r=>!r.permClosed&&(!cuisF||r.cuisine===cuisF)&&(!pickF.price||(r.price&&r.price<=pickF.price))&&(!pickF.tag||(r.tags||[]).includes(pickF.tag))&&(!pickF.open||(openState(r)||{}).open)&&(!pickF.near||((distKm(r)??99)<=5))&&(!pickF.fit||fitsAll(r,dietUsers()));
  const matches=rows.filter(r=>isMatch(r)&&fil(r)),wants=rows.filter(r=>r.status!=='been'&&fil(r)),favs=rows.filter(r=>(r.fav||avg(r)>=4)&&fil(r));
  if(!m)m=matches.length?'match':'want';
  const pool=m==='match'?matches:m==='fav'?favs:wants;
  const seg=`<div class="seg" role="group" aria-label="מאיפה להגריל" style="margin-top:10px"><button type="button" data-act="pickm" data-m="want" aria-pressed="${m==='want'}">רוצים ללכת (${wants.length})</button><button type="button" data-act="pickm" data-m="match" aria-pressed="${m==='match'}">שנינו רוצים (${matches.length})</button><button type="button" data-act="pickm" data-m="fav" aria-pressed="${m==='fav'}">מקומות שאהבנו (${favs.length})</button></div>`;
  const ch=(k,v,t,on)=>`<button type="button" class="chip" data-act="pf" data-k="${k}" data-v="${v}" data-m="${m}" aria-pressed="${on}">${t}</button>`;
  const hasH=rows.some(r=>r.hours&&Object.keys(r.hours).length);
  const filters=`<div class="pfil"><div class="chips">${ch('price',0,'כל מחיר',!pickF.price)}${ch('price',2,'עד ₪₪',pickF.price===2)}${ch('price',3,'עד ₪₪₪',pickF.price===3)}</div><div class="chips">${ch('tag','','כל אירוע',!pickF.tag)}${ch('tag','דייט','דייט',pickF.tag==='דייט')}${ch('tag','מתאים לחברים','עם חברים',pickF.tag==='מתאים לחברים')}</div><div class="chips">${ch('near',pickF.near?'':'1','עד 5 ק״מ ממני',pickF.near)}${hasH?ch('open',pickF.open?'':'1','פתוח עכשיו',pickF.open):''}${dietUsers().length?ch('fit',pickF.fit?'':'1','🥗 מתאים לכולם',pickF.fit):''}</div></div>`;
  const pollB=`<div class="row" style="margin-top:16px"><button class="btn" type="button" data-act="gameNew">${ICON.game}משחק: מי בוחר?</button><button class="btn" type="button" data-act="pollNew">${ICON.vote}הצבעה עם חברים</button><button class="btn" type="button" data-act="evNew">${ICON.users}ערב / מסלול</button></div>`;
  const s=$('#sb');
  if(!pool.length){s.innerHTML=`<div class="pick"><h2>לאן הולכים הערב?</h2>${seg}${filters}<p class="note" style="margin-top:18px">${pickF.price||pickF.tag||pickF.near||pickF.open||pickF.fit?'אין מקום שמתאים לסינון. נסו להרחיב אותו.'+(pickF.fit?' (במתאים לכולם מוצגים רק מקומות שסומנו בתגיות כמו כשר או טבעוני-פרנדלי.)':''):m==='match'?'עוד אין מקום ששניכם לחצתם עליו "בא לי" השבוע.':m==='fav'?'עוד אין מקומות מועדפים או עם דירוג 4 ומעלה.':'הוסיפו מקומות לרשימת "רוצים ללכת", וההגרלה תבחר בשבילכם.'}</p>${pollB}</div>`;return}
  s.innerHTML=`<div class="pick"><h2>לאן הולכים הערב?</h2>${seg}${filters}${cuisF?`<p class="note">רק ${esc(cuisF)}</p>`:''}<div class="nm" id="pn" aria-live="polite"></div><p class="meta" id="pm"></p><div class="row" id="pa"></div>${pollB}</div>`;
  const choice=pool[Math.floor(Math.random()*pool.length)];
  const done=()=>{$('#pn').textContent=choice.name;$('#pm').textContent=[choice.cuisine,choice.city,distKm(choice)!=null?distTxt(distKm(choice)):''].filter(Boolean).join(' · ');$('#pa').innerHTML=`<a class="btn pri" href="${esc(wazeUrl(choice))}" target="_blank" rel="noopener">${ICON.nav}יוצאים! Waze</a><button class="btn" type="button" data-act="planNew" data-id="${esc(choice.id)}">${ICON.cal}קביעה + יומן</button><button class="btn" type="button" data-act="open" data-id="${esc(choice.id)}">פרטים</button><button class="btn" type="button" data-act="pickm" data-m="${m}">הגרלה נוספת</button>`};
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
const isSamsung=()=>/SamsungBrowser/i.test(navigator.userAgent);
const CHROME_URL='intent://myfomo.github.io/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.android.chrome;end';
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isOwner=()=>cur&&cur.role==='owner';
function listsSheet(){killFormMap();openId=null;mode='lists';openSheet();
  $('#sb').innerHTML=`<div class="sec dh"><h2>הקבוצות שלי</h2><p class="meta" style="margin-top:6px">כל קבוצה היא עולם משלה: מקומות, תמונות, דירוגים וחברים.</p>
<ul class="toplist" style="margin-top:12px">${lists.map(l=>`<li data-act="pickList" data-id="${esc(l.id)}" tabindex="0"><span>${esc(l.name)}${cur&&l.id===cur.id?' <small class="meta">· פתוחה עכשיו</small>':''}</span><span class="meta">${l.role==='owner'?'שלי':'הצטרפתי'}</span></li>`).join('')}</ul></div>
<div class="sec"><h4>קבוצה חדשה</h4><form class="addrow" id="newListF"><input class="f" name="n" maxlength="40" placeholder="למשל: דייטים, ארוחות עבודה, טיול באיטליה" aria-label="שם הקבוצה" required><button class="btn pri" type="submit">יצירה</button></form></div>
<div class="sec"><h4>הצטרפות לקבוצה של מישהו אחר</h4><form class="addrow" id="joinF"><input class="f" name="c" dir="ltr" placeholder="הדביקו כאן קישור הזמנה" aria-label="קישור הזמנה" required><button class="btn" type="submit">הצטרפות</button></form></div>`}
async function loadPk(){const el=$('#pkList');if(!el)return;try{const {data,error}=await sb.auth.passkey.list();if(error)throw error;const arr=Array.isArray(data)?data:(data&&(data.passkeys||data.items))||[];el.innerHTML=arr.length?arr.map(p=>`<div class="mem"><span><b>${esc(p.friendly_name||p.friendlyName||'מפתח גישה')}</b><br><small class="meta">נוסף ${esc(fmtD(String(p.created_at||p.createdAt||'').slice(0,10)))}</small></span><button class="del" type="button" data-act="pkDel" data-id="${esc(p.id)}" aria-label="הסרה">×</button></div>`).join(''):'עוד לא הופעל באף מכשיר.';return arr}catch{el.textContent='';return null}}
/* v54: settings in 4 tabs (me / group / notifications / more), deep-linkable */
const SETT=[['me','👤','אני'],['grp','👥','קבוצה'],['ntf','🔔','התראות'],['more','⚙️','עוד']];
let setTab='';
function tasteSecHtml(){const t=(meta.tastes||{})[myId]||{},c=new Set(t.c||[]);return `<form class="sec" id="tasteF"><h4>הטעם שלי</h4><p class="note" style="margin:0 0 10px">ככה FOMO מציעה לך מקומות שמתאימים.</p><div class="chips">${FX_VIBES.map(v=>`<label class="chip"><input type="checkbox" name="tc" value="${esc(v)}" ${c.has(v)?'checked':''}><span>${esc(v)}</span></label>`).join('')}</div>
<div class="grid2" style="margin-top:10px"><label class="l">תקציב בדרך כלל<select class="f" name="tb"><option value="0">לא משנה</option>${[1,2,3,4].map(n=>`<option value="${n}" ${t.b===n?'selected':''}>${'₪'.repeat(n)}</option>`).join('')}</select></label><label class="l">איפה בדרך כלל<input class="f" name="tcity" maxlength="40" value="${esc(t.city||'')}" placeholder="למשל: תל אביב"></label></div><button class="btn pri" type="submit" style="margin-top:10px">שמירה</button></form>`}
function settingsSheet(tab,focus){if(!setTab)setTab=lsGet('rs-set-tab','me');if(typeof tab==='string'&&SETT.some(x=>x[0]===tab)){setTab=tab;lsSet('rs-set-tab',tab)}if(!SETT.some(x=>x[0]===setTab))setTab='me';
  killFormMap();openId=null;mode='settings';openSheet();const own=isOwner();setTimeout(loadPk,0);setTimeout(fillPushSec,0);setTimeout(fillQuotaAdm,0);setTimeout(fillBackups,0);
  const P={
me:`<div class="sec"><h4>השם שלי</h4><p class="meta" style="margin:0 0 8px">מחובר/ת בתור <span dir="ltr">${esc(me.email)}</span></p><form class="addrow" id="nameF" style="margin-top:0"><input class="f" name="n" maxlength="30" value="${esc(myName)}" placeholder="השם שלי" aria-label="השם שלי"><button class="btn" type="submit">שמירה</button></form></div>
${tasteSecHtml()}${dietSecHtml()}
${pkOK()?`<div class="sec"><h4>כניסה עם ${bioName()}</h4><p class="note" style="margin:0 0 10px">מפעילים פעם אחת בכל מכשיר, ומשם נכנסים בלי סיסמה.</p><div id="pkList" class="note">טוען…</div><button class="btn pri" type="button" data-act="pkAdd" style="margin-top:10px">הפעלת ${bioName()} במכשיר הזה</button></div>`:''}
<div class="sec"><h4>המידע שלי</h4><p class="note" style="margin:0 0 10px">אפשר להוריד את כל המידע שקשור אליך.</p><button class="btn" type="button" data-act="myData">⬇️ הורדת המידע שלי</button></div>
<div class="set-danger"><button type="button" data-act="signout">התנתקות</button><button type="button" data-act="delMe">מחיקת החשבון</button></div>`,
grp:`<div class="sec"><h4>הקבוצה "${esc(cur.name)}"</h4>${own?`<form class="addrow" id="renameF" style="margin-top:0"><input class="f" name="n" maxlength="40" value="${esc(cur.name)}" aria-label="שם הקבוצה"><button class="btn" type="submit">שינוי שם</button></form>`:'<p class="note" style="margin:0">הצטרפת לקבוצה הזו בהזמנה.</p>'}
<div class="row" style="margin-top:10px"><button class="btn" type="button" data-act="lists">🔀 החלפת קבוצה / קבוצה חדשה</button></div></div>
<div class="sec" id="setInv"><h4>הזמנה לקבוצה</h4><p class="note" style="margin:0 0 10px">מי שפותח את הקישור נרשם ומצטרף לקבוצה מיד.</p><div class="row"><button class="btn pri" type="button" data-act="shareInvite">${ICON.share}שליחת קישור הזמנה</button><button class="btn" type="button" data-act="copyInvite">${ICON.copy}העתקה</button><button class="btn" type="button" data-act="qrInvite">📱 קוד QR</button></div><p class="note" dir="ltr" style="word-break:break-all">${esc(inviteUrl())}</p>${own?'<button class="link" type="button" data-act="resetInvite" style="background:none;border:0;color:var(--mute);text-decoration:underline;cursor:pointer;padding:6px 0">איפוס הקישור (הקישור הישן יפסיק לעבוד)</button>':''}</div>
<div class="sec"><h4>מי בקבוצה (${members.length})</h4>${members.map(m=>`<div class="mem"><span><b>${esc(m.name||m.email.split('@')[0])}</b>${m.user_id===myId?' <small class="meta">(אני)</small>':''}${m.role==='owner'?' <small class="meta">· מנהל/ת</small>':''}<br><small class="meta" dir="ltr">${esc(m.email)}</small> <small class="meta">· ${ago(m.last_seen)}</small></span>${own&&m.user_id!==myId?`<button class="del" type="button" data-act="rmMember" data-u="${esc(m.user_id)}" aria-label="הסרה מהקבוצה">×</button>`:''}</div>`).join('')}</div>
${specialSecHtml()}${pubSecHtml()}${backupSecHtml()}
<div class="set-danger">${own?'<button type="button" data-act="delList">מחיקת הקבוצה</button>':'<button type="button" data-act="leaveList">יציאה מהקבוצה</button>'}</div>`,
ntf:`<div class="sec" id="setPush"><h4>התראות לטלפון</h4><div id="pushSec"><p class="note">בודק…</p></div></div>
<div class="sec"><h4>צ׳ק־אין אוטומטי</h4><p class="note" style="margin:0 0 10px">כשאתם פותחים את האפליקציה ליד מקום מהקבוצה, היא שואלת אם לרשום ביקור. צריך לאשר גישה למיקום.</p><div class="seg" role="group" aria-label="צ׳ק־אין אוטומטי"><button type="button" data-act="ciSet" data-v="on" aria-pressed="${lsGet('rs-checkin','on')!=='off'}">פעיל</button><button type="button" data-act="ciSet" data-v="off" aria-pressed="${lsGet('rs-checkin','on')==='off'}">כבוי</button></div></div>`,
more:`<div class="sec"><h4>מראה</h4><div class="seg" role="group" aria-label="ערכת צבעים">${[['auto','אוטומטי'],['light','בהיר'],['dark','כהה']].map(([k,t])=>`<button type="button" data-act="theme" data-t="${k}" aria-pressed="${curTheme()===k}">${t}</button>`).join('')}</div></div>
<div class="sec"><h4>נוחות קריאה</h4>${dispHtml()}</div>
<div class="sec"><h4>התקנה במסך הבית</h4>${isStandalone()?'<p class="note" style="margin:0">האפליקציה כבר מותקנת במכשיר הזה ✓</p>':isPhone()?instSteps(instPlat())+instBtn(instPlat()).replace('class="btn"','class="btn pri"').replace(BRASS,''):'<p class="note" style="margin:0">פותחים את הקישור בטלפון ומתקינים משם.</p>'}</div>
<div class="sec"><h4>ייבוא</h4><button class="btn" type="button" data-act="import">${ICON.pin}ייבוא מקומות שמורים מגוגל מפות</button></div>
<div class="sec"><h4>שליחת האפליקציה לחברים</h4><p class="note" style="margin:0 0 10px">קישור קבוע לאפליקציה עצמה, בלי הצטרפות לקבוצה שלכם.</p><button class="btn" type="button" data-act="shareApp">📲 שליחת האפליקציה</button></div>
<div id="qAdm"></div>
<div class="sec"><h4>עזרה</h4><button class="btn" type="button" data-act="onb">💡 הדרכה קצרה על האפליקציה</button><p class="note" style="margin:10px 0 0">FOMO · גרסה ${APPV}</p></div>`};
  $('#sb').innerHTML=`<div class="sec dh set-h"><h2>הגדרות</h2></div><div class="set-tabs" role="tablist" aria-label="הגדרות">${SETT.map(([k,ic,t])=>`<button type="button" role="tab" data-stab="${k}" aria-selected="${k===setTab}"><i aria-hidden="true">${ic}</i>${t}<span class="set-dot" hidden></span></button>`).join('')}</div>${SETT.map(([k])=>`<div class="set-pane" role="tabpanel" data-spane="${k}" ${k===setTab?'':'hidden'}>${P[k]}</div>`).join('')}`;
  setDots();if(focus)setTimeout(()=>{const f=document.getElementById(focus);if(f){f.scrollIntoView({block:'center',behavior:RM()?'auto':'smooth'});f.classList.add('set-flash');setTimeout(()=>f.classList.remove('set-flash'),1800)}},380)}
function setDots(){const d=k=>{const b=document.querySelector(`[data-stab="${k}"] .set-dot`);return b};const g=d('grp');if(g)g.hidden=members.length>1;pushState().then(st=>{const n=d('ntf');if(n)n.hidden=st!=='off'}).catch(()=>{})}
function setGo(k){if(!SETT.some(x=>x[0]===k))return;setTab=k;lsSet('rs-set-tab',k);document.querySelectorAll('[data-stab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.stab===k));document.querySelectorAll('[data-spane]').forEach(p=>p.hidden=p.dataset.spane!==k);
  const t=document.querySelector('.set-tabs'),ov=$('#ov');if(t&&ov){const top=t.offsetTop-70;if(ov.scrollTop>top)ov.scrollTop=Math.max(0,top)}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-stab]');if(b)setGo(b.dataset.stab)});
{let sx=null,sy=0;document.addEventListener('touchstart',e=>{if(mode!=='settings'||!e.target.closest('#sb .set-pane')||e.target.closest('.chips,.seg,input,select,textarea,.row'))return sx=null;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  document.addEventListener('touchend',e=>{if(sx===null||mode!=='settings')return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;sx=null;if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*.6)return;const i=SETT.findIndex(x=>x[0]===setTab),j=i+(dx<0?1:-1);if(j>=0&&j<SETT.length)setGo(SETT[j][0])},{passive:true})}
const codeFrom=v=>{v=String(v||'').trim();try{const u=new URL(v);return u.searchParams.get('join')||''}catch{}return /^[a-f0-9]{8,40}$/i.test(v)?v:''};
async function doCreateList(name){const {data,error}=await sb.rpc('create_list',{list_name:name});if(error){toast(errMsg(error));return null}await loadLists();return data}
async function doJoin(code){const {data,error}=await sb.rpc('join_list',{code});if(error){toast(errMsg(error));return null}if(!data){toast('קישור ההזמנה לא תקף. אולי אופס? בקשו קישור חדש.');return null}await loadLists();return data}

/* ================= features: offline ================= */
const isNetErr=e=>!navigator.onLine||/fetch|network|load failed|NetworkError/i.test(String(e&&(e.message||e))||'');
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
function cacheRows(){if(cur)lsSet('rs-cache-'+cur.id,rows)}
let offToast=0;
function queueOp(op,silent){const q=lsGet('rs-outbox',[]);const last=q[q.length-1];
  if(op.t==='del'&&q.some(o=>!o.t&&o.isNew&&o.id===op.id)){lsSet('rs-outbox',q.filter(o=>o.t||o.id!==op.id));cacheRows();setOffline();return}
  let m=null;if(!op.t&&!op.isNew){if(last&&!last.t&&last.id===op.id&&last.lid===op.lid)m=last;else m=q.find(o=>!o.t&&o.isNew&&o.id===op.id&&o.lid===op.lid)||null}
  if(m)m.patch=applyPatch(m.patch,op.patch);else q.push(op);lsSet('rs-outbox',q);if(!silent&&Date.now()-offToast>8000){offToast=Date.now();toast('אין חיבור. השינוי נשמר במכשיר ויסונכרן כשהחיבור יחזור.')}cacheRows();setOffline()}
let flushing=false;
async function flushOutbox(){if(flushing||!navigator.onLine||!sb)return;flushing=true;let q=lsGet('rs-outbox',[]),done=0;
  while(q.length){const op=q[0];try{const {error}=op.t==='del'?await sb.from('restaurants').delete().eq('id',op.id):op.t==='cmt'?await sb.from('comments').insert({list_id:op.lid,restaurant_id:op.rid,body:op.body}):op.t==='act'?await sb.from('activity').insert({list_id:op.lid,kind:op.kind,restaurant_id:op.rid||null,text:op.text}):op.isNew?await sb.from('restaurants').insert({id:op.id,list_id:op.lid,data:op.patch}):await sb.rpc('patch_restaurant',{rid:op.id,patch:op.patch});if(error&&(isNetErr(error)||/JWT|token/i.test(error.message||'')))break;if(!error&&op.t==='del'&&op.paths&&op.paths.length)sb.storage.from('photos').remove(op.paths).catch(()=>{});q.shift();done++;lsSet('rs-outbox',q)}catch(e){if(isNetErr(e))break;q.shift();lsSet('rs-outbox',q)}}
  flushing=false;await flushPhotos();if(done){toast('השינויים שנשמרו במכשיר סונכרנו');loadAll()}setOffline()}
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('fomo',1);r.onupgradeneeded=()=>r.result.createObjectStore('up',{autoIncrement:true});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function idbAdd(v){const d=await idb();return new Promise(r=>{const t=d.transaction('up','readwrite');t.objectStore('up').add(v);t.oncomplete=()=>r()})}
async function idbAll(){const d=await idb();return new Promise(r=>{const out=[];const t=d.transaction('up');t.objectStore('up').openCursor().onsuccess=e=>{const c=e.target.result;if(c){out.push({k:c.key,v:c.value});c.continue()}else r(out)}})}
async function idbDel(k){const d=await idb();return new Promise(r=>{const t=d.transaction('up','readwrite');t.objectStore('up').delete(k);t.oncomplete=()=>r()})}
async function flushPhotos(){if(!navigator.onLine)return;let items=[];try{items=await idbAll()}catch{return}
  for(const {k,v} of items){try{const ph=await putPhoto(v.rid,v.blob);
    let r=byId(v.rid);if(!r){const {data}=await sb.from('restaurants').select('data').eq('id',v.rid).maybeSingle();r=data&&data.data}
    if(r){const photos=[...(r.photos||[]),{...ph,by:v.by,at:v.at}];if(byId(v.rid))await save(v.rid,{photos,updatedAt:Date.now()});else await sb.rpc('patch_restaurant',{rid:v.rid,patch:{photos}})}
    await idbDel(k)}catch(e){if(isNetErr(e))return}}}
function setOffline(){const n=lsGet('rs-outbox',[]).length;const el=$('#status');if(!el)return;if(!navigator.onLine)el.textContent='אין חיבור לאינטרנט · מוצגים הנתונים השמורים במכשיר'+(n?` · ${n===1?'שינוי אחד ממתין':n+' שינויים ממתינים'} לסנכרון`:'');else if(n)el.textContent=`מסנכרן ${n===1?'שינוי אחד':n+' שינויים'} שנשמרו במכשיר…`;else if(/^אין חיבור|^מסנכרן/.test(el.textContent))el.textContent=''}
window.addEventListener('online',()=>{setOffline();flushOutbox()});window.addEventListener('offline',setOffline);

/* ================= activity feed ================= */
let acts=[];
const relT=t=>{const m=(Date.now()-new Date(t))/6e4;return m<1?'עכשיו':m<60?`לפני ${Math.round(m)} דק׳`:m<1440?`לפני ${Math.round(m/60)} שע׳`:m<2880?'אתמול':fmtD(String(t).slice(0,10),{day:'numeric',month:'short'})};
function logAct(kind,rid,text){if(!cur)return;if(!navigator.onLine){queueOp({t:'act',lid:cur.id,kind,rid:rid||null,text},true);return}sb.from('activity').insert({list_id:cur.id,kind,restaurant_id:rid||null,text}).then(()=>{},()=>{})}
async function loadActivity(){if(!cur)return;const lid=cur.id;try{const {data}=await sb.from('activity').select('*').eq('list_id',lid).order('created_at',{ascending:false}).limit(60);if(cur&&cur.id===lid){acts=data||[];renderBell()}}catch{}}
const seenKey=()=>'rs-seen-'+(cur&&cur.id);
function unread(){const s=lsGet(seenKey(),0);return acts.filter(a=>a.user_id!==myId&&new Date(a.created_at).getTime()>s).length}
function renderBell(){const n=unread();document.querySelectorAll('.bell-n').forEach(b=>{b.textContent=n>9?'9+':String(n);b.hidden=!n})}
const ACT_IC={add:'plus',photo:'cam',comment:'chat',visit:'pin',plan:'cal',match:'heart',poll:'vote'};
function feedSheet(){killFormMap();openId=null;mode='feed';openSheet();lsSet(seenKey(),Date.now());renderBell();
  $('#sb').innerHTML=`<div class="sec dh"><h2>מה חדש</h2><p class="meta" style="margin-top:6px">מה קורה בקבוצה "${esc(cur.name)}"</p></div><div class="sec"><ul class="feed">${acts.length?acts.map(a=>`<li ${a.restaurant_id?`data-act="open" data-id="${esc(a.restaurant_id)}"`:''}><span class="av" style="--h:${hue(a.user_id)}">${esc((nm(a.user_id)||'?').charAt(0))}</span><span class="ft"><b>${esc(nm(a.user_id))}</b> ${esc(a.text)}<small>${relT(a.created_at)}</small></span></li>`).join(''):'<li class="note">עוד לא קרה כלום. ברגע שמישהו יוסיף מקום, תמונה או תגובה, זה יופיע כאן.</li>'}</ul></div>`}

/* ================= comments ================= */
const cmts={};
async function loadComments(rid){cmts[rid]=cmts[rid]||null;try{const {data}=await sb.from('comments').select('*').eq('restaurant_id',rid).order('created_at');cmts[rid]=data||[];if(openId===rid&&mode==='view')renderDetail()}catch{cmts[rid]=[]}}
const EMO=['❤️','🔥','😋','🤤','👌','🍸','🍷','👏'];
function commentsHtml(r){if(cmts[r.id]===undefined){cmts[r.id]=null;loadComments(r.id)}const arr=cmts[r.id];
  return `<div class="sec"><h4>שיחה על המקום</h4><div class="cmts">${arr===null?'<p class="note">טוען…</p>':arr.length?arr.map(c=>`<div class="cmt ${c.user_id===myId?'me':''}"><span class="av" style="--h:${hue(c.user_id)}">${esc(nm(c.user_id).charAt(0))}</span><div class="bub"><b>${esc(nm(c.user_id))}</b><p>${esc(c.body)}</p><small>${relT(c.created_at)}</small></div>${c.user_id===myId||isOwner()?`<button type="button" class="del" data-act="rmCmt" data-cid="${esc(c.id)}" aria-label="מחיקת תגובה">×</button>`:''}</div>`).join(''):'<p class="note">עוד אין תגובות. מה דעתכם על המקום?</p>'}</div>
<div class="emo">${EMO.map(e=>`<button type="button" class="emo-b" data-act="emo" data-e="${e}">${e}</button>`).join('')}</div>
<form class="addrow" id="cmtF"><input class="f" name="c" maxlength="500" placeholder="כתבו משהו…" aria-label="תגובה"><button class="btn pri" type="submit">שליחה</button></form></div>`}
async function sendComment(r,body){body=String(body||'').trim().slice(0,500);if(!body)return;if(!navigator.onLine){cmts[r.id]=[...(cmts[r.id]||[]),{id:'tmp-'+uuid(),user_id:myId,body,created_at:new Date().toISOString(),restaurant_id:r.id}];queueOp({t:'cmt',lid:cur.id,rid:r.id,body});logAct('comment',r.id,`הגיב/ה על ${r.name}: "${body.slice(0,60)}"`);renderDetail();return}
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
  if(p.closed){const w=byId(pollWinner(p));$('#sb').innerHTML=`<div class="pick"><p class="meta">${esc(p.title)} · ${tot} הצביעו</p><h2 style="margin-top:8px">והמנצח הוא…</h2><div class="nm">${esc(w?w.name:'—')}</div>${w?`<p class="meta">${esc([w.cuisine,w.city].filter(Boolean).join(' · '))}</p><div class="row"><a class="btn pri" href="${esc(wazeUrl(w))}" target="_blank" rel="noopener">${ICON.nav}יוצאים! Waze</a><button class="btn" type="button" data-act="planNew" data-id="${esc(w.id)}">${ICON.cal}קביעה + יומן</button><button class="btn" type="button" data-act="open" data-id="${esc(w.id)}">פרטים</button></div>`:''}${canEnd?'<button class="link-btn" type="button" data-act="pollDel">מחיקת ההצבעה</button>':''}</div>`;return}
  $('#sb').innerHTML=`<div class="sec dh"><h2>${esc(p.title)}</h2><p class="meta" style="margin-top:6px">${tot} הצביעו · ${mine?'אפשר לשנות את ההצבעה':'בחרו את המקום שהכי בא לכם'}</p></div><div class="sec"><div class="popts">${(p.options||[]).map(o=>{const r=byId(o),n=c[o]||0,pc=tot?Math.round(n/tot*100):0;return `<button type="button" class="popt ${mine===o?'sel':''}" data-act="pollVote" data-o="${esc(o)}"><span class="pb" style="width:${pc}%"></span><span class="pt"><b>${esc(r?r.name:'מקום שנמחק')}</b><small>${esc(r?[r.cuisine,r.city].filter(Boolean).join(' · '):'')}${voters(o).length?' · '+esc(voters(o).join(', ')):''}</small></span><span class="pn">${n}</span></button>`}).join('')}</div>
<div class="row" style="margin-top:16px">${canEnd?'<button class="btn pri" type="button" data-act="pollClose">סיום והכרזה על המנצח</button><button class="btn" type="button" data-act="pollDel" style="color:var(--bad)">מחיקה</button>':''}<button class="btn" type="button" data-act="shareInvite">${ICON.share}הזמנת חברים להצביע</button></div><p class="note">חברים צריכים להיות בקבוצה כדי להצביע. אפשר לשלוח להם את קישור ההזמנה.</p></div>`}
function pollNewSheet(){killFormMap();openId=null;mode='pollnew';openSheet();const cands=rows.filter(r=>r.status!=='been'||r.fav||avg(r)>=4);
  $('#sb').innerHTML=`<form id="pollF" class="sec dh"><h2>הצבעה עם חברים</h2><p class="meta" style="margin-top:6px">בחרו 2 עד 4 מקומות, וכל מי שבקבוצה יצביע.</p><label class="l" style="margin-top:14px">כותרת<input class="f" name="t" maxlength="60" value="לאן יוצאים הערב?"></label><div class="chips" style="margin-top:14px">${cands.map(r=>`<label class="chip"><input type="checkbox" name="o" value="${esc(r.id)}"><span>${esc(r.name)}</span></label>`).join('')||'<p class="note">אין עדיין מקומות בקבוצה.</p>'}</div><p class="note" id="pollErr"></p><div class="row" style="margin-top:12px"><button class="btn pri" type="submit">פתיחת הצבעה</button></div></form>`}
async function createPoll(fm){const opts=[...fm.querySelectorAll('input[name=o]:checked')].map(i=>i.value);if(opts.length<2||opts.length>4){$('#pollErr').textContent='בחרו בין 2 ל-4 מקומות';return}
  const title=fm.elements.t.value.trim()||'לאן יוצאים הערב?';const {data,error}=await sb.from('polls').insert({list_id:cur.id,title,options:opts}).select().single();if(error){toast(errMsg(error));return}
  polls.unshift(data);renderNotices();logAct('poll',null,`פתח/ה הצבעה: ${title}`);pollSheet(data.id)}

/* ================= planned dates ================= */
const isPast=v=>v.d<=today();
const nowHM=()=>new Date().toTimeString().slice(0,5);
const isPlanV=v=>!!v&&(v.d>today()||(v.d===today()&&!!v.t&&v.t>nowHM()));
const upcoming=()=>{const out=[];for(const r of rows)for(const v of visitsOf(r))if(isPlanV(v))out.push({r,v});return out.sort((a,b)=>(a.v.d+(a.v.t||'')).localeCompare(b.v.d+(b.v.t||'')))};
const daysTo=d=>Math.round((new Date(d+'T12:00')-new Date(today()+'T12:00'))/864e5);
const whenTxt=v=>{const n=daysTo(v.d);return (n===0?'היום':n===1?'מחר':`בעוד ${n} ימים`)+(v.t?` ב-${v.t}`:'')};
function icsData(r,v){const d=v.d.replace(/-/g,''),t=(v.t||'').replace(':','');const st=t?`DTSTART:${d}T${t}00`:`DTSTART;VALUE=DATE:${d}`;
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Fomo//HE','BEGIN:VEVENT',`UID:${r.id}-${d}@fomo`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}Z`,st,t?'DURATION:PT2H':'DURATION:P1D',`SUMMARY:${r.name} · Fomo`,`LOCATION:${[r.address,r.city].filter(Boolean).join(', ')}`,`URL:${mapsUrl(r)}`,'BEGIN:VALARM','TRIGGER:-PT2H','ACTION:DISPLAY',`DESCRIPTION:${r.name}`,'END:VALARM','END:VEVENT','END:VCALENDAR'];
  return 'data:text/calendar;charset=utf-8,'+encodeURIComponent(L.join('\r\n'))}
function gcalUrl(r,v){const d=v.d.replace(/-/g,'');let dates;if(v.t){const [h,m]=v.t.split(':').map(Number);const e=new Date(2000,0,1,h+2,m);dates=`${d}T${v.t.replace(':','')}00/${d}T${String(e.getHours()).padStart(2,'0')}${String(e.getMinutes()).padStart(2,'0')}00`}else{const n=new Date(v.d+'T12:00');n.setDate(n.getDate()+1);dates=`${d}/${n.toLocaleDateString('en-CA').replace(/-/g,'')}`}
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(r.name+' · Fomo')+'&dates='+dates+'&location='+encodeURIComponent([r.address,r.city].filter(Boolean).join(', '))+'&details='+encodeURIComponent('נקבע ב-Fomo · ניווט: '+wazeUrl(r))+(v.t?'&ctz=Asia/Jerusalem':'')}

/* ================= opening hours ================= */
const DAYS=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
const hm=s=>{const [h,m]=String(s||'').split(':').map(Number);return h*60+(m||0)};
function openState(r){if(r.permClosed)return {open:false,gone:true};const H=r.hours;if(!H||!Object.keys(H).length)return null;const n=new Date(),d=n.getDay(),m=n.getHours()*60+n.getMinutes();
  const y=H[(d+6)%7];if(y&&hm(y[1])<hm(y[0])&&m<hm(y[1]))return {open:true,until:y[1]};
  const t=H[d];if(t===undefined)return null;if(t===null)return {open:false};const o=hm(t[0]),c=hm(t[1]);
  if(c>o?(m>=o&&m<c):(m>=o||m<c))return {open:true,until:t[1]};return {open:false,from:m<o?t[0]:null}}
function hhNow(r){const h=r.hh;if(!h||!h.f||!h.t||!hhOnDay(h,new Date().getDay()))return false;const n=new Date(),m=n.getHours()*60+n.getMinutes(),o=hm(h.f),c=hm(h.t);return c>o?(m>=o&&m<c):(m>=o||m<c)}
function hoursForm(r){const H=r.hours||{},hh=r.hh||{};return `<details class="hours full"${Object.keys(H).length||hh.f?' open':''}><summary>שעות פתיחה והאפי אוור</summary><div class="hgrid">${DAYS.map((dn,i)=>{const h=H[i];return `<div class="hrow"><span class="hd">${dn}</span><input class="f" type="time" name="ho${i}" value="${h?esc(h[0]):''}" aria-label="פתיחה ${dn}"><span>עד</span><input class="f" type="time" name="hc${i}" value="${h?esc(h[1]):''}" aria-label="סגירה ${dn}"><label class="chip sm"><input type="checkbox" name="hx${i}" ${h===null?'checked':''}><span>סגור</span></label></div>`}).join('')}
<button type="button" class="btn sm" data-act="copyHours">העתקת יום א׳ לכל השבוע</button>
<div class="hrow hhrow"><span class="hd">🍹 האפי אוור</span><input class="f" type="time" name="hhf" value="${esc(hh.f||'')}" aria-label="האפי אוור מ"><span>עד</span><input class="f" type="time" name="hht" value="${esc(hh.t||'')}" aria-label="האפי אוור עד"></div><div class="hhdays chips" role="group" aria-label="ימי האפי אוור">${DAYS.map((dn,i)=>`<label class="chip sm"><input type="checkbox" name="hhd" value="${i}" ${(hh.d||[]).includes(i)?'checked':''}><span>${dn}</span></label>`).join('')}</div><p class="note" style="margin:4px 0 0">בלי לסמן ימים = כל יום.</p><input class="f" name="hhn" maxlength="60" placeholder="מה המבצע? למשל 1+1 על קוקטיילים" value="${esc(hh.n||'')}" aria-label="מה המבצע"></div></details>`}
function readHours(fd){const H={};for(let i=0;i<7;i++){if(fd.get('hx'+i)){H[i]=null;continue}const o=fd.get('ho'+i),c=fd.get('hc'+i);if(o&&c)H[i]=[String(o),String(c)]}const f=fd.get('hhf'),t=fd.get('hht'),hd=fd.getAll('hhd').map(Number).filter(n=>n>=0&&n<7),hn=String(fd.get('hhn')||'').trim().slice(0,60);return {hours:H,hh:f&&t?{f:String(f),t:String(t),...(hd.length&&hd.length<7?{d:hd}:{}),...(hn?{n:hn}:{})}:null}}
function hoursView(r){if(r.permClosed)return `<div class="sec gone-sec"><h4>⛔ נראה שהמקום נסגר לצמיתות</h4><p class="note" style="margin:0">כך כתוב באתר של המקום. אם זו טעות, אפשר לסמן שהוא עדיין פתוח.</p><button class="btn sm" type="button" data-act="notGone">הוא עדיין פתוח</button></div>`;const H=r.hours||{};if(!Object.keys(H).length&&!(r.hh&&r.hh.f))return '';const st=openState(r),d=new Date().getDay();
  return `<div class="sec"><h4>שעות פתיחה ${st?`<span class="open ${st.open?'on':''}">${st.open?'פתוח עכשיו'+(st.until?' · עד '+esc(st.until):''):'סגור עכשיו'+(st.from?' · נפתח ב-'+esc(st.from):'')}</span>`:''}</h4><div class="htab">${DAYS.map((dn,i)=>H[i]===undefined?'':`<div class="${i===d?'today':''}"><span>${dn}</span><span${H[i]===null?'':' dir="ltr"'}>${H[i]===null?'סגור':esc(H[i][0])+'–'+esc(H[i][1])}</span></div>`).join('')}${r.hh&&r.hh.f?`<div class="hh ${hhNow(r)?'now':''}"><span>האפי אוור</span><span><bdi dir="ltr">${esc(r.hh.f)}–${esc(r.hh.t)}</bdi>${r.hh.d&&r.hh.d.length?' · '+r.hh.d.map(i=>DAYS[i]).join(' '):''}${hhNow(r)?' · עכשיו!':''}${r.hh.n?`<br><small>${esc(r.hh.n)}</small>`:''}</span></div>`:''}</div></div>`}

/* ================= near me ================= */
let myLoc=null;
function getLoc(){return new Promise(res=>{if(myLoc&&Date.now()-myLoc.at<6e5)return res(myLoc);if(!navigator.geolocation)return res(null);navigator.geolocation.getCurrentPosition(p=>{myLoc={lat:p.coords.latitude,lng:p.coords.longitude,at:Date.now()};res(myLoc)},()=>res(null),{enableHighAccuracy:false,timeout:10000,maximumAge:3e5})})}
function distKm(r){if(!myLoc||!hasLL(r))return null;const R=6371,t=x=>x*Math.PI/180,dl=t(r.lat-myLoc.lat),dg=t(r.lng-myLoc.lng);const a=Math.sin(dl/2)**2+Math.cos(t(myLoc.lat))*Math.cos(t(r.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(a))}
const distTxt=d=>d==null?'':(d<1?Math.round(d*1000/10)*10+' מ׳':d.toFixed(d<10?1:0)+' ק״מ')+' · ~'+Math.max(2,Math.round(d*2.2+2))+' דק׳';

/* ================= notices (today plans + polls) ================= */
function renderNotices(){outBadge();setTimeout(()=>{if($('#cdT')&&!cdTimer)cdTimer=setInterval(cdTick,30000)},0);const el=$('#pollBar');if(!el)return;const tp=upcoming().filter(({v})=>daysTo(v.d)<=1);const op=polls.filter(p=>!p.closed);const ev=(typeof events!=='undefined'?events:[]).filter(e=>e.d>=today()&&daysTo(e.d)<=3);
  const rv=pendingReviews(),sp=upcomingSpecial().slice(0,2),sur=surprisesForMe().slice(0,2);
  const cd=nextOuting(),wp=lsGet('rs-wx-x','')===today()?null:wxTypes();
  el.innerHTML=[...(voucherNotice()?[voucherNotice()]:[]),...(cd?[(()=>{const c=cdText(cd);return `<button type="button" class="notice cdown ${c.now?'now':''}" ${cd.ev?`data-ev="${esc(cd.ev)}"`:cd.id?`data-cdo="${esc(cd.id)}"`:''}><span class="ni">${c.now?'🎉':'⏳'}</span><span class="nt"><b id="cdT">${esc(c.big)}</b><small>${esc(cd.title)} · ${esc(whenTxt(cd.v))}</small></span></button>`})()]:[]),...(wp?[`<div class="notice wx"><span class="ni">${wp.m.e}</span><span class="nt"><b>${esc(wp.m.title)}</b><small>${esc(wp.m.why)}${wp.types.length||wp.tag?'. מתאים היום:':''}</small>${wp.types.length||wp.tag?`<span class="wxchips">${wp.types.map(c=>`<button type="button" class="chip" data-wxc="${esc(c)}" aria-pressed="${cuisF===c}">${esc(c)}</button>`).join('')}${wp.tag?`<button type="button" class="chip" data-wxt="${esc(wp.tag)}">${esc(wp.tag)}</button>`:''}</span>`:''}</span><span class="nbtns"><button type="button" class="del" data-wxx="1" aria-label="להסתיר להיום">×</button></span></div>`]:[]),...sur.map(({v})=>`<div class="notice sur"><span class="ni">🤫</span><span class="nt"><b>יציאת הפתעה ${esc(whenTxt(v))}!</b><small>${esc(nm(v.surprise.by))} מתכנן/ת${v.surprise.dress?' · לבוש: '+esc(v.surprise.dress):''}${v.surprise.hint?' · רמז: '+esc(v.surprise.hint):''} · נחשף ביום עצמו</small></span></div>`),...sp.map((x,i)=>{const r=specialPick(x,spSkip[x.md]);const n=daysTo(x.next);return `<div class="notice spd"><span class="ni">${(SPK[x.kind]||SPK.other)[1]}</span><span class="nt"><b>${n===0?'היום':n===1?'מחר':'בעוד '+n+' ימים'}: ${esc(x.name||(SPK[x.kind]||SPK.other)[0])}</b><small>${r?'הצעה: '+esc(r.name)+(r.city?' · '+esc(r.city):''):'הוסיפו מקומות לקבוצה כדי לקבל הצעה'}</small></span>${r?`<span class="nbtns"><button type="button" class="btn sm pri" data-spplan="${esc(r.id)}">לקבוע</button><button type="button" class="btn sm" data-spnext="${esc(x.md)}" data-rid="${esc(r.id)}">אחר</button></span>`:''}</div>`}),...rv.map(({r,v,key,rated})=>`<div class="notice rev"><span class="ni">⭐</span><span class="nt"><b>איך היה ב${esc(r.name)} ${agoTxt(v.d)}?</b><small>${rated?'הוסיפו תמונות ומנות שאהבתם':'דרגו, הוסיפו תמונות ומנות'}</small></span><span class="nbtns"><button type="button" class="btn sm pri" data-rev="${esc(r.id)}">${rated?'להוסיף':'לדרג'}</button><button type="button" class="del" data-revx="${esc(key)}" aria-label="לא עכשיו">×</button></span></div>`),...(pushAsk?[`<div class="notice push"><span class="ni">🔔</span><span class="nt"><b>לקבל התראות לטלפון?</b><small>כשמישהו מוסיף מקום, קובע ערב או מנצח במשחק, ובבוקר של יום יציאה</small></span><span class="nbtns"><button type="button" class="btn sm pri" data-push="on">הפעלה</button><button type="button" class="del" data-push="no" aria-label="לא תודה">×</button></span></div>`]:[]),...ev.map(e=>{const k=(e.rsvp||{})[myId],y=Object.values(e.rsvp||{}).filter(v=>v==='yes').length;return `<button type="button" class="notice plan" data-ev="${esc(e.id)}"><span class="ni">${ICON.users}</span><span class="nt"><b>${esc(whenTxt({d:e.d,t:e.t||''}))}: ${esc(e.title)}</b><small>${y} מגיעים · ${k==='yes'?'את/ה מגיע/ה':k==='maybe'?'סימנת אולי':k==='no'?'סימנת שלא':'עוד לא ענית'}</small></span><span class="ng">${k?'פרטים':'לענות'}</span></button>`}),...tp.map(({r,v})=>`<button type="button" class="notice plan" data-open="${esc(r.id)}"><span class="ni">${ICON.cal}</span><span class="nt"><b>${esc(whenTxt(v))}: ${esc(r.name)}</b><small>${esc([r.address,r.city].filter(Boolean).join(', ')||'יציאה מתוכננת')}</small></span><span class="ng">פרטים</span></button>`),
   ...op.map(p=>{const n=Object.keys(p.votes||{}).length,mine=(p.votes||{})[myId];return `<button type="button" class="notice" data-poll="${esc(p.id)}"><span class="ni">${ICON.vote}</span><span class="nt"><b>${esc(p.title)}</b><small>${n} הצביעו · ${mine?'הצבעת':'עוד לא הצבעת'}</small></span><span class="ng">להצבעה</span></button>`})].join('');applyNoticeDis(el)}

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
  S.push(`<div class="st-in"><div class="st-logo">Fomo</div><h2>ממשיכים לגלות</h2><p>${rows.filter(r=>r.status!=='been').length} מקומות עוד מחכים לנו בקבוצה</p><button class="btn" type="button" data-act="closeStory" style="margin-top:20px;background:#fff;color:#FF4E50;border-color:#fff">סגירה</button></div>`);
  killFormMap();openId=null;mode='story';openSheet();$('#ov').classList.add('story-ov');
  $('#sb').innerHTML=`<div class="story"><div class="st-bars">${S.map(()=>'<i><b></b></i>').join('')}</div><div class="st-slide"></div><button class="st-nav prev" type="button" data-act="stPrev" aria-label="הקודם"></button><button class="st-nav next" type="button" data-act="stNext" aria-label="הבא"></button></div>`;
  story={S,i:-1,t:null};stGo(0)}
function stGo(i){if(!story||mode!=='story')return;if(i<0)i=0;if(i>=story.S.length){return}story.i=i;clearTimeout(story.t);const sl=$('.st-slide');if(!sl)return;sl.innerHTML=story.S[i];sl.dataset.bg=i%4;
  document.querySelectorAll('.st-bars i').forEach((b,j)=>{b.className=j<i?'done':j===i?'cur':''});hydrate();if(i<story.S.length-1)story.t=setTimeout(()=>stGo(i+1),5000)}
function stClose(){if(story)clearTimeout(story.t);story=null;$('#ov').classList.remove('story-ov');closeSheet()}

/* ================= receipt scan ================= */
const loadScript=src=>new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src===src))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)});

/* ================= Google Maps import ================= */
let impItems=[];
function parseCSV(t){const out=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===','){row.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(f);out.push(row);row=[];f=''}else f+=c}if(f||row.length){row.push(f);out.push(row)}return out.filter(r=>r.some(x=>x.trim()))}
function fromGeo(j){return (j.features||[]).map(f=>{const p=f.properties||{},loc=p.location||p.Location||{},co=(f.geometry&&f.geometry.coordinates)||[];const lat=+co[1],lng=+co[0];
  return {name:p.Title||p.name||loc.name||loc['Business Name']||'',address:loc.address||loc.Address||p.address||'',mapsUrl:p.google_maps_url||p['Google Maps URL']||'',note:p.Comment||p.comment||'',lat:lat&&lng?lat:null,lng:lat&&lng?lng:null}})}
function fromCSV(t){const r=parseCSV(t);if(!r.length)return[];const h=r[0].map(x=>x.trim().toLowerCase());const ix=k=>h.indexOf(k);return r.slice(1).map(c=>{const url=c[ix('url')]||'',pm=parseMaps(url);return {name:c[ix('title')]||pm.name||'',address:'',mapsUrl:url,note:c[ix('note')]||c[ix('comment')]||'',lat:Number.isFinite(pm.lat)?pm.lat:null,lng:Number.isFinite(pm.lng)?pm.lng:null}})}
function importSheet(){killFormMap();openId=null;mode='import';openSheet();impItems=[];
  $('#sb').innerHTML=`<div class="sec dh"><h2>ייבוא מגוגל מפות</h2><p class="meta" style="margin-top:6px">מעבירים את המקומות השמורים שלכם מגוגל מפות לקבוצה "${esc(cur.name)}".</p></div><div class="sec"><h4>איך מוציאים את הקובץ מגוגל</h4><ol class="steps"><li>נכנסים ל-<a href="https://takeout.google.com" target="_blank" rel="noopener">takeout.google.com</a> עם חשבון הגוגל שלכם.</li><li>לוחצים "ביטול הבחירה" ומסמנים רק את <b>Saved</b> (הרשימות השמורות) ואת <b>Maps (your places)</b>.</li><li>לוחצים "השלב הבא" ← "יצירת ייצוא". גוגל ישלח קישור להורדה במייל.</li><li>מורידים ופותחים את קובץ ה-ZIP, ובוחרים כאן את <b>Saved Places.json</b> או את קבצי ה-CSV של הרשימות.</li></ol>
<label class="btn pri" style="margin-top:12px">בחירת קבצים<input type="file" accept=".json,.geojson,.csv,application/json,text/csv" multiple hidden id="impFile"></label><div id="impList"></div></div>`}
async function readImport(files){let items=[];for(const f of files){try{const t=await f.text();if(/\.csv$/i.test(f.name))items.push(...fromCSV(t));else items.push(...fromGeo(JSON.parse(t)))}catch{toast('לא הצלחנו לקרוא את '+f.name)}}
  const have=new Set(rows.map(r=>String(r.name).trim().toLowerCase()));const seen=new Set();impItems=items.filter(x=>x.name&&!seen.has(x.name.toLowerCase())&&seen.add(x.name.toLowerCase())).map(x=>({...x,dup:have.has(x.name.trim().toLowerCase())}));
  $('#impList').innerHTML=impItems.length?`<p class="note" style="margin-top:14px">נמצאו ${impItems.length} מקומות. בטלו את הסימון ממה שלא תרצו להעביר.</p><div class="implist">${impItems.map((x,i)=>`<label class="impi"><input type="checkbox" data-i="${i}" ${x.dup?'':'checked'}><span><b>${esc(x.name)}</b><small>${esc(x.dup?'כבר בקבוצה':(x.address||(x.lat?'עם מיקום מדויק':'')))}</small></span></label>`).join('')}</div><button class="btn pri" type="button" data-act="impGo" style="margin-top:14px">ייבוא המקומות המסומנים</button>`:'<p class="note">לא נמצאו מקומות בקבצים האלה.</p>'}
async function doImport(btn){const sel=[...document.querySelectorAll('.implist input:checked')].map(i=>impItems[+i.dataset.i]);if(!sel.length)return;btn.disabled=true;let n=0;
  for(const x of sel){btn.textContent=`מייבא ${++n} מתוך ${sel.length}…`;const d={name:x.name.slice(0,80),address:x.address.slice(0,120),city:'',cuisine:'',status:'want',price:0,mapsUrl:safeUrl(x.mapsUrl),notes:x.note.slice(0,2000),tags:[],fav:false,ratings:{},votes:{},dishes:[],photos:[],visits:[],addedBy:myId,createdAt:Date.now(),updatedAt:Date.now()};if(x.lat!=null){d.lat=x.lat;d.lng=x.lng;d.llLevel='place'}await save(uuid(),d,true)}
  logAct('add',null,`ייבא/ה ${sel.length} מקומות מגוגל מפות`);toast(`${sel.length} מקומות יובאו לקבוצה`);closeSheet()}

/* ================= theme ================= */
function setTheme(t){try{if(t==='auto')localStorage.removeItem('rs-theme');else localStorage.setItem('rs-theme',t)}catch{}if(t==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t;const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='dark'?'#160E13':'#FF5E4D'}
const curTheme=()=>{try{return localStorage.getItem('rs-theme')||'auto'}catch{return 'auto'}};

/* ================= place search (Google + fallback) & geocoding ================= */
const CUIS=['איטלקי','אסייתי','יפני / סושי','בשרים','דגים ופירות ים','ים-תיכוני','המבורגר','פיצה','מקסיקני','הודי','מסעדת שף','בר קוקטיילים','בר יין','בר','פאב','קפה ובראנץ\'','טבעוני','חומוס ומזרחי','קינוחים','אחר'];
const GTYPE={italian_restaurant:'איטלקי',pizza_restaurant:'פיצה',japanese_restaurant:'יפני / סושי',sushi_restaurant:'יפני / סושי',ramen_restaurant:'יפני / סושי',chinese_restaurant:'אסייתי',thai_restaurant:'אסייתי',asian_restaurant:'אסייתי',vietnamese_restaurant:'אסייתי',korean_restaurant:'אסייתי',indonesian_restaurant:'אסייתי',steak_house:'בשרים',barbecue_restaurant:'בשרים',seafood_restaurant:'דגים ופירות ים',mediterranean_restaurant:'ים-תיכוני',greek_restaurant:'ים-תיכוני',spanish_restaurant:'ים-תיכוני',hamburger_restaurant:'המבורגר',mexican_restaurant:'מקסיקני',indian_restaurant:'הודי',fine_dining_restaurant:'מסעדת שף',cocktail_bar:'בר קוקטיילים',wine_bar:'בר יין',pub:'פאב',irish_pub:'פאב',bar:'בר',night_club:'בר',cafe:'קפה ובראנץ\'',coffee_shop:'קפה ובראנץ\'',brunch_restaurant:'קפה ובראנץ\'',breakfast_restaurant:'קפה ובראנץ\'',vegan_restaurant:'טבעוני',vegetarian_restaurant:'טבעוני',middle_eastern_restaurant:'חומוס ומזרחי',lebanese_restaurant:'חומוס ומזרחי',falafel_restaurant:'חומוס ומזרחי',shawarma_restaurant:'חומוס ומזרחי',hummus_restaurant:'חומוס ומזרחי',israeli_restaurant:'חומוס ומזרחי',turkish_restaurant:'חומוס ומזרחי',dessert_shop:'קינוחים',dessert_restaurant:'קינוחים',ice_cream_shop:'קינוחים',bakery:'קינוחים',confectionery:'קינוחים'};
const GPRICE={PRICE_LEVEL_INEXPENSIVE:1,PRICE_LEVEL_MODERATE:2,PRICE_LEVEL_EXPENSIVE:3,PRICE_LEVEL_VERY_EXPENSIVE:4,INEXPENSIVE:1,MODERATE:2,EXPENSIVE:3,VERY_EXPENSIVE:4};
function cuisSelect(v){v=v||'';const opts=CUIS.includes(v)||!v?CUIS:[v,...CUIS];return `<select class="f" name="cuisine"><option value="">בחרו סוג…</option>${opts.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`}
let gReady=null;
function gmaps(){const k=(window.APP_CONFIG||{}).googleKey;if(!k)return Promise.resolve(null);if(gReady)return gReady;
  gReady=new Promise(res=>{window.__gmInit=()=>res(window.google);const s=document.createElement('script');s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(k)}&libraries=places&language=iw&region=IL&loading=async&callback=__gmInit`;s.async=true;s.onerror=()=>{gReady=null;res(null)};document.head.appendChild(s);setTimeout(()=>res(window.google||null),12000)});return gReady}
const GF=['hasDelivery','servesVegetarianFood','photos','displayName','formattedAddress','addressComponents','location','googleMapsURI','websiteURI','regularOpeningHours','priceLevel','primaryType','types'];
/* ---- shared Google quota (server-side, per day for everyone + per user) ---- */
const QK={gsearch:{what:'החיפושים החכמים בגוגל',unit:'חיפושים',alt:'בינתיים אפשר לחפש לפי שם, וזה ממשיך לעבוד כרגיל.'},place:{what:'החיפושים בגוגל',unit:'חיפושים',alt:'בינתיים החיפוש הרגיל ממשיך לעבוד: הוא ימלא שם וכתובת, ואת השאר אפשר להשלים ידנית או לסמן את המקום במפה.'},
  photo:{what:'הבאת התמונות מגוגל',unit:'תמונות',alt:'בינתיים אפשר להעלות תמונה מהטלפון בכפתור התמונות.'},
  ai:{what:'עוזר ה־AI',unit:'בקשות',the:'בקשות ה־AI',alt:'בינתיים החיפוש והסריקה ממשיכים לעבוד בדרך הרגילה, רק בלי העזרה החכמה.'},
  vision:{what:'סריקות הקבלות של גוגל',unit:'סריקות',alt:'בינתיים הקבלה נקראת ישירות במכשיר. זה קצת פחות מדויק, אז כדאי לעבור על התוצאה.'}};
async function takeQuota(k){if(!sb||!myId||!navigator.onLine)return {ok:false,reason:'err'};
  try{const {data,error}=await sb.rpc('take_quota',{k});if(error||!data)throw error||new Error('no data');if(!data.ok)quotaMsg(k,data);return data}catch(e){console.warn('quota',e);return {ok:false,reason:'err'}}}
function quotaMsg(k,q){if(!q||q.ok||!QK[k]||(q.reason!=='user'&&q.reason!=='global'))return;const K=QK[k],key='rs-qmsg-'+k+'-'+q.reason+'-'+today();
  const title=q.reason==='user'?(K.the?`ניצלת את כל ${q.ucap} ${K.the} שלך להיום`:`ניצלת את כל ${q.ucap} ${K.unit==='חיפושים'?'החיפושים':K.unit==='תמונות'?'התמונות':'הסריקות'} שלך בגוגל להיום`):`המכסה המשותפת של ${K.what} נגמרה להיום`;
  const body=q.reason==='user'?`כדי ש־FOMO תישאר חינמית לכולם, לכל אחד יש מכסה יומית קטנה של ${K.what}. <b>המכסה שלך תתחדש מחר</b> 🌙`:`כל המשתמשים של FOMO כבר השתמשו היום במכסה המשותפת. <b>היא תתחדש מחר</b> ואז הכל יחזור לעבוד כרגיל 🌙`;
  if(lsGet(key,0)){toast(title+'. המכסה תתחדש מחר.');return}lsSet(key,1);
  const d=document.createElement('div');d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label',title);
  d.innerHTML=`<div class="calp-in"><div class="calp-ic" style="font-size:28px">⏳</div><h3>${esc(title)}</h3><p class="meta">${body}</p><p class="note" style="margin:0">${esc(K.alt)}</p><button class="btn pri" type="button" data-wx>הבנתי, תודה</button></div>`;
  d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-wx]'))setTimeout(()=>d.remove(),150)});document.body.appendChild(d);setTimeout(()=>{const b=d.querySelector('button');if(b)b.focus()},50)}
const QNAME={place:'פרטי מקום מגוגל',photo:'תמונות מגוגל',vision:'סריקת קבלות (Vision)',ai:'עוזר AI (Gemini)'};
async function fillQuotaAdm(){const el=$('#qAdm');if(!el||!sb)return;let st=null;try{const {data}=await sb.rpc('quota_stats');st=data}catch{}if(!st||!$('#qAdm'))return;
  const tot={};for(const x of st.today||[])tot[x.kind]=(tot[x.kind]||0)+x.n;
  el.className='sec';el.innerHTML=`<h4>ניהול המערכת (רק את/ה רואה את זה)</h4><h4 style="margin-top:6px">שימוש בגוגל</h4><p class="note" style="margin:0 0 10px">מכסה יומית לכל המערכת ולכל משתמש. מתאפס כל לילה בחצות.</p>
${(st.cfg||[]).map(c=>`<form class="qrow" data-k="${esc(c.kind)}"><b>${esc(QNAME[c.kind]||c.kind)}</b><span class="meta">היום ${tot[c.kind]||0}/${c.g} · החודש ${(st.month||{})[c.kind]||0}</span>
<label>לכולם ביום<input class="f" name="g" type="number" min="0" max="1000" value="${c.g}" inputmode="numeric"></label><label>לכל משתמש<input class="f" name="u" type="number" min="0" max="100" value="${c.u}" inputmode="numeric"></label><button class="btn" type="submit">שמירה</button></form>`).join('')}
<h4 style="margin-top:14px">מי השתמש בגוגל היום</h4>${(st.today||[]).length?`<div class="qwho">${st.today.map(x=>`<span>${esc(x.user||'?')}</span><span class="meta">${esc(QNAME[x.kind]||x.kind)}</span><b>${x.n}</b>`).join('')}</div>`:'<p class="note" style="margin:0">עוד לא היה שימוש היום.</p>'}`;fillAdminMore()}
async function quotaSave(f){const k=f.dataset.k,g=+f.elements.g.value,u=+f.elements.u.value;if(!(g>=0&&u>=0))return;const {error}=await sb.rpc('set_quota',{k,g,u});toast(error?'השמירה לא הצליחה':'המכסה עודכנה');if(!error)fillQuotaAdm()}
/* ---- Google place search: autocomplete is free inside a session, only picking a place counts ---- */
let gTok=null;
async function gSuggest(q){if(!(window.APP_CONFIG||{}).googleKey)return null;const g=await gmaps();if(!g||!g.maps||!g.maps.importLibrary)return null;
  const P=await g.maps.importLibrary('places');if(!P.AutocompleteSuggestion)return null;if(!gTok)gTok=new P.AutocompleteSessionToken();
  const {suggestions}=await P.AutocompleteSuggestion.fetchAutocompleteSuggestions({input:q,sessionToken:gTok,language:'iw',region:'il',includedRegionCodes:['il'],origin:{lat:31.9,lng:34.9}});
  return (suggestions||[]).map(s=>s.placePrediction).filter(p=>p&&isFoodG(p.types)).slice(0,6).map(p=>({g:true,pred:p,name:(p.mainText&&p.mainText.text)||String(p.text||''),full:(p.secondaryText&&p.secondaryText.text)||''}))}
async function gDetails(pred){const q=await takeQuota('place');if(!q.ok)return null;const pl=pred.toPlace();await pl.fetchFields({fields:GF});gTok=null;return pl}
/* text search, used only by the manual "photo from Google" button */
async function gSearch(q,fields,max){if(!(window.APP_CONFIG||{}).googleKey)return null;const g=await gmaps();if(!g||!g.maps||!g.maps.importLibrary)return null;const {Place}=await g.maps.importLibrary('places');
  const {places}=await Place.searchByText({textQuery:q,fields:fields||GF,language:'iw',region:'il',maxResultCount:max||3,locationBias:{lat:31.9,lng:34.9}});return places||[]}
function gComp(p,t){const c=(p.addressComponents||[]).find(c=>(c.types||[]).includes(t));return c?(c.longText||c.long_name||''):''}
function gToItem(p){const loc=p.location;const lat=typeof loc.lat==='function'?loc.lat():loc.lat,lng=typeof loc.lng==='function'?loc.lng():loc.lng;
  const ts=[p.primaryType,...(p.types||[])].filter(Boolean);const cuisine=ts.map(t=>GTYPE[t]).find(Boolean)||'';
  const H={};const per=(p.regularOpeningHours&&p.regularOpeningHours.periods)||[];const pad=n=>String(n).padStart(2,'0');
  for(const x of per){if(!x.open)continue;if(!x.close){for(let i=0;i<7;i++)H[i]=['00:00','23:59'];break}{const o=pad(x.open.hour)+':'+pad(x.open.minute),c=pad(x.close.hour)+':'+pad(x.close.minute);H[x.open.day]=H[x.open.day]?[H[x.open.day][0],c]:[o,c]}}
  if(per.length)for(let i=0;i<7;i++)if(!(i in H))H[i]=null;
  return {g:true,name:p.displayName||'',full:p.formattedAddress||'',address:[gComp(p,'route'),gComp(p,'street_number')].filter(Boolean).join(' '),city:gComp(p,'locality')||gComp(p,'administrative_area_level_2'),lat,lng,mapsUrl:p.googleMapsURI||'',site:p.websiteURI||'',price:GPRICE[p.priceLevel]||0,cuisine,hours:per.length?H:null,gphotos:gPhotos(p,1),veg:!!p.servesVegetarianFood,delivery:typeof p.hasDelivery==='boolean'?p.hasDelivery:typeof p.delivery==='boolean'?p.delivery:null}}
function osmToItem(x){const a=x.address||{},e=x.extratags||{};return {osm:(x.osm_type||'').charAt(0)+(x.osm_id||''),site:safeUrl(e.website||e['contact:website']||''),phone:e.phone||e['contact:phone']||'',name:x.name||x.display_name.split(',')[0],full:x.display_name,address:[a.road,a.house_number].filter(Boolean).join(' '),city:a.city||a.town||a.village||a.municipality||'',lat:+x.lat,lng:+x.lon,cuisine:{bar:'בר',pub:'פאב',cafe:'קפה ובראנץ\''}[x.type]||'',hours:parseOH(e.opening_hours)}}
function photonToItem(f){const p=f.properties||{},[lng,lat]=f.geometry.coordinates;return {name:p.name||p.street||'',full:[p.name,p.street&&(p.street+(p.housenumber?' '+p.housenumber:'')),p.city||p.town,p.country].filter(Boolean).join(', '),address:p.street?(p.street+(p.housenumber?' '+p.housenumber:'')):'',city:p.city||p.town||p.village||'',lat,lng,cuisine:{bar:'בר',pub:'פאב',cafe:'קפה ובראנץ\''}[p.osm_value]||''}}
const fetchJ=(u,ms)=>Promise.race([fetch(u).then(r=>r.json()),new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),ms||7000))]);
/* only food & drink businesses */
const FOOD_AMEN=new Set(['restaurant','cafe','bar','pub','fast_food','ice_cream','food_court','biergarten','nightclub']),FOOD_SHOP=new Set(['bakery','confectionery','pastry','deli','coffee','tea','wine','alcohol','beverages','chocolate','cheese']);
const isFoodOsm=(k,v)=>(k==='amenity'&&FOOD_AMEN.has(v))||(k==='shop'&&FOOD_SHOP.has(v));
const FOOD_GT=/(^|\s)(\w+_)?(restaurant|cafe|coffee_shop|cafeteria|bar|pub|bakery|food|meal_takeaway|meal_delivery|dessert_shop|dessert_restaurant|ice_cream_shop|confectionery|deli|juice_shop|tea_house|winery|brewery|brewpub|bistro|diner|pizzeria|steak_house|chocolate_shop|candy_store|donut_shop|bagel_shop|sandwich_shop|night_club|food_court|wine_bar|cocktail_bar|lounge_bar|sports_bar|hookah_bar|gastropub|beer_garden|bar_and_grill|acai_shop|bubble_tea_store)(\s|$)/;
const isFoodG=types=>FOOD_GT.test(' '+(types||[]).join(' ')+' ');
async function osmSearch(q,any){let res=[];try{res=(await fetchJ(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=10&accept-language=he&countrycodes=il&q=${encodeURIComponent(q)}`)).filter(x=>any||isFoodOsm(x.category,x.type)).map(osmToItem)}catch{}
  if(res.length<2){try{const j=await fetchJ(`https://photon.komoot.io/api/?limit=10&lat=32.0&lon=34.8&q=${encodeURIComponent(q)}`);res=res.concat((j.features||[]).filter(f=>{const p=f.properties||{};return p.countrycode==='IL'&&(any||isFoodOsm(p.osm_key,p.osm_value))}).map(photonToItem))}catch{}}
  const seen=new Set();return res.filter(x=>{const k=x.name+'|'+x.address;if(seen.has(k))return false;seen.add(k);return true}).slice(0,8)}
let formSrc={};
const catToItem=p=>({cat:true,pid:p.id,name:p.name,full:[p.address,p.city].filter(Boolean).join(', '),address:p.address||'',city:p.city||'',lat:p.lat,lng:p.lng,cuisine:p.cuisine||'',site:p.site||'',phone:p.phone||'',price:p.price||0,hours:p.hours||null,gpid:p.gpid||'',score:+p.score||0,uses:p.uses||1});
async function catSearch(q){if(!sb||!navigator.onLine)return [];try{const {data,error}=await sb.rpc('find_places',{q,ulat:myLoc?myLoc.lat:null,ulng:myLoc?myLoc.lng:null});if(error)throw error;const L=(data||[]).map(catToItem);const top=L[0]?L[0].score:0;return L.filter(x=>x.score>=Math.max(.3,top-.25))}catch(e){console.warn('catalog',e);return []}}
async function aiCall(body){if(!sb||!navigator.onLine||!myId)return null;try{const {data,error}=await sb.functions.invoke('ai',{body});if(error)throw error;if(data&&data.quota){quotaMsg('ai',data.quota);return null}if(!data||data.error){if(data&&data.error!=='nokey')console.warn('ai',data.error,data.detail||'');return null}return data}catch(e){console.warn('ai',e);return null}}
const BUSY='<li class="busy" aria-live="polite"><span class="spin" aria-hidden="true"></span>מחפש…</li>';
function placeRes(res,note){const ul=$('#placeRes');if(!ul)return;placeSearch.res=res;
  ul.innerHTML=res.map((x,i)=>`<li data-act="placePick" data-i="${i}"><b>${esc(x.name)}</b><small>${esc(x.full)}</small></li>`).join('')
  +(note?`<li class="nores"><small>${note}</small></li>`:'')
  +(res.some(x=>x.g)||!(window.APP_CONFIG||{}).googleKey?'':`<li class="gmore" data-act="gSearchNow"><small>לא מצאתם את המקום? <b>חיפוש מורחב</b></small></li>`)}
async function placeSearch(){const qv=$('#placeQ').value.trim(),ul=$('#placeRes');if(!qv)return;const seq=placeSearch.seq=(placeSearch.seq||0)+1;ul.innerHTML=BUSY;track('search');placeSearch.last={q:qv,ai:null};
  let res=await catSearch(qv);const found=()=>res.some(x=>x.cat&&x.score>=.45);let q2=qv;
  if(!found()){const ai=await aiCall({action:'parse',q:qv});if(seq!==placeSearch.seq)return;
    if(ai&&ai.name){track('ai');placeSearch.last={q:qv,ai};q2=[ai.name,ai.city].filter(Boolean).join(' ');const tries=[q2,...(ai.alt||[]).map(a=>[a,ai.city].filter(Boolean).join(' '))].filter((x,i,A)=>x&&x!==qv&&A.indexOf(x)===i).slice(0,3);
      for(const t of tries){const more=await catSearch(t);for(const m of more)if(!res.some(x=>x.pid===m.pid))res.push(m);if(found())break}res.sort((a,b)=>b.score-a.score)}}
  if(seq!==placeSearch.seq)return;
  if(!found()){const o=await osmSearch(q2);if(seq!==placeSearch.seq)return;res=res.concat(o)}
  if(!res.length){await gSearchNow(q2);return}
  placeRes(res)}
async function gSearchNow(qOverride,note){const qv=qOverride||$('#placeQ').value.trim(),ul=$('#placeRes');if(!qv||!ul)return;ul.innerHTML=BUSY;
  let g=null;try{g=await gSuggest(qv)}catch(e){console.warn('google suggest',e)}
  if(!g||!g.length){ul.innerHTML='<li class="nores"><small>לא מצאנו מסעדה, בר או בית קפה בשם הזה. נסו שם אחר, או סמנו את המקום ישירות על המפה למטה.</small></li>';return}
  placeRes(g,note||'')}
async function enrichFromSite(url,quiet){const f0=$('#ef');if(!f0||!url)return;const st=$('#fillSt');const before=st?st.textContent:'';if(st&&!quiet)st.textContent=before+' משלים פרטים…';
  const d=await aiCall({action:'enrich',url,cuisines:CUIS});const f=$('#ef');if(!f)return;if(st&&!quiet)st.textContent=before;if(!d||!d.ok)return;const E=f.elements,got=[];
  if(d.name&&!E.name.value.trim()){E.name.value=d.name;got.push('שם')}if(d.address&&!E.address.value.trim()){E.address.value=d.address;got.push('כתובת')}if(d.city&&!E.city.value.trim())E.city.value=d.city;
  if(d.cuisine&&!E.cuisine.value){E.cuisine.value=d.cuisine;got.push('סוג')}if(d.price&&!E.price.value){E.price.value=String(d.price);got.push('מחיר')}
  const hasH=[0,1,2,3,4,5,6].some(i=>E['ho'+i].value||E['hx'+i].checked);
  if(d.hours&&!hasH){for(let i=0;i<7;i++){const h=d.hours[i];E['hx'+i].checked=h===null;E['ho'+i].value=h?h[0]:'';E['hc'+i].value=h?h[1]:''}const det=f.querySelector('details.hours');if(det)det.open=true;formSrc.hoursSrc='web';got.push('שעות פתיחה')}
  if(d.phone)formSrc.phone=d.phone;if(d.dishes&&d.dishes.length)formSrc.dishes=d.dishes;
  if(st&&got.length)st.textContent=st.textContent?st.textContent+` השלמנו גם: ${got.join(', ')}.`:`✨ מילאנו: ${got.join(', ')}. בדקו שהכל נכון.`}
function contribute(d){if(!sb||!navigator.onLine||!d||!d.name)return Promise.resolve(null);const hz=d.hours&&Object.keys(d.hours).length?d.hours:null;
  const p={name:d.name,city:d.city,address:d.address,cuisine:d.cuisine,site:d.site,price:d.price||0,phone:formSrc.phone||'',place_id:formSrc.pid||d.placeId||'',gpid:formSrc.gpid||'',osm:formSrc.osm||''};
  if(Number.isFinite(d.lat)&&d.llLevel!=='street'){p.lat=d.lat;p.lng=d.lng}
  if(hz&&formSrc.hoursSrc!=='google'){p.hours=hz;p.hours_src=formSrc.hoursSrc||'user'}
  return sb.rpc('contribute_place',{p}).then(({data})=>data||null,()=>null)}
async function placePick(i){let x=(placeSearch.res||[])[i],f=$('#ef');if(!x||!f)return;
  formSrc={};if(x.cat)formSrc={pid:x.pid,hoursSrc:x.hours?'user':'',phone:x.phone};else if(x.osm)formSrc={osm:x.osm,phone:x.phone,hoursSrc:x.hours?'osm':''};else if(x.g&&!x.pred)formSrc={gpid:x.gpid||'',hoursSrc:'google'};
  if(x.pred){const ul=$('#placeRes');ul.innerHTML=BUSY;let pl=null;try{pl=await gDetails(x.pred)}catch(e){console.warn('google details',e)}
    if(pl){x=gToItem(pl);formSrc={gpid:pl.id||'',hoursSrc:'google'}}else{const o=await osmSearch([x.name,x.full].filter(Boolean).join(' '),true);x=o[0]?Object.assign(o[0],{name:x.name}):{name:x.name}}
    f=$('#ef');if(!f)return}
  const E=f.elements;
  if(x.name)E.name.value=x.name;if(x.address)E.address.value=x.address;if(x.city)E.city.value=x.city;
  if(x.cuisine&&!E.cuisine.value)E.cuisine.value=x.cuisine;
  if(x.mapsUrl)E.mapsUrl.value=x.mapsUrl;if(x.site&&!E.site.value)E.site.value=x.site;if(x.cat&&x.price&&!E.price.value)E.price.value=String(x.price);if(x.price&&!E.price.value)E.price.value=String(x.price);
  if(x.hours){for(let d=0;d<7;d++){const h=x.hours[d];E['hx'+d].checked=h===null;E['ho'+d].value=h?h[0]:'';E['hc'+d].value=h?h[1]:''}const det=f.querySelector('details.hours');if(det)det.open=true}
  pendDel=typeof x.delivery==='boolean'?x.delivery:null;if(x.veg){const cb=f.querySelector('[name=tags][value="צמחוני-פרנדלי"]');if(cb)cb.checked=true}pendG=x.gphotos&&x.gphotos.length?x.gphotos:null;if(x.lat!=null)setPin(x.lat,x.lng,false,true);$('#placeRes').innerHTML='';
  $('#fillSt').textContent='✨ מילאנו את הפרטים'+(x.gphotos&&x.gphotos.length?', ותמונה של המקום תתווסף בשמירה':'')+'. בדקו שהכל נכון, ושהסיכה במפה במקום הנכון.';
  if(!x.g&&!x.hours)fillHoursChain(x);
  dupNote({name:x.name,city:x.city,lat:x.lat,lng:x.lng,placeId:x.pid});
  {const L=placeSearch.last;if(x.cat&&x.pid&&L&&L.ai&&sb){const ns=[L.q,L.ai.name,...(L.ai.alt||[])].filter(Boolean).map(String).slice(0,6);sb.rpc('add_place_alias',{pid:x.pid,names:ns}).then(()=>{},()=>{})}}}
async function geocode(address,city){const a=String(address||'').trim(),c=String(city||'').trim();if(!a&&!c)return null;const q=[a,c].filter(Boolean).join(', ');
  const tries=[];if(a&&c)tries.push(`street=${encodeURIComponent(a)}&city=${encodeURIComponent(c)}`);tries.push(`q=${encodeURIComponent(q)}`);
  if(a&&c&&/\d/.test(a))tries.push(`street=${encodeURIComponent(a.replace(/\s*\d+\S*/g,'').trim())}&city=${encodeURIComponent(c)}`);
  for(const t of tries){try{const j=await fetchJ(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=il&accept-language=he&${t}`,6000);if(j[0])return {lat:+j[0].lat,lng:+j[0].lon}}catch{}}
  try{const j=await fetchJ(`https://photon.komoot.io/api/?limit=3&lat=32.0&lon=34.8&q=${encodeURIComponent(q)}`,6000);const f=(j.features||[]).find(f=>(f.properties||{}).countrycode==='IL');if(f)return {lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]}}catch{}
  return null}
async function formGeocode(){const f=$('#ef');if(!f)return;const E=f.elements;if(E.ll.value.trim()&&E.llLevel.value==='place'&&!formGeocode.auto)return;
  const p=await geocode(E.address.value,E.city.value);if(!p||!$('#ef'))return;setPin(p.lat,p.lng,false,true);E.llLevel.value='street';formGeocode.auto=true;$('#fillSt').textContent='הסיכה הוזזה לפי הכתובת. אם צריך, גררו אותה למקום המדויק.'}
const geoTried=new Set();let geoBusy=false;
async function backfillGeo(){if(geoBusy||!navigator.onLine)return;geoBusy=true;try{
  for(const r of rows.filter(r=>!hasLL(r)&&(r.address||r.city)&&!geoTried.has(r.id))){geoTried.add(r.id);const p=await geocode(r.address,r.city);
    if(p&&byId(r.id)&&!hasLL(byId(r.id))){await save(r.id,{lat:+p.lat.toFixed(6),lng:+p.lng.toFixed(6),llLevel:'street'})}await new Promise(z=>setTimeout(z,1200))}}finally{geoBusy=false}}

/* ================= Google photos ================= */
let pendG=null,pendDel=null;
function gPhotos(p,n){return (p.photos||[]).slice(0,n||3).map(ph=>{try{return {uri:ph.getURI({maxWidth:1400}),attr:((ph.authorAttributions||[])[0]||{}).displayName||''}}catch{return null}}).filter(Boolean)}
async function importGPhotos(id,list){const r=byId(id);if(!r||!list||!list.length||!navigator.onLine)return false;const added=[];
  for(const g of list){try{const res=await fetch(g.uri);if(!res.ok)continue;const ph=await putPhoto(id,await res.blob());added.push({...ph,by:myId,at:Date.now(),src:'google',attr:String(g.attr||'').slice(0,60)})}catch(e){console.warn('gphoto',e)}}
  if(!added.length)return false;const c=byId(id);return save(id,{photos:[...((c&&c.photos)||[]),...added],updatedAt:Date.now()})}
async function gPhotosFor(r,n){const qq=await takeQuota('photo');if(!qq.ok)return qq.reason==='err'?null:false;const q=[r.name,r.address,r.city].filter(Boolean).join(' ');const res=await gSearch(q,['displayName','photos','location']);if(!res||!res.length)return null;
  let best=res[0];if(hasLL(r)){let bd=1e9;for(const p of res){const x=gToItem(Object.assign({addressComponents:[],types:[]},p));const d=Math.hypot(x.lat-r.lat,x.lng-r.lng);if(d<bd){bd=d;best=p}}if(bd>0.01)return []}
  return gPhotos(best,n)}
async function fetchGPhotosBtn(id){const r=byId(id);if(!r)return;if(!(window.APP_CONFIG||{}).googleKey){toast('החיבור לגוגל לא זמין');return}
  toast('מחפש תמונה בגוגל…');const list=await gPhotosFor(r,1);if(list===false)return;if(list===null){toast('לא נמצא בגוגל');return}if(!list.length){toast('לא נמצאו תמונות של המקום בגוגל');return}
  const ok=await importGPhotos(id,list);toast(ok?'התמונה מגוגל נוספה':'לא הצלחנו להביא את התמונה');if(ok&&openId===id&&mode==='view')renderDetail()}
/* ================= calendar ================= */
function calPrompt(r,v){const old=$('#calp');if(old)old.remove();const d=document.createElement('div');d.id='calp';d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label','הוספה ליומן');
  d.innerHTML=`<div class="calp-in"><div class="calp-ic">${ICON.cal}</div><h3>להוסיף ליומן?</h3><p class="meta">${esc(r.name)} · ${esc(whenTxt(v))}</p><a class="btn pri" href="${esc(gcalUrl(r,v))}" target="_blank" rel="noopener" data-calx>הוספה ליומן Google</a><a class="btn" href="${icsData(r,v)}" download="fomo.ics" data-calx>יומן אחר (אייפון / Outlook)</a><button class="link-btn" type="button" data-calx>לא עכשיו</button></div>`;
  d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-calx]'))setTimeout(()=>d.remove(),150)});document.body.appendChild(d)}
function planSheet(id){const r=byId(id);if(!r)return;killFormMap();openId=null;mode='plan';openSheet();const ds=k=>{const x=new Date();x.setDate(x.getDate()+k);return x.toLocaleDateString('en-CA')};const th=(4-new Date().getDay()+7)%7;
  $('#sb').innerHTML=`<form id="planF" class="sec dh" data-id="${esc(id)}"><h2>קביעת יציאה</h2><p class="meta" style="margin-top:6px">${esc(r.name)}${r.city?' · '+esc(r.city):''}</p><div class="chips" style="margin-top:14px"><button type="button" class="chip" data-act="planD" data-d="${ds(0)}">הערב</button><button type="button" class="chip" data-act="planD" data-d="${ds(1)}">מחר</button>${th>1?`<button type="button" class="chip" data-act="planD" data-d="${ds(th)}">ביום חמישי</button>`:''}</div><div class="grid2" style="margin-top:12px"><label class="l">תאריך<input class="f" type="date" name="d" required min="${today()}" value="${today()}"></label><label class="l">שעה<input class="f" type="time" name="t" value="20:00"></label><label class="l full">סוג היציאה<select class="f" name="occ">${Object.entries(OCC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div>
<label class="surtog"><input type="checkbox" name="sur"><span><b>🤫 יציאת הפתעה</b><small>האחרים בקבוצה יראו רק תאריך, שעה ורמז. שם המקום ייחשף להם ביום עצמו.</small></span></label>
<div class="grid2 surf" hidden><label class="l">איך להתלבש<select class="f" name="dress">${DRESS.map(x=>`<option value="${esc(x)}">${x||'בלי הנחיה'}</option>`).join('')}</select></label><label class="l">רמז (לא חובה)<input class="f" name="hint" maxlength="60" placeholder="למשל: תביאו תיאבון לים 🌊"></label></div>
<div class="row" style="margin-top:16px"><button class="btn pri" type="submit">${ICON.cal}קובעים!</button><button class="btn" type="button" data-act="open" data-id="${esc(id)}">ביטול</button></div></form>`}
async function savePlan(fm){const id=fm.dataset.id,r=byId(id);if(!r)return;const d=fm.elements.d.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||d<today()){toast('בחרו תאריך מהיום והלאה');return}
  const v={d,t:fm.elements.t.value||'',cost:0,occ:OCC[fm.elements.occ.value]!==undefined?fm.elements.occ.value:'',note:''};if(!v.t)delete v.t;
  const sur=fm.elements.sur&&fm.elements.sur.checked;if(sur)v.surprise={by:myId,dress:fm.elements.dress.value||'',hint:fm.elements.hint.value.trim().slice(0,60)};
  const ok=await save(id,{visits:[...(r.visits||[]),v],updatedAt:Date.now()});if(!ok)return;if(sur)logAct('plan',null,`תכנן/ה יציאת הפתעה 🤫 ל${whenTxt(v)}`);else logAct('plan',id,`קבע/ה יציאה ל${r.name} ${whenTxt(v)}`);if(sur)toast('ההפתעה נשמרה 🤫 רק את/ה רואה את שם המקום');renderNotices();openId=id;mode='view';renderDetail();calPrompt(r,v)}

/* ================= games ================= */
const GAMES=[{k:'react',n:'מי מהיר יותר',e:'⚡',d:'מחכים לירוק ולוחצים ראשונים. הטוב מ-3.',max:2},{k:'ttt',n:'איקס עיגול',e:'⭕',d:'הקלאסיקה. תיקו? משחקים שוב.',max:2},{k:'rps',n:'אבן נייר ומספריים',e:'✊',d:'כל אחד בוחר בסתר. הטוב מ-3.',max:2},{k:'dice',n:'קוביות',e:'🎲',d:'כל אחד מטיל 2 קוביות. הגבוה מנצח.',max:4},{k:'wheel',n:'גלגל המזל',e:'🎡',d:'מסובבים, והגלגל מחליט.',max:4}];
let gm=null;
function gameNames(){const ns=[myName||names[myId]||'אני',...members.filter(m=>m.user_id!==myId).map(m=>names[m.user_id]).filter(Boolean)];return ns}
function gameSheet(){clearInterval(pickTimer);killFormMap();openId=null;mode='game';openSheet();const ns=gameNames();
  if(!gm||gm.stage!=='setup')gm={stage:'setup',how:(gm&&gm.how)||'winner',players:[{name:ns[0]||'שחקן 1',place:''},{name:ns[1]||'שחקן 2',place:''}],game:'react'};renderGameSetup()}
function gamePlaces(){return rows.filter(r=>r.status!=='been'||r.fav||avg(r)>=4).sort((a,b)=>a.name.localeCompare(b.name,'he'))}
function renderGameSetup(err){const P=gm.players,places=gamePlaces(),pre=gm.how==='pre';
  const opts=sel=>`<option value="">בחרו מקום…</option>${places.map(r=>`<option value="${esc(r.id)}" ${sel===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}`;
  $('#sb').innerHTML=`<div class="sec dh gset"><h2>${ICON.game}משחק: מי בוחר?</h2><p class="meta" style="margin-top:6px">משחקים על הטלפון הזה, ומי שמנצח קובע לאן הולכים.</p>
<div class="seg" role="group" aria-label="איך מחליטים" style="margin-top:14px"><button type="button" data-act="gHow" data-v="winner" aria-pressed="${!pre}">המנצח בוחר לאן</button><button type="button" data-act="gHow" data-v="pre" aria-pressed="${pre}">כל אחד בוחר מקום מראש</button></div>
<div class="gpl">${P.map((p,i)=>`<div class="gp"><span class="gp-n">${i+1}</span><input class="f" data-gp="${i}" maxlength="20" value="${esc(p.name)}" aria-label="שם שחקן ${i+1}">${pre?`<select class="f" data-gpp="${i}" aria-label="המקום של ${esc(p.name)}">${opts(p.place)}</select>`:''}${P.length>2?`<button type="button" class="del" data-act="gRm" data-i="${i}" aria-label="הסרת שחקן">×</button>`:''}</div>`).join('')}</div>
${P.length<4?'<button type="button" class="link-btn" data-act="gAdd">+ עוד שחקן</button>':''}
${pre&&places.length<P.length?'<p class="note">צריך לפחות מקום אחד בקבוצה לכל שחקן.</p>':''}
<h4 style="margin-top:18px">בוחרים משחק</h4><div class="gcards">${GAMES.map(g=>{const dis=P.length>g.max;return `<button type="button" class="gcard" data-act="gPick" data-k="${g.k}" aria-pressed="${gm.game===g.k}" ${dis?'disabled':''}><span class="ge">${g.e}</span><b>${g.n}</b><small>${dis?'עד 2 שחקנים':g.d}</small></button>`}).join('')}</div>
<p class="note gerr" aria-live="polite">${err?esc(err):''}</p><div class="row" style="margin-top:8px"><button class="btn pri" type="button" data-act="gStart">יאללה, משחקים!</button></div></div>`}
function readGameSetup(){for(const el of document.querySelectorAll('[data-gp]'))gm.players[+el.dataset.gp].name=el.value.trim().slice(0,20);for(const el of document.querySelectorAll('[data-gpp]'))gm.players[+el.dataset.gpp].place=el.value}
function gameStart(){readGameSetup();const P=gm.players;
  if(P.some(p=>!p.name))return renderGameSetup('תנו שם לכל שחקן');
  if(new Set(P.map(p=>p.name)).size<P.length)return renderGameSetup('לכל שחקן צריך שם אחר');
  if(gm.how==='pre'){if(P.some(p=>!p.place))return renderGameSetup('כל שחקן צריך לבחור מקום');if(new Set(P.map(p=>p.place)).size<P.length)return renderGameSetup('כל אחד צריך לבחור מקום אחר. אי אפשר לבחור את אותו מקום.')}
  const g=GAMES.find(x=>x.k===gm.game);if(!g||P.length>g.max)return renderGameSetup('המשחק הזה מתאים ל-2 שחקנים בלבד');
  gm.stage='play';gm.s={};({react:reactStart,ttt:tttStart,rps:rpsStart,dice:diceStart,wheel:wheelStart})[gm.game]()}
const gHead=t=>`<div class="ghead"><button type="button" class="link-btn" data-act="gBack">← הגדרות</button><b>${t}</b></div>`;
const pName=i=>esc(gm.players[i].name);
/* reaction */
function reactStart(){gm.s={score:[0,0],round:1,state:'idle'};reactRender()}
function reactRender(msg){const s=gm.s;$('#sb').innerHTML=`<div class="game">${gHead('⚡ מי מהיר יותר · סיבוב '+s.round)}<p class="gsc">${pName(0)} <b>${s.score[0]}</b> : <b>${s.score[1]}</b> ${pName(1)}</p><div class="rx rx-${s.state}">${[0,1].map(i=>`<button type="button" class="rxp" data-act="rxTap" data-i="${i}"><span>${pName(i)}</span><small>${s.state==='go'?'לחץ!':s.state==='wait'?'חכו…':'לוחצים כאן'}</small></button>`).join('')}</div><p class="gmsg" aria-live="assertive">${msg||(s.state==='idle'?'שימו אצבע כל אחד על הצד שלו. כשהמסך יהיה ירוק, לוחצים!':s.state==='wait'?'חכו לירוק… מי שלוחץ מוקדם מפסיד את הסיבוב':'עכשיו!')}</p>${s.state==='idle'?'<button class="btn pri" type="button" data-act="rxGo">מתחילים סיבוב</button>':''}</div>`}
function reactGo(){const s=gm.s;s.state='wait';reactRender();clearTimeout(s.t);s.t=setTimeout(()=>{if(gm&&gm.s===s&&s.state==='wait'){s.state='go';s.at=performance.now();reactRender();if(navigator.vibrate)navigator.vibrate(60)}},1500+Math.random()*3000)}
function reactTap(i){const s=gm.s;if(s.state==='idle'||s.state==='done')return;let w,msg;
  if(s.state==='wait'){clearTimeout(s.t);w=1-i;msg=`${gm.players[i].name} לחץ/ה מוקדם מדי! הנקודה ל${gm.players[w].name}`}else{w=i;msg=`${gm.players[i].name} מהיר/ה יותר! (${Math.round(performance.now()-s.at)} מ״ש)`}
  s.score[w]++;s.state='done';if(s.score[w]>=2){reactRender(msg);setTimeout(()=>gameWin(w),1200);return}s.round++;s.state='idle';reactRender(msg)}
/* tic tac toe */
function tttStart(){gm.s={b:Array(9).fill(''),turn:Math.random()<.5?0:1,games:1};tttRender()}
const TTTL=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function tttRender(msg){const s=gm.s,M=['✕','◯'];$('#sb').innerHTML=`<div class="game">${gHead('⭕ איקס עיגול')}<p class="gsc">${pName(0)} = ✕ · ${pName(1)} = ◯</p><p class="gmsg" aria-live="polite">${msg||`תור של <b>${pName(s.turn)}</b> (${M[s.turn]})`}</p><div class="ttt">${s.b.map((c,i)=>`<button type="button" data-act="tttMv" data-i="${i}" ${c?'disabled':''} aria-label="משבצת ${i+1}">${c}</button>`).join('')}</div></div>`}
function tttMove(i){const s=gm.s;if(s.b[i]||s.over)return;const M=['✕','◯'];s.b[i]=M[s.turn];
  const won=TTTL.some(l=>l.every(k=>s.b[k]===M[s.turn]));if(won){s.over=true;tttRender(`${gm.players[s.turn].name} ניצח/ה!`);const w=s.turn;setTimeout(()=>gameWin(w),1100);return}
  if(s.b.every(Boolean)){s.over=true;tttRender('תיקו! עוד משחק…');setTimeout(()=>{if(gm&&gm.game==='ttt'){gm.s={b:Array(9).fill(''),turn:1-s.turn};tttRender()}},1400);return}
  s.turn=1-s.turn;tttRender()}
/* rock paper scissors */
const RPS=[['rock','✊','אבן'],['paper','✋','נייר'],['scissors','✌️','מספריים']];
function rpsStart(){gm.s={score:[0,0],turn:0,ch:[null,null],round:1};rpsRender()}
function rpsRender(msg){const s=gm.s;$('#sb').innerHTML=`<div class="game">${gHead('✊ אבן נייר ומספריים · סיבוב '+s.round)}<p class="gsc">${pName(0)} <b>${s.score[0]}</b> : <b>${s.score[1]}</b> ${pName(1)}</p>
${s.reveal?`<div class="rps-rev"><div><span>${RPS.find(x=>x[0]===s.ch[0])[1]}</span><small>${pName(0)}</small></div><b>מול</b><div><span>${RPS.find(x=>x[0]===s.ch[1])[1]}</span><small>${pName(1)}</small></div></div><p class="gmsg" aria-live="polite">${msg||''}</p>${s.end?'':'<button class="btn pri" type="button" data-act="rpsNext">סיבוב הבא</button>'}`
:s.pass?`<p class="gmsg">${pName(0)} בחר/ה. עכשיו מעבירים את הטלפון ל<b>${pName(1)}</b> בלי להציץ!</p><button class="btn pri" type="button" data-act="rpsReady">אני ${pName(1)}, מוכן/ה</button>`
:`<p class="gmsg">תור של <b>${pName(s.turn)}</b>. בחר/י בסתר:</p><div class="rps">${RPS.map(x=>`<button type="button" data-act="rpsPick" data-v="${x[0]}"><span>${x[1]}</span><small>${x[2]}</small></button>`).join('')}</div>`}</div>`}
function rpsPick(v){const s=gm.s;s.ch[s.turn]=v;if(s.turn===0){s.turn=1;s.pass=true;rpsRender();return}
  const a=s.ch[0],b=s.ch[1],beats={rock:'scissors',paper:'rock',scissors:'paper'};s.reveal=true;let msg;
  if(a===b)msg='תיקו! עוד סיבוב';else{const w=beats[a]===b?0:1;s.score[w]++;msg=`הנקודה ל${gm.players[w].name}`;if(s.score[w]>=2){s.end=true;rpsRender(msg);setTimeout(()=>gameWin(w),1300);return}}rpsRender(msg)}
/* dice */
function diceStart(){gm.s={rolls:gm.players.map(()=>null),turn:0,alive:gm.players.map((_,i)=>i)};diceRender()}
const DF=['⚀','⚁','⚂','⚃','⚄','⚅'];
function diceRender(msg){const s=gm.s;$('#sb').innerHTML=`<div class="game">${gHead('🎲 קוביות')}<div class="dice-l">${gm.players.map((p,i)=>`<div class="dl ${s.alive.includes(i)?'':'out'} ${s.turn===i&&!s.done?'now':''}"><b>${esc(p.name)}</b><span class="dd" id="dd${i}">${s.rolls[i]?s.rolls[i].map(n=>DF[n-1]).join(' '):'– –'}</span><small>${s.rolls[i]?s.rolls[i][0]+s.rolls[i][1]:''}</small></div>`).join('')}</div><p class="gmsg" aria-live="polite">${msg||(s.done?'':`תור של <b>${pName(s.turn)}</b>`)}</p>${s.done?'':'<button class="btn pri big" type="button" data-act="diceRoll">🎲 מטילים!</button>'}</div>`}
function diceRoll(){const s=gm.s;if(s.rolling||s.done)return;s.rolling=true;const i=s.turn;let n=0;const el=()=>$('#dd'+i);
  const iv=setInterval(()=>{const e=el();if(e)e.textContent=DF[Math.random()*6|0]+' '+DF[Math.random()*6|0];if(++n>10){clearInterval(iv);s.rolling=false;s.rolls[i]=[1+(Math.random()*6|0),1+(Math.random()*6|0)];
    const next=s.alive.find(k=>s.rolls[k]===null);if(next!==undefined){s.turn=next;diceRender();return}
    const sum=k=>s.rolls[k][0]+s.rolls[k][1],best=Math.max(...s.alive.map(sum)),top=s.alive.filter(k=>sum(k)===best);
    if(top.length===1){s.done=true;diceRender(`${gm.players[top[0]].name} ניצח/ה עם ${best}!`);setTimeout(()=>gameWin(top[0]),1300);return}
    s.alive=top;for(const k of top)s.rolls[k]=null;s.turn=top[0];diceRender(`תיקו בין ${top.map(k=>gm.players[k].name).join(' ו')}! מטילים שוב`)}},70)}
/* wheel */
const WC=['#FF5E4D','#FFB347','#FF7AA2','#7C5CFF'];
function wheelStart(){const P=gm.players,n=P.length,seg=360/n;gm.s={rot:0};
  const grad=P.map((_,i)=>`${WC[i%4]} ${i*seg}deg ${(i+1)*seg}deg`).join(',');
  $('#sb').innerHTML=`<div class="game">${gHead('🎡 גלגל המזל')}<div class="wheel-w"><div class="wheel-ptr">▼</div><div class="wheel" id="wheel" style="background:conic-gradient(${grad})">${P.map((p,i)=>`<span style="transform:rotate(${i*seg+seg/2}deg) translateY(-34%)"><b style="transform:rotate(${-(i*seg+seg/2)}deg)">${esc(p.name)}</b></span>`).join('')}</div></div><p class="gmsg" aria-live="polite"></p><button class="btn pri big" type="button" data-act="wheelSpin">מסובבים!</button></div>`}
function wheelSpin(b){const s=gm.s;if(s.spun)return;s.spun=true;if(b)b.disabled=true;const n=gm.players.length,w=Math.random()*n|0,seg=360/n;
  const target=360*6+(360-(w*seg+seg/2))+(Math.random()-.5)*seg*.6;const el=$('#wheel');el.style.transition='transform 4.2s cubic-bezier(.17,.67,.12,1)';requestAnimationFrame(()=>el.style.transform=`rotate(${target}deg)`);
  setTimeout(()=>{const m=$('.gmsg');if(m)m.textContent=`${gm.players[w].name}!`;setTimeout(()=>gameWin(w),900)},4400)}
/* result */
function gameWin(w){if(!gm||mode!=='game')return;gm.stage='win';gm.w=w;const p=gm.players[w];confetti(120);if(navigator.vibrate)navigator.vibrate([60,40,120]);
  const g=GAMES.find(x=>x.k===gm.game);
  if(gm.how==='pre'){const r=byId(p.place);logAct('game',r?r.id:null,`${p.name} ניצח/ה ב${g.n}${r?' והולכים ל'+r.name:''}`);return gameResult(r)}
  logAct('game',null,`${p.name} ניצח/ה ב${g.n} ובוחר/ת לאן הולכים`);
  const places=gamePlaces();
  $('#sb').innerHTML=`<div class="game gwin"><div class="trophy">🏆</div><h2>${esc(p.name)} ניצח/ה!</h2><p class="meta">אז ${esc(p.name)} בוחר/ת לאן הולכים:</p><input class="f" id="gq" placeholder="חיפוש מקום…" style="margin-top:12px"><div class="gchoose" id="gch">${places.map(r=>`<button type="button" class="gco" data-act="gChoose" data-id="${esc(r.id)}" data-n="${esc(r.name.toLowerCase())}"><b>${esc(r.name)}</b><small>${esc([r.cuisine,r.city].filter(Boolean).join(' · '))}</small></button>`).join('')||'<p class="note">אין עדיין מקומות בקבוצה.</p>'}</div><div class="row" style="margin-top:12px"><button class="btn" type="button" data-act="gAgain">משחק חוזר</button></div></div>`}
function gameResult(r){const p=gm.players[gm.w];
  $('#sb').innerHTML=`<div class="pick gwin"><div class="trophy">🏆</div><p class="meta">${esc(p.name)} ניצח/ה, אז הולכים ל…</p><div class="nm">${esc(r?r.name:'—')}</div>${r?`<p class="meta">${esc([r.cuisine,r.city].filter(Boolean).join(' · '))}</p><div class="row"><button class="btn pri" type="button" data-act="planNew" data-id="${esc(r.id)}">${ICON.cal}קביעת יציאה + יומן</button><a class="btn" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}Waze</a><button class="btn" type="button" data-act="open" data-id="${esc(r.id)}">פרטים</button></div>`:''}<button class="link-btn" type="button" data-act="gAgain">משחק חוזר</button></div>`}

/* ================= evenings with friends & routes ================= */
let events=[],openEv=null,evDraft=null;
async function loadEvents(){if(!cur)return;const lid=cur.id;try{const {data,error}=await sb.from('events').select('*').eq('list_id',lid).gte('d',today()).order('d');if(error)throw error;if(cur&&cur.id===lid){events=data||[];lsSet('rs-ev-'+lid,events);renderNotices();if(mode==='event')renderEvent()}}catch{if(cur&&cur.id===lid&&!events.length){events=lsGet('rs-ev-'+lid,[]).filter(e=>e.d>=today());renderNotices()}}}
const evStops=e=>(e.stops||[]).map(byId).filter(Boolean);
function evR(e){const s=evStops(e)[0]||{};return {...s,id:e.id,name:e.title||s.name||'ערב עם חברים'}}
const mHav=(a,b,c,d)=>{const R=6371e3,t=Math.PI/180,x=Math.sin((c-a)*t/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin((d-b)*t/2)**2;return 2*R*Math.asin(Math.sqrt(x))};
const ptOf=r=>hasLL(r)?`${r.lat},${r.lng}`:qText(r);
function routeUrl(st){if(!st.length)return '';const last=st[st.length-1],mid=st.slice(0,-1);return 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination='+encodeURIComponent(ptOf(last))+(mid.length?'&waypoints='+encodeURIComponent(mid.map(ptOf).join('|')):'')}
function evNewSheet(rid){killFormMap();openId=null;mode='evnew';openSheet();const ds=k=>{const x=new Date();x.setDate(x.getDate()+k);return x.toLocaleDateString('en-CA')};const th=(4-new Date().getDay()+7)%7;
  evDraft={stops:rid?[rid]:[]};
  $('#sb').innerHTML=`<form id="evF" class="sec dh"><h2>${ICON.users}ערב עם חברים</h2><p class="meta" style="margin-top:6px">מקום אחד, או מסלול של כמה תחנות (בר, מסעדה, קינוח…). החברים עונים אם הם מגיעים.</p>
<label class="l" style="margin-top:14px">שם הערב<input class="f" name="title" maxlength="60" value="ערב עם חברים" required></label>
<div class="chips" style="margin-top:12px"><button type="button" class="chip" data-act="evD" data-d="${ds(0)}">הערב</button><button type="button" class="chip" data-act="evD" data-d="${ds(1)}">מחר</button>${th>1?`<button type="button" class="chip" data-act="evD" data-d="${ds(th)}">ביום חמישי</button>`:''}</div>
<div class="grid2" style="margin-top:10px"><label class="l">תאריך<input class="f" type="date" name="d" required min="${today()}" value="${today()}"></label><label class="l">שעה<input class="f" type="time" name="t" value="20:00"></label></div>
<h4 style="margin-top:16px">התחנות</h4>${dietSummary(members.map(m=>m.user_id)).length?`<p class="note">🥗 ${esc(dietSummary(members.map(m=>m.user_id)).join(' · '))}</p>`:''}<div id="evStops"></div>
<div class="addrow"><select class="f" id="evAdd" aria-label="הוספת תחנה"><option value="">+ הוספת תחנה…</option>${[...rows].sort((a,b)=>a.name.localeCompare(b.name,'he')).map(r=>`<option value="${esc(r.id)}">${esc(r.name)}${r.city?' · '+esc(r.city):''}</option>`).join('')}</select></div>
<label class="l" style="margin-top:12px">הערה לחברים (לא חובה)<input class="f" name="note" maxlength="140" placeholder="למשל: מי שמגיע ראשון תופס שולחן"></label>
<p class="note gerr" id="evErr" aria-live="polite"></p><div class="row" style="margin-top:8px"><button class="btn pri" type="submit">${ICON.cal}יצירת הערב</button></div></form>`;evStopsRender()}
function evStopsRender(){const el=$('#evStops');if(!el||!evDraft)return;const S=evDraft.stops.map(byId).filter(Boolean);
  el.innerHTML=S.length?`<ol class="evs">${S.map((r,i)=>{const nx=S[i+1];const leg=nx&&hasLL(r)&&hasLL(nx)?mHav(r.lat,r.lng,nx.lat,nx.lng):null;return `<li><span class="evn">${i+1}</span><span class="evt"><b>${esc(r.name)}</b><small>${esc([r.cuisine,r.city].filter(Boolean).join(' · '))}</small></span><span class="evb"><button type="button" class="del" data-act="evUp" data-i="${i}" ${i?'':'disabled'} aria-label="למעלה">↑</button><button type="button" class="del" data-act="evRm" data-i="${i}" aria-label="הסרה">×</button></span>${leg!=null?`<span class="evleg">${leg*1.3<4000?'🚶':'🚕'} ${legTxt(leg)}</span>`:''}</li>`}).join('')}</ol>`:'<p class="note">בחרו לפחות תחנה אחת.</p>'}
const legTxt=m=>{const w=m*1.3;return w<1500?`${Math.max(1,Math.round(w/80))} דק׳ הליכה`:w<4000?`${(w/1000).toFixed(1)} ק״מ הליכה`:`${(w/1000).toFixed(w<20000?1:0)} ק״מ (כדאי מונית)`};
async function saveEvent(fm){const S=evDraft?evDraft.stops:[];const err=t=>{$('#evErr').textContent=t};if(!S.length)return err('בחרו לפחות תחנה אחת');if(S.length>5)return err('עד 5 תחנות');
  const d=fm.elements.d.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||d<today())return err('בחרו תאריך מהיום והלאה');
  const row={list_id:cur.id,title:fm.elements.title.value.trim().slice(0,60)||'ערב עם חברים',stops:S,d,t:fm.elements.t.value||null,note:fm.elements.note.value.trim().slice(0,140),rsvp:{[myId]:'yes'}};
  const btn=fm.querySelector('[type=submit]');btn.disabled=true;const {data,error}=await sb.from('events').insert(row).select().single();btn.disabled=false;if(error){err(errMsg(error));return}
  events.push(data);events.sort((a,b)=>a.d.localeCompare(b.d));renderNotices();logAct('event',S[0],`קבע/ה ${S.length>1?'מסלול':'ערב'}: ${data.title} · ${whenTxt({d:data.d,t:data.t||''})}`);
  evSheet(data.id);calPrompt(evR(data),{d:data.d,t:data.t||''})}
function evSheet(id){killFormMap();openId=null;mode='event';openEv=id;openSheet();renderEvent()}
let evMap=null;
function renderEvent(){const e=events.find(x=>x.id===openEv);if(mode!=='event')return;if(!e){$('#sb').innerHTML='<div class="sec dh"><h2>הערב הזה נמחק או עבר</h2></div>';return}
  const ae=document.activeElement;if(ae&&$('#sb').contains(ae)&&/INPUT|TEXTAREA/.test(ae.tagName))return;
  const S=evStops(e),rs=e.rsvp||{},mine=rs[myId],grp=k=>Object.entries(rs).filter(([,v])=>v===k).map(([u])=>nm(u));
  const pending=members.map(m=>m.user_id).filter(u=>!rs[u]).map(nm),canDel=e.created_by===myId||isOwner(),v={d:e.d,t:e.t||''},R=evR(e);
  if(evMap){evMap.remove();evMap=null}
  $('#sb').innerHTML=`<div class="sec dh"><p class="meta">${S.length>1?`מסלול של ${S.length} תחנות`:'ערב עם חברים'} · ${esc(nm(e.created_by))} יצר/ה</p><h2 style="margin-top:6px">${esc(e.title)}</h2><p class="evwhen">${ICON.cal}${esc(whenTxt(v))}</p>${e.note?`<p class="meta">${esc(e.note)}</p>`:''}
<div class="rsvp" role="group" aria-label="מגיעים?">${[['yes','מגיע/ה 🙌'],['maybe','אולי 🤔'],['no','לא הפעם']].map(([k,t])=>`<button type="button" data-act="rsvp" data-v="${k}" aria-pressed="${mine===k}">${t}<small>${grp(k).length}</small></button>`).join('')}</div>
<div class="rsvp-l">${grp('yes').length?`<p><b>מגיעים:</b> ${esc(grp('yes').join(', '))}</p>`:''}${grp('maybe').length?`<p><b>אולי:</b> ${esc(grp('maybe').join(', '))}</p>`:''}${grp('no').length?`<p><b>לא מגיעים:</b> ${esc(grp('no').join(', '))}</p>`:''}${pending.length?`<p class="meta">עוד לא ענו: ${esc(pending.join(', '))}</p>`:''}</div></div>
<div class="sec"><h4>${S.length>1?'המסלול':'המקום'}</h4><ol class="evs">${S.map((r,i)=>{const nx=S[i+1];const leg=nx&&hasLL(r)&&hasLL(nx)?mHav(r.lat,r.lng,nx.lat,nx.lng):null;return `<li data-open-r="${esc(r.id)}" tabindex="0"><span class="evn">${i+1}</span><span class="evt"><b>${esc(r.name)}</b><small>${esc([r.cuisine,r.address,r.city].filter(Boolean).join(' · '))}</small>${(()=>{const yes=Object.entries(rs).filter(([,v])=>v==='yes').map(([u])=>u),m=missFor(r,yes);return m.length?`<small class="dwarn">⚠️ לא מסומן כמתאים ל${esc(m.map(nm).join(', '))}</small>`:''})()}</span><a class="btn sm" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener" aria-label="ניווט ל${esc(r.name)}">${ICON.nav}</a>${leg!=null?`<span class="evleg">${leg*1.3<4000?'🚶':'🚕'} ${legTxt(leg)}</span>`:''}</li>`}).join('')}</ol>
${S.some(hasLL)?'<div class="mini" id="evmap"></div>':''}
<div class="row" style="margin-top:12px">${S.length>1?`<a class="btn pri" href="${esc(routeUrl(S))}" target="_blank" rel="noopener">${ICON.pin}המסלול בגוגל מפות</a>`:''}<button class="btn ${S.length>1?'':'pri'}" type="button" data-act="evShare">${ICON.share}הזמנת חברים</button><a class="btn" href="${esc(gcalUrl(R,v))}" target="_blank" rel="noopener">${ICON.cal}יומן Google</a><a class="btn" href="${icsData(R,v)}" download="fomo.ics">יומן אחר</a></div>
<p class="note">חברים שעוד לא בקבוצה מצטרפים אליה דרך הקישור, ואז יכולים לענות.</p>${canDel?'<button class="link-btn" type="button" data-act="evDel" style="color:var(--bad)">מחיקת הערב</button>':''}</div>`;
  const pts=S.filter(hasLL);if(pts.length&&!window.L)loadLeaflet().then(()=>{if(mode==='event')renderEvent()}).catch(()=>{});if(pts.length&&window.L){setTimeout(()=>{if(!$('#evmap'))return;evMap=L.map('evmap',{zoomControl:false});L.tileLayer(TILE,{maxZoom:19,attribution:ATTR}).addTo(evMap);
    const ll=pts.map(r=>[r.lat,r.lng]);pts.forEach(r=>L.marker([r.lat,r.lng],{icon:L.divIcon({className:'pin-wrap',html:`<div class="evpin">${S.indexOf(r)+1}</div>`,iconSize:[28,28],iconAnchor:[14,14]})}).addTo(evMap));
    if(ll.length>1){L.polyline(ll,{color:'#FF5E4D',weight:4,dashArray:'6 8'}).addTo(evMap);evMap.fitBounds(ll,{padding:[30,30]})}else evMap.setView(ll[0],16)},60)}}
async function evRsvp(ans){const e=events.find(x=>x.id===openEv);if(!e)return;const prev=(e.rsvp||{})[myId];e.rsvp={...(e.rsvp||{}),[myId]:ans};renderEvent();renderNotices();
  const {error}=await sb.rpc('rsvp_event',{eid:e.id,ans});if(error){toast(errMsg(error));return}
  if(prev!==ans)logAct('rsvp',(e.stops||[])[0]||null,`${ans==='yes'?'מגיע/ה':ans==='maybe'?'אולי מגיע/ה':'לא מגיע/ה'} ל${e.title}`)}
async function evShareFn(){const e=events.find(x=>x.id===openEv);if(!e)return;const S=evStops(e);const url=inviteUrl()+(inviteUrl().includes('?')?'&':'?')+'ev='+e.id;
  const text=`${e.title} · ${whenTxt({d:e.d,t:e.t||''})}\n${S.map((r,i)=>(S.length>1?(i+1)+'. ':'📍 ')+r.name).join('\n')}\n\nמגיעים? עונים כאן 👇\n${url}`;
  if(navigator.share){try{await navigator.share({title:e.title,text});return}catch(x){if(x&&x.name==='AbortError')return}}
  location.href='https://wa.me/?text='+encodeURIComponent(text)}
async function evDelete(){const e=events.find(x=>x.id===openEv);if(!e)return;const {error}=await sb.from('events').delete().eq('id',e.id);if(error){toast(errMsg(error));return}events=events.filter(x=>x.id!==e.id);renderNotices();closeSheet();toast('הערב נמחק')}

function confirmDel(b){if(b.dataset.sure)return true;b.dataset.sure='1';const t=b.textContent;b.textContent='בטוח? לחצו שוב למחיקה';setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent=t}},4000);return false}
/* ================= push notifications ================= */
const VAPID=(window.APP_CONFIG||{}).vapidPublic||'';
const pushOK=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&!!VAPID;
function b64u(s){const b=atob((s+'='.repeat((4-s.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))}
async function pushSub(){try{const reg=await navigator.serviceWorker.ready;return await reg.pushManager.getSubscription()}catch{return null}}
async function pushState(){if(!pushOK())return isIOS()&&!isStandalone()?'ios':'na';if(Notification.permission==='denied')return 'denied';return (await pushSub())?'on':'off'}
async function pushSave(s){const j=s.toJSON();const {error}=await sb.from('push_subs').upsert({endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,user_id:myId});return error}
async function pushOn(){if(isIOS()&&!isStandalone()){toast('באייפון: קודם מוסיפים את Fomo למסך הבית, ומפעילים התראות מתוך האפליקציה שם');return false}if(!pushOK()){toast('המכשיר הזה לא תומך בהתראות');return false}
  const perm=await Notification.requestPermission();lsSet('rs-push-asked',1);if(perm!=='granted'){toast('ההתראות לא אושרו. אפשר לשנות בהגדרות הטלפון.');renderNotices();return false}
  try{const reg=await navigator.serviceWorker.ready;let s=await reg.pushManager.getSubscription();if(!s)s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID)});const er=await pushSave(s);if(er){toast(errMsg(er));return false}}catch(e){toast('לא הצלחנו להפעיל התראות: '+(e.message||e));return false}
  toast('ההתראות הופעלו 🔔');fxPushOn=null;renderNotices();setDots();return true}
async function pushOff(){const s=await pushSub();if(s){await sb.from('push_subs').delete().eq('endpoint',s.endpoint);try{await s.unsubscribe()}catch{}}toast('ההתראות כובו')}
async function pushSync(){if(!pushOK()||Notification.permission!=='granted')return;const s=await pushSub();if(s)pushSave(s)}
let pushAsk=false;
async function pushMaybeAsk(){if(lsGet('rs-push-asked',0))return;const st=await pushState();pushAsk=st==='off'||st==='ios';renderNotices()}
async function fillPushSec(){const el=$('#pushSec');if(!el)return;const st=await pushState();
  el.innerHTML=st==='on'?'<p class="note" style="margin:0 0 10px">ההתראות פעילות במכשיר הזה 🔔</p><div class="row"><button class="btn pri" type="button" data-act="pushTest">שליחת התראת בדיקה</button><button class="btn" type="button" data-act="pushOff">כיבוי התראות במכשיר הזה</button></div>'
  :st==='denied'?'<p class="note" style="margin:0">ההתראות חסומות. כדי להפעיל: הגדרות הטלפון ← Fomo (או הדפדפן) ← התראות.</p>'
  :st==='ios'?'<p class="note" style="margin:0">באייפון התראות עובדות רק מהאפליקציה שבמסך הבית. מוסיפים את Fomo למסך הבית (למטה), פותחים משם ומפעילים כאן.</p>'
  :st==='na'?'<p class="note" style="margin:0">המכשיר או הדפדפן הזה לא תומך בהתראות.</p>'
  :'<p class="note" style="margin:0 0 10px">קבלו התראה כשמישהו מוסיף מקום, מצביע, קובע ערב או מנצח במשחק, ותזכורת בבוקר של יום היציאה.</p><button class="btn pri" type="button" data-act="pushOn">🔔 הפעלת התראות</button>'}

/* ================= auto check-in ================= */
let ciBusy=false;
async function autoCheckin(){if(ciBusy||lsGet('rs-checkin','on')==='off'||!navigator.geolocation||!rows.length||$('#cip'))return;
  try{const p=await navigator.permissions.query({name:'geolocation'});if(p.state!=='granted')return}catch{return}
  ciBusy=true;navigator.geolocation.getCurrentPosition(pos=>{ciBusy=false;const {latitude:la,longitude:lo,accuracy}=pos.coords;myLoc={lat:la,lng:lo,at:Date.now()};if(accuracy>200)return;
    const key='rs-ci-'+today(),done=lsGet(key,[]);let best=null,bd=1e9;
    for(const r of rows){if(!hasLL(r)||done.includes(r.id)||visitsOf(r).some(v=>v.d===today()))continue;const d=mHav(la,lo,r.lat,r.lng);if(d<bd){bd=d;best=r}}
    if(best&&bd<=Math.max(90,Math.min(accuracy,150))){done.push(best.id);lsSet(key,done);ciPrompt(best)}},()=>{ciBusy=false},{enableHighAccuracy:true,timeout:12000,maximumAge:60000})}
function ciPrompt(r){const d=document.createElement('div');d.id='cip';d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label','צ׳ק־אין');
  d.innerHTML=`<div class="calp-in"><div class="calp-ic">${ICON.pin}</div><h3>אתם ב${esc(r.name)}?</h3><p class="meta">לרשום ביקור של היום? אחר כך אפשר להוסיף סכום, תמונות ודירוג.</p><button class="btn pri" type="button" data-ci="yes">כן, רשמו ביקור ✓</button><button class="link-btn" type="button" data-ci="no">לא עכשיו</button></div>`;
  d.addEventListener('click',async e=>{const b=e.target.closest('[data-ci]');if(!b&&e.target!==d)return;d.remove();if(!b||b.dataset.ci!=='yes')return;const cr=byId(r.id);if(!cr)return;
    const ok=await save(cr.id,{visits:[...(cr.visits||[]),{d:today(),cost:0,occ:'',note:''}],status:'been',updatedAt:Date.now()});if(ok){logAct('visit',cr.id,`עשה/תה צ׳ק־אין ב${cr.name}`);toast('הביקור נרשם 📍');openDetail(cr.id)}});
  document.body.appendChild(d)}

/* ================= table booking ================= */
const BOOKRX=/ontopo|tabit|restoya|resy|opentable|thefork|eatapp|sevenrooms|book|reserv|הזמנ/i;
const bookUrl=r=>{const s=safeUrl(r.site);return s&&BOOKRX.test(s)?s:'https://www.google.com/search?q='+encodeURIComponent([r.name,r.city,'הזמנת שולחן אונטופו OR טאביט'].filter(Boolean).join(' '))};

/* ================= public read-only list ================= */
const pubUrl=t=>location.origin+location.pathname+'?pub='+encodeURIComponent(t);
function pubSecHtml(){if(!isOwner())return '';const on=!!cur.pub_token,m=cur.pub_mode||'fav';
  return `<div class="sec"><h4>דף ציבורי לשיתוף</h4><p class="note" style="margin:0 0 10px">קישור לצפייה בלבד שאפשר לשלוח לכל אחד, בלי הרשמה. רואים שם, סוג, עיר, דירוג ממוצע, תמונה ומה להזמין. לא רואים הוצאות, הערות, תגובות או מי דירג מה.</p>
<div class="seg" role="group" aria-label="מה לשתף">${[['fav','המועדפים (4★ ומעלה)'],['been','כל מה שהיינו'],['all','כל המקומות']].map(([k,t])=>`<button type="button" data-act="pubMode" data-m="${k}" aria-pressed="${m===k}">${t}</button>`).join('')}</div>
<div class="row" style="margin-top:10px">${on?`<button class="btn pri" type="button" data-act="pubShare">${ICON.share}שליחת הקישור</button><button class="btn" type="button" data-act="pubCopy">${ICON.copy}העתקה</button><a class="btn" href="${esc(pubUrl(cur.pub_token))}" target="_blank" rel="noopener">תצוגה</a><button class="btn" type="button" data-act="pubOff" style="color:var(--bad)">ביטול השיתוף</button>`:'<button class="btn pri" type="button" data-act="pubOn">יצירת קישור ציבורי</button>'}</div>${on?`<p class="note" dir="ltr" style="word-break:break-all">${esc(pubUrl(cur.pub_token))}</p>`:''}</div>`}
async function pubSet(on,m){const {data,error}=await sb.rpc('set_public',{lid:cur.id,turn_on:on,m:m||cur.pub_mode||'fav'});if(error){toast(errMsg(error));return}cur.pub_token=data||null;if(m)cur.pub_mode=m;const l=lists.find(x=>x.id===cur.id);if(l){l.pub_token=cur.pub_token;l.pub_mode=cur.pub_mode}settingsSheet();if(on)toast('הקישור הציבורי מוכן');else toast('השיתוף בוטל. הקישור הישן כבר לא עובד.')}
async function renderPublic(tok){$('#gate').hidden=true;$('#app').hidden=true;document.title='Fomo · קבוצה משותפת';const box=document.createElement('main');box.id='pub';box.className='pub';document.body.appendChild(box);box.innerHTML='<p class="note" style="text-align:center;padding:40px">טוען…</p>';
  let data=null;try{const res=await sb.rpc('get_public',{tok});data=res.data}catch{}
  if(!data){box.innerHTML=`<div class="pub-empty"><div class="pub-brand">Fomo</div><p>הקישור הזה כבר לא פעיל.</p><a class="btn pri" href="./">ל־Fomo</a></div>`;return}
  const P=(data.places||[]).filter(p=>p.name).map(p=>({...p,lat:p.lat==null?null:+p.lat,lng:p.lng==null?null:+p.lng,llLevel:'place'}));
  box.innerHTML=`<header class="pub-h"><div class="pub-brand">Fomo</div><h1>${esc(data.name)}</h1><p>${{fav:'המקומות שהכי אהבנו',been:'כל המקומות שהיינו בהם',all:'כל המקומות שלנו'}[data.mode]||''} · ${P.length} מקומות</p></header>
${P.some(hasLL)?'<div class="pub-map" id="pubmap"></div>':''}<div class="pub-grid">${P.map(r=>`<article class="pub-c"><div class="pub-ph">${r.photo?`<img data-path="${esc(r.photo)}" alt="" loading="lazy">`:plate(r.name)}</div><div class="pub-b"><h3>${esc(r.name)}</h3><p class="meta">${esc([r.cuisine,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).join(' · '))}</p>${r.rating?`<p class="pub-r">★ ${esc(String(r.rating))}</p>`:''}${(r.dishes||[]).length?`<p class="meta">מה להזמין: ${esc(r.dishes.slice(0,3).join(', '))}</p>`:''}<div class="row"><a class="btn sm" href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">${ICON.pin}גוגל מפות</a><a class="btn sm" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}Waze</a></div></div></article>`).join('')||'<p class="note">אין עדיין מקומות לשיתוף.</p>'}</div>
<footer class="pub-f"><p>רוצים קבוצה כזו משלכם, עם מפה, הגרלות ומשחקים?</p><a class="btn pri" href="./">פתיחת Fomo בחינם</a></footer>`;
  if(P.some(hasLL)&&!window.L)await loadLeaflet().catch(()=>{});hydrate();const pts=P.filter(hasLL);if(pts.length&&window.L){const m=L.map('pubmap',{scrollWheelZoom:false});L.tileLayer(TILE,{maxZoom:19,attribution:ATTR}).addTo(m);pts.forEach(r=>L.marker([r.lat,r.lng],{icon:L.divIcon({className:'pin-wrap',html:'<div class="pin"></div>',iconSize:[26,26],iconAnchor:[13,26]})}).addTo(m).bindPopup(`<b>${esc(r.name)}</b>`));m.fitBounds(pts.map(r=>[r.lat,r.lng]),{padding:[30,30],maxZoom:15})}}

/* ================= list meta (special days, diets) — stored as a hidden row ================= */
let meta={id:null,special:[],diets:{},vouchers:[]};
function takeMeta(lid){const ms=rows.filter(r=>r._meta);if(ms.length){rows=rows.filter(r=>!r._meta);ms.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));const m=ms[0];meta={id:m.id,special:Array.isArray(m.special)?m.special:[],diets:m.diets&&typeof m.diets==='object'?m.diets:{},vouchers:Array.isArray(m.vouchers)?m.vouchers:[],tastes:m.tastes&&typeof m.tastes==='object'?m.tastes:{}};lsSet('rs-meta-'+lid,meta)}else if(!meta.id){meta={id:null,special:[],diets:{},...lsGet('rs-meta-'+lid,{})}}}
async function metaSave(patch){if(!cur)return false;const lid=cur.id;Object.assign(meta,patch);lsSet('rs-meta-'+lid,meta);
  try{if(!meta.id){const id=uuid();const {error}=await sb.from('restaurants').insert({id,list_id:lid,data:{_meta:true,createdAt:Date.now(),special:meta.special||[],diets:meta.diets||{},vouchers:meta.vouchers||[],tastes:meta.tastes||{}}});if(error)throw error;meta.id=id}
    else{const {error}=await sb.rpc('patch_restaurant',{rid:meta.id,patch});if(error)throw error}return true}catch(e){toast(errMsg(e));return false}}
/* ================= dietary preferences ================= */
const DIET=[['kosher','כשר','✡️'],['veg','צמחוני','🥦'],['vegan','טבעוני','🌱'],['gf','ללא גלוטן','🌾']];
const DIET_TAG={kosher:['כשר'],veg:['צמחוני-פרנדלי','טבעוני-פרנדלי'],vegan:['טבעוני-פרנדלי'],gf:['ללא גלוטן']};
const dietOf=u=>{const d=(meta.diets||{})[u];return d&&Array.isArray(d.k)?d:{k:[],al:''}};
const fitsUser=(r,u)=>dietOf(u).k.every(k=>(DIET_TAG[k]||[]).some(t=>(r.tags||[]).includes(t)));
const fitsAll=(r,us)=>us.every(u=>fitsUser(r,u));
const missFor=(r,us)=>us.filter(u=>!fitsUser(r,u));
const dietUsers=()=>members.map(m=>m.user_id).filter(u=>dietOf(u).k.length);
function dietSummary(us){const out=[];for(const u of us){const d=dietOf(u);if(d.k.length||d.al)out.push(`${nm(u)}: ${[...d.k.map(k=>(DIET.find(x=>x[0]===k)||[])[1]),d.al?'אלרגיה ל'+d.al:''].filter(Boolean).join(', ')}`)}return out}
function dietSecHtml(){const d=dietOf(myId);return `<form class="sec" id="dietF"><h4>ההעדפות שלי באוכל</h4><p class="note" style="margin:0 0 10px">ההגרלה וערב עם חברים יציגו רק מקומות שמתאימים לכל מי שמגיע. מקומות מסמנים בעריכת מקום, בתגיות.</p><div class="chips">${DIET.map(([k,t,e])=>`<label class="chip"><input type="checkbox" name="dk" value="${k}" ${d.k.includes(k)?'checked':''}><span>${e} ${t}</span></label>`).join('')}</div><label class="l" style="margin-top:10px">אלרגיות (לא חובה)<input class="f" name="al" maxlength="60" value="${esc(d.al||'')}" placeholder="למשל: אגוזים, שומשום"></label><div class="row" style="margin-top:10px"><button class="btn" type="submit">שמירת ההעדפות</button></div></form>`}
async function saveDiet(fm){const k=[...fm.querySelectorAll('[name=dk]:checked')].map(x=>x.value),al=fm.elements.al.value.trim().slice(0,60);const ok=await metaSave({diets:{...(meta.diets||{}),[myId]:{k,al}}});if(ok)toast('ההעדפות נשמרו')}

/* ================= "how was it yesterday?" ================= */
function pendingReviews(){const out=[];const dis=lsGet('rs-rev-dis',[]);const td=today();
  for(const r of rows)for(const v of visitsOf(r)){if(v.d>=td||daysTo(v.d)<-3)continue;const key=r.id+'|'+v.d;if(dis.includes(key))continue;
    const rated=!!(r.ratings||{})[myId],hasPh=(r.photos||[]).some(p=>p.path&&p.at&&new Date(p.at).toLocaleDateString('en-CA')>=v.d),hasD=(r.dishes||[]).length>0;
    if(!rated||(!hasPh&&!hasD))out.push({r,v,key,rated})}
  return out.sort((a,b)=>b.v.d.localeCompare(a.v.d)).slice(0,1)}
const agoTxt=d=>{const n=-daysTo(d);return n===1?'אתמול':n===2?'שלשום':`לפני ${n} ימים`};

/* ================= special days ================= */
const SPK={anniv:['יום נישואים','💍'],bday:['יום הולדת','🎂'],date:['יום שהכרנו','❤️'],other:['יום מיוחד','✨']};
const special=()=>(meta.special||[]).filter(x=>x&&/^\d{2}-\d{2}$/.test(x.md||''));
function nextOcc(md){const y=new Date().getFullYear();let d=`${y}-${md}`;if(d<today())d=`${y+1}-${md}`;return d}
function upcomingSpecial(){return special().map(x=>({...x,next:nextOcc(x.md)})).filter(x=>daysTo(x.next)<=14).sort((a,b)=>a.next.localeCompare(b.next))}
function specialPick(x,skip){const pool=rows.filter(r=>!skip||!skip.includes(r.id));const score=r=>(avg(r)||3)+(r.fav?1.5:0)+((r.tags||[]).some(t=>['דייט','אירוע מיוחד','מקום שקט'].includes(t))?1.2:0)+(visitsOf(r).some(v=>v.occ==='anniv'||v.occ==='bday')?.8:0)+(r.status!=='been'?.4:0)+(x.kind==='bday'&&(r.tags||[]).includes('מתאים לחברים')?.6:0)+Math.random()*.6;return pool.sort((a,b)=>score(b)-score(a))[0]||null}
let spSkip={};
function specialSecHtml(){const L=special();return `<div class="sec"><h4>ימים מיוחדים</h4><p class="note" style="margin:0 0 10px">שבועיים לפני, האפליקציה תציע מקום מיוחד מהקבוצה. משותף לכל מי שבקבוצה.</p>${L.length?`<ul class="splist">${L.map((x,i)=>`<li><span>${(SPK[x.kind]||SPK.other)[1]}</span><b>${esc(x.name)}</b><small>${esc(fmtMD(x.md))}</small><button type="button" class="del" data-act="spRm" data-i="${i}" aria-label="הסרה">×</button></li>`).join('')}</ul>`:''}
<form id="spF" class="grid2" style="margin-top:8px"><label class="l">מה החגיגה<select class="f" name="kind">${Object.entries(SPK).map(([k,[t,e]])=>`<option value="${k}">${e} ${t}</option>`).join('')}</select></label><label class="l">תאריך<input class="f" type="date" name="d" required></label><label class="l full">שם (לא חובה)<input class="f" name="name" maxlength="40" placeholder="למשל: יום הולדת ליובל"></label><div class="full"><button class="btn" type="submit">+ הוספה</button></div></form></div>`}
const fmtMD=md=>{const [m,d]=md.split('-').map(Number);return `${d} ב${['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'][m-1]}`};
async function setSpecial(arr){const ok=await metaSave({special:arr});renderNotices();return ok}

/* ================= leaderboard ================= */
let gameActs=null;
async function loadGameActs(){if(!cur)return;const lid=cur.id;try{const {data}=await sb.from('activity').select('text,user_id,kind').eq('list_id',lid).in('kind',['game','add']).order('created_at',{ascending:false}).limit(1000);if(cur&&cur.id===lid){gameActs=data||[];if(location.hash==='#stats')renderStats()}}catch{}}
function leaderboard(){const us=members.map(m=>m.user_id);const by=u=>({u,add:0,hit:0,rated:0,photos:0,wins:0});const T={};for(const u of us)T[u]=by(u);
  for(const r of rows){const a=r.addedBy;if(a&&T[a]){T[a].add++;const others=Object.entries(r.ratings||{}).filter(([k,v])=>k!==a&&v>0).map(([,v])=>v);if(others.length&&others.reduce((x,y)=>x+y,0)/others.length>=4)T[a].hit++}
    for(const [u,v] of Object.entries(r.ratings||{}))if(T[u]&&v>0)T[u].rated++;for(const p of r.photos||[])if(p.path&&T[p.by]&&p.src!=='google')T[p.by].photos++}
  for(const g of gameActs||[]){if(g.kind!=='game')continue;for(const u of us){const n=nm(u);if(n&&String(g.text).startsWith(n+' ניצח')){T[u].wins++;break}}}
  return Object.values(T)}
function leaderHtml(){const L=leaderboard();if(L.length<2)return '';const cat=[['add','הכי הרבה מקומות שהוסיף/ה','📍'],['hit','צדק/ה בהמלצות (4★ ומעלה מאחרים)','🎯'],['wins','ניצחונות במשחקים','🏆'],['rated','הכי הרבה דירוגים','⭐'],['photos','הכי הרבה תמונות','📸']];
  return `<div class="panel wide"><h3>טבלת המובילים</h3><div class="lboard">${cat.map(([k,t,e])=>{const s=[...L].sort((a,b)=>b[k]-a[k]);const top=s[0];return `<div class="lb"><span class="lbe">${e}</span><div class="lbt"><small>${t}</small><ol>${s.map((x,i)=>`<li class="${i===0&&x[k]>0?'win':''}"><b>${esc(nm(x.u))}</b><span>${x[k]}</span></li>`).join('')}</ol></div>${top[k]>0&&top[k]>((s[1]||{})[k]||0)?'<span class="crown" aria-hidden="true">👑</span>':''}</div>`}).join('')}</div>${gameActs===null?'<p class="note">טוען ניצחונות…</p>':''}</div>`}

/* ================= surprise outing ================= */
const DRESS=['','יומיומי','קז׳ואל מסודר','חגיגי','ממש חגיגי','נוח להליכה'];
function surprisesForMe(){const out=[];const td=today();for(const r of rows)for(const raw of r.visits||[]){const v=nv(raw);if(v&&isHiddenS(v)&&v.d>=td)out.push({v})}return out.sort((a,b)=>a.v.d.localeCompare(b.v.d))}

/* ================= voice add ================= */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function voiceAdd(btn){if(!SR){toast('הדפדפן הזה לא תומך בהקלטה. נסו בכרום או בספארי.');return}
  const rec=new SR();rec.lang='he-IL';rec.interimResults=true;rec.maxAlternatives=1;let fin='';
  const q=$('#placeQ'),st=$('#fillSt');btn.classList.add('rec');btn.setAttribute('aria-pressed','true');if(st)st.textContent='מקשיב… אמרו למשל: "מוזמביק בר בתל אביב"';
  rec.onresult=e=>{let t='';for(const r of e.results)t+=r[0].transcript;fin=t;if(q)q.value=cleanVoice(t)};
  rec.onerror=e=>{btn.classList.remove('rec');btn.setAttribute('aria-pressed','false');if(st)st.textContent=e.error==='not-allowed'?'צריך לאשר גישה למיקרופון':'לא שמעתי. נסו שוב.'};
  rec.onend=async()=>{btn.classList.remove('rec');btn.setAttribute('aria-pressed','false');const t=cleanVoice(fin);if(!t)return;if(q)q.value=t;if(st)st.textContent='מחפש: '+t;await placeSearch();const res=placeSearch.res||[];if(res.length){await placePick(0);if(st)st.textContent=(st.textContent||'')+' (נבחרה התוצאה הראשונה. אם זה לא המקום, בחרו תוצאה אחרת בחיפוש.)'}};
  try{rec.start()}catch{btn.classList.remove('rec')}}
const cleanVoice=t=>String(t||'').replace(/^(תוסיף|תוסיפי|הוסף|הוסיפי|תכניס|תכניסי|תשמור|שמור)\s+(את\s+)?/,'').replace(/^(מסעדה|בר)\s+(בשם\s+)?/,'').trim();

/* ================= weather-based suggestion ================= */
let wx=null,wxSkip=[];
const WXK=c=>c>=95?'storm':(c>=71&&c<=77)||c===85||c===86?'snow':(c>=51&&c<=67)||(c>=80&&c<=82)?'rain':c>=45&&c<=48?'fog':c<=1?'clear':'cloud';
async function loadWeather(){const c=lsGet('rs-wx',null);if(c&&Date.now()-c.at<3600e3){wx=c;renderNotices();return}
  let lat=32.08,lng=34.78;if(myLoc){lat=myLoc.lat;lng=myLoc.lng}else{const ll=rows.filter(hasLL);if(ll.length){lat=ll.reduce((s,r)=>s+r.lat,0)/ll.length;lng=ll.reduce((s,r)=>s+r.lng,0)/ll.length}}
  try{const j=await fetchJ(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}&current=temperature_2m,weather_code,is_day&timezone=auto`,8000);const cu=j.current;if(!cu)return;
    wx={t:Math.round(cu.temperature_2m),k:WXK(cu.weather_code),day:!!cu.is_day,at:Date.now()};lsSet('rs-wx',wx);renderNotices()}catch{}}
const WARM=['יפני / סושי','אסייתי','חומוס ומזרחי','בשרים','פאב','בר יין','הודי','איטלקי'];
function wxMood(){if(!wx)return null;const t=wx.t,k=wx.k,h=new Date().getHours();
  if(k==='rain'||k==='storm'||k==='snow')return {e:'🌧️',title:`גשום בחוץ, ${t}°`,why:'מושלם לראמן, מרק או משהו חם ומנחם',cu:WARM,tags:['מקום שקט'],avoid:['ישיבה בחוץ']};
  if(t<=15)return {e:'🧣',title:`קריר בחוץ, ${t}°`,why:'ערב של ראמן, תבשיל או יין אדום',cu:WARM,tags:['מקום שקט'],avoid:['ישיבה בחוץ']};
  if(t>=29)return {e:'☀️',title:`חם! ${t}°`,why:'גלידה, ים או ישיבה בחוץ כשמתקרר',cu:['קינוחים','דגים ופירות ים','ים-תיכוני','בר קוקטיילים'],tags:['ישיבה בחוץ','האפי אוור']};
  if(!wx.day||h>=17)return {e:'🌙',title:`ערב נעים, ${t}°`,why:'בדיוק בשביל בר עם מרפסת',cu:['בר קוקטיילים','בר יין','בר','פאב','ים-תיכוני'],tags:['ישיבה בחוץ','האפי אוור']};
  return {e:'⛅',title:`נעים בחוץ, ${t}°`,why:'יום טוב לבראנץ׳ או לשבת בחוץ',cu:['קפה ובראנץ\'','ים-תיכוני','קינוחים'],tags:['ישיבה בחוץ','ארוחת בוקר']}}
function wxTypes(){const m=wxMood();if(!m)return null;const have=new Set(rows.map(r=>r.cuisine).filter(Boolean));const types=m.cu.filter(c=>have.has(c));const tagHit=rows.some(r=>(r.tags||[]).some(t=>m.tags.includes(t)));return {m,types,tag:tagHit?m.tags[0]:''}}
function wxPick(){const m=wxMood();if(!m)return null;const sc=r=>(m.cu.includes(r.cuisine)?2:0)+((r.tags||[]).some(t=>m.tags.includes(t))?1.5:0)-((r.tags||[]).some(t=>(m.avoid||[]).includes(t))?2.5:0)+(avg(r)||3)/2.5+(r.fav?.5:0)+(((openState(r)||{}).open)?.8:0);
  const pool=rows.filter(r=>!wxSkip.includes(r.id)&&sc(r)>=2.6).sort((a,b)=>sc(b)-sc(a));return {m,r:pool[0]||null}}

/* ================= countdown to the next outing ================= */
function nextOuting(maxD){const now=Date.now(),L=[];const at=(d,t)=>new Date(`${d}T${t||'20:00'}:00`).getTime();
  for(const {r,v} of upcoming())L.push({at:at(v.d,v.t),title:r.name,id:r.id,v});
  for(const {v} of surprisesForMe())L.push({at:at(v.d,v.t),title:'יציאת הפתעה 🤫',sur:true,v});
  for(const e of (typeof events!=='undefined'?events:[]))L.push({at:at(e.d,e.t),title:e.title,ev:e.id,v:{d:e.d,t:e.t||''}});
  return L.filter(x=>x.at>now-3*3600e3&&x.at-now<(maxD||7)*864e5).sort((a,b)=>a.at-b.at)[0]||null}
function cdText(x){const ms=x.at-Date.now();if(ms<=0)return {big:'יוצאים עכשיו! 🥳',now:true};const m=Math.floor(ms/6e4),d=Math.floor(m/1440),h=Math.floor(m%1440/60),mm=m%60;
  if(x.v.d===today())return {big:h?`היום! עוד ${h}:${String(mm).padStart(2,'0')} שעות`:`היום! עוד ${mm} דקות`,now:true};
  return {big:`עוד ${d?d===1?'יום':d+' ימים':''}${d&&h?', ':''}${h?h===1?'שעה':h+' שעות':''}${!d&&!h?mm+' דקות':''}`,now:false}}
let cdTimer=null;
function cdTick(){const el=$('#cdT');if(!el){clearInterval(cdTimer);cdTimer=null;return}const x=nextOuting();if(!x){renderNotices();return}el.textContent=cdText(x).big}

/* ================= with whom ================= */
const withOf=v=>Array.isArray(v.with)?v.with.filter(Boolean):[];
function knownWith(){const c={};for(const r of rows)for(const v of r.visits||[]){const o=nv(v);if(o)for(const n of withOf(o))c[n]=(c[n]||0)+1}return Object.keys(c).sort((a,b)=>c[b]-c[a])}
const parseWith=s=>[...new Set(String(s||'').split(/[,،\n]+/).map(x=>x.trim().replace(/^ו(?=[א-ת]{2,})/,m=>m).slice(0,20)).filter(Boolean))].slice(0,8);
function withHtml(){const c={},last={},where={};for(const r of rows)for(const v of visitsOf(r)){if(v.d>today())continue;for(const n of withOf(v)){c[n]=(c[n]||0)+1;if(!last[n]||v.d>last[n]){last[n]=v.d;where[n]=r.name}}}
  const L=Object.keys(c).sort((a,b)=>c[b]-c[a]).slice(0,8);if(!L.length)return `<div class="panel"><h3>עם מי יצאנו</h3><p class="note">ברישום ביקור, כתבו ב"עם מי היינו" את שמות החברים (מופרדים בפסיק), וכאן תראו עם מי אתם יוצאים הכי הרבה.</p></div>`;
  const mx=c[L[0]];return `<div class="panel"><h3>עם מי יצאנו הכי הרבה</h3><div class="bars">${L.map(n=>`<div class="bar"><span>${esc(n)}</span><span class="t"><i style="width:${(c[n]/mx*100).toFixed(1)}%"></i></span><span>${c[n]}</span></div><small class="meta wlast">לאחרונה: ${esc(where[n])} · ${esc(fmtD(last[n]))}</small>`).join('')}</div></div>`}

/* ================= delivery ================= */
const WOLT_CITY=[[/ירושלים|מבשרת|מעלה אדומים/,'jerusalem'],[/חיפה|קריית|קרית|נשר|טירת כרמל/,'haifa'],[/באר.?שבע|עומר|מיתר/,'beer-sheva'],[/אשקלון/,'ashkelon'],[/נתניה|רעננה|כפר.?סבא|הוד.?השרון|רמת.?השרון|אבן.?יהודה|כפר.?יונה|קדימה/,'hasharon'],[/פרדס.?חנה|כרכור|חדרה|זכרון/,'pardes-hanna'],[/טבריה/,'tiberias-area']];
const NO_DELIV=['בר','בר יין','בר קוקטיילים','פאב'];
const woltDirect=r=>{const w=safeUrl(r.woltUrl||'')||safeUrl(r.site||'');return w&&/^https:\/\/([a-z0-9-]+\.)*wolt\.(com|app|onelink\.me)\//i.test(w)?w:''};
const showWolt=r=>!!woltDirect(r)||(r.delivery!==false&&(r.delivery===true||!NO_DELIV.includes(r.cuisine)));
const deliveryUrl=r=>{const s=woltDirect(r);if(s)return s;const c=String(r.city||'')+' '+String(r.address||'');const slug=(WOLT_CITY.find(([rx])=>rx.test(c))||[0,'tel-aviv'])[1];return `https://wolt.com/he/isr/${slug}/search?q=${encodeURIComponent(r.name)}`};

/* ================= receipt reading (Google Vision + on-device fallback) ================= */
const blobB64=b=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result).split(',')[1]);fr.onerror=rej;fr.readAsDataURL(b)});
async function ocrImg(f,max){try{const bm=await createImageBitmap(f,{imageOrientation:'from-image'});const k=Math.min(1,max/Math.max(bm.width,bm.height));const c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return await new Promise(res=>c.toBlob(b=>res(b||f),'image/jpeg',.9))}catch{return f}}
async function visionOCR(blob){const k=(window.APP_CONFIG||{}).googleKey;if(!k||!navigator.onLine)return null;const q=await takeQuota('vision');if(!q.ok)return null;
  const res=await fetch('https://vision.googleapis.com/v1/images:annotate?key='+encodeURIComponent(k),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requests:[{image:{content:await blobB64(blob)},features:[{type:'DOCUMENT_TEXT_DETECTION'}],imageContext:{languageHints:['he','en']}}]})});
  const j=await res.json().catch(()=>({}));if(!res.ok||j.error||!j.responses)throw new Error((j.error&&j.error.message)||'vision '+res.status);return j.responses[0]||{}}
function visionRows(resp){const W=[];for(const pg of ((resp.fullTextAnnotation||{}).pages||[]))for(const b of pg.blocks||[])for(const p of b.paragraphs||[])for(const w of p.words||[]){const t=(w.symbols||[]).map(s=>s.text).join('');const v=((w.boundingBox||{}).vertices)||[];if(!t||v.length<4)continue;
    const xs=v.map(q=>q.x||0),ys=v.map(q=>q.y||0);W.push({t,x:(Math.min(...xs)+Math.max(...xs))/2,y:(ys[0]+ys[1]+ys[2]+ys[3])/4,h:Math.max(4,Math.max(...ys)-Math.min(...ys)),x0:Math.min(...xs),y0:(ys[0]+ys[1])/2,y1:(ys[0]+ys[3])/2})}
  if(!W.length)return [];const hs=W.map(w=>w.h).sort((a,b)=>a-b),mh=hs[hs.length>>1];
  W.sort((a,b)=>a.y-b.y);const R=[];for(const w of W){const r=R.find(r=>Math.abs(r.y-w.y)<mh*.55);if(r){r.w.push(w);r.y=(r.y*(r.w.length-1)+w.y)/r.w.length}else R.push({y:w.y,w:[w]})}
  return R.sort((a,b)=>a.y-b.y).map(r=>r.w.sort((a,b)=>b.x-a.x).map(w=>({t:w.t,x:w.x})))}
const RC_SKIP=/סה["״'׳]?\s?כ|סהכ|מע["״'׳]?\s?מ|לתשלום|תשלום|שירות|טיפ|עודף|אשראי|מזומן|כרטיס|ויזה|ישראכרט|אמריקן|דיינרס|ביט\b|פייבוקס|תאריך|שעה|קופה|קופאי|שולחן|מלצר|מלצרית|ח[.״"']?\s?פ|עוסק|טל[׳'.]|טלפון|הנחה|זיכוי|סועדים|סועד|תודה|חשבונית|קבלה|מספר|מס[׳'.]|כתובת|רחוב|הזמנה\s?מס|total|vat|tip|cash|change|subtotal|balance|card|visa|master|amex|discount|service|table|server|date|time|tel|invoice|receipt|guests/i;
const RC_TOTAL=/לתשלום|סה["״'׳]?\s?כ|סהכ|total|amount\s?due|grand/i;
const RC_NOTTOTAL=/לפני|ללא\s?מע|מע["״'׳]?\s?מ\s*\d|הנחה|שירות\s*\d|tip|טיפ|vat\s*\d|before/i;
const isPriceTok=t=>/^[-–]?₪?\d{1,5}(?:[.,]\d{1,2})?₪?$/.test(t);
const numOf=t=>Number(String(t).replace(/[₪–-]/g,'').replace(',','.'));
function parseReceipt(rowsTok){const items=[],tot=[];let fallbackMax=0;
  for(const toks of rowsTok){const line=toks.map(x=>x.t).join(' ');const prices=toks.filter(x=>isPriceTok(x.t)).map(x=>({v:numOf(x.t),dec:/[.,]\d/.test(x.t),x:x.x}));
    for(const p of prices)if(p.dec&&p.v>fallbackMax&&p.v<20000)fallbackMax=p.v;
    if(RC_TOTAL.test(line)&&(/כולל|לתשלום/.test(line)&&!/לפני/.test(line)||!RC_NOTTOTAL.test(line))){const c=prices.filter(p=>p.v>0&&p.v<20000);if(c.length)tot.push({v:Math.max(...c.map(p=>p.v)),strong:/לתשלום|כולל|total/i.test(line)});continue}
    if(RC_SKIP.test(line))continue;
    const words=toks.filter(x=>/[A-Za-zא-ת]/.test(x.t)&&!/^[xX×*]\d{0,2}$|^\d{1,2}[xX×*]$/.test(x.t)).map(x=>x.t.replace(/^[^A-Za-zא-ת0-9"״']+|[^A-Za-zא-ת0-9"״')]+$/g,''));const name=words.join(' ').replace(/\s{2,}/g,' ').trim();
    const letters=(name.match(/[A-Za-zא-ת]/g)||[]).length;if(letters<2||name.length>40)continue;
    const cand=prices.filter(p=>p.v>0&&p.v<5000);if(!cand.length)continue;
    let qty=1;const qm=toks.map(x=>x.t).find(t=>/^\d{1,2}\s?[xX×*]$|^[xX×*]\s?\d{1,2}$/.test(t));if(qm)qty=Number(qm.replace(/\D/g,''))||1;else{const ints=cand.filter(p=>!p.dec&&p.v<=20&&Number.isInteger(p.v));if(ints.length&&cand.some(p=>p.dec))qty=ints[0].v}
    const dec=cand.filter(p=>p.dec);const price=(dec.length?Math.max(...dec.map(p=>p.v)):Math.max(...cand.map(p=>p.v)));if(price<2)continue;
    items.push({name,qty:Math.max(1,Math.min(30,qty)),price})}
  const strong=tot.filter(t=>t.strong);const total=strong.length?strong[strong.length-1].v:tot.length?Math.max(...tot.map(t=>t.v)):fallbackMax||null;
  const seen=new Set(),out=[];for(const it of items){const k=it.name.replace(/\s/g,'');if(seen.has(k))continue;seen.add(k);out.push(it)}
  return {items:out.slice(0,30),total}}
async function scanReceipt(file){const st=$('#rcptSt'),fm=$('#visitF');if(!fm)return;const box=$('#rcptRev');if(box)box.innerHTML='';
  st.textContent='קורא את הקבלה…';let res=null,src='';
  try{const ai=await aiCall({action:'receipt',img:await blobB64(await ocrImg(file,1800))});if(ai&&ai.ok&&(ai.items.length||ai.total)){res={items:ai.items,total:ai.total||0};src='ai'}}catch(e){console.warn('ai receipt',e)}
  if(!res){st.textContent='קורא את הקבלה…';try{const v=await visionOCR(await ocrImg(file,2200));if(v){res=parseReceipt(visionRows(v));src='google'}}catch(e){console.warn('vision',e)}}
  if(!res||(!res.items.length&&!res.total)){try{st.textContent='קורא את הקבלה במכשיר… (בפעם הראשונה זה לוקח קצת יותר זמן)';await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      const {data}=await Tesseract.recognize(await ocrImg(file,2000),'heb+eng');const rowsTok=(data.text||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>l.split(/\s+/).map(t=>({t,x:0})));res=parseReceipt(rowsTok);src='device'}catch{st.textContent='הסריקה לא הצליחה. אפשר להקליד את הסכום ידנית.';return}}
  if(!fm.isConnected)return;
  if(res.total)fm.elements.cost.value=Math.round(res.total);
  const r=byId(openId),have=new Set(((r&&r.dishes)||[]).map(d=>d.name.replace(/\s/g,'')));
  st.textContent=(res.total?`הסכום לתשלום: ${ils(res.total)}. `:'לא מצאנו סכום כולל, אפשר להקליד. ')+(res.items.length?`זיהינו ${res.items.length} מנות ומשקאות. סמנו מה להוסיף ותקנו שמות אם צריך:`:'לא זיהינו מנות בקבלה.')+(src==='device'?' (נקרא במכשיר, ייתכנו טעויות)':'');
  if(box&&res.items.length){const sum=res.items.reduce((s,i)=>s+i.price,0);box.innerHTML=`<div class="rcl">${res.items.map((it,i)=>`<label class="rci"><input type="checkbox" name="rcOn" value="${i}" ${have.has(it.name.replace(/\s/g,''))?'':'checked'}><input class="f" name="rcName${i}" value="${esc(it.name)}" maxlength="40" aria-label="שם המנה"><span class="rcq">${it.qty>1?'×'+it.qty:''}</span><span class="money">${ils(it.price)}</span></label>`).join('')}</div><p class="note rcsum">סכום השורות: ${ils(sum)}${res.total?` · בקבלה: ${ils(res.total)}`:''}. המנות המסומנות יתווספו ל"מנות ומשקאות" כשתלחצו שמירה.</p>`}}
function receiptDishes(fm){const box=$('#rcptRev');if(!box)return [];return [...box.querySelectorAll('[name=rcOn]:checked')].map(c=>{const inp=fm.querySelector(`[name="rcName${c.value}"]`)||box.querySelector(`[name="rcName${c.value}"]`);return inp?inp.value.trim().slice(0,40):''}).filter(Boolean)}


/* ================= swipe-to-dismiss for home cards ================= */
function noticeKey(n){const c=[...n.classList].find(x=>x!=='notice'&&x!=='now')||'plan';const a=n.matches('[data-ev],[data-cdo],[data-poll],[data-open]')?n:n.querySelector('[data-ev],[data-cdo],[data-poll],[data-open],[data-revx],[data-spnext],[data-spplan]');
  const id=a?(a.dataset.ev||a.dataset.cdo||a.dataset.poll||a.dataset.open||a.dataset.revx||a.dataset.spnext||a.dataset.spplan||''):'';return c+':'+(id||(c==='wx'?'':((n.querySelector('b')||n).textContent||'').replace(/[\d:]/g,'').slice(0,40)))}
function applyNoticeDis(el){const d=lsGet('rs-ndis',{}),td=today();for(const n of el.querySelectorAll('.notice')){const k=noticeKey(n);n.dataset.nk=k;if(d[k]===td)n.remove()}}
function noticeDismiss(n){const k=n.dataset.nk||noticeKey(n);const d=lsGet('rs-ndis',{}),td=today();for(const x in d)if(d[x]!==td)delete d[x];d[k]=td;lsSet('rs-ndis',d);
  if(n.classList.contains('push')){pushAsk=false;lsSet('rs-push-asked',1)}if(n.classList.contains('wx'))lsSet('rs-wx-x',td);const rx=n.querySelector('[data-revx]');if(rx){const L=lsGet('rs-rev-dis',[]);L.push(rx.dataset.revx);lsSet('rs-rev-dis',L.slice(-200))}}
let lastSwipe=0;
function bindSwipe(){const bar=$('#pollBar');if(!bar||bar.dataset.sw)return;bar.dataset.sw='1';let sw=null;
  bar.addEventListener('pointerdown',e=>{const n=e.target.closest('.notice');if(!n||(e.pointerType==='mouse'&&e.button!==0))return;sw={n,x:e.clientX,y:e.clientY,dx:0,on:false}});
  bar.addEventListener('pointermove',e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;
    if(!sw.on){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){sw=null;return}if(dx>12&&dx>Math.abs(dy)*1.2){sw.on=true;try{sw.n.setPointerCapture(e.pointerId)}catch{}sw.n.classList.add('swiping')}else return}
    sw.dx=Math.max(0,dx);sw.n.style.transform=`translateX(${sw.dx}px) rotate(${Math.min(4,sw.dx/60)}deg)`;sw.n.style.opacity=String(Math.max(.15,1-sw.dx/320))});
  const end=()=>{if(!sw)return;const {n,dx,on}=sw;sw=null;if(!on)return;lastSwipe=Date.now();n.classList.remove('swiping');
    if(dx>Math.min(110,n.offsetWidth*.3)){n.style.transition='transform .25s ease-out, opacity .25s';n.style.transform=`translateX(${n.offsetWidth+60}px) rotate(8deg)`;n.style.opacity='0';noticeDismiss(n);if(navigator.vibrate)navigator.vibrate(15);
      setTimeout(()=>{const h=n.offsetHeight;n.style.height=h+'px';n.style.overflow='hidden';requestAnimationFrame(()=>{n.style.transition='height .28s ease, margin .28s ease, padding .28s ease';n.style.height='0';n.style.marginBlock='0';n.style.paddingBlock='0'});setTimeout(()=>n.remove(),300)},230)}
    else{n.style.transition='transform .22s ease, opacity .22s';n.style.transform='';n.style.opacity='';setTimeout(()=>{n.style.transition=''},240)}};
  bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
  bar.addEventListener('click',e=>{if(Date.now()-lastSwipe<450){e.stopPropagation();e.preventDefault()}},true)}
/* ---------- events ---------- */
let popId='';
function animIn(){const g=$('#grid');if(!g)return;g.classList.remove('anim');void g.offsetWidth;g.classList.add('anim');clearTimeout(animIn.t);animIn.t=setTimeout(()=>g.classList.remove('anim'),1400)}
async function toggleVote(id){const r=byId(id);if(!r)return;if(!iVoted(r)){popId=id;setTimeout(()=>{popId=''},700);if(voters(r).length>=1&&!isMatch(r))setTimeout(()=>{const x=byId(id);if(x&&isMatch(x)){logAct('match',id,`גם רוצה את ${x.name}! שניכם רוצים ללכת`);confetti(50)}},50)}await save(id,{votes:{[myId]:iVoted(r)?0:Date.now()}})}
async function shareOrCopy(title,text,url){if(navigator.share){try{await navigator.share(url?{title,text,url}:{title,text});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(text+(url?'\n'+url:''));toast('הועתק. אפשר להדביק בוואטסאפ.')}catch{toast('לא הצלחנו להעתיק')}}
function newForm(){killFormMap();openId=null;mode='new';openSheet();$('#sb').innerHTML=formHtml(null);initFormMap();maybeTour('form',1100);$('#placeQ').focus()}

function bindUI(){bindSwipe();$('#v-stats').addEventListener('click',e=>{const b=e.target.closest('[data-act=recap]');if(b)recapSheet(stYear)});
$('#grid').addEventListener('click',e=>{if(e.target.closest('a'))return;const vb=e.target.closest('[data-vote]');if(vb){toggleVote(vb.dataset.vote);return}if(e.target.closest('[data-act=add]')){newForm();return}const c=e.target.closest('.card');if(c){flipFrom=c.getBoundingClientRect();openDetail(c.dataset.id)}});
$('#grid').addEventListener('keydown',e=>{const c=e.target.closest('.card');if(c&&(e.key==='Enter'||e.key===' ')&&e.target===c){e.preventDefault();openDetail(c.dataset.id)}});
for(const sel of ['#v-timeline','#v-stats'])$(sel).addEventListener('click',e=>{const o=e.target.closest('[data-open]');if(o){e.preventDefault();openDetail(o.dataset.open)}});
$('#v-timeline').addEventListener('keydown',e=>{const o=e.target.closest('.tl-item');if(o&&e.key==='Enter')openDetail(o.dataset.open)});
$('#nomap').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b){killFormMap();openId=b.dataset.edit;mode='edit';openSheet();$('#sb').innerHTML='';renderDetail()}});
$('#locMe').addEventListener('click',()=>locateMe((la,ln)=>{ensureMap();if(!lmap)return;if(meMarker)meMarker.remove();meMarker=L.circleMarker([la,ln],{radius:9,color:'#fff',weight:3,fillColor:'#2b7bd6',fillOpacity:1}).addTo(lmap).bindPopup('אתם כאן');lmap.setView([la,ln],15)}));
$('#fitAll').addEventListener('click',fitAll);
document.querySelectorAll('.bell-btn').forEach(b=>b.addEventListener('click',feedSheet));
$('#pollBar').addEventListener('click',e=>{const co=e.target.closest('[data-cdo]');if(co){outSheet();return}const wc=e.target.closest('[data-wxc]');if(wc){cuisF=cuisF===wc.dataset.wxc?'':wc.dataset.wxc;q='';const qi=$('#q');if(qi)qi.value='';renderList();renderNotices();const g=$('#grid');if(g)g.scrollIntoView({behavior:'smooth',block:'start'});return}const wt=e.target.closest('[data-wxt]');if(wt){cuisF='';q=wt.dataset.wxt;const qi=$('#q');if(qi)qi.value=q;renderList();const g=$('#grid');if(g)g.scrollIntoView({behavior:'smooth',block:'start'});return}if(e.target.closest('[data-wxx]')){lsSet('rs-wx-x',today());renderNotices();return}const rv=e.target.closest('[data-rev]');if(rv){openDetail(rv.dataset.rev);return}const rx=e.target.closest('[data-revx]');if(rx){const d=lsGet('rs-rev-dis',[]);d.push(rx.dataset.revx);lsSet('rs-rev-dis',d.slice(-200));renderNotices();return}const spp=e.target.closest('[data-spplan]');if(spp){planSheet(spp.dataset.spplan);return}const spn=e.target.closest('[data-spnext]');if(spn){(spSkip[spn.dataset.spnext]=spSkip[spn.dataset.spnext]||[]).push(spn.dataset.rid);renderNotices();return}const pu=e.target.closest('[data-push]');if(pu){pushAsk=false;lsSet('rs-push-asked',1);if(pu.dataset.push==='on')pushOn();else renderNotices();return}const ev=e.target.closest('[data-ev]');if(ev){evSheet(ev.dataset.ev);return}const p=e.target.closest('[data-poll]');if(p){pollSheet(p.dataset.poll);return}const o=e.target.closest('[data-open]');if(o)openDetail(o.dataset.open)});
document.querySelectorAll('#v-list .seg button').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;document.querySelectorAll('#v-list .seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderList()}));
document.querySelectorAll('[data-tl]').forEach(b=>b.addEventListener('click',()=>{tlF=b.dataset.tl;document.querySelectorAll('[data-tl]').forEach(x=>x.setAttribute('aria-pressed',x===b));renderTimeline()}));
$('#stYear').addEventListener('change',e=>{stYear=e.target.value;renderStats()});
$('#q').addEventListener('input',e=>{q=e.target.value;renderList()});
$('#sort').addEventListener('change',async e=>{sort=e.target.value;if(sort==='near'){const l=await getLoc();if(!l){toast('צריך הרשאת מיקום כדי למיין לפי מרחק');}}try{localStorage.setItem('rs-sort',sort)}catch{}renderList()});
$('#cuis').addEventListener('click',async e=>{const qf=e.target.closest('[data-qf]');if(qf){const k=qf.dataset.qf;
    if(k==='like')likeF=!likeF;
    else if(k==='hh')hhF=!hhF;
    else if(k==='more'){moreF=!moreF;renderList();return}
    else if(k==='new'){view=view==='want'?'all':'want';document.querySelectorAll('#v-list .seg button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.view===view)))}
    else if(k==='near'){if(!nearF){qf.setAttribute('aria-busy','true');const l=await getLoc();qf.removeAttribute('aria-busy');if(!l){toast('צריך לאשר גישה למיקום כדי לסנן לפי קרבה');return}}nearF=!nearF}
    renderList();stickTop();return}
  if(e.target.closest('[data-open-f]')){openF=!openF;renderList();stickTop();return}const b=e.target.closest('[data-c]');if(b){cuisF=b.dataset.c;renderList();stickTop()}});
$('#pickBtn').addEventListener('click',()=>pick());
$('#fab').addEventListener('click',camSheet);
$('#addBtn').addEventListener('click',addSheet);
$('#setBtn').addEventListener('click',()=>settingsSheet());
$('#listBtn').addEventListener('click',listsSheet);
$('#app h1').addEventListener('click',listsSheet);
$('#addBtnM').addEventListener('click',addSheet);
$('#pickBtnM').addEventListener('click',()=>pick());
$('#closeBtn').addEventListener('click',()=>closeSheetAnim());
$('#ov').addEventListener('click',e=>{if(e.target.id==='ov')closeSheet()});
$('#lb').addEventListener('click',()=>$('#lb').hidden=true);
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('#lb').hidden)$('#lb').hidden=true;else if(!$('#ov').hidden)closeSheet()});

const S=$('#sb');
S.addEventListener('input',e=>{if(e.target.id==='gq'){const v=e.target.value.trim().toLowerCase();for(const el of document.querySelectorAll('.gco'))el.hidden=!!v&&!el.dataset.n.includes(v);return}
  if(e.target.id==='paste'){const o=parseMaps(e.target.value),f=$('#ef');if(!f)return;{const um=String(e.target.value).match(/https?:\/\/\S+/);const u=um&&um[0].replace(/[)\].,]+$/,'');if(u&&!/google\.|goo\.gl|maps\.app|waze\.com|wolt\.com/i.test(u)&&safeUrl(u)&&u!==enrichFromSite.last){enrichFromSite.last=u;if(!f.elements.site.value)f.elements.site.value=safeUrl(u);$('#fillSt').textContent='';enrichFromSite(safeUrl(u));return}}
    for(const k of ['name','city','address','mapsUrl'])if(o[k]&&(k==='mapsUrl'||!f.elements[k].value.trim()))f.elements[k].value=o[k];
    if(Number.isFinite(o.lat)){setPin(o.lat,o.lng,false,true);if(!o.exact)f.elements.llLevel.value='street'}
    $('#fillSt').textContent=o.short?'קישור מקוצר: הניווט יעבוד דרכו. כדי שהמקום יופיע במפה, חפשו אותו למעלה או סמנו אותו על המפה.':(o.name||Number.isFinite(o.lat)?(o.exact?'מילאנו מהקישור, כולל המיקום המדויק.':'מילאנו מהקישור. כדאי לבדוק שהסיכה על המקום.'):'')}
  if(e.target.name==='ll'){const f=$('#ef'),m=e.target.value.match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);if(f&&m&&Math.abs(+m[1])<=90&&fmap){if(!fmarker)setPin(+m[1],+m[2],false,true);else{fmarker.setLatLng([+m[1],+m[2]]);fmap.setView([+m[1],+m[2]],17)}f.elements.llLevel.value='place'}}});
S.addEventListener('keydown',e=>{const pl=e.target.closest('[data-act=pickList]');if(pl&&e.key==='Enter')switchList(pl.dataset.id);if(e.target.id==='placeQ'&&e.key==='Enter'){e.preventDefault();placeSearch()}const li=e.target.closest('[data-act=camPick]');if(li&&e.key==='Enter')camStep(li.dataset.id)});
S.addEventListener('submit',async e=>{
  if(e.target.classList.contains('qrow')){e.preventDefault();quotaSave(e.target);return}
  e.preventDefault();const fm=e.target;
  if(fm.id==='dishF'){const inp=fm.elements.d,v=inp.value.trim(),r=byId(openId);if(!v||!r)return;inp.value='';inp.blur();await save(r.id,{dishes:[...(r.dishes||[]),{name:v,v:'ok'}],updatedAt:Date.now()});return}
  if(fm.id==='visitF'){const r=byId(openId);if(!r)return;const d=fm.elements.d.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){toast('בחרו תאריך');return}
    const v={d,cost:Math.max(0,Math.round(Number(fm.elements.cost.value)||0)),occ:OCC[fm.elements.occ.value]!==undefined?fm.elements.occ.value:'',note:fm.elements.note.value.trim().slice(0,100)};const wi=parseWith(fm.elements.with&&fm.elements.with.value);if(wi.length)v.with=wi;
    const rd=receiptDishes(fm),haveD=new Set((r.dishes||[]).map(x=>x.name.replace(/\s/g,''))),newD=rd.filter(n=>!haveD.has(n.replace(/\s/g,''))).map(n=>({name:n,v:'ok'}));
    const t=fm.elements.t&&fm.elements.t.value;if(t)v.t=t;const fut=d>today()||(d===today()&&t&&t>new Date().toTimeString().slice(0,5));
    document.activeElement&&document.activeElement.blur();await save(r.id,{visits:[...(r.visits||[]),v],...(fut?{}:{status:'been'}),...(newD.length?{dishes:[...(r.dishes||[]),...newD]}:{}),updatedAt:Date.now()});if(newD.length)toast(`נוספו ${newD.length} מנות מהקבלה`);
    if(fut){calPrompt(r,v);logAct('plan',r.id,`קבע/ה יציאה ל${r.name} ${whenTxt(v)}`)}else{toast('הביקור נרשם');logAct('visit',r.id,`סימן/ה ביקור ב${r.name}`)}renderNotices();return}
  if(fm.id==='cmtF'){const r=byId(openId);if(!r)return;const v=fm.elements.c.value;fm.elements.c.value='';fm.elements.c.blur();await sendComment(r,v);return}
  if(fm.id==='pollF'){await createPoll(fm);return}
  if(fm.id==='planF'){await savePlan(fm);return}
  if(fm.id==='evF'){await saveEvent(fm);return}
  if(fm.id==='dietF'){await saveDiet(fm);return}
  if(fm.id==='tasteF'){const c=[...fm.querySelectorAll('[name=tc]:checked')].map(x=>x.value),b=+fm.elements.tb.value||0,city=fm.elements.tcity.value.trim().slice(0,40);const ok=await metaSave({tastes:{...(meta.tastes||{}),[myId]:{c,b,city}}});if(ok){toast('הטעם שלך נשמר');fxChk()}return}
  if(fm.id==='spF'){const d=fm.elements.d.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;const kind=fm.elements.kind.value;const x={md:d.slice(5),kind,name:fm.elements.name.value.trim().slice(0,40)||(SPK[kind]||SPK.other)[0],y:d.slice(0,4)};if(special().length>=30){toast('עד 30 ימים מיוחדים');return}if(await setSpecial([...special(),x])){toast('נשמר. נזכיר שבועיים לפני');settingsSheet()}return}
  if(fm.id==='nameF'){const n=fm.elements.n.value.trim().slice(0,30);const {error}=await sb.from('profiles').upsert({user_id:myId,name:n});if(error)toast(errMsg(error));else{myName=n;toast('השם נשמר');await loadMembers();render()}return}
  if(fm.id==='renameF'){const n=fm.elements.n.value.trim().slice(0,40);if(!n)return;const {error}=await sb.from('lists').update({name:n}).eq('id',cur.id);if(error)toast(errMsg(error));else{cur.name=n;await loadLists();cur=lists.find(l=>l.id===cur.id)||cur;setTitle();toast('השם עודכן');settingsSheet()}return}
  if(fm.id==='newListF'){const n=fm.elements.n.value.trim();if(!n)return;const id=await doCreateList(n);if(id){await switchList(id);toast('הקבוצה נוצרה! אפשר להוסיף מקומות ולהזמין חברים.')}return}
  if(fm.id==='joinF'){const c=codeFrom(fm.elements.c.value);if(!c){toast('זה לא נראה כמו קישור הזמנה');return}const id=await doJoin(c);if(id){await switchList(id);toast('הצטרפת לקבוצה!')}return}
  if(false&&fm.id==='memF'){const em=fm.elements.e.value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(em))return;const {error}=await sb.from('members').insert({email:em});if(error&&!/duplicate/i.test(error.message))toast(errMsg(error));else{toast('נוסף. שלחו לה/לו את הקישור.');await loadMembers();settingsSheet()}return}
  if(fm.id!=='ef')return;
  const fd=new FormData(fm),llm=String(fd.get('ll')).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
  const d={name:String(fd.get('name')).trim(),cuisine:String(fd.get('cuisine')).trim(),city:String(fd.get('city')).trim(),address:String(fd.get('address')).trim(),status:fd.get('status')==='been'?'been':'want',price:Number(fd.get('price'))||0,recBy:String(fd.get('recBy')).trim(),mapsUrl:safeUrl(fd.get('mapsUrl')),site:safeUrl(fd.get('site')),woltUrl:(u=>/^https:\/\/([a-z0-9-]+\.)*wolt\.(com|app|onelink\.me)\//i.test(u)?u:'')(safeUrl(String(fd.get('woltUrl')||'').trim())),tags:fd.getAll('tags').map(String),notes:String(fd.get('notes')).trim(),...readHours(fd),updatedAt:Date.now()};
  if(pendDel!==null)d.delivery=pendDel;
  if(llm&&Math.abs(+llm[1])<=90&&Math.abs(+llm[2])<=180){d.lat=+llm[1];d.lng=+llm[2];d.llLevel=String(fd.get('llLevel')||'place')}else{d.lat=null;d.lng=null;d.llLevel=''}
  if(!d.name)return;
  if(mode==='new'&&!fm.dataset.dupOk){const dp=findDup({...d,placeId:formSrc.pid});if(dp&&!(await askSure('המקום כבר בקבוצה',`<b>${esc(dp.name)}</b>${dp.city?' ('+esc(dp.city)+')':''} כבר נמצא בקבוצה. להוסיף אותו שוב?`,'להוסיף בכל זאת')))return}
  const btn=fm.querySelector('[type=submit]');btn.disabled=true;
  if(!Number.isFinite(d.lat)&&(d.address||d.city)){btn.textContent='מאתר את הכתובת…';const p=await geocode(d.address,d.city);if(p){d.lat=+p.lat.toFixed(6);d.lng=+p.lng.toFixed(6);d.llLevel='street'}}
  fitted=false;killFormMap();
  if(d.hh&&!(d.tags||[]).includes('האפי אוור'))d.tags=[...(d.tags||[]),'האפי אוור'];if(formSrc.pid)d.placeId=formSrc.pid;if(mode==='new'||Object.keys(formSrc).length)contribute(d);formSrc={};
  if(mode==='new'){const id=uuid();logAct('add',id,`הוסיף/ה את ${d.name}`);const ok=await save(id,{...d,fav:false,ratings:{},votes:{},dishes:[],photos:[],visits:[],addedBy:myId,createdAt:Date.now()},true);if(ok){openId=id;mode='view';renderDetail();const pg=pendG;pendG=null;if(pg)importGPhotos(id,pg).then(k=>{if(k&&openId===id&&mode==='view')renderDetail()})}else btn.disabled=false}
  else{const eid=openId;mode='view';const ok=await save(eid,d);if(!ok)mode='edit';renderDetail();const pg=pendG;pendG=null;if(ok&&pg&&!(byId(eid).photos||[]).some(p=>p.path))importGPhotos(eid,pg).then(k=>{if(k&&openId===eid&&mode==='view')renderDetail()})}
});
S.addEventListener('change',e=>{if(e.target.id==='bkIn'){const f=e.target.files&&e.target.files[0];e.target.value='';bkFromFile(f);return}if(e.target.name==='sur'){const f=$('.surf');if(f)f.hidden=!e.target.checked;return}if(e.target.id==='evAdd'){const v=e.target.value;e.target.value='';if(v&&evDraft&&!evDraft.stops.includes(v)&&evDraft.stops.length<5){evDraft.stops.push(v);evStopsRender()}return}if(e.target.form&&e.target.form.id==='ef'&&(e.target.name==='address'||e.target.name==='city')){formGeocode();return}if(e.target.classList.contains('rcpt')){const f=e.target.files[0];if(f)scanReceipt(f);e.target.value='';return}if(e.target.id==='impFile'){readImport([...e.target.files]);return}if(e.target.classList.contains('up')){upload([...e.target.files],openId);e.target.value=''}if(e.target.classList.contains('camUp')){camUpload([...e.target.files]);e.target.value=''}});
S.addEventListener('pointerdown',e=>{const t=e.target.closest('[data-act=rxTap]');if(t&&gm&&mode==='game'){e.preventDefault();reactTap(+t.dataset.i)}});
S.addEventListener('click',async e=>{
  const orr=e.target.closest('[data-open-r]');if(orr&&!e.target.closest('a,button')){openDetail(orr.dataset.openR);return}
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,i=Number(b.dataset.i);
  if(a==='pickm'){pick(b.dataset.m,true);return}
  if(a==='pf'){const k=b.dataset.k,v=b.dataset.v;pickF[k]=k==='price'?Number(v):k==='tag'?v:!!v;pick(b.dataset.m,true);return}
  if(a==='pollNew'){clearInterval(pickTimer);pollNewSheet();return}
  if(a==='gameNew'){gm=null;gameSheet();return}
  if(a==='spRm'){const L=special().slice();L.splice(i,1);if(await setSpecial(L))settingsSheet();return}
  if(a==='voice'){voiceAdd(b);return}
  if(a==='moovit'){openMoovit(byId(openId));return}
  if(a==='moovitOut'){const x=nextOuting(60);if(x&&x.id)openMoovit(byId(x.id),x.v);return}
  if(a==='wolt'){const r=byId(openId);if(!r)return;let ok=false;try{await navigator.clipboard.writeText(r.name);ok=true}catch{}
    const d=document.createElement('div');d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label','פתיחת וולט');
    d.innerHTML=`<div class="calp-in"><div class="calp-ic" style="font-size:28px">🛵</div><h3>פותחים את וולט</h3><p class="meta">${ok?`השם <b>${esc(r.name)}</b> הועתק.`:`חפשו בוולט: <b>${esc(r.name)}</b>.`} ייפתח עמוד של וולט בחנות האפליקציות: לוחצים <b>פתיחה</b>, בוולט נכנסים לחיפוש ${ok?'ומדביקים':'ומקלידים את השם'}.</p><a class="btn pri" href="itms-apps://apps.apple.com/app/id943905271" data-wx>לפתיחת וולט</a><button class="link-btn" type="button" data-wx>ביטול</button></div>`;
    d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-wx]'))setTimeout(()=>d.remove(),150)});document.body.appendChild(d);return}
  if(a==='evNew'){clearInterval(pickTimer);evNewSheet(b.dataset.id||'');return}
  if(a==='evD'){const f=$('#evF');if(f)f.elements.d.value=b.dataset.d;return}
  if(a==='evUp'&&evDraft){const s2=evDraft.stops;if(i>0)[s2[i-1],s2[i]]=[s2[i],s2[i-1]];evStopsRender();return}
  if(a==='evRm'&&evDraft){evDraft.stops.splice(i,1);evStopsRender();return}
  if(a==='rsvp'){evRsvp(b.dataset.v);return}
  if(a==='evShare'){evShareFn();return}
  if(a==='evDel'){if(confirmDel(b))evDelete();return}
  if(a==='pushOn'){b.disabled=true;await pushOn();fillPushSec();return}
  if(a==='pushOff'){await pushOff();fillPushSec();return}
  if(a==='pushTest'){b.disabled=true;try{const s2=await pushSub();if(s2)await pushSave(s2);const {data,error}=await sb.functions.invoke('notify',{body:{type:'test'}});if(error)throw error;toast(data&&data.sent?'נשלחה התראת בדיקה 🔔 אם האפליקציה פתוחה, היא תופיע במרכז ההתראות':data&&data.errs&&data.errs.length?'השליחה נדחתה: '+String(data.errs[0]).slice(0,120):'לא נמצא מכשיר רשום. כבו והפעילו את ההתראות מחדש')}catch(e){toast('השליחה נכשלה: '+(e.message||e))}b.disabled=false;return}
  if(a==='ciSet'){lsSet('rs-checkin',b.dataset.v);if(b.dataset.v==='on'){const ok=await getLoc();if(!ok)toast('צריך לאשר גישה למיקום');else autoCheckin()}settingsSheet();return}
  if(a==='pubOn'){pubSet(true);return}
  if(a==='pubOff'){pubSet(false);return}
  if(a==='pubMode'){if(cur.pub_token)pubSet(true,b.dataset.m);else{cur.pub_mode=b.dataset.m;settingsSheet()}return}
  if(a==='pubCopy'){try{await navigator.clipboard.writeText(pubUrl(cur.pub_token));toast('הקישור הועתק')}catch{toast('לא הצלחנו להעתיק')}return}
  if(a==='pubShare'){const u=pubUrl(cur.pub_token);if(navigator.share){try{await navigator.share({title:cur.name+' · Fomo',text:'המקומות שאנחנו ממליצים עליהם 👇',url:u})}catch{}}else{location.href='https://wa.me/?text='+encodeURIComponent('המקומות שאנחנו ממליצים עליהם 👇\n'+u)}return}
  if(a==='planNew'){planSheet(b.dataset.id);return}
  if(a==='planD'){const f=$('#planF');if(f)f.elements.d.value=b.dataset.d;return}
  if(a==='gPhotos'){b.disabled=true;await fetchGPhotosBtn(openId);b.disabled=false;return}
  if(gm&&mode==='game'){
    if(a==='gHow'){readGameSetup();gm.how=b.dataset.v;renderGameSetup();return}
    if(a==='gAdd'){readGameSetup();if(gm.players.length<4){const ns=gameNames();gm.players.push({name:ns[gm.players.length]||'שחקן '+(gm.players.length+1),place:''})}if(GAMES.find(g=>g.k===gm.game).max<gm.players.length)gm.game='dice';renderGameSetup();return}
    if(a==='gRm'){readGameSetup();gm.players.splice(i,1);renderGameSetup();return}
    if(a==='gPick'){readGameSetup();gm.game=b.dataset.k;renderGameSetup();return}
    if(a==='gStart'){gameStart();return}
    if(a==='gBack'||a==='gAgain'){if(gm.s)clearTimeout(gm.s.t);gm.stage='setup';gm.s=null;renderGameSetup();return}
    if(a==='rxGo'){reactGo();return}
    if(a==='tttMv'){tttMove(i);return}
    if(a==='rpsPick'){rpsPick(b.dataset.v);return}
    if(a==='rpsReady'){gm.s.pass=false;rpsRender();return}
    if(a==='rpsNext'){Object.assign(gm.s,{reveal:false,ch:[null,null],turn:0,round:gm.s.round+1});rpsRender();return}
    if(a==='diceRoll'){diceRoll();return}
    if(a==='wheelSpin'){wheelSpin(b);return}
    if(a==='gChoose'){const r=byId(b.dataset.id);if(r){logAct('game',r.id,`${gm.players[gm.w].name} בחר/ה ללכת ל${r.name}`);gameResult(r)}return}
  }
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
  if(a==='add'){addSheet();return}
  if(a==='camPick'){camStep(b.dataset.id);return}
  if(a==='camNear'){locateMe((la,ln)=>camList($('#camQ').value,[la,ln]));return}
  if(a==='placeSearch'){placeSearch();return}
  if(a==='gSearchNow'){gSearchNow();return}
  if(a==='bkFile'){b.disabled=true;await bkFile();b.disabled=false;return}
  if(a==='bkNow'){b.disabled=true;const {error}=await sb.rpc('backup_now',{lid:cur.id});b.disabled=false;toast(error?(/too soon/.test(error.message||'')?'כבר גיבית לפני כמה דקות 🙂':'הגיבוי נכשל: '+errMsg(error)):'הגיבוי נשמר בשרת ✅');fillBackups();return}
  if(a==='bkRestore'){if(!await askSure(`לשחזר את הגיבוי מ־${b.dataset.d}?`,`${esc(b.dataset.n)} המקומות שבגיבוי יחזרו למצב שהיה אז, כולל מקומות שנמחקו. מקומות שנוספו אחרי הגיבוי יישארו. לפני השחזור נשמר גיבוי של המצב הנוכחי, כך שאפשר לבטל.`,'שחזור',true))return;toast('משחזר…');const {data,error}=await sb.rpc('restore_backup',{bid:Number(b.dataset.b)});if(error){toast('השחזור נכשל: '+errMsg(error));return}bkRestoreDone(data);return}
  if(a==='uBlock'){const on=b.dataset.on==='1',n=b.dataset.n;if(!await askSure(on?`לחסום את ${n}?`:`לבטל את החסימה של ${n}?`,on?'המשתמש ינותק ולא יוכל להיכנס, להוסיף או לערוך. הנתונים שלו נשארים, ואפשר לבטל את החסימה בכל רגע.':'המשתמש יוכל להיכנס שוב כרגיל.',on?'חסימה':'ביטול חסימה',on))return;const {error}=await sb.rpc('admin_block',{uid:b.dataset.u,on_:on});toast(error?'הפעולה נכשלה: '+errMsg(error):on?`${n} נחסם/ה`:`החסימה של ${n} בוטלה`);fillQuotaAdm();return}
  if(a==='errClear'){const {error}=await sb.rpc('admin_clear_errors');toast(error?'הפעולה נכשלה':'רשימת התקלות נוקתה');fillQuotaAdm();return}
  if(a==='onb'){resetTips();closeSheet();onbSheet();return}
  if(a==='closeOut'){closeSheet();return}
  if(a==='outOpen'){clearInterval(outTimer);openDetail(b.dataset.id);return}
  if(a==='outEv'){clearInterval(outTimer);evSheet(b.dataset.id);return}
  if(a==='outShare'){outShare();return}
  if(a==='placePick'){placePick(i);return}
  if(a==='fHere'){locateMe((la,ln,acc)=>{setPin(la,ln,true,true);if(acc>60)toast(`דיוק המיקום כ־${Math.round(acc)} מטר. אפשר לגרור את הסיכה.`)});return}
  if(a==='cancel'){killFormMap();if(mode==='new'){closeSheet();return}mode='view';renderDetail();return}
  if(a==='dupOpen'){const id=b.dataset.id;killFormMap();formSrc={};openDetail(id);return}
  if(a==='dupHide'){const f=$('#ef');if(f)f.dataset.dupOk='1';const el=$('#dupN');if(el)el.hidden=true;return}
  if(a==='notGone'){const r=byId(openId);if(r){const ok=await save(r.id,{permClosed:false,updatedAt:Date.now()});if(ok){toast('עודכן, תודה!');renderDetail()}}return}
  if(a==='install'){if(installEvt){installEvt.prompt();installEvt=null;settingsSheet()}return}
  if(a==='shareInvite'){shareOrCopy('Fomo',`הצטרפו לקבוצה "${cur?cur.name:''}" ב-Fomo! פותחים את הקישור, יוצרים חשבון עם מייל וסיסמה, וזהו:`,inviteUrl());return}
  if(a==='qrInvite'){showQR();return}
  if(a==='myData'){b.disabled=true;await myDataDl();b.disabled=false;return}
  if(a==='delMe'){deleteMe();return}
  if(a==='copyInvite'){try{await navigator.clipboard.writeText(inviteUrl());toast('הקישור הועתק')}catch{toast('לא הצלחנו להעתיק')}return}
  if(a==='resetInvite'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='בטוח? לחצו שוב לאיפוס';return}const {data,error}=await sb.rpc('reset_list_code',{lid:cur.id});if(error)toast(errMsg(error));else{cur.join_code=data;toast('נוצר קישור חדש');settingsSheet()}return}
  if(a==='lists'){listsSheet();return}
  if(a==='pkAdd'){b.disabled=true;await registerBio();b.disabled=false;loadPk();return}
  if(a==='pkDel'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='הסר?';b.style.fontSize='14px';return}try{const {error}=await sb.auth.passkey.delete({passkeyId:b.dataset.id});if(error)throw error;toast('הוסר')}catch(e){toast(errMsg(e))}loadPk();return}
  if(a==='pkOffer'){b.disabled=true;await registerBio();closeSheet();return}
  if(a==='pkLater'){closeSheet();return}
  if(a==='pickList'){await switchList(b.dataset.id);return}
  if(a==='leaveList'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='בטוח? לחצו שוב ליציאה';return}const {error}=await sb.from('list_members').delete().eq('list_id',cur.id).eq('user_id',myId);if(error){toast(errMsg(error));return}await afterListGone('יצאת מהקבוצה');return}
  if(a==='delList'){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='למחוק את כל הקבוצה לתמיד? לחצו שוב';return}const paths=rows.flatMap(r=>(r.photos||[]).map(p=>p.path).filter(Boolean));if(paths.length)await sb.storage.from('photos').remove(paths).catch(()=>{});const {error}=await sb.from('lists').delete().eq('id',cur.id);if(error){toast(errMsg(error));return}await afterListGone('הקבוצה נמחקה');return}
  if(a==='shareApp'){appShareDlg();return}
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
  if(a==='del'){delWithUndo(r);return}
  if(a==='reallyDel'){if(await removeRow(r)){closeSheet();toast('נמחק')}return}
  if(a==='vote'){await toggleVote(r.id);return}
  if(a==='rate'){const v=Number(b.dataset.v);const cur=(r.ratings||{})[myId]||0;await save(r.id,{ratings:{[myId]:cur===v?0:v},updatedAt:now});return}
  if(a==='fav'){await save(r.id,{fav:!r.fav,updatedAt:now});return}
  if(a==='verd'){const ds=(r.dishes||[]).map(d=>({...d}));if(!ds[i])return;const order=['ok','must','skip'];ds[i].v=order[(order.indexOf(ds[i].v||'ok')+1)%3];await save(r.id,{dishes:ds,updatedAt:now});return}
  if(a==='rmDish'){await save(r.id,{dishes:(r.dishes||[]).filter((_,j)=>j!==i),updatedAt:now});return}
  if(a==='rmPhoto'){const p=(r.photos||[])[i];const ok=await save(r.id,{photos:(r.photos||[]).filter((_,j)=>j!==i),updatedAt:now});if(ok&&p&&p.path)sb.storage.from('photos').remove([p.path,p.thumb].filter(Boolean)).catch(()=>{});return}
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
function blockedGate(){gate('<p>החשבון הזה הושהה על ידי מנהל האפליקציה.</p><p class="note">אם זו טעות, פנו למי ששלח לכם את הקישור.</p><button class="btn" type="button" id="so2">התנתקות</button>');const b=$('#so2');if(b)b.onclick=async()=>{await sb.auth.signOut();location.reload()}}
function gate(html){const g=$('#gate');g.innerHTML=`<div class="box"><div class="logo">Fomo</div><p class="tag">המקומות שאסור לפספס</p>${html}</div>`;g.hidden=false;$('#app').hidden=true}
function showLogin(email,signup){
  gate(`${joinCode?'<div id="invPv"><p><b>הוזמנתם לקבוצה ב־FOMO! 🎉</b></p></div>':''}<p>${signup?'צרו חשבון עם המייל שלכם ובחרו סיסמה (לפחות 6 תווים).':(pkOK()?'טוב לראות אותך שוב!':'כניסה עם המייל והסיסמה שלכם.')}</p>${!signup&&pkOK()?`<button class="pk-btn" type="button" id="pkIn"><span class="pk-ic">${bioIcon()}<i class="pk-scan"></i></span><span class="pk-tx"><b>כניסה עם ${bioName()}</b><small>מהיר ובטוח, בלי להקליד סיסמה</small></span><svg class="pk-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><div class="or"><span>או עם מייל וסיסמה</span></div>`:''}<form id="lf"><input type="email" id="le" dir="ltr" placeholder="המייל שלך" autocomplete="email" required value="${esc(email||'')}"><input type="password" id="lp" dir="ltr" placeholder="${signup?'סיסמה חדשה':'סיסמה'}" autocomplete="${signup?'new-password':'current-password'}" minlength="6" required><button class="btn" type="submit" ${BRASS}>${signup?'יצירת חשבון וכניסה':'כניסה'}</button></form><div class="err" id="lerr"></div><button class="link" type="button" id="sw">${signup?'כבר יש לי חשבון':'פעם ראשונה כאן? יצירת חשבון'}</button>`);
  $('#sw').onclick=()=>showLogin($('#le').value,!signup);if(joinCode)fxInvPreview(joinCode);
  const pk=$('#pkIn');if(pk)pk.onclick=async()=>{pk.disabled=true;pk.classList.add('busy');$('#lerr').textContent='';try{const {error}=await sb.auth.signInWithPasskey();if(error)throw error;start()}catch(e){pk.disabled=false;pk.classList.remove('busy');if(!pkCancelled(e))$('#lerr').textContent='לא מצאנו '+bioName()+' שמחובר לחשבון במכשיר הזה. היכנסו עם מייל וסיסמה, ואז הפעילו '+bioName()+' בהגדרות.'}};
  $('#lf').addEventListener('submit',async e=>{e.preventDefault();const em=$('#le').value.trim().toLowerCase(),pw=$('#lp').value;const b=e.target.querySelector('button');b.disabled=true;$('#lerr').textContent='';
    const {data,error}=signup?await sb.auth.signUp({email:em,password:pw}):await sb.auth.signInWithPassword({email:em,password:pw});b.disabled=false;
    if(error){const m=error.message||'';$('#lerr').textContent=/invalid login/i.test(m)?'המייל או הסיסמה לא נכונים. אם זו הפעם הראשונה, לחצו "יצירת חשבון".':/already registered|already exists/i.test(m)?'למייל הזה כבר יש חשבון. לחצו "כבר יש לי חשבון".':/not confirmed/i.test(m)?'החשבון ממתין לאישור מייל. בקשו ממי שהקים את האפליקציה לכבות את "Confirm email" ב-Supabase.':/password/i.test(m)?'הסיסמה צריכה להיות לפחות 6 תווים.':'הכניסה נכשלה: '+m;return}
    if(signup&&!data.session){$('#lerr').textContent='החשבון נוצר, אבל ממתין לאישור מייל. בקשו ממי שהקים את האפליקציה לכבות את "Confirm email" ב-Supabase.';return}
    start()})}
function welcome(){gate(`<p><b>ברוכים הבאים${myName?', '+esc(myName):''}!</b></p><p>פתחו קבוצה משלכם, או הצטרפו לקבוצה של מישהו עם קישור ההזמנה שלו.</p>
<form id="wl"><input id="wn" maxlength="40" placeholder="שם הקבוצה, למשל: המסעדות שלנו" required><button class="btn" type="submit" ${BRASS}>יצירת קבוצה חדשה</button></form>
<form id="wj" style="margin-top:18px"><input id="wc" dir="ltr" placeholder="או הדביקו קישור הזמנה" required><button class="btn" type="submit" style="background:#ffffff26;border-color:#ffffffaa;color:#fff">הצטרפות לקבוצה</button></form>
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
  if(!s){if(!joinCode&&needInstallGate())installGate(()=>showLogin('',false));else showLogin('',!!joinCode);return}
  me={id:s.user.id,email:String(s.user.email||'').toLowerCase(),created:s.user.created_at};myId=me.id;
  try{const {data:bl}=await sb.rpc('is_blocked');if(bl===true){blockedGate();return}}catch{}
  try{
    const {data:pr,error:pe}=await sb.from('profiles').select('name').eq('user_id',myId).maybeSingle();if(pe&&isNetErr(pe))throw pe;
    if(!pr)await sb.from('profiles').insert({user_id:myId,name:''});myName=(pr&&pr.name)||'';
    let target=null;
    if(joinCode){const c=joinCode;joinCode='';try{localStorage.removeItem('rs-join')}catch{}const {data:lid}=await sb.rpc('join_list',{code:c});if(lid){target=lid;setTimeout(()=>toast('הצטרפת לקבוצה!'),600)}else setTimeout(()=>toast('קישור ההזמנה לא תקף. בקשו קישור חדש.'),600)}
    await loadLists();
    if(!myName&&!lsGet('rs-fx-done',0)){if(lists.length)cur=lists.find(l=>l.id===target)||lists[0];else cur=null;fxRun(target?'Y':'I');return}
    if(!lists.length){welcome();return}
    let saved='';try{saved=localStorage.getItem('rs-list')||''}catch{}
    cur=lists.find(l=>l.id===(target||saved))||lists.find(l=>l.role==='owner')||lists[0];
  }catch(e){const cl=lsGet('rs-lists',[]);if(cl.length&&isNetErr(e)){lists=cl;let saved='';try{saved=localStorage.getItem('rs-list')||''}catch{}cur=lists.find(l=>l.id===saved)||lists[0]}else{gate(`<p>לא הצלחנו להתחבר לשרת. בדקו את החיבור לאינטרנט.</p><button class="btn" type="button" id="rl" ${BRASS}>ניסיון חוזר</button>`);$('#rl').onclick=()=>location.reload();return}}
  $('#gate').hidden=true;$('#app').hidden=false;
  if(!bound){bindUI();bound=true}
  try{const so=localStorage.getItem('rs-sort');if(so){sort=so;$('#sort').value=so}}catch{}
  route();await switchList(cur.id);subscribe();flushOutbox();
  {const sp=new URLSearchParams(location.search),op=sp.get('open'),ev=sp.get('ev');if(sp.get('next')){history.replaceState(null,'',location.pathname+location.hash);setTimeout(outSheet,500)}if(sp.get('vouchers')){history.replaceState(null,'',location.pathname+location.hash);setTimeout(()=>vouchersSheet(),500)}if(op||ev){history.replaceState(null,'',location.pathname+location.hash);if(ev)setTimeout(()=>{if(events.some(x=>x.id===ev))evSheet(ev);else loadEvents().then(()=>{if(events.some(x=>x.id===ev))evSheet(ev)})},700);else if(op&&byId(op))setTimeout(()=>openDetail(op),300)}}
  const fxT=lsGet('rs-fx-tour','');if(fxGph.length){const G=fxGph;fxGph=[];setTimeout(()=>G.forEach(([id,l])=>importGPhotos(id,l)),3500)}
  pushSync();if(!fxT)setTimeout(pushMaybeAsk,4000);setTimeout(autoCheckin,2500);setTimeout(loadWeather,3000);
  setTimeout(async()=>{if(fxT){fxTour();return}if(lsGet('rs-onb2',0)){whatsNew();return}if(await amAdmin()){lsSet('rs-onb2',1);whatsNew();return}lsSet('rs-seen-ver',APPV);onbSheet()},2800);
  if(!myName)setTimeout(()=>{settingsSheet('me','nameF');toast('איך לקרוא לך? כתבו שם ושמרו.')},500);
  else if(!fxT)offerBio();
  if(!visBound){visBound=true;document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&loaded){loadAll();setTimeout(autoCheckin,1500);setTimeout(loadWeather,2500)}})}
}

/* ================= v29: reliability, backups, admin, onboarding, next outing ================= */
const APPV='55';
/* ---- error tracking: real errors go to the admin panel ---- */
let errN=0;const errSeen=new Set();
function reportErr(msg,src,stack){try{msg=String(msg||'').trim().slice(0,500);if(!msg||!sb||!myId||!navigator.onLine||errN>=8||errSeen.has(msg))return;
  if(/ResizeObserver|^Script error\.?$|Load failed|NetworkError|Failed to fetch|AbortError|operation was aborted|cancell?ed|Importing a module script failed|play\(\) request/i.test(msg))return;
  errSeen.add(msg);errN++;const pg=String(mode==='view'&&openId?'place':mode!=='view'?mode:page).slice(0,60);
  sb.from('app_errors').insert({user_id:myId,msg,src:String(src||'').slice(0,300),stack:String(stack||'').slice(0,2000),ua:navigator.userAgent.slice(0,300),ver:APPV,page:pg}).then(()=>{},()=>{})}catch{}}
window.addEventListener('error',e=>{if(e.message)reportErr(e.message,String(e.filename||'').split('/').pop()+':'+(e.lineno||'')+':'+(e.colno||''),e.error&&e.error.stack)});
window.addEventListener('unhandledrejection',e=>{const r=e.reason;reportErr(r&&(r.message||r),'promise',r&&r.stack)});
const uaName=ua=>{ua=String(ua||'');return /iPhone/.test(ua)?'אייפון':/iPad/.test(ua)?'אייפד':/Android/.test(ua)?'אנדרואיד':/Macintosh/.test(ua)?'מק':/Windows/.test(ua)?'מחשב':'מכשיר'};

/* ---- small confirm dialog ---- */
function askSure(title,body,ok,danger){return new Promise(res=>{const d=document.createElement('div');d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label',title);
  d.innerHTML=`<div class="calp-in"><h3>${esc(title)}</h3>${body?`<p class="meta">${body}</p>`:''}<button class="btn pri ${danger?'danger':''}" type="button" data-y>${esc(ok||'אישור')}</button><button class="link-btn" type="button" data-n>ביטול</button></div>`;
  const done=v=>{d.remove();res(v)};d.addEventListener('click',e=>{if(e.target.closest('[data-y]'))done(true);else if(e.target===d||e.target.closest('[data-n]'))done(false)});document.body.appendChild(d);setTimeout(()=>{const b=d.querySelector('[data-n]');if(b)b.focus()},50)})}

/* ---- backups ---- */
const KINDN={auto:'שבועי אוטומטי',manual:'ידני','before-restore':'לפני שחזור'};
function backupSecHtml(){const own=isOwner();return `<div class="sec"><h4>גיבוי ושחזור</h4><p class="note" style="margin:0 0 10px">כל יום ראשון בלילה נשמר גיבוי אוטומטי של הקבוצה בשרת (6 האחרונים נשמרים). אפשר גם להוריד עותק לטלפון.</p>
<div class="row"><button class="btn" type="button" data-act="bkFile">${ICON.share}הורדת גיבוי לקובץ</button>${own?`<button class="btn" type="button" data-act="bkNow">גיבוי עכשיו</button><label class="btn">שחזור מקובץ<input type="file" id="bkIn" accept=".json,application/json" hidden></label>`:''}</div>
<div id="bkList" style="margin-top:10px"><p class="note" style="margin:0">טוען גיבויים…</p></div></div>`}
async function fillBackups(){const el=$('#bkList');if(!el||!cur||!sb)return;let L=null;try{const {data,error}=await sb.rpc('my_backups',{lid:cur.id});if(!error)L=data||[]}catch{}if(!$('#bkList'))return;const own=isOwner();
  if(L===null){el.innerHTML='<p class="note" style="margin:0">אין חיבור לשרת כרגע.</p>';return}
  el.innerHTML=L.length?`<div class="bkl">${L.map(b=>`<div class="bk"><span><b>${esc(fmtD(String(b.at).slice(0,10),{weekday:'short',day:'numeric',month:'long'}))}</b> <small class="meta">${esc(new Date(b.at).toTimeString().slice(0,5))} · ${esc(KINDN[b.kind]||b.kind)} · ${b.n} מקומות</small></span>${own?`<button class="btn sm" type="button" data-act="bkRestore" data-b="${b.id}" data-n="${b.n}" data-d="${esc(fmtD(String(b.at).slice(0,10),{day:'numeric',month:'long'}))}">שחזור</button>`:''}</div>`).join('')}</div>`:'<p class="note" style="margin:0">עוד אין גיבויים בשרת. הראשון ייווצר ביום ראשון בלילה.</p>'}
async function bkFile(){let R=null,E=[];try{const {data,error}=await sb.from('restaurants').select('id,data').eq('list_id',cur.id);if(error)throw error;R=data||[];const ev=await sb.from('events').select('*').eq('list_id',cur.id);E=(ev.data||[]).map(({list_id,...x})=>x)}catch{R=rows.map(({id,...data})=>({id,data}))}
  const payload={app:'fomo',v:1,list:cur.name,at:new Date().toISOString(),restaurants:R,events:E};const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
  const name=`fomo-${String(cur.name||'list').replace(/[^\p{L}\p{N}]+/gu,'-')}-${today()}.json`;
  if(isIOS()&&navigator.canShare){const file=new File([blob],name,{type:'application/json'});if(navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'גיבוי Fomo'});return}catch(e){if(e&&e.name==='AbortError')return}}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);toast(`הגיבוי ירד: ${R.filter(x=>!(x.data||{})._meta).length} מקומות`)}
async function bkRestoreDone(n){toast(`שוחזרו ${n} מקומות ✅`);await loadAll();loadEvents();fillBackups()}
async function bkFromFile(f){if(!f)return;let p=null;try{p=JSON.parse(await f.text())}catch{}
  if(!p||p.app!=='fomo'||!Array.isArray(p.restaurants)){toast('זה לא קובץ גיבוי של Fomo');return}
  const n=p.restaurants.filter(x=>x&&x.data&&!x.data._meta).length;
  if(!await askSure(`לשחזר ${n===1?'מקום אחד':n+' מקומות'} מהקובץ?`,`הגיבוי מ־${esc(fmtD(String(p.at||'').slice(0,10),{day:'numeric',month:'long',year:'numeric'}))}. מקומות מהקובץ יחזרו למצב שהיה בגיבוי, ומקומות שנוספו אחריו יישארו. לפני השחזור נשמר גיבוי של המצב הנוכחי, כך שאפשר לבטל.`,'שחזור',true))return;
  toast('משחזר…');const {data,error}=await sb.rpc('restore_rows',{lid:cur.id,payload:p});if(error){toast('השחזור נכשל: '+errMsg(error));return}bkRestoreDone(data)}

/* ---- offline: periodic sync ---- */
setInterval(()=>{if(navigator.onLine&&sb&&myId&&lsGet('rs-outbox',[]).length)flushOutbox()},30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&navigator.onLine&&sb&&myId)flushOutbox()});

/* ---- performance: small thumbnails for existing cover photos ---- */
let thBusy=false;
async function thumbBackfill(){if(thBusy||!navigator.onLine||!sb)return;const c=navigator.connection;if(c&&(c.saveData||/2g/.test(c.effectiveType||'')))return;thBusy=true;let n=0;try{
  for(const r of rows.slice()){if(n>=8)break;const ph=r.photos||[];const i=ph.findIndex(p=>p.path);if(i<0||ph[i].thumb)continue;n++;
    try{const u=await signed(ph[i].path);if(!u)continue;const res=await fetch(u);if(!res.ok)continue;const t=await shrink(await res.blob(),520,.78);const tp=ph[i].path.replace(/([^/]+)$/,'t_$1');
      const {error}=await sb.storage.from('photos').upload(tp,t,{contentType:'image/jpeg',upsert:false});if(error&&!/exist|duplicate/i.test(error.message||''))continue;
      const c2=byId(r.id);if(!c2)continue;const p2=(c2.photos||[]).slice();const j=p2.findIndex(p=>p.path===ph[i].path);if(j<0)continue;p2[j]={...p2[j],thumb:tp};await save(r.id,{photos:p2})}catch{}
    await new Promise(z=>setTimeout(z,900))}}finally{thBusy=false}}

/* ---- admin: users + errors ---- */
async function fillAdminMore(){const el=$('#qAdm');if(!el||!sb)return;let U=null,E=null;try{const [a,b]=await Promise.all([sb.rpc('admin_users'),sb.rpc('admin_errors')]);U=a.data;E=b.data}catch{}if(!$('#qAdm'))return;
  const wk=Date.now()-7*864e5;let h='';const nm=u=>u.name||String(u.email||'').split('@')[0];
  if(U){const act=U.filter(u=>u.seen&&new Date(u.seen)>wk).length,nw=U.filter(u=>new Date(u.joined)>wk).length;
    h+=`<h4 style="margin-top:18px">משתמשים</h4><div class="ustat"><div><b>${U.length}</b><small>רשומים</small></div><div><b>${act}</b><small>פעילים השבוע</small></div><div><b>${nw}</b><small>הצטרפו השבוע</small></div></div>
<details class="ulist"><summary>כל המשתמשים (${U.length})</summary>${U.map(u=>`<div class="urow ${u.blocked?'blk':''}"><span><b>${esc(nm(u))}</b>${u.admin?' <small class="meta">· מנהל</small>':''}${u.blocked?' <small class="bad">· חסום</small>':''}<br><small class="meta" dir="ltr">${esc(u.email||'')}</small><br><small class="meta">הצטרפות ${esc(relT(u.joined))} · נראה ${u.seen?esc(relT(u.seen)):'אף פעם'} · ${u.places} מקומות · ${u.lists} קבוצות</small></span>${u.admin?'':`<button class="btn sm" type="button" data-act="uBlock" data-u="${esc(u.id)}" data-on="${u.blocked?0:1}" data-n="${esc(nm(u))}">${u.blocked?'ביטול חסימה':'חסימה'}</button>`}</div>`).join('')}</details>`}
  if(E){const L=E.list||[];h+=`<h4 style="margin-top:18px">תקלות באפליקציה</h4><p class="note" style="margin:0 0 8px">${E.week?`${E.week} תקלות נרשמו בשבוע האחרון.`:'אין תקלות בשבוע האחרון 🎉'}</p>${L.length?`<details class="ulist"><summary>פירוט (${L.length} סוגים)</summary>${L.map(x=>`<div class="erow"><b dir="ltr">${esc(x.msg)}</b><small class="meta">${x.n} פעמים · ${x.users} משתמשים · אחרונה ${esc(relT(x.last))} אצל ${esc(x.who||'?')} · ${esc(uaName(x.ua))} · גרסה ${esc(x.ver||'?')}</small>${x.src?`<small class="meta" dir="ltr">${esc(x.src)}</small>`:''}</div>`).join('')}<button class="btn sm" type="button" data-act="errClear" style="margin-top:8px">ניקוי הרשימה</button></details>`:''}`}
  h+=await usageHtml();h+=await featHtml();if(!$('#qAdm'))return;let box=$('#admMore');if(!box){box=document.createElement('div');box.id='admMore';$('#qAdm').appendChild(box)}box.innerHTML=h}

/* ---- onboarding for new friends ---- */
const ONB=[{e:'🍽️',t:'ברוכים הבאים ל־FOMO',p:'כל המקומות שאסור לפספס במקום אחד: מסעדות, ברים ובתי קפה, עם תמונות, דירוגים, מפה וזיכרונות מכל יציאה. הכל משותף עם מי שבקבוצה.'},
  {e:'🔎',t:'מוסיפים מקום בשניות',p:'לוחצים על ＋ וכותבים שם, גם עם שגיאות כתיב, או מדביקים קישור. ה־AI מבין, והשם, הכתובת, הסוג ושעות הפתיחה מתמלאים לבד.'},
  {e:'🥂',t:'מתכננים ויוצאים',p:'"בא לי" על מקומות, התאמה כששניכם רוצים, קביעת יציאה עם ספירה לאחור, Waze ומוביט בלחיצה, וסריקת קבלה שממלאת את המנות.'},
  {e:'🎁',t:'ועוד כמה הפתעות',p:'ארנק שוברים עם תזכורות, האפי אוור, סינון "פתוח עכשיו" ו"קרוב אליי", והתראה כל חמישי לתכנן את הסופ"ש.'},
  {e:'📲',t:'שמים במסך הבית',inst:true}];
function onbInst(){return isStandalone()?'מעולה, האפליקציה כבר מותקנת 🎉 כדאי להפעיל התראות בהגדרות, כדי לדעת כשמישהו מוסיף מקום, מגיב או קובע יציאה.'
  :isSamsung()?'בדפדפן של סמסונג ההתקנה נחסמת אצל גוגל, אז מתקינים דרך <b>Chrome</b>: <a href="'+CHROME_URL+'"><b>פתיחה ב־Chrome</b></a>, ושם בתפריט (⋮) בוחרים <b>"התקנת אפליקציה"</b>.'
  :isIOS()?'בספארי לוחצים על כפתור השיתוף <b>⬆️</b> בתחתית המסך, גוללים ובוחרים <b>"הוספה למסך הבית"</b>. ככה FOMO נפתחת כמו אפליקציה רגילה, ואפשר לקבל התראות.'
  :installEvt?'לוחצים על הכפתור למטה, ו־FOMO תיפתח כמו אפליקציה רגילה עם התראות.':'בתפריט הדפדפן (⋮) בוחרים <b>"התקנת אפליקציה"</b> או <b>"הוספה למסך הבית"</b>.'}
const needOnb=()=>!lsGet('rs-onb',0)&&me&&me.created&&Date.now()-new Date(me.created).getTime()<14*864e5;
function onbSheet(){if($('.onb'))return;let i=0;const d=document.createElement('div');d.className='onb';d.dir='rtl';d.setAttribute('role','dialog');d.setAttribute('aria-label','הדרכה קצרה');
  const draw=()=>{const s=ONB[i],last=i===ONB.length-1;d.innerHTML=`<div class="onb-in"><button class="onb-skip" type="button" data-o="end">דלג</button><div class="onb-e" aria-hidden="true">${s.e}</div><h2>${esc(s.t)}</h2><p>${s.inst?onbInst():esc(s.p)}</p>
<div class="onb-dots">${ONB.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div><div class="onb-b">${last&&installEvt&&!isStandalone()?'<button class="btn" type="button" data-o="inst">התקנה</button>':''}${i?'<button class="btn" type="button" data-o="prev">הקודם</button>':''}<button class="btn pri" type="button" data-o="${last?'end':'next'}">${last?'יאללה, מתחילים':'הבא'}</button></div></div>`;
    const b=d.querySelector('[data-o=next],[data-o=end]:not(.onb-skip)');if(b)b.focus()};
  const end=()=>{lsSet('rs-onb',1);lsSet('rs-onb2',1);d.classList.add('out');setTimeout(()=>{d.remove();maybeTour(page,500)},250)};
  d.addEventListener('click',e=>{const o=(e.target.closest('[data-o]')||{}).dataset;if(!o||!o.o)return;if(o.o==='next'&&i<ONB.length-1){i++;draw()}else if(o.o==='prev'&&i>0){i--;draw()}else if(o.o==='inst'&&installEvt){installEvt.prompt();installEvt=null;draw()}else if(o.o==='end')end()});
  let x0=null;d.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});d.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)<50)return;if(dx>0&&i<ONB.length-1){i++;draw()}else if(dx<0&&i>0){i--;draw()}},{passive:true});
  draw();document.body.appendChild(d)}

/* ---- next outing: full screen with live countdown (opens from the morning notification) ---- */
let outTimer=null;
function outSheet(){const x=nextOuting(60);killFormMap();openId=null;mode='out';openSheet();clearInterval(outTimer);
  if(!x){$('#sb').innerHTML=`<div class="sec dh"><h2>היציאה הבאה</h2></div><div class="empty"><h2>אין יציאה מתוכננת</h2><p>בוחרים מקום ולוחצים "קביעת יציאה". הספירה לאחור תופיע כאן ובמסך הראשי.</p><button class="btn pri" type="button" data-act="closeOut">לקבוצה</button></div>`;return}
  const r=x.id?byId(x.id):null,ev=x.ev?(typeof events!=='undefined'?events:[]).find(e=>e.id===x.ev):null,v=x.v,ph=r&&(r.photos||[]).find(p=>p.path);
  const when=fmtD(v.d,{weekday:'long',day:'numeric',month:'long'})+(v.t?' · '+v.t:'');outSheet.x={title:x.title,when,r};
  const who=r?withOf(v):[],must=r?(r.dishes||[]).filter(d=>d.v==='must').map(d=>d.name).slice(0,6):[];
  $('#sb').innerHTML=`<div class="out"><div class="out-hero">${ph?photoImg(ph):r?plate(r.name):''}<div class="out-shade"></div><div class="out-top"><span class="out-k">${x.sur?'🤫 יציאת הפתעה':ev?'🎉 ערב עם חברים':'🍽️ היציאה הבאה'}</span><h2>${esc(x.title)}</h2><p>${esc(when)}</p></div></div>
<div class="out-cd" id="outCd" aria-live="off"></div>
<div class="sec out-info">${r&&(r.address||r.city)?`<p>📍 ${esc([r.address,r.city].filter(Boolean).join(', '))}</p>`:''}${who.length?`<p>👥 עם ${esc(who.join(', '))}</p>`:''}<p id="outWx" hidden></p>${x.sur?'<p>מישהו מתכנן לכם הפתעה. פנו את הערב, והפרטים יתגלו ביום עצמו 😉</p>':''}${ev&&ev.note?`<p>📝 ${esc(ev.note)}</p>`:''}</div>
${must.length?`<div class="sec"><h4>חובה להזמין</h4><div class="mchips">${must.map(m=>`<span>${esc(m)}</span>`).join('')}</div></div>`:''}
<div class="sec out-acts">${r?`<a class="btn pri" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}נסיעה עם Waze</a>${moovitOk(r)?`<button class="btn" type="button" data-act="moovitOut">🚌 מוביט</button>`:''}<a class="btn" href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">${ICON.pin}מפות</a><a class="btn" href="${esc(gcalUrl(r,v))}" target="_blank" rel="noopener">📅 ליומן</a><a class="btn" href="${esc(bookUrl(r))}" target="_blank" rel="noopener">🪑 הזמנת מקום</a><button class="btn" type="button" data-act="outOpen" data-id="${esc(r.id)}">לדף המקום</button>`:''}${ev?`<button class="btn pri" type="button" data-act="outEv" data-id="${esc(ev.id)}">לפרטי הערב</button>`:''}${x.sur?'':`<button class="btn" type="button" data-act="outShare">${ICON.share}שיתוף</button>`}</div></div>`;
  hydrate();outTick();outTimer=setInterval(outTick,1000);if(r&&hasLL(r))outWx(r,v.d)}
function outTick(){const el=$('#outCd');if(!el||mode!=='out'||$('#ov').hidden){clearInterval(outTimer);outTimer=null;return}const x=nextOuting(60);if(!x)return;const ms=x.at-Date.now();
  if(ms<=0){el.innerHTML='<div class="out-now">יוצאים עכשיו! 🥳</div>';return}
  const s=Math.floor(ms/1e3),D=Math.floor(s/86400),H=Math.floor(s%86400/3600),M=Math.floor(s%3600/60),Z=s%60;
  el.innerHTML=[[D,'ימים'],[H,'שעות'],[M,'דקות'],[Z,'שניות']].filter((p,k)=>k||p[0]).map(([n,l])=>`<div><b>${String(n).padStart(2,'0')}</b><small>${l}</small></div>`).join('')}
async function outWx(r,d){const dd=daysTo(d);if(dd<0||dd>6)return;try{const j=await fetchJ(`https://api.open-meteo.com/v1/forecast?latitude=${r.lat.toFixed(2)}&longitude=${r.lng.toFixed(2)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${d}&end_date=${d}`,8000);
  const D=j.daily;if(!D||!D.time||!D.time.length)return;const k=WXK(D.weather_code[0]),e={storm:'⛈️',snow:'🌨️',rain:'🌧️',fog:'🌫️',clear:'☀️',cloud:'⛅'}[k],pp=(D.precipitation_probability_max||[])[0];
  const el=$('#outWx');if(!el)return;el.hidden=false;el.textContent=`${e} ${Math.round(D.temperature_2m_min[0])}°–${Math.round(D.temperature_2m_max[0])}° באותו יום${pp>=30?` · ${pp}% סיכוי לגשם`:''}${k==='rain'||k==='storm'?' · כדאי מטרייה ☂️':''}`}catch{}}
async function outShare(){const o=outSheet.x;if(!o)return;const text=`יוצאים ל${o.title}, ${o.when} 🎉`;const url=o.r?mapsUrl(o.r):location.origin+location.pathname;
  try{if(navigator.share){await navigator.share({title:'FOMO',text,url});return}}catch(e){if(e&&e.name==='AbortError')return}try{await navigator.clipboard.writeText(text+'\n'+url);toast('הועתק, אפשר להדביק')}catch{toast(text)}}
function outBadge(){try{if(!('setAppBadge' in navigator))return;const x=nextOuting(1);(x&&x.v.d===today()?navigator.setAppBadge(1):navigator.clearAppBadge()).catch(()=>{})}catch{}}

/* ================= v33: interface ================= */
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---- live open/closed status ---- */
function openInfo(r){if(r.permClosed)return {c:'off gone',t:'⛔ נסגר לצמיתות'};const o=openState(r);if(!o)return null;const n=new Date(),m=n.getHours()*60+n.getMinutes(),H=r.hours||{};
  if(o.open){const left=(hm(o.until)-m+1440)%1440;return left<=60?{c:'soon',t:`נסגר בעוד ${left} דק'`}:{c:'on',t:`פתוח עד ${o.until}`}}
  if(o.from){const inn=hm(o.from)-m;return inn<=60?{c:'soon',t:`נפתח בעוד ${inn} דק'`}:{c:'off',t:`נפתח ב־${o.from}`}}
  const d=n.getDay();for(let k=1;k<=7;k++){const h=H[(d+k)%7];if(h)return {c:'off',t:k===1?`נפתח מחר ${h[0]}`:`נפתח ביום ${DAYS[(d+k)%7]} ${h[0]}`}}
  return {c:'off',t:'סגור'}}
function liveSt(r){const i=openInfo(r);return i?`<span class="open ${i.c}" data-ost="${esc(r.id)}">${esc(i.t)}</span>`:''}
setInterval(()=>{if(document.visibilityState!=='visible')return;document.querySelectorAll('[data-ost]').forEach(el=>{const r=byId(el.dataset.ost);const i=r&&openInfo(r);if(!i)return;el.className='open '+i.c;el.textContent=i.t})},60000);

/* ---- skeleton cards ---- */
const SKEL='<div class="skel" aria-hidden="true"><div class="sk-c"></div><div class="sk-b"><i style="width:70%"></i><i style="width:45%"></i><i style="width:55%"></i></div></div>';

/* ---- undo delete ---- */
const delQ=new Map();
function undoToast(msg,onUndo,ms){const el=$('#utoast');if(!el)return;$('#utTxt').textContent=msg;el.hidden=false;const bar=$('#utBar');bar.style.transition='none';bar.style.transform='scaleX(1)';requestAnimationFrame(()=>{bar.style.transition=`transform ${ms}ms linear`;bar.style.transform='scaleX(0)'});
  clearTimeout(undoToast.t);undoToast.t=setTimeout(()=>{el.hidden=true},ms);$('#utBtn').onclick=()=>{clearTimeout(undoToast.t);el.hidden=true;onUndo()}}
function delWithUndo(r){if(!r||delQ.has(r.id))return;const snap=byId(r.id);rows=rows.filter(x=>x.id!==r.id);closeSheetAnim(true);render();
  delQ.set(r.id,{r:snap,t:setTimeout(()=>commitDel(r.id),6000)});
  undoToast(`"${r.name}" נמחק`,()=>{const p=delQ.get(r.id);if(!p)return;clearTimeout(p.t);delQ.delete(r.id);if(!byId(r.id))rows.unshift(p.r);render();toast('המחיקה בוטלה')},6000)}
async function commitDel(id){const p=delQ.get(id);if(!p)return;clearTimeout(p.t);delQ.delete(id);const ok=await removeRow(p.r);if(ok)logAct('del',id,`מחק/ה את ${p.r.name}`);else{if(!byId(id))rows.unshift(p.r);render()}}
const flushDel=()=>{for(const id of [...delQ.keys()])commitDel(id)};
window.addEventListener('pagehide',flushDel);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushDel()});

/* ---- card -> sheet transition (FLIP) ---- */
let flipFrom=null;
function flipIn(fr){const ov=$('#ov'),sh=ov&&ov.querySelector('.sheet');if(!sh||RM()||!sh.animate)return;const b=sh.getBoundingClientRect();const h=Math.min(b.height,innerHeight);if(!b.width||!h)return;
  sh.classList.add('flip');ov.animate([{backgroundColor:'transparent'},{}],{duration:260,easing:'ease-out'});
  const a=sh.animate([{transformOrigin:'0 0',transform:`translate(${fr.left-b.left}px,${fr.top-b.top}px) scale(${fr.width/b.width},${fr.height/h})`,borderRadius:'22px',opacity:.35},{transformOrigin:'0 0',transform:'none',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.85,.25,1)'});
  a.onfinish=()=>sh.classList.remove('flip')}
function closeSheetAnim(fast){const ov=$('#ov'),sh=ov&&ov.querySelector('.sheet');if(!ov||ov.hidden){return}
  if(fast||RM()||!sh||!sh.animate||ov.classList.contains('story-ov')){closeSheet();return}
  const id=openId,card=id&&page==='list'&&document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);const cr=card&&card.getBoundingClientRect();const b=sh.getBoundingClientRect();const h=Math.min(b.height,innerHeight);
  const vis=cr&&cr.bottom>0&&cr.top<innerHeight;
  const to=vis?{transformOrigin:'0 0',transform:`translate(${cr.left-b.left}px,${cr.top-b.top}px) scale(${cr.width/b.width},${cr.height/h})`,borderRadius:'22px',opacity:0}:{transform:`translateY(${innerHeight*.6}px)`,opacity:0};
  ov.animate([{},{backgroundColor:'transparent'}],{duration:260,fill:'forwards'});
  const a=sh.animate([{transformOrigin:'0 0',transform:'none',opacity:1},to],{duration:vis?320:260,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  a.onfinish=()=>{closeSheet();a.cancel();ov.getAnimations().forEach(x=>x.cancel())}}

/* ---- drag the sheet down to close ---- */
(function(){const ov=$('#ov');if(!ov)return;let y0=null,x0=0,dy=0,t0=0,drag=false;
  ov.addEventListener('touchstart',e=>{y0=null;if(ov.classList.contains('story-ov')||e.touches.length>1)return;if(e.target.closest('.leaflet-container,input,textarea,select,[contenteditable],.res,.hscroll,.gal,.chips,.seg'))return;if(ov.scrollTop>2)return;y0=e.touches[0].clientY;x0=e.touches[0].clientX;dy=0;t0=Date.now();drag=false},{passive:true});
  ov.addEventListener('touchmove',e=>{if(y0==null)return;const t=e.touches[0],d=t.clientY-y0,dx=Math.abs(t.clientX-x0);
    if(!drag){if(d>8&&d>dx*1.5&&ov.scrollTop<=0)drag=true;else{if(Math.abs(d)>8||dx>8)y0=null;return}}
    dy=Math.max(0,d);const sh=ov.querySelector('.sheet');sh.style.transition='none';sh.style.transform=`translateY(${dy}px)`;ov.style.background=`rgba(42,22,48,${Math.max(0,.35-dy/1200)})`},{passive:true});
  const end=()=>{if(y0==null||!drag){y0=null;return}const sh=ov.querySelector('.sheet'),v=dy/Math.max(1,Date.now()-t0);y0=null;drag=false;sh.style.transition='transform .26s cubic-bezier(.2,.8,.2,1)';
    if(dy>110||v>.6){sh.style.transform=`translateY(${innerHeight}px)`;setTimeout(()=>{closeSheet();sh.style.transform='';sh.style.transition='';ov.style.background=''},240)}
    else{sh.style.transform='';ov.style.background='';setTimeout(()=>{sh.style.transition=''},280)}};
  ov.addEventListener('touchend',end);ov.addEventListener('touchcancel',end)})();

/* ---- pull to refresh (installed app only; browsers have their own) ---- */
(function(){const ind=$('#ptr');if(!ind)return;let y0=null,dy=0,busy=false;const on=()=>isStandalone()&&(page==='list'||page==='timeline'||page==='me');
  document.addEventListener('touchstart',e=>{y0=null;if(busy||!on()||!$('#ov').hidden||document.querySelector('.onb,.calp')||window.scrollY>0||e.touches.length>1)return;if(e.target.closest('.leaflet-container,.res,input,textarea,select'))return;y0=e.touches[0].clientY;dy=0},{passive:true});
  document.addEventListener('touchmove',e=>{if(y0==null)return;dy=e.touches[0].clientY-y0;if(window.scrollY>0||dy<=0){ind.classList.remove('vis','ready');ind.style.transform='';return}
    const p=Math.min(dy*.5,90);ind.classList.add('vis');ind.classList.toggle('ready',p>64);ind.style.transform=`translate(-50%,${p}px)`;ind.firstElementChild.style.transform=`rotate(${p>64?180:Math.round(p*2)}deg)`},{passive:true});
  document.addEventListener('touchend',async()=>{if(y0==null)return;y0=null;const p=Math.min(dy*.5,90);
    if(p>64&&!busy){busy=true;ind.classList.add('spin');ind.style.transform='translate(-50%,64px)';try{await Promise.all([loadAll(),loadEvents()])}catch{}await new Promise(z=>setTimeout(z,350));busy=false;toast('עודכן ✓')}
    ind.classList.remove('vis','ready','spin');ind.style.transform='';ind.firstElementChild.style.transform=''})})();

/* ---- "outings" tab: what's coming up ---- */
function renderSoon(){const el=$('#soon');if(!el)return;if(!loaded){el.innerHTML='';return}const up=upcoming(),evs=(events||[]).filter(e=>e.d>=today()),sur=surprisesForMe();
  const items=[...up.map(u=>({d:u.v.d,t:u.v.t||'',k:'p',u})),...evs.map(e=>({d:e.d,t:e.t||'',k:'e',e})),...sur.map(s=>({d:s.v.d,t:s.v.t||'',k:'s'}))].sort((a,b)=>(a.d+a.t).localeCompare(b.d+b.t)).slice(0,10);
  const x=nextOuting(60);
  el.innerHTML=`<h2 class="soon-h">בקרוב</h2>${x?`<button type="button" class="soon-hero" data-soon="out"><span class="sh-k">${x.sur?'🤫 יציאת הפתעה':x.ev?'🎉 הערב הבא':'🍽️ היציאה הבאה'}</span><b>${esc(x.title)}</b><span>${esc(whenTxt(x.v))}</span><span class="sh-cd">${esc(cdText(x).big)}</span></button>`:''}
${items.length?`<div class="soon-list">${items.map(it=>{const dd=it.d,day=fmtD(dd,{weekday:'short'}),num=fmtD(dd,{day:'numeric',month:'short'});
  if(it.k==='p'){const w=withOf(it.u.v);return `<button type="button" class="soon-it" data-soon="p" data-id="${esc(it.u.r.id)}"><span class="si-d"><small>${esc(day)}</small><b>${esc(num)}</b></span><span class="si-b"><b>${esc(it.u.r.name)}</b><small>${esc([it.t,w.length?'עם '+w.join(', '):''].filter(Boolean).join(' · '))}</small></span></button>`}
  if(it.k==='e')return `<button type="button" class="soon-it" data-soon="e" data-id="${esc(it.e.id)}"><span class="si-d"><small>${esc(day)}</small><b>${esc(num)}</b></span><span class="si-b"><b>🎉 ${esc(it.e.title||'ערב עם חברים')}</b><small>${esc([it.t,(it.e.stops||[]).length?(it.e.stops.length+' תחנות'):''].filter(Boolean).join(' · '))}</small></span></button>`;
  return `<div class="soon-it"><span class="si-d"><small>${esc(day)}</small><b>${esc(num)}</b></span><span class="si-b"><b>🤫 הפתעה</b><small>הפרטים יתגלו ביום עצמו</small></span></div>`}).join('')}</div>`
  :`<div class="soon-empty"><p>אין יציאות מתוכננות.</p><p class="note" style="margin:0">בוחרים מקום מהקבוצה ולוחצים "קביעת יציאה", או יוצרים ערב עם כמה תחנות.</p><button class="btn" type="button" data-soon="ev">🎉 ערב חדש עם חברים</button></div>`}
<h2 class="soon-h" style="margin-top:22px">איפה היינו</h2>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-soon]');if(!b)return;const k=b.dataset.soon;if(k==='out')outSheet();else if(k==='p')openDetail(b.dataset.id);else if(k==='e')evSheet(b.dataset.id);else if(k==='ev')evNewSheet()});

/* ---- "me" tab + display settings ---- */
const curFs=()=>document.documentElement.dataset.fs||'1';
function dispHtml(){const fs=curFs(),hc=!!document.documentElement.dataset.hc;return `<label class="l" style="margin-top:0">גודל טקסט</label><div class="seg" role="group" aria-label="גודל טקסט">${[['1','רגיל'],['2','גדול'],['3','גדול מאוד']].map(([k,t])=>`<button type="button" data-fs="${k}" aria-pressed="${fs===k}">${t}</button>`).join('')}</div>
<label class="chip" style="margin-top:12px"><input type="checkbox" data-hc ${hc?'checked':''}><span>ניגודיות גבוהה</span></label>`}
function setFs(k){try{if(k==='1')localStorage.removeItem('rs-fs');else localStorage.setItem('rs-fs',k)}catch{}if(k==='1')delete document.documentElement.dataset.fs;else document.documentElement.dataset.fs=k;document.querySelectorAll('[data-fs]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fs===k)));if(lmap)setTimeout(()=>lmap.invalidateSize(),100)}
function setHc(on){try{if(on)localStorage.setItem('rs-hc','1');else localStorage.removeItem('rs-hc')}catch{}if(on)document.documentElement.dataset.hc='1';else delete document.documentElement.dataset.hc}
document.addEventListener('click',e=>{const b=e.target.closest('[data-fs]');if(b&&b.tagName==='BUTTON')setFs(b.dataset.fs)});
document.addEventListener('change',e=>{if(e.target.matches('[data-hc]'))setHc(e.target.checked)});
function renderMe(){const el=$('#me');if(!el)return;const nmMe=myName||String((me&&me.email)||'').split('@')[0]||'אני';
  const been=rows.filter(r=>r.status==='been').length,want=rows.length-been,vis=allVisits().length;
  el.innerHTML=`<div class="me-card"><div class="me-av" aria-hidden="true">${esc(nmMe.trim().charAt(0))}</div><div><h2>${esc(nmMe)}</h2><p class="meta">${esc(cur?cur.name:'')}</p></div></div>
<div class="me-stats"><div><b>${been}</b><small>היינו</small></div><div><b>${want}</b><small>רוצים ללכת</small></div><div><b>${vis}</b><small>ביקורים</small></div></div>
<div class="me-grid"><button type="button" data-me="out"><span aria-hidden="true">🍽️</span>היציאה הבאה</button><a href="#stats"><span aria-hidden="true">📊</span>הנתונים שלנו</a><button type="button" data-me="lists"><span aria-hidden="true">📋</span>הקבוצות שלי</button><button type="button" data-me="bell"><span aria-hidden="true">🔔</span>מה חדש</button><button type="button" data-me="vch"><span aria-hidden="true">🎁</span>שוברים</button><button type="button" data-me="set"><span aria-hidden="true">⚙️</span>הגדרות</button><button type="button" data-me="adm" id="meAdm" hidden><span aria-hidden="true">🛠️</span>ניהול המערכת</button></div>`;amAdmin().then(v=>{const b=$('#meAdm');if(b)b.hidden=!v})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-me]');if(!b)return;const k=b.dataset.me;if(k==='out')outSheet();else if(k==='lists')$('#listBtn').click();else if(k==='bell')$('#bellBtn').click();else if(k==='set')settingsSheet();else if(k==='vch')vouchersSheet();else if(k==='app')appShareDlg();else if(k==='onb'){resetTips();onbSheet()}else if(k==='adm')adminSheet()});

/* ---- map: preview card ---- */
let mkById={},mcSel=null;
function showMapCard(r){const el=$('#mapCard');if(!el||!r)return;const p=(r.photos||[]).find(x=>x.path),a=avg(r);
  el.innerHTML=`<button class="mc-x" type="button" data-mc="x" aria-label="סגירה">×</button><div class="mc-ph">${p?photoImg(p.thumb?{path:p.thumb}:p,'decoding="async"'):plate(r.name)}</div><div class="mc-b"><h3>${esc(r.name)}</h3><p class="meta">${[r.status==='been'?'היינו':'רוצים ללכת',r.cuisine,r.city,r.price?'₪'.repeat(r.price):''].filter(Boolean).map(esc).join(' · ')}</p><div class="mrow">${a?`<span class="rate"><i>★</i> ${a.toFixed(1)}</span>`:''}${liveSt(r)}${distKm(r)!=null?`<span class="dist">${esc(distTxt(distKm(r)))}</span>`:''}</div>
<div class="mc-acts"><button class="btn sm pri" type="button" data-mc="open">פרטים</button><a class="btn sm" href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}Waze</a>${moovitOk(r)?'<button class="btn sm" type="button" data-mc="moovit">🚌</button>':''}</div></div>`;
  el.dataset.id=r.id;el.hidden=false;hydrate();
  if(mcSel){const o=mcSel.getElement&&mcSel.getElement();if(o)o.classList.remove('sel')}mcSel=mkById[r.id]||null;const ne=mcSel&&mcSel.getElement&&mcSel.getElement();if(ne)ne.classList.add('sel')}
function hideMapCard(){const el=$('#mapCard');if(el)el.hidden=true;if(mcSel){const o=mcSel.getElement&&mcSel.getElement();if(o)o.classList.remove('sel');mcSel=null}}
document.addEventListener('click',e=>{const b=e.target.closest('#mapCard [data-mc]');if(!b)return;const id=$('#mapCard').dataset.id,k=b.dataset.mc;if(k==='x')hideMapCard();else if(k==='open')openDetail(id);else if(k==='moovit')openMoovit(byId(id))});

/* ---- sticky quick-filter bar (sits right under the header when the header is sticky) ---- */
let stkIO=null;
const hdrOff=()=>{const h=document.querySelector('header.band');return h&&getComputedStyle(h).position==='sticky'?h.offsetHeight:0};
function stickSetup(){const sen=$('#stkSen'),bar=$('#stickyBar');if(!sen||!bar)return;const off=hdrOff();
  document.documentElement.style.setProperty('--hdrH',off+'px');document.documentElement.style.setProperty('--stkPad',off?'0px':'env(safe-area-inset-top)');
  if(!('IntersectionObserver' in window))return;if(stkIO)stkIO.disconnect();
  stkIO=new IntersectionObserver(([en])=>{bar.classList.toggle('stuck',!en.isIntersecting&&en.boundingClientRect.top<off+1)},{threshold:0,rootMargin:`-${off}px 0px 0px 0px`});stkIO.observe(sen)}
function stickTop(){const bar=$('#stickyBar');if(!bar||!bar.classList.contains('stuck'))return;const g=$('#grid');if(!g)return;const y=g.getBoundingClientRect().top+window.scrollY-bar.offsetHeight-hdrOff()-8;if(window.scrollY>y)window.scrollTo({top:y,behavior:RM()?'auto':'smooth'})}
stickSetup();addEventListener('resize',()=>{clearTimeout(stickSetup.t);stickSetup.t=setTimeout(stickSetup,150)});
{const h=document.querySelector('header.band');if(h&&'ResizeObserver' in window)new ResizeObserver(()=>{clearTimeout(stickSetup.t);stickSetup.t=setTimeout(stickSetup,100)}).observe(h)}

/* ---- sticky action bar at the bottom of a place ---- */
function dbarHtml(r){const it=[];
  it.push(`<a href="${esc(wazeUrl(r))}" target="_blank" rel="noopener">${ICON.nav}<span>Waze</span></a>`);
  if(moovitOk(r))it.push(`<button type="button" data-act="moovit"><b aria-hidden="true">🚌</b><span>מוביט</span></button>`);
  it.push(`<a href="${esc(bookUrl(r))}" target="_blank" rel="noopener">${ICON.book}<span>הזמנה</span></a>`);
  if(showWolt(r))it.push(isStandalone()&&isIOS()?`<button type="button" data-act="wolt"><b aria-hidden="true">🛵</b><span>וולט</span></button>`:`<a href="${esc(deliveryUrl(r))}" rel="noopener"><b aria-hidden="true">🛵</b><span>וולט</span></a>`);
  it.push(`<a href="${esc(mapsUrl(r))}" target="_blank" rel="noopener">${ICON.pin}<span>מפות</span></a>`);
  return `<nav class="dbar" aria-label="פעולות מהירות" style="--n:${it.length}">${it.join('')}</nav>`}

/* ================= v36: vouchers, friends loved, practical filters, happy hour, QR ================= */
/* ---- vouchers wallet (shared in the list) ---- */
const vActive=v=>v&&!v.used&&(!v.exp||v.exp>=today());
const vDays=v=>v.exp?daysTo(v.exp):null;
function vouchersFor(r){return (meta.vouchers||[]).filter(v=>vActive(v)&&(v.rid===r.id))}
function vExpTxt(v){const d=vDays(v);if(d==null)return 'ללא תאריך תפוגה';if(d<0)return 'פג תוקף';if(d===0)return 'פג היום!';if(d===1)return 'פג מחר';if(d<=14)return `פג בעוד ${d} ימים`;return 'בתוקף עד '+fmtD(v.exp,{day:'numeric',month:'short',year:'2-digit'})}
function vouchersSheet(editId){killFormMap();openId=null;mode='vouchers';openSheet();const L=(meta.vouchers||[]).slice();
  const act=L.filter(vActive).sort((a,b)=>(a.exp||'9999').localeCompare(b.exp||'9999')),old=L.filter(v=>!vActive(v));
  const ed=editId?L.find(v=>v.id===editId):null;
  const row=v=>{const r=v.rid?byId(v.rid):null,d=vDays(v),warn=vActive(v)&&d!=null&&d<=14;return `<div class="vch ${vActive(v)?'':'old'}"><div class="vch-ic" aria-hidden="true">🎁</div><div class="vch-b"><b>${esc(v.title)}${v.amount?` · ₪${esc(String(v.amount))}`:''}</b><small class="${warn?'warn':''}">${esc(v.used?'נוצל':vExpTxt(v))}${r?' · '+esc(r.name):''}</small>${v.code?`<small dir="ltr" class="vch-code">${esc(v.code)}</small>`:''}${v.note?`<small>${esc(v.note)}</small>`:''}</div><div class="vch-a">${vActive(v)?`<button class="btn sm" type="button" data-vact="used" data-v="${esc(v.id)}">נוצל ✓</button>`:''}<button class="btn sm" type="button" data-vact="edit" data-v="${esc(v.id)}">עריכה</button><button class="btn sm" type="button" data-vact="del" data-v="${esc(v.id)}" aria-label="מחיקה">🗑</button></div></div>`};
  const opts=rows.slice().sort((a,b)=>a.name.localeCompare(b.name,'he')).map(r=>`<option value="${esc(r.id)}" ${ed&&ed.rid===r.id?'selected':''}>${esc(r.name)}</option>`).join('');
  $('#sb').innerHTML=`<div class="sec dh"><h2>🎁 ארנק השוברים</h2><p class="meta" style="margin-top:6px">שוברים, תווי מתנה וזיכויים של הקבוצה. נקבל תזכורת שבוע ויום לפני שפג התוקף.</p></div>
<div class="sec">${act.length?act.map(row).join(''):'<p class="note" style="margin:0">עוד אין שוברים. הוסיפו את הראשון למטה 👇</p>'}${old.length?`<details class="ulist" style="margin-top:10px"><summary>נוצלו או פגו (${old.length})</summary>${old.map(row).join('')}</details>`:''}</div>
<form class="sec" id="vf"><h4>${ed?'עריכת שובר':'שובר חדש'}</h4><input type="hidden" name="vid" value="${esc(ed?ed.id:'')}">
<div class="fgrid"><label class="full"><span class="l">שם השובר</span><input class="f" name="title" required maxlength="60" placeholder="BuyMe, תו הזהב, שובר ארוחה…" value="${esc(ed?ed.title:'')}"></label>
<label><span class="l">סכום (₪)</span><input class="f" name="amount" type="number" min="0" max="100000" inputmode="decimal" value="${esc(ed&&ed.amount?String(ed.amount):'')}"></label>
<label><span class="l">בתוקף עד</span><input class="f" name="exp" type="date" value="${esc(ed&&ed.exp?ed.exp:'')}"></label>
<label class="full"><span class="l">למקום מסוים? (אופציונלי)</span><select class="f" name="rid"><option value="">כל מקום / לא משנה</option>${opts}</select></label>
<label class="full"><span class="l">קוד מימוש (אופציונלי)</span><input class="f" name="code" maxlength="80" dir="ltr" value="${esc(ed&&ed.code?ed.code:'')}"></label>
<label class="full"><span class="l">הערה</span><input class="f" name="note" maxlength="120" value="${esc(ed&&ed.note?ed.note:'')}"></label></div>${(vouchersTour(),'')}
<div class="row" style="margin-top:12px"><button class="btn pri" type="submit">${ed?'שמירה':'הוספה לארנק'}</button>${ed?'<button class="btn" type="button" data-vact="cancel">ביטול</button>':''}</div></form>`}
function vouchersTour(){maybeTour('vouchers',700)}
async function vouchersSave(list){const ok=await metaSave({vouchers:list});if(ok){renderNotices();if(mode==='vouchers')vouchersSheet()}return ok}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-vact]');if(!b)return;const id=b.dataset.v,k=b.dataset.vact;const L=(meta.vouchers||[]).slice();const i=L.findIndex(v=>v.id===id);
  if(k==='cancel'){vouchersSheet();return}if(k==='edit'){vouchersSheet(id);setTimeout(()=>{const f=$('#vf');if(f)f.scrollIntoView({behavior:'smooth'})},50);return}if(i<0)return;
  if(k==='used'){L[i]={...L[i],used:true,usedAt:today()};await vouchersSave(L);toast('סימנו כנוצל 🎉');return}
  if(k==='del'){if(!await askSure('למחוק את השובר?',esc(L[i].title),'מחיקה',true))return;L.splice(i,1);await vouchersSave(L);toast('השובר נמחק')}});
document.addEventListener('submit',async e=>{if(e.target.getAttribute('id')!=='vf')return;e.preventDefault();const fd=new FormData(e.target),L=(meta.vouchers||[]).slice();
  const v={id:String(fd.get('vid')||'')||uuid(),title:String(fd.get('title')||'').trim().slice(0,60),amount:Math.max(0,Number(fd.get('amount'))||0)||null,exp:String(fd.get('exp')||'')||null,rid:String(fd.get('rid')||'')||null,code:String(fd.get('code')||'').trim().slice(0,80)||null,note:String(fd.get('note')||'').trim().slice(0,120)||null,by:myId};
  if(!v.title){toast('צריך לתת לשובר שם');return}const i=L.findIndex(x=>x.id===v.id);if(i>=0)L[i]={...L[i],...v};else L.push(v);if(await vouchersSave(L))toast(i>=0?'השובר עודכן':'השובר נוסף לארנק 🎁')});
function voucherNotice(){const soon=(meta.vouchers||[]).filter(v=>vActive(v)&&vDays(v)!=null&&vDays(v)<=14).sort((a,b)=>a.exp.localeCompare(b.exp));if(!soon.length)return '';const v=soon[0];
  return `<button type="button" class="notice vchn" data-vopen="1"><span class="ni">🎁</span><span class="nt"><b>${esc(v.title)}${v.amount?` · ₪${esc(String(v.amount))}`:''}: ${esc(vExpTxt(v))}</b><small>${soon.length>1?`ועוד ${soon.length-1} שוברים שעומדים לפוג · `:''}כדאי לתכנן יציאה ולנצל</small></span></button>`}
document.addEventListener('click',e=>{if(e.target.closest('[data-vopen]'))vouchersSheet()});

/* ---- places friends loved (from other lists, aggregated) ---- */
let friendsLoved=null;
async function loadFriendsLoved(){if(!sb||!cur||!navigator.onLine)return;try{const {data,error}=await sb.rpc('friends_loved',{lid:cur.id});if(error)throw error;friendsLoved=(data||[]).filter(x=>!rows.some(r=>fomoNorm(r.name)===fomoNorm(x.name)));renderFriendsLoved()}catch(e){console.warn('friends',e)}}
const fomoNorm=t=>String(t||'').toLowerCase().replace(/[׳״'"`\-–—_.,!?()[\]\/\\|:;&+]/g,' ').replace(/\s+/g,' ').trim();
function renderFriendsLoved(){const el=$('#friendsLoved');if(!el)return;const L=friendsLoved||[];if(!L.length||view!=='all'||q||cuisF||openF||nearF||likeF||tagF.size||hhF){el.innerHTML='';return}
  el.innerHTML=`<div class="fl-h"><b>💡 חברים אהבו</b><small>מקומות שדורגו גבוה בקבוצות אחרות ועוד לא אצלכם</small></div><div class="fl-row">${L.map((x,i)=>`<button type="button" class="fl-card" data-fl="${i}"><span class="fl-pl" aria-hidden="true">${plate(x.name)}</span><b>${esc(x.name)}</b><small>${esc([x.cuisine,x.city].filter(Boolean).join(' · '))}</small><span class="fl-r"><i>★</i> ${(+x.avg).toFixed(1)}${x.lists>1?` · ${x.lists} קבוצות`:''}</span><span class="fl-add">＋ הוספה</span></button>`).join('')}</div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-fl]');if(!b)return;const x=(friendsLoved||[])[+b.dataset.fl];if(!x)return;newForm();setTimeout(()=>{const qi=$('#placeQ');if(!qi)return;qi.value=[x.name,x.city].filter(Boolean).join(' ');placeSearch()},120)});

/* ---- practical tags filter ---- */
const PRACT=[['כשר','✡️'],['נגיש','♿'],['ידידותי לכלבים','🐕'],['חניה','🅿️'],['ישיבה בחוץ','🌳'],['מתאים לילדים','👶']];
const TAG_IC=Object.fromEntries([...PRACT,['האפי אוור','🍹'],['דייט','💘'],['מקום שקט','🤫'],['צריך להזמין מראש','📅']]);
const tagF=new Set();let hhF=false,moreF=false;

/* ---- happy hour (days + deal) ---- */
function hhOnDay(h,day){return !h.d||!h.d.length||h.d.includes(day)}
function hhInfo(r){const h=r.hh;if(!h||!h.f||!h.t)return null;const n=new Date(),day=n.getDay(),m=n.getHours()*60+n.getMinutes(),o=hm(h.f),c=hm(h.t);
  const on=hhOnDay(h,day)&&(c>o?(m>=o&&m<c):(m>=o||m<c));if(on)return {now:true,t:'🍹 האפי אוור עכשיו'+(h.n?' · '+h.n:'')};
  if(hhOnDay(h,day)&&o>m&&o-m<=90)return {now:false,t:`🍹 האפי אוור בעוד ${o-m} דק'`};return null}

/* ---- QR invite ---- */
function loadQR(){return window.qrcode?Promise.resolve(window.qrcode):new Promise((res,rej)=>{const s=document.createElement('script');s.src='vendor/qrcode.js?v='+APPV;s.onload=()=>res(window.qrcode);s.onerror=rej;document.head.appendChild(s)})}
async function showQR(){const url=inviteUrl();if(!url||!cur||!cur.join_code){toast('אין קישור הזמנה לקבוצה הזו');return}let svg='';try{const Q=await loadQR();const qr=Q(0,'M');qr.addData(url);qr.make();svg=qr.createSvgTag({cellSize:6,margin:2,scalable:true})}catch{toast('לא הצלחנו ליצור קוד');return}
  const d=document.createElement('div');d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label','קוד הצטרפות');
  d.innerHTML=`<div class="calp-in qr-in"><h3>הצטרפות ל"${esc(cur.name)}"</h3><div class="qr-box">${svg}</div><p class="meta">החבר פותח את המצלמה בטלפון שלו, מכוון לקוד ולוחץ על הקישור שמופיע. משם יוצרים חשבון ומצטרפים.</p><button class="btn pri" type="button" data-wx>סגירה</button></div>`;
  d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-wx]'))d.remove()});document.body.appendChild(d)}

document.addEventListener('click',e=>{const t=e.target.closest('#featRow [data-tf]');if(!t)return;const k=t.dataset.tf;if(tagF.has(k))tagF.delete(k);else tagF.add(k);renderList();stickTop()});

/* ================= v37: updates, leaflet on demand, limits, my account ================= */
/* ---- "new version" banner ---- */
let verShown=false;
async function checkVersion(){if(verShown||!navigator.onLine)return;try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(j&&j.v&&String(j.v)!==APPV)showUpdate(j)}catch{}}
function showUpdate(j){if(verShown)return;verShown=true;const b=document.createElement('div');b.className='upd';b.setAttribute('role','status');
  b.innerHTML=`<span>✨ יש גרסה חדשה${j&&j.note?`: ${esc(j.note)}`:''}</span><button type="button">עדכון</button>`;
  b.querySelector('button').onclick=async()=>{b.querySelector('button').textContent='מעדכן…';try{const rg=await navigator.serviceWorker?.getRegistration();if(rg)await rg.update().catch(()=>{});const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}catch{}flushDel();location.replace(location.pathname+'?u='+Date.now()+location.hash)};
  document.body.appendChild(b)}
setTimeout(checkVersion,4000);setInterval(checkVersion,10*60e3);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkVersion()});
if(new URLSearchParams(location.search).get('u')){const u=new URL(location.href);u.searchParams.delete('u');history.replaceState(null,'',u.pathname+u.search+u.hash);setTimeout(()=>toast('עודכן לגרסה החדשה ✨'),1200)}

/* ---- map library is loaded only when a map is needed ---- */
let llP=null;
function loadLeaflet(){if(window.L&&L.markerClusterGroup)return Promise.resolve(window.L);if(llP)return llP;
  const add=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src+'?v='+APPV;s.onload=res;s.onerror=rej;document.head.appendChild(s)});
  llP=(window.L?Promise.resolve():add('vendor/leaflet.js')).then(()=>add('vendor/leaflet.markercluster.js')).then(()=>window.L).catch(e=>{llP=null;throw e});return llP}

/* ---- usage vs free-plan limits (admin) ---- */
async function usageHtml(){let u=null;try{const {data}=await sb.rpc('admin_usage');u=data}catch{}if(!u)return '';
  const mb=n=>n>=1073741824?(n/1073741824).toFixed(2)+'GB':Math.round(n/1048576)+'MB';const bar=(t,a,b)=>{const p=Math.min(100,Math.round(a/b*100));return `<div class="ubar"><div class="ubar-t"><span>${t}</span><b>${mb(a)} מתוך ${mb(b)} · ${p}%</b></div><div class="ubar-b"><i style="width:${Math.max(p,1)}%" class="${p>=80?'hot':p>=60?'warm':''}"></i></div></div>`};
  return `<h4 style="margin-top:18px">נפח במסלול החינמי</h4>${bar('מסד נתונים',u.db,u.db_cap)}${bar(`תמונות (${u.nfiles} קבצים)`,u.files,u.files_cap)}<p class="note" style="margin:6px 0 0">מעל 80% תקבל התראה. תמונות שאף מקום לא משתמש בהן נמחקות אוטומטית פעם בחודש.</p>`}

/* ---- my account: download my data / delete my account ---- */
function accountSecHtml(){return `<div class="sec"><h4>החשבון שלי</h4><p class="note" style="margin:0 0 10px">אפשר להוריד את כל המידע שקשור אליך, או למחוק את החשבון לגמרי.</p><div class="row"><button class="btn" type="button" data-act="myData">⬇️ הורדת המידע שלי</button><button class="btn" type="button" data-act="delMe" style="color:var(--bad)">מחיקת החשבון</button></div></div>`}
async function myDataDl(){const {data,error}=await sb.rpc('my_data');if(error||!data){toast('לא הצלחנו להכין את הקובץ');return}const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),name=`fomo-my-data-${today()}.json`;
  if(isIOS()&&navigator.canShare){const file=new File([blob],name,{type:'application/json'});if(navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'המידע שלי ב־Fomo'});return}catch(e){if(e&&e.name==='AbortError')return}}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);toast('הקובץ ירד')}
async function deleteMe(){const solo=lists.filter(l=>l.role==='owner').map(l=>l.name);
  if(!await askSure('למחוק את החשבון שלך?','החשבון, השם, התגובות והדירוגים שלך יימחקו. מקבוצות משותפות תצא/י, והן ימשיכו להתקיים אצל השאר. קבוצות שרק את/ה בהן יימחקו עם כל התוכן. <b>אי אפשר לבטל את זה.</b>','המשך',true))return;
  if(!await askSure('בטוח לגמרי?','זה הצעד האחרון. אחרי זה תצטרך/י להירשם מחדש כדי להשתמש ב־FOMO.','כן, למחוק את החשבון',true))return;
  toast('מוחק…');const {error}=await sb.rpc('delete_me');if(error){toast(/admin_account/.test(error.message||'')?'אי אפשר למחוק חשבון מנהל מתוך האפליקציה':'המחיקה נכשלה: '+errMsg(error));return}
  try{localStorage.clear()}catch{}try{await sb.auth.signOut()}catch{}gate('<p>החשבון נמחק. תודה שהיית איתנו 💛</p>')}

/* ---- send the app itself (not a list invite) ---- */
const APP_URL=location.origin+location.pathname.replace(/index\.html$/,'');
const APP_TXT='היי! 🍽️ גיליתי אפליקציה שאני ממש אוהב: FOMO 💛\nשומרים בה את כל המסעדות, הברים ובתי הקפה שבא לנו לנסות או שכבר היינו בהם, מדרגים, מתכננים יציאות עם חברים, ואף מקום טוב לא נשכח יותר.\nזה חינם, ונכנסים בלחיצה 👇';
async function appShareDlg(){let svg='';try{const Q=await loadQR();const qr=Q(0,'M');qr.addData(APP_URL);qr.make();svg=qr.createSvgTag({cellSize:6,margin:2,scalable:true})}catch{}
  const d=document.createElement('div');d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label','שליחת האפליקציה');
  d.innerHTML=`<div class="calp-in qr-in"><h3>📲 שליחת FOMO לחבר</h3><p class="meta" style="margin:0">הקישור לאפליקציה עצמה, בלי הצטרפות לקבוצה שלכם. החבר נרשם ופותח קבוצה משלו.</p>${svg?`<div class="qr-box">${svg}</div>`:''}<p class="note" dir="ltr" style="margin:0;word-break:break-all">${esc(APP_URL)}</p>
<button class="btn pri" type="button" data-as="share">${ICON.share}שליחה</button><button class="btn" type="button" data-as="copy">${ICON.copy}העתקת ההודעה והקישור</button><button class="link-btn" type="button" data-wx>סגירה</button></div>`;
  d.addEventListener('click',async e=>{const b=e.target.closest('[data-as]');if(b){if(b.dataset.as==='share'){await shareOrCopy('FOMO',APP_TXT,APP_URL)}else{try{await navigator.clipboard.writeText(APP_TXT+'\n'+APP_URL);toast('ההודעה והקישור הועתקו')}catch{toast(APP_URL)}}return}if(e.target===d||e.target.closest('[data-wx]'))d.remove()});document.body.appendChild(d)}

/* ================= v39: guided tips per screen + "what's new" ================= */
let adminP=null;const amAdmin=()=>adminP||(adminP=(async()=>{if(!sb||!myId)return false;const c=lsGet('rs-adm-'+myId,null);if(c!==null)return c;try{const {data}=await sb.rpc('is_quota_admin');const v=data===true;lsSet('rs-adm-'+myId,v);return v}catch{return false}})());
const TIPS={
  list:[{s:'#stickyBar',t:'סינון בלחיצה',d:'פתוח עכשיו, קרוב אליי, בא לי, האפי אוור ועוד. הסרגל נשאר למעלה גם כשגוללים.'},
    {s:'#grid .card [data-vote]',t:'♥ בא לי',d:'מסמנים מקומות שבא לכם. כששניכם מסמנים אותו מקום, יש התאמה!'},
    {s:'#addBtnM,#addBtn',t:'הוספת מקום',d:'מחפשים בשם או מתארים במילים שלכם, וכל הפרטים מתמלאים לבד.'},
    {t:'עוד שני טריקים',d:'משיכה למטה בראש הקבוצה מרעננת אותה, ולחיצה על כרטיס פותחת את כל הפרטים.'}],
  form:[{s:'#placeQ',t:'חיפוש חכם',d:'כותבים איך שזוכרים, למשל "בלבוי" או "קפה משלוש", ובוחרים מהקבוצה.'},
    {s:'#paste',t:'יש קישור?',d:'מדביקים קישור מגוגל מפות או מהאתר של המסעדה, והפרטים מתמלאים מעצמם.'},
    {s:'#fmap',t:'המיקום על המפה',d:'אפשר לגרור את הסיכה או ללחוץ על המפה כדי לדייק את המקום.'}],
  detail:[{s:'#sb .dbar',t:'הכל בהישג אצבע',d:'Waze, מוביט, הזמנת שולחן ווולט. הסרגל תמיד למטה.'},
    {s:'#visitF',t:'היינו פה?',d:'מוסיפים ביקור, מנות ודירוג, ושומרים זיכרונות מכל יציאה.'},
    {s:'#sb .rcpt-b',t:'סריקת קבלה',d:'מצלמים את הקבלה, וה־AI ממלא לבד את המנות ואת הסכום.'},
    {t:'לסגור בקלות',d:'גוררים את החלון למטה, או לוחצים על ה־X למעלה.'}],
  map:[{s:'#lmap',t:'המפה שלכם',d:'ירוק = היינו, אדום = רוצים ללכת. עיגול עם מספר הוא כמה מקומות קרובים, ולחיצה עליו מגדילה.'},
    {s:'#locMe',t:'מה קרוב אליי?',d:'מציג את המיקום שלך על המפה. לחיצה על נקודה פותחת כרטיס עם ניווט.'}],
  timeline:[{s:'#soon .soon-hero,#soon',t:'היציאה הבאה',d:'ספירה לאחור, ובלחיצה: ניווט, מוביט, מזג אוויר ומה חובה להזמין.'},
    {s:'#memory,#tl',t:'איפה היינו',d:'כל הביקורים שלכם לפי תאריך, כולל ימים מיוחדים.'}],
  me:[{s:'[data-me=vch]',t:'ארנק שוברים',d:'שומרים שוברים ותווי מתנה, ומקבלים תזכורת לפני שפג התוקף.'},
    {s:'[data-me=app]',t:'שליחת האפליקציה',d:'שולחים את FOMO לחברים, בלי לצרף אותם לקבוצה שלכם.'},
    {s:'#me .seg',t:'נוח לקרוא',d:'אפשר להגדיל את הטקסט או להפעיל ניגודיות גבוהה.'}],
  vouchers:[{s:'#vf',t:'שובר חדש',d:'שם, סכום ותאריך תפוגה. שובר למקום מסוים יופיע גם בדף של המקום.'}]};
const tipsDone=()=>lsGet('rs-tips',{});
function visEl(sel){for(const el of document.querySelectorAll(sel)){const r=el.getBoundingClientRect();if(r.width>4&&r.height>4&&getComputedStyle(el).visibility!=='hidden')return el}return null}
async function maybeTour(name,delay){if(lsGet('rs-tips-off',0)||tipsDone()[name]||!TIPS[name])return;if(await amAdmin())return;if(!lsGet('rs-onb2',0)){maybeTour.q=name;return}if(!loaded){setTimeout(()=>maybeTour(name,delay),1000);return}
  setTimeout(()=>{if(tipsDone()[name]||document.querySelector('.coach'))return;if(document.querySelector('.onb,.calp,.upd-new,.fx-co')){maybeTour.q=name;return}
    const want=name==='list'||name==='map'||name==='timeline'||name==='me'?page===name&&$('#ov').hidden:!$('#ov').hidden;if(!want)return;
    const steps=TIPS[name].filter(x=>!x.s||visEl(x.s));if(steps.length)coach(name,steps)},delay||900)}
function coach(name,steps){let i=0;const d=document.createElement('div');d.className='coach';d.setAttribute('role','dialog');d.setAttribute('aria-label','טיפ');d.dir='rtl';
  d.innerHTML='<div class="co-spot"></div><div class="co-b" role="document"><b class="co-t"></b><p class="co-d"></p><div class="co-r"><span class="co-n"></span><button type="button" class="co-skip">דלג על כל הטיפים</button><button type="button" class="btn sm pri co-next"></button></div></div>';
  document.body.appendChild(d);const spot=d.querySelector('.co-spot'),bub=d.querySelector('.co-b');
  const place=()=>{const st=steps[i],el=st.s&&visEl(st.s);d.querySelector('.co-t').textContent=st.t;d.querySelector('.co-d').textContent=st.d;d.querySelector('.co-n').textContent=steps.length>1?`${i+1}/${steps.length}`:'';
    d.querySelector('.co-next').textContent=i<steps.length-1?'הבא':'הבנתי 👍';
    if(!el){spot.style.cssText='left:50%;top:50%;width:0;height:0';bub.style.cssText='left:50%;top:50%;transform:translate(-50%,-50%)';return}
    let r=el.getBoundingClientRect();if(!place.sc&&(r.top<70||r.bottom>innerHeight-90)){place.sc=1;const sc=el.closest('.ov')||null,dy=r.top+r.height/2-innerHeight/2;if(sc)sc.scrollTop+=dy;else window.scrollBy(0,dy);r=el.getBoundingClientRect()}
    const pad=6,top=Math.max(4,r.top-pad),h=Math.min(r.height+pad*2,innerHeight*.55);spot.style.cssText=`left:${r.left-pad}px;top:${top}px;width:${r.width+pad*2}px;height:${h}px`;
    const bw=Math.min(320,innerWidth-24),left=Math.min(Math.max(12,r.left+r.width/2-bw/2),innerWidth-bw-12);const below=top+h+12,bh=bub.offsetHeight||130;
    const y=below+bh<innerHeight-10?below:Math.max(12,top-bh-12);bub.style.cssText=`left:${left}px;top:${y}px;width:${bw}px`};
  const done=all=>{const t=tipsDone();t[name]=1;lsSet('rs-tips',t);if(all)lsSet('rs-tips-off',1);d._off&&d._off();d.remove();removeEventListener('resize',place);if(maybeTour.q&&maybeTour.q!==name){const q=maybeTour.q;maybeTour.q=null;maybeTour(q,400)}};
  d.addEventListener('click',e=>{if(e.target.closest('.co-skip')){done(true);toast('אפשר להפעיל את הטיפים מחדש במסך "אני" ← הדרכה');return}if(i<steps.length-1){i++;place.sc=0;place()}else done(false)});
  const onSc=()=>requestAnimationFrame(place);addEventListener('resize',place);addEventListener('scroll',onSc,{passive:true,capture:true});d._off=()=>removeEventListener('scroll',onSc,{capture:true});place();requestAnimationFrame(place);setTimeout(place,350);setTimeout(()=>{const b=d.querySelector('.co-next');if(b)b.focus()},60)}
function resetTips(){lsSet('rs-tips',{});lsSet('rs-tips-off',0)}

/* ---- what's new after an update ---- */
const WHATSNEW={'55':['⚡ חיפוש מהיר יותר: כ־1,300 מסעדות, ברים ובתי קפה בתל אביב כבר במאגר של FOMO, בלי לחכות ל־AI או לגוגל'],'54':['⚙️ ההגדרות מסודרות ב־4 לשוניות: אני, קבוצה, התראות ועוד','🏠 הלשונית "רשימה" נקראת עכשיו "בית"','👥 "רשימה" הפכה ל"קבוצה" בכל האפליקציה','🌾 אפשר לערוך את "הטעם שלי" מתי שרוצים, בלשונית "אני"'],'53':['👥 "רשימה" נקראת עכשיו "קבוצה", בכל האפליקציה','👋 כניסה ראשונה חדשה: שם, מקומות ראשונים, הטעם שלי, ופתיחת קבוצה עם הזמנה','💌 מי שמוזמן רואה מי הזמין ואילו מקומות מחכים לו','🏠 סיור קצר במסך הבית למשתמשים חדשים','🌾 "הטעם שלי": סגנונות, תזונה, תקציב ועיר'],'46':['✨ חיפוש חכם בדף הקבוצה: מוצא גם מקומות שעוד לא בקבוצה, עם כפתור הוספה','💬 אפשר לתאר במילים, למשל "בר יין שקט בתל אביב"','＋ פותח את אותו חיפוש, עם הוספה ידנית למטה','📝 כרטיס ההוספה מסודר: מה שמולא לבד למעלה, השאר מקופל'],'41':['👋 ברכה אישית למעלה, עם כמה מקומות פתוחים עכשיו','👀 התראה כשמוסיפים מקום שכבר בקבוצה','🔎 החיפוש לומד שמות נוספים של מקומות, גם באנגלית','🕒 שעות הפתיחה מתעדכנות מאתרי המקומות כל שבוע'],'39':['💡 טיפים קצרים בכל מסך בפעם הראשונה','📲 שליחת האפליקציה לחברים מתוך מסך "אני"','✨ עדכונים מעכשיו בלחיצה אחת, בלי לסגור ולפתוח']};
function whatsNew(){if(document.querySelector('.coach,.onb')){setTimeout(whatsNew,3000);return}const seen=lsGet('rs-seen-ver','');lsSet('rs-seen-ver',APPV);const L=WHATSNEW[APPV];if(!seen||seen===APPV||!L)return;
  const d=document.createElement('div');d.className='calp upd-new';d.setAttribute('role','dialog');d.setAttribute('aria-label','מה חדש');
  d.innerHTML=`<div class="calp-in"><div class="calp-ic" style="font-size:30px">🎁</div><h3>מה חדש ב־FOMO</h3><ul class="wn">${L.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="btn pri" type="button" data-wx>מעולה!</button></div>`;
  d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-wx]')){d.remove();if(maybeTour.q){const q=maybeTour.q;maybeTour.q=null;maybeTour(q,400)}}});document.body.appendChild(d)}

/* intro splash on every launch */
{const sp=$('#splash'),t0=Date.now(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const hide=()=>{if(!sp||sp.classList.contains('out'))return;sp.classList.add('out');document.body.classList.remove('splashing');setTimeout(()=>sp.remove(),800)};
 if(sp){sp.addEventListener('click',hide);setTimeout(hide,reduce?500:2600)}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();if(isSamsung())return;installEvt=e;if(installGate.redraw)installGate.redraw()});
if('serviceWorker' in navigator){let hadCtl=!!navigator.serviceWorker.controller,reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtl&&!reloaded){reloaded=true;location.reload()}});
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}))}

/* ================= v41 ================= */
/* 55: privacy-friendly feature usage (counts only; no user id leaves the device besides the login itself) */
const TRK=new Set();
function track(f){try{if(!sb||!myId||!f||!navigator.onLine)return;const k=String(f).replace(/[^a-zA-Z0-9:_-]/g,'').slice(0,40);if(!k||TRK.has(k))return;TRK.add(k);sb.rpc('track',{f:k}).then(()=>{},()=>{})}catch{}}
document.addEventListener('click',e=>{try{const t=e.target.closest('[data-act],[data-qf],[data-me],.tabbar [data-v],.tabs [data-v],[data-fl],[data-vopen],[data-open-f],[data-tf],[data-gr],#pickBtn,#addBtn,#bellBtn,#listBtn,#setBtn');if(!t)return;const ds=t.dataset;
  const f=ds.act?'act:'+ds.act:ds.qf?'qf:'+ds.qf:ds.me?'me:'+ds.me:ds.v?'tab:'+ds.v:ds.fl!==undefined?'friendsLoved':ds.vopen!==undefined?'voucher':ds.openF?'qf:open':ds.tf?'tag':ds.gr?'greet:'+ds.gr:t.id?'btn:'+t.id:'';if(f)track(f)}catch{}},true);
const FL={'tab:list':'לשונית בית','tab:map':'לשונית מפה','tab:timeline':'לשונית יציאות','tab:stats':'נתונים','tab:me':'לשונית אני','btn:addBtn':'הוספת מקום','btn:pickBtn':'לאן הולכים הערב?','btn:bellBtn':'פעמון עדכונים','btn:listBtn':'הקבוצות שלי','btn:setBtn':'הגדרות',
  'qf:open':'פילטר פתוח עכשיו','qf:near':'קרוב אליי','qf:like':'בא לי','qf:new':'עוד לא ביקרנו','qf:hh':'האפי אוור עכשיו','qf:more':'פילטרים נוספים','tag':'פילטר תגיות','friendsLoved':'חברים אהבו','voucher':'שוברים','detail':'פתיחת מקום','search':'חיפוש מקום','ai':'זיהוי חכם בחיפוש',
  'me:app':'שליחת האפליקציה','me:out':'יציאות (מסך אני)','me:vch':'ארנק שוברים','me:set':'הגדרות (מסך אני)','me:lists':'קבוצות (מסך אני)','me:onb':'הדרכה מחדש','me:bell':'עדכונים (מסך אני)','me:adm':'מסך ניהול',
  'act:moovit':'מוביט','act:wolt':'וולט','act:vote':'הצבעה בא לי','act:rate':'דירוג','act:fav':'מועדף','act:share':'שיתוף מקום','act:shareCard':'כרטיס שיתוף','act:qrInvite':'הזמנה ב־QR','act:shareInvite':'הזמנה לקבוצה','act:shareApp':'שליחת האפליקציה',
  'act:planNew':'תכנון יציאה','act:evNew':'ערב עם כמה תחנות','act:pollNew':'סקר','act:wheelSpin':'גלגל הגורל','act:diceRoll':'קוביה','act:gameNew':'משחקים','act:camNear':'צילום בקרבת מקום','act:voice':'הקלטה קולית','act:recap':'סיכום תקופה','act:pubOn':'דף ציבורי','act:import':'ייבוא',
  'act:edit':'עריכת מקום','act:placeSearch':'חיפוש בטופס','act:gSearchNow':'חיפוש מורחב','act:theme':'ערכת צבעים','act:pushOn':'הפעלת התראות','act:install':'התקנה','install-banner':'באנר התקנה','act:dupOpen':'מניעת כפילות','greet:open':'ברכה: פתוחים עכשיו','greet:hh':'ברכה: האפי אוור'};
async function featHtml(){let L=null;try{const {data}=await sb.rpc('admin_features',{days:30});L=data}catch{}
  const head='<h4 style="margin-top:18px">מה הכי בשימוש (30 יום)</h4>';if(!L)return '';if(!L.length)return head+'<p class="note" style="margin:0">עוד אין נתונים. הם מתחילים להצטבר מעכשיו.</p>';
  const lab=f=>FL[f]||f,top=L.slice(0,8),mx=Math.max(1,top[0].n);
  const used=new Set(L.map(x=>x.f)),zero=Object.keys(FL).filter(k=>!used.has(k)&&!/^btn:|^tab:/.test(k)).slice(0,10),low=L.filter(x=>x.n<=2).slice(-6);
  return head+top.map(x=>`<div class="ubar"><div class="ubar-t"><span>${esc(lab(x.f))}</span><b>${x.n} · עד ${x.u} אנשים ביום</b></div><div class="ubar-b"><i style="width:${Math.max(2,Math.round(x.n/mx*100))}%"></i></div></div>`).join('')
   +`<h4 style="margin-top:14px">כמעט לא בשימוש</h4><p class="note" style="margin:0">${[...low.map(x=>esc(lab(x.f))+` (${x.n})`),...zero.map(k=>esc(FL[k])+' (0)')].join(' · ')||'הכל בשימוש 👌'}</p><p class="note" style="margin:6px 0 0">נספר רק כמה פעמים השתמשו בכל דבר, בלי לשמור מי.</p>`}

/* admin screen (server decides: every admin call checks is_quota_admin) */
async function adminSheet(){if(!sb)return;let ok=false;try{const {data}=await sb.rpc('is_quota_admin');ok=data===true}catch{}if(!ok){toast('המסך הזה רק למנהל המערכת');return}
  killFormMap();openId=null;mode='admin';openSheet();$('#sb').innerHTML=`<div class="sec dh"><h2>🛠️ ניהול המערכת</h2><p class="meta" style="margin-top:6px">רק את/ה רואה את המסך הזה.</p></div><div id="qAdm" class="sec"><p class="note" style="margin:0">טוען…</p></div>`;fillQuotaAdm()}

/* install first: a dedicated screen before login on phones, steps per device */
function instPlat(){const ua=navigator.userAgent;
  if(isIOS()){if(/Instagram|FBAN|FBAV|Line\/|Snapchat|TikTok|musical_ly|GSA\//i.test(ua))return 'ios-inapp';if(/CriOS/i.test(ua))return 'ios-chrome';if(/FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua))return 'ios-other';
    const v=+((ua.match(/Version\/(\d+)/)||[])[1]||0);return v>=26?'ios26':'ios'}
  if(/Android/i.test(ua)){if(isSamsung())return 'and-samsung';if(/; wv\)|Instagram|FBAN|FBAV|Line\/|TikTok|musical_ly/i.test(ua))return 'and-inapp';if(/Chrome\//i.test(ua)&&!/EdgA|OPR|Firefox|YaBrowser|MiuiBrowser|HuaweiBrowser/i.test(ua))return 'and-chrome';return 'and-other'}
  return 'desktop'}
const isPhone=()=>instPlat()!=='desktop';
function instSteps(pl){const L=a=>`<ol class="isteps">${a.map((t,i)=>`<li><b>${i+1}</b><span>${t}</span></li>`).join('')}</ol>`,K=t=>`<span class="ikey">${t}</span>`;
  if(pl==='ios26')return L([`לוחצים על ${K('⋯')} ליד שורת הכתובת, למטה.`,`בוחרים ${K('שיתוף')} (ריבוע עם חץ למעלה).`,`גוללים למטה ובוחרים ${K('הוספה למסך הבית')}`,`משאירים את המתג שמופיע שם דלוק, ולוחצים ${K('הוספה')}`]);
  if(pl==='ios')return L([`לוחצים על כפתור השיתוף ${K('⬆️')} בתחתית המסך.`,`גוללים ובוחרים ${K('הוספה למסך הבית')}`,`לוחצים ${K('הוספה')}`]);
  if(pl==='ios-chrome')return L([`לוחצים על כפתור השיתוף ${K('⬆️')} בשורת הכתובת.`,`בוחרים ${K('הוספה למסך הבית')}`,`לוחצים ${K('הוספה')}`]);
  if(pl==='ios-inapp'||pl==='ios-other')return `<p class="inote">הדפדפן הזה לא יודע להוסיף למסך הבית. פותחים את הקישור ב־<b>Safari</b>:</p>`+L([`לוחצים על ${K('העתקת הקישור')} כאן למטה.`,`פותחים את <b>Safari</b> ומדביקים בשורת הכתובת.`,`ושם עושים "הוספה למסך הבית".`]);
  if(pl==='and-chrome')return installEvt?'<p class="inote">לחיצה אחת, וזה על המסך.</p>':L([`לוחצים על התפריט ${K('⋮')} למעלה.`,`בוחרים ${K('התקנת אפליקציה')} או ${K('הוספה למסך הבית')}`,`מאשרים ${K('התקנה')}`]);
  if(pl==='and-samsung')return '<p class="inote">בדפדפן של סמסונג גוגל חוסמת את ההתקנה. ב־<b>Chrome</b> זה עובד בלחיצה אחת:</p>'+L([`לוחצים ${K('פתיחה ב־Chrome')}`,`שם לוחצים ${K('התקנה')}`]);
  return '<p class="inote">הכי פשוט להתקין דרך <b>Chrome</b>:</p>'+L([`לוחצים ${K('פתיחה ב־Chrome')}`,`שם לוחצים ${K('התקנה')}`])}
function instBtn(pl){if(pl==='and-chrome'&&installEvt)return '<button class="btn" type="button" data-ig="install" '+BRASS+'>📲 התקנת FOMO</button>';
  if(/^and-(samsung|inapp|other)$/.test(pl))return `<a class="btn" href="${CHROME_URL}" data-ig="chrome" ${BRASS}>פתיחה ב־Chrome</a>`;
  if(pl==='ios-inapp'||pl==='ios-other')return '<button class="btn" type="button" data-ig="copy" '+BRASS+'>העתקת הקישור</button>';return ''}
function needInstallGate(){try{return isPhone()&&!isStandalone()&&!sessionStorage.getItem('rs-inst-skip')&&!lsGet('rs-inst-done',0)}catch{return false}}
function installGate(next){const pl=instPlat(),ios=pl.startsWith('ios');track('install-gate');
  const draw=()=>{gate(`<p class="istep">שלב 1 מתוך 2</p><h2 class="ih">קודם, FOMO על מסך הבית 📲</h2><p class="isub">ככה היא נפתחת כמו אפליקציה רגילה, עם התראות, ולא הולכת לאיבוד בין הלשוניות.</p>
    <div class="ibox">${instSteps(pl)}</div>${instBtn(pl)}${ios?'<p class="inote" style="margin-top:12px">אחרי ההוספה פותחים את FOMO מהמסך ונכנסים שם. כך תצטרכו להתחבר רק פעם אחת.</p>':''}
    <button class="ilater" type="button" data-ig="later">המשך בדפדפן בינתיים</button>`);
    const g=$('#gate');g.onclick=e=>{const b=e.target.closest('[data-ig=later]');if(!b)return;try{sessionStorage.setItem('rs-inst-skip','1')}catch{}track('install-later');g.onclick=null;installGate.redraw=null;next()}};
  draw();installGate.redraw=()=>{if($('#gate')&&!$('#gate').hidden&&$('.istep'))draw()}}
window.addEventListener('appinstalled',()=>{lsSet('rs-inst-done',1)});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-ig]');if(!b)return;const k=b.dataset.ig;
  if(k==='copy'){try{await navigator.clipboard.writeText(location.origin+'/');b.textContent='✓ הועתק. עכשיו פותחים את Safari'}catch{b.textContent=location.origin}return}
  if(k==='chrome'){track('install-chrome');return}
  if(k==='install'&&installEvt){const ev=installEvt;installEvt=null;ev.prompt();let ok=false;try{const c=await ev.userChoice;ok=!!(c&&c.outcome==='accepted')}catch{}
    if(ok){lsSet('rs-inst-done',1);const ib=document.querySelector('.instb');if(ib)ib.remove();if($('.istep'))gate('<h2 class="ih">מעולה, FOMO על המסך 🎉</h2><p class="isub">אפשר לפתוח אותה מהמסך, או להמשיך כאן.</p><button class="btn" type="button" data-ig="later" '+BRASS+'>המשך</button>');else toast('FOMO הותקנה 🎉')}
    else if(installGate.redraw)installGate.redraw()}});

/* 57: OpenStreetMap opening_hours -> our {0..6:[open,close]|null} */
function parseOH(s){if(!s||typeof s!=='string')return null;s=s.trim();const p=n=>String(n).padStart(2,'0'),all=v=>{const H={};for(let i=0;i<7;i++)H[i]=v;return H};
  if(/^24\/7$/.test(s))return all(['00:00','23:59']);
  const D={Su:0,Mo:1,Tu:2,We:3,Th:4,Fr:5,Sa:6},DR='(?:Mo|Tu|We|Th|Fr|Sa|Su)',H={};let any=false;
  for(let rule of s.split(';')){rule=rule.trim();if(!rule)continue;if(/\b(PH|SH)\b/.test(rule)&&!new RegExp('\\b'+DR+'\\b').test(rule))continue;
    const m=rule.match(new RegExp('^((?:'+DR+'(?:-'+DR+')?)(?:\\s*,\\s*'+DR+'(?:-'+DR+')?)*)?\\s*(.*)$'));if(!m)continue;
    let days=[];if(m[1]){for(const part of m[1].split(',')){const [a,b]=part.trim().split('-');let i=D[a];const j=b!==undefined?D[b]:i;for(let k=0;k<7;k++){days.push(i);if(i===j)break;i=(i+1)%7}}}else days=[0,1,2,3,4,5,6];
    const t=m[2].replace(/,?\s*PH\b.*$/,'').trim();
    if(/^(off|closed)$/i.test(t)){days.forEach(d=>H[d]=null);any=true;continue}
    const rs=[...t.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\+?/g)];if(!rs.length)continue;
    const c=rs[rs.length-1];let ch=+c[3];if(ch>=24)ch-=24;const v=[p(+rs[0][1])+':'+rs[0][2],p(ch)+':'+c[4]];days.forEach(d=>H[d]=v);any=true}
  if(!any)return null;for(let i=0;i<7;i++)if(!(i in H))H[i]=null;return H}
const okHours=H=>!!H&&typeof H==='object'&&Object.values(H).some(v=>Array.isArray(v)&&v[0]);
const formHasHours=E=>[0,1,2,3,4,5,6].some(i=>E['ho'+i].value||E['hx'+i].checked);
function fillFormHours(E,H){for(let i=0;i<7;i++){const h=H[i];E['hx'+i].checked=h===null;E['ho'+i].value=h?h[0]:'';E['hc'+i].value=h?h[1]:''}const det=E[0]&&E[0].form?E[0].form.querySelector('details.hours'):null;if(det)det.open=true}
const kmBetween=(a,b)=>{const R=6371,t=v=>v*Math.PI/180,dl=t(b.lat-a.lat),dg=t(b.lng-a.lng);return 2*R*Math.asin(Math.sqrt(Math.sin(dl/2)**2+Math.cos(t(a.lat))*Math.cos(t(b.lat))*Math.sin(dg/2)**2))};
function sameP(cand,x){const a=fomoNorm(cand.name||''),b=fomoNorm(x.name||'');if(!a||!b)return false;const nm=a===b||a.includes(b)||b.includes(a);
  if(Number.isFinite(cand.lat)&&Number.isFinite(x.lat)&&x.lat){const k=kmBetween(cand,x);return k<=.35||(nm&&k<=1.5)}return nm}

/* 58: Google as a safety net (hours stay on the user's own place, never in the shared catalog) */
async function gHoursFor(x){if(!(window.APP_CONFIG||{}).googleKey||!navigator.onLine||!x||!x.name)return null;
  const q=await takeQuota('place');if(!q.ok)return null;let ps=null;
  try{ps=await gSearch([x.name,x.address,x.city].filter(Boolean).join(' '),['id','displayName','location','regularOpeningHours'])}catch(e){console.warn('g hours',e)}
  for(const p of ps||[]){const it=gToItem(p);if(it.hours&&sameP(it,x))return {hours:it.hours,gpid:p.id||''}}return null}
async function fillHoursChain(x){const st=$('#fillSt');
  if(x.site)await enrichFromSite(x.site);let f=$('#ef');if(!f||formHasHours(f.elements))return;
  const g=await gHoursFor(x);f=$('#ef');if(!g||!f||formHasHours(f.elements))return;
  fillFormHours(f.elements,g.hours);formSrc.hoursSrc='google';if(g.gpid&&!formSrc.gpid)formSrc.gpid=g.gpid;
  if(st)st.textContent=(st.textContent?st.textContent+' ':'')+'🕒 השלמנו שעות פתיחה מגוגל.'}

/* 62: fill hours for places already in the list (a few per visit, each place at most once a month) */
async function fillMissingHours(){if(fillMissingHours.busy||!sb||!myId||!loaded||!navigator.onLine||document.visibilityState!=='visible')return;fillMissingHours.busy=true;
  const now=Date.now(),todo=rows.filter(r=>!okHours(r.hours)&&!r.permClosed&&!(r.hoursTry>now-30*864e5)&&r.name).slice(0,4);let n=0;
  try{for(const r of todo){let H=null;
      try{const o=await osmSearch([r.name,r.city].filter(Boolean).join(' '),true);const m=o.find(i=>i.hours&&sameP(i,r));if(m)H=m.hours}catch{}
      if(!H&&r.site){const d=await aiCall({action:'enrich',url:r.site,cuisines:CUIS});if(d&&d.ok&&okHours(d.hours))H=d.hours}
      if(!H){const g=await gHoursFor(r);if(g)H=g.hours}
      const fresh=byId(r.id);if(!fresh||okHours(fresh.hours))continue;
      await save(r.id,H?{hours:H,hoursTry:now}:{hoursTry:now});if(H)n++;
      await new Promise(res=>setTimeout(res,1200))}}
  finally{fillMissingHours.busy=false}
  if(n)toast(`🕒 השלמנו שעות פתיחה ל־${n} ${n===1?'מקום':'מקומות'}`)}
setTimeout(fillMissingHours,20000);

/* ================= v46: one smart search (list page + ＋) ================= */
const SX_DESC=/(^|\s)(משהו|מקום|מקומות|שקט|שקטה|זול|זולה|יקר|לא יקר|פתוח|פתוחה|עכשיו|ליד|קרוב|רומנטי|רומנטית|לדייט|דייט|טוב|טובה|הכי|עם|בלי|כשר|טבעוני|צמחוני|אווירה|נוף|ים|ארוחת|בראנץ'?|ערב|צהריים|ילדים|כלבים|חברים|בחוץ|מסעדה|מסעדות|בר|ברים|קפה|בית קפה|פאב|לאכול|לשתות|איפה|מה)(\s|$)/;
const sxIsDesc=v=>{const w=v.trim().split(/\s+/).filter(Boolean);return w.length>=3||(w.length>=2&&SX_DESC.test(' '+v+' '))};
const sxSrcLbl=x=>x.cat?'מהקטלוג':x.g?'מגוגל':(x.osm||!x.cat)?'מהמפה':'';
function sxInList(x){if(!x||!x.name)return null;return rows.find(r=>(x.pid&&r.placeId===x.pid)||sameP({name:x.name,lat:x.lat,lng:x.lng},{name:r.name,lat:hasLL(r)?r.lat:undefined,lng:hasLL(r)?r.lng:undefined}))||null}
/* basic Google fields only for the result list (cheaper); full details are fetched when a result is added */
const SXF=['id','displayName','formattedAddress','addressComponents','location','types','primaryType','googleMapsURI','businessStatus'];
/* name similarity (letter pairs), so a city in the query can't make unrelated places match */
function sxDice(a,b){a=fomoNorm(a).replace(/\s+/g,'');b=fomoNorm(b).replace(/\s+/g,'');if(!a||!b)return 0;if(a.includes(b)||b.includes(a))return 1;const P=s=>{const m=new Map();for(let i=0;i<s.length-1;i++){const k=s.slice(i,i+2);m.set(k,(m.get(k)||0)+1)}return m};const A=P(a),B=P(b);let n=0;for(const [k,v] of A)n+=Math.min(v,B.get(k)||0);return 2*n/Math.max(1,(a.length-1)+(b.length-1))}
var sxIntent=null;var sxCache=new Map();
function sxWhy(x,I){if(!I)return '';const w=[];if(I.cuisine&&x.cuisine===I.cuisine)w.push(x.cuisine);else if(x.cuisine)w.push(x.cuisine);
  if(I.city&&x.city&&(fomoNorm(x.city).includes(fomoNorm(I.city))||fomoNorm(I.city).includes(fomoNorm(x.city))))w.push('ב'+x.city);if(I.cheap&&x.price&&x.price<=2)w.push('לא יקר');if(I.fancy&&x.price>=3)w.push('יוקרתי');
  if(I.open_now&&x.hours){const o=openState(x);if(o&&o.open)w.push('פתוח עכשיו')}return w.slice(0,3).join(' · ')}
/* the search itself: names -> catalog, AI spelling fix, map, Google suggestions; descriptions -> AI intent, catalog by type/city, Google text search */
/* v55: local catalog from OpenStreetMap (data/places-*.json): searched first, so names are found without AI or Google */
const LOCAL_CATS=['tlv'];let locCat=null,locLoad=null;
function locLoadAll(){if(locCat)return Promise.resolve(locCat);if(locLoad)return locLoad;
  locLoad=Promise.all(LOCAL_CATS.map(c=>fetch(`data/places-${c}.json?v=${APPV}`).then(r=>r.ok?r.json():null).catch(()=>null))).then(A=>{locCat=[];for(const d of A)if(d&&Array.isArray(d.places))for(const p of d.places){if(p.x)continue;p._k=[p.n,...(p.al||[])].map(x=>fomoNorm(x).replace(/\s+/g,''));locCat.push(p)}return locCat});return locLoad}
const LOC_CU=[[/sushi|japan|ramen|יפני|סושי/i,'יפני / סושי'],[/pizza|פיצ/i,'פיצה'],[/ital|pasta|איטלק/i,'איטלקי'],[/burger|המבורגר/i,'המבורגר'],[/steak|meat|grill|bbq|בשר|גריל/i,'בשרים'],[/fish|seafood|דגים/i,'דגים ופירות ים'],[/asian|chinese|thai|vietnam|korean|אסיית|סיני|תאילנד/i,'אסייתי'],[/mexic|מקסיק/i,'מקסיקני'],[/indian|הודי/i,'הודי'],[/hummus|middle.?east|israeli|חומוס|מזרחי|ישראלי/i,'חומוס ומזרחי'],[/mediterr|greek|ים.?תיכונ/i,'ים-תיכוני'],[/vegan|טבעונ/i,'טבעוני'],[/dessert|ice.?cream|pastry|קינוח|גלידה/i,'קינוחים'],[/cafe|coffee|brunch|breakfast|קפה|בראנץ/i,"קפה ובראנץ'"]];
const locCu=s=>{if(!s)return '';for(const [r,v] of LOC_CU)if(r.test(s))return v;return ''};
function locToItem(p){const h=p.oh?parseOH(p.oh):null;return {loc:1,osm:p.id,name:p.n,full:[p.n,p.a,p.c].filter(Boolean).join(', '),address:p.a||'',city:/aviv|תל.?אביב/i.test(p.c||'')?'תל אביב':(p.c||''),lat:p.la,lng:p.lo,cuisine:p.cu||locCu(p.cu_site),price:0,hours:h&&okHours(h)?h:null,site:safeUrl(p.w||''),phone:p.p||'',veg:!!(p.v||p.vg),kosher:!!p.k,vegan:!!p.vg,gf:!!p.gf}}
async function locSearch(v,lim=6){const L=await locLoadAll();const q=fomoNorm(v).replace(/\s+/g,'');if(q.length<2||!L.length)return [];const out=[];
  for(const p of L){let sc=0;for(const k of p._k){if(!k)continue;const d=k===q?1:(k.startsWith(q)&&q.length>=3)?.92:(q.length>=4&&k.includes(q))?.8:sxDice(k,q);if(d>sc)sc=d}if(sc>=.6)out.push([sc,p])}
  out.sort((a,b)=>b[0]-a[0]);return out.slice(0,lim).map(([sc,p])=>Object.assign(locToItem(p),{score:sc}))}
async function locBrowse(I,lim=8){const L=await locLoadAll();if(!L.length)return [];const cty=I.city?fomoNorm(I.city):'';
  const R=L.filter(p=>(!I.cuisine||p.cu===I.cuisine)&&(!cty||fomoNorm(p.c||'').includes(cty)||cty.includes(fomoNorm(p.c||'')))&&(!I.vegan||p.vg)&&(!I.kosher||p.k));
  const items=R.map(locToItem).filter(x=>!I.open_now||!x.hours||(openState(x)||{}).open);items.sort((a,b)=>(!!b.hours-!!a.hours)||(!!b.site-!!a.site));return items.slice(0,lim)}
const sxAttr=L=>(L||[]).some(x=>x&&x.loc)?'<p class="sx-attr">חלק מהמקומות מ־<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></p>':'';
async function sxSearch(v,opt){v=v.trim();const key=v+'|'+(opt&&opt.desc?1:0);if(sxCache.has(key))return sxCache.get(key);let out=null;
  if(opt&&opt.desc){const I=await aiCall({action:'intent',q:v,cuisines:CUIS,tags:TAGS});
    if(I&&I.ok&&I.kind==='describe'){track('ai-search');if(I.city)I.city=String(I.city).replace(/^תל[\s-]?אביב\s*[-–]?\s*יפו$/,'תל אביב');const L=[];
      try{const {data}=await sb.rpc('browse_places',{c:I.cuisine,cty:I.city,lim:8});for(const p of data||[])L.push(catToItem(p))}catch(e){console.warn('browse',e)}
      if(L.length<8)try{for(const it of await locBrowse(I,8))if(!L.some(y=>sameP(y,it)))L.push(it)}catch(e){console.warn('local',e)}
      if(L.length<5&&I.query&&(window.APP_CONFIG||{}).googleKey){const qq=await takeQuota('gsearch');if(qq.ok){try{const ps=await gSearch(I.query,SXF,8);for(const p of ps||[]){if(p.businessStatus==='CLOSED_PERMANENTLY'||!isFoodG([p.primaryType,...(p.types||[])]))continue;const it=gToItem(p);it.gpid=p.id||'';if(!L.some(y=>(y.gpid&&y.gpid===it.gpid)||(!y.g&&sameP(y,it))))L.push(it)}}catch(e){console.warn('g text',e)}}}
      const ok=x=>(x.g||!I.cuisine||!x.cuisine||x.cuisine===I.cuisine)&&(!I.cheap||!x.price||x.price<=2)&&(!I.fancy||!x.price||x.price>=3)&&(!I.open_now||!x.hours||(openState(x)||{}).open);
      const items=L.filter(ok).slice(0,8);items.forEach(x=>x.why=sxWhy(x,I));out={mode:'ai',intent:I,items}}
    else if(I&&I.ok&&I.kind==='name'&&I.name)v=[I.name,I.city].filter(Boolean).join(' ')}
  if(!out){let res=await catSearch(v);try{for(const it of await locSearch(v))if(!res.some(x=>sameP(x,it)))res.push(it)}catch(e){console.warn('local',e)}res.sort((a,b)=>(b.score||0)-(a.score||0));const found=()=>res.some(x=>(x.cat&&x.score>=.45)||(x.loc&&x.score>=.75));let q2=v;
    if(!found()&&!(opt&&opt.noAi)){const ai=await aiCall({action:'parse',q:v});if(ai&&ai.name){track('ai');placeSearch.last={q:v,ai};q2=[ai.name,ai.city].filter(Boolean).join(' ');
      for(const t of [q2,...(ai.alt||[]).map(a=>[a,ai.city].filter(Boolean).join(' '))].filter((x,i,A)=>x&&x!==v&&A.indexOf(x)===i).slice(0,3)){const more=await catSearch(t);for(const m of more)if(!res.some(x=>x.pid===m.pid))res.push(m);if(found())break}res.sort((a,b)=>b.score-a.score)}}
    {const L=placeSearch.last&&placeSearch.last.q===v&&placeSearch.last.ai?placeSearch.last.ai:null;const names=[v,L&&L.name,...((L&&L.alt)||[])].filter(Boolean);res=res.filter(x=>!(x.cat||x.loc)||names.some(n=>sxDice(x.name,n)>=.5))}
    if(!res.some(x=>x.cat||x.loc)){const o=await osmSearch(q2);res=res.concat(o.filter(y=>!res.some(x=>sameP(x,y))&&[v,q2].some(n=>sxDice(y.name,n.split(' ').slice(0,3).join(' '))>=.4)))}
    if(!res.length){let g=null;try{g=await gSuggest(q2)}catch(e){console.warn('google suggest',e)}res=g||[]}
    out={mode:'name',items:res.slice(0,8)}}
  sxCache.set(key,out);if(sxCache.size>40)sxCache.delete(sxCache.keys().next().value);return out}
const sxAv=x=>`<div class="sx-av" aria-hidden="true">${esc((x.name||'?').trim().charAt(0))}</div>`;
function sxRow(x,i,ctx){const ex=sxInList(x),loc=[x.address,x.city].filter(Boolean).join(', ')||String(x.full||'').split(',').slice(0,2).join(','),meta=[x.cuisine,loc,x.price?'₪'.repeat(x.price):''].filter(Boolean).join(' · ');const o=x.hours?openState(x):null;
  const right=ex?`<button class="sx-in" type="button" data-sx-open="${esc(ex.id)}">✓ כבר בקבוצה<br><u>לפתוח</u></button>`:`<button class="sx-add" type="button" data-sx-add="${ctx}:${i}">➕ הוספה</button>`;
  return `<div class="sx-row">${sxAv(x)}<div class="sx-t"><b>${esc(x.name)}</b>${meta?`<p class="meta">${esc(meta)}</p>`:''}${x.why?`<div class="sx-why">✨ ${esc(x.why)}</div>`:''}<div class="sx-tags">${o&&o.open?'<span class="op">פתוח עכשיו</span>':''}<span>${sxSrcLbl(x)}</span></div></div>${right}</div>`}
const sxIntentHtml=I=>`<div class="sx-intent">${[I.cuisine&&'סוג: '+I.cuisine,I.city&&'עיר: '+I.city,I.area&&'אזור: '+I.area,I.cheap&&'לא יקר',I.fancy&&'יוקרתי',I.open_now&&'פתוח עכשיו',...(I.tags||[])].filter(Boolean).map(c=>`<span>${esc(c)}</span>`).join('')||'<span>חיפוש כללי</span>'}</div>`;
const sxThink=steps=>`<div class="sx-think">${steps.map((s,i)=>`<div class="r ${i===0?'run':''}"><span class="d"></span>${s}</div>`).join('')}</div>`;
function sxStep(box){const R=box?[...box.querySelectorAll('.sx-think .r')]:[];let i=0;const t=setInterval(()=>{if(!R[i]||!R[i].isConnected){clearInterval(t);return}R[i].classList.remove('run');R[i].classList.add('on');R[i].querySelector('.d').textContent='✓';i++;if(R[i])R[i].classList.add('run');else clearInterval(t)},650);return ()=>clearInterval(t)}
var sxRes={list:[],plus:[]};
/* ---- list page ---- */
function sxOwnFilter(r,I){if(I.cuisine&&r.cuisine!==I.cuisine)return false;if(I.city){const a=fomoNorm(r.city||''),b=fomoNorm(I.city);if(!a||!(a.includes(b)||b.includes(a)))return false}if(I.area&&![r.address,r.city,r.notes].join(' ').includes(I.area))return false;
  if(I.cheap&&r.price>2)return false;if(I.fancy&&r.price&&r.price<3)return false;if(I.open_now&&!(openState(r)||{}).open)return false;return true}
var sxT=null,sxSeq=0;
function sxListAfter(n){const v=q.trim(),on=v.length>=2,band=$('#grid').parentElement;
  ['#friendsLoved','#soon'].forEach(s=>{const e=$(s);if(e)e.classList.toggle('sx-hide',on)});
  let h=$('#sxMineH'),m=$('#sxMore');if(!on){if(h)h.remove();if(m)m.remove();sxIntent=null;return}
  if(!h){h=document.createElement('div');h.id='sxMineH';h.className='sx-h';$('#grid').before(h)}h.innerHTML=`בקבוצה שלכם <small>${n||'אין'}</small>`;
  if(!m){m=document.createElement('div');m.id='sxMore';band.appendChild(m)}
  const g=$('#grid');if(!n&&g){const e=g.querySelector('.empty');if(e)e.outerHTML=`<p class="sx-note">${sxIntent&&sxIntent.q===v?'אין בקבוצה מקום שמתאים לזה.':'המקום עוד לא בקבוצה שלכם.'}</p>`}
  if(m.dataset.q===v)return;clearTimeout(sxT);const desc=sxIsDesc(v);
  sxT=setTimeout(()=>sxListRun(v,desc),desc?1100:450)}
async function sxListRun(v,desc){if(q.trim()!==v)return;const m=$('#sxMore');if(!m)return;m.dataset.q=v;const seq=++sxSeq;const W=$('#q').closest('.sx-qwrap');
  m.innerHTML=`<div class="sx-h">מקומות נוספים ${desc?'':'<small><span class="sx-fast">⚡ מיידי</span></small>'}</div>`+(desc?sxThink(['מבין את הבקשה','מחפש בקטלוג, במפה ובגוגל','משאיר רק אוכל ושתייה','מסדר לפי מה שמתאים']):`<div class="sx-list"><p class="sx-note">מחפש…</p></div>`);
  if(W&&desc)W.classList.add('busy');const stop=desc?sxStep(m):()=>{};let r=null;try{r=await sxSearch(v,{desc})}finally{stop();if(W)W.classList.remove('busy')}
  if(seq!==sxSeq||q.trim()!==v)return;
  if(r.mode==='ai'){sxIntent={...r.intent,q:v};renderList()}
  const items=r.items.filter(x=>!sxInList(x));sxRes.list=items;
  const mm=$('#sxMore');if(!mm)return;mm.dataset.q=v;
  mm.innerHTML=`<div class="sx-h">מקומות נוספים ${r.mode==='name'?'<small><span class="sx-fast">⚡ מיידי</span></small>':''}</div>`+(r.mode==='ai'?sxIntentHtml(r.intent):'')
    +`<div class="sx-list">${items.length?items.map((x,i)=>sxRow(x,i,'list')).join(''):`<p class="sx-note">${r.items.length?'כל מה שמצאנו כבר בקבוצה שלכם 👌':'לא מצאנו מקומות נוספים. נסו לנסח אחרת.'}</p>`}</div>${sxAttr(items)}`}
/* ---- ＋ sheet ---- */
function addSheet(){killFormMap();openId=null;mode='add';openSheet();track('plus');
  $('#sb').innerHTML=`<div class="sec dh"><h2 style="margin-bottom:12px">מקום חדש</h2><form class="sx-sheethead" id="sxPF"><span class="sx-qwrap"><span class="sx-spark" aria-hidden="true">✨</span><input class="f" id="sxPQ" autocomplete="off" enterkeyhint="search" placeholder="חיפוש חכם: איזה מקום להוסיף?" aria-label="חיפוש מקום להוספה"></span><button class="btn pri" type="submit">חיפוש</button></form>
  <div id="sxPB"><p class="note" style="margin:0 2px">כותבים שם של מקום, או מתארים, למשל "בר יין שקט בתל אביב".</p></div>
  <button class="btn sx-manual" type="button" data-sx-manual>✍️ הוספה ידנית, בלי חיפוש</button><p class="note sx-alt">אפשר גם: <button type="button" class="linkb" data-sx-voice>🎤 בקול</button> · <button type="button" class="linkb" data-sx-paste>📋 קישור מגוגל מפות</button></p></div>`;
  setTimeout(()=>{const i=$('#sxPQ');if(i)i.focus()},300)}
var sxPT=null,sxPSeq=0;
async function sxPlusRun(v,force){v=(v||'').trim();const B=$('#sxPB');if(!B)return;if(v.length<2){return}const desc=sxIsDesc(v);if(desc&&!force)return;const seq=++sxPSeq;const W=$('#sxPQ').closest('.sx-qwrap');
  B.innerHTML=desc?sxThink(['מבין את הבקשה','מחפש בקטלוג, במפה ובגוגל','משאיר רק אוכל ושתייה']):'<p class="sx-note">מחפש…</p>';if(desc&&W)W.classList.add('busy');const stop=desc?sxStep(B):()=>{};
  let r=null;try{r=await sxSearch(v,{desc})}finally{stop();if(W)W.classList.remove('busy')}if(seq!==sxPSeq||!$('#sxPB'))return;
  sxRes.plus=r.items;$('#sxPB').innerHTML=(r.mode==='name'?'<p style="margin:0 2px 10px"><span class="sx-fast">⚡ מיידי</span></p>':sxIntentHtml(r.intent))+`<div class="sx-list">${r.items.length?r.items.map((x,i)=>sxRow(x,i,'plus')).join(''):'<p class="sx-note">לא מצאנו. אפשר להוסיף ידנית 👇</p>'}</div>${sxAttr(r.items)}`}
/* ---- picking a result opens the form, filled and arranged ---- */
async function sxAdd(x){track('sx-add');try{await loadLeaflet()}catch{}
  if(x.g&&x.gpid&&!x.pred){const qq=await takeQuota('place');if(qq.ok){try{const g=await gmaps();const {Place}=await g.maps.importLibrary('places');const pl=new Place({id:x.gpid});await pl.fetchFields({fields:GF});const it=gToItem(pl);it.gpid=x.gpid;x=it}catch(e){console.warn('g details',e)}}}
  newForm();const f=$('#ef');if(!f)return;const qi=$('#placeQ');if(qi)qi.blur();
  f.classList.add('sx-compact');placeSearch.res=[x];await placePick(0);sxCompact()}
function sxCompact(){const f=$('#ef');if(!f||f.dataset.sx)return;f.dataset.sx='1';const E=f.elements,g=f.querySelector('.grid2'),quick=f.querySelector('.quick');
  const st=$('#fillSt'),dn=$('#dupN');if(quick){if(st)quick.before(st);if(dn)quick.before(dn);quick.hidden=true}
  const lab=n=>{const el=E[n];return el&&(el.closest('label')||el)};
  const more=document.createElement('details');more.className='sx-more';more.innerHTML='<summary>פרטים נוספים · מפה, קישורים ושעות</summary><div class="sx-in-grid"></div>';const MG=more.querySelector('.sx-in-grid');
  ['name','cuisine','city','price','address'].forEach(n=>{const l=lab(n);if(l)MG.appendChild(l)});const mp=f.querySelector('#fmap');if(mp)MG.appendChild(mp.closest('.full'));
  ['mapsUrl','site','woltUrl'].forEach(n=>{const l=lab(n);if(l)MG.appendChild(l)});const hrs=f.querySelector('details.hours');if(hrs){hrs.classList.remove('full');MG.appendChild(hrs)}
  g.insertAdjacentHTML('afterbegin','<div class="sx-sec">מה שרק אתם יודעים</div>');const notes=lab('notes');if(notes)notes.after(more);else g.appendChild(more);
  more.addEventListener('toggle',()=>{if(more.open&&fmap)setTimeout(()=>fmap.invalidateSize(),60)});
  const pr=+E.price.value||0,o=null;const meta=[E.cuisine.value,[E.address.value,E.city.value].filter(Boolean).join(', '),pr?'₪'.repeat(pr):''].filter(Boolean).join(' · ');
  const sum=document.createElement('div');sum.className='sx-sum';sum.innerHTML=`${sxAv({name:E.name.value})}<div class="sx-t"><b>${esc(E.name.value)}</b><p class="meta">${esc(meta)}</p></div><button class="btn sm" type="button" data-sx-edit>עריכה</button>`;
  (st||g).before(sum);
  E.name.addEventListener('input',()=>{const b=sum.querySelector('b');if(b)b.textContent=E.name.value})}
/* ---- events ---- */
document.addEventListener('click',e=>{const t=e.target;
  const ad=t.closest('[data-sx-add]');if(ad){const [c,i]=ad.dataset.sxAdd.split(':');const x=(sxRes[c]||[])[+i];if(x)sxAdd(x);return}
  const op=t.closest('[data-sx-open]');if(op){const r=byId(op.dataset.sxOpen);if(r){openDetail(r.id)}return}
  if(t.closest('[data-sx-manual]')){track('sx-manual');newForm();const f=$('#ef');if(f){const qk=f.querySelector('.quick');if(qk)qk.hidden=true;const n=f.elements.name;if(n)n.focus()}return}
  if(t.closest('[data-sx-voice]')){newForm();const v=document.querySelector('#ef [data-act="voice"]');if(v)v.click();return}
  if(t.closest('[data-sx-paste]')){newForm();const p=$('#paste');if(p)p.focus();return}
  if(t.closest('[data-sx-edit]')){const d=document.querySelector('details.sx-more');if(d){d.open=true;d.scrollIntoView({behavior:RM()?'auto':'smooth',block:'start'})}return}});
document.addEventListener('submit',e=>{if(e.target.id!=='sxPF')return;e.preventDefault();sxPlusRun($('#sxPQ').value,true)});
document.addEventListener('input',e=>{if(e.target.id!=='sxPQ')return;clearTimeout(sxPT);const v=e.target.value;sxPT=setTimeout(()=>sxPlusRun(v,false),450)});
/* sticky close bar: solid background once the sheet scrolls */
$('#ov').addEventListener('scroll',()=>{const b=document.querySelector('#ov .sx-bar');if(b)b.classList.toggle('stuck',$('#ov').scrollTop>12)},{passive:true});

/* 43: install banner (Safari/Android, not installed yet) */
function instBanner(){try{if(isStandalone()||!isPhone()||lsGet('rs-inst-done',0))return;if(Date.now()<lsGet('rs-inst-dis',0)||document.querySelector('.instb'))return;
  if(!myId||!loaded||!lsGet('rs-onb2',0)||document.querySelector('.onb,.coach,.calp,.upd,.fx-co')){setTimeout(instBanner,15000);return}
  const safari=isIOS()&&!/crios|fxios|edgios|gsa\//i.test(navigator.userAgent);
  const d=document.createElement('div');d.className='instb';d.setAttribute('role','region');d.setAttribute('aria-label','התקנת האפליקציה');
  d.innerHTML=`<span class="instb-ic" aria-hidden="true">📲</span><div class="instb-t"><b>FOMO על מסך הבית</b><small>${/^and-(samsung|inapp|other)$/.test(instPlat())?'מתקינים דרך Chrome, בלחיצה':'נפתחת כמו אפליקציה, עם התראות'}</small></div>${/^and-(samsung|inapp|other)$/.test(instPlat())?`<a class="btn pri" href="${CHROME_URL}" data-ib="chrome">פתיחה ב־Chrome</a>`:`<button class="btn pri" type="button" data-ib="go">${installEvt?'התקנה':'איך?'}</button>`}<button class="instb-x" type="button" data-ib="x" aria-label="לא עכשיו">×</button>`;
  d.addEventListener('click',e=>{const b=e.target.closest('[data-ib]');if(!b)return;if(b.dataset.ib==='x'){lsSet('rs-inst-dis',Date.now()+3*864e5);d.classList.remove('in');setTimeout(()=>d.remove(),250);return}
    if(b.dataset.ib==='chrome'){track('install-chrome');return}track('install-banner');if(installEvt){const ev=installEvt;installEvt=null;ev.prompt();(ev.userChoice||Promise.resolve()).then(c=>{if(c&&c.outcome==='accepted')d.remove()}).catch(()=>{});return}instHow()});
  document.body.appendChild(d);requestAnimationFrame(()=>d.classList.add('in'))}catch{}}
function instHow(){const pl=instPlat();const d=document.createElement('div');d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label','איך מתקינים');
  d.innerHTML=`<div class="calp-in"><h3>FOMO על מסך הבית</h3>${instSteps(pl)}${instBtn(pl)}<button class="btn" type="button" data-n style="margin-top:10px">הבנתי</button></div>`;
  d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-n]'))d.remove()});document.body.appendChild(d)}
window.addEventListener('appinstalled',()=>{const b=document.querySelector('.instb');if(b)b.remove()});
setTimeout(instBanner,8000);

/* 45: personal greeting */
function greetHtml(){if(!loaded)return '';const h=new Date().getHours();const [g,ic]=h>=5&&h<12?['בוקר טוב','☀️']:h>=12&&h<17?['צהריים טובים','🌤️']:h>=17&&h<22?['ערב טוב','🌆']:['לילה טוב','🌙'];
  const op=rows.filter(r=>{if(r.permClosed)return false;const o=openState(r);return o&&o.open});const near=myLoc?op.filter(r=>{const k=distKm(r);return k!=null&&k<=3}).length:0;
  const hh=rows.filter(r=>{if(r.permClosed)return false;const i=hhInfo(r);return i&&i.now}).length,bits=[];
  if(op.length)bits.push(`<button type="button" class="gr-b" data-gr="open">${op.length===1?'מקום אחד פתוח':op.length+' מקומות פתוחים'} עכשיו${near?` · ${near} קרוב אליך`:''}</button>`);
  if(hh)bits.push(`<button type="button" class="gr-b" data-gr="hh">🍹 ${hh===1?'אחד':hh} בהאפי אוור</button>`);
  return `<span class="gr-h">${g}${myName?', '+esc(myName):''} ${ic}</span>${bits.join('')}`}
function renderGreet(){const el=$('#greet');if(!el)return;const h=greetHtml();if(el.innerHTML!==h)el.innerHTML=h;el.hidden=!h}
document.addEventListener('click',e=>{const b=e.target.closest('[data-gr]');if(!b)return;const k=b.dataset.gr;const go=()=>{const c=k==='open'?$('#cuis [data-open-f]'):$('#cuis [data-qf="hh"]');if(c&&c.getAttribute('aria-pressed')!=='true')c.click();const s=$('#stickyBar');if(s)s.scrollIntoView({behavior:RM()?'auto':'smooth',block:'start'})};
  if(page!=='list'){const t=$('.tabbar [data-v="list"]');if(t)t.click();setTimeout(go,150)}else go()});
setInterval(()=>{if(document.visibilityState==='visible')renderGreet()},60000);

/* 50: duplicate detection */
document.addEventListener('change',e=>{const f=e.target.form;if(!f||f.getAttribute('id')!=='ef'||!['name','city'].includes(e.target.name))return;dupNote({name:f.elements.name.value.trim(),city:f.elements.city.value.trim(),placeId:formSrc.pid})});
function findDup(x){if(!x||!x.name)return null;const n=fomoNorm(x.name),c=fomoNorm(x.city||'');
  return rows.find(r=>{if(mode==='edit'&&r.id===openId)return false;if(x.placeId&&r.placeId===x.placeId)return true;if(fomoNorm(r.name)!==n)return false;
    if(Number.isFinite(x.lat)&&hasLL(r)){const R=6371,t=v=>v*Math.PI/180,dl=t(r.lat-x.lat),dg=t(r.lng-x.lng);const a=Math.sin(dl/2)**2+Math.cos(t(x.lat))*Math.cos(t(r.lat))*Math.sin(dg/2)**2;if(2*R*Math.asin(Math.sqrt(a))<=.3)return true}
    return !c||!r.city||fomoNorm(r.city)===c})||null}
function dupNote(x){const el=$('#dupN');if(!el)return;const d=mode==='new'?findDup(x):null;el.hidden=!d;
  el.innerHTML=d?`<span>👀 <b>${esc(d.name)}</b> כבר בקבוצה${d.city?' ('+esc(d.city)+')':''}.</span><button class="btn" type="button" data-act="dupOpen" data-id="${esc(d.id)}">לפתוח אותו</button><button class="link-btn" type="button" data-act="dupHide">להוסיף בכל זאת</button>`:''}

/* ================= v53: first-run flow (name + places, taste, who, group, invite, home tour) ================= */
const FX_VIBES=['איטלקי','אסייתי','יפני / סושי','בשרים','דגים ופירות ים','המבורגר','פיצה','בר קוקטיילים','בר יין','קפה ובראנץ\'','חומוס ומזרחי','מסעדת שף'];
const FX_WHO=[['partner','💑','בן או בת זוג','דייטים, ערבים לשניים'],['friends','👯','חברים','חבורה, ימי הולדת, סופ״שים'],['family','👨‍👩‍👧','משפחה','ארוחות שישי, מקומות לילדים'],['solo','🙋','בינתיים רק אני','אפשר להזמין אחר כך']];
const FX_EMO=['💛','🍝','🥂','🍣','🔥','✨','🌾','🍷'];
let fx=null;
function fxShell(html,step){const g=$('#gate');g.className='gate fxg';g.innerHTML=`<div class="fx" dir="rtl"><div class="fx-top">${step?`<span class="fx-n">${step}</span>`:''}<span class="fx-logo">Fomo</span></div>${html}</div>`;g.hidden=false;$('#app').hidden=true;g.scrollTop=0;window.scrollTo(0,0)}
async function fxRun(tr){fx={tr,step:3,sel:[],sx:[],who:'',partner:'',emo:'💛',gname:''};track('fx-start-'+tr);if(cur)try{localStorage.setItem('rs-list',cur.id)}catch{}
  if(cur){try{const {data}=await sb.from('restaurants').select('id,data').eq('list_id',cur.id);rows=(data||[]).map(x=>({...(x.data||{}),id:x.id}));takeMeta(cur.id)}catch{}}
  fxStep3()}
const fxTotal=()=>fx.tr==='Y'?2:5;
const fxLbl=n=>`שלב ${n} מתוך ${fxTotal()}`;
/* step 3: name + 3 places */
function fxStep3(){const inv=fx.tr==='Y'&&cur,have=rows.filter(r=>!r._meta&&!(r.visits||[]).some(v=>v&&v.surprise));fxShell(`<h2 class="fx-h">נעים להכיר! איך לקרוא לך?</h2>
  <input class="fx-in" id="fxName" maxlength="30" autocomplete="given-name" value="${esc(myName||fx.name||'')}" placeholder="השם שלך" aria-label="השם שלך">
  <h3 class="fx-h2">${inv?`מה עוד בא לך? אלה כבר ב"${esc(cur.name)}"`:'3 מקומות שיש לך בראש? ✨'}</h3>
  ${inv&&have.length?`<div class="fx-have">${have.slice(0,4).map(r=>`<span>${esc(r.name)}</span>`).join('')}</div>`:''}
  <p class="fx-sub">כותבים שם, או בוחרים מההצעות. כל מקום נוסף עם הכתובת והשעות. אפשר גם לדלג.</p>
  <div class="fx-prog"><span id="fxPc"></span><div class="fx-bar"><i id="fxPb"></i></div></div>
  <span class="sx-qwrap fx-q"><span class="sx-spark" aria-hidden="true">✨</span><input class="search" id="fxQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="חיפוש חכם: שם, או ״בר יין שקט״" aria-label="חיפוש מקום"></span>
  <div id="fxRes" class="fx-res"><p class="fx-sub">טוען הצעות…</p></div>
  <div class="fx-foot"><button class="btn pri" type="button" id="fxNext3">המשך</button><button class="fx-skip" type="button" id="fxSkip3">דלג לשלב הבא</button><div class="err" id="fxErr"></div></div>`,fxLbl(1));
  fxProg();fxSuggest();
  $('#fxQ').addEventListener('input',e=>{clearTimeout(fxStep3.t);const v=e.target.value.trim();fxStep3.t=setTimeout(()=>fxSearch(v),v.length<2?0:(sxIsDesc(v)?1000:450))});
  $('#fxQ').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(fxStep3.t);fxSearch(e.target.value.trim(),true)}});
  $('#fxNext3').onclick=()=>fxSave3(false);$('#fxSkip3').onclick=()=>fxSave3(true)}
function fxProg(){const n=fx.sel.length,a=$('#fxPc'),b=$('#fxPb');if(a)a.textContent=Math.min(3,n)+'/3';if(b)b.style.width=Math.min(100,n/3*100)+'%';const nb=$('#fxNext3');if(nb)nb.classList.toggle('fx-pulse',n>=3)}
async function fxSuggest(){let L=[];try{const {data}=await sb.rpc('browse_places',{c:null,cty:null,lim:8});L=(data||[]).map(catToItem)}catch{}if(!fx||fx.step!==3)return;fx.sx=L.filter(x=>!sxInList(x));fxResRender(fx.sx,'הצעות פופולריות ב־FOMO')}
async function fxSearch(v,force){if(!fx)return;if(v.length<2){fxSuggest();return}const desc=sxIsDesc(v);const box=$('#fxRes');if(!box)return;
  box.innerHTML=desc?sxThink(['מבין את הבקשה','מחפש בקטלוג, במפה ובגוגל','משאיר רק אוכל ושתייה']):'<p class="sx-note">מחפש…</p>';const stop=desc?sxStep(box):()=>{};
  let r=null;try{r=await sxSearch(v,{desc})}catch{}finally{stop()}if(!fx||($('#fxQ')||{}).value.trim()!==v)return;fx.sx=(r&&r.items)||[];fxResRender(fx.sx,'',true)}
function fxResRender(L,head,searched){const box=$('#fxRes');if(!box)return;
  box.innerHTML=(head?`<div class="sx-h">${esc(head)}</div>`:'')+(L.length?`<div class="fx-grid">${L.map((x,i)=>{const on=fx.sel.some(s=>fxSame(s,x)),ex=sxInList(x),meta=[x.cuisine,x.city].filter(Boolean).join(' · ');
    return `<button type="button" class="fx-pc ${on||ex?'on':''}" data-fx-pick="${i}" ${ex?'disabled':''}><span class="fx-pk">${on||ex?'✓':'+'}</span>${sxAv(x)}<b>${esc(x.name)}</b><small>${esc(ex?'כבר בקבוצה':meta||String(x.full||'').split(',').slice(0,2).join(','))}</small></button>`}).join('')}</div>`
    :`<p class="sx-note">${searched?'לא מצאנו. נסו לכתוב אחרת, או דלגו ותוסיפו אחר כך.':'כתבו שם של מקום שבא לכם לנסות.'}</p>`)+sxAttr(L)}
const fxSame=(a,b)=>(a.gpid&&a.gpid===b.gpid)||(a.pid&&a.pid===b.pid)||(a.name===b.name&&(a.city||'')===(b.city||''));
document.addEventListener('click',e=>{const b=e.target.closest('[data-fx-pick]');if(!b||!fx)return;const x=fx.sx[+b.dataset.fxPick];if(!x)return;const i=fx.sel.findIndex(s=>fxSame(s,x));
  if(i>=0){fx.sel.splice(i,1);b.classList.remove('on');b.querySelector('.fx-pk').textContent='+'}else{fx.sel.push(x);b.classList.add('on');b.querySelector('.fx-pk').textContent='✓';toast('✓ '+x.name)}fxProg()});
function fxRowOf(x){const now=Date.now();const d={name:String(x.name||'').slice(0,80),cuisine:x.cuisine||'',city:x.city||'',address:x.address||'',status:'want',price:+x.price||0,recBy:'',mapsUrl:safeUrl(x.mapsUrl||''),site:safeUrl(x.site||''),woltUrl:'',tags:x.veg?['צמחוני-פרנדלי']:[],notes:'',hours:x.hours||{},hh:null,updatedAt:now,fav:false,ratings:{},votes:{},dishes:[],photos:[],visits:[],addedBy:myId,createdAt:now};
  if(Number.isFinite(x.lat)&&Number.isFinite(x.lng)){d.lat=+(+x.lat).toFixed(6);d.lng=+(+x.lng).toFixed(6);d.llLevel='place'}else{d.lat=null;d.lng=null;d.llLevel=''}
  if(typeof x.delivery==='boolean')d.delivery=x.delivery;if(x.pid)d.placeId=x.pid;return d}
let fxGph=[];
async function fxAddPlaces(){const out=[];for(let x of fx.sel){if(sxInList(x))continue;
    if(x.g&&x.gpid&&!x.pred){const qq=await takeQuota('place');if(qq.ok){try{const g=await gmaps();const {Place}=await g.maps.importLibrary('places');const pl=new Place({id:x.gpid});await pl.fetchFields({fields:GF});const it=gToItem(pl);it.gpid=x.gpid;x=it}catch(e){console.warn('g details',e)}}}
    else if(x.pred){try{const pl=await gDetails(x.pred);if(pl){const it=gToItem(pl);it.gpid=pl.id||'';x=it}}catch{}}
    const d=fxRowOf(x),id=uuid();formSrc=x.cat?{pid:x.pid,hoursSrc:x.hours?'user':'',phone:x.phone}:x.osm?{osm:x.osm,phone:x.phone,hoursSrc:x.hours?'osm':''}:x.g?{gpid:x.gpid||'',hoursSrc:'google'}:{};
    try{contribute(d)}catch{}formSrc={};
    const {error}=await sb.from('restaurants').insert({id,list_id:cur.id,data:d});if(error){console.warn('fx add',error);continue}
    rows.unshift({...d,id});out.push(d.name);if(x.gphotos&&x.gphotos.length)fxGph.push([id,x.gphotos])}
  if(out.length)try{logAct('add',null,out.length===1?`הוסיף/ה את ${out[0]}`:`הוסיף/ה ${out.length} מקומות: ${out.join(', ')}`)}catch{}
  return out.length}
async function fxSave3(skip){const n=($('#fxName').value||'').trim().slice(0,30),er=$('#fxErr');if(!n){er.textContent='איך לקרוא לך? כתבו שם, ואז ממשיכים.';$('#fxName').focus();return}
  const bs=[$('#fxNext3'),$('#fxSkip3')];bs.forEach(b=>b.disabled=true);er.textContent='';
  try{const {error}=await sb.from('profiles').upsert({user_id:myId,name:n});if(error)throw error;myName=n;fx.name=n;
    if(!cur){const id=await doCreateList('המקומות של '+n);if(!id)throw new Error('לא הצלחנו לפתוח קבוצה');cur=lists.find(l=>l.id===id)||{id,name:'המקומות של '+n,role:'owner'};try{localStorage.setItem('rs-list',id)}catch{}meta={id:null,special:[],diets:{},vouchers:[],tastes:{}}}
    if(!skip&&fx.sel.length){bs[0].textContent='מוסיף…';const k=await fxAddPlaces();if(k)toast(`✓ ${k===1?'מקום אחד נוסף':k+' מקומות נוספו'}, עם השעות`)}
    track(skip?'fx-skip3':'fx-places-'+fx.sel.length);fxStep4()}catch(e){bs.forEach(b=>b.disabled=false);bs[0].textContent='המשך';er.textContent=errMsg(e)}}
/* step 4: taste */
function fxStep4(){fx.step=4;const d=dietOf(myId),t=((meta.tastes||{})[myId])||{};fx.c=new Set(t.c||[]);fx.k=new Set(d.k||[]);fx.b=t.b||0;
  fxShell(`<h2 class="fx-h">${esc(myName)}, מה הטעם שלך? 😋</h2><p class="fx-sub">ככה נציע מקומות שמתאימים לך. בחרו כמה שבא לכם.</p>
  <div class="fx-chips">${FX_VIBES.map(v=>`<button type="button" class="fx-chip" data-fx-c="${esc(v)}" aria-pressed="${fx.c.has(v)}">${esc(v)}</button>`).join('')}</div>
  <h3 class="fx-h2">משהו שחשוב לדעת?</h3><div class="fx-chips">${DIET.map(([k,tt,e])=>`<button type="button" class="fx-chip" data-fx-k="${k}" aria-pressed="${fx.k.has(k)}">${e} ${tt}</button>`).join('')}</div>
  <h3 class="fx-h2">תקציב בדרך כלל</h3><div class="fx-seg">${[1,2,3,4].map(i=>`<button type="button" data-fx-b="${i}" aria-pressed="${fx.b===i}">${'₪'.repeat(i)}</button>`).join('')}</div>
  <h3 class="fx-h2">איפה בדרך כלל?</h3><input class="fx-in" id="fxCity" maxlength="40" value="${esc(t.city||'')}" placeholder="למשל: תל אביב" aria-label="עיר">
  <div class="fx-foot"><button class="btn pri" type="button" id="fxNext4">שמירה והמשך</button><button class="fx-skip" type="button" id="fxSkip4">דלג</button><div class="err" id="fxErr"></div></div>`,fxLbl(2));
  $('#fxNext4').onclick=()=>fxSave4(false);$('#fxSkip4').onclick=()=>fxSave4(true)}
document.addEventListener('click',e=>{if(!fx)return;const c=e.target.closest('[data-fx-c],[data-fx-k]');if(c){const S=c.dataset.fxC!==undefined?fx.c:fx.k,v=c.dataset.fxC!==undefined?c.dataset.fxC:c.dataset.fxK;S.has(v)?S.delete(v):S.add(v);c.setAttribute('aria-pressed',S.has(v));return}
  const b=e.target.closest('[data-fx-b]');if(b){fx.b=+b.dataset.fxB===fx.b?0:+b.dataset.fxB;document.querySelectorAll('[data-fx-b]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.fxB===fx.b));return}});
async function fxSave4(skip){const btn=$('#fxNext4');if(!skip){btn.disabled=true;const city=($('#fxCity').value||'').trim().slice(0,40);
    const ok=await metaSave({diets:{...(meta.diets||{}),[myId]:{k:[...fx.k],al:dietOf(myId).al||''}},tastes:{...(meta.tastes||{}),[myId]:{c:[...fx.c],b:fx.b,city}}});btn.disabled=false;if(!ok)return;track('fx-taste')}else track('fx-skip4');
  if(fx.tr==='Y')fxDone();else fxStep5()}
/* step 5: who */
function fxStep5(){fx.step=5;fxShell(`<h2 class="fx-h">${esc(myName)}, עם מי יוצאים? 🍽️</h2><p class="fx-sub">ככה נכין לכם קבוצה מתאימה.</p>
  <div class="fx-who">${FX_WHO.map(([k,ic,t,s])=>`<button type="button" data-fx-who="${k}"><span>${ic}</span><div><b>${t}</b><small>${s}</small></div></button>`).join('')}</div>`,fxLbl(3));
  document.querySelectorAll('[data-fx-who]').forEach(b=>b.onclick=()=>{fx.who=b.dataset.fxWho;track('fx-who-'+fx.who);if(fx.who==='solo')fxDone();else fxStep6()})}
/* step 6: group name */
function fxGDefault(){const p=fx.partner.trim();return fx.who==='partner'?(p?`${myName} ו${p}`:`${myName} ובן/בת הזוג`):fx.who==='family'?'ארוחות משפחתיות':'החבר׳ה יוצאים'}
function fxStep6(){fx.step=6;const pt=fx.who==='partner';fx.gname='';
  fxShell(`<h2 class="fx-h">${pt?'איך קוראים לבן או לבת הזוג?':'איך נקרא לקבוצה?'}</h2><p class="fx-sub">${pt?'נשתמש בזה לשם הקבוצה ולהזמנה.':'אפשר לשנות אחר כך בהגדרות.'}</p>
  ${pt?`<input class="fx-in" id="fxPartner" maxlength="30" value="${esc(fx.partner)}" placeholder="השם שלו או שלה" aria-label="שם בן או בת הזוג">`:''}
  <h3 class="fx-h2">שם הקבוצה</h3><input class="fx-in" id="fxGName" maxlength="34" value="${esc(fxGDefault())}" aria-label="שם הקבוצה">
  <h3 class="fx-h2">אימוג׳י לקבוצה</h3><div class="fx-emo">${FX_EMO.map(e=>`<button type="button" data-fx-e="${e}" aria-pressed="${fx.emo===e}">${e}</button>`).join('')}</div>
  <div class="fx-foot"><button class="btn pri" type="button" id="fxNext6">המשך</button><div class="err" id="fxErr"></div></div>`,fxLbl(4));
  const P=$('#fxPartner'),G=$('#fxGName');let touched=false;G.addEventListener('input',()=>touched=true);if(P)P.addEventListener('input',()=>{fx.partner=P.value;if(!touched)G.value=fxGDefault()});
  document.querySelectorAll('[data-fx-e]').forEach(b=>b.onclick=()=>{fx.emo=b.dataset.fxE;document.querySelectorAll('[data-fx-e]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  $('#fxNext6').onclick=async()=>{const n=(G.value.trim()||fxGDefault()).slice(0,34)+' '+fx.emo;const b=$('#fxNext6');b.disabled=true;
    const {error}=await sb.from('lists').update({name:n.slice(0,40)}).eq('id',cur.id);b.disabled=false;if(error){$('#fxErr').textContent=errMsg(error);return}cur.name=n.slice(0,40);const l=lists.find(x=>x.id===cur.id);if(l)l.name=cur.name;track('fx-group');fxStep7()}}
/* step 7: invite */
function fxInvText(){const p=fx.partner.trim();return fx.who==='partner'?`היי${p?' '+p:''} ${fx.emo} פתחתי לנו קבוצה ב־FOMO לכל המקומות שבא לנו לנסות ביחד. מצטרפים בלחיצה 👇`:fx.who==='family'?`היי ${fx.emo} פתחתי לנו קבוצה משפחתית ב־FOMO, לכל המקומות שבא לנו לנסות. מצטרפים בלחיצה 👇`:`היי ${fx.emo} פתחתי לנו קבוצה ב־FOMO לכל המקומות שבא לנו לנסות ביחד. מצטרפים בלחיצה, ותוסיפו גם אתם 👇`}
async function fxStep7(){fx.step=7;if(!cur.join_code){try{await loadLists();const l=lists.find(x=>x.id===cur.id);if(l)cur=l}catch{}}const p=fx.partner.trim(),url=inviteUrl();
  fxShell(`<h2 class="fx-h">שולחים ${fx.who==='partner'&&p?'ל'+esc(p):'לחבורה'} 💌</h2><p class="fx-sub">ההודעה כבר מוכנה. מי שלוחץ מצטרף לקבוצה ורואה את המקומות מיד.</p>
  <div class="fx-wa"><div class="fx-bub">${esc(fxInvText())}<div class="fx-lp"><i>F</i><div><b>${esc(cur.name)}</b><small dir="ltr">${esc(url.replace(/^https?:\/\//,'').slice(0,34))}…</small></div></div></div></div>
  <div class="fx-foot"><button class="btn fx-wabtn" type="button" id="fxSend">💬 שליחה בוואטסאפ</button><button class="btn" type="button" id="fxCopy">${ICON.copy}העתקת הקישור</button><button class="fx-skip" type="button" id="fxLater">אחר כך</button></div>`,fxLbl(5));
  $('#fxSend').onclick=async()=>{track('fx-invite');const t=fxInvText()+'\n'+url;if(navigator.share&&isPhone()){try{await navigator.share({title:'Fomo',text:fxInvText(),url});fxAfterInv();return}catch(e){if(e&&e.name==='AbortError')return}}window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener');fxAfterInv()};
  $('#fxCopy').onclick=async()=>{try{await navigator.clipboard.writeText(fxInvText()+'\n'+url);toast('הקישור הועתק 📋');track('fx-invite-copy');fxAfterInv()}catch{toast(url)}};
  $('#fxLater').onclick=()=>{track('fx-invite-later');fxDone()}}
function fxAfterInv(){lsSet('rs-fx-inv',1);const b=$('#fxLater');if(b){b.textContent='המשך ←';b.classList.add('fx-pulse')}}
/* finish: into the app, then the tour */
function fxDone(){lsSet('rs-fx-done',1);lsSet('rs-onb2',1);lsSet('rs-tips',{...tipsDone(),list:1});lsSet('rs-seen-ver',APPV);lsSet('rs-fx-tour',fx.tr==='Y'?'Y':'I');lsSet('rs-fx-at',Date.now());track('fx-done-'+fx.tr);fx=null;const g=$('#gate');g.className='gate';start()}
/* ---- coach-mark tour on the real screen ---- */
function fxVis(el){if(!el)return false;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'}
function fxTour(){const kind=lsGet('rs-fx-tour','');if(!kind||page!=='list'||document.querySelector('.fx-co,.onb,.calp'))return;lsSet('rs-fx-tour','');lsSet('rs-tips',{...tipsDone(),list:1});
  const grp=members.length>1||kind==='Y',has=rows.length>0,taste=dietOf(myId).k.length||(((meta.tastes||{})[myId]||{}).c||[]).length;
  const S=[{s:'header.band .top',t:'זה הבית שלך 🏠',d:grp?`כל המקומות של "${esc(cur.name)}" במקום אחד. מה שמישהו בקבוצה מוסיף, כולם רואים מיד.`:'כל המקומות שלך במקום אחד. למעלה: כמה מקומות יש, ומה פתוח עכשיו.'},
    {s:'#v-list .seg',t:'רוצים ללכת / היינו',d:'"רוצים ללכת" זה מה שעוד לא ניסיתם. אחרי ביקור מסמנים "היינו", מדרגים, והמקום עובר לשם.'+(grp?' ב"שנינו רוצים השבוע" רואים רק מה ששניכם סימנתם "בא לי".':'')},
    {s:'#v-list .sx-qwrap',t:'✨ חיפוש חכם',d:'כותבים שם או תיאור, כמו "בר יין שקט". מחפש בקבוצה שלכם, וגם מוצא מקומות חדשים להוסיף.'},
    ...(taste?[{s:'#cuis',t:'סינון מהיר',d:'מסננים לפי סוג, פתוח עכשיו, מה שמתאים לך ועוד. ההעדפות שבחרת נשמרות ב"אני".'}]:[]),
    ...(has?[{s:'#grid .card',t:'כרטיס מקום',d:'נגיעה בכרטיס פותחת שעות, כתובת, ניווט והערות. השעות מתמלאות לבד.'}]:[]),
    {s:'.tabbar',t:'הניווט למטה',d:'מפה: איפה כל המקומות. ＋: הוספת מקום. יציאות: מה עשיתם ומה מתוכנן. אני: הפרופיל, ההעדפות וההגדרות.'},
    {s:'#fab',t:'📷 צילום במסעדה',d:'במסעדה? מצלמים קבלה או מנה, וה־AI ממלא את הביקור בשבילכם.'}].filter(x=>fxVis(document.querySelector(x.s)));
  if(!S.length){fxArmPush();return}track('fx-tour');let k=0;const co=document.createElement('div');co.className='fx-co';co.setAttribute('role','dialog');co.setAttribute('aria-label','סיור קצר');co.innerHTML='<div class="fx-spot"></div><div class="fx-cb"></div>';document.body.appendChild(co);
  const end=()=>{co.remove();window.removeEventListener('resize',show);lsSet('rs-fx-toured',1);fxChk();const c=document.querySelector('#grid .card');if(c){c.classList.add('fx-hl');setTimeout(()=>c.classList.remove('fx-hl'),6000);toast('👆 נסו עכשיו: פתחו את אחד המקומות')}fxArmPush()};
  function show(){const s=S[k],el=document.querySelector(s.s);if(!el){k++;k<S.length?show():end();return}
    const fixed=getComputedStyle(el).position==='fixed'||!!el.closest('.tabbar');if(!fixed){const r0=el.getBoundingClientRect();if(r0.top<70||r0.bottom>innerHeight-200)window.scrollTo({top:Math.max(0,scrollY+r0.top-110),behavior:'auto'})}
    requestAnimationFrame(()=>{const r=el.getBoundingClientRect(),sp=co.querySelector('.fx-spot'),cb=co.querySelector('.fx-cb');const pad=6;sp.style.top=(r.top-pad)+'px';sp.style.left=(r.left-pad)+'px';sp.style.width=(r.width+pad*2)+'px';sp.style.height=Math.min(r.height+pad*2,innerHeight*.5)+'px';
      cb.innerHTML=`<b>${s.t}</b><p>${s.d}</p><div class="fx-cbr"><span class="fx-dots">${S.map((_,j)=>`<i class="${j===k?'on':''}"></i>`).join('')}</span><span><button type="button" class="fx-cskip" data-co="skip">דלג</button><button type="button" class="btn pri sm" data-co="next">${k===S.length-1?'הבנתי ✓':'הבא'}</button></span></div>`;
      const below=r.top+Math.min(r.height,innerHeight*.5)<innerHeight*.55;cb.style.top=below?Math.min(innerHeight-220,r.top+Math.min(r.height,innerHeight*.5)+16)+'px':'auto';cb.style.bottom=below?'auto':Math.max(16,innerHeight-r.top+16)+'px';const nb=cb.querySelector('[data-co=next]');if(nb)nb.focus()})}
  co.addEventListener('click',e=>{const b=e.target.closest('[data-co]');if(!b)return;if(b.dataset.co==='skip'){track('fx-tour-skip');end();return}k++;if(k>=S.length)end();else show()});
  window.addEventListener('resize',show);show()}
/* ---- notifications: asked after the user has looked around ---- */
let fxPush=null;
function fxArmPush(){if(lsGet('rs-push-asked',0)||fxPush)return;let n=0;const on=e=>{if(e.target.closest('.tabbar a,.tabbar button,#grid .card,#v-list .seg button,#cuis .chip,[data-v]')&&++n>=4)fire()};
  const fire=async()=>{document.removeEventListener('click',on,true);clearTimeout(fxPush);if(lsGet('rs-push-asked',0))return;const st=await pushState();if(st!=='off')return;
    setTimeout(()=>{if(!$('#ov').hidden||document.querySelector('.calp,.fx-co')){setTimeout(fire,8000);return}lsSet('rs-push-asked',1);pushAsk=false;renderNotices();track('fx-push-ask');
      const d=document.createElement('div');d.className='calp';d.setAttribute('role','dialog');d.setAttribute('aria-label','התראות');
      d.innerHTML=`<div class="calp-in"><div class="calp-ic" style="font-size:28px">🔔</div><h3>רוצה שנעדכן אותך?</h3><p class="meta">כשמקום מהקבוצה פתוח וקרוב אליך, כשמישהו בקבוצה מוסיף מקום, ולפני יציאה שתכננתם. לא יותר מהתראה ביום.</p><button class="btn pri" type="button" data-y>כן, לעדכן אותי</button><button class="link-btn" type="button" data-n>לא עכשיו</button></div>`;
      d.addEventListener('click',async e=>{if(e.target.closest('[data-y]')){d.remove();track('fx-push-yes');await pushOn();fxChk()}else if(e.target===d||e.target.closest('[data-n]')){d.remove();track('fx-push-no')}});document.body.appendChild(d)},900)};
  document.addEventListener('click',on,true);fxPush=setTimeout(fire,15000)}
/* ---- "first steps" card on the list, for the first two weeks ---- */
let fxPushOn=null;
function fxChk(){const at=lsGet('rs-fx-at',0);let el=$('#fxChk');if(!at||Date.now()-at>14*864e5||lsGet('rs-fx-chk-x',0)||page!=='list'||!loaded||(q||'').trim()){if(el)el.remove();return}
  if(fxPushOn===null){fxPushOn=false;pushState().then(s=>{fxPushOn=s==='on';fxChk()})}
  const taste=dietOf(myId).k.length||(((meta.tastes||{})[myId]||{}).c||[]).length;
  const C=[['מקומות ראשונים',rows.length>0,'add'],['הטעם שלי',!!taste,'taste'],['סיור במסך הבית',!!lsGet('rs-fx-toured',0),'tour'],['התראות',fxPushOn,'push'],[members.length>1?'הקבוצה ('+members.length+')':'הזמנה לקבוצה',members.length>1,'inv']];
  const done=C.filter(c=>c[1]).length;if(done===C.length){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='fxChk';const fl=$('#friendsLoved');if(!fl)return;fl.before(el)}
  const h=`<div class="fx-chk"><div class="fx-chkh"><b>צעדים ראשונים</b><span class="fx-ring" style="--p:${done/C.length*360}deg"><span>${done}/${C.length}</span></span><button type="button" class="fx-x" data-fxc="x" aria-label="הסתרה">×</button></div>${C.map(([t,d,k])=>`<button type="button" class="fx-ck ${d?'d':''}" data-fxc="${k}" ${d?'disabled':''}><i>${d?'✓':''}</i>${esc(t)}${d?'':'<span>←</span>'}</button>`).join('')}</div>`;if(el.innerHTML!==h)el.innerHTML=h}
document.addEventListener('click',e=>{const b=e.target.closest('[data-fxc]');if(!b)return;const k=b.dataset.fxc;track('fx-chk-'+k);
  if(k==='x'){lsSet('rs-fx-chk-x',1);fxChk();return}if(k==='add'){addSheet();return}if(k==='taste'){settingsSheet('me','tasteF');return}
  if(k==='tour'){lsSet('rs-fx-tour','I');window.scrollTo(0,0);setTimeout(fxTour,250);return}if(k==='push'){settingsSheet('ntf','setPush');return}
  if(k==='inv'){settingsSheet('grp','setInv');return}});
/* ---- invite preview on the sign-up screen ---- */
async function fxInvPreview(code){try{const {data,error}=await sb.rpc('invite_preview',{code});if(error||!data||!data.name)return;const el=$('#invPv');if(!el)return;const P=(data.places||[]).filter(Boolean);
  el.innerHTML=`<h2 class="fx-ih">${data.by?esc(data.by)+' הזמין/ה אותך ל':'הוזמנת ל'}"${esc(data.name)}"</h2>${P.length?`<div class="fx-pv"><small>כבר מחכים לך ${data.n>P.length?data.n+' מקומות, ביניהם':''}:</small>${P.map(n=>`<div>📍 <b>${esc(n)}</b></div>`).join('')}</div>`:''}`}catch{}}

if(!CFG.supabaseUrl||!CFG.supabaseKey||!window.supabase){gate('<p>האפליקציה עוד לא מחוברת למסד הנתונים. צריך למלא את הקובץ config.js.</p>')}
else{sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,experimental:{passkey:true}}});const pubT=new URLSearchParams(location.search).get('pub');if(pubT)renderPublic(pubT);else start()}
}
