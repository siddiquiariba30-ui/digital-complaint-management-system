const KEY='dcms_complaints_v1', STAT=['Pending','In Review','Resolved','Rejected'];
const $=id=>document.getElementById(id);
const cls=s=>s.replace(' ','');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mem=[],imgData='',isAdmin=false,rating=0;
function load(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return mem}}
function save(d){mem=d;try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch(e){toast('Storage full or unavailable');return false}}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
const fmt=t=>new Date(t).toLocaleString([], {dateStyle:'medium',timeStyle:'short'});

// navigation
document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x===b));
  ['submit','track','admin'].forEach(v=>$(v).classList.toggle('hide',v!==b.dataset.v));
  if(b.dataset.v==='admin'&&isAdmin)renderAdmin();
});

// image upload with compression
$('sImg').onchange=e=>{
  const f=e.target.files[0];imgData='';$('prev').classList.add('hide');
  if(!f)return;
  if(!f.type.startsWith('image/')){toast('Please choose an image file');e.target.value='';return}
  const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{
    const m=900,s=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');
    c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    imgData=c.toDataURL('image/jpeg',.7);$('prev').src=imgData;$('prev').classList.remove('hide');
  };im.src=r.result};
  r.readAsDataURL(f);
};

// submit
$('subBtn').onclick=()=>{
  const v=id=>$(id).value.trim();
  if(!v('sName')||!v('sRoll')||!v('sSub')||!v('sDesc')){toast('Please fill all required fields');return}
  const d=load();
  const max=d.reduce((m,c)=>Math.max(m,parseInt(c.id.split('-')[1])),1000);
  const c={id:'CMP-'+(max+1),name:v('sName'),roll:v('sRoll'),cat:$('sCat').value,
    subject:v('sSub'),priority:$('sPri').value,desc:v('sDesc'),img:imgData,status:'Pending',
    created:Date.now(),updated:Date.now(),response:'',feedback:null};
  d.unshift(c);
  if(!save(d))return;
  $('done').innerHTML=`<h2>✅ Complaint submitted</h2><p>Your complaint ID is <b>${c.id}</b>. Keep it safe to track the status.</p>`;
  $('done').classList.remove('hide');
  ['sName','sRoll','sSub','sDesc','sImg'].forEach(i=>$(i).value='');
  imgData='';$('prev').classList.add('hide');
  toast('Complaint submitted');
};

// track
function trackCard(c){
  const steps=c.status==='Rejected'?`<div class="on Rejected">Rejected</div>`:
    ['Submitted','In Review','Resolved'].map((s,i)=>`<div class="${i<=[0,1,1,2][STAT.indexOf(c.status)]?'on':''}">${s}</div>`).join('');
  let fb='';
  if(c.status==='Resolved'){
    fb=c.feedback?`<div class="resp"><b>Your feedback:</b> ${'★'.repeat(c.feedback.rating)}${'☆'.repeat(5-c.feedback.rating)}<br>${esc(c.feedback.text)}</div>`:
    `<div class="resp"><b>How did we do?</b><div class="stars" data-id="${c.id}">${[1,2,3,4,5].map(n=>`<button data-n="${n}">★</button>`).join('')}</div>
    <textarea id="fbT" placeholder="Share your feedback..." style="min-height:60px"></textarea>
    <button class="btn sm" data-fb="${c.id}" style="margin-top:8px">Send feedback</button></div>`;
  }
  return `<div class="item"><div class="top"><b>${c.id} · ${esc(c.subject)}</b><span class="badge ${cls(c.status)}">${c.status}</span></div>
  <div class="meta">${esc(c.cat)} · ${c.priority} priority · Filed ${fmt(c.created)} · Updated ${fmt(c.updated)}</div>
  <div class="steps">${steps}</div><p>${esc(c.desc)}</p>
  ${c.img?`<img class="proof" src="${c.img}" alt="Proof">`:''}
  ${c.response?`<div class="resp"><b>Admin response:</b><br>${esc(c.response)}</div>`:''}${fb}</div>`;
}
$('tBtn').onclick=()=>{
  const id=$('tId').value.trim().toUpperCase(),roll=$('tRoll').value.trim().toLowerCase();
  if(!id&&!roll){toast('Enter a complaint ID or student ID');return}
  const r=load().filter(c=>id?c.id===id:c.roll.toLowerCase()===roll);
  $('tOut').innerHTML=r.length?r.map(trackCard).join(''):'<div class="card empty">No complaint found.</div>';
};
$('tOut').onclick=e=>{
  const s=e.target.closest('.stars button');
  if(s){rating=+s.dataset.n;s.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.n<=rating));return}
  const f=e.target.dataset.fb;
  if(f){
    if(!rating){toast('Please select a star rating');return}
    const d=load(),c=d.find(x=>x.id===f);
    c.feedback={rating,text:$('fbT').value.trim()};rating=0;
    if(save(d)){toast('Thanks for your feedback!');$('tBtn').click()}
  }
  if(e.target.classList.contains('proof'))openLb(e.target.src);
};

