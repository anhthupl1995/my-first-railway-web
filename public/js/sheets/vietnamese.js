// Phiếu in A4 – Tiếng Việt: các bài nối
(function () {
  const { sample } = App;

  // ---------- Khung bảng nối dùng chung ----------
  const BODY_H = 190, BODY_W = 178, DOT = 59; // mm – phải khớp với CSS .match
  // left/right: (dims) => html của từng ô; order[i] = hàng bên phải ứng với ô trái i
  function matchBody(n, order, left, right) {
    const rowH = BODY_H / n, boxH = Math.min(rowH - 8, 40);
    const d = { boxH, fs: Math.min(boxH * 0.5, 15), em: Math.min(boxH * 0.72, 26) };
    const cell = (side, row, html) => `<div class="m-cell m-${side}" style="grid-row:${row + 1};height:${boxH}mm">${html}</div>`;
    const lines = order.map((row, i) => `<line x1="${DOT}" y1="${(i + 0.5) * rowH}" x2="${BODY_W - DOT}" y2="${(row + 0.5) * rowH}"/>`).join("");
    return `<div class="match" style="--n:${n}">
      <svg class="answer-lines" viewBox="0 0 ${BODY_W} ${BODY_H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      ${order.map((row, i) => cell("left", i, left(i, d))).join("")}
      ${order.map((row, i) => cell("right", row, right(i, d))).join("")}
    </div>`;
  }
  // Hình (emoji) có thể kèm tên nhỏ bên dưới để bố mẹ đọc cho bé
  const picture = (x, d, withName) => withName
    ? `<span style="font-size:${Math.min(d.boxH * 0.55, 24)}mm;line-height:1">${x.em}</span><small class="m-label">${x.name}</small>`
    : `<span style="font-size:${d.em}mm;line-height:1">${x.em}</span>`;

  // ---------- Nối từ với hình (luyện đọc / phát âm) ----------
  // [từ, hình (emoji hoặc số), mức độ: 1 = vần đơn giản, 2 = có âm cuối / phụ âm ghép, 3 = vần khó]
  const IT = (arr) => arr.map(([w, pic, lvl]) => ({ w, pic, lvl }));
  const THEMES = {
    so: { name: "🔢 Số đếm", items: IT([["một", 1, 1], ["hai", 2, 1], ["ba", 3, 1], ["bốn", 4, 1], ["năm", 5, 1],
      ["sáu", 6, 2], ["bảy", 7, 2], ["tám", 8, 2], ["chín", 9, 2], ["mười", 10, 2]]) },
    convat: { name: "🐾 Con vật", items: IT([["cá", "🐟", 1], ["gà", "🐔", 1], ["bò", "🐄", 1], ["dê", "🐐", 1], ["hổ", "🐯", 1],
      ["mèo", "🐱", 2], ["chó", "🐶", 2], ["voi", "🐘", 2], ["vịt", "🦆", 2], ["ong", "🐝", 2], ["rùa", "🐢", 2], ["cua", "🦀", 2],
      ["thỏ", "🐰", 3], ["khỉ", "🐵", 3], ["ngựa", "🐴", 3], ["chim", "🐦", 3]]) },
    dovat: { name: "🍎 Đồ vật & quả", items: IT([["xe", "🚗", 1], ["ô", "☂️", 1], ["mũ", "🧢", 1], ["bé", "👶", 1],
      ["nhà", "🏠", 2], ["cam", "🍊", 2], ["kem", "🍦", 2], ["sao", "⭐", 2], ["nho", "🍇", 2], ["táo", "🍎", 2], ["bút", "✏️", 2],
      ["cây", "🌳", 2], ["hoa", "🌸", 2], ["sách", "📖", 3], ["trăng", "🌙", 3], ["chuối", "🍌", 3], ["bánh", "🍰", 3], ["dừa", "🥥", 3]]) }
  };
  THEMES.tron = { name: "🎲 Trộn", items: [...THEMES.so.items, ...THEMES.convat.items, ...THEMES.dovat.items] };

  App.registerSheet({
    id: "noi-tu-hinh", subject: "tieng-viet", name: "Nối từ với hình", emoji: "🔗",
    desc: "Bé đọc to từng chữ rồi nối với hình đúng – luyện phát âm", ages: [1, 2, 3],
    options: [
      { key: "theme", label: "Chủ đề", def: "so", choices: ["so", "convat", "dovat", "tron"].map((k) => [k, THEMES[k].name]) },
      { key: "case", label: "Kiểu chữ", def: "thuong", choices: [["thuong", "chữ thường"], ["hoa", "CHỮ HOA"]], keep: true }
    ],
    thumb: `<div class="thumb-match"><b>ba</b><i></i><span>3</span><b>cá</b><i></i><span>🐟</span><b>xe</b><i></i><span>🚗</span></div>`,
    generate(age, opt) {
      const n = { 1: 4, 2: 5, 3: 6 }[age], maxLvl = { 1: 1, 2: 2, 3: 3 }[age];
      let pool = THEMES[opt.theme].items.filter((x) => x.lvl <= maxLvl);
      if (pool.length < n) pool = THEMES[opt.theme].items;
      return { words: sample(pool, n), order: App.derange(n) };
    },
    render({ words, order }, age, opt) {
      const text = (w) => (opt.case === "hoa" ? w.toLocaleUpperCase("vi") : w);
      return {
        title: "NỐI TỪ VỚI HÌNH",
        instruction: "Bé đọc to từng chữ ở cột bên trái, rồi kẻ đường nối với hình đúng ở cột bên phải.",
        body: matchBody(words.length, order,
          (i, d) => `<span class="m-word" style="font-size:${d.fs}mm">${text(words[i].w)}</span>`,
          (i, d) => typeof words[i].pic === "number"
            ? `<span class="pic-num" style="font-size:${d.em * 0.95}mm">${words[i].pic}</span>`
            : `<span style="font-size:${d.em}mm;line-height:1">${words[i].pic}</span>`)
      };
    }
  });

  // ---------- Nối hình với hình: con vật – nơi ở / thức ăn (2–4 tuổi) ----------
  const pictureSheet = (id, name, emoji, desc, key, title, instruction, thumb) => App.registerSheet({
    id, subject: "tieng-viet", name, emoji, desc, ages: [0, 1],
    options: [{ key: "names", label: "Tên dưới hình", def: "co", choices: [["co", "Có"], ["khong", "Không"]], keep: true }],
    thumb,
    generate(age) {
      const n = age === 0 ? 3 : 4;
      return { pairs: App.uniquePairs(App.DATA[key], n), order: App.derange(n) };
    },
    render({ pairs, order }, age, opt) {
      const names = opt.names === "co";
      return {
        title, instruction,
        body: matchBody(pairs.length, order, (i, d) => picture(pairs[i].l, d, names), (i, d) => picture(pairs[i].r, d, names))
      };
    }
  });
  pictureSheet("noi-noi-o", "Nối con vật – nơi ở", "🏡", "Nối con vật với nơi ở của nó – bố mẹ đọc tên cho bé", "homes",
    "CON VẬT SỐNG Ở ĐÂU?", "Bé nối mỗi con vật với nơi ở của nó. Bố mẹ chỉ vào hình và đọc tên cho bé nghe nhé!",
    `<div class="thumb-match"><span>🐟</span><i></i><span>🌳</span><span>🐵</span><i></i><span>🌊</span><span>🐦</span><i></i><span>🪺</span></div>`);
  pictureSheet("noi-thuc-an", "Nối con vật – thức ăn", "🥕", "Nối con vật với thức ăn nó thích – bố mẹ đọc tên cho bé", "foods",
    "CON VẬT THÍCH ĂN GÌ?", "Bé nối mỗi con vật với thức ăn nó thích. Bố mẹ chỉ vào hình và đọc tên cho bé nghe nhé!",
    `<div class="thumb-match"><span>🐰</span><i></i><span>🍌</span><span>🐵</span><i></i><span>🥕</span><span>🐶</span><i></i><span>🦴</span></div>`);
})();
