// Tiếng Việt – Chọn hình đúng (4–6 tuổi)
// Mỗi câu hiện một từ (vd: "ba"), bé chọn 1 trong 3 hình đúng với từ đó. Mỗi lượt 10 câu, 3 cấp độ
// dùng chung bộ từ với trò "Nối từ với hình" (App.WORD_LEVELS).
(function () {
  const { register, shuffle } = App;
  const ROUNDS = 10, NOPT = 3, KEY = "cht-level";
  const LEVELS = App.WORD_LEVELS;

  const loadLevel = () => { try { const v = +localStorage.getItem(KEY); return LEVELS[v] ? v : 0; } catch (e) { return 0; } };
  const saveLevel = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };
  const picHtml = (pic) => /^\d+$/.test(pic) ? `<span class="cht-num">${pic}</span>` : `<span class="emoji-opt">${pic}</span>`;

  register({
    id: "chon-hinh", subject: "tieng-viet", name: "Chọn hình đúng", emoji: "🖼️",
    desc: "Đọc từ rồi chọn hình đúng – 3 cấp độ, mỗi lượt 10 câu", ages: [2, 3],
    mount(el) {
      let lvl = loadLevel(), deck = [];
      el.innerHTML = `
        <div class="chips" role="group" aria-label="Cấp độ">${LEVELS.map((L, i) =>
          `<button type="button" class="chip" data-lvl="${i}" aria-pressed="${i === lvl}">${L.name}</button>`).join("")}</div>
        <p class="ntw-desc"></p>
        <div class="cht-play"></div>`;
      const play = el.querySelector(".cht-play");

      const wordHtml = (w) => {
        const m = LEVELS[lvl].digraph && w.match(LEVELS[lvl].digraph);
        return m ? `<b>${m[0]}</b>${w.slice(m[0].length)}` : w;
      };

      // 2 hình sai: khác hình đáp án, không cùng nhóm dễ lẫn (mưa/mây, ngủ/giường…), không trùng nhau
      function wrongPics(x) {
        const out = [];
        for (const y of shuffle(LEVELS[lvl].items)) {
          if (out.length === NOPT - 1) break;
          if (y.pic === x.pic || (x.g && x.g === y.g) || out.some((z) => z.pic === y.pic)) continue;
          out.push(y);
        }
        return out;
      }

      function start() {
        el.querySelector(".ntw-desc").textContent = LEVELS[lvl].desc;
        App.quiz(play, {
          rounds: ROUNDS,
          make(i) {
            if (i === 0) deck = shuffle(LEVELS[lvl].items); // 10 từ khác nhau mỗi lượt; "Chơi lại" ra bộ mới
            const x = deck[i % deck.length];
            return {
              prompt: `<p class="q-text">Bé đọc từ rồi chọn hình đúng nhé!</p><div class="cht-word">${wordHtml(x.w)}</div>`,
              say: [x.w, "vi-VN"], after: [x.w, "vi-VN"], optClass: "pic-opts cht-opts",
              options: shuffle([{ ...x, ok: true }, ...wrongPics(x).map((y) => ({ ...y, ok: false }))])
                .map((o, k) => ({ html: `<span class="sr-only">Hình ${k + 1}</span>${picHtml(o.pic)}`, ok: o.ok }))
            };
          }
        });
      }

      el.addEventListener("click", (e) => {
        const c = e.target.closest("[data-lvl]");
        if (!c) return;
        lvl = +c.dataset.lvl; saveLevel(lvl);
        el.querySelectorAll("[data-lvl]").forEach((x) => x.setAttribute("aria-pressed", x === c));
        start();
      });
      start();
    }
  });
})();
