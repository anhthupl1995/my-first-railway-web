// Môn Tiếng Anh: Từ vựng qua hình, Word search, Tô màu theo chữ
(function () {
  const { register, rand, pick, shuffle, sample, quiz, esc } = App;

  const EN = {
    animals: { name: "Con vật", emoji: "🐾", words: [["cat", "🐱"], ["dog", "🐶"], ["pig", "🐷"], ["cow", "🐮"], ["hen", "🐔"], ["duck", "🦆"], ["fish", "🐟"], ["bird", "🐦"], ["lion", "🦁"], ["bear", "🐻"], ["frog", "🐸"], ["bee", "🐝"], ["horse", "🐴"], ["monkey", "🐵"]] },
    fruits: { name: "Trái cây", emoji: "🍎", words: [["apple", "🍎"], ["banana", "🍌"], ["grape", "🍇"], ["lemon", "🍋"], ["pear", "🍐"], ["peach", "🍑"], ["kiwi", "🥝"], ["cherry", "🍒"], ["orange", "🍊"], ["melon", "🍈"]] },
    things: { name: "Đồ vật", emoji: "🧸", words: [["ball", "⚽"], ["car", "🚗"], ["bus", "🚌"], ["sun", "☀️"], ["star", "⭐"], ["moon", "🌙"], ["book", "📖"], ["cake", "🎂"], ["hat", "🎩"], ["key", "🔑"], ["boat", "⛵"], ["bed", "🛏️"]] }
  };
  const ALL = Object.values(EN).flatMap((t) => t.words);

  // ---------- Từ vựng qua hình ----------
  register({
    id: "tu-vung", subject: "tieng-anh", name: "Từ vựng qua hình", emoji: "🖼️",
    desc: "Nghe hoặc đọc từ tiếng Anh, chọn đúng hình", ages: [0, 1, 2, 3],
    mount(el, ctx) {
      const listen = ctx.age <= 1, n = [2, 3, 3, 4][ctx.age];
      quiz(el, {
        autoSay: listen,
        make() {
          const items = sample(ALL, n), t = pick(items);
          if (listen) return {
            prompt: `<p class="q-text">Đâu là <b class="en">${t[0]}</b>?</p>`,
            say: [t[0], "en-US"], after: [t[0], "en-US"],
            options: items.map((x) => ({ html: `<span class="emoji-opt">${x[1]}</span>`, ok: x === t }))
          };
          return {
            prompt: `<div class="big-emoji" aria-hidden="true">${t[1]}</div><p class="q-text">Đây là gì?</p>`,
            after: [t[0], "en-US"], optClass: "wide-opts",
            options: items.map((x) => ({ html: `<span class="word">${x[0]}</span>`, ok: x === t }))
          };
        }
      });
    }
  });

  // ---------- Word search ----------
  const WS = {
    1: { size: 5, n: 3, dirs: [[0, 1]] },
    2: { size: 7, n: 4, dirs: [[0, 1], [1, 0]] },
    3: { size: 9, n: 6, dirs: [[0, 1], [1, 0], [1, 1]] }
  };
  const FOUND_COLORS = ["#F87171", "#60A5FA", "#34D399", "#F59E0B", "#A78BFA", "#F472B6"];
  const FILL = "ABCDEFGHIJKLMNOPRSTUVWY";

  function buildPuzzle(cfg, theme) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const g = Array.from({ length: cfg.size }, () => Array(cfg.size).fill(""));
      const placed = [];
      for (const [w, em] of shuffle(EN[theme].words.filter((x) => x[0].length <= cfg.size))) {
        if (placed.length === cfg.n) break;
        const W = w.toUpperCase();
        for (let t = 0; t < 80; t++) {
          const [dr, dc] = pick(cfg.dirs);
          const r0 = rand(0, cfg.size - 1 - dr * (W.length - 1)), c0 = rand(0, cfg.size - 1 - dc * (W.length - 1));
          let fits = true;
          for (let k = 0; k < W.length && fits; k++) { const ch = g[r0 + dr * k][c0 + dc * k]; if (ch && ch !== W[k]) fits = false; }
          if (!fits) continue;
          const cells = [];
          for (let k = 0; k < W.length; k++) { g[r0 + dr * k][c0 + dc * k] = W[k]; cells.push((r0 + dr * k) * cfg.size + c0 + dc * k); }
          placed.push({ w: W, em, cells, found: false });
          break;
        }
      }
      if (placed.length === cfg.n) {
        g.forEach((row) => row.forEach((ch, c) => { if (!ch) row[c] = pick(FILL.split("")); }));
        return { g, placed };
      }
    }
  }

  register({
    id: "word-search", subject: "tieng-anh", name: "Word search", emoji: "🔎",
    desc: "Tìm các từ tiếng Anh ẩn trong bảng chữ", ages: [1, 2, 3],
    mount(el, ctx) {
      const cfg = WS[ctx.age];
      let theme = "animals";
      const hint = { 1: "Từ nằm theo hàng ngang →", 2: "Từ nằm ngang → hoặc dọc ↓", 3: "Từ nằm ngang →, dọc ↓ hoặc chéo ↘" }[ctx.age];

      // start(puzzle) chơi lại đúng bảng cũ; start() tạo bảng mới
      function start(puzzle) {
        const pz = puzzle && puzzle.g ? puzzle : buildPuzzle(cfg, theme);
        const g = pz.g, placed = pz.placed.map((p) => ({ ...p, found: false })), size = cfg.size, letters = g.flat();
        let startCell = null, current = null, dragging = false, pending = null, foundCount = 0;
        el.innerHTML = `
          <div class="chips" role="group" aria-label="Chủ đề">${Object.entries(EN).map(([id, t]) =>
            `<button type="button" class="chip" data-theme="${id}" aria-pressed="${id === theme}">${t.emoji} ${t.name}</button>`).join("")}</div>
          <p class="hint">Kéo ngón tay (hoặc chạm chữ đầu rồi chữ cuối) để tìm từ. ${hint}</p>
          <div class="ws-body">
            <ul class="ws-words">${placed.map((p) => `<li data-w="${p.w}"><span aria-hidden="true">${p.em}</span>${p.w}</li>`).join("")}</ul>
            <div class="ws-grid" style="--n:${size}" role="grid" aria-label="Bảng chữ">${letters.map((ch, i) => `<div class="ws-cell" data-i="${i}">${ch}</div>`).join("")}</div>
          </div>
          <p class="q-feedback" role="status"></p>
          <div class="actions"><button type="button" class="btn btn-soft" data-new>Bảng mới</button></div>`;
        const grid = el.querySelector(".ws-grid"), cells = [...grid.children], fb = el.querySelector(".q-feedback");

        const line = (a, b) => {
          const ra = Math.floor(a / size), ca = a % size, rb = Math.floor(b / size), cb = b % size;
          const dr = Math.sign(rb - ra), dc = Math.sign(cb - ca), len = Math.max(Math.abs(rb - ra), Math.abs(cb - ca)) + 1;
          if (!(ra === rb || ca === cb || Math.abs(rb - ra) === Math.abs(cb - ca))) return [a];
          return Array.from({ length: len }, (_, k) => (ra + dr * k) * size + ca + dc * k);
        };
        const highlight = (list) => cells.forEach((c, i) => c.classList.toggle("sel", list.includes(i)));
        const cellAt = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest(".ws-cell") ? +t.closest(".ws-cell").dataset.i : null; };

        function evaluate(a, b) {
          const list = line(a, b), word = list.map((i) => letters[i]).join("");
          const hit = placed.find((p) => !p.found && (p.w === word || p.w === [...word].reverse().join("")));
          highlight([]);
          if (!hit) { if (list.length > 1) { fb.className = "q-feedback bad"; fb.textContent = "Chưa phải rồi, tìm tiếp nhé!"; App.sfx(false); } return; }
          hit.found = true; const color = FOUND_COLORS[foundCount++ % FOUND_COLORS.length];
          list.forEach((i) => { cells[i].classList.add("found"); cells[i].style.background = color; });
          el.querySelector(`[data-w="${hit.w}"]`).classList.add("done");
          fb.className = "q-feedback ok"; fb.textContent = `${App.pick(App.PRAISE)} ${hit.w}`;
          App.sfx(true); setTimeout(() => App.speak(hit.w.toLowerCase(), "en-US"), 250);
          if (foundCount === placed.length) setTimeout(() => App.finish(el, {
            score: 1, total: 1, text: `Bé đã tìm được hết <b>${placed.length}</b> từ!`, again: () => start(pz), renew: () => start()
          }), 1300);
        }

        grid.addEventListener("pointerdown", (e) => {
          const i = cellAt(e); if (i === null) return;
          e.preventDefault();
          if (pending !== null && pending !== i) { const a = pending; pending = null; evaluate(a, i); return; }
          startCell = current = i; dragging = true; highlight([i]);
        });
        grid.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          const i = cellAt(e); if (i === null || i === current) return;
          current = i; highlight(line(startCell, i));
        });
        const up = () => {
          if (!dragging) return; dragging = false;
          if (current === startCell) { pending = pending === startCell ? null : startCell; highlight(pending === null ? [] : [startCell]); }
          else evaluate(startCell, current);
        };
        grid.addEventListener("pointerup", up);
        grid.addEventListener("pointercancel", () => { dragging = false; highlight([]); });
        el.querySelector("[data-new]").addEventListener("click", () => start());
        el.querySelector(".chips").addEventListener("click", (e) => { const b = e.target.closest("[data-theme]"); if (b) { theme = b.dataset.theme; start(); } });
      }
      start();
    }
  });

  // ---------- Tô màu theo chữ (color by word) ----------
  const COLORS = { red: "#EF4444", orange: "#FB923C", yellow: "#FACC15", green: "#22C55E", blue: "#60A5FA", purple: "#A78BFA", pink: "#F472B6", brown: "#A16207", black: "#3F3F46" };
  // [tag, attributes, color word, [labelX, labelY, fontSize?]]
  const petal = (deg, color) => {
    const a = (deg * Math.PI) / 180, r = (d) => [150 + d * Math.cos(a), 85 + d * Math.sin(a)].map((v) => +v.toFixed(1));
    const [cx, cy] = r(32), [lx, ly] = r(41);
    return ["circle", { cx, cy, r: 22 }, color, [lx, ly, 9]];
  };
  const PICTURES = [
    { id: "house", name: "Ngôi nhà", emoji: "🏠", shapes: [
      ["rect", { x: 0, y: 0, width: 300, height: 180 }, "blue", [45, 28]],
      ["rect", { x: 0, y: 180, width: 300, height: 60 }, "green", [150, 214]],
      ["circle", { cx: 250, cy: 48, r: 28 }, "yellow", [250, 48]],
      ["polygon", { points: "60,105 150,40 240,105" }, "red", [150, 84]],
      ["rect", { x: 75, y: 105, width: 150, height: 75 }, "orange", [105, 150]],
      ["rect", { x: 135, y: 125, width: 30, height: 55 }, "brown", [150, 155, 10]],
      ["rect", { x: 180, y: 118, width: 35, height: 32 }, "purple", [197.5, 134, 10]]
    ] },
    { id: "fish", name: "Chú cá", emoji: "🐟", shapes: [
      ["rect", { x: 0, y: 0, width: 300, height: 240 }, "blue", [40, 26]],
      ["rect", { x: 0, y: 205, width: 300, height: 35 }, "brown", [150, 223]],
      ["polygon", { points: "28,205 20,160 36,130 26,95 52,125 44,160 60,205" }, "green", [42, 190, 10]],
      ["polygon", { points: "205,110 262,62 262,158" }, "yellow", [242, 110]],
      ["polygon", { points: "100,64 138,24 168,62" }, "red", [136, 50, 11]],
      ["ellipse", { cx: 130, cy: 112, rx: 85, ry: 55 }, "orange", [105, 140]],
      ["ellipse", { cx: 165, cy: 112, rx: 14, ry: 50 }, "pink", [165, 112, 9]],
      ["circle", { cx: 85, cy: 100, r: 15 }, "black", [85, 100, 8]]
    ] },
    { id: "flower", name: "Bông hoa", emoji: "🌸", shapes: [
      ["rect", { x: 0, y: 0, width: 300, height: 240 }, "blue", [40, 26]],
      ["path", { d: "M145 108h10v84h-10z M155 165q40-34 50-6q-22 26-50 16z" }, "green", [184, 166, 9]],
      ["polygon", { points: "108,190 192,190 180,236 120,236" }, "brown", [150, 214]],
      petal(0, "red"), petal(60, "pink"), petal(120, "purple"), petal(180, "red"), petal(240, "pink"), petal(300, "purple"),
      ["circle", { cx: 150, cy: 85, r: 17 }, "yellow", [150, 85, 9]]
    ] }
  ];
  const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(" ");

  register({
    id: "to-mau", subject: "tieng-anh", name: "Tô màu theo chữ", emoji: "🎨",
    desc: "Đọc tên màu tiếng Anh và tô đúng màu vào tranh", ages: [1, 2, 3],
    mount(el, ctx) {
      let picId = PICTURES[0].id;
      function start() {
        const pic = PICTURES.find((p) => p.id === picId), shapes = pic.shapes;
        const used = [...new Set(shapes.map((s) => s[2]))];
        const palette = ctx.age === 1 ? used : Object.keys(COLORS); // bé nhỏ: chỉ các màu có trong tranh
        let color = null, done = 0;
        const mistakes = shapes.map(() => 0), filled = shapes.map(() => false);
        el.innerHTML = `
          <div class="color-wrap">
            <div class="chips" role="group" aria-label="Chọn tranh">${PICTURES.map((p) =>
              `<button type="button" class="chip" data-pic="${p.id}" aria-pressed="${p.id === picId}">${p.emoji} ${p.name}</button>`).join("")}</div>
            <svg class="pic" viewBox="0 0 300 240" role="img" aria-label="Tranh ${esc(pic.name)} để tô màu">
              ${shapes.map((s, i) => `<g class="region" data-i="${i}"><${s[0]} ${attrs(s[1])} fill="#fff" stroke="#3a3a3a" stroke-width="2" stroke-linejoin="round"/></g>`).join("")}
              <g>${shapes.map((s) => `<text x="${s[3][0]}" y="${s[3][1]}" font-size="${s[3][2] || 13}">${s[2]}</text>`).join("")}</g>
            </svg>
            <p class="color-msg" role="status"></p>
            <div class="palette" role="group" aria-label="Bảng màu">${shuffle(palette).map((c) =>
              `<button type="button" class="swatch" data-color="${c}" aria-pressed="false"><span class="dot" style="background:${COLORS[c]}" aria-hidden="true"></span>${c}</button>`).join("")}</div>
            <div class="actions" style="margin-top:4px"><button type="button" class="btn btn-soft" data-reset>Tô lại</button></div>
          </div>`;
        const msg = el.querySelector(".color-msg");
        msg.textContent = "Chọn màu bên dưới, rồi chạm vào ô có tên màu đó.";

        el.querySelector(".palette").addEventListener("click", (e) => {
          const b = e.target.closest("[data-color]"); if (!b) return;
          color = b.dataset.color;
          el.querySelectorAll(".swatch").forEach((x) => x.setAttribute("aria-pressed", x === b));
          msg.className = "color-msg"; msg.textContent = `Bé đang chọn màu: ${color}`;
          App.speak(color, "en-US");
        });
        el.querySelector(".pic").addEventListener("click", (e) => {
          const g = e.target.closest(".region"); if (!g) return;
          const i = +g.dataset.i; if (filled[i]) return;
          if (!color) { msg.className = "color-msg bad"; msg.textContent = "Bé chọn màu trước nhé!"; return; }
          if (color === shapes[i][2]) {
            filled[i] = true; done++;
            g.firstElementChild.setAttribute("fill", COLORS[color]);
            msg.className = "color-msg"; msg.style.color = "var(--ok)"; msg.textContent = App.pick(App.PRAISE);
            App.sfx(true);
            if (done === shapes.length) setTimeout(() => {
              const right = mistakes.filter((m) => m === 0).length;
              App.finish(el, { score: right, total: shapes.length, text: `Bé tô đúng ngay lần đầu <b>${right}/${shapes.length}</b> ô.`, again: start, renew: () => {
                picId = PICTURES[(PICTURES.findIndex((p) => p.id === picId) + 1) % PICTURES.length].id; start();
              } });
            }, 900);
          } else {
            mistakes[i]++;
            g.classList.remove("shake"); void g.getBBox(); g.classList.add("shake");
            msg.style.color = "var(--bad)"; msg.textContent = `Ô này không phải màu ${color}, bé đọc lại chữ nhé!`;
            App.sfx(false);
          }
        });
        el.querySelector("[data-reset]").addEventListener("click", start);
        el.querySelector(".chips").addEventListener("click", (e) => { const b = e.target.closest("[data-pic]"); if (b) { picId = b.dataset.pic; start(); } });
      }
      start();
    }
  });
})();
