/* DOM */
const $=id=>document.getElementById(id);
const views={home:$('homeView'),activity:$('activityView'),study:$('studyView'),drill:$('drillView')};
const setGrid=$('setGrid');
const themeSel=$('themeSel'), resetPrefs=$('resetPrefs');
const setTag=$('setTag'), studySetTag=$('studySetTag'), drillSetTag=$('drillSetTag');
const backHome=$('backHome'), goStudy=$('goStudy'), goDrill=$('goDrill'), backActivity1=$('backActivity1'), backActivity2=$('backActivity2');
const studyTable=$('studyTable').querySelector('tbody');
const hideEs=$('hideEs'), hideEn=$('hideEn'), filterBox=$('filterBox');
const strict=$('strict'), shuffle=$('shuffle');
const modeRadios=[...document.querySelectorAll('input[name="mode"]')], mathLabel=$('mathLabel'), mathOps=$('mathOps');
const opAdd=$('opAdd'), opSub=$('opSub'), opDiv=$('opDiv'), qCount=$('qCount');
const title=$('title'), promptEl=$('prompt'), answer=$('answer');
const audioBtn=$('audioBtn'), checkBtn=$('checkBtn'), hintBtn=$('hintBtn'), skipBtn=$('skipBtn');
const scoreTag=$('scoreTag'), streakTag=$('streakTag'), remainTag=$('remainTag'), prog=$('prog');
const finish=$('finish'), summary=$('summary'), retryWrongBtn=$('retryWrongBtn'), copyMissedBtn=$('copyMissedBtn'), restartBtn=$('restartBtn');
const panelBtn=$('panelBtn'), studyPanel=$('studyPanel'), split=$('split');
const pHideEs=$('pHideEs'), pHideEn=$('pHideEn'), panelFilter=$('panelFilter'), panelTable=$('panelTable').querySelector('tbody');
const tour=$('tour'), tourBtn=$('tourBtn'), closeTour=$('closeTour');

/* State */
let catalogs=[];            // [{key,title,desc,file,math?}]
let currentCatalog=null;
let items=[];
let dir='en2es';
let queue=[], idx=0, seen=0, correct=0, streak=0, revealed=0, wrongIdx=[];

const NUM_TO_ES={0:"cero",1:"uno",2:"dos",3:"tres",4:"cuatro",5:"cinco",6:"seis",7:"siete",8:"ocho",9:"nueve",10:"diez",11:"once",12:"doce",13:"trece",14:"catorce",15:"quince",16:"dieciséis",17:"diecisiete",18:"dieciocho",19:"diecinueve",20:"veinte"};
const ALLOWED_RESULTS=Object.keys(NUM_TO_ES).map(n=>+n);
const RANGE_MIN=0,RANGE_MAX=20;

