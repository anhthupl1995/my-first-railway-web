// Shared data, helpers and the quiz engine used by most games.
(function () {
  const App = (window.App = {});

  App.AGES = [
    { label: "2–3 tuổi", emoji: "🍼", from: 2, to: 3 },
    { label: "3–4 tuổi", emoji: "🧸", from: 3, to: 4 },
    { label: "4–5 tuổi", emoji: "🎨", from: 4, to: 5 },
    { label: "5–6 tuổi", emoji: "🎒", from: 5, to: 6 }
  ];

  // c = main color, t = tint, d = dark (readable text)
  App.SUBJECTS = [
    { id: "tieng-viet", name: "Tiếng Việt", emoji: "📖", c: "#F2994A", t: "#FFF1E4", d: "#A4500E", desc: "Chữ cái, ghép chữ" },
    { id: "toan", name: "Toán", emoji: "🔢", c: "#2F80ED", t: "#E8F1FD", d: "#1B5FC1", desc: "Đếm số, cộng trừ, so sánh" },
    { id: "tieng-anh", name: "Tiếng Anh", emoji: "🌍", c: "#27AE60", t: "#E6F6EC", d: "#1A7A43", desc: "Từ vựng, tìm chữ, tô màu" }
  ];

  // Each topic: { id, subject, name, emoji, desc, ages: [age indexes], mount(el, ctx) }
  App.topics = [];
  App.register = (t) => App.topics.push(t);
  App.topicsOf = (sid) => App.topics.filter((t) => t.subject === sid);
  // Printable A4 worksheets: { id, subject, name, emoji, desc, ages, options, thumb, generate(age, opt), render(data, age, opt) }
  App.sheets = [];
  App.registerSheet = (s) => App.sheets.push(s);
  App.sheetsOf = (sid) => App.sheets.filter((s) => !sid || s.subject === sid);
  App.ageRange =(t) => App.AGES[t.ages[0]].from + "–" + App.AGES[t.ages[t.ages.length - 1]].to + " tuổi";
  App.clampAge = (t, age) => t.ages.reduce((best, a) => (Math.abs(a - age) < Math.abs(best - age) ? a : best), t.ages[0]);

  // ---------- Settings (saved per browser) ----------
  function load(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  let age = load("age", 1); if (!App.AGES[age]) age = 1;
  let sound = load("sound", true);
  App.getAge = () => age;
  App.setAge = (v) => { age = v; save("age", v); };
  App.soundOn = () => sound;
  App.setSound = (v) => { sound = v; save("sound", v); if (!v) App.stopSpeak(); };

  // ---------- Helpers ----------
  App.rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  App.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  App.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  App.sample = (arr, n) => App.shuffle(arr).slice(0, n);
  App.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // k sorted number choices around n, inside [min, max]
  App.numOptions = (n, min, max, k) => {
    const s = new Set([n]); let guard = 0;
    while (s.size < Math.min(k, max - min + 1) && guard++ < 200) {
      const d = n + App.pick([-3, -2, -1, 1, 2, 3]);
      s.add(d >= min && d <= max ? d : App.rand(min, max));
    }
    return [...s].sort((a, b) => a - b);
  };

  // ---------- Sound ----------
  App.canSpeak = "speechSynthesis" in window;
  App.speak = (text, lang) => {
    if (!sound || !App.canSpeak) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang || "vi-VN"; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) { /* no voice */ }
  };
  App.stopSpeak = () => { try { if (App.canSpeak) speechSynthesis.cancel(); } catch (e) { /* ignore */ } };
  let actx;
  App.sfx = (ok) => {
    if (!sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      (ok ? [523, 659, 784] : [233, 196]).forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.09;
        o.type = ok ? "sine" : "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.22);
      });
    } catch (e) { /* audio not available */ }
  };

  App.PRAISE = ["Giỏi quá! 🎉", "Đúng rồi! 👏", "Tuyệt vời! ⭐", "Bé thông minh quá! 🌟", "Chính xác! 💯"];

  // ---------- Finish screen ----------
  App.finish = (el, o) => {
    const r = o.score / o.total, stars = r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
    const sid = (location.hash.match(/^#\/mon\/([^/]+)/) || [])[1] || "";
    el.innerHTML = `
      <div class="finish">
        <div class="finish-emoji" aria-hidden="true">${stars === 3 ? "🏆" : stars === 2 ? "🎉" : "💪"}</div>
        <h2>${stars === 3 ? "Xuất sắc!" : stars === 2 ? "Giỏi lắm!" : "Cố lên nào!"}</h2>
        <div class="stars" aria-label="${stars} trên 3 sao">${"⭐".repeat(stars)}<span class="dim">${"⭐".repeat(3 - stars)}</span></div>
        <p>${o.text || `Bé làm đúng ngay lần đầu <b>${o.score}/${o.total}</b> câu.`}</p>
        <div class="actions">
          <button type="button" class="btn btn-main" data-again>${o.againLabel || "Chơi lại"}</button>
          <a class="btn btn-soft" href="#/mon/${sid}">Chọn bài khác</a>
        </div>
      </div>`;
    el.querySelector("[data-again]").addEventListener("click", o.again);
    App.sfx(true);
  };

  // ---------- Quiz engine ----------
  // opts.make(i) returns { prompt, options: [{ html, ok }], say?: [text, lang], after?: [text, lang], optClass? }
  App.quiz = (el, opts) => {
    const total = opts.rounds || 10;
    let i = 0, score = 0, round, firstTry, locked;
    const box = document.createElement("div");
    el.innerHTML = ""; el.appendChild(box);

    function next() {
      if (i >= total) return App.finish(el, { score, total, again: () => App.quiz(el, opts) });
      round = opts.make(i); firstTry = true; locked = false;
      box.innerHTML = `
        <div class="quiz">
          <div class="progress"><span style="width:${(i / total) * 100}%"></span></div>
          <div class="q-count">Câu ${i + 1}/${total}</div>
          <div class="q-prompt">${round.prompt}${round.say && App.canSpeak ? '<button class="speak" type="button" data-say aria-label="Nghe lại">🔊</button>' : ""}</div>
          <div class="q-options ${round.optClass || ""}">${round.options.map((o, k) => `<button type="button" class="opt" data-k="${k}">${o.html}</button>`).join("")}</div>
          <p class="q-feedback" role="status"></p>
        </div>`;
      if (round.say && opts.autoSay) App.speak(...round.say);
    }

    box.addEventListener("click", (e) => {
      if (e.target.closest("[data-say]")) { App.speak(...round.say); return; }
      const b = e.target.closest(".opt");
      if (!b || locked || b.disabled) return;
      const fb = box.querySelector(".q-feedback");
      if (round.options[+b.dataset.k].ok) {
        locked = true; if (firstTry) score++;
        b.classList.add("ok"); fb.className = "q-feedback ok"; fb.textContent = App.pick(App.PRAISE);
        App.sfx(true); if (round.after) setTimeout(() => App.speak(...round.after), 250);
        setTimeout(() => { i++; next(); }, 1100);
      } else {
        firstTry = false; b.classList.add("bad"); b.disabled = true;
        fb.className = "q-feedback bad"; fb.textContent = "Chưa đúng, bé thử lại nhé!";
        App.sfx(false);
      }
    });
    next();
  };
})();
