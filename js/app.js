const DB_KEY='hackme_demo_v1';
const USER_KEY='hackme_user';

const seed = {
  users: [],
  hackathons: [{
    id:'demo', name:'AI For India', theme:'Artificial Intelligence',
    category:'AI', description:'Build the future with AI. Create practical solutions for students, communities and India.',
    host:'Rahul', hostId:'demo-host', joinCode:'X7K9P2A', maxTeam:4, prizePool:50000,
    firstPrize:25000, secondPrize:15000, thirdPrize:10000,
    regStart:'2026-09-20T09:00', regEnd:'2026-10-05T23:59',
    hackStart:'2026-10-06T09:00', deadline:'2026-10-10T23:59',
    rules:'Build original work. Respect other participants. Submit a working project with a public repository and demo.',
    participants:128, teams:37, submissions:2, createdAt:Date.now(),
    joinedBy:[], teamList:[], submissionList:[], scores:[], announced:false
  }]
};

function db(){try{return JSON.parse(localStorage.getItem(DB_KEY))||seed}catch{return seed}}
function save(d){localStorage.setItem(DB_KEY,JSON.stringify(d))}
if(!localStorage.getItem(DB_KEY)) save(seed);

function currentUser(){return localStorage.getItem(USER_KEY)}
function requireUser(){if(!currentUser()){location.href='login.html';return false}return true}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function money(n){return '₹'+Number(n||0).toLocaleString('en-IN')}
function qs(k){return new URLSearchParams(location.search).get(k)}
function toast(msg){const e=document.createElement('div');e.className='toast';e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),2400)}
function status(h){
  const now=Date.now(), rs=new Date(h.regStart).getTime(), re=new Date(h.regEnd).getTime(), hs=new Date(h.hackStart).getTime(), dl=new Date(h.deadline).getTime();
  if(now<rs)return 'UPCOMING'; if(now<re)return 'REGISTRATION OPEN'; if(now<hs)return 'REGISTRATION CLOSED'; if(now<dl)return 'HACKING'; return h.announced?'COMPLETED':'SUBMISSION CLOSED';
}
function code(){const chars='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<7;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s}

function nav(){
 const n=document.getElementById('navbar'); if(!n)return;
 n.innerHTML=`<nav class="navbar"><a class="brand" href="index.html"><span>H</span> HackMe</a><div class="nav-links"><a href="explore.html">Explore</a><a href="join.html">Participate</a><a href="dashboard.html">Dashboard</a><a href="create.html" class="btn btn-primary btn-sm">Create</a>${currentUser()?`<a href="#" onclick="logout();return false">Sign out</a>`:`<a href="login.html">Login</a>`}</div></nav>`;
}
function logout(){localStorage.removeItem(USER_KEY);location.href='index.html'}

document.addEventListener('DOMContentLoaded',()=>{
 nav();
 const login=document.getElementById('loginForm'); if(login)login.onsubmit=e=>{e.preventDefault();const u=document.getElementById('username').value.trim();if(u.length<2)return;localStorage.setItem(USER_KEY,u);let d=db();if(!d.users.includes(u))d.users.push(u);save(d);location.href='dashboard.html'};
 const jf=document.getElementById('joinForm');if(jf){const prefilled=qs('code');if(prefilled)document.getElementById('joinCode').value=prefilled.toUpperCase();jf.onsubmit=e=>{e.preventDefault();const c=document.getElementById('joinCode').value.trim().toUpperCase();const h=db().hackathons.find(x=>x.joinCode===c);const error=document.getElementById('joinError');if(!h){if(error)error.textContent="Hackathon not found. Check the code and try again.";return}if(error)error.textContent='';location.href='hackathon.html?id='+encodeURIComponent(h.id)}};
 const cf=document.getElementById('createForm');if(cf){cf.onsubmit=createHackathon;setupCreateWizard(cf);}
 if(document.getElementById('exploreGrid'))renderExplore();
 if(document.getElementById('welcome'))renderDashboard();
 if(document.getElementById('hackathonView'))renderHackathon();
 if(document.getElementById('hostView'))renderHost();
 if(document.getElementById('teamView'))renderTeams();
 if(document.getElementById('submitView'))renderSubmit();
 if(document.getElementById('judgingView'))renderJudging();
 if(document.getElementById('leaderboardView'))renderLeaderboard();
});

function setupCreateWizard(form){
  const sections=[...form.querySelectorAll('.create-section')];
  const steps=[...form.querySelectorAll('.create-step')];
  let current=0;

  function show(index){
    current=Math.max(0,Math.min(index,sections.length-1));
    sections.forEach((section,i)=>{section.hidden=i!==current;section.classList.toggle('active',i===current);});
    steps.forEach((step,i)=>step.classList.toggle('active',i===current));
    sections[current]?.querySelector('input,textarea,select')?.focus();
  }

  function dateTime(prefix){
    const date=document.getElementById(prefix+'Date')?.value||'';
    const time=document.getElementById(prefix+'Time')?.value||'';
    return date && time ? `${date}T${time}` : '';
  }

  function setDefaultTimeline(){
    const defaults={
      regStart:['2026-10-01','09:00'],
      regEnd:['2026-10-05','23:59'],
      hackStart:['2026-10-06','09:00'],
      deadline:['2026-10-10','23:59']
    };
    Object.entries(defaults).forEach(([prefix,[date,time]])=>{
      const d=document.getElementById(prefix+'Date');
      const t=document.getElementById(prefix+'Time');
      if(d&&!d.value)d.value=date;
      if(t&&!t.value)t.value=time;
    });
  }

  function validateSection(index){
    const fields=[...sections[index].querySelectorAll('input,textarea,select')];
    for(const field of fields){
      if(!field.checkValidity()){field.reportValidity();return false;}
    }
    if(index===1){
      const rs=new Date(dateTime('regStart'));
      const re=new Date(dateTime('regEnd'));
      const hs=new Date(dateTime('hackStart'));
      const dl=new Date(dateTime('deadline'));
      if([rs,re,hs,dl].some(x=>Number.isNaN(x.getTime()))){toast('Please enter both a date and time for every timeline field.');return false;}
      if(rs>=re||re>hs||hs>=dl){toast('Timeline must be Registration Start → Registration End → Hacking Start → Submission Deadline.');return false;}
    }
    if(index===2){
      const total=Number(document.getElementById('prizePool').value||0);
      const sum=['firstPrize','secondPrize','thirdPrize'].reduce((n,id)=>n+Number(document.getElementById(id).value||0),0);
      if(sum>total){toast('Prize amounts cannot exceed the total prize pool.');return false;}
    }
    return true;
  }

  form.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',()=>{if(validateSection(current))show(current+1);}));
  form.querySelectorAll('[data-prev]').forEach(btn=>btn.addEventListener('click',()=>show(current-1)));

  form.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||e.shiftKey||e.ctrlKey||e.metaKey)return;
    const tag=e.target.tagName.toLowerCase();
    if(tag==='textarea')return;
    e.preventDefault();
    if(current<sections.length-1){
      if(validateSection(current))show(current+1);
    }else{
      if(validateSection(current))form.requestSubmit();
    }
  });

  setDefaultTimeline();
  show(0);
}

