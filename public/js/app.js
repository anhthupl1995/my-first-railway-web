// Router and page views:
//   #/                       home
//   #/mon/:subject[/:topic]  interactive games
//   #/phieu[/:subject[/:id]] printable A4 worksheet library
(function () {
  const main = document.getElementById("app");
  const ageSel = document.getElementById("age");
  const soundBtn = document.getElementById("sound");
  const vars = (s) => `--c:${s.c};--t:${s.t};--d:${s.d}`;
  const SHEET_COLORS = { c: "#9B51E0", t: "#F3EAFD", d: "#6D28B8" };

  ageSel.innerHTML = App.AGES.map((a, i) => `<option value="${i}">${a.emoji} ${a.label}</option>`).join("");
  ageSel.addEventListener("change", () => { App.setAge(+ageSel.value); render(true); });

  const paintSound = () => { soundBtn.textContent = App.soundOn() ? "🔊" : "🔇"; soundBtn.setAttribute("aria-pressed", App.soundOn()); };
  soundBtn.addEventListener("click", () => { App.setSound(!App.soundOn()); paintSound(); });
  paintSound();

  document.getElementById("topnav").innerHTML = App.SUBJECTS.map((s) => `<a href="#/mon/${s.id}" data-nav="${s.id}">${s.emoji} ${s.name}</a>`).join("") +
    `<a href="#/phieu" data-nav="phieu">📄 Phiếu in</a>`;
  document.getElementById("tabbar").innerHTML = `<a href="#/" data-nav=""><span aria-hidden="true">🏠</span>Trang chủ</a>` +
    App.SUBJECTS.map((s) => `<a href="#/mon/${s.id}" data-nav="${s.id}"><span aria-hidden="true">${s.emoji}</span>${s.name}</a>`).join("") +
    `<a href="#/phieu" data-nav="phieu"><span aria-hidden="true">📄</span>Phiếu in</a>`;

  const topicCard = (t, s) => `
    <a class="topic-card" style="${vars(s)}" href="#/mon/${s.id}/${t.id}">
      <span class="topic-emoji" aria-hidden="true">${t.emoji}</span>
      <h3>${t.name}</h3><p>${t.desc}</p>
      <span class="age-badge">${App.ageRange(t)}</span>
    </a>`;
  const sheetCard = (sh) => {
    const s = App.SUBJECTS.find((x) => x.id === sh.subject);
    return `
    <a class="topic-card sheet-card" style="${vars(s)}" href="#/phieu/${s.id}/${sh.id}">
      <span class="sheet-thumb" aria-hidden="true"><span class="thumb-page"><span class="thumb-title">${sh.name}</span>${sh.thumb || ""}</span></span>
      <span class="sheet-meta"><span class="sheet-subject">${s.emoji} ${s.name}</span>
      <h3>${sh.name}</h3><p>${sh.desc}</p>
      <span class="age-badge">${App.ageRange(sh)}</span></span>
    </a>`;
  };

  function home() {
    const age = App.getAge();
    main.innerHTML = `
      <section class="hero">
        <div><h1>Chào bé! Hôm nay mình học gì nào?</h1><p>Chọn tuổi của bé, rồi chọn môn học để bắt đầu nhé.</p></div>
        <div class="hero-art" aria-hidden="true">🧒📚</div>
      </section>
      <h2 class="section-title">Bé mấy tuổi?</h2>
      <div class="ages" role="group" aria-label="Độ tuổi">${App.AGES.map((a, i) =>
        `<button type="button" class="age-card" data-age="${i}" aria-pressed="${i === age}"><span aria-hidden="true">${a.emoji}</span>${a.label}</button>`).join("")}</div>
      <h2 class="section-title">Chọn môn học</h2>
      <div class="cards">${App.SUBJECTS.map((s) => {
        const n = App.topicsOf(s.id).filter((t) => t.ages.includes(age)).length;
        return `<a class="subject-card" style="${vars(s)}" href="#/mon/${s.id}">
          <span class="subject-icon" aria-hidden="true">${s.emoji}</span>
          <div><h3>${s.name}</h3><p>${s.desc}</p><span class="pill">${n} trò chơi cho bé ${App.AGES[age].label}</span></div>
        </a>`;
      }).join("")}</div>`;
    main.querySelector(".ages").addEventListener("click", (e) => {
      const b = e.target.closest("[data-age]"); if (b) { App.setAge(+b.dataset.age); render(true); }
    });
  }

  function subject(s) {
    const age = App.getAge(), fit = App.topicsOf(s.id).filter((t) => t.ages.includes(age));
    const sheets = App.sheetsOf(s.id).filter((x) => x.ages.includes(age));
    main.innerHTML = `
      <a class="crumb" href="#/">← Trang chủ</a>
      <div class="page-head" style="${vars(s)}">
        <span class="subject-icon" aria-hidden="true">${s.emoji}</span>
        <div><h1>${s.name}</h1><p>Bài tập cho bé ${App.AGES[age].label}</p></div>
      </div>
      ${fit.length ? `<div class="cards">${fit.map((t) => topicCard(t, s)).join("")}</div>`
        : `<p class="empty-note">Chưa có bài ${s.name} cho bé ${App.AGES[age].label}. Bài mới sẽ sớm được bổ sung!</p>`}
      <h2 class="section-title">📄 Phiếu in ${s.name} cho bé ${App.AGES[age].label}</h2>
      ${sheets.length ? `<div class="cards">${sheets.map(sheetCard).join("")}</div>`
        : `<p class="empty-note">Chưa có phiếu in ${s.name} cho bé ${App.AGES[age].label}. Phiếu mới sẽ sớm được bổ sung!</p>`}`;
  }

  function play(s, t) {
    const age = App.getAge(), lvl = App.clampAge(t, age);
    main.innerHTML = `
      <a class="crumb" href="#/mon/${s.id}">← ${s.name}</a>
      <div class="play-head" style="${vars(s)}">
        <span class="topic-emoji" aria-hidden="true">${t.emoji}</span>
        <h1>${t.name}</h1>
        <span class="age-chip">${App.AGES[lvl].emoji} Mức ${App.AGES[lvl].label}</span>
      </div>
      ${lvl !== age ? `<p class="note">Bài này dành cho bé ${App.ageRange(t)}, nên đang dùng mức ${App.AGES[lvl].label}.</p>` : ""}
      <section class="stage" id="stage"></section>`;
    t.mount(document.getElementById("stage"), { age: lvl, subject: s, topic: t });
  }

  // ---------- Worksheet library ----------
  function library(s) {
    const age = App.getAge(), all = App.sheetsOf(s && s.id);
    const fit = all.filter((x) => x.ages.includes(age));
    main.innerHTML = `
      <a class="crumb" href="#/">← Trang chủ</a>
      <div class="page-head" style="${vars(SHEET_COLORS)}">
        <span class="subject-icon" aria-hidden="true">📄</span>
        <div><h1>Kho phiếu bài tập</h1><p>Phiếu in khổ A4 cho bé ${App.AGES[age].label}, chia theo môn. Mỗi phiếu ${App.SHEET_PAGES} trang – xem trước rồi bấm In hoặc Tải file PDF.</p></div>
      </div>
      <div class="chips chips-left" role="group" aria-label="Lọc theo môn">
        <a class="chip" href="#/phieu" aria-pressed="${!s}">Tất cả</a>
        ${App.SUBJECTS.map((x) => `<a class="chip" href="#/phieu/${x.id}" aria-pressed="${!!s && s.id === x.id}">${x.emoji} ${x.name}</a>`).join("")}
      </div>
      ${fit.length ? `<div class="cards">${fit.map(sheetCard).join("")}</div>`
        : `<p class="empty-note">Chưa có phiếu ${s ? s.name + " " : ""}cho bé ${App.AGES[age].label}. Phiếu mới sẽ sớm được bổ sung!</p>`}`;
  }

  function sheetView(s, sh) {
    const age = App.getAge(), lvl = App.clampAge(sh, age), opt = {}, optKey = "sheet-opt:" + sh.id;
    // Nhớ lựa chọn (cấp độ, kiểu chữ…) của từng phiếu
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(optKey)) || {}; } catch (e) { /* storage blocked */ }
    sh.options.forEach((o) => (opt[o.key] = o.choices.some(([v]) => v === saved[o.key]) ? saved[o.key] : o.def));
    const saveOpt = () => { try { localStorage.setItem(optKey, JSON.stringify(opt)); } catch (e) { /* ignore */ } };
    let data = sh.generate(lvl, opt), showAnswer = false;

    main.innerHTML = `
      <div class="no-print">
        <a class="crumb" href="#/phieu/${s.id}">← Kho phiếu ${s.name}</a>
        <div class="play-head" style="${vars(s)}">
          <span class="topic-emoji" aria-hidden="true">${sh.emoji}</span>
          <h1>${sh.name}</h1>
          <span class="age-chip">${App.AGES[lvl].emoji} Mức ${App.AGES[lvl].label}</span>
        </div>
        ${lvl !== age ? `<p class="note">Phiếu này dành cho bé ${App.ageRange(sh)}, nên đang dùng mức ${App.AGES[lvl].label}.</p>` : ""}
        <div class="sheet-tools">
          ${sh.options.map((o) => `<div class="tool-group"><span class="tool-label">${o.label}</span><div class="chips chips-left" role="group" aria-label="${o.label}">${o.choices.map(([v, l, tip]) =>
            `<button type="button" class="chip" data-opt="${o.key}" data-val="${v}" aria-pressed="${opt[o.key] === v}"${tip ? ` title="${App.esc(tip)}"` : ""}>${l}</button>`).join("")}</div></div>`).join("")}
          <p class="tool-hint" hidden></p>
          <div class="tool-actions">
            <button type="button" class="btn btn-soft" data-regen>🔀 Tạo phiếu khác</button>
            <button type="button" class="btn btn-soft" data-answer aria-pressed="false">👁️ Hiện đáp án</button>
            <button type="button" class="btn btn-soft" data-print>🖨️ In phiếu</button>
            <button type="button" class="btn btn-main" data-download>⬇️ Tải file PDF</button>
          </div>
          <p class="tool-status" role="status"></p>
        </div>
      </div>
      <div class="a4-pages" id="a4-pages" aria-label="Phiếu ${sh.name}"></div>`;
    const pagesEl = document.getElementById("a4-pages");
    const hint = main.querySelector(".tool-hint"), status = main.querySelector(".tool-status");

    function draw() {
      const r = sh.render(data, lvl, opt), n = r.pages.length;
      status.textContent = "";
      const lvlOpt = sh.options.find((o) => o.key === "level");
      const tip = lvlOpt && lvlOpt.choices.find(([v]) => v === opt.level);
      hint.hidden = !(tip && tip[2]);
      if (tip && tip[2]) hint.textContent = `${tip[1]}: ${tip[2]}`;
      pagesEl.innerHTML = r.pages.map((body, k) => `
        <div class="a4-wrap"><article class="a4${showAnswer ? " show-answer" : ""}" aria-label="Trang ${k + 1}/${n}">
          <header class="a4-head"><div class="a4-field">Họ và tên:<i></i></div><div class="a4-field short">Ngày:<i></i></div></header>
          <div class="a4-title" style="${vars(s)}">
            <span class="a4-tag">${s.emoji} ${s.name} · ${r.tag || App.AGES[lvl].label}</span>
            <h2>${r.title}</h2><p>${r.instruction}</p>
          </div>
          <div class="a4-body">${body}</div>
          <footer class="a4-foot"><span>🌈 Bé Vui Học · ${sh.name} · Trang ${k + 1}/${n}</span><span>Bé tự đánh giá: ☆ ☆ ☆</span></footer>
        </article></div>`).join("");
      fitSheets();
    }

    const dlBtn = main.querySelector("[data-download]");
    async function download() {
      dlBtn.disabled = true; dlBtn.textContent = "⏳ Đang tạo file…"; status.textContent = "";
      try {
        const lvlOpt = sh.options.find((o) => o.key === "level");
        const lvlName = lvlOpt ? "-cap-" + (+opt.level + 1) : "";
        await App.downloadPdf([...pagesEl.querySelectorAll(".a4")], `phieu-${sh.id}${lvlName}${showAnswer ? "-dap-an" : ""}.pdf`);
        status.textContent = "✅ Đã tải file về máy.";
      } catch (err) {
        status.textContent = "Không tạo được file. Bé kiểm tra kết nối mạng rồi thử lại nhé.";
      } finally {
        dlBtn.disabled = false; dlBtn.textContent = "⬇️ Tải file PDF";
      }
    }

    main.querySelector(".sheet-tools").addEventListener("click", (e) => {
      const chip = e.target.closest("[data-opt]");
      if (chip) {
        const o = sh.options.find((x) => x.key === chip.dataset.opt);
        opt[o.key] = chip.dataset.val; saveOpt();
        main.querySelectorAll(`[data-opt="${o.key}"]`).forEach((x) => x.setAttribute("aria-pressed", x === chip));
        if (!o.keep) data = sh.generate(lvl, opt); // "keep" options only change how it looks
        draw(); return;
      }
      if (e.target.closest("[data-regen]")) { data = sh.generate(lvl, opt); draw(); return; }
      const ans = e.target.closest("[data-answer]");
      if (ans) { showAnswer = !showAnswer; ans.setAttribute("aria-pressed", showAnswer); ans.textContent = showAnswer ? "🙈 Ẩn đáp án" : "👁️ Hiện đáp án"; draw(); return; }
      if (e.target.closest("[data-print]")) return window.print();
      if (e.target.closest("[data-download]")) return download();
    });
    draw();
  }

  // ---------- Tải phiếu về máy dưới dạng PDF (không qua hộp thoại in) ----------
  // Chụp từng trang A4 bằng html2canvas rồi ghép vào file PDF bằng jsPDF; thư viện chỉ tải khi cần.
  const LIBS = [
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
  ];
  let libsReady;
  const loadScript = (src) => new Promise((ok, fail) => {
    const el = document.createElement("script");
    el.src = src; el.onload = ok; el.onerror = () => { el.remove(); fail(new Error("load " + src)); };
    document.head.appendChild(el);
  });
  const loadLibs = () => (libsReady = libsReady || Promise.all(LIBS.map(loadScript)).catch((e) => { libsReady = null; throw e; }));

  App.downloadPdf = async (pages, filename) => {
    await loadLibs();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    for (let k = 0; k < pages.length; k++) {
      const canvas = await window.html2canvas(pages[k], {
        scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false,
        // Bản xem trước có thể đang thu nhỏ (transform) – bản chụp luôn ở kích thước thật
        onclone: (doc) => doc.querySelectorAll(".a4").forEach((p) => { p.style.transform = "none"; p.style.boxShadow = "none"; })
      });
      if (k) pdf.addPage("a4", "portrait");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297);
    }
    pdf.save(filename);
  };

  // Scale A4 previews down to fit narrow screens (print always uses real size).
  function fitSheets() {
    document.querySelectorAll(".a4-wrap").forEach((w) => {
      const p = w.firstElementChild, s = Math.min(1, w.clientWidth / p.offsetWidth);
      p.style.transform = s < 1 ? `scale(${s})` : "";
      w.style.height = p.offsetHeight * s + "px";
    });
  }
  window.addEventListener("resize", fitSheets);

  function render(keepScroll) {
    const y = window.scrollY, h = location.hash;
    App.stopSpeak();
    ageSel.value = App.getAge();
    let active = "", title = "";
    const pm = h.match(/^#\/phieu(?:\/([^/]+))?(?:\/([^/]+))?/);
    if (pm) {
      const s = App.SUBJECTS.find((x) => x.id === pm[1]);
      const sh = s && pm[2] && App.sheets.find((x) => x.id === pm[2] && x.subject === s.id);
      if (sh) { sheetView(s, sh); title = sh.name + " · Phiếu in"; } else { library(s); title = "Kho phiếu bài tập"; }
      active = "phieu";
    } else {
      const m = h.match(/^#\/mon\/([^/]+)(?:\/([^/]+))?/) || [];
      const s = App.SUBJECTS.find((x) => x.id === m[1]);
      const t = s && m[2] && App.topics.find((x) => x.id === m[2] && x.subject === s.id);
      if (t) play(s, t); else if (s) subject(s); else home();
      title = t ? t.name : s ? s.name : "";
      active = s ? s.id : "";
    }
    document.title = (title ? title + " · " : "") + "Bé Vui Học";
    document.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.dataset.nav === active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, keepScroll ? y : 0);
  }

  // Đếm lượt truy cập: mỗi phiên trình duyệt (tab) chỉ tính 1 lượt; các lần tải lại chỉ đọc số.
  (function visitCounter() {
    let counted = false;
    try { counted = sessionStorage.getItem("visited") === "1"; } catch (e) { /* storage blocked */ }
    fetch("/api/visits", { method: counted ? "GET" : "POST" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        try { sessionStorage.setItem("visited", "1"); } catch (e) { /* ignore */ }
        document.getElementById("visits-n").textContent = Number(d.total).toLocaleString("vi-VN");
        document.getElementById("visits").hidden = false;
      })
      .catch(() => { /* không có server (mở file trực tiếp) – ẩn bộ đếm */ });
  })();

  window.addEventListener("hashchange", () => render(false));
  render(false);
})();
