/* Verkehrssysteme Lernplattform: router + views. Vanilla JS, no build step. */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const view = $('#view');
  const SEC = window.VS_SECTIONS || [], PARTS = window.VS_PARTS || [], COMPACT = window.VS_COMPACT || {};
  const GLOSS = window.VS_GLOSSARY || [], QUIZ = (window.VS_QUIZ || []).map((q, i) => Object.assign({ id: 'q' + i }, q));
  const VIDS = window.VS_VIDEOS || [];
  const LEARN_SECS = SEC.filter(s => s.part !== 'G');
  const EXAM_AT = new Date('2026-11-09T18:00:00+01:00');

  /* ---------- storage (per-viewer convenience; works without it) ---------- */
  const S = {
    get(k, d) { try { const v = localStorage.getItem('vs.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('vs.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const strip = s => String(s).replace(/<[^>]+>/g, '');
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const secById = id => SEC.find(s => s.id === id);
  const partName = p => (PARTS.find(x => x.id === p) || {}).title || p;
  const toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); };
  const fmtTime = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- cards (glossary + extra) ---------- */
  const CARDS = (window.VS_CARDS_EXTRA || []).map((c, i) => ({ id: 'x' + i, f: c.f, b: c.b, s: c.s, tag: c.tag }))
    .concat(GLOSS.map((g, i) => ({ id: 'g' + i, f: g[0], b: g[1], s: g[2], tag: 'Begriff' })));

  /* ---------- nav ---------- */
  const navToggle = $('.nav-toggle'), navLinks = $('.nav-links');
  navToggle.addEventListener('click', () => { const o = navLinks.classList.toggle('open'); navToggle.setAttribute('aria-expanded', o); });
  $('[data-reset]').addEventListener('click', e => {
    e.preventDefault();
    if (confirm('Gesamten Lernfortschritt (gelesene Kapitel, Quiz-Statistik, Karteikarten) zurücksetzen?')) {
      ['read', 'qstats', 'wrong', 'leitner', 'last'].forEach(k => S.set(k, null)); toast('Fortschritt zurückgesetzt'); route();
    }
  });
  let cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }

  function route() {
    cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = [];
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const [r, a, b] = h.split('/');
    navLinks.classList.remove('open');
    $$('.nav-links a').forEach(x => x.classList.toggle('on', x.dataset.r === (r || 'start')));
    view.innerHTML = '';
    switch (r) {
      case 'lernen': a ? renderSection(a) : renderLearnIndex(); break;
      case 'videos': a ? renderPlayer(a) : renderVideos(); break;
      case 'test': renderTest(a); break;
      case 'glossar': renderGlossary(a); break;
      case 'karten': renderCards(); break;
      case 'labor': renderLab(a); break;
      default: renderStart();
    }
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);

  /* =====================================================================
     START
     ===================================================================== */
  const PLAN = [
    { d: '2026-10-13', label: 'DI 13.10. · 18:00 · L-204', x: 'Grundlagen, Verkehrsträger im Überblick, Dimensionen, Telematik', secs: ['A-01', 'B-01', 'B-02', 'B-06'] },
    { d: '2026-10-27', label: 'DI 27.10. · 18:00 · L-101', x: 'Mobilität, Mobilitätsbeeinflussung, neue Formen der Mobilität', secs: ['C-01', 'C-04', 'C-05'] },
    { d: '2026-11-02', label: 'MO 02.11. · 18:00 · Online (Teams)', x: 'Messgrößen, Verkehrsträger im Detail: Straße, Schiene', secs: ['D-01', 'E-01', 'E-02'] },
    { d: '2026-11-03', label: 'DI 03.11. · 18:00 · L-201', x: 'Verkehrsträger im Detail: Luft, Schiff; Verkehrsinfrastruktur', secs: ['E-03', 'E-05', 'F-01'] },
    { d: '2026-11-09', label: 'MO 09.11. · 18:00 · L-304', x: 'Schriftliche Klausur (60 Minuten, keine Hilfsmittel, 100 Punkte)', secs: [], exam: true }
  ];
  function stats() {
    const read = S.get('read', []), qs = S.get('qstats', {}), lt = S.get('leitner', {});
    let ok = 0, n = 0; Object.values(qs).forEach(v => { ok += v.ok; n += v.n; });
    const mastered = Object.values(lt).filter(b => b >= 4).length;
    return { read: read.length, acc: n ? Math.round(ok / n * 100) : null, answered: n, mastered };
  }
  function heroArt() {
    return `<svg viewBox="0 0 182 118" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><clipPath id="hsky"><rect width="182" height="74"/></clipPath><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050507"/><stop offset="1" stop-color="#1a0614"/></linearGradient>
      <filter id="hgl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect width="182" height="118" fill="url(#hg)"/>
      <g clip-path="url(#hsky)"><circle cx="64" cy="60" r="27" fill="#ffd400"/><circle cx="91" cy="60" r="27" fill="#ff2b2b"/><circle cx="118" cy="60" r="27" fill="#2f6bff"/>
      <g fill="#050507"><rect y="40" width="182" height=".5"/><rect y="45" width="182" height=".7"/><rect y="50" width="182" height=".9"/><rect y="55" width="182" height="1.2"/><rect y="60" width="182" height="1.6"/><rect y="65" width="182" height="2"/><rect y="70" width="182" height="2.6"/></g></g>
      <line x1="0" y1="74" x2="182" y2="74" stroke="#ff2a6d" stroke-width=".6"/>
      <g stroke="#ff2a6d" stroke-width=".28" opacity=".7"><line x1="91" y1="74" x2="-60" y2="118"/><line x1="91" y1="74" x2="-15" y2="118"/><line x1="91" y1="74" x2="25" y2="118"/><line x1="91" y1="74" x2="157" y2="118"/><line x1="91" y1="74" x2="197" y2="118"/><line x1="91" y1="74" x2="242" y2="118"/>
      <line x1="0" y1="77.8" x2="182" y2="77.8"/><line x1="0" y1="81" x2="182" y2="81"/><line x1="0" y1="85.5" x2="182" y2="85.5"/><line x1="0" y1="91.5" x2="182" y2="91.5"/><line x1="0" y1="99.5" x2="182" y2="99.5"/><line x1="0" y1="109.5" x2="182" y2="109.5"/></g>
      <g stroke="#19f0ff" stroke-width=".5" filter="url(#hgl)"><line x1="91" y1="74" x2="58" y2="118"/><line x1="91" y1="74" x2="124" y2="118"/></g>
      <g class="rails" stroke="#19f0ff" stroke-width=".3" opacity=".75"><line x1="87.2" y1="79" x2="94.8" y2="79"/><line x1="82" y1="86" x2="100" y2="86"/><line x1="72.5" y1="98.6" x2="109.5" y2="98.6"/><line x1="65" y1="108.7" x2="117" y2="108.7"/></g>
      <g fill="#ff6200" filter="url(#hgl)"><path d="M70 88 H106 V84 L116 90.5 L106 97 V93 H70 Z"/><path d="M112 98 H76 V94 L66 100.5 L76 107 V103 H112 Z"/></g>
      <g stroke="#19f0ff" stroke-width=".3" opacity=".85"><line x1="38" y1="26" x2="14" y2="16"/><line x1="38" y1="26" x2="20" y2="40"/><line x1="38" y1="26" x2="56" y2="12"/><line x1="38" y1="26" x2="60" y2="34"/><line x1="38" y1="26" x2="8" y2="30"/></g>
      <g fill="#19f0ff"><circle cx="38" cy="26" r="1.6"><animate attributeName="r" values="1.6;2.6;1.6" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="14" cy="16" r=".8"/><circle cx="20" cy="40" r=".8"/><circle cx="56" cy="12" r=".8"/><circle cx="60" cy="34" r=".8"/><circle cx="8" cy="30" r=".8"/></g>
      <g transform="translate(146 24) rotate(-14)"><g stroke="#19f0ff" stroke-width=".4" fill="none"><path d="M-16 0 Q-17 -1.3 -14 -1.3 H12 Q16 -1.3 17 0 Q16 1.3 12 1.3 H-14 Q-17 1.3 -16 0 Z"/><path d="M-1 -1.3 L-6 -11 H-3 L5 -1.3"/><path d="M-1 1.3 L-6 11 H-3 L5 1.3"/></g>
      <animateTransform attributeName="transform" type="translate" values="146 24;150 22;146 24" dur="6s" repeatCount="indefinite" additive="sum"/></g>
      </svg>`;
  }
  function renderStart() {
    const st = stats(), last = S.get('last', null);
    const now = new Date();
    view.innerHTML = `
    <section class="hero fade-in">
      <div class="hero-txt">
        <div class="page-k">[ DECRYPTED ] // SELBSTLERN-PLATTFORM · BERUFSBEGLEITEND</div>
        <div class="glitch-h" aria-label="Verkehrssysteme"><span class="g1" aria-hidden="true">VERKEHRS</span><span class="g2" aria-hidden="true">VERKEHRS</span><span class="g3">VERKEHRS</span></div>
        <div class="hero-sub">Systeme // Grundlagen</div>
        <p class="muted" style="margin:10px 0 0;max-width:460px">35 Kapitel aus Foliensatz und Kummer (2010), aktualisiert auf den Stand 2026. Lerne im Detail- oder Kompaktmodus, schau die Erklärvideos, übe mit Karteikarten und schreib die Klausur-Simulation.</p>
        <div class="btn-row">${last ? `<a class="btn solid" href="#/lernen/${last}">▶ Weiterlernen: ${esc(last)}</a>` : `<a class="btn solid" href="#/lernen/A-01">▶ Mit Kapitel A-01 starten</a>`}<a class="btn cy" href="#/test/klausur">Klausur-Simulation</a></div>
      </div>
      <div class="hero-art">${heroArt()}</div><div class="scan"></div>
    </section>
    <div class="countdown fade-in"><div class="led-num" id="cd">--:--:--:--</div><div class="t">[ KLAUSUR BB-GRUPPE ]<br>MO 09.11.2026 · 18:00 · L-304 · 60 MIN</div></div>
    <div class="grid g4" style="margin-top:16px">
      <div class="stat"><span class="lbl">Kapitel gelesen</span><div class="led-num">${st.read}/${LEARN_SECS.length}</div><div class="bar" style="margin-top:10px"><i style="width:${st.read / LEARN_SECS.length * 100}%"></i></div></div>
      <div class="stat"><span class="lbl">Quiz-Trefferquote</span><div class="led-num">${st.acc === null ? '--' : st.acc + '%'}</div><div class="muted mono" style="font-size:12px;margin-top:8px">${st.answered} Antworten</div></div>
      <div class="stat"><span class="lbl">Karten sicher (Box 4–5)</span><div class="led-num">${st.mastered}/${CARDS.length}</div><div class="bar or" style="margin-top:10px"><i style="width:${st.mastered / CARDS.length * 100}%"></i></div></div>
      <div class="stat"><span class="lbl">Erklärvideos</span><div class="led-num">${VIDS.length}</div><div class="muted mono" style="font-size:12px;margin-top:8px">${Math.round(VIDS.reduce((a, v) => a + v.duration, 0) / 60)} Minuten mit Untertiteln</div></div>
    </div>
    <h3><span class="n">01</span>Bereiche</h3>
    <div class="grid g3">
      ${[['lernen', 'LERNEN', 'Lernmodus', 'Alle Kapitel im Detail- oder Kompaktmodus, mit Abbildungen, Rechenbeispielen und Check-up am Ende.'],
         ['videos', 'VIDEOS', 'Erklärvideos', 'Sieben vertonte Neon-Brass-Videos mit Kapitelmarken, Untertiteln und Transkript.'],
         ['test', 'TEST', 'Testmodus', 'Schnelltest, Kapitel-Test, Fehler-Training und eine 60-Minuten-Klausur-Simulation mit Note.'],
         ['glossar', 'GLOSSAR', 'Glossar', `${GLOSS.length} Fachbegriffe mit Suche, A–Z-Filter und Sprung ins Kapitel.`],
         ['karten', 'KARTEN', 'Karteikarten', `${CARDS.length} animierte Karten mit Leitner-System: Was du kannst, kommt seltener.`],
         ['labor', 'LABOR', 'Interaktives Labor', 'Rechner, Simulationen und Spiele: Hub-Netze, Fundamentaldiagramm, Modal Split und mehr.']]
        .map(([r, ic, t, p]) => `<a class="tile" href="#/${r}"><span class="ic">// ${ic}</span><h3>${t}</h3><p>${p}</p></a>`).join('')}
    </div>
    <h3><span class="n">02</span>Dein Fahrplan bis zur Klausur (BB-Gruppe)</h3>
    <div class="timeline">${PLAN.map((p, i) => {
      const day = new Date(p.d + 'T23:59:00+01:00'); const prev = i ? new Date(PLAN[i - 1].d + 'T23:59:00+01:00') : new Date(0);
      const cls = p.exam ? 'exam' : (now > day ? 'done' : (now > prev ? 'next' : ''));
      return `<div class="tl-item ${cls}"><div class="d">${p.label}${cls === 'done' ? ' · ✔ VORBEI' : cls === 'next' ? ' · ◉ ALS NÄCHSTES' : ''}</div><div class="x">${esc(p.x)}</div>
        ${p.secs.length ? `<div class="c">Vorbereiten: ${p.secs.map(s => `<a href="#/lernen/${s}">${s}</a>`).join(' · ')}</div>` : `<div class="c">Vorher: <a href="#/test/klausur">Klausur-Simulation</a> · <a href="#/karten">Karteikarten</a> · <a href="#/lernen/G-01">Formelspeicher</a></div>`}</div>`;
    }).join('')}</div>
    <p class="muted mono" style="font-size:12px">Termin- und Raumänderungen sind möglich, bitte im CIS prüfen. Notenschlüssel: ab 50,5 P Genügend · 63 Befriedigend · 75,5 Gut · 88 Sehr gut.</p>`;
    const cd = $('#cd');
    const tick = () => {
      const s = Math.max(0, (EXAM_AT - new Date()) / 1000);
      const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), se = Math.floor(s % 60);
      cd.textContent = s <= 0 ? 'KLAUSUR LÄUFT / VORBEI' : `${String(d).padStart(2, '0')}T ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(se).padStart(2, '0')}`;
    };
    tick(); const iv = setInterval(tick, 1000); onLeave(() => clearInterval(iv));
  }

  /* =====================================================================
     LEARN
     ===================================================================== */
  function sidebar(cur) {
    const read = S.get('read', []);
    return PARTS.map(p => `<div class="grp"><span>Teil ${p.id} · ${esc(p.title)}</span></div>` +
      SEC.filter(s => s.part === p.id).map(s => `<a href="#/lernen/${s.id}" class="${s.id === cur ? 'on' : ''}"><span class="id">${s.id}</span><span>${esc(s.title)}</span>${read.includes(s.id) ? '<span class="ok">✔</span>' : ''}</a>`).join('')).join('');
  }
  function renderLearnIndex() {
    const read = S.get('read', []);
    view.innerHTML = `<div class="page-k">// LERNMODUS</div><h1 class="page-h">Kapitel</h1>
    <p class="page-sub">Wähle ein Kapitel. Im Kapitel schaltest du zwischen <b>Detail</b> (das komplette Buchkapitel mit Abbildungen) und <b>Kompakt</b> (Kernpunkte zum schnellen Wiederholen) um. Am Ende jedes Kapitels wartet ein kurzer Check-up.</p>
    <div class="seg" role="group" aria-label="Lernmodus">${modeButtons()}</div>
    ${PARTS.map(p => `<h3><span class="n">${p.id}</span>${esc(p.title)} · <span class="or" style="font-size:.8em">${esc(p.subtitle)}</span></h3>
      <div class="grid g3 chap-grid">${SEC.filter(s => s.part === p.id).map(s => `<a class="tile" href="#/lernen/${s.id}"><span class="id">${s.id}${read.includes(s.id) ? ' · <span class="gr">✔ gelesen</span>' : ''}</span><h3 style="font-size:16px">${esc(s.title)}</h3><p>${esc((COMPACT[s.id] || {}).key || '')}</p></a>`).join('')}</div>`).join('')}`;
    bindMode(() => renderLearnIndex());
  }
  function modeButtons() {
    const m = S.get('mode', 'detail');
    return `<button data-mode="detail" class="${m === 'detail' ? 'on' : ''}" aria-pressed="${m === 'detail'}">Detail</button><button data-mode="kompakt" class="${m === 'kompakt' ? 'on' : ''}" aria-pressed="${m === 'kompakt'}">Kompakt</button>`;
  }
  function bindMode(rerender) { $$('[data-mode]').forEach(b => b.addEventListener('click', () => { S.set('mode', b.dataset.mode); rerender(); })); }

  const SEC_TOOLS = { 'B-03': 'netz', 'D-01': 'fundamental', 'C-03': 'modalsplit', 'D-03': 'elastizitaet', 'E-04': 'volumen', 'D-02': 'auslastung', 'D-04': 'reisezeit', 'B-05': 'affinitaet', 'E-03': 'freiheiten', 'B-04': 'verkehrsart', 'C-04': 'ais' };

  function renderSection(id) {
    const s = secById(id); if (!s) { renderLearnIndex(); return; }
    S.set('last', id);
    const idx = SEC.indexOf(s), prev = SEC[idx - 1], next = SEC[idx + 1];
    const mode = S.get('mode', 'detail');
    const c = COMPACT[id] || { key: '', bullets: [] };
    const read = S.get('read', []);
    const vids = VIDS.filter(v => v.sec === id || (v.secs || []).includes(id));
    const terms = GLOSS.filter(g => g[2] === id);
    const tool = SEC_TOOLS[id];
    const body = mode === 'detail' ? `<div class="book fade-in">${s.html}</div>` :
      `<div class="fade-in"><div class="box res"><span class="tag">Kernaussage</span><p>${c.key}</p></div><ul class="kompakt-list">${c.bullets.map((b, i) => `<li data-n="${String(i + 1).padStart(2, '0')}" style="animation-delay:${i * 60}ms">${b}</li>`).join('')}</ul>
       <p class="muted" style="font-size:14px">Mehr Tiefe, Abbildungen und Rechenbeispiele: <a href="#" data-to-detail>zur Detailansicht</a>.</p></div>`;
    view.innerHTML = `<div class="learn">
      <aside class="side" id="side" aria-label="Kapitelnavigation">${sidebar(id)}</aside>
      <article>
        <div class="learn-tools"><button class="btn ghost side-toggle" id="sideBtn">☰ Kapitel</button><div class="seg" role="group" aria-label="Lernmodus">${modeButtons()}</div>
          <button class="btn ${read.includes(id) ? 'gr' : 'ghost'}" id="markRead">${read.includes(id) ? '✔ Gelesen' : 'Als gelesen markieren'}</button></div>
        <div class="case-top"><span class="lbl">CASE FILE // <b>${id}</b> · TEIL ${s.part}: ${esc(partName(s.part))}</span><span class="lbl">${esc(s.category)}</span></div>
        <div class="case-title"><div class="case-id"><small>FILE</small>${id}</div><h2>${esc(s.title)}<span>${s.refs}</span></h2>${s.badge ? `<div class="pts">${s.badge}<small>${esc(s.badgeLabel)}</small></div>` : ''}</div>
        ${body}
        ${(vids.length || terms.length || tool) ? `<h3><span class="n">+</span>Passend dazu</h3><div class="related">
          ${vids.map(v => `<a class="chip c" href="#/videos/${v.id}">▶ Video: ${esc(v.title)}</a>`).join('')}
          ${tool ? `<a class="chip o" href="#/labor/${tool}">⚙ Labor: ${esc((window.VS_LAB.tools.find(t => t.id === tool) || {}).title || tool)}</a>` : ''}
          ${terms.map(g => `<a class="chip g" href="#/glossar/${encodeURIComponent(g[0])}">${esc(g[0])}</a>`).join('')}</div>` : ''}
        <div class="checkup" id="checkup"></div>
        <div class="pn">${prev ? `<a class="btn ghost" href="#/lernen/${prev.id}">← ${prev.id} ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/lernen/${next.id}">${next.id} ${esc(next.title)} →</a>` : ''}</div>
      </article></div>`;
    $$('.book table').forEach(t => { if (!t.parentElement.classList.contains('tbl-wrap')) { const w = document.createElement('div'); w.className = 'tbl-wrap'; t.replaceWith(w); w.appendChild(t); } });
    bindMode(() => renderSection(id));
    const td = $('[data-to-detail]'); if (td) td.addEventListener('click', e => { e.preventDefault(); S.set('mode', 'detail'); renderSection(id); });
    $('#sideBtn').addEventListener('click', () => $('#side').classList.toggle('open'));
    $('#markRead').addEventListener('click', () => {
      let r = S.get('read', []); r = r.includes(id) ? r.filter(x => x !== id) : r.concat(id); S.set('read', r); renderSection(id);
    });
    const qs = shuffle(QUIZ.filter(q => q.s === id)).slice(0, 3);
    if (qs.length) {
      const cu = $('#checkup');
      cu.innerHTML = `<h3><span class="n">✓</span>Check-up: ${qs.length} Fragen zu ${id}</h3><div id="cuRun"></div>`;
      runQuiz($('#cuRun'), qs, { mode: 'practice', compact: true, onFinish: (res) => {
        if (res.correct === res.total) { let r = S.get('read', []); if (!r.includes(id)) { S.set('read', r.concat(id)); toast('Alles richtig. Kapitel als gelesen markiert.'); } }
      } });
    }
  }

  /* =====================================================================
     QUIZ ENGINE
     ===================================================================== */
  function parseNum(str) {
    let t = String(str).trim().replace(/\s/g, '').replace(/[^\d.,\-]/g, '');
    if (!t) return NaN;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    return parseFloat(t);
  }
  function score(q, ans) {
    if (ans === undefined || ans === null || ans === '') return 0;
    if (q.t === 'mc') return ans === q.a ? 1 : 0;
    if (q.t === 'tf') return ans === q.a ? 1 : 0;
    if (q.t === 'num') { const v = parseNum(ans); return !isNaN(v) && Math.abs(v - q.a) <= (q.tol || 0) + 1e-9 ? 1 : 0; }
    if (q.t === 'multi') {
      const sel = ans || [], right = sel.filter(i => q.a.includes(i)).length, wrong = sel.length - right;
      if (right === q.a.length && wrong === 0) return 1;
      return Math.max(0, (right - wrong) / q.a.length) * 0.5;
    }
    return 0;
  }
  function record(q, ok) {
    const st = S.get('qstats', {}); const e = st[q.id] || { ok: 0, n: 0 }; e.n++; if (ok) e.ok++; st[q.id] = e; S.set('qstats', st);
    let w = S.get('wrong', []); w = ok ? w.filter(x => x !== q.id) : (w.includes(q.id) ? w : w.concat(q.id)); S.set('wrong', w);
  }
  function answerText(q) {
    if (q.t === 'mc') return q.o[q.a];
    if (q.t === 'tf') return q.a ? 'Wahr' : 'Falsch';
    if (q.t === 'num') return String(q.a).replace('.', ',') + (q.unit ? ' ' + q.unit : '');
    if (q.t === 'multi') return q.a.map(i => q.o[i]).join(' · ');
  }
  function qHTML(q, ans, locked) {
    const L = 'ABCDEFG';
    let inner = '';
    if (q.t === 'mc' || q.t === 'multi') {
      inner = q.o.map((o, i) => {
        const sel = q.t === 'mc' ? ans === i : (ans || []).includes(i);
        let cls = sel ? 'sel' : '';
        if (locked) { const right = q.t === 'mc' ? i === q.a : q.a.includes(i); cls = right ? 'right' : (sel ? 'wrong' : ''); }
        return `<button class="opt ${cls}" data-i="${i}" ${locked ? 'disabled' : ''}><span class="k">${q.t === 'multi' ? (sel ? '☑' : '☐') : L[i]}</span><span>${o}</span></button>`;
      }).join('');
    } else if (q.t === 'tf') {
      inner = [true, false].map(v => {
        let cls = ans === v ? 'sel' : ''; if (locked) cls = v === q.a ? 'right' : (ans === v ? 'wrong' : '');
        return `<button class="opt ${cls}" data-tf="${v}" ${locked ? 'disabled' : ''}><span class="k">${v ? 'W' : 'F'}</span><span>${v ? 'Wahr' : 'Falsch'}</span></button>`;
      }).join('');
    } else if (q.t === 'num') {
      inner = `<div style="display:flex;gap:10px;align-items:center;max-width:360px"><input class="input" inputmode="decimal" autocomplete="off" aria-label="Antwort" value="${ans !== undefined ? esc(ans) : ''}" ${locked ? 'disabled' : ''}><span class="mono muted">${esc(q.unit || '')}</span></div><div class="muted" style="font-size:12px;margin-top:6px">Dezimalkomma oder -punkt möglich, z. B. 37,5</div>`;
    }
    return `<div class="q-text">${q.q}</div>${q.t === 'multi' ? '<div class="muted mono" style="font-size:12px;margin:-8px 0 10px">MEHRERE ANTWORTEN RICHTIG</div>' : ''}<div class="q-opts">${inner}</div>`;
  }
  function bindAnswer(el, q, get, set) {
    $$('.opt[data-i]', el).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (q.t === 'mc') set(i); else { const a = (get() || []).slice(); const k = a.indexOf(i); k >= 0 ? a.splice(k, 1) : a.push(i); set(a); }
    }));
    $$('.opt[data-tf]', el).forEach(b => b.addEventListener('click', () => set(b.dataset.tf === 'true')));
    const inp = $('input.input', el); if (inp) { inp.addEventListener('input', () => set(inp.value, true)); setTimeout(() => inp.focus(), 50); }
  }

  /* practice runner: one question at a time with instant feedback.
     exam runner: answers stored, navigation palette, timer, grading at the end. */
  function runQuiz(root, qs, opt) {
    const ans = {}; let i = 0, locked = {}, correct = 0, pts = 0;
    const total = qs.length;
    const maxPts = qs.reduce((a, q) => a + (q.p || 2), 0);
    let deadline = opt.timeLimit ? Date.now() + opt.timeLimit * 1000 : null, iv = null;
    function draw() {
      const q = qs[i], sec = secById(q.s);
      const isEx = opt.mode === 'exam';
      root.innerHTML = `
        ${opt.compact ? '' : `<div class="q-top"><div style="flex:1;min-width:200px"><div class="mono muted" style="font-size:12px">FRAGE ${i + 1} / ${total}</div><div class="bar" style="margin-top:6px"><i style="width:${(i + 1) / total * 100}%"></i></div></div>${isEx ? `<div class="led-num timer" id="timer">--:--</div>` : ''}</div>`}
        <div class="q-card"><div class="q-meta"><span>${q.s} · ${esc(sec ? sec.title : '')}</span><span>${isEx ? (q.p || 2) + ' PUNKTE' : (opt.compact ? 'FRAGE ' + (i + 1) + '/' + total : '')}</span></div>
        ${qHTML(q, ans[q.id], locked[q.id])}
        <div id="fbox"></div>
        <div class="btn-row">${isEx ? `<button class="btn ghost" id="prev" ${i === 0 ? 'disabled' : ''}>← Zurück</button><button class="btn" id="next">${i === total - 1 ? 'Zur Abgabe' : 'Weiter →'}</button>` :
          (locked[q.id] ? `<button class="btn" id="next">${i === total - 1 ? 'Auswertung' : 'Nächste Frage →'}</button>` : `<button class="btn cy" id="check">Antwort prüfen</button>`)}</div></div>
        ${isEx ? `<div style="margin-top:14px">${qs.map((x, k) => `<button class="btn ${k === i ? 'solid' : (ans[x.id] !== undefined && ans[x.id] !== '' && !(Array.isArray(ans[x.id]) && !ans[x.id].length) ? 'cy' : 'ghost')}" data-jump="${k}" style="padding:4px 9px;font-size:12px;margin:2px">${k + 1}</button>`).join('')}</div>` : ''}`;
      bindAnswer(root, q, () => ans[q.id], (v, quiet) => { ans[q.id] = v; if (!quiet) draw(); });
      if (locked[q.id]) showFb(q);
      const ck = $('#check', root); if (ck) ck.addEventListener('click', () => {
        if (ans[q.id] === undefined || ans[q.id] === '' || (Array.isArray(ans[q.id]) && !ans[q.id].length)) { toast('Bitte zuerst antworten'); return; }
        const sc = score(q, ans[q.id]); locked[q.id] = true; if (sc === 1) correct++; pts += sc * (q.p || 2); record(q, sc === 1); draw();
      });
      const nx = $('#next', root); if (nx) nx.addEventListener('click', () => { if (i < total - 1) { i++; draw(); } else finish(); });
      const pv = $('#prev', root); if (pv) pv.addEventListener('click', () => { i--; draw(); });
      $$('[data-jump]', root).forEach(b => b.addEventListener('click', () => { i = +b.dataset.jump; draw(); }));
      const inp = $('input.input', root); if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') { (ck || nx).click(); } });
      if (isEx) updTimer();
    }
    function showFb(q) {
      const sc = score(q, ans[q.id]);
      $('#fbox', root).innerHTML = `<div class="fb ${sc === 1 ? '' : 'bad'}"><b class="h ${sc === 1 ? 'gr' : 'led'}">${sc === 1 ? '✔ RICHTIG' : sc > 0 ? '~ TEILWEISE RICHTIG' : '✘ NICHT RICHTIG'}</b>${sc === 1 ? '' : `Richtig: <b>${answerText(q)}</b><br>`}${q.e || ''} <a href="#/lernen/${q.s}" class="mono" style="font-size:12px">→ ${q.s}</a></div>`;
    }
    function updTimer() {
      const t = $('#timer', root); if (!t || !deadline) return;
      const s = (deadline - Date.now()) / 1000; t.textContent = fmtTime(s); t.classList.toggle('warn', s < 300);
      if (s <= 0) { toast('Zeit abgelaufen, die Klausur wird abgegeben'); finish(); }
    }
    if (opt.timeLimit) { iv = setInterval(updTimer, 1000); onLeave(() => clearInterval(iv)); }
    function finish() {
      if (iv) clearInterval(iv);
      if (opt.mode === 'exam') {
        if (!finish.confirmed && Date.now() < deadline) {
          const open = qs.filter(q => ans[q.id] === undefined || ans[q.id] === '' || (Array.isArray(ans[q.id]) && !ans[q.id].length)).length;
          if (!confirm(`Klausur abgeben?${open ? ` ${open} Frage(n) sind noch unbeantwortet.` : ''}`)) { iv = setInterval(updTimer, 1000); return; }
        }
        finish.confirmed = true;
        correct = 0; pts = 0;
        qs.forEach(q => { const sc = score(q, ans[q.id]); pts += sc * (q.p || 2); if (sc === 1) correct++; record(q, sc === 1); });
      }
      const res = { correct, total, pts: Math.round(pts * 2) / 2, maxPts };
      results(res);
      opt.onFinish && opt.onFinish(res);
    }
    function results(res) {
      const pct = res.pts / res.maxPts * 100;
      const p100 = opt.mode === 'exam' ? res.pts : pct;
      const note = p100 >= 88 ? [1, 'Sehr gut'] : p100 >= 75.5 ? [2, 'Gut'] : p100 >= 63 ? [3, 'Befriedigend'] : p100 >= 50.5 ? [4, 'Genügend'] : [5, 'Nicht genügend'];
      if (opt.compact) {
        root.innerHTML = `<div class="box ${res.correct === res.total ? 'fix' : 'res'}"><span class="tag">Check-up</span><p><b>${res.correct} von ${res.total}</b> richtig. ${res.correct === res.total ? 'Stark!' : 'Schau dir die Erklärungen an und wiederhole das Kapitel.'}</p></div><button class="btn ghost" id="again">Neue Fragen</button>`;
        $('#again', root).addEventListener('click', () => route());
        return;
      }
      root.innerHTML = `<div class="panel grade fade-in">
        <div class="lbl">${opt.mode === 'exam' ? 'KLAUSUR-SIMULATION · ERGEBNIS' : 'AUSWERTUNG'}</div>
        <div class="led-num">${opt.mode === 'exam' ? res.pts.toString().replace('.', ',') + ' / 100' : res.correct + ' / ' + res.total}</div>
        <div style="font-family:'Chakra Petch';font-weight:700;font-size:26px;color:${note[0] < 5 ? 'var(--gr)' : 'var(--led)'};text-transform:uppercase;margin-top:6px">${opt.mode === 'exam' ? 'Note ' + note[0] + ' · ' + note[1] : Math.round(pct) + ' % · ' + (note[0] < 5 ? 'bestanden-Niveau' : 'unter 50 %')}</div>
        <div class="btn-row" style="justify-content:center"><button class="btn solid" id="restart">Nochmal</button><a class="btn cy" href="#/test">Andere Testart</a>${S.get('wrong', []).length ? '<a class="btn red" href="#/test/fehler">Fehler-Training</a>' : ''}</div></div>
        <h3><span class="n">✓</span>Durchsicht</h3>
        ${qs.map((q, k) => { const sc = score(q, ans[q.id]); return `<div class="review-item ${sc === 1 ? '' : 'bad'}"><span class="mono" style="font-size:11px;color:var(--mute)">${k + 1} · ${q.s}${opt.mode === 'exam' ? ' · ' + (Math.round(sc * (q.p || 2) * 2) / 2) + '/' + (q.p || 2) + ' P' : ''}</span><br>${q.q}<br><span class="${sc === 1 ? 'gr' : 'led'}">${sc === 1 ? '✔' : '✘'}</span> Richtig: <b>${answerText(q)}</b><div class="muted" style="font-size:13px">${q.e || ''}</div></div>`; }).join('')}`;
      $('#restart', root).addEventListener('click', () => route());
    }
    draw();
  }

  /* =====================================================================
     TEST
     ===================================================================== */
  function examSet() {
    const pool = shuffle(QUIZ.filter(q => q.s[0] !== 'G'));
    const pick = []; let sum = 0;
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(p => pool.filter(q => q.s[0] === p).slice(0, 3).forEach(q => { if (sum + q.p <= 100) { pick.push(q); sum += q.p; } }));
    for (const q of pool) { if (sum === 100) break; if (!pick.includes(q) && sum + q.p <= 100) { pick.push(q); sum += q.p; } }
    // close a remaining gap (e.g. 99) by swapping one question for a higher-valued one
    for (let guard = 0; sum < 100 && guard < 50; guard++) {
      const gap = 100 - sum, out = pick.find(p => pool.some(c => !pick.includes(c) && c.p === p.p + gap && c.s[0] === p.s[0])) || pick.find(p => pool.some(c => !pick.includes(c) && c.p === p.p + gap));
      if (!out) break;
      const inn = pool.find(c => !pick.includes(c) && c.p === out.p + gap && c.s[0] === out.s[0]) || pool.find(c => !pick.includes(c) && c.p === out.p + gap);
      pick.splice(pick.indexOf(out), 1, inn); sum += gap;
    }
    const order = 'ABCDEF';
    return pick.sort((a, b) => order.indexOf(a.s[0]) - order.indexOf(b.s[0]) || a.s.localeCompare(b.s));
  }
  function renderTest(mode) {
    const wrong = S.get('wrong', []), qs = S.get('qstats', {});
    if (mode === 'schnell') return startRun('Schnelltest', shuffle(QUIZ).slice(0, 10), { mode: 'practice' });
    if (mode === 'klausur') {
      view.innerHTML = `<div class="page-k">// TEST · KLAUSUR-SIMULATION</div><h1 class="page-h">Klausur-Simulation</h1>
        <div class="panel brk"><span class="c3"></span><span class="c4"></span><p>Wie in der echten Klausur: <b>60 Minuten</b>, <b>100 Punkte</b>, keine Hilfsmittel. Die Fragen decken alle Teile A–F ab. Feedback gibt es erst nach der Abgabe, dann mit Note nach dem offiziellen Notenschlüssel.</p>
        <table><tr><th>Punkte</th><th>Note</th></tr><tr><td class="k">88,0 – 100</td><td>Sehr gut (1)</td></tr><tr><td class="k">75,5 – 87,5</td><td>Gut (2)</td></tr><tr><td class="k">63,0 – 75,0</td><td>Befriedigend (3)</td></tr><tr><td class="k">50,5 – 62,5</td><td>Genügend (4)</td></tr><tr><td class="k">0 – 50,0</td><td>Nicht genügend (5)</td></tr></table>
        <div class="btn-row"><button class="btn solid" id="go">▶ Timer starten</button><a class="btn ghost" href="#/test">Zurück</a></div></div>`;
      $('#go').addEventListener('click', () => startRun('Klausur-Simulation', examSet(), { mode: 'exam', timeLimit: 3600 }));
      return;
    }
    if (mode === 'fehler') {
      const list = QUIZ.filter(q => wrong.includes(q.id));
      if (!list.length) { toast('Keine falsch beantworteten Fragen gespeichert'); location.hash = '#/test'; return; }
      return startRun('Fehler-Training', shuffle(list), { mode: 'practice' });
    }
    const partStats = 'ABCDEF'.split('').map(p => {
      let ok = 0, n = 0; QUIZ.filter(q => q.s[0] === p).forEach(q => { const e = qs[q.id]; if (e) { ok += e.ok; n += e.n; } });
      return { p, ok, n, cnt: QUIZ.filter(q => q.s[0] === p).length };
    });
    view.innerHTML = `<div class="page-k">// TESTMODUS</div><h1 class="page-h">Test</h1>
      <p class="page-sub">${QUIZ.length} Fragen aus allen Kapiteln: Single- und Multiple-Choice, Wahr/Falsch und Rechenaufgaben mit Zahleneingabe. Jede Antwort fließt in deine Statistik ein.</p>
      <div class="grid g4">
        <a class="tile" href="#/test/schnell"><span class="ic">// 10 FRAGEN</span><h3>Schnelltest</h3><p>Zufällige Fragen aus allen Kapiteln, sofortiges Feedback.</p></a>
        <a class="tile" href="#" id="kapBtn"><span class="ic">// FREI WÄHLBAR</span><h3>Kapitel-Test</h3><p>Wähle Teile oder einzelne Kapitel und die Anzahl Fragen.</p></a>
        <a class="tile" href="#/test/klausur"><span class="ic">// 60 MIN · 100 P</span><h3>Klausur-Simulation</h3><p>Timer, Punkte, Note nach dem Notenschlüssel.</p></a>
        <a class="tile" href="#/test/fehler" style="${wrong.length ? '' : 'opacity:.45;pointer-events:none'}"><span class="ic">// ${wrong.length} FRAGEN</span><h3>Fehler-Training</h3><p>Nur die Fragen, die du zuletzt falsch beantwortet hast.</p></a>
      </div>
      <div id="kapPanel" class="panel" style="display:none;margin-top:18px"></div>
      <h3><span class="n">%</span>Deine Trefferquote je Teil</h3>
      <div class="grid g3">${partStats.map(s => `<div class="stat"><span class="lbl">Teil ${s.p} · ${esc(partName(s.p))}</span><div class="led-num" style="font-size:34px">${s.n ? Math.round(s.ok / s.n * 100) + '%' : '--'}</div><div class="bar" style="margin-top:8px"><i style="width:${s.n ? s.ok / s.n * 100 : 0}%"></i></div><div class="muted mono" style="font-size:11px;margin-top:6px">${s.n} Antworten · ${s.cnt} Fragen im Pool</div></div>`).join('')}</div>`;
    $('#kapBtn').addEventListener('click', e => {
      e.preventDefault(); const p = $('#kapPanel'); p.style.display = 'block';
      p.innerHTML = `<div class="grid g3">${PARTS.filter(x => x.id !== 'G').map(pt => `<div><label class="chk" style="font-family:'Chakra Petch';font-weight:700;color:var(--or);text-transform:uppercase"><input type="checkbox" data-part="${pt.id}"> Teil ${pt.id} · ${esc(pt.title)}</label>
        ${SEC.filter(s => s.part === pt.id).map(s => `<label class="chk"><input type="checkbox" data-sec="${s.id}"> ${s.id} ${esc(s.title)} <span class="muted mono" style="font-size:11px">(${QUIZ.filter(q => q.s === s.id).length})</span></label>`).join('')}</div>`).join('')}</div>
        <label class="f" for="cnt">Anzahl Fragen</label><select class="input" id="cnt" style="max-width:200px"><option>5</option><option selected>10</option><option>20</option><option value="999">alle</option></select>
        <div class="btn-row"><button class="btn solid" id="kapGo">▶ Test starten</button></div>`;
      $$('[data-part]', p).forEach(cb => cb.addEventListener('change', () => $$(`[data-sec^="${cb.dataset.part}-"]`, p).forEach(x => x.checked = cb.checked)));
      $('#kapGo').addEventListener('click', () => {
        const secs = $$('[data-sec]', p).filter(x => x.checked).map(x => x.dataset.sec);
        if (!secs.length) { toast('Bitte mindestens ein Kapitel wählen'); return; }
        const list = shuffle(QUIZ.filter(q => secs.includes(q.s))).slice(0, +$('#cnt').value);
        startRun('Kapitel-Test', list, { mode: 'practice' });
      });
      p.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  function startRun(title, list, opt) {
    view.innerHTML = `<div class="page-k">// TEST · ${esc(title.toUpperCase())}</div><h1 class="page-h">${esc(title)}</h1><div id="run"></div>`;
    runQuiz($('#run'), list, opt);
    window.scrollTo(0, 0);
  }

  /* =====================================================================
     GLOSSARY
     ===================================================================== */
  function renderGlossary(pre) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    const has = new Set(GLOSS.map(g => norm(g[0])[0]));
    view.innerHTML = `<div class="page-k">// GLOSSAR</div><h1 class="page-h">Glossar</h1>
      <p class="page-sub">${GLOSS.length} Fachbegriffe. Suche nach Begriff oder Inhalt; jeder Eintrag verlinkt das passende Kapitel. <a href="#/karten">Alle Begriffe als Karteikarten lernen →</a></p>
      <input class="input" id="gq" type="search" placeholder="Begriff oder Stichwort suchen, z. B. Kabotage, tkm, Hub …" aria-label="Glossar durchsuchen" value="${pre ? esc(pre) : ''}">
      <div class="az" id="az"><button class="on" data-l="">ALLE</button>${letters.map(l => `<button data-l="${l}" ${has.has(l) ? '' : 'disabled'}>${l}</button>`).join('')}</div>
      <div class="muted mono" id="gcount" style="font-size:12px;margin-bottom:10px"></div>
      <div class="grid g2" id="glist"></div>`;
    $('#az button').style.width = 'auto'; $('#az button').style.padding = '0 10px';
    let letter = '';
    const draw = () => {
      const q = $('#gq').value.trim().toLowerCase();
      const re = q ? new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig') : null;
      const list = GLOSS.filter(g => (!letter || norm(g[0])[0] === letter) && (!q || (g[0] + ' ' + g[1]).toLowerCase().includes(q)))
        .sort((a, b) => a[0].localeCompare(b[0], 'de'));
      $('#gcount').textContent = list.length + ' BEGRIFFE';
      const hl = s => re ? esc(s).replace(re, '<mark>$1</mark>') : esc(s);
      $('#glist').innerHTML = list.map(g => { const s = secById(g[2]); return `<div class="g-item"><h4>${hl(g[0])}</h4><p>${hl(g[1])}</p><a href="#/lernen/${g[2]}">→ ${g[2]} ${esc(s ? s.title : '')}</a></div>`; }).join('') || '<p class="muted">Kein Treffer.</p>';
    };
    $('#gq').addEventListener('input', draw);
    $$('#az button').forEach(b => b.addEventListener('click', () => { letter = b.dataset.l; $$('#az button').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
    draw();
  }

  /* =====================================================================
     FLASHCARDS (Leitner, 3D flip, deal animation)
     ===================================================================== */
  function renderCards() {
    const decks = [['all', 'Alle Karten'], ['due', 'Noch nicht sicher (Box 1–3)'], ['hard', 'Schwierig (Box 1)'], ['list', 'Listen, Formeln & Zahlen']].concat(PARTS.filter(p => p.id !== 'G').map(p => ['part:' + p.id, 'Teil ' + p.id + ' · ' + p.title]));
    view.innerHTML = `<div class="page-k">// KARTEIKARTEN</div><h1 class="page-h">Karteikarten</h1>
      <p class="page-sub">Leitner-System: Gewusste Karten wandern eine Box weiter, nicht gewusste zurück in Box 1. Karte anklicken oder <span class="kbd">LEERTASTE</span> zum Umdrehen, <span class="kbd">←</span> nochmal, <span class="kbd">→</span> gewusst.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end"><div style="flex:1;min-width:220px"><label class="f" for="deck">Stapel</label><select class="input" id="deck">${decks.map(d => `<option value="${d[0]}">${esc(d[1])}</option>`).join('')}</select></div>
        <button class="btn ghost" id="shuf">⤮ Neu mischen</button><button class="btn red" id="rst">Stapel zurücksetzen</button></div>
      <div class="boxes" id="boxes"></div>
      <div id="stage"></div>`;
    let queue = [], cur = null, done = 0, sessionN = 0, busy = false;
    const deckCards = () => {
      const lt = S.get('leitner', {}), d = $('#deck').value;
      return CARDS.filter(c => d === 'all' ? true : d === 'due' ? (lt[c.id] || 1) <= 3 : d === 'hard' ? (lt[c.id] || 1) === 1 && lt[c.id] : d === 'list' ? c.tag !== 'Begriff' : c.s[0] === d.split(':')[1]);
    };
    const drawBoxes = () => {
      const lt = S.get('leitner', {}), cs = deckCards(); const cnt = [0, 0, 0, 0, 0];
      cs.forEach(c => cnt[(lt[c.id] || 1) - 1]++);
      $('#boxes').innerHTML = cnt.map((n, i) => `<div class="b${i + 1}"><span class="lbl">BOX ${i + 1}</span><span class="led-num">${n}</span></div>`).join('');
    };
    const build = () => {
      const lt = S.get('leitner', {});
      const cs = shuffle(deckCards()).sort((a, b) => (lt[a.id] || 1) - (lt[b.id] || 1));
      queue = cs.slice(0, 20); sessionN = queue.length; done = 0; drawBoxes(); next();
    };
    const next = () => {
      cur = queue.shift();
      if (!cur) {
        $('#stage').innerHTML = `<div class="panel grade fade-in"><div class="lbl">RUNDE BEENDET</div><div class="led-num">${done}/${sessionN}</div><p>${sessionN ? 'Karten in dieser Runde gewusst.' : 'Dieser Stapel ist leer. Wähle einen anderen.'}</p><div class="btn-row" style="justify-content:center"><button class="btn solid" id="more">Nächste Runde</button></div></div>`;
        const m = $('#more'); if (m) m.addEventListener('click', build); return;
      }
      const sec = secById(cur.s), lt = S.get('leitner', {});
      $('#stage').innerHTML = `<div class="mono muted" style="text-align:center;font-size:12px;margin-top:6px">KARTE ${sessionN - queue.length}/${sessionN} · BOX ${lt[cur.id] || 1}</div>
        <div class="fc-wrap deal-in" id="fw"><div class="fc-move"><div class="fc" id="fc" tabindex="0" role="button" aria-label="Karte umdrehen">
          <div class="fc-face fc-front"><span class="tag">[ ${esc(cur.tag)} ]</span><div class="t">${esc(cur.f)}</div><span class="src">${cur.s}</span><span class="hint">KLICK = UMDREHEN</span></div>
          <div class="fc-face fc-back"><span class="tag">[ ANTWORT ]</span><div class="t">${esc(cur.b)}</div><span class="src">→ ${cur.s} ${esc(sec ? sec.title : '')}</span></div>
        </div></div><div class="stack-shadow"></div><div class="stack-shadow s2"></div></div>
        <div class="fc-actions"><button class="btn red" id="no">← Nochmal</button><button class="btn ghost" id="flip">⟲ Umdrehen</button><button class="btn gr" id="yes">Gewusst →</button></div>`;
      const fc = $('#fc');
      const flip = () => fc.classList.toggle('flip');
      fc.addEventListener('click', flip); $('#flip').addEventListener('click', flip);
      $('#yes').addEventListener('click', () => grade(true)); $('#no').addEventListener('click', () => grade(false));
    };
    const grade = ok => {
      if (busy || !cur) return; busy = true;
      const lt = S.get('leitner', {}); const b = lt[cur.id] || 1;
      lt[cur.id] = ok ? Math.min(5, b + 1) : 1; S.set('leitner', lt);
      if (ok) done++; else queue.splice(Math.min(queue.length, 3), 0, cur);
      const fw = $('#fw'); fw.classList.remove('deal-in'); void fw.offsetWidth; fw.classList.add(ok ? 'out-right' : 'out-left');
      drawBoxes();
      setTimeout(() => { busy = false; next(); }, 430);
    };
    const key = e => {
      if (!$('#fc') || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === ' ') { e.preventDefault(); $('#fc').classList.toggle('flip'); }
      if (e.key === 'ArrowRight' || e.key === '2') grade(true);
      if (e.key === 'ArrowLeft' || e.key === '1') grade(false);
    };
    document.addEventListener('keydown', key); onLeave(() => document.removeEventListener('keydown', key));
    $('#deck').addEventListener('change', build); $('#shuf').addEventListener('click', build);
    $('#rst').addEventListener('click', () => { if (!confirm('Boxen für diesen Stapel zurücksetzen?')) return; const lt = S.get('leitner', {}); deckCards().forEach(c => delete lt[c.id]); S.set('leitner', lt); build(); });
    build();
  }

  /* =====================================================================
     VIDEOS
     ===================================================================== */
  const mmss = s => fmtTime(s);
  function renderVideos() {
    view.innerHTML = `<div class="page-k">// VIDEOS</div><h1 class="page-h">Erklärvideos</h1>
      <p class="page-sub">${VIDS.length} vertonte Erklärvideos im Neon-Brass-Stil, je rund zwei Minuten. Mit Untertiteln, Kapitelmarken und anklickbarem Transkript. Erstellt für diese Plattform aus den Inhalten des Lernbuchs.</p>
      <div class="grid g3">${VIDS.map((v, i) => `<a class="v-card fade-in" style="animation-delay:${i * 50}ms" href="#/videos/${v.id}"><div class="v-thumb"><img src="videos/${v.id}.jpg" alt="" loading="lazy"><div class="play"><i>▶</i></div><span class="dur">${mmss(v.duration)}</span></div>
        <div class="v-body"><span class="mono or" style="font-size:11px">VIDEO ${String(i + 1).padStart(2, '0')} · ${v.sec}</span><h3>${esc(v.title)}</h3><p>${esc(v.sub)}</p></div></a>`).join('')}</div>`;
  }
  function renderPlayer(id) {
    const v = VIDS.find(x => x.id === id); if (!v) { renderVideos(); return; }
    const i = VIDS.indexOf(v), nx = VIDS[i + 1];
    view.innerHTML = `<div class="page-k">// VIDEO ${String(i + 1).padStart(2, '0')} · ${v.sec}</div><h1 class="page-h">${esc(v.title)}</h1><p class="page-sub">${esc(v.sub)}</p>
      <div class="player"><div>
        <video id="vid" controls preload="metadata" playsinline poster="videos/${v.id}.jpg"><source src="videos/${v.id}.mp4" type="video/mp4"><track kind="subtitles" srclang="de" label="Deutsch" src="videos/${v.id}.vtt" default></video>
        <div class="btn-row"><span class="mono muted" style="font-size:12px;align-self:center">TEMPO</span>${[0.75, 1, 1.25, 1.5].map(r => `<button class="btn ghost" data-rate="${r}" style="padding:5px 10px">${String(r).replace('.', ',')}×</button>`).join('')}
          <a class="btn cy" href="#/lernen/${v.sec}">Kapitel ${v.sec} lesen</a>${nx ? `<a class="btn" href="#/videos/${nx.id}">Nächstes Video →</a>` : ''}</div>
      </div><aside>
        <div class="lbl">KAPITELMARKEN</div>${v.chapters.map(c => `<button class="chap" data-t="${c.t}"><span class="t">${mmss(c.t)}</span><span>${esc(c.title)}</span></button>`).join('')}
        <div class="lbl" style="margin-top:16px">TRANSKRIPT</div><div class="transcript" id="tr"><p class="muted">Wird geladen …</p></div>
      </aside></div>`;
    const vid = $('#vid'), tr = $('#tr');
    $$('[data-rate]').forEach(b => b.addEventListener('click', () => { vid.playbackRate = +b.dataset.rate; $$('[data-rate]').forEach(x => x.classList.toggle('solid', x === b)); }));
    $$('.chap').forEach(b => b.addEventListener('click', () => { vid.currentTime = +b.dataset.t; vid.play(); }));
    const track = vid.textTracks[0];
    const buildTr = () => {
      if (!track || !track.cues || !track.cues.length) return false;
      tr.innerHTML = Array.from(track.cues).map((c, k) => `<p data-k="${k}" data-s="${c.startTime}">${esc(c.text)}</p>`).join('');
      $$('p', tr).forEach(p => p.addEventListener('click', () => { vid.currentTime = +p.dataset.s + 0.01; vid.play(); }));
      return true;
    };
    if (track) { track.mode = 'showing'; const te = vid.querySelector('track'); te.addEventListener('load', buildTr); setTimeout(() => { if (!buildTr()) tr.innerHTML = '<p class="muted">Transkript ist über die Untertitel im Player verfügbar.</p>'; }, 1500); }
    vid.addEventListener('timeupdate', () => {
      const t = vid.currentTime;
      $$('.chap').forEach((b, k, arr) => b.classList.toggle('on', t >= +b.dataset.t && (k === arr.length - 1 || t < +arr[k + 1].dataset.t)));
      let act = null; $$('p[data-s]', tr).forEach(p => { const on = t >= +p.dataset.s && (!p.nextElementSibling || t < +p.nextElementSibling.dataset.s); p.classList.toggle('on', on); if (on) act = p; });
      if (act && !tr.matches(':hover')) { const top = act.offsetTop - tr.offsetTop - 60; if (Math.abs(tr.scrollTop - top) > 40) tr.scrollTop = top; }
    });
    onLeave(() => vid.pause());
  }

  /* =====================================================================
     LAB
     ===================================================================== */
  function renderLab(tool) {
    const tools = window.VS_LAB.tools, t = tools.find(x => x.id === tool) || tools[0];
    view.innerHTML = `<div class="page-k">// INTERAKTIVES LABOR</div><h1 class="page-h">Labor</h1>
      <p class="page-sub">Verstehen durch Ausprobieren: Schieberegler, Rechner und kleine Spiele zu den prüfungsrelevanten Modellen.</p>
      <div class="lab-nav" role="tablist">${tools.map(x => `<button role="tab" aria-selected="${x === t}" class="${x === t ? 'on' : ''}" data-tool="${x.id}">${esc(x.title)}</button>`).join('')}</div>
      <div id="tool" class="lab-tool"></div>`;
    $$('[data-tool]').forEach(b => b.addEventListener('click', () => { history.replaceState(null, '', '#/labor/' + b.dataset.tool); renderLab(b.dataset.tool); }));
    const el = $('#tool');
    el.innerHTML = `<div class="case-top"><span class="lbl">LAB // <b>${t.id.toUpperCase()}</b></span><span class="lbl">KAPITEL ${t.sec}</span></div><h2 style="font-family:'Chakra Petch';text-transform:uppercase;color:#fff;margin:0 0 6px;font-size:26px">${esc(t.title)}</h2><p class="muted" style="margin-top:0">${t.desc} <a href="#/lernen/${t.sec}" class="mono" style="font-size:12px">→ ${t.sec}</a></p><div id="toolBody"></div>`;
    const body = $('#toolBody');
    t.render(body, { toast, shuffle, esc, onLeave });
    // filled part of each range track (also after presets/resets that set .value directly)
    const paint = () => $$('input[type=range]', body).forEach(r => { const mn = +r.min || 0, mx = +r.max || 100; r.style.setProperty('--p', ((r.value - mn) / (mx - mn) * 100) + '%'); });
    body.addEventListener('input', paint); body.addEventListener('change', paint); body.addEventListener('click', paint); paint();
  }

  route();
})();