function joinByCode(id){const c=document.getElementById(id).value.trim().toUpperCase();const h=db().hackathons.find(x=>x.joinCode===c);if(h)location.href='hackathon.html?id='+encodeURIComponent(h.id);else toast('Hackathon not found')}

function renderExplore(){
 const d=db(), q=(document.getElementById('search')?.value||'').toLowerCase(), sort=document.getElementById('sort')?.value||'newest';
 let list=d.hackathons.filter(h=>`${h.name} ${h.theme} ${h.description}`.toLowerCase().includes(q));
 if(sort==='prize')list.sort((a,b)=>b.prizePool-a.prizePool);else if(sort==='deadline')list.sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));else list.sort((a,b)=>b.createdAt-a.createdAt);
 const el=document.getElementById('exploreGrid');el.innerHTML=list.length?list.map(card).join(''):`<div class="empty">No hackathons found.</div>`;
}
function card(h){return `<article class="card hack-card" onclick="location.href='hackathon.html?id=${encodeURIComponent(h.id)}'"><span class="tag">${esc(status(h))}</span><h3>${esc(h.name)}</h3><p class="muted">${esc(h.description)}</p><div class="card-meta"><div><small>Prize Pool</small><b>${money(h.prizePool)}</b></div><div><small>Team Size</small><b>1–${h.maxTeam}</b></div><div><small>Theme</small><b>${esc(h.theme)}</b></div><div><small>Code</small><b>${esc(h.joinCode)}</b></div></div></article>`}

