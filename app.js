'use strict';
const app=document.getElementById('app'), KEY='messer1201exam_v1';
let saved;try{saved=JSON.parse(localStorage.getItem(KEY))||{history:[],bookmarks:[],scores:{}}}catch{saved={history:[],bookmarks:[],scores:{}}}
let test=null,clock=null,settings={letter:'A',mode:'scans',duration:90,passing:675,count:40,selection:'random'};
function persist(){localStorage.setItem(KEY,JSON.stringify(saved))}function img(n){return 'pages/page-'+String(n).padStart(3,'0')+'.jpg'}
function stop(){if(clock)clearInterval(clock);clock=null}function askLeave(){return !test||confirm('Leave your unfinished session?')}
function home(){if(!askLeave())return;test=null;stop();app.innerHTML=`<h1>Quiz Select</h1><p>Each Practice Exam has exactly <strong>90 questions: 5 performance-based and 85 multiple-choice</strong>, sourced from the PDF.</p><div class="cols">${['A','B','C'].map(l=>`<div class="panel"><h2>Practice Exam ${l}</h2><p>5 interactive PBQs and 85 individual MC questions</p><div class="row"><button onclick="begin('${l}','full')">Full 90-question exam</button><button class="secondary" onclick="begin('${l}','pbq')">5 PBQs</button><button class="secondary" onclick="begin('${l}','mc')">85 MC</button></div></div>`).join('')}</div><div class="panel"><h2>Study tools</h2><button onclick="custom()">Custom test</button> <button class="secondary" onclick="bookmarked()">Bookmarks</button> <button class="secondary" onclick="dashboard()">Dashboard</button> <a class="download-pdf" href="Professor_Messer_220-1201_Practice_Exams.pdf" download="Professor_Messer_220-1201_Practice_Exams.pdf">⬇ Download practice exams PDF</a></div>`}
function custom(){if(!askLeave())return;test=null;stop();app.innerHTML=`<h1>Custom Test</h1><div class="panel"><p>Challenge yourself with a mixture of multiple-choice and performance-based questions from <strong>all three practice exams (A, B and C)</strong>.</p><div class="row"><label>Question selection <select id="selection" onchange="updateCustomCount()"><option value="random">Random questions</option><option value="all">All questions from A, B and C</option></select></label></div><div class="row"><label>Timer (minutes) <input id="time" type="number" min="1" max="600" value="90"></label><label>Practice passing score (100–900) <input id="pass" type="number" min="100" max="900" value="675"></label><label>Question count <input id="count" type="number" min="1" max="270" value="40"></label></div><p class="muted small" id="countNote"></p><button onclick="startCustom()">START</button></div>`;updateCustomCount()}
function updateCustomCount(){const selection=document.getElementById('selection').value,count=document.getElementById('count');count.max=270;if(selection==='all'){count.value=270;count.disabled=true;document.getElementById('countNote').textContent='All 270 questions: 255 multiple-choice and 15 PBQs across exams A, B and C.'}else{count.disabled=false;count.value=Math.min(Math.max(1,Number(count.value)||1),270);document.getElementById('countNote').textContent='Randomly choose any number from 1 to 270, using questions from all three exams.'}}
function startCustom(){settings.duration=Math.max(1,Math.min(600,+document.getElementById('time').value||90));settings.passing=Math.max(100,Math.min(900,+document.getElementById('pass').value||675));settings.selection=document.getElementById('selection').value;settings.count=settings.selection==='all'?270:Math.max(1,Math.min(270,Math.floor(+document.getElementById('count').value||1)));begin('ALL','full',true)}
function randomizeQuestions(items){const shuffled=[...items];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}return shuffled}
function begin(letter,mode,customized=false){stop();let items=letter==='ALL'?[...'ABC'].flatMap(l=>[...PBQS[l],...MCBANK[l]]):mode==='full'?[...PBQS[letter],...MCBANK[letter]]:mode==='pbq'?PBQS[letter]:mode==='mc'?MCBANK[letter]:SOURCE[letter].sourcePages.map(a=>({...a,id:letter+'-page'+a.page,type:a.kind}));if(customized){items=randomizeQuestions(items);if(settings.selection==='random')items=items.slice(0,settings.count)}test={letter,mode,items,index:0,answers:{},notes:{},reveals:{},pbq:{},paused:false,left:(customized?settings.duration:90)*60,passed:customized?settings.passing:675,durationSeconds:(customized?settings.duration:90)*60};clock=setInterval(()=>{if(test&&!test.paused){test.left--;let el=document.getElementById('timer');if(el)el.textContent=time(test.left);if(test.left<=0)finish()}},1000);render()}
function time(s){return Math.floor(s/3600)+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function current(){return test.items[test.index]}function bookmarkKey(){return current().id}function bookmarkedNow(){return saved.bookmarks.includes(bookmarkKey())}
function bookmark(){const k=bookmarkKey();saved.bookmarks=bookmarkedNow()?saved.bookmarks.filter(x=>x!==k):[...saved.bookmarks,k];persist();render()}
function go(i){if(i>=0&&i<test.items.length){if(typeof pendingChip!=='undefined')pendingChip=null;test.index=i;render()}}
function pause(){test.paused=!test.paused;render()}
function nav(){let seen=Object.keys(test.answers).length;return `<div class="panel"><h2>Question list — ${seen}/${test.items.length} responded</h2><div class="navgrid">${test.items.map((q,i)=>`<button class="${i===test.index?'active':''} ${test.answers[q.id]?'done':''}" onclick="go(${i})">${i+1}</button>`).join('')}</div></div>`}
function render(){if(!test)return;const q=current();const answer=test.answers[q.id];let body=`<div class="toolbar"><div>QUESTION ${test.index+1}/${test.items.length}<br>TIME LEFT <span id="timer">${time(test.left)}</span></div><div><button class="secondary" onclick="bookmark()">${bookmarkedNow()?'★':'☆'} Bookmark</button> <button class="secondary" onclick="pause()">${test.paused?'▶ Resume':'Ⅱ Pause'}</button> <button class="secondary" onclick="speech()">🔊 Read aloud</button> <button onclick="exitSession()">✕ Exit</button></div></div>`;
if(test.paused)body+=q.slots?'<p class="paused">Timer paused — PBQ answers and navigation remain available.</p>':'<p class="paused">Paused — the question remains visible, but answers and navigation are disabled.</p>';
if(test.mode==='scans')body+=`<h2>Practice Exam ${test.letter} — source page ${q.page} <span class="pill">${q.kind==='pbq'?'PBQ section':'Multiple-choice section'}</span></h2><p class="muted small">This is the exact scanned source page. Several questions may share a page. Use the page viewer to answer on paper, then open the source answer section for review.</p><img class="source source-zoom" src="${img(q.page)}" alt="Original practice exam page ${q.page}" onclick="zoom('${img(q.page)}')"><div class="panel"><label>Working notes for this page</label><textarea class="pbq-note" id="notes" placeholder="Type your response or reasoning here..." ${test.paused?'disabled':''}>${escapeHTML(test.notes[q.id]||'')}</textarea><div class="row"><button onclick="saveNotes()" ${test.paused?'disabled':''}>Save response</button><button class="secondary" onclick="showAnswers()">View original answer and explanation pages</button></div></div>`;
else if(q.slots)body+=renderPBQ(q);
else body+=renderMC(q);
if(!q.slots)body+=`<div class="row"><button class="secondary" onclick="go(${test.index-1})" ${test.index===0||test.paused?'disabled':''}>Previous</button><button onclick="go(${test.index+1})" ${test.index===test.items.length-1||test.paused?'disabled':''}>Next</button><button class="secondary" onclick="finish()">Finish test</button></div>`;
body+=nav();
app.innerHTML=body}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function choose(v){test.answers[current().id]=v;persist()}function submit(){test.reveals[current().id]=true;render()}function reveal(){test.reveals[current().id]=true;render()}
function saveNotes(){test.notes[current().id]=document.getElementById('notes').value;test.answers[current().id]='saved';render()}
function zoom(src){window.open(src,'_blank','noopener')}
function showAnswers(){const l=test.letter;let pages=SOURCE[l].answerPages;app.innerHTML=`<h1>Original Practice Exam ${l} — Answer and Explanation Pages</h1><p>Navigate every complete source answer page. Each includes the publisher's explanations and PBQ diagrams.</p><div class="scan-nav"><button class="secondary" onclick="render()">Back to test</button><button onclick="answerStep(-1)">Previous</button><strong id="answerCount">1 / ${pages.length}</strong><button onclick="answerStep(1)">Next</button></div><img id="ansimg" class="source source-zoom" src="${img(pages[0])}" onclick="zoom(this.src)">`;test.answerIndex=0}
function answerStep(d){test.answerIndex=Math.max(0,Math.min(SOURCE[test.letter].answerPages.length-1,test.answerIndex+d));document.getElementById('ansimg').src=img(SOURCE[test.letter].answerPages[test.answerIndex]);document.getElementById('answerCount').textContent=(test.answerIndex+1)+' / '+SOURCE[test.letter].answerPages.length}
function speech(){if(!('speechSynthesis'in window))return alert('Speech is not supported in this browser.');speechSynthesis.cancel();let voice=speechSynthesis.getVoices().find(v=>/female|zira|samantha|aria|jenny/i.test(v.name))||speechSynthesis.getVoices().find(v=>v.lang.startsWith('en'));let q=current(),utterance=q.stem?`${q.stem}. ${Object.entries(q.options).map(([k,v])=>k+'. '+v).join('. ')}`:q.title||q.preview||'Read the performance-based diagram to solve the problem.';let u=new SpeechSynthesisUtterance(utterance);if(voice)u.voice=voice;u.rate=.9;speechSynthesis.speak(u)}
function exitSession(){if(confirm('Exit the exam? Your current session will end.')){stop();test=null;home()}}
// CompTIA does not disclose the scoring weights or conversion formula.
// This is a clearly labeled practice estimate on the official 100–900 display scale.
function estimateScaledScore(earned,possible){
 if(possible<=0)return null;
 return Math.max(100,Math.min(900,100+Math.round(800*earned/possible)));
}
function scoreSession(t){
 let earned=0,possible=0,responded=0,correctItems=0;
 for(const q of t.items){
  if(t.mode==='scans')continue;
  if(q.slots){
   // One PBQ counts as one exam question; its slots contribute partial credit.
   const state=t.pbq[q.id],wasSubmitted=!!state?.submitted;
   const credit=wasSubmitted?correctPBQ(q,state)/Math.max(1,q.slots.length):0;
   earned+=credit;possible+=1;
   if(wasSubmitted)responded++;
   if(credit===1)correctItems++;
  }else{
   const selected=t.answers[q.id],hasSelection=Array.isArray(selected)&&selected.length>0;
   const credit=hasSelection&&mcCorrect(q,selected)?1:0;
   earned+=credit;possible+=1;
   if(hasSelection)responded++;
   if(credit===1)correctItems++;
  }
 }
 const percent=possible?Math.round(earned/possible*100):null;
 return {earned,possible,responded,correctItems,percent,scaled:estimateScaledScore(earned,possible)};
}
function finish(){
 if(!test)return;
 if(test.left>0&&!confirm('Finish and score your session now?'))return;
 stop();const t=test,score=scoreSession(t),elapsed=(t.durationSeconds||5400)-t.left;
 const report={date:new Date().toLocaleString(),letter:t.letter,mode:t.mode,responded:score.responded,total:t.items.length,
  correct:score.correctItems,percent:score.percent,scaled:score.scaled,passing:t.passed,elapsed:Math.max(0,elapsed)};
 saved.history.unshift(report);saved.history=saved.history.slice(0,100);persist();test=null;
 const manual=score.scaled===null;
 const passed=!manual&&score.scaled>=t.passed;
 const missed=t.items.filter(q=>{
   if(q.slots){const state=t.pbq[q.id];return !state?.submitted||correctPBQ(q,state)<q.slots.length}
   return !(Array.isArray(t.answers[q.id])&&mcCorrect(q,t.answers[q.id]));
 }).map(q=>q.id);
 const reviewText=missed.length?`<p><strong>Questions to review:</strong> ${missed.map(escapeHTML).join(', ')}</p>`:'<p>All questions were answered correctly.</p>';
 const title=t.letter==='ALL'?'Custom Mixed Test — A and B and C':'Practice Exam '+t.letter;
 app.innerHTML=`<h1>CompTIA A+ Core 1 (220-1201) Simulator Report</h1>
 <div class="panel score-report"><h2>${title}</h2>
 <div class="score-details"><span>Date</span><strong>${escapeHTML(report.date)}</strong>
 <span>Exam time</span><strong>${time(report.elapsed)}</strong>
 <span>Questions answered</span><strong>${score.responded} / ${t.items.length}</strong>
 <span>Maximum practice scale</span><strong>900</strong>
 <span>Practice target</span><strong>${t.passed} / 900${t.letter==='ALL'&&t.passed!==675?' (custom target)':''}</strong>
 <span>Your estimated practice score</span><strong class="score-value">${manual?'Manual review':score.scaled+' / 900'}</strong>
 <span>Practice result</span><strong class="${passed?'score-pass':'score-fail'}">${manual?'Not scored':passed?'PASS':'FAIL'}</strong></div>
 <p class="muted small">${manual?'The scanned-page study mode requires manual evaluation.':
 `This is a <strong>practice estimate</strong> using 100 + 800 × (earned practice credit ÷ total questions), rounded to a whole number. Every MC counts as one question and PBQ components contribute partial credit within their question. Unanswered questions count as zero. Your raw practice accuracy was ${score.percent}%. CompTIA does not publish its actual weighting or scaled-score conversion, so this is not an official CompTIA score.`}</p>
 <p class="muted small">For the actual CompTIA A+ Core 1 (220-1201) exam, the published passing score is <strong>675 on a 100–900 scale</strong>.</p>
 ${reviewText}
 <div class="row"><button onclick="home()">Home</button><button class="secondary" onclick="dashboard()">Dashboard</button>
 ${t.letter==='ALL'?'<button class="secondary" onclick="custom()">New custom test</button>':''}
 <a class="download-pdf" href="Professor_Messer_220-1201_Practice_Exams.pdf" download="Professor_Messer_220-1201_Practice_Exams.pdf">⬇ Download practice exams PDF</a></div></div>`;
}
function dashboard(){
 if(!askLeave())return;test=null;stop();
 app.innerHTML=`<h1>Dashboard</h1><p>Local test history saved in this browser. Scores labeled “estimated” are practice-only, not official CompTIA scores.</p>
 ${saved.history.length?saved.history.map(h=>`<div class="item"><span>${h.letter==='ALL'?'Custom A and B and C':'Exam '+h.letter} · ${h.mode==='mc'?'MC':h.mode==='pbq'?'PBQ':h.mode==='scans'?'Source scan':'Mixed'} · ${escapeHTML(h.date)}</span><strong>${h.scaled!=null?'Estimated '+h.scaled+'/900':h.percent===null?'Manual review':h.percent+'% (older version)'} (${h.responded}/${h.total} answered)</strong></div>`).join(''):'<p>No completed sessions yet.</p>'}
 <div class="row"><button class="secondary" onclick="if(confirm('Clear test history?')){saved.history=[];persist();dashboard()}">Reset test history</button><button class="secondary" onclick="if(confirm('Clear all bookmarks?')){saved.bookmarks=[];persist();dashboard()}">Reset bookmarks</button></div>`;
}
function bookmarked(){if(!askLeave())return;test=null;stop();app.innerHTML=`<h1>Bookmarked questions</h1>${saved.bookmarks.length?saved.bookmarks.map(k=>`<div class="item">${escapeHTML(k)} <button onclick="openBookmark('${k}')">Open</button></div>`).join(''):'No bookmarks yet.'}`}
function openBookmark(k){const l=k[0];let mode=/^[ABC][1-5]$/.test(k)?'pbq':k.includes('page')?'scans':'mc';begin(l,mode);let i=test.items.findIndex(x=>x.id===k);if(i>=0)go(i)}
function more(){if(!askLeave())return;test=null;stop();app.innerHTML='<h1>About this simulator</h1><p>Built from the user-provided 401-page scanned practice-exam PDF. Each of the three exams has 5 PBQs and 85 individual MC items. The original question scans, diagram images, answer keys, and detailed explanations are included offline.</p><p>PBQs are matching, ordering, and fill-in-the-blank exercises. MC questions are shown individually from the original question pages; multi-select items have checkboxes. The female read-aloud voice depends on your operating system and browser.</p><button onclick="home()">Home</button>'}
home();
