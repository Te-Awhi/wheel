/* Shared Waitangi Wheel renderer — used by the client page and the admin page. */
(function () {
  const SPOKES = [
    { label: "Say", sub: "Understand & support tamaiti" },
    { label: "Hear", sub: "Calm, aroha & encouragement" },
    { label: "Feel", sub: "Confident, connected & hopeful" },
    { label: "See", sub: "Positive change & wellbeing" },
    { label: "Advocacy", sub: "Schools & services" },
    { label: "Whanaungatanga", sub: "Rōpū & peers" }
  ];
  const WEEKS = ["w1", "w5", "w10"];
  const WEEK_META = {
    w1: { name: "Week 1", raw: "#2f7d5f", shape: "circle" },
    w5: { name: "Week 5", raw: "#c07a2e", shape: "triangle" },
    w10: { name: "Week 10", raw: "#5b4b8a", shape: "square" }
  };
  const CX = 360, CY = 310, R = 205, LEVELS = 5;

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
    let svg = `<svg viewBox="0 0 720 640" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;touch-action:manipulation">`;

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
      html += `<tr><td><strong>${s.label}</strong></td>` +
        WEEKS.map(w => `<td>${(weeks[w] || [])[i] ?? ""}</td>`).join("") +
        `<td>${chg}</td></tr>`;
    });
    el.innerHTML = html;
  }

  window.WaitangiWheel = { SPOKES, WEEKS, WEEK_META, emptyWeeks, render, renderTable };
})();
