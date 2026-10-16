/* Interaktives Labor: Rechner, Simulationen, Spiele. Jedes Tool rendert in ein Element. */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const f = (n, d = 1) => Number(n).toLocaleString('de-AT', { minimumFractionDigits: d, maximumFractionDigits: d });
  const f0 = n => Number(n).toLocaleString('de-AT', { maximumFractionDigits: 0 });
  const C = { or: '#ff6200', cy: '#19f0ff', mg: '#ff2a6d', ye: '#ffd400', gr: '#39ff88', led: '#ff2b2b', bl: '#2f6bff', st: '#adb3b7', mu: '#8d949a', line: '#2c2c33' };
  const slider = (id, label, min, max, step, val, unit = '') => `<div class="sl"><div class="sl-head"><label for="${id}">${label}</label><span class="sl-val"><span class="cy" id="${id}V">${val}</span>${unit ? ' <small>' + unit + '</small>' : ''}</span></div><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  const num = (id, label, val, unit = '') => `<label class="f" for="${id}">${label}${unit ? ' [' + unit + ']' : ''}</label><input class="input" type="number" id="${id}" value="${val}" step="any" min="0">`;
  const val = (el, id) => parseFloat($('#' + id, el).value) || 0;
  const tools = [];

  /* ---------- 1. Netz-Rechner ---------- */
  tools.push({ id: 'netz', title: 'Netz-Rechner: Raster vs. Hub', sec: 'B-03',
    desc: 'Wie viele Verbindungen braucht ein Direktverkehrsnetz, wie viele ein Hub-and-Spoke-System? Verändere die Zahl der Knoten.',
    render(el) {
      el.innerHTML = `<div class="lab-grid"><div class="panel">${slider('n', 'Knoten n (inkl. Hub)', 3, 14, 1, 6)}
        <div style="margin-top:14px"><div class="out-row"><span>Raster: Relationen n(n−1)</span><b id="r1"></b></div><div class="out-row"><span>Raster: Kanten n(n−1)/2</span><b id="r2"></b></div>
        <div class="out-row"><span>Hub: Relationen 2(n−1)</span><b id="h1"></b></div><div class="out-row"><span>Hub: Kanten n−1</span><b id="h2"></b></div></div>
        <div class="lbl" style="margin-top:14px">ERSPARNIS DURCH BÜNDELUNG</div><div class="out-big" id="sv"></div>
        <p class="muted" style="font-size:13px">Der Preis: Umwege, zusätzlicher Umschlag, Hub auf Spitzenlast ausgelegt, enge Zeitfenster.</p></div>
        <svg class="lab-svg" id="svg" viewBox="0 0 600 300"></svg></div>`;
      const draw = () => {
        const n = +$('#n', el).value; $('#nV', el).textContent = n;
        $('#r1', el).textContent = n * (n - 1); $('#r2', el).textContent = n * (n - 1) / 2; $('#h1', el).textContent = 2 * (n - 1); $('#h2', el).textContent = n - 1;
        $('#sv', el).textContent = Math.round((1 - 2 * (n - 1) / (n * (n - 1))) * 100) + ' %';
        const R = 100; let s = `<text x="150" y="24" text-anchor="middle" class="h" font-size="14" fill="${C.mg}">RASTER</text><text x="450" y="24" text-anchor="middle" class="h" font-size="14" fill="${C.cy}">HUB-AND-SPOKE</text><line x1="300" y1="40" x2="300" y2="280" stroke="${C.line}" stroke-dasharray="4 4"/>`;
        const P = [...Array(n)].map((_, i) => [150 + R * Math.cos(2 * Math.PI * i / n - Math.PI / 2), 160 + R * Math.sin(2 * Math.PI * i / n - Math.PI / 2)]);
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) s += `<line x1="${P[i][0]}" y1="${P[i][1]}" x2="${P[j][0]}" y2="${P[j][1]}" stroke="${C.mg}" stroke-width=".9" opacity=".7"/>`;
        P.forEach(p => s += `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#1b1018" stroke="${C.mg}" stroke-width="1.5"/>`);
        const Q = [...Array(n - 1)].map((_, i) => [450 + R * Math.cos(2 * Math.PI * i / (n - 1) - Math.PI / 2), 160 + R * Math.sin(2 * Math.PI * i / (n - 1) - Math.PI / 2)]);
        Q.forEach((p, i) => { s += `<line x1="450" y1="160" x2="${p[0]}" y2="${p[1]}" stroke="${C.cy}" stroke-width="1.5"/><circle r="3" fill="${C.ye}"><animateMotion dur="${2 + (i % 3) * .4}s" repeatCount="indefinite" path="M${p[0]},${p[1]} L450,160 L${Q[(i + 1) % Q.length][0]},${Q[(i + 1) % Q.length][1]}"/></circle>`; });
        Q.forEach(p => s += `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#101c1f" stroke="${C.cy}" stroke-width="1.5"/>`);
        s += `<circle cx="450" cy="160" r="13" fill="#1d1410" stroke="${C.or}" stroke-width="2"/><text x="450" y="164" text-anchor="middle" class="m" font-size="9" fill="${C.or}">HUB</text>`;
        s += `<text x="150" y="292" text-anchor="middle" class="m" font-size="11" fill="${C.st}">${n * (n - 1) / 2} KANTEN</text><text x="450" y="292" text-anchor="middle" class="m" font-size="11" fill="${C.st}">${n - 1} KANTEN · GELB = SENDUNGEN ÜBER DEN HUB</text>`;
        $('#svg', el).innerHTML = s;
      };
      $('#n', el).addEventListener('input', draw); draw();
    } });

  /* ---------- 2. Fundamentaldiagramm ---------- */
  tools.push({ id: 'fundamental', title: 'Fundamentaldiagramm', sec: 'D-01',
    desc: 'Verkehrsstärke q = Dichte k × Geschwindigkeit v. Schiebe die Dichte und beobachte, wo der Fluss maximal wird (Modell nach Greenshields).',
    render(el) {
      el.innerHTML = `<div class="lab-grid"><div class="panel">${slider('vf', 'Wunschgeschwindigkeit v<sub>f</sub>', 60, 140, 5, 120, 'km/h')}${slider('kj', 'Staudichte k<sub>j</sub>', 80, 180, 5, 120, 'Fz/km')}${slider('k', 'Aktuelle Dichte k', 0, 120, 1, 30, 'Fz/km')}
        <div style="margin-top:12px"><div class="out-row"><span>Geschwindigkeit v</span><b id="ov"></b></div><div class="out-row"><span>Verkehrsstärke q = k · v</span><b id="oq"></b></div><div class="out-row"><span>Maximum q<sub>max</sub> bei v<sub>c</sub></span><b id="om"></b></div></div>
        <div class="lbl" style="margin-top:12px">ZUSTAND</div><div class="out-big" id="zs" style="font-size:34px"></div></div>
        <svg class="lab-svg" id="svg" viewBox="0 0 600 300"></svg></div>`;
      const draw = () => {
        const vf = +$('#vf', el).value, kj = +$('#kj', el).value; const kS = $('#k', el); kS.max = kj; const k = Math.min(+kS.value, kj);
        $('#vfV', el).textContent = vf; $('#kjV', el).textContent = kj; $('#kV', el).textContent = k;
        const v = vf * (1 - k / kj), q = k * v, qm = vf * kj / 4;
        $('#ov', el).textContent = f(v, 1) + ' km/h'; $('#oq', el).textContent = f0(q) + ' Fz/h'; $('#om', el).textContent = f0(qm) + ' Fz/h @ ' + f0(vf / 2) + ' km/h';
        const r = k / kj; const z = r < .3 ? ['FREIER VERKEHR', C.gr] : r < .45 ? ['TEILGEBUNDEN', C.ye] : r <= .55 ? ['OPTIMUM · MAX. FLUSS', C.cy] : r < .9 ? ['GEBUNDEN / STOCKEND', C.or] : ['STAU', C.led];
        $('#zs', el).textContent = z[0]; $('#zs', el).style.color = z[1];
        const X1 = x => 50 + 220 * x, Y = y => 250 - 200 * y, X2 = x => 340 + 220 * x;
        let s = `<g class="m" font-size="10" fill="${C.mu}"><text x="50" y="30">v [km/h] ÜBER k</text><text x="340" y="30">q [Fz/h] ÜBER v</text><text x="270" y="270" text-anchor="end">k</text><text x="560" y="270" text-anchor="end">v</text></g>`;
        s += `<rect x="50" y="50" width="220" height="200" fill="none" stroke="${C.line}"/><rect x="340" y="50" width="220" height="200" fill="none" stroke="${C.line}"/>`;
        s += `<line x1="${X1(0)}" y1="${Y(1)}" x2="${X1(1)}" y2="${Y(0)}" stroke="${C.cy}" stroke-width="2.5"/>`;
        let pts = ''; for (let i = 0; i <= 40; i++) { const x = i / 40; pts += `${X2(x)},${Y(4 * x * (1 - x))} `; }
        s += `<polyline points="${pts}" fill="none" stroke="${C.mg}" stroke-width="2.5"/>`;
        s += `<line x1="${X2(.5)}" y1="${Y(1)}" x2="${X2(.5)}" y2="${Y(0)}" stroke="${C.or}" stroke-dasharray="3 3"/>`;
        const vx = v / vf, qx = q / qm;
        s += `<line x1="${X1(r)}" y1="${Y(0)}" x2="${X1(r)}" y2="${Y(1 - r)}" stroke="${C.ye}" stroke-dasharray="3 3"/><circle cx="${X1(r)}" cy="${Y(1 - r)}" r="7" fill="${C.ye}"/>`;
        s += `<circle cx="${X2(vx)}" cy="${Y(qx)}" r="7" fill="${C.ye}"/>`;
        s += `<g class="m" font-size="10" fill="${C.st}"><text x="${X1(0) - 6}" y="${Y(1) + 4}" text-anchor="end">${vf}</text><text x="${X1(1)}" y="${Y(0) + 14}" text-anchor="middle">${kj}</text><text x="${X2(1)}" y="${Y(0) + 14}" text-anchor="middle">${vf}</text><text x="${X2(.5)}" y="${Y(0) + 14}" text-anchor="middle" fill="${C.or}">v_c</text></g>`;
        s += `<text x="300" y="292" text-anchor="middle" class="m" font-size="11" fill="${C.ye}">GELB = DEIN ZUSTAND · MAX. FLUSS BEI HALBER STAUDICHTE</text>`;
        $('#svg', el).innerHTML = s;
      };
      ['vf', 'kj', 'k'].forEach(i => $('#' + i, el).addEventListener('input', draw)); draw();
    } });

  /* ---------- 3. Modal-Split-Explorer ---------- */
  const YRS = [1995, 2000, 2005, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
  const MS = {
    p: { Pkw: [73.0, 73.3, 73.4, 73.8, 73.1, 73.1, 73.2, 73.1, 73.0, 72.8, 72.5, 72.1, 71.9, 80.5, 79.0, 73.2, 72.0], Krad: [2.4, 2.0, 2.2, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1, 2.0, 1.9, 1.8, 1.9, 2.3, 2.2, 1.9, 2.0], Bus: [10.4, 9.9, 9.4, 8.8, 8.9, 8.9, 8.8, 8.6, 8.6, 8.5, 8.1, 8.0, 8.0, 6.7, 6.7, 7.2, 7.2], Bahn: [6.9, 6.8, 6.4, 6.6, 6.6, 6.8, 6.8, 6.8, 6.7, 6.6, 6.8, 6.8, 6.9, 5.1, 5.3, 7.0, 7.4], 'Tram/Metro': [1.4, 1.4, 1.4, 1.5, 1.5, 1.5, 1.5, 1.5, 1.4, 1.4, 1.4, 1.5, 1.4, 1.2, 1.1, 1.2, 1.2], Luft: [5.3, 6.3, 6.8, 6.8, 7.3, 7.3, 7.3, 7.6, 7.8, 8.3, 9.0, 9.4, 9.5, 4.0, 5.5, 9.1, 9.8], See: [.5, .4, .4, .4, .4, .3, .4, .4, .3, .3, .3, .3, .3, .2, .3, .3, .3] },
    g: { 'Straße': [47.0, 48.8, 51.3, 51.4, 50.6, 49.9, 50.3, 50.0, 50.5, 50.4, 51.6, 50.9, 51.7, 53.2, 53.8, 53.6, 52.6], Schiene: [15.6, 14.1, 12.8, 12.4, 13.2, 13.2, 12.9, 13.0, 13.0, 13.3, 12.9, 12.9, 12.4, 11.7, 12.0, 11.9, 11.5], Binnenschiff: [5.1, 4.9, 4.5, 5.1, 4.7, 5.0, 5.1, 4.9, 4.8, 4.6, 4.4, 3.9, 4.1, 4.0, 3.9, 3.5, 3.4], Rohrleitung: [4.3, 4.2, 4.1, 3.7, 3.6, 3.5, 3.4, 3.3, 3.4, 3.3, 3.1, 3.1, 3.0, 2.8, 2.6, 2.7, 2.6], See: [28.0, 28.0, 27.3, 27.4, 27.9, 28.2, 28.2, 28.7, 28.3, 28.4, 27.9, 29.2, 28.7, 28.3, 27.6, 28.2, 29.7], Luft: Array(17).fill(.1) }
  };
  const MSC = { Pkw: C.or, Krad: '#ff7a2e', Bus: C.mg, Bahn: C.cy, 'Tram/Metro': C.bl, Luft: C.ye, See: C.gr, 'Straße': C.or, Schiene: C.cy, Binnenschiff: C.gr, Rohrleitung: C.mg };
  tools.push({ id: 'modalsplit', title: 'Modal-Split-Explorer', sec: 'C-03',
    desc: 'EU27-Anteile der Verkehrsträger 1995–2023 (EU transport in figures 2025; See und Luft nur innerhalb der EU). Wähle Personen- oder Güterverkehr und ein Jahr.',
    render(el, ctx) {
      el.innerHTML = `<div class="panel"><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><div class="seg"><button class="on" data-k="g">Güter (tkm)</button><button data-k="p">Personen (Pkm)</button></div><button class="btn ghost" id="play">▶ Animation</button></div>
        ${slider('yr', 'Jahr', 0, 16, 1, 16)}<div class="led-num" id="yv" style="font-size:52px;margin:8px 0"></div>
        <div id="bars"></div><div class="lbl" style="margin-top:16px">VERÄNDERUNG SEIT 1995 (PROZENTPUNKTE)</div><div id="chg" class="grid g4" style="margin-top:8px"></div></div>`;
      let k = 'g', iv = null;
      const draw = () => {
        const yi = +$('#yr', el).value; $('#yrV', el).textContent = YRS[yi]; $('#yv', el).textContent = YRS[yi] + (YRS[yi] === 2020 ? ' · COVID' : '');
        const d = MS[k];
        $('#bars', el).innerHTML = Object.keys(d).map(m => `<div style="display:grid;grid-template-columns:120px 1fr 60px;gap:10px;align-items:center;margin:6px 0"><span class="mono" style="font-size:12px;color:${MSC[m]}">${m.toUpperCase()}</span><div class="bar" style="height:16px"><i style="width:${d[m][yi] / (k === 'p' ? 82 : 56) * 100}%;background:${MSC[m]};box-shadow:0 0 10px ${MSC[m]}66"></i></div><b class="mono" style="color:#fff;font-weight:400;text-align:right">${f(d[m][yi])} %</b></div>`).join('');
        $('#chg', el).innerHTML = Object.keys(d).filter(m => m !== 'Luft' || k === 'p').map(m => { const c = d[m][yi] - d[m][0]; return `<div class="stat" style="padding:10px"><span class="lbl">${m}</span><span class="mono" style="font-size:20px;color:${c > 0.05 ? C.gr : c < -0.05 ? C.led : C.st}">${c > 0 ? '+' : ''}${f(c)}</span></div>`; }).join('');
      };
      $$('[data-k]', el).forEach(b => b.addEventListener('click', () => { k = b.dataset.k; $$('[data-k]', el).forEach(x => x.classList.toggle('on', x === b)); draw(); }));
      $('#yr', el).addEventListener('input', draw);
      $('#play', el).addEventListener('click', () => {
        if (iv) { clearInterval(iv); iv = null; $('#play', el).textContent = '▶ Animation'; return; }
        $('#yr', el).value = 0; draw(); $('#play', el).textContent = '■ Stopp';
        iv = setInterval(() => { const s = $('#yr', el); if (+s.value >= 16) { clearInterval(iv); iv = null; $('#play', el).textContent = '▶ Animation'; return; } s.value = +s.value + 1; draw(); }, 650);
      });
      ctx.onLeave(() => iv && clearInterval(iv));
      draw();
    } });

  /* ---------- 4. Transportelastizität ---------- */
  tools.push({ id: 'elastizitaet', title: 'Transportelastizität', sec: 'D-03',
    desc: 'ε = prozentuale Änderung der Verkehrsleistung / prozentuale Änderung des realen BIP. Ziel der Verkehrspolitik: ε < 1.',
    render(el) {
      el.innerHTML = `<div class="lab-grid"><div class="panel">${slider('b', 'Änderung reales BIP', -4, 6, .1, 1.5, '%')}${slider('vl', 'Änderung Verkehrsleistung (tkm)', -6, 8, .1, 2.4, '%')}
        <div class="lbl" style="margin-top:14px">TRANSPORTELASTIZITÄT ε</div><div class="out-big" id="e"></div><p id="t" style="font-size:15px"></p></div>
        <svg class="lab-svg" id="svg" viewBox="0 0 600 300"></svg></div>`;
      const draw = () => {
        const b = +$('#b', el).value, vl = +$('#vl', el).value; $('#bV', el).textContent = f(b); $('#vlV', el).textContent = f(vl);
        let e = b === 0 ? NaN : vl / b; $('#e', el).textContent = isNaN(e) ? '–' : f(e, 2);
        let txt, col;
        if (isNaN(e)) { txt = 'BIP-Änderung 0: Elastizität nicht definiert.'; col = C.st; }
        else if (b < 0) { txt = 'Rezession: Vorsicht bei der Interpretation. 2008/09 fiel die Verkehrsleistung stärker als das BIP.'; col = C.ye; }
        else if (e > 1) { txt = '<b>Überproportional</b>: Verkehr wächst schneller als die Wirtschaft (Kopplung verstärkt).'; col = C.led; }
        else if (e === 1) { txt = '<b>Proportional</b>: Verkehr wächst im Gleichschritt mit dem BIP.'; col = C.ye; }
        else if (e >= 0) { txt = '<b>Relative Entkopplung</b>: Verkehr wächst langsamer als das BIP. Das ist das Ziel.'; col = C.gr; }
        else { txt = '<b>Absolute Entkopplung</b>: Wirtschaft wächst, Verkehrsleistung sinkt.'; col = C.cy; }
        $('#t', el).innerHTML = txt; $('#e', el).style.color = col;
        const cx = 300, cy = 250, R = 190, lim = x => Math.max(-1, Math.min(3, x)), ang = x => Math.PI * (1 - (lim(x) + 1) / 4);
        let s = '';
        [[-1, 0, C.cy], [0, 1, C.gr], [1, 3, C.led]].forEach(([a, z, c]) => { const a1 = ang(a), a2 = ang(z); s += `<path d="M${cx + R * Math.cos(a1)} ${cy - R * Math.sin(a1)} A${R} ${R} 0 0 1 ${cx + R * Math.cos(a2)} ${cy - R * Math.sin(a2)}" stroke="${c}" stroke-width="16" fill="none" opacity=".75"/>`; });
        [-1, 0, 1, 2, 3].forEach(t => { const a = ang(t); s += `<text x="${cx + (R + 24) * Math.cos(a)}" y="${cy - (R + 24) * Math.sin(a) + 4}" text-anchor="middle" class="m" font-size="12" fill="${C.st}">${t}</text>`; });
        if (!isNaN(e)) { const a = ang(e); s += `<line x1="${cx}" y1="${cy}" x2="${cx + (R - 20) * Math.cos(a)}" y2="${cy - (R - 20) * Math.sin(a)}" stroke="${C.ye}" stroke-width="4" style="transition:all .3s"/>`; }
        s += `<circle cx="${cx}" cy="${cy}" r="10" fill="${C.or}"/><g class="m" font-size="11"><text x="120" y="290" fill="${C.cy}">ABSOLUTE ENTKOPPLUNG</text><text x="300" y="40" text-anchor="middle" fill="${C.gr}">ε &lt; 1 · ZIEL</text><text x="480" y="290" text-anchor="end" fill="${C.led}">ε &gt; 1</text></g>`;
        $('#svg', el).innerHTML = s;
      };
      ['b', 'vl'].forEach(i => $('#' + i, el).addEventListener('input', draw)); draw();
    } });

  /* ---------- 5. Volumengewicht ---------- */
  tools.push({ id: 'volumen', title: 'Volumengewicht Luftfracht', sec: 'E-04',
    desc: '„Luftfracht ist 6-mal messend“: Volumengewicht = L × B × H [cm] / 6.000. Abgerechnet wird der höhere Wert.',
    render(el) {
      el.innerHTML = `<div class="lab-grid"><div class="panel"><div class="grid g3">${num('L', 'Länge', 120, 'cm')}${num('B', 'Breite', 80, 'cm')}${num('H', 'Höhe', 100, 'cm')}</div>${num('W', 'Tatsächliches Gewicht', 80, 'kg')}
        <div style="margin-top:12px"><div class="out-row"><span>Volumen</span><b id="v"></b></div><div class="out-row"><span>Volumengewicht</span><b id="vg"></b></div><div class="out-row"><span>Dichte</span><b id="d"></b></div></div>
        <div class="lbl" style="margin-top:12px">ABGERECHNET</div><div class="out-big" id="c"></div><p id="t" style="font-size:15px"></p></div>
        <svg class="lab-svg" id="svg" viewBox="0 0 600 300"></svg></div>`;
      const draw = () => {
        const L = val(el, 'L'), B = val(el, 'B'), Hh = val(el, 'H'), W = val(el, 'W');
        const vol = L * B * Hh / 1e6, vg = L * B * Hh / 6000, ch = Math.max(W, vg), dens = vol ? W / vol : 0;
        $('#v', el).textContent = f(vol, 3) + ' m³'; $('#vg', el).textContent = f(vg, 1) + ' kg'; $('#d', el).textContent = f0(dens) + ' kg/m³';
        $('#c', el).textContent = f(ch, 1) + ' kg';
        $('#t', el).innerHTML = vg > W ? `<b class="ye">Maßgut (sperrig)</b>: Dichte unter 167 kg/m³, es zählt das Volumengewicht.` : `<b class="gr">Gewichtsgut</b>: Dichte ab 167 kg/m³, es zählt das tatsächliche Gewicht.`;
        const mx = Math.max(W, vg, 1), bw = v => 360 * v / mx;
        $('#svg', el).innerHTML = `<g class="m" font-size="12"><text x="30" y="90" fill="${C.st}">GEWICHT</text><text x="30" y="170" fill="${C.st}">VOLUMENGEWICHT</text></g>
          <rect x="190" y="70" width="${bw(W)}" height="30" fill="${W >= vg ? C.gr : C.mu}" style="transition:width .3s"/><text x="${200 + bw(W)}" y="91" class="m" font-size="13" fill="#fff">${f(W, 1)} kg</text>
          <rect x="190" y="150" width="${bw(vg)}" height="30" fill="${vg > W ? C.ye : C.mu}" style="transition:width .3s"/><text x="${200 + bw(vg)}" y="171" class="m" font-size="13" fill="#fff">${f(vg, 1)} kg</text>
          <text x="300" y="250" text-anchor="middle" class="h" font-size="18" fill="${C.cy}">MAX(${f(W, 0)} ; ${f(vg, 0)}) = ${f(ch, 1)} KG</text>
          <text x="300" y="280" text-anchor="middle" class="m" font-size="11" fill="${C.mu}">SCHIFF: TRENNLINIE 1:1 (1.000 KG/M³) · FLUGZEUG: 1:6 (≈ 167 KG/M³)</text>`;
      };
      $$('input', el).forEach(i => i.addEventListener('input', draw)); draw();
    } });

  /* ---------- 6. Auslastung ---------- */
  tools.push({ id: 'auslastung', title: 'Auslastungs-Rechner', sec: 'D-02',
    desc: 'Auslastung nach Gewicht und Volumen sowie entfernungsspezifisch mit und ohne Rückfracht.',
    render(el) {
      el.innerHTML = `<div class="lab-grid"><div class="panel"><div class="grid g2">${num('nl', 'Nutzlast', 24, 't')}${num('nv', 'Ladevolumen', 90, 'm³')}${num('lt', 'Ladung', 15, 't')}${num('lv', 'Ladung', 86, 'm³')}${num('km', 'Strecke je Richtung', 400, 'km')}${num('rf', 'Rückfracht', 0, 't')}</div></div>
        <div class="panel"><div class="lbl">AUSLASTUNG</div><div id="o"></div></div></div>`;
      const draw = () => {
        const nl = val(el, 'nl'), nv = val(el, 'nv'), lt = val(el, 'lt'), lv = val(el, 'lv'), km = val(el, 'km'), rf = Math.min(val(el, 'rf'), nl);
        const aw = nl ? lt / nl : 0, av = nv ? lv / nv : 0, bind = Math.max(aw, av);
        const erb = lt * km + rf * km, mog = nl * 2 * km, ae = mog ? erb / mog : 0;
        const row = (l, p, c) => `<div style="margin:10px 0"><div class="out-row" style="border:0;padding:0 0 4px"><span>${l}</span><b>${f(p * 100, 1)} %</b></div><div class="bar" style="height:12px"><i style="width:${Math.min(100, p * 100)}%;background:${c}"></i></div></div>`;
        $('#o', el).innerHTML = row('nach Gewicht', aw, aw >= av ? C.ye : C.mu) + row('nach Volumen', av, av > aw ? C.ye : C.mu) +
          `<p style="font-size:14px">Engere Restriktion: <b class="ye">${av > aw ? 'Volumen (sperriges Gut)' : 'Gewicht (schweres Gut)'}</b> · der Lkw ist zu ${f(bind * 100, 0)} % „voll“.</p>` +
          row('entfernungsspezifisch (Hin + Rück)', ae, C.cy) +
          `<p class="mono" style="font-size:13px;color:var(--cy)">erbracht ${f0(erb)} tkm / möglich ${f0(mog)} tkm</p><p style="font-size:14px">${rf ? 'Mit Rückfracht steigt die Auslastung deutlich.' : 'Tipp: Gib eine Rückfracht ein und sieh, wie die Auslastung steigt (Unpaarigkeit!).'}</p>`;
      };
      $$('input', el).forEach(i => i.addEventListener('input', draw)); draw();
    } });

  /* ---------- 7. Reisezeit ---------- */
  tools.push({ id: 'reisezeit', title: 'Komplexe Reisezeit & generalisierte Kosten', sec: 'D-04',
    desc: 'Vergleiche zwei Reiseketten Tür zu Tür. Mit Zeitwert und Ticketpreis entstehen die generalisierten Kosten.',
    render(el) {
      const comp = ['Zugang', 'Warten', 'Fahrt', 'Umsteigen', 'Abgang'], col = [C.st, C.led, C.cy, C.or, C.st];
      const A = [40, 75, 50, 0, 25], Bv = [15, 10, 142, 0, 10];
      el.innerHTML = `<div class="grid g2"><div class="panel"><div class="lbl">KETTE A</div><input class="input" id="nA" value="Flug Wien → Salzburg"><div class="grid g3">${comp.map((c, i) => num('a' + i, c, A[i], 'min')).join('')}${num('pA', 'Ticket', 120, '€')}</div></div>
        <div class="panel"><div class="lbl">KETTE B</div><input class="input" id="nB" value="Bahn Wien → Salzburg"><div class="grid g3">${comp.map((c, i) => num('b' + i, c, Bv[i], 'min')).join('')}${num('pB', 'Ticket', 45, '€')}</div></div></div>
        <div class="panel" style="margin-top:16px">${slider('zw', 'Dein Zeitwert', 0, 60, 1, 20, '€/h')}<div id="o" style="margin-top:14px"></div></div>`;
      const draw = () => {
        $('#zwV', el).textContent = $('#zw', el).value;
        const a = comp.map((_, i) => val(el, 'a' + i)), b = comp.map((_, i) => val(el, 'b' + i));
        const ta = a.reduce((x, y) => x + y, 0), tb = b.reduce((x, y) => x + y, 0), mx = Math.max(ta, tb, 1), zw = +$('#zw', el).value;
        const ga = val(el, 'pA') + ta / 60 * zw, gb = val(el, 'pB') + tb / 60 * zw;
        const bar = (arr, t, name) => `<div style="margin:10px 0"><div class="mono" style="font-size:12px;color:#fff;margin-bottom:4px">${name} · <span class="ye">${t} MIN</span> · Beförderungszeit ${arr[2] + arr[3]} min</div><div style="display:flex;height:26px;width:${t / mx * 100}%;transition:width .3s">${arr.map((v, i) => v ? `<div title="${comp[i]} ${v} min" style="flex:${v};background:${col[i]};border-right:1px solid #0a0a0c;font-family:'JetBrains Mono';font-size:10px;color:#0a0a0c;overflow:hidden;padding:5px 3px;white-space:nowrap">${comp[i].toUpperCase()} ${v}</div>` : '').join('')}</div></div>`;
        $('#o', el).innerHTML = bar(a, ta, $('#nA', el).value) + bar(b, tb, $('#nB', el).value) +
          `<div class="grid g2" style="margin-top:12px"><div class="stat"><span class="lbl">SCHNELLER TÜR ZU TÜR</span><div class="out-big" style="font-size:30px">${ta === tb ? 'gleich' : (ta < tb ? $('#nA', el).value : $('#nB', el).value)}</div><span class="muted mono" style="font-size:12px">Differenz ${Math.abs(ta - tb)} min</span></div>
           <div class="stat"><span class="lbl">GENERALISIERTE KOSTEN (TICKET + ZEIT × ZEITWERT)</span><div class="mono" style="font-size:16px;margin-top:6px">A: <b class="ye">${f(ga, 2)} €</b> · B: <b class="ye">${f(gb, 2)} €</b></div><span class="muted" style="font-size:13px">Günstiger: ${ga <= gb ? $('#nA', el).value : $('#nB', el).value}</span></div></div>`;
      };
      $$('input', el).forEach(i => i.addEventListener('input', draw)); draw();
    } });

  /* ---------- 8. Affinitäts-Matcher ---------- */
  const CRIT = ['Schnelligkeit', 'Massenleistung', 'Netzbildung', 'Berechenbarkeit', 'Häufigkeit', 'Sicherheit', 'Bequemlichkeit'];
  const PROF = { Schiene: [.31, .60, .63, .70, .77, .78, .65], 'Straße': [.45, .37, .82, .58, .85, .74, .82], Binnenschiff: [.14, .82, .10, .64, .65, .70, .49], Luft: [.88, .13, .23, .79, .71, .86, .75] };
  const PCOL = { Schiene: C.led, 'Straße': C.cy, Binnenschiff: C.gr, Luft: C.ye };
  const PRESET = { 'Schnittblumen': [.9, .2, .5, null, null, null, null], 'Eisenerz': [.1, .9, .1, null, null, null, null], 'E-Commerce-Paket': [.6, .2, .9, .6, .9, null, null], 'Chemikalien (Gefahrgut)': [.3, .7, .4, .6, null, .9, null] };
  tools.push({ id: 'affinitaet', title: 'Affinitäts-Matcher', sec: 'B-05',
    desc: 'Lege das Anforderungsprofil eines Gutes fest. Berechnet wird D = Σ|A − W| zu den Wertigkeitsprofilen (Werte nach Folie 36). Nicht relevante Kriterien abwählen.',
    render(el) {
      el.innerHTML = `<div class="lab-grid"><div class="panel"><div class="lbl">VORLAGEN</div><div class="btn-row">${Object.keys(PRESET).map(p => `<button class="btn ghost" data-p="${p}" style="padding:5px 9px;font-size:12px">${p}</button>`).join('')}</div>
        ${CRIT.map((c, i) => `<div class="sl-row"><input type="checkbox" class="sl-use" id="u${i}" ${i < 3 ? 'checked' : ''} aria-label="${c} berücksichtigen" title="Kriterium berücksichtigen">${slider('a' + i, c, 0, 1, .01, [.9, .2, .5, .6, .6, .7, .5][i])}</div>`).join('')}</div>
        <div><svg class="lab-svg" id="svg" viewBox="0 0 600 340"></svg><div class="panel" style="margin-top:12px" id="rank"></div></div></div>`;
      const draw = () => {
        const use = CRIT.map((_, i) => $('#u' + i, el).checked), A = CRIT.map((_, i) => +$('#a' + i, el).value);
        CRIT.forEach((_, i) => { $('#a' + i + 'V', el).textContent = f(A[i], 2); $('#a' + i, el).disabled = !use[i]; });
        const D = Object.keys(PROF).map(m => [m, CRIT.reduce((s, _, i) => s + (use[i] ? Math.abs(A[i] - PROF[m][i]) : 0), 0)]).sort((x, y) => x[1] - y[1]);
        const mx = Math.max(...D.map(d => d[1]), .01);
        $('#rank', el).innerHTML = `<div class="lbl">ABSTAND D (KLEINER = BESSER)</div>` + D.map((d, k) => `<div style="display:grid;grid-template-columns:120px 1fr 60px;gap:10px;align-items:center;margin:6px 0"><span class="mono" style="color:${PCOL[d[0]]};font-size:13px">${k === 0 ? '★ ' : ''}${d[0].toUpperCase()}</span><div class="bar" style="height:12px"><i style="width:${d[1] / mx * 100}%;background:${PCOL[d[0]]}"></i></div><b class="mono" style="color:#fff;font-weight:400;text-align:right">${f(d[1], 2)}</b></div>`).join('') + `<p style="font-size:14px;margin-top:8px">Empfehlung: <b>${D[0][0]}</b>. Prüfe noch Mindestaffinitäten und Kosten.</p>`;
        const cx = 300, cy = 175, R = 130, n = CRIT.length, pt = (i, v) => [cx + R * v * Math.sin(2 * Math.PI * i / n), cy - R * v * Math.cos(2 * Math.PI * i / n)];
        let s = '';
        [.25, .5, .75, 1].forEach(r => s += `<polygon points="${CRIT.map((_, i) => pt(i, r).join(',')).join(' ')}" fill="none" stroke="${C.line}"/>`);
        CRIT.forEach((c, i) => { const [x, y] = pt(i, 1.18); s += `<line x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" stroke="${C.line}"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="m" font-size="10" fill="${use[i] ? C.st : '#4b4b56'}">${c.toUpperCase()}</text>`; });
        Object.keys(PROF).forEach(m => s += `<polygon points="${PROF[m].map((v, i) => pt(i, v).join(',')).join(' ')}" fill="${PCOL[m]}" fill-opacity=".06" stroke="${PCOL[m]}" stroke-width="${m === D[0][0] ? 2.5 : 1}" opacity="${m === D[0][0] ? 1 : .55}"/>`);
        s += `<polygon points="${A.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="${C.or}" fill-opacity=".18" stroke="${C.or}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
        s += `<text x="10" y="330" class="m" font-size="10" fill="${C.or}">ORANGE GESTRICHELT = ANFORDERUNG DES GUTES</text>`;
        $('#svg', el).innerHTML = s;
      };
      $$('input', el).forEach(i => i.addEventListener('input', draw));
      $$('[data-p]', el).forEach(b => b.addEventListener('click', () => { PRESET[b.dataset.p].forEach((v, i) => { $('#u' + i, el).checked = v !== null; if (v !== null) $('#a' + i, el).value = v; }); draw(); }));
      draw();
    } });

  /* ---------- 9. Freiheiten der Luft ---------- */
  const FR = [
    ['Überflug', 'Das Recht, einen fremden Staat zu überfliegen, ohne zu landen.', ['H', 'B'], [], 'H fliegt über A nach B'],
    ['Technische Landung', 'Landung zu nicht-kommerziellen Zwecken (Tanken, Wartung), ohne Passagiere oder Fracht aufzunehmen.', ['H', 'A', 'B'], [], 'Tankstopp in A'],
    ['Heimat → Ausland', 'Gewerblicher Transport vom Heimatstaat in einen fremden Staat.', ['H', 'A'], [0], 'Passagiere H → A'],
    ['Ausland → Heimat', 'Gewerblicher Transport von einem fremden Staat in den Heimatstaat.', ['A', 'H'], [0], 'Passagiere A → H'],
    ['Jenseits-Recht', 'Gewerblicher Transport zwischen zwei fremden Staaten auf einer Linie, die im Heimatstaat beginnt oder endet.', ['H', 'A', 'B'], [1], 'Zusteigen in A, Ziel B'],
    ['Über die Heimat', 'Gewerblicher Transport zwischen zwei fremden Staaten mit Zwischenlandung im Heimatstaat (typisch für Hub-Airlines).', ['A', 'H', 'B'], [0, 1], 'A → Hub H → B'],
    ['Zwischen Dritten', 'Gewerblicher Transport zwischen zwei fremden Staaten ohne Bezug zum Heimatstaat.', ['A', 'B'], [0], 'nur A → B'],
    ['Kabotage (Anschluss)', 'Inlandsverkehr in einem fremden Staat als Fortsetzung eines Fluges aus dem Heimatstaat.', ['H', 'A', 'A₂'], [1], 'A → A₂ im selben Staat'],
    ['Kabotage (eigenständig)', 'Reiner Inlandsflug in einem fremden Staat (in der ICAO-Literatur als 9. Freiheit gezählt).', ['A', 'A₂'], [0], 'A → A₂ ohne Heimatbezug']];
  tools.push({ id: 'freiheiten', title: 'Freiheiten der Luft', sec: 'E-03',
    desc: 'Wähle eine Freiheit und beobachte die Route. H = Heimatstaat der Airline, A/B = fremde Staaten. Gelb = kommerzieller Abschnitt.',
    render(el, ctx) {
      el.innerHTML = `<div class="btn-row">${FR.map((x, i) => `<button class="btn ghost" data-f="${i}">${i + 1}. ${x[0]}</button>`).join('')}</div>
        <div class="lab-grid"><div class="panel"><div class="out-big" id="fn"></div><h4 id="ft" style="margin-top:6px"></h4><p id="fd"></p><p class="mono muted" id="fx" style="font-size:12px"></p></div><svg class="lab-svg" id="svg" viewBox="0 0 600 300"></svg></div>`;
      const POS = { H: [110, 200], A: [300, 110], B: [490, 200], 'A₂': [470, 90] };
      const NAME = { H: 'HEIMAT', A: 'STAAT A', B: 'STAAT B', 'A₂': 'STAAT A (2. STADT)' };
      let raf = null;
      const show = i => {
        $$('[data-f]', el).forEach(b => b.classList.toggle('solid', +b.dataset.f === i));
        const [t, d, nodes, comm, ex] = FR[i]; $('#fn', el).textContent = 'FREIHEIT ' + (i + 1); $('#ft', el).textContent = t; $('#fd', el).textContent = d; $('#fx', el).textContent = 'BEISPIEL: ' + ex.toUpperCase();
        const segs = []; for (let k = 0; k < nodes.length - 1; k++) segs.push([POS[nodes[k]], POS[nodes[k + 1]], comm.includes(k)]);
        let s = `<rect x="200" y="40" width="200" height="130" fill="#101c1f" stroke="${C.cy}" stroke-dasharray="4 4"/><text x="210" y="58" class="m" font-size="10" fill="${C.cy}">STAAT A</text>`;
        Object.keys(POS).forEach(k => { const [x, y] = POS[k], used = nodes.includes(k); s += `<circle cx="${x}" cy="${y}" r="16" fill="#0a0a0c" stroke="${k === 'H' ? C.or : k === 'B' ? C.mg : C.cy}" stroke-width="2" opacity="${used ? 1 : .25}"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="m" font-size="12" fill="#fff" opacity="${used ? 1 : .3}">${k}</text><text x="${x}" y="${y + 34}" text-anchor="middle" class="m" font-size="9" fill="${C.mu}" opacity="${used ? 1 : .3}">${NAME[k]}</text>`; });
        if (i === 0) { const [a, b] = [POS.H, POS.B]; s += `<path d="M${a[0]} ${a[1] - 18} Q300 -20 ${b[0]} ${b[1] - 18}" stroke="${C.st}" stroke-dasharray="6 4" fill="none" stroke-width="2" id="p0"/>`; }
        else segs.forEach(([a, b, c], k) => s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c ? C.ye : C.st}" stroke-width="${c ? 3 : 2}" stroke-dasharray="${c ? '' : '6 4'}" id="p${k}"/>`);
        s += `<g id="plane"><path d="M-12 0 L8 -3 L12 0 L8 3 Z M-2 -2 L-6 -12 L0 -12 L4 -2 Z M-2 2 L-6 12 L0 12 L4 2 Z" fill="${C.cy}"/></g>`;
        $('#svg', el).innerHTML = s;
        if (raf) cancelAnimationFrame(raf);
        const paths = $$('[id^="p"]', $('#svg', el)).filter(p => /^p\d$/.test(p.id)), pl = $('#plane', el);
        const lens = paths.map(p => p.getTotalLength()), tot = lens.reduce((a, b) => a + b, 0); let t0 = null;
        const step = ts => { if (!t0) t0 = ts; let d = ((ts - t0) / 3200 % 1) * tot, k = 0; while (k < lens.length - 1 && d > lens[k]) { d -= lens[k]; k++; }
          const p = paths[k].getPointAtLength(d), q = paths[k].getPointAtLength(Math.min(lens[k], d + 1)); const a = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
          pl.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${a})`); raf = requestAnimationFrame(step); };
        raf = requestAnimationFrame(step);
      };
      $$('[data-f]', el).forEach(b => b.addEventListener('click', () => show(+b.dataset.f)));
      ctx.onLeave(() => raf && cancelAnimationFrame(raf));
      show(4);
    } });

  /* ---------- 10. Verkehrsart-Klassifizierer ---------- */
  const CAT = ['Eingliedrig', 'Gebrochen', 'Intermodal (kein KV)', 'Kombinierter Verkehr'];
  const SCN = [
    ['Lkw-Komplettladung von Linz nach Hamburg, ohne Umladen.', 0, 'Ein Verkehrsmittel, kein Umschlag: eingliedrig und damit unimodal.'],
    ['Ganzzug mit Erz vom Bergwerk zum Stahlwerk, beide mit Gleisanschluss.', 0, 'Direktverkehr ohne Umschlag.'],
    ['Paletten fahren per Lkw zum Bahnhof, werden dort in einen Waggon umgeladen, per Bahn transportiert und wieder auf einen Lkw umgeladen.', 1, 'Das Gut selbst wird umgeladen: technische und ökonomische Unterbrechung.'],
    ['Stückgut wird per Lkw ins Depot gebracht, sortiert und auf einen anderen Lkw umgeladen.', 1, 'Gebrochen, aber unimodal: nur die Straße ist beteiligt.'],
    ['Sattelauflieger: 20 km Lkw zum Terminal, 900 km Bahn, 15 km Lkw zum Empfänger.', 3, 'Dieselbe Ladeeinheit, langer Hauptlauf auf der Schiene, kurzer Straßenvor- und -nachlauf.'],
    ['Rollende Landstraße: Der ganze Lkw fährt auf den Zug, der Fahrer reist im Liegewagen mit.', 3, 'Begleiteter kombinierter Verkehr.'],
    ['Container: 350 km Lkw, 30 km Bahn-Shuttle, 300 km Lkw. Der Container bleibt geschlossen.', 2, 'Intermodal (eine Ladeeinheit, mehrere Träger), aber kein KV, weil der Hauptlauf auf der Straße liegt.'],
    ['LCL-Sendung: Die Ware wird erst im Hafen mit anderen Sendungen in einen Container gepackt.', 1, 'LCL ist gebrochen, weil die Sendung selbst umgeschlagen wird.'],
    ['FCL-Container: 30 km Lkw zum Hafen, 600 km Binnenschiff, 20 km Lkw zum Empfänger.', 3, 'Intermodal mit langem Hauptlauf auf dem Binnenschiff: kombinierter Verkehr.']];
  tools.push({ id: 'verkehrsart', title: 'Verkehrsart-Klassifizierer', sec: 'B-04',
    desc: 'Spiel: Ordne jedes Szenario der richtigen Verkehrsart zu. Merke: multimodal ⊃ intermodal ⊃ kombiniert.',
    render(el, ctx) {
      let order = ctx.shuffle(SCN.map((_, i) => i)), k = 0, pts = 0;
      const draw = () => {
        if (k >= order.length) { el.innerHTML = `<div class="panel grade"><div class="lbl">ERGEBNIS</div><div class="led-num" style="font-size:80px">${pts}/${order.length}</div><p>${pts === order.length ? 'Perfekt sortiert!' : 'Lies B-04 nochmal und versuch es erneut.'}</p><button class="btn solid" id="re">Neue Runde</button></div>`; $('#re', el).addEventListener('click', () => { order = ctx.shuffle(order); k = 0; pts = 0; draw(); }); return; }
        const sc = SCN[order[k]];
        el.innerHTML = `<div class="panel"><div class="q-meta"><span>SZENARIO ${k + 1}/${order.length}</span><span>PUNKTE ${pts}</span></div><div class="bar"><i style="width:${k / order.length * 100}%"></i></div><p class="scen">${sc[0]}</p>
          ${CAT.map((c, i) => `<button class="opt" data-c="${i}"><span class="k">${'ABCD'[i]}</span><span>${c}</span></button>`).join('')}<div id="fb"></div></div>`;
        $$('[data-c]', el).forEach(b => b.addEventListener('click', () => {
          const c = +b.dataset.c, ok = c === sc[1]; if (ok) pts++;
          $$('[data-c]', el).forEach(x => { x.disabled = true; if (+x.dataset.c === sc[1]) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
          $('#fb', el).innerHTML = `<div class="fb ${ok ? '' : 'bad'}"><b class="h">${ok ? '✔ RICHTIG' : '✘ RICHTIG WÄRE: ' + CAT[sc[1]].toUpperCase()}</b>${sc[2]}</div><div class="btn-row"><button class="btn" id="nx">Weiter →</button></div>`;
          $('#nx', el).addEventListener('click', () => { k++; draw(); });
        }));
      };
      draw();
    } });

  /* ---------- 11. Avoid – Shift – Improve ---------- */
  const AIS = [['Videokonferenz statt Dienstreise', 0], ['Homeoffice an zwei Tagen pro Woche', 0], ['Stadt der kurzen Wege (Wohnen, Arbeit, Versorgung nah)', 0], ['Zulieferer siedelt sich neben dem Werk an', 0],
    ['Lkw-Fernverkehr auf die Bahn (Kombinierter Verkehr)', 1], ['Pendler steigen dank KlimaTicket auf den ÖV um', 1], ['Zeitlich gestaffelte Maut verschiebt Fahrten in die Nacht', 1], ['Umfahrungsstraße entlastet den Ortskern', 1],
    ['Elektro-Lkw statt Diesel', 2], ['Verkehrsbeeinflussungsanlage harmonisiert den Fluss', 2], ['Tourenplanung erhöht die Auslastung', 2], ['Sparsamere Motoren und Leichtbau', 2]];
  const ZN = [['Vermeiden', 'Avoid', C.cy], ['Verlagern', 'Shift', C.or], ['Verbessern', 'Improve', C.gr]];
  tools.push({ id: 'ais', title: 'Avoid – Shift – Improve', sec: 'C-04',
    desc: 'Spiel: Ziehe jede Maßnahme in die richtige Kategorie (oder Maßnahme antippen, dann Kategorie antippen).',
    render(el, ctx) {
      const items = ctx.shuffle(AIS.map((a, i) => ({ t: a[0], c: a[1], i, z: null })));
      let sel = null;
      const draw = () => {
        el.innerHTML = `<div class="pool zone" data-z="-1"><div class="lbl">MASSNAHMEN</div>${items.filter(x => x.z === null).map(x => `<span class="chipd ${sel === x.i ? 'sel' : ''}" draggable="true" data-i="${x.i}">${x.t}</span>`).join('') || '<span class="muted">Alle verteilt. Jetzt prüfen!</span>'}</div>
          <div class="drop-zones">${ZN.map((z, k) => `<div class="zone" data-z="${k}"><h5 style="color:${z[2]}">${z[0]} <span class="mono muted" style="font-size:11px">${z[1]}</span></h5>${items.filter(x => x.z === k).map(x => `<span class="chipd ${x.chk === undefined ? '' : x.chk ? 'ok' : 'no'}" draggable="true" data-i="${x.i}">${x.t}</span>`).join('')}</div>`).join('')}</div>
          <div class="btn-row"><button class="btn solid" id="ck">Prüfen</button><button class="btn ghost" id="rs">Neu mischen</button></div><div id="res"></div>`;
        $$('.chipd', el).forEach(c => {
          c.addEventListener('click', e => { e.stopPropagation(); sel = sel === +c.dataset.i ? null : +c.dataset.i; draw(); });
          c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', c.dataset.i); });
        });
        $$('[data-z]', el).forEach(z => {
          z.addEventListener('click', () => { if (sel === null) return; const it = items.find(x => x.i === sel); it.z = +z.dataset.z < 0 ? null : +z.dataset.z; delete it.chk; sel = null; draw(); });
          z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('over'); });
          z.addEventListener('dragleave', () => z.classList.remove('over'));
          z.addEventListener('drop', e => { e.preventDefault(); const it = items.find(x => x.i === +e.dataTransfer.getData('text/plain')); it.z = +z.dataset.z < 0 ? null : +z.dataset.z; delete it.chk; draw(); });
        });
        $('#ck', el).addEventListener('click', () => {
          items.forEach(x => { if (x.z !== null) x.chk = x.z === x.c; });
          const ok = items.filter(x => x.chk).length; draw();
          $('#res', el).innerHTML = `<div class="box ${ok === items.length ? 'fix' : 'res'}"><span class="tag">Ergebnis</span><p><b>${ok}/${items.length}</b> richtig zugeordnet. Rot markierte Karten kannst du verschieben und erneut prüfen. Vermeiden = Verkehr entsteht gar nicht; Verlagern = anderer Träger, Zeit oder Ort; Verbessern = effizienter und sauberer.</p></div>`;
        });
        $('#rs', el).addEventListener('click', () => { items.forEach(x => { x.z = null; delete x.chk; }); items.sort(() => Math.random() - .5); draw(); });
      };
      draw();
    } });

  window.VS_LAB = { tools };
})();
