'use strict';
// Answer controls overlay the printed PDF blanks. No second answer-box column.
function renderPBQ(q){
 const s=pbqState(q),locked=s.submitted,used=new Set(Object.values(s.placements));
 const areas=PBQ_BOXES[q.id];
 const cropW=['A2','A4'].includes(q.id)?699:470;
 const section=PBQ_SECTION_WINDOWS[q.id]||[0,q.id==='A5'?865:q.id==='A4'?735:720];
 const cropH=section[1]-section[0];
 const zoom=s.zoom||1;
 const fittedWidth=(cropW/cropH*60*zoom).toFixed(2);
 let html=`<h2>${q.id} — ${escapeHTML(q.title)} <span class="pill">PBQ</span></h2><p class="muted small">${q.type==='fill'?'Type directly into the blanks on the diagram.':q.type==='order'?'Drag a printed step onto another step to reorder it, or click a step and then its destination.':'Drag a choice on the original page into a printed blank, or click a choice and then its blank. Each choice can be used once; unused choices may remain.'}</p>`;
 html+=`<div class="pbq-workstation" style="max-width:calc(min(${fittedWidth}dvh,760px) + 270px)"><div class="pbq-page-wrap"><div class="pbq-image-viewport" style="aspect-ratio:${cropW}/${cropH};max-width:min(${fittedWidth}dvh,760px)"><div class="pbq-overlay-page" style="width:${(699/cropW*100).toFixed(4)}%;transform:translateY(-${(section[0]/1048*100).toFixed(4)}%)"><img src="${img(q.page)}" alt="Original PDF diagram for ${q.id}" onpointerdown="pbqImagePointerDown(event)" onclick="pbqImageClick(event)">`;
 if(q.type!=='fill'&&q.type!=='order'){
  const source=PBQ_SOURCE_CHOICES[q.id]||{};
  html+=q.choices.filter(c=>source[c]).map(c=>{
   const given=source[c];const b=given;
   const pos=`left:${(b[0]/699*100).toFixed(3)}%;top:${(b[1]/1048*100).toFixed(3)}%;width:${(b[2]/699*100).toFixed(3)}%;height:${(b[3]/1048*100).toFixed(3)}%`;
   const j=JSON.stringify(c).replace(/"/g,'&quot;'),letter=PBQ_LETTER_BANK[q.id]&&q.id!=='C3'?pbqLetter(q,c)+' — ':'';
   return `<button class="pbq-chip pbq-on-image-choice ${given?'source-chip':'margin-chip'} ${pendingChip===c?'active':''} ${used.has(c)?'used':''}" style="${pos}" aria-label="${escapeHTML(c)}" title="${escapeHTML(c)}" draggable="${!locked&&!used.has(c)}" onpointerdown="pbqPointerStart(event,${j})" ondragstart="pbqDrag(event,${j})" onclick="selectChip(${j})" ${locked||used.has(c)?'disabled':''}>${given?'':escapeHTML(letter+c)}</button>`;
  }).join('');
 }
 html+=q.slots.map(([label,key],i)=>{
  const b=areas[i],v=s.placements[i]||'',cl=s.submitted?(norm(v)===norm(key)?'correct':'incorrect'):'';
  const pos=`left:${(b[0]/699*100).toFixed(3)}%;top:${(b[1]/1048*100).toFixed(3)}%;width:${(b[2]/699*100).toFixed(3)}%;height:${(b[3]/1048*100).toFixed(3)}%`;
  return q.type==='fill'
   ?`<input class="pbq-image-field ${cl}" style="${pos}" type="text" value="${escapeHTML(v)}" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}" oninput="pbqInput(${i},this.value)" ${locked?'disabled':''}>`
   :`<button class="pbq-image-drop ${v?'filled':''} ${cl}" style="${pos}" data-pbq-slot="${i}" aria-label="${escapeHTML(label)}" title="${escapeHTML(label+(v?' — '+v:''))}" ${q.type==='order'?`draggable="${!locked}" onpointerdown="pbqPointerStart(event,${JSON.stringify(v||q.choices[i]).replace(/"/g,'&quot;')})" ondragstart="pbqDrag(event,${JSON.stringify(v||q.choices[i]).replace(/"/g,'&quot;')})"`:''} ondragover="event.preventDefault()" ondrop="pbqDrop(event,${i})" onclick="${q.type==='order'?`pbqOrderClick(${i})`:`placeChip(${i})`}" ${locked?'disabled':''}>${escapeHTML(q.id==='A4'?String.fromCharCode(65+i):q.type==='order'?(v||q.choices[i]):pbqShort(q,v,b))}</button>`;
 }).join('');
 html+=`</div></div><p class="muted small">Answers go inside the printed blanks.</p>${q.id==='A4'?`<p class="pbq-selection-summary">${q.slots.map(([label],i)=>`${escapeHTML(label)}: ${escapeHTML(s.placements[i]||'—')}`).join(' · ')}</p>`:''}</div>`;
 const sideChoices=!['A2','A4'].includes(q.id)?'':`<div class="pbq-side-bank"><strong>Choose a label</strong><p class="muted small">This source diagram does not print an answer bank. Drag a text label or click it, then choose a printed answer location.</p><div class="pbq-side-choices">${q.choices.filter(c=>!used.has(c)).map(c=>{const j=JSON.stringify(c).replace(/"/g,'&quot;');return `<button class="pbq-chip pbq-side-chip ${pendingChip===c?'active':''}" aria-label="${escapeHTML(c)}" draggable="${!locked}" onpointerdown="pbqPointerStart(event,${j})" ondragstart="pbqDrag(event,${j})" onclick="selectChip(${j})" ${locked?'disabled':''}>${escapeHTML(c)}</button>`}).join('')}</div></div>`;
 html+=`<div class="pbq-side"><div class="pbq-side-sticky">${sideChoices}<h3>Exam controls</h3>${test.paused?'<p class="pbq-paused-warning">Timer paused. PBQ answers and navigation still work.</p><button class="pbq-resume" onclick="pause()">▶ Resume timer</button>':''}<div class="pbq-zoom-controls"><button class="secondary" onclick="pbqZoom(-0.15)" aria-label="Make diagram smaller">−</button><button class="secondary" onclick="pbqZoom(0)" aria-label="Fit diagram to screen">Fit</button><button class="secondary" onclick="pbqZoom(0.15)" aria-label="Make diagram larger">+</button></div><button onclick="submitPBQ()" ${locked?'disabled':''}>Submit answers</button><button class="secondary" onclick="resetPBQ()">Reset PBQ</button>${s.submitted?`<button class="secondary" onclick="revealPBQ()" ${s.revealed?'disabled':''}>Reveal answers</button>`:''}<hr><button class="secondary" onclick="go(${test.index-1})" ${test.index===0?'disabled':''}>Previous</button><button onclick="go(${test.index+1})" ${test.index===test.items.length-1?'disabled':''}>Next</button><button class="secondary" onclick="finish()">Finish test</button><p class="muted small">Question ${test.index+1} of ${test.items.length}</p></div></div></div>`;
 if(s.submitted){
  html+=`<div class="pbq-review"><h2>PBQ Review</h2><p>${correctPBQ(q,s)} of ${q.slots.length} responses correct.</p>`;
  if(s.revealed)html+=`<ul>${q.slots.map(([label,key])=>`<li>${escapeHTML(label)}: <strong>${escapeHTML(key)}</strong></li>`).join('')}</ul><p>Detailed explanations from the source PDF:</p>${q.answerPages.map(p=>`<img class="source" src="${img(p)}" alt="Original detailed explanation page ${p}">`).join('')}`;
  else html+='<p>Green indicates a correct placement; red indicates an incorrect placement. Reveal the solution when ready.</p>';
  html+='</div>';
 }
 return html;
}
