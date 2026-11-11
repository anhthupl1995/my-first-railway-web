// Môn Toán: Đếm số, Cộng trừ, So sánh
(function () {
  const { register, rand, pick, quiz } = App;

  // ---------- Đếm số ----------
  const ITEMS = [["🍎", "quả táo"], ["🐟", "con cá"], ["⭐", "ngôi sao"], ["🎈", "quả bóng bay"], ["🐥", "chú gà con"],
    ["🌸", "bông hoa"], ["🚗", "chiếc ô tô"], ["🍓", "quả dâu"], ["🐞", "chú bọ rùa"], ["🦋", "con bướm"]];

  register({
    id: "dem-so", subject: "toan", name: "Đếm số", emoji: "🍎",
    desc: "Đếm hình và chọn số đúng", ages: [0, 1, 2, 3],
    mount(el, ctx) {
      const max = [3, 5, 10, 10][ctx.age], nOpt = [2, 3, 4, 4][ctx.age], min = ctx.age === 3 ? 4 : 1;
      quiz(el, {
        rounds: [6, 8, 10, 10][ctx.age], autoSay: true,
        make() {
          const n = rand(min, max), [em, name] = pick(ITEMS), rows = [];
          for (let k = 0; k < n; k += 5) rows.push(`<div class="count-row">${em.repeat(Math.min(5, n - k))}</div>`);
          return {
            prompt: `<p class="q-text">Có bao nhiêu ${name}?</p><div class="count-box${max > 5 ? " small" : ""}" role="img" aria-label="${n} ${name}">${rows.join("")}</div>`,
            say: [`Có bao nhiêu ${name}?`, "vi-VN"],
            options: App.numOptions(n, 1, max, nOpt).map((v) => ({ html: v, ok: v === n }))
          };
        }
      });
    }
  });

  // ---------- Cộng trừ (phiếu bài tập) ----------
  register({
    id: "cong-tru", subject: "toan", name: "Cộng trừ", emoji: "➕",
    desc: "Điền kết quả vào ô trống như phiếu bài tập", ages: [1, 2, 3],
    mount(el, ctx) {
      const MAX = [5, 5, 10, 20][ctx.age], COUNT = 10, wide = MAX > 9;
      let mode = "mix", problems = [];
      el.innerHTML = `
        <h2 class="game-title">Cộng trừ trong phạm vi ${MAX}</h2>
        <p class="hint">Điền số thích hợp vào ô trống</p>
        <div class="chips" role="group" aria-label="Loại phép tính">
          <button type="button" class="chip" data-mode="mix" aria-pressed="true">Cộng và trừ</button>
          <button type="button" class="chip" data-mode="add" aria-pressed="false">Chỉ cộng</button>
          <button type="button" class="chip" data-mode="sub" aria-pressed="false">Chỉ trừ</button>
        </div>
        <div class="sheet-grid${wide ? " wide" : ""}"></div>
        <p class="result" role="status"></p>
        <div class="actions">
          <button type="button" class="btn btn-main" data-check>Kiểm tra</button>
          <button type="button" class="btn btn-soft" data-new>Bài mới</button>
        </div>`;
      const grid = el.querySelector(".sheet-grid"), result = el.querySelector(".result");

      function make() {
        for (;;) {
          const op = mode === "mix" ? pick(["+", "-"]) : mode === "add" ? "+" : "-";
          const a = rand(0, MAX), b = op === "+" ? rand(0, MAX - a) : rand(0, a);
          if ((a === 0 || b === 0) && Math.random() < (MAX > 5 ? 0.9 : 0.75)) continue; // hạn chế phép tính với số 0
          return { a, b, op, ans: op === "+" ? a + b : a - b };
        }
      }
      function newSheet() {
        problems = []; const seen = new Set(); let guard = 0;
        while (problems.length < COUNT) {
          const p = make(), key = p.a + p.op + p.b;
          if (seen.has(key) && guard++ < 300) continue;
          seen.add(key); problems.push(p);
        }
        grid.innerHTML = problems.map((p, i) =>
          `<label class="eq" data-i="${i}"><span>${p.a} ${p.op === "-" ? "−" : "+"} ${p.b} =</span>` +
          `<input type="text" inputmode="numeric" autocomplete="off" maxlength="${wide ? 2 : 1}" class="${wide ? "w2" : ""}" data-i="${i}" aria-label="${p.a} ${p.op === "+" ? "cộng" : "trừ"} ${p.b} bằng">` +
          `<span class="mark" aria-hidden="true"></span></label>`).join("");
        result.textContent = "";
      }
      function check() {
        let right = 0;
        problems.forEach((p, i) => {
          const row = grid.querySelector(`.eq[data-i="${i}"]`), v = row.querySelector("input").value.trim();
          const ok = v !== "" && +v === p.ans;
          row.classList.toggle("ok", ok); row.classList.toggle("bad", !ok);
          row.querySelector(".mark").textContent = ok ? "✓" : "✗";
          if (ok) right++;
        });
        result.textContent = right === COUNT ? `Tuyệt vời! Bé làm đúng cả ${COUNT} bài 🎉` : `Bé làm đúng ${right}/${COUNT} bài. Sửa lại các ô màu đỏ nhé!`;
        App.sfx(right === COUNT);
      }

      grid.addEventListener("input", (e) => {
        const t = e.target; t.value = t.value.replace(/\D/g, "");
        const row = t.closest(".eq"); row.classList.remove("ok", "bad"); row.querySelector(".mark").textContent = "";
        if (!wide && t.value) { const next = grid.querySelector(`input[data-i="${+t.dataset.i + 1}"]`); if (next) next.focus(); }
      });
      grid.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
      el.querySelector("[data-check]").addEventListener("click", check);
      el.querySelector("[data-new]").addEventListener("click", newSheet);
      el.querySelector(".chips").addEventListener("click", (e) => {
        const b = e.target.closest("[data-mode]"); if (!b) return;
        mode = b.dataset.mode;
        el.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", x === b));
        newSheet();
      });
      newSheet();
    }
  });

  // ---------- So sánh ----------
  register({
    id: "so-sanh", subject: "toan", name: "So sánh số", emoji: "⚖️",
    desc: "Chọn dấu lớn hơn, bé hơn hoặc bằng", ages: [2, 3],
    mount(el, ctx) {
      const max = ctx.age === 2 ? 10 : 20, dots = ctx.age === 2;
      const side = (n) => `<div class="cmp-side"><b>${n}</b>${dots ? `<div class="dots" aria-hidden="true">${"<i></i>".repeat(n)}</div>` : ""}</div>`;
      quiz(el, {
        rounds: 10,
        make() {
          const a = rand(0, max), b = Math.random() < 0.2 ? a : rand(0, max);
          const ans = a > b ? ">" : a < b ? "<" : "=";
          return {
            prompt: `<p class="q-text">Chọn dấu đúng</p><div class="cmp">${side(a)}<div class="cmp-q" aria-hidden="true">?</div>${side(b)}</div>`,
            options: [">", "<", "="].map((s) => ({ html: s, ok: s === ans }))
          };
        }
      });
    }
  });
})();
