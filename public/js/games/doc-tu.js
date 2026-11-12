// Tiếng Việt – Bé tập đọc (4–6 tuổi)
// Màn hình hiện một từ, bé bấm 🎤 rồi đọc to; trình duyệt nhận giọng nói (Web Speech API, vi-VN)
// và so với từ cần đọc. 4 cấp độ dùng chung bộ từ với "Nối từ với hình" (App.WORD_LEVELS), mỗi lượt 6 từ.
// Trình duyệt không hỗ trợ nhận giọng nói (vd. Firefox) → bố mẹ nghe và bấm Đúng / Chưa đúng.
(function () {
  const { register, shuffle } = App;
  const ROUNDS = App.ROUNDS, KEY = "doc-level", SKIP_AFTER = 2;
  const LEVELS = App.WORD_LEVELS;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  // Máy hay trả về chữ số thay vì chữ (ba → "3")
  const NUM = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"];
  const norm = (s) => s.normalize("NFC").toLowerCase().replace(/\d+/g, (d) => NUM[+d] || d).replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean);
  // Đúng khi một trong các kết quả máy nghe được có chứa đúng từ đó (bé có thể nói "con cá")
  const heard = (alts, w) => alts.some((a) => norm(a).includes(w.normalize("NFC")));

  const loadLevel = () => { try { const v = +localStorage.getItem(KEY); return LEVELS[v] ? v : 0; } catch (e) { return 0; } };
  const saveLevel = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };

  register({
    id: "doc-tu", subject: "tieng-viet", name: "Bé tập đọc", emoji: "🎤",
    desc: "Nhìn từ, bé đọc to – máy nghe và chấm đúng sai. 4 cấp độ, mỗi lượt 6 từ", ages: [2, 3],
    mount(el) {
      let lvl = loadLevel(), words, i, score, tries, rec = null, listening = false, locked = false;
      el.innerHTML = `
        <div class="chips" role="group" aria-label="Cấp độ">${LEVELS.map((L, k) =>
          `<button type="button" class="chip" data-lvl="${k}" aria-pressed="${k === lvl}">${L.name}</button>`).join("")}</div>
        <p class="ntw-desc"></p>
        <div class="doc-play"></div>`;
      const play = el.querySelector(".doc-play");

      function stopRec() { listening = false; if (rec) { try { rec.abort(); } catch (e) { /* ignore */ } rec = null; } }
      function renew() { words = shuffle(LEVELS[lvl].items).slice(0, ROUNDS); replay(); }
      function replay() { el.querySelector(".ntw-desc").textContent = LEVELS[lvl].desc; i = 0; score = 0; show(); }

      function show() {
        stopRec();
        if (i >= words.length) return App.finish(play, {
          score, total: words.length, text: `Bé đọc đúng ngay lần đầu <b>${score}/${words.length}</b> từ.`, again: replay, renew
        });
        const x = words[i]; tries = 0; locked = false;
        play.innerHTML = `
          <div class="quiz">
            <div class="progress"><span style="width:${(i / words.length) * 100}%"></span></div>
            <div class="q-count">Từ ${i + 1}/${words.length} · ${LEVELS[lvl].name}</div>
            <div class="q-prompt">
              <p class="q-text">${SR ? "Bé bấm 🎤 rồi đọc to từ này nhé!" : "Bé đọc to từ này, bố mẹ nghe và chấm nhé!"}</p>
              <div class="cht-word">${App.wordHtml(LEVELS[lvl], x.w)}</div>
            </div>
            <div class="doc-pic" aria-hidden="true" hidden>${/^\d+$/.test(x.pic) ? `<span class="cht-num">${x.pic}</span>` : `<span class="emoji-opt">${x.pic}</span>`}</div>
            <div class="doc-controls">
              ${SR ? `<button type="button" class="mic" data-mic aria-label="Bấm để đọc">🎤</button>`
                : `<button type="button" class="btn btn-main" data-judge="1">✅ Bé đọc đúng</button><button type="button" class="btn btn-soft" data-judge="0">❌ Chưa đúng</button>`}
            </div>
            <div class="doc-help" hidden>
              ${App.canSpeak ? `<button type="button" class="btn btn-soft" data-hear>🔊 Nghe mẫu</button>` : ""}
              <button type="button" class="btn btn-soft" data-skip>⏭️ Bỏ qua</button>
            </div>
            <p class="q-feedback" role="status"></p>
          </div>`;
      }

      const $ = (s) => play.querySelector(s);
      function feedback(ok, text) { const fb = $(".q-feedback"); fb.className = "q-feedback " + (ok === null ? "" : ok ? "ok" : "bad"); fb.innerHTML = text; }

      function right() {
        locked = true; stopRec();
        if (tries === 0) score++;
        $(".doc-pic").hidden = false;
        feedback(true, App.pick(App.PRAISE)); App.sfx(true);
        setTimeout(() => App.speak(words[i].w, "vi-VN"), 250);
        setTimeout(() => { i++; show(); }, 1800);
      }
      function wrong(text) {
        tries++;
        feedback(false, text); App.sfx(false);
        $(".doc-help").hidden = false;              // sai 1 lần: cho nghe mẫu
        $("[data-skip]").hidden = tries < SKIP_AFTER; // sai 2 lần: cho bỏ qua
      }

      function listen() {
        if (locked) return;
        if (listening) return stopRec(), setMic(false);
        App.stopSpeak();
        rec = new SR();
        rec.lang = "vi-VN"; rec.interimResults = false; rec.maxAlternatives = 5; rec.continuous = false;
        let got = false;
        rec.onresult = (e) => {
          got = true;
          const alts = Array.from(e.results[0]).map((r) => r.transcript);
          if (heard(alts, words[i].w)) right();
          else wrong(`Máy nghe bé đọc là “<b>${App.esc(alts[0] || "")}</b>”. Bé nhìn kỹ rồi đọc lại nhé!`);
        };
        rec.onerror = (e) => {
          got = true;
          if (e.error === "not-allowed" || e.error === "service-not-allowed") feedback(false, "Bé cần cho phép dùng micro (bấm vào biểu tượng 🔒 trên thanh địa chỉ) để máy nghe được nhé.");
          else if (e.error === "no-speech") feedback(false, "Máy chưa nghe thấy gì, bé bấm 🎤 rồi đọc to hơn nhé!");
          else if (e.error === "network") feedback(false, "Cần có mạng Internet để máy nghe bé đọc.");
          else if (e.error !== "aborted") feedback(false, "Máy chưa nghe rõ, bé thử lại nhé!");
        };
        rec.onend = () => { listening = false; rec = null; setMic(false); if (!got && !locked) feedback(false, "Máy chưa nghe thấy gì, bé bấm 🎤 rồi đọc to hơn nhé!"); };
        try { rec.start(); listening = true; setMic(true); feedback(null, "Máy đang nghe… bé đọc đi nào! 👂"); }
        catch (err) { listening = false; setMic(false); }
      }
      function setMic(on) { const m = $("[data-mic]"); if (m) { m.classList.toggle("on", on); m.setAttribute("aria-label", on ? "Đang nghe, bấm để dừng" : "Bấm để đọc"); } }

      play.addEventListener("click", (e) => {
        if (e.target.closest("[data-mic]")) return listen();
        if (e.target.closest("[data-hear]")) { stopRec(); return App.speak(words[i].w, "vi-VN"); }
        if (e.target.closest("[data-skip]")) { stopRec(); i++; return show(); }
        const j = e.target.closest("[data-judge]");
        if (j && !locked) return j.dataset.judge === "1" ? right() : wrong("Chưa đúng rồi, bé đọc lại nhé!");
      });
      el.addEventListener("click", (e) => {
        const c = e.target.closest("[data-lvl]"); if (!c) return;
        lvl = +c.dataset.lvl; saveLevel(lvl);
        el.querySelectorAll("[data-lvl]").forEach((x) => x.setAttribute("aria-pressed", x === c));
        renew();
      });
      // Rời trang thì tắt micro
      window.addEventListener("hashchange", stopRec, { once: true });
      renew();
    }
  });
})();
