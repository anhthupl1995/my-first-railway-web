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
        autoSay: true,
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

  // ---------- Tìm cái to nhất / nhỏ nhất (2–4 tuổi) ----------
  // [hình, tên, độ to ngoài đời 1–6]. Mỗi câu lấy 3 thứ CÙNG nhóm, độ to khác hẳn nhau, và vẽ to/nhỏ
  // đúng theo thứ tự đó – nên hình nhìn thấy và hiểu biết thực tế luôn cho cùng một đáp án.
  const SIZE_GROUPS = [
    { who: "Con nào", items: [["🐜", "con kiến", 1], ["🐝", "con ong", 1], ["🐭", "con chuột", 2], ["🐥", "gà con", 2],
      ["🐱", "con mèo", 3], ["🐶", "con chó", 3], ["🐐", "con dê", 4], ["🐷", "con lợn", 4], ["🐄", "con bò", 5],
      ["🐘", "con voi", 6], ["🦒", "hươu cao cổ", 6]] },
    { who: "Quả nào", items: [["🍒", "quả anh đào", 1], ["🍓", "quả dâu", 1], ["🍋", "quả chanh", 2], ["🍎", "quả táo", 3],
      ["🍊", "quả cam", 3], ["🍐", "quả lê", 3], ["🥭", "quả xoài", 4], ["🍍", "quả dứa", 5], ["🍈", "quả dưa lưới", 5],
      ["🍉", "quả dưa hấu", 6]] },
    { who: "Rau củ nào", items: [["🌶️", "quả ớt", 1], ["🧄", "củ tỏi", 2], ["🥕", "củ cà rốt", 3], ["🍅", "quả cà chua", 3],
      ["🥔", "củ khoai tây", 3], ["🌽", "bắp ngô", 4], ["🍆", "quả cà tím", 4], ["🥦", "bông cải xanh", 4], ["🥬", "cây cải", 5]] }
  ];
  const SIZE_PX = [44, 74, 112]; // nhỏ – vừa – to

  // Hai bài riêng (không trộn "to nhất" với "nhỏ nhất" trong một lượt để bé không bị rối)
  const sizeTopic = (id, name, emoji, big) => register({
    id, subject: "toan", name, emoji, ages: [0, 1],
    desc: `Chọn con vật, trái cây, rau củ ${big ? "to nhất" : "nhỏ nhất"}`,
    mount(el) {
      quiz(el, {
        autoSay: true,
        make() {
          const g = pick(SIZE_GROUPS);
          // 3 thứ có độ to khác nhau từng đôi một
          let three;
          do { three = App.sample(g.items, 3); } while (new Set(three.map((x) => x[2])).size < 3);
          const order = three.slice().sort((a, b) => a[2] - b[2]); // nhỏ → to
          const ans = big ? order[2] : order[0], word = big ? "to nhất" : "nhỏ nhất";
          const q = `${g.who} ${word}?`;
          return {
            prompt: `<p class="q-text">${g.who} <b>${word}</b>?</p>`,
            say: [q, "vi-VN"], after: [ans[1], "vi-VN"], optClass: "pic-opts size-opts",
            options: App.shuffle(three).map((x) => ({
              html: `<span class="size-em" style="font-size:${SIZE_PX[order.indexOf(x)]}px">${x[0]}</span><span class="opt-name">${x[1]}</span>`,
              ok: x === ans
            }))
          };
        }
      });
    }
  });
  sizeTopic("to-nhat", "Tìm cái to nhất", "🐘", true);
  sizeTopic("nho-nhat", "Tìm cái nhỏ nhất", "🐭", false);

  // ---------- Cộng trừ (phiếu bài tập) ----------
  register({
    id: "cong-tru", subject: "toan", name: "Cộng trừ", emoji: "➕",
    desc: "Điền kết quả vào ô trống như phiếu bài tập", ages: [3],
    mount(el, ctx) {
      const MAX = [5, 5, 10, 20][ctx.age], COUNT = App.ROUNDS, wide = MAX > 9;
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
          <button type="button" class="btn btn-soft" data-replay>🔁 Chơi lại</button>
          <button type="button" class="btn btn-soft" data-new>▶️ Chơi tiếp</button>
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
        drawSheet();
      }
      function drawSheet() {
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
      el.querySelector("[data-replay]").addEventListener("click", drawSheet);
      el.querySelector(".chips").addEventListener("click", (e) => {
        const b = e.target.closest("[data-mode]"); if (!b) return;
        mode = b.dataset.mode;
        el.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", x === b));
        newSheet();
      });
      newSheet();
    }
  });

  // ---------- Cộng / trừ trong phạm vi 5, 10 (4–5 tuổi) ----------
  // Mỗi câu một phép tính, chọn 1 trong 3 đáp án. 6 câu trong lượt không trùng nhau.
  // Phạm vi 10 chỉ lấy phép tính có số lớn hơn 5 (phần dễ hơn đã có ở bài phạm vi 5).
  function opPairs(op, max) {
    const out = [];
    for (let a = 1; a <= max; a++) for (let b = 1; b <= max; b++) {
      if (op === "+" ? a + b > max : b > a) continue;
      if (max > 5 && (op === "+" ? a + b : a) <= 5) continue;
      out.push([a, b]);
    }
    return out;
  }
  const opTopic = (id, name, emoji, op, max) => register({
    id, subject: "toan", name, emoji, ages: [2],
    desc: `Tính ${op === "+" ? "cộng" : "trừ"} trong phạm vi ${max}, chọn đáp án đúng`,
    mount(el) {
      const pairs = opPairs(op, max), word = op === "+" ? "cộng" : "trừ";
      let deck = [];
      quiz(el, {
        autoSay: true,
        make(i) {
          if (i === 0) deck = App.shuffle(pairs);
          const [a, b] = deck[i % deck.length], ans = op === "+" ? a + b : a - b;
          return {
            prompt: `<div class="calc" aria-label="${a} ${word} ${b} bằng mấy">${a} ${op === "+" ? "+" : "−"} ${b} = <span class="calc-q">?</span></div>`,
            say: [`${a} ${word} ${b} bằng mấy?`, "vi-VN"], after: [`${a} ${word} ${b} bằng ${ans}`, "vi-VN"],
            options: App.numOptions(ans, 0, max, 3).map((v) => ({ html: v, ok: v === ans }))
          };
        }
      });
    }
  });
  opTopic("cong-5", "Cộng trong phạm vi 5", "➕", "+", 5);
  opTopic("cong-10", "Cộng trong phạm vi 10", "➕", "+", 10);
  opTopic("tru-5", "Trừ trong phạm vi 5", "➖", "-", 5);
  opTopic("tru-10", "Trừ trong phạm vi 10", "➖", "-", 10);

  // ---------- So sánh ----------
  register({
    id: "so-sanh", subject: "toan", name: "So sánh số", emoji: "⚖️",
    desc: "Chọn dấu lớn hơn, bé hơn hoặc bằng", ages: [2, 3],
    mount(el, ctx) {
      const max = ctx.age === 2 ? 10 : 20, dots = ctx.age === 2;
      const side = (n) => `<div class="cmp-side"><b>${n}</b>${dots ? `<div class="dots" aria-hidden="true">${"<i></i>".repeat(n)}</div>` : ""}</div>`;
      quiz(el, {
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
