// Môn Tiếng Việt: Nhận biết chữ cái, Điền chữ còn thiếu
(function () {
  const { register, pick, shuffle, sample, quiz } = App;

  const LETTERS = "A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y".split(" ");
  const EASY = "A B C D E O".split(" ");
  const base = (ch) => ch.normalize("NFD")[0];

  // ---------- Nhận biết chữ cái ----------
  register({
    id: "chu-cai", subject: "tieng-viet", name: "Nhận biết chữ cái", emoji: "🔤",
    desc: "Tìm chữ cái giống chữ trong khung", ages: [0, 1, 2],
    mount(el, ctx) {
      const pool = ctx.age === 0 ? EASY : LETTERS, n = [3, 4, 6][ctx.age], lower = ctx.age === 2;
      quiz(el, {
        rounds: [6, 8, 10][ctx.age],
        make() {
          const t = pick(pool);
          // Bé nhỏ: tránh các chữ quá giống nhau (A/Ă/Â)
          const others = shuffle(pool.filter((x) => x !== t && (lower || base(x) !== base(t)))).slice(0, n - 1);
          return {
            prompt: `<p class="q-text">${lower ? "Tìm chữ thường của chữ" : "Bé hãy tìm chữ"}</p><div class="big-letter">${t}</div>`,
            options: shuffle([t, ...others]).map((x) => ({ html: lower ? x.toLowerCase() : x, ok: x === t }))
          };
        }
      });
    }
  });

  // ---------- Nối con vật (2–4 tuổi): nơi ở, thức ăn ----------
  const matchTopic = (id, name, emoji, desc, key, prompt) => register({
    id, subject: "tieng-viet", name, emoji, desc, ages: [0, 1],
    mount(el, ctx) {
      const n = ctx.age === 0 ? 3 : 4;
      App.matchGame(el, { boards: ctx.age === 0 ? 3 : 4, prompt, make: () => App.uniquePairs(App.DATA[key], n) });
    }
  });
  matchTopic("noi-o-con-vat", "Con vật sống ở đâu?", "🏡", "Nối mỗi con vật với nơi ở của nó", "homes", "Bé nối mỗi con vật với nơi ở của nó nhé!");
  matchTopic("thuc-an-con-vat", "Con vật ăn gì?", "🥕", "Nối mỗi con vật với thức ăn nó thích", "foods", "Bé nối mỗi con vật với thức ăn nó thích nhé!");

  // ---------- Trắc nghiệm con vật (2–4 tuổi): chọn nơi ở / thức ăn ----------
  const choiceTopic = (id, name, emoji, desc, key, ask) => register({
    id, subject: "tieng-viet", name, emoji, desc, ages: [0, 1],
    mount(el, ctx) {
      const k = ctx.age === 0 ? 2 : 3, all = App.DATA[key];
      let deck = [];
      quiz(el, {
        rounds: ctx.age === 0 ? 6 : 8, autoSay: true,
        make() {
          if (!deck.length) deck = shuffle(all); // không lặp con vật cho tới khi hết lượt
          const p = deck.pop(), question = ask(p.l.name);
          return {
            prompt: `<div class="big-emoji" aria-hidden="true">${p.l.em}</div><p class="q-text">${question}</p>`,
            say: [question, "vi-VN"], after: [p.r.name, "vi-VN"], optClass: "pic-opts",
            options: App.choiceOptions(all, p, k).map((o) => ({ html: `<span class="emoji-opt">${o.em}</span><span class="opt-name">${o.name}</span>`, ok: o.ok }))
          };
        }
      });
    }
  });
  choiceTopic("chon-noi-o", "Chọn nơi ở cho con vật", "🏠", "Nhìn con vật, chạm vào nơi ở đúng của nó", "homes",
    (n) => `${n[0].toUpperCase() + n.slice(1)} sống ở đâu?`);
  choiceTopic("chon-thuc-an", "Chọn thức ăn cho con vật", "🍽️", "Nhìn con vật, chạm vào thức ăn nó thích", "foods",
    (n) => `${n[0].toUpperCase() + n.slice(1)} thích ăn gì?`);

  // ---------- Điền chữ còn thiếu ----------
  const WORDS = [["cá", "🐟"], ["gà", "🐔"], ["mèo", "🐱"], ["chó", "🐶"], ["bò", "🐮"], ["hoa", "🌸"], ["cam", "🍊"],
    ["nhà", "🏠"], ["xe", "🚗"], ["bé", "👶"], ["sao", "⭐"], ["cây", "🌳"], ["táo", "🍎"], ["ong", "🐝"], ["voi", "🐘"],
    ["thỏ", "🐰"], ["khỉ", "🐵"], ["vịt", "🦆"], ["bút", "✏️"], ["mũ", "🧢"], ["kem", "🍦"], ["bánh", "🍰"], ["trăng", "🌙"],
    ["sách", "📖"], ["rùa", "🐢"], ["cua", "🦀"], ["dừa", "🥥"], ["nho", "🍇"], ["cúc", "🌼"]];
  const TONE = /[̣̀́̃̉]/;
  const VOWELS = "a ă â e ê i o ô ơ u ư y".split(" ");
  const CONS = "b c d đ g h k l m n p q r s t v x".split(" ");
  // Distractors look alike: same tone mark for vowels, other consonants for consonants.
  function distract(ch, k) {
    const d = ch.normalize("NFD"), tone = (d.match(TONE) || [""])[0], plain = d.replace(TONE, "").normalize("NFC");
    const pool = VOWELS.includes(plain) ? VOWELS.map((v) => (v + tone).normalize("NFC")) : CONS;
    return sample(pool.filter((x) => x !== ch), k);
  }

  register({
    id: "dien-chu", subject: "tieng-viet", name: "Điền chữ còn thiếu", emoji: "✏️",
    desc: "Nhìn hình, chọn chữ cái còn thiếu trong từ", ages: [2, 3],
    mount(el, ctx) {
      const nOpt = ctx.age === 2 ? 3 : 4;
      quiz(el, {
        rounds: 10,
        make() {
          const [w, em] = pick(WORDS), chars = Array.from(w.normalize("NFC"));
          const k = ctx.age === 2 ? 0 : Math.floor(Math.random() * chars.length), ans = chars[k];
          return {
            prompt: `<div class="big-emoji" aria-hidden="true">${em}</div>` +
              `<div class="word-blank" aria-label="Từ còn thiếu một chữ">${chars.map((c, i) => (i === k ? '<span class="blank">?</span>' : `<span>${c}</span>`)).join("")}</div>` +
              `<p class="q-text">Chữ nào còn thiếu?</p>`,
            say: [w, "vi-VN"], after: [w, "vi-VN"],
            options: shuffle([ans, ...distract(ans, nOpt - 1)]).map((x) => ({ html: x, ok: x === ans }))
          };
        }
      });
    }
  });
})();
