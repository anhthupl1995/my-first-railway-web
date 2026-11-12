// Môn Tư duy: Mê cung, Tìm bóng cho hình, Bài quy luật.
// Cả 3 bài cho mọi độ tuổi; tuổi càng lớn càng khó (ctx.age: 0 = 2–3 tuổi … 3 = 5–6 tuổi).
(function () {
  const { register, pick, shuffle, sample, quiz } = App;

  // =====================================================================
  // Mê cung: bé kéo ngón tay (hoặc chạm từng ô / bấm mũi tên) đưa con vật tới đích.
  // =====================================================================
  const MAZE_SIZE = [4, 5, 7, 9];
  const MAZE_THEMES = [
    ["🐭", "🧀", "chuột", "miếng phô mai"], ["🐰", "🥕", "thỏ", "củ cà rốt"], ["🐝", "🌸", "ong", "bông hoa"],
    ["🐶", "🦴", "cún", "khúc xương"], ["🐵", "🍌", "khỉ", "quả chuối"], ["🐔", "🌽", "gà", "bắp ngô"]
  ];
  const DIRS = [[-1, 0, 0, 2], [0, 1, 1, 3], [1, 0, 2, 0], [0, -1, 3, 1]]; // [dRow, dCol, tường của ô này, tường của ô bên cạnh] – N E S W

  // Mê cung "hoàn hảo" (đúng một đường giữa hai ô bất kỳ) bằng DFS quay lui.
  function makeMaze(n) {
    const walls = Array.from({ length: n * n }, () => [true, true, true, true]), seen = new Set([0]), stack = [0];
    while (stack.length) {
      const cur = stack[stack.length - 1], r = Math.floor(cur / n), c = cur % n;
      const next = shuffle(DIRS).map(([dr, dc, w, o]) => [(r + dr) * n + c + dc, r + dr, c + dc, w, o])
        .find(([j, rr, cc]) => rr >= 0 && rr < n && cc >= 0 && cc < n && !seen.has(j));
      if (!next) { stack.pop(); continue; }
      const [j, , , w, o] = next;
      walls[cur][w] = false; walls[j][o] = false; seen.add(j); stack.push(j);
    }
    return walls;
  }

  register({
    id: "me-cung", subject: "tu-duy", name: "Mê cung", emoji: "🌀",
    desc: "Đưa con vật đi qua mê cung tới đích", ages: [0, 1, 2, 3],
    mount(el, ctx) {
      const n = MAZE_SIZE[ctx.age], total = App.ROUNDS;
      // Xuất phát ở một góc, đích ở góc đối diện – đổi ngẫu nhiên để mỗi mê cung trông khác nhau
      const CORNERS = [[0, n * n - 1], [n - 1, n * (n - 1)], [n * n - 1, 0], [n * (n - 1), n - 1]];
      let set = [], k, score, walls, theme, start, goal, trail, bumps, busy;

      function renew() {
        // Lượt mới: con vật đầu tiên và góc xuất phát của mê cung đầu không trùng lượt trước
        const prev = set[0];
        let themes; do { themes = shuffle(MAZE_THEMES); } while (prev && themes[0] === prev.theme);
        let corners = shuffle(CORNERS);
        if (prev && corners[0][0] === prev.start) corners.push(corners.shift());
        set = Array.from({ length: total }, (_, i) => {
          const [s0, g0] = corners[i % corners.length];
          return { walls: makeMaze(n), theme: themes[i % themes.length], start: s0, goal: g0 };
        });
        replay();
      }
      function replay() { k = 0; score = 0; show(); }

      function show() {
        if (k >= total) return App.finish(el, {
          score, total, text: `Bé đi hết <b>${total}</b> mê cung, <b>${score}</b> lần không chạm tường.`, again: replay, renew
        });
        ({ walls, theme, start, goal } = set[k]); trail = [start]; bumps = 0; busy = false;
        const prompt = `Bé giúp ${theme[2]} tìm đường tới ${theme[3]} nhé!`;
        el.innerHTML = `
          <div class="quiz">
            <div class="progress"><span style="width:${(k / total) * 100}%"></span></div>
            <div class="q-count">Mê cung ${k + 1}/${total}</div>
            <div class="q-prompt"><p class="q-text">${prompt}</p>${App.canSpeak ? '<button class="speak" type="button" data-say aria-label="Nghe hướng dẫn">🔊</button>' : ""}</div>
            <div class="maze" style="--n:${n}" role="grid" aria-label="Mê cung ${n} x ${n}">${walls.map((w, i) =>
              `<div class="mz-cell${w[0] ? " wn" : ""}${w[1] ? " we" : ""}${w[2] ? " ws" : ""}${w[3] ? " ww" : ""}" data-i="${i}"></div>`).join("")}</div>
            <div class="mz-pad" role="group" aria-label="Nút di chuyển">
              <button type="button" class="mz-btn" data-d="0" aria-label="Lên">⬆️</button>
              <button type="button" class="mz-btn" data-d="3" aria-label="Sang trái">⬅️</button>
              <button type="button" class="mz-btn" data-d="2" aria-label="Xuống">⬇️</button>
              <button type="button" class="mz-btn" data-d="1" aria-label="Sang phải">➡️</button>
            </div>
            <p class="q-feedback" role="status"></p>
          </div>`;
        paint(); bind();
        App.speak(prompt, "vi-VN");
      }

      const cell = (i) => el.querySelector(`.mz-cell[data-i="${i}"]`);
      function paint() {
        const pos = trail[trail.length - 1];
        el.querySelectorAll(".mz-cell").forEach((c) => { c.classList.remove("trail"); c.textContent = ""; });
        trail.forEach((i) => cell(i).classList.add("trail"));
        cell(goal).textContent = theme[1];
        cell(pos).textContent = theme[0];
      }
      // Hướng (0–3) để đi từ ô a sang ô b liền kề, hoặc -1 nếu không liền kề
      function dirTo(a, b) {
        const ra = Math.floor(a / n), ca = a % n, rb = Math.floor(b / n), cb = b % n;
        return DIRS.findIndex(([dr, dc]) => ra + dr === rb && ca + dc === cb);
      }
      // Thử đi sang ô b. quiet = đang kéo tay (bỏ qua ô không hợp lệ, không báo lỗi).
      function go(b, quiet) {
        if (busy) return;
        const pos = trail[trail.length - 1];
        if (b === pos) return;
        if (trail.length > 1 && b === trail[trail.length - 2]) { trail.pop(); return paint(); } // quay lại ô trước
        const d = dirTo(pos, b);
        if (d < 0 || walls[pos][DIRS[d][2]]) return quiet ? undefined : bump(d >= 0);
        const loop = trail.indexOf(b);
        if (loop >= 0) trail.length = loop + 1; else trail.push(b); // đi vòng lại thì cắt bớt dấu chân
        paint();
        if (b === goal) {
          busy = true; if (!bumps) score++;
          const fb = el.querySelector(".q-feedback"); fb.className = "q-feedback ok"; fb.textContent = App.pick(App.PRAISE);
          App.sfx(true);
          setTimeout(() => { k++; show(); }, 1400);
        }
      }
      function bump(wall) {
        if (busy) return;
        bumps++;
        const c = cell(trail[trail.length - 1]); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
        const fb = el.querySelector(".q-feedback"); fb.className = "q-feedback bad";
        fb.textContent = wall ? "Ối, có tường rồi! Bé tìm lối khác nhé." : "Bé đi sang ô bên cạnh nhé!";
        App.sfx(false);
      }
      function step(d) {
        const pos = trail[trail.length - 1];
        if (walls[pos][DIRS[d][2]]) return bump(true); // mép mê cung cũng là tường
        go((Math.floor(pos / n) + DIRS[d][0]) * n + pos % n + DIRS[d][1]);
      }

      function bind() {
        const board = el.querySelector(".maze");
        let drag = false;
        const at = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); const c = t && t.closest(".mz-cell"); return c && board.contains(c) ? +c.dataset.i : null; };
        board.addEventListener("pointerdown", (e) => {
          const i = at(e); if (i === null) return;
          e.preventDefault(); drag = true;
          try { board.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          go(i, i === trail[trail.length - 1]);
        });
        board.addEventListener("pointermove", (e) => { if (!drag) return; const i = at(e); if (i !== null) go(i, true); });
        const stop = () => { drag = false; };
        board.addEventListener("pointerup", stop); board.addEventListener("pointercancel", stop);
      }

      const onKey = (e) => {
        const d = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[e.key];
        if (d === undefined || !el.querySelector(".maze")) return;
        e.preventDefault(); step(d);
      };
      document.addEventListener("keydown", onKey);
      window.addEventListener("hashchange", () => document.removeEventListener("keydown", onKey), { once: true });
      el.addEventListener("click", (e) => {
        const b = e.target.closest("[data-d]"); if (b) return step(+b.dataset.d);
        if (e.target.closest("[data-say]")) App.speak(`Bé giúp ${theme[2]} tìm đường tới ${theme[3]} nhé!`, "vi-VN");
      });
      renew();
    }
  });

  // =====================================================================
  // Tìm bóng cho hình: nhìn hình màu, chọn cái bóng đúng của nó.
  //   2–3 tuổi: 2 bóng khác hẳn nhau · 3–4: 3 bóng · 4–5: 3 bóng cùng nhóm (dễ lẫn)
  //   5–6: 4 bóng cùng nhóm, có thêm bóng bị lật ngược (soi gương) của chính hình đó
  // =====================================================================
  const DISTINCT = "🍎 🚗 🐟 ⭐ 🏠 🌙 ☂️ 🎈 🦋 🐘 ✈️ 🍌 🔑 ⛵ 🌲 🐢 ✂️ 🎸".split(" ");
  const SIMILAR = [
    "🐶 🐱 🐰 🐷 🐸 🐵 🐔 🐻 🦁".split(" "),
    "🐘 🦒 🐄 🐎 🐢 🐌 🐓 🦆 🐿️ 🦔".split(" "),
    "🍎 🍐 🍌 🍇 🍓 🍒 🍍 🥕 🍆 🍋".split(" "),
    "✂️ 🔑 🔨 ☂️ 🎸 ⏰ 💡 👓 🪣".split(" ")
  ];
  // Hình không đối xứng trái–phải: bóng lật ngược nhìn khác hẳn, nên dùng được làm đáp án nhiễu
  const ASYM = new Set("🐘 🦒 🐄 🐎 🐢 🐌 🐓 🦆 🐿️ 🦔 🍌 🔑 🔨 🎸 🥕 🍆 🐟 ✈️ ⛵".split(" "));
  const SHADOW_K = [2, 3, 3, 4];
  const shadow = (em, flip) => `<span class="shadow-em${flip ? " flip" : ""}">${em}</span>`;

  register({
    id: "tim-bong", subject: "tu-duy", name: "Tìm bóng cho hình", emoji: "👤",
    desc: "Nhìn hình, chọn cái bóng đúng của nó", ages: [0, 1, 2, 3],
    mount(el, ctx) {
      const age = ctx.age, kOpt = SHADOW_K[age], q = "Đâu là bóng của hình này?";
      let last = null;
      quiz(el, {
        autoSay: true,
        make() {
          const pool = age < 2 ? DISTINCT : pick(SIMILAR);
          let t; do { t = pick(pool); } while (t === last && pool.length > 1);
          last = t;
          const mirror = age === 3 && ASYM.has(t);
          const others = sample(pool.filter((x) => x !== t), kOpt - 1 - (mirror ? 1 : 0));
          const opts = [{ html: shadow(t), ok: true }, ...others.map((x) => ({ html: shadow(x), ok: false }))];
          if (mirror) opts.push({ html: shadow(t, true), ok: false });
          return {
            prompt: `<p class="q-text">${q}</p><div class="big-emoji">${t}</div>`,
            say: [q, "vi-VN"], optClass: "pic-opts shadow-opts", options: shuffle(opts)
          };
        }
      });
    }
  });

  // =====================================================================
  // Bài quy luật: dãy hình lặp lại theo quy luật, bé chọn hình còn thiếu.
  //   2–3 tuổi: AB, thiếu hình cuối, 2 lựa chọn
  //   3–4: AB / AAB / ABB, thiếu hình cuối, 3 lựa chọn
  //   4–5: ABC / AABB / ABB / AAB, thiếu một trong vài hình cuối, 3 lựa chọn
  //   5–6: ABCD / AABC / ABBC / ABAC, thiếu ở bất kỳ vị trí nào, 4 lựa chọn
  // =====================================================================
  const PAT_POOL = "🍎 🍌 🍇 🐶 🐱 ⭐ 🌙 🚗 🌸 ❤️ 🐟 🎈 🔵 🟡".split(" ");
  const PAT = [
    { units: ["AB"], len: 6, k: 2, gap: "last" },
    { units: ["AB", "AAB", "ABB"], len: 7, k: 3, gap: "last" },
    { units: ["ABC", "AABB", "ABB", "AAB"], len: 8, k: 3, gap: "tail" },
    { units: ["ABCD", "AABC", "ABBC", "ABAC"], len: 9, k: 4, gap: "any" }
  ];

  register({
    id: "quy-luat", subject: "tu-duy", name: "Bài quy luật", emoji: "🔁",
    desc: "Tìm hình còn thiếu trong dãy hình lặp lại", ages: [0, 1, 2, 3],
    mount(el, ctx) {
      const cfg = PAT[ctx.age], q = "Hình nào còn thiếu?";
      quiz(el, {
        autoSay: true,
        make() {
          const unit = pick(cfg.units), letters = [...new Set(unit)];
          const map = {}; sample(PAT_POOL, letters.length).forEach((em, i) => (map[letters[i]] = em));
          const seq = Array.from({ length: Math.max(cfg.len, unit.length * 2 + 1) }, (_, i) => map[unit[i % unit.length]]);
          const L = seq.length;
          const gap = cfg.gap === "last" ? L - 1 : cfg.gap === "tail" ? L - 1 - App.rand(0, unit.length - 1) : App.rand(0, L - 1);
          const ans = seq[gap];
          const wrong = [...new Set([...letters.map((x) => map[x]), ...shuffle(PAT_POOL)])].filter((x) => x !== ans).slice(0, cfg.k - 1);
          return {
            prompt: `<p class="q-text">${q}</p><div class="pattern" aria-label="Dãy hình">${seq.map((x, i) =>
              i === gap ? '<span class="pat-gap">?</span>' : `<span>${x}</span>`).join("")}</div>`,
            say: [q, "vi-VN"], optClass: "pic-opts",
            options: shuffle([ans, ...wrong]).map((x) => ({ html: `<span class="emoji-opt">${x}</span>`, ok: x === ans }))
          };
        }
      });
    }
  });
})();
