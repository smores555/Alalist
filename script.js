let DATA;
async function loadData() {
  const r = await fetch('data.json');
  DATA = await r.json();
  return DATA;
}
function uniq(arr){ return Array.from(new Set(arr)); }
function fmtPct(rank,total){ if(!total||!rank) return '—'; return Math.round((rank/total)*100) + '%'; }
function countLTE(sortedArr, target) {
  // sortedArr is array of numbers; return how many <= target
  let lo = 0, hi = sortedArr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedArr[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function bases(){ return Object.keys(DATA.bases).sort(); }
function seatsFor(base){ return Object.keys(DATA.bases[base]||{}).sort(); }

function fillSelect(el, values){
  el.innerHTML = '';
  for(const v of values){
    const o = document.createElement('option');
    o.value = v; o.textContent = v;
    el.appendChild(o);
  }
}

function calcRank(base, seat, sn){
  const arr = (DATA.bases[base] && DATA.bases[base][seat]) || [];
  const seniors = arr.map(p => p.seniority).filter(n => typeof n === 'number').sort((a,b)=>a-b);
  const total = seniors.length;
  const rank = countLTE(seniors, sn);
  return {rank,total, pct: fmtPct(rank,total)};
}

function byBest(sn){
  const rows = [];
  for(const b of bases()){
    for(const s of seatsFor(b)){
      const {rank,total,pct} = calcRank(b,s,sn);
      rows.push({seat:s,base:b,rank,total,pct});
    }
  }
  rows.sort((a,b)=>{
    const pa = parseInt(a.pct)||999999, pb = parseInt(b.pct)||999999;
    return pa - pb;
  });
  return rows;
}

function renderBest(rows){
  const tb = document.querySelector('#best tbody');
  tb.innerHTML = '';
  for(const r of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="c-seat">${r.seat}</td>
                    <td class="c-base">${r.base}</td>
                    <td class="c-rank">${r.rank||'—'}</td>
                    <td class="c-total">${r.total||'—'}</td>
                    <td class="c-pct">${r.total? r.pct : '—'}</td>`;
    tb.appendChild(tr);
  }
}

function renderList(base, seat, sn){
  const tb = document.querySelector('#list tbody');
  const title = document.getElementById('listTitle');
  title.textContent = `Pilot list — ${base} ${seat}`;
  tb.innerHTML = '';

  const arr = (DATA.bases[base] && DATA.bases[base][seat]) || [];
  // Sort by seniority just in case
  const pilots = arr.slice().sort((a,b)=>a.seniority-b.seniority);

  // Find insertion/rank
  const seniors = pilots.map(p=>p.seniority);
  const rank = countLTE(seniors, sn); // 1-based rank already (since seniors are unique ints)
  const total = pilots.length;

  const start = Math.max(0, rank - 8); // show a window around user
  const end = Math.min(total, rank + 7);

  for(let i=0;i<pilots.length;i++){
    const p = pilots[i];
    const tr = document.createElement('tr');
    const highlight = (i+1) === rank;
    tr.className = highlight ? 'you' : '';
    tr.innerHTML = `<td class="c-snr">${p.seniority ?? ''}</td>
                    <td class="c-base">${base}</td>
                    <td class="c-seat">${seat}</td>
                    <td class="c-name">${p.name ?? ''}</td>
                    <td class="c-doh">${p.hire_date ?? ''}</td>
                    <td class="c-ret">${p.retire_date ?? ''}</td>
                    <td class="c-rank">${i+1}</td>
                    <td class="c-rank">${i+1}</td>`;
    tb.appendChild(tr);
  }

  // Scroll to your row
  const you = document.querySelector('#list tbody tr.you');
  if(you){ you.scrollIntoView({block:'center'}); }
}

async function main(){
  await loadData();
  const bSel = document.getElementById('base');
  const sSel = document.getElementById('seat');
  fillSelect(bSel, bases());
  fillSelect(sSel, seatsFor(bSel.value));

  bSel.addEventListener('change', ()=> fillSelect(sSel, seatsFor(bSel.value)));

  document.getElementById('calc').addEventListener('click', ()=>{
    const sn = parseInt(document.getElementById('sn').value, 10);
    if(!sn){ alert('Enter a valid seniority #'); return; }
    renderBest(byBest(sn));
    renderList(bSel.value, sSel.value, sn);
  });

  document.getElementById('compare').addEventListener('click', ()=>{
    const sn = parseInt(document.getElementById('sn').value, 10);
    if(!sn){ alert('Enter a valid seniority #'); return; }
    renderBest(byBest(sn));
  });
}
main();
