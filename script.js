let INDEX = null;

async function loadIndex(){
  const r = await fetch('data/index.json');
  if (!r.ok) throw new Error('Missing data/index.json');
  INDEX = await r.json();
  return INDEX;
}

function groupByBase(index){
  const map = new Map();
  for (const c of index.combos){
    if (!map.has(c.base)) map.set(c.base, []);
    map.get(c.base).push(c);
  }
  for (const [b, arr] of map){
    arr.sort((a,b)=> a.seat.localeCompare(b.seat));
  }
  return map;
}

function fillSelect(el, values){
  el.innerHTML = '';
  for (const v of values){
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  }
}

async function loadPilots(file){
  const r = await fetch(`data/${file}`);
  if (!r.ok) throw new Error('Missing data/' + file);
  return r.json();
}

function countLTE(nums, target){
  // nums must be sorted ascending
  let lo = 0, hi = nums.length;
  while (lo < hi){
    const m = (lo + hi) >> 1;
    if (nums[m] <= target) lo = m + 1;
    else hi = m;
  }
  return lo;
}

function wholePct(rank, total){
  if (!rank || !total) return '—';
  return Math.round((rank/total)*100) + '%';
}

async function calcOne(combo, sn){
  const data = await loadPilots(combo.file);
  const seniors = data.pilots.map(p=>p.seniority).filter(n=>typeof n==='number').sort((a,b)=>a-b);
  const total = seniors.length;
  const rank = countLTE(seniors, sn);
  return { seat: combo.seat, base: combo.base, rank, total, pct: wholePct(rank,total) };
}

async function calcAll(sn){
  const rows = [];
  for (const combo of INDEX.combos){
    rows.push(await calcOne(combo, sn));
  }
  rows.sort((a,b)=> (parseInt(a.pct)||999999) - (parseInt(b.pct)||999999));
  return rows;
}

function renderBest(rows){
  const tb = document.querySelector('#best tbody');
  tb.innerHTML = '';
  for (const r of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="c-seat">${r.seat}</td>
                    <td class="c-base">${r.base}</td>
                    <td class="c-rank">${r.rank || '—'}</td>
                    <td class="c-total">${r.total || '—'}</td>
                    <td class="c-pct">${r.total ? r.pct : '—'}</td>`;
    tb.appendChild(tr);
  }
}

function renderListTitle(b,s){
  const el = document.getElementById('listTitle');
  if (el) el.textContent = `Pilot list — ${b} ${s}`;
}

function renderList(base, seat, pilots, sn){
  const tb = document.querySelector('#list tbody');
  if (!tb) return;
  tb.innerHTML = '';
  const seniors = pilots.map(p=>p.seniority).filter(n=>typeof n==='number').sort((a,b)=>a-b);
  const yourRank = countLTE(seniors, sn);

  for (let i=0;i<pilots.length;i++){
    const p = pilots[i];
    const tr = document.createElement('tr');
    const highlight = (i+1) === yourRank;
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
  const you = document.querySelector('#list tbody tr.you');
  if (you){ you.scrollIntoView({block:'center'}); }
}

async function main(){
  await loadIndex();
  const byBase = groupByBase(INDEX);

  // populate selects
  const baseSel = document.getElementById('base');
  const seatSel = document.getElementById('seat');
  fillSelect(baseSel, Array.from(byBase.keys()).sort());

  function refreshSeats(){
    const b = baseSel.value;
    const seats = (byBase.get(b) || []).map(c=>c.seat).sort();
    fillSelect(seatSel, seats);
  }
  refreshSeats();
  baseSel.addEventListener('change', refreshSeats);

  document.getElementById('calc').addEventListener('click', async () => {
    const sn = parseInt(document.getElementById('sn').value, 10);
    if (!sn){ alert('Enter a valid seniority #'); return; }

    // Best table
    const rows = await calcAll(sn);
    renderBest(rows);

    // Roster list for chosen base/seat
    const base = baseSel.value;
    const seat = seatSel.value;
    const combo = INDEX.combos.find(c => c.base===base && c.seat===seat);
    if (!combo){ alert('No data for that base/seat'); return; }
    const data = await loadPilots(combo.file);
    renderListTitle(base, seat);
    renderList(base, seat, data.pilots, sn);
  });

  document.getElementById('compare').addEventListener('click', async () => {
    const sn = parseInt(document.getElementById('sn').value, 10);
    if (!sn){ alert('Enter a valid seniority #'); return; }
    const rows = await calcAll(sn);
    renderBest(rows);
  });
}

main().catch(err => {
  console.error(err);
  alert('Failed to load data. Ensure /data/index.json and /data/* exist.');
});