// admin
$('loginBtn').onclick=()=>{
  if($('pw').value==='admin123'){isAdmin=true;$('login').classList.add('hide');$('panel').classList.remove('hide');$('pw').value='';renderAdmin()}
  else toast('Wrong password');
};
$('logout').onclick=()=>{isAdmin=false;$('panel').classList.add('hide');$('login').classList.remove('hide')};
$('fSt').onchange=$('fQ').oninput=()=>renderAdmin();
function renderAdmin(){
  const d=load();
  $('stats').innerHTML=`<div class="stat"><b>${d.length}</b>Total</div>`+STAT.map(s=>`<div class="stat"><b class="${cls(s)}">${d.filter(c=>c.status===s).length}</b>${s}</div>`).join('');
  const st=$('fSt').value,q=$('fQ').value.toLowerCase();
  const r=d.filter(c=>(st==='All'||c.status===st)&&(!q||[c.id,c.name,c.roll,c.subject,c.cat].join(' ').toLowerCase().includes(q)));
  $('list').innerHTML=r.length?r.map(c=>`<div class="item" data-id="${c.id}">
  <div class="top"><b>${c.id} · ${esc(c.subject)}</b><span class="badge ${cls(c.status)}">${c.status}</span></div>
  <div class="meta">${esc(c.name)} (${esc(c.roll)}) · ${esc(c.cat)} · ${c.priority} priority · ${fmt(c.created)}</div>
  <p>${esc(c.desc)}</p>${c.img?`<img class="proof" src="${c.img}" alt="Proof">`:''}
  ${c.feedback?`<div class="meta">Student feedback: ${'★'.repeat(c.feedback.rating)} ${esc(c.feedback.text)}</div>`:''}
  <label>Status</label><select class="aSt">${STAT.map(s=>`<option ${s===c.status?'selected':''}>${s}</option>`).join('')}</select>
  <label>Response to student</label><textarea class="aRe" style="min-height:60px">${esc(c.response)}</textarea>
  <button class="btn sm aSave" style="margin-top:10px">Save update</button>
  <button class="btn sm bad aDel" style="margin-top:10px;margin-left:6px">Delete</button></div>`).join(''):'<div class="card empty">No complaints to show.</div>';
}
$('list').onclick=e=>{
  const it=e.target.closest('.item');if(!it)return;
  if(e.target.classList.contains('proof'))return openLb(e.target.src);
  const d=load(),i=d.findIndex(c=>c.id===it.dataset.id);if(i<0)return;
  if(e.target.classList.contains('aSave')){
    d[i].status=it.querySelector('.aSt').value;d[i].response=it.querySelector('.aRe').value.trim();d[i].updated=Date.now();
    if(save(d)){toast('Complaint updated');renderAdmin()}
  }
  if(e.target.classList.contains('aDel')&&confirm('Delete '+d[i].id+' permanently?')){
    d.splice(i,1);if(save(d)){toast('Deleted');renderAdmin()}
  }
};

// lightbox
function openLb(src){$('lb').firstElementChild.src=src;$('lb').style.display='flex'}
$('lb').onclick=()=>$('lb').style.display='none';