/* Utils */
function nav(to){ Object.values(views).forEach(v=>v.classList.remove('active')); views[to].classList.add('active'); window.scrollTo({top:0,behavior:'instant'}); }
function shuffleInPlace(a){ for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]} }
function normalize(s,lenient){ s=(s||"").trim().toLowerCase().replace(/\s+/g,' '); if(lenient){ s=s.normalize('NFD').replace(/\p{Diacritic}/gu,''); s=s.replace(/[.,/#!$%^&*;:{}=\-_`~()¿¡?'"…]/g,''); } return s; }
function speak(text){ try{const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){} }
function feedback(msg,tone){ const el=$('feedback'); el.style.color = tone==='ok'?'var(--ok)':tone==='bad'?'var(--bad)':'var(--muted)'; el.textContent=msg; }
function setPanel(open){ studyPanel.classList.toggle('hidden', !open); studyPanel.setAttribute('aria-hidden', String(!open)); panelBtn.setAttribute('aria-expanded', String(open)); split.classList.toggle('with-panel', open); }

/* Catalogs -> Home */
async function loadCatalogs(){
  const res=await fetch('data/catalogs.json'); catalogs=await res.json();
  setGrid.innerHTML='';
  catalogs.forEach(cat=>{
    const card=document.createElement('div'); card.className='card pad tile';
    card.innerHTML=`<div><h2>${cat.title}</h2><p class="muted">${cat.desc}</p></div><div><button class="btn primary">Open</button></div>`;
    card.querySelector('button').onclick=()=>openCatalog(cat);
    setGrid.appendChild(card);
  });
}
async function openCatalog(cat){
  currentCatalog=cat;
  const res=await fetch(cat.file); const json=await res.json();
  items=json.items||[];
  setTag.textContent=cat.title; studySetTag.textContent=cat.title; drillSetTag.textContent=cat.title;
  nav('activity');
}

/* Study */
function renderStudy(list){
  studyTable.innerHTML='';
  list.forEach(it=>{
    const tr=document.createElement('tr');
    const tdEs=document.createElement('td'); tdEs.textContent=it.es; tdEs.className='col-es';
    const tdEn=document.createElement('td'); tdEn.textContent=it.en; tdEn.className='col-en';
    const tdBtn=document.createElement('td'); const b=document.createElement('button'); b.className='btn'; b.textContent='🔊'; b.onclick=()=>speak(it.es); tdBtn.appendChild(b);
    tr.append(tdEs,tdEn,tdBtn); studyTable.appendChild(tr);
  });
  applyStudyHides();
}
function applyStudyHides(){
  document.querySelectorAll('#studyTable .col-es').forEach(td=>td.style.visibility=hideEs.checked?'hidden':'visible');
  document.querySelectorAll('#studyTable .col-en').forEach(td=>td.style.visibility=hideEn.checked?'hidden':'visible');
}
hideEs.onchange=applyStudyHides; hideEn.onchange=applyStudyHides;
filterBox.oninput=()=>{ const q=filterBox.value.trim().toLowerCase(); renderStudy(!q?items:items.filter(it=>it.es.toLowerCase().includes(q)||it.en.toLowerCase().includes(q))); };

/* Panel */
function buildPanel(list){
  panelTable.innerHTML='';
  list.forEach(it=>{
    const tr=document.createElement('tr');
    const es=document.createElement('td'); es.textContent=it.es; es.className='p-es';
    const en=document.createElement('td'); en.textContent=it.en; en.className='p-en';
    const td=document.createElement('td'); const b=document.createElement('button'); b.className='btn'; b.textContent='🔊'; b.onclick=()=>speak(it.es); td.appendChild(b);
    tr.append(es,en,td); panelTable.appendChild(tr);
  });
  applyPanelHides();
}
function applyPanelHides(){
  document.querySelectorAll('#panelTable .p-es').forEach(td=>td.style.visibility=pHideEs.checked?'hidden':'visible');
  document.querySelectorAll('#panelTable .p-en').forEach(td=>td.style.visibility=pHideEn.checked?'hidden':'visible');
}
pHideEs.onchange=applyPanelHides; pHideEn.onchange=applyPanelHides;
panelFilter.oninput=()=>{ const q=panelFilter.value.trim().toLowerCase(); [...panelTable.querySelectorAll('tr')].forEach(tr=>{ const es=tr.querySelector('.p-es')?.textContent.toLowerCase()||''; const en=tr.querySelector('.p-en')?.textContent.toLowerCase()||''; tr.style.display=(es.includes(q)||en.includes(q))?'':'none'; }); };

/* Drill helpers */
function mathPool(ops){
  const pool=[], inRange=n=>n>=RANGE_MIN&&n<=RANGE_MAX, known=n=>ALLOWED_RESULTS.includes(n);
  for(let a=RANGE_MIN;a<=RANGE_MAX;a++) for(let b=RANGE_MIN;b<=RANGE_MAX;b++){
    if(ops.add){ const r=a+b; if(inRange(r)&&known(r)) pool.push({q:`${a} + ${b} = ?`, es:NUM_TO_ES[r]}); }
    if(ops.sub){ const r=a-b; if(r>=0&&known(r)) pool.push({q:`${a} − ${b} = ?`, es:NUM_TO_ES[r]}); }
    if(ops.div && b!==0 && a%b===0){ const r=a/b; if(Number.isInteger(r)&&inRange(r)&&known(r)) pool.push({q:`${a} ÷ ${b} = ?`, es:NUM_TO_ES[r]}); }
  }
  const uniq=[], seen=new Set(); for(const it of pool){ if(!seen.has(it.q)){ seen.add(it.q); uniq.push(it);} } return uniq;
}
function buildRound(fromWrong=false){
  wrongIdx = fromWrong ? wrongIdx : [];
  if(dir==='math'){
    const ops={add:opAdd.checked,sub:opSub.checked,div:opDiv.checked}; if(!ops.add&&!ops.sub&&!ops.div){opAdd.checked=true;ops.add=true}
    let pool=mathPool(ops); if(!pool.length){ alert('No valid math items; change ops.'); return; }
    const n=Math.max(5,Math.min(40,+qCount.value||20));
    shuffleInPlace(pool); items=pool.slice(0,n); queue=items.map((_,i)=>i);
  }else{
    queue = fromWrong ? Array.from(new Set(wrongIdx)) : items.map((_,i)=>i);
    if(shuffle.checked && !fromWrong) shuffleInPlace(queue);
  }
  idx=0; seen=0; correct=0; streak=0; revealed=0; wrongIdx=[];
  prog.max=queue.length; prog.value=0; remainTag.textContent=queue.length+" left";
  finish.style.display='none';
  setPanel(false);
  buildPanel(items);
  nextCard(); updateHud();
}
function promptFor(i){
  if(dir==='math'){ title.textContent="Solve → type Spanish number"; return items[i].q; }
  if(dir==='en2es'){ title.textContent="Type the Spanish term for:"; return items[i].en; }
  title.textContent="Type the English meaning of:"; return items[i].es;
}
function goldAnswerFor(i){ return (dir==='math') ? items[i].es : (dir==='en2es' ? items[i].es : items[i].en); }
function nextCard(){
  if(idx>=queue.length){ endRound(); return; }
  revealed=0; feedback('','');
  const qi=queue[idx]; promptEl.textContent=promptFor(qi); answer.value=""; answer.focus();
  remainTag.textContent=(queue.length-idx)+" left"; prog.value=idx;
}
function endRound(){
  const acc=Math.round(100*correct/Math.max(1,queue.length));
  summary.innerHTML=`Score <b>${correct}</b> / ${queue.length} • Accuracy ${acc}%`;
  finish.style.display='block';
  retryWrongBtn.style.display = wrongIdx.length ? 'inline-block' : 'none';
}
function updateHud(){ scoreTag.textContent=`${correct} / ${seen}`; streakTag.textContent=`streak ${streak}`; }

/* Wire up */
document.addEventListener('DOMContentLoaded',loadCatalogs);
backHome.onclick=()=>nav('home');
goStudy.onclick=()=>{ if(!items.length) return; renderStudy(items); nav('study'); };
backActivity1.onclick=()=>nav('activity');
$('studyToDrill').onclick=()=>goDrill.click();

goDrill.onclick=()=>{
  if(!items.length) return;
  drillSetTag.textContent=currentCatalog.title;
  const isNum=(currentCatalog.key==='numbers' || /numbers/i.test(currentCatalog.title));
  mathLabel.classList.toggle('hidden', !isNum);
  dir=(document.querySelector('input[name="mode"]:checked')||{}).value||'en2es';
  mathOps.classList.toggle('hidden', !(isNum && dir==='math'));
  buildRound(false); nav('drill');
};
backActivity2.onclick=()=>nav('activity');

modeRadios.forEach(r=>r.addEventListener('change', ()=>{
  dir=(document.querySelector('input[name="mode"]:checked')||{}).value||'en2es';
  const isNum=(currentCatalog?.key==='numbers' || /numbers/i.test(currentCatalog?.title||''));
  mathOps.classList.toggle('hidden', !(isNum && dir==='math'));
  buildRound(false);
}));
[opAdd,opSub,opDiv,qCount,shuffle].forEach(x=>x.addEventListener('change', ()=>buildRound(false)));

audioBtn.onclick=()=>{ if(idx<queue.length){ speak(goldAnswerFor(queue[idx])); } };
checkBtn.onclick=()=>{
  if(idx>=queue.length) return;
  seen++;
  const want=normalize(goldAnswerFor(queue[idx]), !strict.checked);
  const got =normalize(answer.value, !strict.checked);
  if(got && got===want){ correct++; streak++; feedback('Correct: '+goldAnswerFor(queue[idx]), 'ok'); idx++; }
  else{ streak=0; feedback('Incorrect. Correct: '+goldAnswerFor(queue[idx]), 'bad'); const again=Math.min(queue.length, idx+3); queue.splice(again,0,queue[idx]); wrongIdx.push(queue[idx]); idx++; }
  updateHud(); setTimeout(nextCard, 340);
};
hintBtn.onclick=()=>{ const ans=goldAnswerFor(queue[idx]); revealed=Math.min(ans.length, revealed+Math.max(1,Math.ceil(ans.length*0.12))); answer.value=ans.slice(0,revealed); feedback('Hint used','warn'); answer.focus(); answer.setSelectionRange(answer.value.length,answer.value.length); };
skipBtn.onclick=()=>{ wrongIdx.push(queue[idx]); const again=Math.min(queue.length, idx+3); queue.splice(again,0,queue[idx]); seen++; streak=0; updateHud(); feedback('Skipped. Answer: '+goldAnswerFor(queue[idx]), ''); idx++; setTimeout(nextCard,320); };
restartBtn.onclick=()=>buildRound(false);
retryWrongBtn.onclick=()=>{ queue=Array.from(new Set(wrongIdx)); idx=0; seen=0; correct=0; streak=0; revealed=0; wrongIdx=[]; prog.max=queue.length; prog.value=0; finish.style.display='none'; nextCard(); updateHud(); };
copyMissedBtn.onclick=async()=>{ const uniq=[...new Set(wrongIdx)]; const lines=uniq.length?uniq.map(i=>`${items[i].es}  →  ${items[i].en}`):['No misses.']; try{await navigator.clipboard.writeText(lines.join('\n')); feedback('Missed items copied.','');}catch{} };
panelBtn.onclick=()=>{ setPanel(studyPanel.classList.contains('hidden')); };

/* Accent insert */
document.querySelectorAll('.accentbar [data-ins]').forEach(b=>{
  b.addEventListener('click',()=>{
    const ch=b.getAttribute('data-ins'); const s=answer.selectionStart||answer.value.length, e=answer.selectionEnd||answer.value.length, v=answer.value;
    answer.value=v.slice(0,s)+ch+v.slice(e); answer.focus(); const p=s+ch.length; answer.setSelectionRange(p,p);
  });
});

/* Tour + Theme */
tourBtn.onclick=()=>{ tour.classList.remove('hidden'); };
closeTour.onclick=()=>{ tour.classList.add('hidden'); };
tour.addEventListener('click',e=>{ if(e.target===tour) tour.classList.add('hidden'); });

(function bootTheme(){ const saved=localStorage.getItem('theme')||'mono'; document.documentElement.setAttribute('data-theme', saved); themeSel.value=saved; })();
themeSel.onchange=()=>{ document.documentElement.setAttribute('data-theme', themeSel.value); localStorage.setItem('theme', themeSel.value); };
resetPrefs.onclick=()=>{ localStorage.clear(); location.reload(); };
