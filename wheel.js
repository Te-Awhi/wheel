/* Shared Waitangi Wheel renderer — used by the client page and the admin page. */
(function () {
  const SPOKES = [
    {
      label: "Say", sub: "Understanding",
      statement: "Our whānau feels better equipped to understand and support our tamaiti."
    },
    {
      label: "Hear", sub: "Aroha & calm",
      statement: "There is more calm, aroha, and encouragement in our whānau relationships."
    },
    {
      label: "Feel", sub: "Confidence & hope",
      statement: "Our whānau feels more confident, connected, and hopeful about the path ahead."
    },
    {
      label: "See", sub: "Positive change",
      statement: "Our whānau can see positive change in how we respond to challenging moments and in the wellbeing of our whānau."
    },
    {
      label: "Advocacy", sub: "Partnership",
      statement: "Our whānau feels more confident engaging with schools and services and speaking up for our tamaiti's needs."
    },
    {
      label: "Whanaungatanga", sub: "Support",
      statement: "Our whānau feels supported by others in the rōpū and is able to share, learn, and grow alongside peers."
    }
  ];
  const SCALE = [
    "Not yet being felt in our whānau",
    "Starting",
    "Growing — sometimes present",
    "Often present",
    "Strongly present in our whānau"
  ];
  const WEEKS = ["w1", "w5", "w10"];
  const WEEK_META = {
    w1: { name: "Week 1", raw: "#2f7d5f", shape: "circle" },
    w5: { name: "Week 5", raw: "#c07a2e", shape: "triangle" },
    w10: { name: "Week 10", raw: "#5b4b8a", shape: "square" }
  };
  const CX = 390, CY = 310, R = 200, LEVELS = 5, VIEW_W = 780, VIEW_H = 640;

  function emptyWeeks() {
    return { w1: [null, null, null, null, null, null], w5: [null, null, null, null, null, null], w10: [null, null, null, null, null, null] };
  }

  function pt(axis, value) {
    const ang = (-90 + axis * 60) * Math.PI / 180;
    const r = R * value / LEVELS;
    return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
  }

  function marker(shape, x, y, color, big) {
    const s = big ? 8 : 6.5;
    if (shape === "circle") return `<circle cx="${x}" cy="${y}" r="${s}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
    if (shape === "triangle") {
      const h = s * 1.25;
      return `<polygon points="${x},${y - h} ${x + h * 0.9},${y + h * 0.75} ${x - h * 0.9},${y + h * 0.75}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
    }
    return `<rect x="${x - s}" y="${y - s}" width="${s * 2}" height="${s * 2}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
  }

  function labelPos(axis) {
    const ang = (-90 + axis * 60) * Math.PI / 180;
    const r = R + 34;
    const x = CX + r * Math.cos(ang), y = CY + r * Math.sin(ang);
    let anchor = "middle";
    if (axis === 1 || axis === 2) anchor = "start";
    if (axis === 4 || axis === 5) anchor = "end";
    return { x, y, anchor };
  }

  /**
   * Render the wheel into `container`.
   * opts: { weeks, activeWeek, interactive, onTap(axis, level) }
   */
  function render(container, opts) {
    const weeks = opts.weeks;
    const activeWeek = opts.activeWeek || "w1";
    let svg = `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;touch-action:manipulation">`;

    for (let lv = 1; lv <= LEVELS; lv++) {
      const pts = [];
      for (let a = 0; a < 6; a++) pts.push(pt(a, lv).join(","));
      svg += `<polygon points="${pts.join(" ")}" fill="none" stroke="${lv === LEVELS ? "#14453d" : "#c8d6c6"}" stroke-width="${lv === LEVELS ? 2 : 1}"/>`;
    }
    for (let a = 0; a < 6; a++) {
      const [x, y] = pt(a, LEVELS);
      svg += `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="#c8d6c6" stroke-width="1"/>`;
    }
    for (let lv = 1; lv <= LEVELS; lv++) {
      const [x, y] = pt(0, lv);
      svg += `<text x="${x + 8}" y="${y + 4}" font-size="10.5" fill="#7d9a8a">${lv}</text>`;
    }

    const order = WEEKS.filter(w => w !== activeWeek).concat([activeWeek]);
    for (const w of order) {
      const meta = WEEK_META[w];
      const vals = weeks[w] || [];
      const setPts = vals.map((v, i) => v ? pt(i, v) : null).filter(Boolean);
      if (setPts.length >= 3) {
        const ptsStr = setPts.map(p => p.join(",")).join(" ");
        const isActive = w === activeWeek;
        svg += `<polygon points="${ptsStr}" fill="${meta.raw}" fill-opacity="${isActive ? 0.16 : 0.09}" stroke="${meta.raw}" stroke-width="${isActive ? 2.5 : 1.5}" stroke-opacity="${isActive ? 0.9 : 0.55}"/>`;
      }
      vals.forEach((v, i) => {
        if (v) svg += marker(meta.shape, ...pt(i, v), meta.raw, w === activeWeek);
      });
    }

    svg += `<circle cx="${CX}" cy="${CY}" r="34" fill="#eaf0e6" stroke="#14453d" stroke-width="1.5"/>`;
    svg += `<text x="${CX}" y="${CY - 6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#14453d">Te Tiriti /</text>`;
    svg += `<text x="${CX}" y="${CY + 6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#14453d">Waitangi</text>`;
    svg += `<text x="${CX}" y="${CY + 18}" text-anchor="middle" font-size="8.5" fill="#2f6b57">whānau voice</text>`;

    SPOKES.forEach((s, a) => {
      const p = labelPos(a);
      svg += `<text class="axis-label" x="${p.x}" y="${p.y - 4}" text-anchor="${p.anchor}">${s.label}</text>`;
      svg += `<text class="axis-sub" x="${p.x}" y="${p.y + 11}" text-anchor="${p.anchor}">${s.sub}</text>`;
    });

    if (opts.interactive) {
      for (let a = 0; a < 6; a++) {
        for (let lv = 1; lv <= LEVELS; lv++) {
          const [x, y] = pt(a, lv);
          svg += `<circle cx="${x}" cy="${y}" r="2.6" fill="#a9bfae"/>`;
          svg += `<circle class="hit" data-axis="${a}" data-level="${lv}" cx="${x}" cy="${y}" r="15" fill="transparent"/>`;
        }
      }
    }

    svg += `</svg>`;
    container.innerHTML = svg;

    if (opts.interactive && opts.onTap) {
      container.querySelectorAll(".hit").forEach(el => {
        el.addEventListener("click", () => opts.onTap(+el.dataset.axis, +el.dataset.level));
      });
    }
  }

  function renderTable(el, weeks) {
    const anyData = WEEKS.some(w => (weeks[w] || []).some(v => v));
    if (!anyData) { el.innerHTML = ""; return; }
    let html = `<tr><th></th>` + WEEKS.map(w => `<th style="color:${WEEK_META[w].raw}">${WEEK_META[w].name}</th>`).join("") + `<th>Change</th></tr>`;
    SPOKES.forEach((s, i) => {
      const v1 = (weeks.w1 || [])[i], v10 = (weeks.w10 || [])[i];
      let chg = "—";
      if (v1 && v10) {
        const d = v10 - v1;
        chg = d > 0 ? `<span class="chg-up">▲ +${d}</span>` : d < 0 ? `<span class="chg-down">▼ ${d}</span>` : `<span>◆ 0</span>`;
      }
      html += `<tr><td><strong>${s.label}</strong> <span class="small">${s.sub}</span></td>` +
        WEEKS.map(w => `<td>${(weeks[w] || [])[i] ?? ""}</td>`).join("") +
        `<td>${chg}</td></tr>`;
    });
    el.innerHTML = html;
  }

  /**
   * Trend line chart for the admin dashboard — one line per spoke, weeks on the x axis.
   * opts: {
   *   series: [{ label, color, dashed?, values: {w1,w5,w10} (number|null) }],
   *   counts: {w1,w5,w10}   // submitted check-ins per week
   * }
   */
  function renderTrendChart(container, opts) {
    const series = opts.series || [];
    const counts = opts.counts || {};
    const L = 40, R = 170, T = 18, B = 48, W = 760, H = 380;
    const plotW = W - L - R, plotH = H - T - B;
    const xw = i => L + i * plotW / (WEEKS.length - 1);
    const yv = v => T + (5 - v) * plotH / 4;

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">`;

    for (let v = 1; v <= 5; v++) {
      svg += `<line x1="${L}" y1="${yv(v)}" x2="${L + plotW}" y2="${yv(v)}" stroke="${v === 1 ? "#c8d6c6" : "#e3ebe0"}" stroke-width="1"/>`;
      svg += `<text x="${L - 10}" y="${yv(v) + 4}" text-anchor="end" font-size="11" fill="#7d9a8a">${v}</text>`;
    }
    WEEKS.forEach((w, i) => {
      svg += `<text x="${xw(i)}" y="${T + plotH + 22}" text-anchor="middle" font-size="12" font-weight="700" fill="#2f6b57">${WEEK_META[w].name}</text>`;
      svg += `<text x="${xw(i)}" y="${T + plotH + 37}" text-anchor="middle" font-size="10" fill="#7d9a8a">${counts[w] || 0} submitted</text>`;
    });

    svg += `<line class="tc-guide" x1="0" y1="${T}" x2="0" y2="${T + plotH}" stroke="#9db8a8" stroke-width="1" style="display:none"/>`;

    const ends = [];
    series.forEach(s => {
      const pts = WEEKS.map((w, i) => s.values[w] != null ? { x: xw(i), y: yv(s.values[w]), v: s.values[w] } : null).filter(Boolean);
      if (!pts.length) return;
      if (pts.length > 1) {
        const d = pts.map((p, k) => (k ? "L" : "M") + p.x + " " + p.y).join(" ");
        svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${s.dashed ? ' stroke-dasharray="6 5"' : ""}/>`;
      }
      pts.forEach(p => {
        svg += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${s.color}" stroke="#fff" stroke-width="2"/>`;
      });
      const last = pts[pts.length - 1];
      ends.push({ s, x: last.x, y: last.y, v: last.v, ly: last.y });
    });

    // End labels: sorted by height, nudged apart, tied back with leader lines.
    ends.sort((a, b) => a.y - b.y);
    const slotH = 16, minY = T + 6, maxY = T + plotH - 2;
    ends.forEach((e, i) => { e.ly = Math.max(e.ly, minY, i ? ends[i - 1].ly + slotH : -Infinity); });
    for (let i = ends.length - 1; i >= 0; i--) {
      ends[i].ly = Math.min(ends[i].ly, i < ends.length - 1 ? ends[i + 1].ly - slotH : maxY);
    }
    const labelX = L + plotW + 16;
    ends.forEach(e => {
      svg += `<line x1="${e.x + 7}" y1="${e.y}" x2="${labelX - 4}" y2="${e.ly}" stroke="#c8d6c6" stroke-width="1"/>`;
      svg += `<circle cx="${labelX + 3}" cy="${e.ly}" r="3.5" fill="${e.s.color}"/>`;
      svg += `<text x="${labelX + 11}" y="${e.ly + 4}" font-size="11.5" fill="#14453d"><tspan font-weight="700">${e.v.toFixed(1)}</tspan> ${e.s.label}</text>`;
    });

    WEEKS.forEach((w, i) => {
      svg += `<rect class="tc-hit" data-week="${w}" data-x="${xw(i)}" x="${xw(i) - plotW / 4}" y="${T}" width="${plotW / 2}" height="${plotH}" fill="transparent"/>`;
    });

    svg += `</svg>`;
    container.innerHTML = svg + `<div class="tt"></div>`;

    const tt = container.querySelector(".tt");
    const guide = container.querySelector(".tc-guide");
    const svgEl = container.querySelector("svg");
    container.querySelectorAll(".tc-hit").forEach(hit => {
      const show = () => {
        const w = hit.dataset.week, gx = +hit.dataset.x;
        const rows = series
          .filter(s => s.values[w] != null)
          .sort((a, b) => b.values[w] - a.values[w])
          .map(s => `<div class="ttrow"><span class="dot" style="background:${s.color}"></span>${s.label} <b style="margin-left:auto">${s.values[w].toFixed(1)}</b></div>`)
          .join("");
        tt.innerHTML = `<strong>${WEEK_META[w].name}</strong> · ${counts[w] || 0} submitted${rows}`;
        tt.style.display = "block";
        const frac = gx / W;
        tt.style.left = Math.min(Math.max(frac * 100, 14), 74) + "%";
        tt.style.top = "10px";
        guide.setAttribute("x1", gx); guide.setAttribute("x2", gx);
        guide.style.display = "";
      };
      hit.addEventListener("mouseenter", show);
      hit.addEventListener("click", show);
    });
    svgEl.addEventListener("mouseleave", () => { tt.style.display = "none"; guide.style.display = "none"; });
  }

  /* Explanation block shared by both pages. */
  function explanationHtml() {
    return `
      <p>This wheel is a visual check-in for your Whakamana journey. You'll mark it three times —
      at <strong>Week 1</strong>, <strong>Week 5</strong> and <strong>Week 10</strong> — so you and your whānau can
      see what is shifting across the hīkoi. The centre of the wheel holds mana, rangatiratanga and whānau voice.
      There are no right or wrong answers — this is your whānau voice, not a test.</p>
      <p><strong>How to score.</strong> For each spoke, choose where your whānau is right now:</p>
      <ol class="scale">${SCALE.map(s => `<li>${s}</li>`).join("")}</ol>
      <p><strong>What each spoke asks</strong> — how strongly does this feel true for your whānau right now?</p>
      <ul class="statements">
        ${SPOKES.map(s => `<li><strong>${s.label}</strong> <span class="small">(${s.sub})</span> — ${s.statement}</li>`).join("")}
      </ul>`;
  }

  window.WaitangiWheel = { SPOKES, SCALE, WEEKS, WEEK_META, emptyWeeks, render, renderTable, renderTrendChart, explanationHtml };
})();