function renderDashboard(){
 if(!requireUser())return;const u=currentUser(),d=db(),hosted=d.hackathons.filter(h=>h.host===u),joined=d.hackathons.filter(h=>h.joinedBy?.includes(u)),subs=d.hackathons.flatMap(h=>h.submissionList||[]).filter(s=>s.user===u);
 document.getElementById('welcome').textContent=`Welcome, ${u}.`;document.getElementById('hostedCount').textContent=hosted.length;document.getElementById('joinedCount').textContent=joined.length;document.getElementById('submissionCount').textContent=subs.length;document.getElementById('upcomingCount').textContent=d.hackathons.filter(h=>status(h)==='UPCOMING').length;
 const all=[...new Map([...hosted,...joined].map(x=>[x.id,x])).values()];document.getElementById('myHackathons').innerHTML=all.length?all.map(card).join(''):`<div class="empty">You haven't joined or created a hackathon yet.<br><br><a class="btn btn-primary" href="create.html">Create Hackathon</a></div>`;
}

function generateUniqueCode(d){
  let next=code();
  while(d.hackathons.some(h=>h.joinCode===next)) next=code();
  return next;
}

function createHackathon(e){
  e.preventDefault();

  if(!requireUser()) return;

  const get=id=>{
    const el=document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  try{
    const d=db();

    const h={
      id:'hackathon-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
      name:get('name'),
      theme:get('theme'),
      category:get('category'),
      description:get('description'),
      host:currentUser(),
      hostId:currentUser(),
      joinCode:generateUniqueCode(d),
      maxTeam:Number(get('maxTeam')),
      prizePool:Number(get('prizePool')||0),
      firstPrize:Number(get('firstPrize')||0),
      secondPrize:Number(get('secondPrize')||0),
      thirdPrize:Number(get('thirdPrize')||0),
      regStart:document.getElementById('regStartDate')?.value && document.getElementById('regStartTime')?.value ? document.getElementById('regStartDate').value+'T'+document.getElementById('regStartTime').value : '',
      regEnd:document.getElementById('regEndDate')?.value && document.getElementById('regEndTime')?.value ? document.getElementById('regEndDate').value+'T'+document.getElementById('regEndTime').value : '',
      hackStart:document.getElementById('hackStartDate')?.value && document.getElementById('hackStartTime')?.value ? document.getElementById('hackStartDate').value+'T'+document.getElementById('hackStartTime').value : '',
      deadline:document.getElementById('deadlineDate')?.value && document.getElementById('deadlineTime')?.value ? document.getElementById('deadlineDate').value+'T'+document.getElementById('deadlineTime').value : '',
      rules:get('rules'),
      participants:0,
      teams:0,
      submissions:0,
      createdAt:Date.now(),
      joinedBy:[],
      teamList:[],
      submissionList:[],
      scores:[],
      announced:false
    };

    if(!h.name || !h.theme || !h.description || !h.category || !h.maxTeam){
      return toast('Please complete all Basic Information fields.');
    }
    if(!h.regStart || !h.regEnd || !h.hackStart || !h.deadline){
      return toast('Please complete all Timeline fields.');
    }
    if(!h.rules){
      return toast('Please enter the hackathon rules.');
    }

    const rs=new Date(h.regStart), re=new Date(h.regEnd), hs=new Date(h.hackStart), dl=new Date(h.deadline);
    if([rs,re,hs,dl].some(x=>Number.isNaN(x.getTime()))) return toast('Please enter valid dates.');
    if(rs>=re || re>hs || hs>=dl) return toast('Timeline must be Registration Start → Registration End → Hacking Start → Submission Deadline.');

    if(h.maxTeam<1 || h.maxTeam>20) return toast('Maximum team size must be between 1 and 20.');
    if(h.prizePool<0 || h.firstPrize<0 || h.secondPrize<0 || h.thirdPrize<0) return toast('Prize amounts cannot be negative.');
    if(h.firstPrize+h.secondPrize+h.thirdPrize>h.prizePool) return toast('Prize amounts cannot exceed the total prize pool.');

    d.hackathons.push(h);
    save(d);

    const saved=db().hackathons.find(x=>x.id===h.id);
    if(!saved) return toast('Hackathon could not be saved.');

    renderCreationSuccess(saved);
  }catch(err){
    console.error('Create Hackathon Error:',err);
    toast('Could not create the hackathon. Check the browser console.');
  }
}

function renderCreationSuccess(h){
  const page=document.querySelector('main.page');
  if(!page) return;

  const joinUrl=new URL('join.html',location.href).href+'?code='+encodeURIComponent(h.joinCode);

  page.innerHTML=`
    <section class="success-card glass">
      <div class="success-icon">✓</div>
      <div class="eyebrow">HACKATHON CREATED</div>
      <h1>Your hackathon is live.</h1>
      <p class="muted">${esc(h.name)} is ready. Share the unique code with participants.</p>

      <div class="generated-code-box">
        <small>HACKATHON CODE</small>
        <strong id="generatedCode">${esc(h.joinCode)}</strong>
        <p class="muted">Participants can enter this code from Participate.</p>
      </div>

      <div class="success-actions">
        <button class="btn btn-primary" onclick="copyHackathonCode('${h.joinCode}')">Copy Code</button>
        <button class="btn btn-secondary" onclick="copyHackathonLink('${joinUrl}')">Copy Join Link</button>
        <a class="btn btn-secondary" href="hackathon.html?id=${encodeURIComponent(h.id)}">Open Hackathon</a>
        <a class="btn btn-secondary" href="host.html?id=${encodeURIComponent(h.id)}">Host Dashboard</a>
      </div>

      <div class="success-summary">
        <div><small>Theme</small><b>${esc(h.theme)}</b></div>
        <div><small>Category</small><b>${esc(h.category)}</b></div>
        <div><small>Prize Pool</small><b>${money(h.prizePool)}</b></div>
        <div><small>Team Size</small><b>1–${h.maxTeam}</b></div>
      </div>
    </section>`;
}

function copyHackathonCode(value){
  if(navigator.clipboard) navigator.clipboard.writeText(value).then(()=>toast('Hackathon code copied!')).catch(()=>toast(value));
  else toast(value);
}

function copyHackathonLink(value){
  if(navigator.clipboard) navigator.clipboard.writeText(value).then(()=>toast('Join link copied!')).catch(()=>toast('Copy failed.'));
  else toast('Copy failed.');
}

function getHack(){return db().hackathons.find(h=>h.id===qs('id'))}
function renderHackathon(){
  const h=getHack();
  const el=document.getElementById('hackathonView');
  if(!h) return el.innerHTML='<div class="empty">Hackathon not found.</div>';

  const joined=!!(currentUser() && h.joinedBy?.includes(currentUser()));

  el.innerHTML=`
    <div class="event-hero">
      <span class="tag">${esc(status(h))}</span>
      <div class="eyebrow">${esc(h.category)} · ${esc(h.theme)}</div>
      <h1>${esc(h.name)}</h1>
      <p class="muted">${esc(h.description)}</p>
      <div class="hero-actions">
        <button class="btn ${joined?'btn-secondary':'btn-primary'}" onclick="joinHack()">${joined?'Joined ✓':'Join Hackathon'}</button>
        <button class="btn btn-secondary" onclick="copyHackathonCode('${esc(h.joinCode)}')">Copy Code ${esc(h.joinCode)}</button>
      </div>
    </div>
    <div class="event-layout">
      <div>
        <section class="info-panel">
          <h2>Timeline</h2>
          <div class="timeline">
            <div><span>Registration Opens</span><b>${fmt(h.regStart)}</b></div>
            <div><span>Registration Closes</span><b>${fmt(h.regEnd)}</b></div>
            <div><span>Hacking Starts</span><b>${fmt(h.hackStart)}</b></div>
            <div><span>Submission Deadline</span><b>${fmt(h.deadline)}</b></div>
          </div>
        </section>
        <section class="info-panel">
          <h2>Rules</h2>
          <p class="muted">${esc(h.rules).replace(/\n/g,'<br>')}</p>
        </section>
        <section class="info-panel">
          <h2>Judging Criteria</h2>
          <div class="criteria"><span>Innovation — 10</span><span>Impact — 10</span><span>Technical — 10</span><span>Presentation — 10</span></div>
        </section>
      </div>
      <aside>
        <section class="info-panel">
          <div class="eyebrow">PRIZE POOL</div>
          <h2>${money(h.prizePool)}</h2>
          <div class="row"><span>🥇 1st</span><b>${money(h.firstPrize)}</b></div>
          <div class="row"><span>🥈 2nd</span><b>${money(h.secondPrize)}</b></div>
          <div class="row"><span>🥉 3rd</span><b>${money(h.thirdPrize)}</b></div>
        </section>
        <section class="info-panel">
          <div class="row"><span>Participants</span><b>${h.participants}</b></div>
          <div class="row"><span>Team Size</span><b>1–${h.maxTeam}</b></div>
          <div class="row"><span>Category</span><b>${esc(h.category)}</b></div>
          <div class="row"><span>Theme</span><b>${esc(h.theme)}</b></div>
          <div class="row"><span>Host</span><b>${esc(h.host)}</b></div>
          <div class="row"><span>Join Code</span><b>${esc(h.joinCode)}</b></div>
        </section>
      </aside>
    </div>`;
}

function joinHack(){if(!requireUser())return;const d=db(),h=getHack(),u=currentUser();if(!h.joinedBy.includes(u)){h.joinedBy.push(u);h.participants++;save(d)}toast('Hackathon joined!');renderHackathon()}

function renderHost(){
 if(!requireUser())return;const h=getHack();if(!h)return;
 if(h.host!==currentUser())return document.getElementById('hostView').innerHTML='<div class="empty">You do not have permission to manage this hackathon.</div>';
 const subs=h.submissionList||[], teams=h.teamList||[];
 document.getElementById('hostView').innerHTML=`<div class="page-head"><div><div class="eyebrow">HOST CONTROL CENTER</div><h1>${esc(h.name)}</h1><p class="muted">Code: <b>${esc(h.joinCode)}</b> · Status: ${esc(status(h))}</p></div><button class="btn btn-secondary" onclick="navigator.clipboard?.writeText('${h.joinCode}');toast('Code copied')">Copy Code</button></div>
 <div class="host-nav"><a class="active" href="host.html?id=${h.id}">Overview</a><a href="teams.html?id=${h.id}">Teams</a><a href="submit.html?id=${h.id}">Submissions</a><a href="judging.html?id=${h.id}">Judging</a><a href="leaderboard.html?id=${h.id}">Leaderboard</a></div>
 <div class="dashboard-stats stats-grid"><div class="stat-card"><small>Participants</small><b>${h.participants}</b></div><div class="stat-card"><small>Teams</small><b>${teams.length}</b></div><div class="stat-card"><small>Submissions</small><b>${subs.length}</b></div><div class="stat-card"><small>Prize Pool</small><b>${money(h.prizePool)}</b></div></div>
 <section class="info-panel"><h2>Share</h2><p class="muted">Participants can enter this code to view the event.</p><div class="code-entry"><input readonly value="${h.joinCode}"><button class="btn btn-primary" onclick="navigator.clipboard?.writeText('${h.joinCode}');toast('Copied')">Copy</button></div></section>`;
}

function renderTeams(){
 const h=getHack();if(!h)return;const u=currentUser(),mine=(h.teamList||[]).find(t=>t.members.includes(u));document.getElementById('teamView').innerHTML=`<div class="page-head"><div><div class="eyebrow">TEAM</div><h1>Build together.</h1><p class="muted">${esc(h.name)}</p></div></div>${mine?`<section class="info-panel"><h2>${esc(mine.name)}</h2><p class="muted">Captain: ${esc(mine.captain)}</p>${mine.members.map(m=>`<div class="row"><span>${esc(m)}</span><span>${m===mine.captain?'CAPTAIN':'MEMBER'}</span></div>`).join('')}<a class="btn btn-primary" href="submit.html?id=${h.id}">Submit Project →</a></section>`:`<section class="form-card"><h2>Create Team</h2><form onsubmit="createTeam(event)"><label>Team Name<input id="teamName" required maxlength="40"></label><button class="btn btn-primary">Create Team</button></form><h2>Existing Teams</h2>${(h.teamList||[]).map(t=>`<div class="row"><span><b>${esc(t.name)}</b><small class="muted"> ${t.members.length}/${h.maxTeam}</small></span><button class="btn btn-secondary" onclick="joinTeam('${t.id}')">Join</button></div>`).join('')||'<p class="muted">No teams yet.</p>'}</section>`}`;
}
function createTeam(e){e.preventDefault();if(!requireUser())return;const d=db(),h=getHack(),u=currentUser();if(!h.joinedBy.includes(u))return toast('Join the hackathon first.');if((h.teamList||[]).some(t=>t.members.includes(u)))return toast('You are already on a team.');h.teamList=h.teamList||[];h.teamList.push({id:Date.now().toString(),name:document.getElementById('teamName').value.trim(),captain:u,members:[u]});h.teams=h.teamList.length;save(d);renderTeams()}
function joinTeam(id){const d=db(),h=getHack(),u=currentUser(),t=h.teamList.find(x=>x.id===id);if(!h.joinedBy.includes(u))return toast('Join the hackathon first.');if(h.teamList.some(x=>x.members.includes(u)))return toast('You are already on a team.');if(t.members.length>=h.maxTeam)return toast('Team is full.');t.members.push(u);save(d);renderTeams()}

function renderSubmit(){
 const h=getHack();if(!h)return;const u=currentUser(),team=(h.teamList||[]).find(t=>t.members.includes(u)),existing=(h.submissionList||[]).find(s=>s.teamId===team?.id);document.getElementById('submitView').innerHTML=`<div class="page-head"><div><div class="eyebrow">PROJECT SUBMISSION</div><h1>Submit your project.</h1><p class="muted">${esc(h.name)}</p></div></div>${existing?`<section class="info-panel success-card"><span class="tag">SUBMITTED</span><div class="success-icon">✓</div><h2>Project submitted successfully!</h2><p class="muted">Your project link has been submitted for ${esc(h.name)}.</p><p><b>Project Link:</b> <a class="success" href="${safeUrl(existing.projectLink||existing.github)}" target="_blank" rel="noopener">${esc(existing.projectLink||existing.github)}</a></p><p class="muted">Submitted: ${fmt(existing.submittedAt)}</p></section>`:team?`<form class="form-card" onsubmit="submitProject(event)"><h2>${esc(team.name)}</h2><label>Project Link<input id="projectLink" type="url" placeholder="https://github.com/your-project" required></label><p class="muted">Enter the public link to your project, repository, or live demo.</p><button class="btn btn-primary" type="submit">Submit Project →</button></form>`:`<div class="empty">Create or join a team before submitting.</div>`}`;
}
function safeUrl(u){try{const x=new URL(u);return ['https:'].includes(x.protocol)?x.href:'#'}catch{return '#'}}
function submitProject(e){e.preventDefault();const d=db(),h=getHack(),u=currentUser(),team=(h.teamList||[]).find(t=>t.members.includes(u));if(!team)return toast('Join a team first.');if(Date.now()>new Date(h.deadline).getTime())return toast('Submission deadline has passed.');h.submissionList=h.submissionList||[];if(h.submissionList.some(s=>s.teamId===team.id))return toast('Already submitted.');const projectLink=document.getElementById('projectLink').value.trim();if(!projectLink)return toast('Enter your project link.');h.submissionList.push({id:Date.now().toString(),teamId:team.id,team:team.name,user:u,projectLink,project:team.name+' Project',description:'Project submitted by '+team.name,github:projectLink,demo:'',video:'',tech:'',submittedAt:new Date().toISOString(),scores:[]});h.submissions=h.submissionList.length;save(d);renderSubmit()}

function renderJudging(){
 const h=getHack();if(!h)return;const subs=h.submissionList||[];document.getElementById('judgingView').innerHTML=`<div class="page-head"><div><div class="eyebrow">JUDGING</div><h1>Score projects.</h1><p class="muted">${esc(h.name)}</p></div></div>${subs.length?subs.map(s=>{const sc=(h.scores||[]).find(x=>x.submissionId===s.id)||{};return `<section class="info-panel"><h2>${esc(s.project)}</h2><p class="muted">${esc(s.team)} · ${esc(s.description)}</p><a class="success" href="${safeUrl(s.github)}" target="_blank" rel="noopener">Open GitHub →</a><form onsubmit="saveScore(event,'${s.id}')"><div class="score-inputs">${['innovation','impact','technical','presentation'].map(k=>`<label>${k}<input id="${k}-${s.id}" type="number" min="0" max="10" value="${sc[k]??''}" required></label>`).join('')}</div><label>Comments<textarea id="comments-${s.id}">${esc(sc.comments||'')}</textarea></label><button class="btn btn-primary">Save Score</button></form></section>`}).join(''):`<div class="empty">No submissions yet.</div>`}`;
}
function saveScore(e,id){e.preventDefault();const d=db(),h=getHack(),get=k=>Number(document.getElementById(k+'-'+id).value),s={submissionId:id,innovation:get('innovation'),impact:get('impact'),technical:get('technical'),presentation:get('presentation'),comments:document.getElementById('comments-'+id).value};h.scores=h.scores||[];const i=h.scores.findIndex(x=>x.submissionId===id);if(i>=0)h.scores[i]=s;else h.scores.push(s);save(d);toast('Score saved');renderJudging()}

function renderLeaderboard(){
 const h=getHack();if(!h)return;const subs=h.submissionList||[],scores=h.scores||[];let rows=subs.map(s=>{const sc=scores.find(x=>x.submissionId===s.id);const total=sc?sc.innovation+sc.impact+sc.technical+sc.presentation:0;return {...s,total}}).sort((a,b)=>b.total-a.total);
 document.getElementById('leaderboardView').innerHTML=`<div class="page-head"><div><div class="eyebrow">RESULTS</div><h1>Leaderboard.</h1><p class="muted">${esc(h.name)}</p></div>${h.host===currentUser()?`<button class="btn btn-primary" onclick="announce()">Announce Winners</button>`:''}</div>${rows.length?`<section class="info-panel">${rows.map((r,i)=>`<div class="row"><span><b class="rank">#${i+1}</b> &nbsp; <b>${esc(r.team)}</b><br><small class="muted">${esc(r.project)}</small></span><b>${r.total}/40</b></div>`).join('')}</section>`:`<div class="empty">Leaderboard will appear after projects are judged.</div>`}${h.announced?`<section class="info-panel"><div class="eyebrow">WINNERS</div><h2>🏆 Final Results</h2>${rows.slice(0,3).map((r,i)=>`<div class="row"><b>${['🥇','🥈','🥉'][i]} ${esc(r.team)}</b><span>${money([h.firstPrize,h.secondPrize,h.thirdPrize][i]||0)}</span></div>`).join('')}</section>`:''}`;
}
function announce(){const d=db(),h=getHack();if(!h||h.host!==currentUser())return toast('No permission.');if(!confirm('Announce final results?'))return;h.announced=true;save(d);toast('Winners announced!');renderLeaderboard()}
function fmt(x){return new Date(x).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}
