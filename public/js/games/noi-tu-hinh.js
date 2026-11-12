// Tiếng Việt – Nối từ với hình (4–5 tuổi)
// Mỗi lượt 6 trang, mỗi trang 6 từ / 6 hình. Bé kéo (tay hoặc chuột) từ một ô sang ô bên kia để nối,
// hoặc chạm một ô rồi chạm ô bên kia. "Chơi lại" = chơi lại đúng 6 trang đó; "Chơi tiếp" = tạo 6 trang mới.
(function () {
  const { register, shuffle, pick } = App;
  const PAGES = App.ROUNDS, PER = 6, KEY = "ntw-level";

  // "từ hình [nhóm]" – các từ cùng nhóm trông/nghe dễ lẫn nên không bao giờ nằm chung một trang.
  const list = (s) => s.split(";").map((x) => { const [w, pic, g] = x.trim().split(/\s+/); return { w, pic, g }; });
  const DIGRAPH = /^(ngh|ng|nh|ch|kh|ph|gh|th|tr|gi|qu)/;
  // Có phải nguyên âm không (bỏ dấu thanh, giữ ă â ê ô ơ ư)
  const isV = (c) => /[aăâeêioôơuưy]/.test(c.normalize("NFD").replace(/[̣̀́̃̉]/g, "").normalize("NFC"));
  // digraph: âm đầu là phụ âm ghép (tô đậm); cluster: vần có nguyên âm đôi/ba (tô xanh)
  const LEVELS = [
    { name: "Cấp 1", desc: "Phụ âm đơn + nguyên âm đơn (ba, bò, cá, mắt…)", items: list(`
      bà 👵; bố 👨; mẹ 👩 nu; cô 👩‍🏫 nu; bé 👶; ba 3; bò 🐄; bí 🎃; bơ 🥑; cá 🐟; cà 🍆; cỏ 🌿 la; lá 🍃 la;
      cờ 🚩; cú 🦉; dê 🐐; dế 🦗; đá 🪨; gà 🐔; gỗ 🪵; hổ 🐯; hề 🤡; lê 🍐; mũ 🧢; mì 🍜 to; tô 🥣 to; nơ 🎀;
      rổ 🧺; sò 🦪; vở 📒; vé 🎫; ví 👛; xe 🚗; xô 🪣; xu 🪙; lọ 🫙; đò 🛶; mắt 👁️; nấm 🍄; rắn 🐍; tất 🧦;
      cân ⚖️; pin 🔋; kem 🍦; kim 🪡; bút ✏️; dép 🩴; đèn 💡 den; nến 🕯️ den; tôm 🦐; cam 🍊; vịt 🦆`) },
    { name: "Cấp 2", desc: "Phụ âm ghép (ch, gh, gi, kh, ng, ngh, nh, ph, qu, th, tr) + nguyên âm đơn (chó, nho, thỏ…)", digraph: true, items: list(`
      chó 🐶; chim 🐦; chân 🦶; chanh 🍋; nho 🍇; nhà 🏠; nhím 🦔; nhện 🕷️; nhẫn 💍; nhạc 🎵; khỉ 🐵; khăn 🧣;
      phở 🍜; phim 🎬; ghế 🪑; ghim 📌; ghẹ 🦀; ngô 🌽; ngủ 😴; nghé 🐃; thỏ 🐰; thư ✉️; thịt 🍖; thông 🌲; tre 🎋;
      trà 🍵; trăng 🌙; trống 🥁; trứng 🥚; giỏ 🧺 gio; gió 🌬️ gio; quà 🎁; quần 👖`) },
    { name: "Cấp 3", desc: "Phụ âm đơn + nguyên âm đôi, nguyên âm ba (cua, mưa, bướm, diều…)", cluster: true, items: list(`
      cua 🦀; rùa 🐢; lúa 🌾; đũa 🥢; dứa 🍍; dưa 🍉; sữa 🥛; mưa 🌧️ may; mây ☁️ may; cửa 🚪; lửa 🔥; tai 👂;
      hai 2; sáu 6; bảy 7; cáo 🦊; sao ⭐; dao 🔪; mèo 🐱; kéo ✂️; kẹo 🍬; heo 🐷; voi 🐘; tỏi 🧄; muối 🧂;
      muỗi 🦟; túi 👜; núi ⛰️; mũi 👃; sâu 🐛; rau 🥬; dâu 🍓; râu 🧔; tàu 🚂; tay ✋; váy 👗; cây 🌳; rìu 🪓;
      lều ⛺; cừu 🐑; hươu 🦌; hoa 🌸; loa 📢; xoài 🥭; gấu 🐻; bướm 🦋; kiến 🐜; nước 💧; lưỡi 👅; cười 😄;
      tuyết ❄️; diều 🪁; xương 🦴; gương 🪞; tiền 💵; muỗng 🥄; biển 🌊; miệng 👄`) },
    { name: "Cấp 4", desc: "Phụ âm ghép + nguyên âm đôi, nguyên âm ba (thuyền, chuối, giường…)", digraph: true, cluster: true, items: list(`
      thuyền ⛵; thìa 🥄; ngựa 🐴; giường 🛏️; chuối 🍌; chổi 🧹; chuột 🐭; chuông 🔔; khoai 🍠; khoá 🔒; trâu 🐃;
      giày 👟; giấy 📄; trường 🏫; chai 🍾; thuốc 💊; phao 🛟; chảo 🍳; nghêu 🦪; thiệp 💌; chạy 🏃; người 🧍; khói 💨`) }
  ];
  App.WORD_LEVELS = LEVELS; // dùng chung với trò "Chọn hình đúng"
  // Tô màu từ theo cấp: <b>phụ âm ghép</b>, <em>nguyên âm đôi/ba</em>
  App.wordHtml = (L, w) => {
    const ch = Array.from(w), m = L.digraph && w.match(DIGRAPH);
    const k = m ? Array.from(m[0]).length : 0, head = m ? `<b>${m[0]}</b>` : "";
    if (!L.cluster) return head + ch.slice(k).join("");
    let i = k; while (i < ch.length && !isV(ch[i])) i++;
    let j = i; while (j < ch.length && isV(ch[j])) j++;
    return head + ch.slice(k, i).join("") + `<em>${ch.slice(i, j).join("")}</em>` + ch.slice(j).join("");
  };

  // 6 trang, mỗi trang 6 từ khác nhau; ưu tiên từ ít xuất hiện để cả lượt đa dạng nhất có thể.
  function makePages(pool) {
    const used = new Map();
    return Array.from({ length: PAGES }, () => {
      const page = [];
      for (const x of shuffle(pool).sort((a, b) => (used.get(a) || 0) - (used.get(b) || 0))) {
        if (page.length === PER) break;
        if (page.some((y) => y.pic === x.pic || (x.g && x.g === y.g))) continue;
        page.push(x);
      }
      page.forEach((x) => used.set(x, (used.get(x) || 0) + 1));
      return { words: page, order: App.derange(page.length) };
    });
  }

  const loadLevel = () => { try { const v = +localStorage.getItem(KEY); return LEVELS[v] ? v : 0; } catch (e) { return 0; } };
  const saveLevel = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };
  const PROMPT = "Bé đọc từ, rồi kéo nối với hình đúng nhé!";

  register({
    id: "noi-tu-hinh", subject: "tieng-viet", name: "Nối từ với hình", emoji: "🔗",
    desc: "Đọc từ rồi kéo nối với hình – 4 cấp độ, mỗi lượt 6 trang", ages: [2],
    mount(el) {
      let lvl = loadLevel(), pages, p, score, words, mistakes, lines, sel, drag, busy, ro;

      el.innerHTML = `
        <div class="chips" role="group" aria-label="Cấp độ">${LEVELS.map((L, i) =>
          `<button type="button" class="chip" data-lvl="${i}" aria-pressed="${i === lvl}">${L.name}</button>`).join("")}</div>
        <p class="ntw-desc"></p>
        <div class="ntw-play"></div>
        <div class="actions ntw-actions">
          <button type="button" class="btn btn-soft" data-replay>🔁 Chơi lại</button>
          <button type="button" class="btn btn-main" data-renew>▶️ Chơi tiếp</button>
        </div>`;
      const play = el.querySelector(".ntw-play"), actions = el.querySelector(".ntw-actions");

      const wordHtml = (w) => App.wordHtml(LEVELS[lvl], w);
      const picHtml = (pic) => /^\d+$/.test(pic) ? `<span class="ntw-num">${pic}</span>` : `<span class="mg-em">${pic}</span>`;

      function renew() { pages = makePages(LEVELS[lvl].items); replay(); }
      function replay() {
        p = 0; score = 0;
        el.querySelector(".ntw-desc").textContent = LEVELS[lvl].desc;
        page();
      }

      function page() {
        if (ro) ro.disconnect();
        if (p >= PAGES) {
          actions.hidden = true;
          return App.finish(play, {
            score, total: PAGES * PER, text: `Bé nối đúng ngay lần đầu <b>${score}/${PAGES * PER}</b> cặp.`,
            again: () => { actions.hidden = false; replay(); },
            renew: () => { actions.hidden = false; renew(); }
          });
        }
        actions.hidden = false;
        ({ words } = pages[p]);
        const right = Array(words.length); pages[p].order.forEach((row, i) => (right[row] = i));
        mistakes = words.map(() => 0); lines = []; sel = { l: null, r: null }; drag = null; busy = false;
        play.innerHTML = `
          <div class="quiz">
            <div class="progress"><span style="width:${(p / PAGES) * 100}%"></span></div>
            <div class="q-count">Trang ${p + 1}/${PAGES} · ${LEVELS[lvl].name}</div>
            <div class="q-prompt"><p class="q-text">${PROMPT}</p>${App.canSpeak ? '<button class="speak" type="button" data-say aria-label="Nghe hướng dẫn">🔊</button>' : ""}</div>
            <div class="mg-board ntw-board">
              <svg class="mg-lines" aria-hidden="true"></svg>
              <div class="mg-col mg-left">${words.map((x, i) =>
                `<button type="button" class="mg-item" data-side="l" data-i="${i}" aria-pressed="false"><span class="ntw-w">${wordHtml(x.w)}</span></button>`).join("")}</div>
              <div class="mg-col mg-right">${right.map((i, k) =>
                `<button type="button" class="mg-item" data-side="r" data-i="${i}" aria-pressed="false" aria-label="Hình ${k + 1}">${picHtml(words[i].pic)}</button>`).join("")}</div>
            </div>
            <p class="q-feedback" role="status"></p>
          </div>`;
        const board = play.querySelector(".ntw-board");
        ro = new ResizeObserver(() => drawLines()); ro.observe(board);
        bind(board);
      }

      const item = (side, i) => play.querySelector(`.ntw-board [data-side="${side}"][data-i="${i}"]`);
      // Điểm chấm tròn ở mép ô (phía hướng về cột kia), theo toạ độ của bảng
      function dot(it, br) {
        const r = it.getBoundingClientRect();
        return { x: (it.dataset.side === "l" ? r.right + 2 : r.left - 2) - br.left, y: r.top + r.height / 2 - br.top };
      }
      function drawLines(tmp) {
        const board = play.querySelector(".ntw-board"); if (!board) return;
        const svg = board.querySelector(".mg-lines"), br = board.getBoundingClientRect();
        svg.setAttribute("viewBox", `0 0 ${br.width} ${br.height}`);
        let html = lines.map((i) => { const a = dot(item("l", i), br), c = dot(item("r", i), br); return `<line x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}"/>`; }).join("");
        if (tmp) { const a = dot(tmp.it, br); html += `<line class="tmp" x1="${a.x}" y1="${a.y}" x2="${tmp.x - br.left}" y2="${tmp.y - br.top}"/>`; }
        svg.innerHTML = html;
      }

      function feedback(ok, text) { const fb = play.querySelector(".q-feedback"); fb.className = "q-feedback " + (ok ? "ok" : "bad"); fb.textContent = text; }
      function paintSel() { play.querySelectorAll(".ntw-board .mg-item").forEach((x) => x.setAttribute("aria-pressed", sel[x.dataset.side] === +x.dataset.i)); }

      // L = chỉ số từ bên trái, R = chỉ số cặp của hình bên phải; đúng khi L === R
      function tryPair(L, R) {
        sel = { l: null, r: null }; paintSel();
        const lb = item("l", L), rb = item("r", R);
        if (L === R) {
          lb.classList.add("done"); rb.classList.add("done"); lines.push(L); drawLines();
          if (!mistakes[L]) score++;
          feedback(true, App.pick(App.PRAISE)); App.sfx(true);
          setTimeout(() => App.speak(words[L].w, "vi-VN"), 200);
          if (lines.length === words.length) { busy = true; setTimeout(() => { p++; page(); }, 1500); }
        } else {
          mistakes[L]++;
          [lb, rb].forEach((x) => { x.classList.remove("shake"); void x.offsetWidth; x.classList.add("shake"); setTimeout(() => x.classList.remove("shake"), 600); });
          feedback(false, "Chưa đúng rồi, bé đọc lại và thử nhé!"); App.sfx(false);
        }
      }
      function tap(side, i) {
        sel[side] = sel[side] === i ? null : i;
        paintSel();
        if (sel.l !== null && sel.r !== null) tryPair(sel.l, sel.r);
      }
      const targetAt = (x, y) => { const t = document.elementFromPoint(x, y); return t && t.closest(".ntw-board .mg-item:not(.done)"); };

      function bind(board) {
        let hover = null;
        const setHover = (t) => { if (hover) hover.classList.remove("hover"); hover = t; if (t) t.classList.add("hover"); };
        board.addEventListener("pointerdown", (e) => {
          const it = e.target.closest(".mg-item");
          if (!it || it.classList.contains("done") || busy || drag) return;
          e.preventDefault();
          drag = { it, side: it.dataset.side, i: +it.dataset.i, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
          try { board.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          it.classList.add("grab");
        });
        board.addEventListener("pointermove", (e) => {
          if (!drag || e.pointerId !== drag.id) return;
          if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 10) return;
          drag.moved = true;
          drawLines({ it: drag.it, x: e.clientX, y: e.clientY });
          const t = targetAt(e.clientX, e.clientY);
          setHover(t && t.dataset.side !== drag.side ? t : null);
        });
        const end = (e, cancel) => {
          if (!drag || e.pointerId !== drag.id) return;
          const d = drag; drag = null;
          d.it.classList.remove("grab"); setHover(null); drawLines();
          if (cancel || busy) return;
          if (!d.moved) return tap(d.side, d.i);
          const t = targetAt(e.clientX, e.clientY);
          if (!t || t.dataset.side === d.side) return;
          sel = { l: null, r: null };
          d.side === "l" ? tryPair(d.i, +t.dataset.i) : tryPair(+t.dataset.i, d.i);
        };
        board.addEventListener("pointerup", (e) => end(e, false));
        board.addEventListener("pointercancel", (e) => end(e, true));
        // Bàn phím (Enter/Space) không sinh pointer event – xử lý như chạm
        board.addEventListener("click", (e) => {
          if (e.detail !== 0 || busy) return;
          const it = e.target.closest(".mg-item");
          if (it && !it.classList.contains("done")) tap(it.dataset.side, +it.dataset.i);
        });
      }

      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-say]")) return App.speak(PROMPT, "vi-VN");
        const c = e.target.closest("[data-lvl]");
        if (c) {
          lvl = +c.dataset.lvl; saveLevel(lvl);
          el.querySelectorAll("[data-lvl]").forEach((x) => x.setAttribute("aria-pressed", x === c));
          return renew();
        }
        if (e.target.closest("[data-replay]")) return replay();
        if (e.target.closest("[data-renew]")) return renew();
      });
      renew();
    }
  });
})();
