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

  // ---------- Điền số thích hợp (dãy số liên tiếp, 4–6 tuổi) ----------
  // Mỗi lượt 3 câu, mỗi câu 1 dãy 6 thẻ số đếm tiến hoặc đếm lùi, có 2 thẻ "?" để bé điền.
  // Ô trống không bao giờ là thẻ đầu và không đứng cạnh nhau, nên luôn còn 2 số liền nhau để bé biết dãy tăng hay giảm.
  register({
    id: "dien-so", subject: "toan", name: "Điền số thích hợp", emoji: "🔢",
    desc: "Điền số còn thiếu vào dãy số đếm tiến, đếm lùi", ages: [2, 3],
    mount(el, ctx) {
      const LEN = 6, COUNT = 3, BLANKS = [[1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 5]];
      let max = ctx.age === 3 ? 20 : 10;

      function newSet() {
        // Phạm vi 20 chỉ lấy dãy có số lớn hơn 10 (phần nhỏ hơn đã có ở phạm vi 10)
        const lo = max === 20 ? 12 - LEN : 0, starts = [];
        for (let s = lo; s + LEN - 1 <= max; s++) starts.push(s);
        const dirs = App.shuffle([1, -1, pick([1, -1])]); // luôn có cả dãy đếm tiến và đếm lùi
        play(App.sample(starts, COUNT).map((s, k) => {
          const nums = Array.from({ length: LEN }, (_, j) => s + j);
          return { nums: dirs[k] < 0 ? nums.reverse() : nums, blanks: pick(BLANKS) };
        }));
      }
      function play(set) {
        let b = 0, score = 0, firstTry;
        function show() {
          if (b >= COUNT) return App.finish(el, { score, total: COUNT, text: `Bé điền đúng ngay lần đầu <b>${score}/${COUNT}</b> dãy số.`,
            again: () => play(set), renew: newSet });
          const r = set[b]; firstTry = true;
          el.innerHTML = `
            <div class="quiz">
              <div class="progress"><span style="width:${(b / COUNT) * 100}%"></span></div>
              <div class="q-count">Câu ${b + 1}/${COUNT}</div>
              <div class="chips" role="group" aria-label="Phạm vi số">
                <button type="button" class="chip" data-max="10" aria-pressed="${max === 10}">Phạm vi 10</button>
                <button type="button" class="chip" data-max="20" aria-pressed="${max === 20}">Phạm vi 20</button>
              </div>
              <p class="q-text">Điền số còn thiếu vào thẻ có dấu ?</p>
              <div class="seq-list"><div class="seq" role="group" aria-label="Dãy số">${r.nums.map((n, j) => r.blanks.includes(j)
                ? `<label class="seq-card seq-slot"><input type="text" class="seq-in" inputmode="numeric" autocomplete="off" maxlength="2" placeholder=" " data-j="${j}" aria-label="Số thứ ${j + 1}"><span aria-hidden="true">?</span></label>`
                : `<span class="seq-card">${n}</span>`).join("")}</div></div>
              <p class="result" role="status"></p>
              <div class="actions"><button type="button" class="btn btn-main" data-check>Kiểm tra</button></div>
            </div>`;
          const list = el.querySelector(".seq-list"), result = el.querySelector(".result"), ins = [...list.querySelectorAll(".seq-in")];
          function check() {
            let ok = true;
            ins.forEach((inp) => {
              const good = inp.value !== "" && +inp.value === r.nums[+inp.dataset.j];
              inp.classList.toggle("ok", good); inp.classList.toggle("bad", !good);
              if (!good) ok = false;
            });
            App.sfx(ok);
            if (!ok) { firstTry = false; result.className = "result bad"; result.textContent = "Chưa đúng rồi, bé sửa lại ô màu đỏ nhé!"; return; }
            if (firstTry) score++;
            result.className = "result ok"; result.textContent = App.pick(App.PRAISE);
            el.querySelector("[data-check]").disabled = true;
            setTimeout(() => { b++; show(); }, 1300);
          }
          list.addEventListener("input", (e) => {
            const t = e.target; t.value = t.value.replace(/\D/g, ""); t.classList.remove("ok", "bad");
            if (t.value.length >= 2) { const next = ins[ins.indexOf(t) + 1]; if (next) next.focus(); }
          });
          list.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
          el.querySelector("[data-check]").addEventListener("click", check);
          el.querySelector(".chips").addEventListener("click", (e) => {
            const c = e.target.closest("[data-max]"); if (!c || +c.dataset.max === max) return;
            max = +c.dataset.max; newSet(); // đổi phạm vi thì bắt đầu lượt mới
          });
          ins[0].focus({ preventScroll: true });
        }
        show();
      }
      newSet();
    }
  });

  // ---------- Thêm bánh lên đĩa (4–6 tuổi) ----------
  // Đĩa có sẵn k cái bánh, bé chọn nhóm bánh cần thêm để đĩa có đủ N cái. Sau 7 giây chưa chọn đúng thì có bàn tay gợi ý.
  const TREATS = [["🍪", "cái bánh quy"], ["🍩", "cái bánh rán"], ["🧁", "cái bánh kem"], ["🥐", "cái bánh sừng bò"], ["🍓", "quả dâu"], ["🍊", "quả quýt"]];
  register({
    id: "them-banh", subject: "toan", name: "Thêm bánh lên đĩa", emoji: "🍪",
    desc: "Chọn số bánh cần thêm để đĩa có đủ số bánh", ages: [2, 3],
    mount(el, ctx) {
      const nOpt = ctx.age === 3 ? 3 : 2, maxAdd = ctx.age === 3 ? 5 : 4, LETTERS = "ABC";
      let seen;
      quiz(el, {
        autoSay: true, hint: 7000,
        make(i) {
          if (i === 0) seen = new Set();
          let k, n, guard = 0;
          do { n = rand(4, 10); k = rand(Math.max(1, n - maxAdd), n - 1); } while (seen.has(k + "/" + n) && guard++ < 100);
          seen.add(k + "/" + n);
          const [em, name] = pick(TREATS), add = n - k;
          const vals = App.shuffle(App.numOptions(add, 1, maxAdd, nOpt));
          return {
            prompt: `<p class="q-text">Cho thêm vào đĩa để trên đĩa có <b>${n}</b> ${name}</p>` +
              `<div class="plate" role="img" aria-label="Trên đĩa có ${k} ${name}">${`<span>${em}</span>`.repeat(k)}</div>`,
            say: [`Cho thêm vào đĩa để trên đĩa có ${n} ${name}`, "vi-VN"],
            after: [`${k} thêm ${add} là ${n}`, "vi-VN"], optClass: "pic-opts treat-opts",
            options: vals.map((v, j) => ({
              html: `<span class="opt-letter">${LETTERS[j]}.</span><span class="treat-grp" aria-label="${v} ${name}">${em.repeat(v)}</span>`,
              ok: v === add
            }))
          };
        }
      });
    }
  });

  // ---------- Đếm và điền số (4–6 tuổi) ----------
  // Mỗi lượt 3 bức tranh. Bé đếm từng loại trong tranh rồi điền số. Tranh được xếp ngẫu nhiên theo vùng (trời / đất / nước).
  // Bé 5–6 tuổi đôi khi gặp một loại KHÔNG có trong tranh (đáp án 0), như chú chim trong sách.
  const SCENES = [
    { bg: "pond", zones: { sky: [0, 2, 100, 28], land: [0, 30, 100, 58], water: [4, 60, 96, 97] },
      items: [["☀️", "ông mặt trời", "sky", 1], ["☁️", "đám mây", "sky"], ["🌳", "cái cây", "land"], ["🐰", "chú thỏ", "land"], ["🦆", "con vịt", "water"]],
      absent: [["🐦", "con chim"], ["🐸", "con ếch"]] },
    { bg: "garden", zones: { sky: [0, 2, 100, 40], land: [0, 44, 100, 97] },
      items: [["🦋", "con bướm", "sky"], ["🐝", "con ong", "sky"], ["🌻", "bông hoa", "land"], ["🍄", "cây nấm", "land"], ["🐌", "con ốc sên", "land"]],
      absent: [["🐞", "con bọ rùa"], ["🐛", "con sâu"]] },
    { bg: "sea", zones: { sky: [0, 2, 100, 26], land: [0, 80, 100, 98], water: [0, 30, 100, 78] },
      items: [["☁️", "đám mây", "sky"], ["🐟", "con cá", "water"], ["🐙", "con bạch tuộc", "water"], ["🦀", "con cua", "land"], ["🐚", "vỏ ốc", "land"]],
      absent: [["🐢", "con rùa"], ["🐬", "cá heo"]] },
    { bg: "night", zones: { sky: [0, 2, 100, 50], land: [0, 56, 100, 97] },
      items: [["🌙", "mặt trăng", "sky", 1], ["⭐", "ngôi sao", "sky"], ["🏠", "ngôi nhà", "land"], ["🌲", "cây thông", "land"], ["🦉", "con cú", "land"]],
      absent: [["🐱", "con mèo"], ["☀️", "ông mặt trời"]] },
    { bg: "farm", zones: { sky: [0, 2, 100, 28], land: [0, 32, 100, 97] },
      items: [["☁️", "đám mây", "sky"], ["🐔", "con gà", "land"], ["🐄", "con bò", "land"], ["🐷", "con lợn", "land"], ["🌾", "bó lúa", "land"]],
      absent: [["🐶", "con chó"], ["🐴", "con ngựa"]] }
  ];
  register({
    id: "dem-dien", subject: "toan", name: "Đếm và điền số", emoji: "🦆",
    desc: "Đếm từng loại trong tranh rồi điền số", ages: [2, 3],
    mount(el, ctx) {
      const COUNT = 3, nAsk = ctx.age === 3 ? 5 : 4, maxN = ctx.age === 3 ? 10 : 7;
      const CELL_W = 10, CELL_H = 11; // ô lưới theo % khung tranh, mỗi ô tối đa 1 hình

      function cellsOf([x1, y1, x2, y2]) {
        const cols = Math.floor((x2 - x1) / CELL_W), rows = Math.floor((y2 - y1) / CELL_H), out = [];
        const dx = (x2 - x1) / cols, dy = (y2 - y1) / rows;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([x1 + dx * (c + 0.5), y1 + dy * (r + 0.5), dx, dy]);
        return out;
      }
      function makeScene(sc) {
        const free = {}; for (const z in sc.zones) free[z] = App.shuffle(cellsOf(sc.zones[z]));
        // chọn các loại: luôn giữ loại có số cố định (mặt trời, mặt trăng) nếu có, còn lại ngẫu nhiên
        const asks = App.sample(sc.items, nAsk).map(([em, name, zone, fixed]) => ({ em, name, zone, n: fixed || rand(1, maxN) }));
        // không để vùng nào chật quá: giảm dần số lượng cho vừa số ô
        for (const z in free) {
          const inZone = asks.filter((a) => a.zone === z && a.n > 1);
          while (inZone.length && asks.filter((a) => a.zone === z).reduce((s, a) => s + a.n, 0) > free[z].length) {
            const big = inZone.reduce((m, a) => (a.n > m.n ? a : m)); big.n--;
          }
        }
        const pics = [];
        asks.forEach((a) => { for (let k = 0; k < a.n; k++) {
          const [x, y, dx, dy] = free[a.zone].pop();
          pics.push({ em: a.em, x: x + (Math.random() - 0.5) * dx * 0.35, y: y + (Math.random() - 0.5) * dy * 0.3 });
        } });
        if (ctx.age === 3 && Math.random() < 0.4) { const [em, name] = pick(sc.absent); asks[rand(1, asks.length - 1)] = { em, name, n: 0 }; }
        return { bg: sc.bg, pics, asks };
      }
      function newSet() {
        const order = App.sample(SCENES, COUNT);
        play(order.map(makeScene));
      }
      function play(set) {
        let b = 0, score = 0, firstTry;
        function show() {
          if (b >= COUNT) return App.finish(el, { score, total: COUNT, text: `Bé đếm đúng ngay lần đầu <b>${score}/${COUNT}</b> bức tranh.`,
            again: () => play(set), renew: newSet });
          const s = set[b]; firstTry = true;
          el.innerHTML = `
            <div class="quiz">
              <div class="progress"><span style="width:${(b / COUNT) * 100}%"></span></div>
              <div class="q-count">Bài ${b + 1}/${COUNT}</div>
              <p class="q-text">Đếm và điền số thích hợp vào ô trống</p>
              <div class="cnt-scene cnt-${s.bg}" role="img" aria-label="Bức tranh để đếm">
                ${s.pics.map((p) => `<span style="left:${p.x.toFixed(1)}%;top:${p.y.toFixed(1)}%">${p.em}</span>`).join("")}
              </div>
              <div class="cnt-asks">${s.asks.map((a, i) =>
                `<label class="cnt-ask" data-i="${i}"><input type="text" inputmode="numeric" autocomplete="off" maxlength="2" aria-label="Có bao nhiêu ${a.name}">` +
                `<span class="cnt-em" aria-hidden="true">${a.em}</span></label>`).join("")}</div>
              <p class="result" role="status"></p>
              <div class="actions"><button type="button" class="btn btn-main" data-check>Kiểm tra</button></div>
            </div>`;
          const asks = el.querySelector(".cnt-asks"), result = el.querySelector(".result");
          function check() {
            let right = 0;
            s.asks.forEach((a, i) => {
              const row = asks.querySelector(`[data-i="${i}"]`), v = row.querySelector("input").value.trim(), ok = v !== "" && +v === a.n;
              row.classList.toggle("ok", ok); row.classList.toggle("bad", !ok); if (ok) right++;
            });
            const all = right === s.asks.length;
            App.sfx(all);
            if (!all) { firstTry = false; result.className = "result bad"; result.textContent = "Bé đếm lại các ô màu đỏ nhé!"; return; }
            if (firstTry) score++;
            result.className = "result ok"; result.textContent = App.pick(App.PRAISE);
            el.querySelector("[data-check]").disabled = true;
            setTimeout(() => { b++; show(); }, 1300);
          }
          asks.addEventListener("input", (e) => {
            const t = e.target; t.value = t.value.replace(/\D/g, ""); t.closest(".cnt-ask").classList.remove("ok", "bad");
          });
          asks.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
          el.querySelector("[data-check]").addEventListener("click", check);
        }
        show();
      }
      newSet();
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
