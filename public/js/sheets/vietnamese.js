// Phiếu in A4 – Tiếng Việt: các bài nối
// Mỗi phiếu gồm App.SHEET_PAGES trang (4 trang), chia 4 cấp độ giống bài "Bé tập đọc".
(function () {
  const PAGES = App.SHEET_PAGES;

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

  // Chip "Cấp độ": giá trị là chỉ số cấp (chuỗi), title = mô tả cấp
  const levelOption = (levels) => ({ key: "level", label: "Cấp độ", def: "0", choices: levels.map((L, i) => [String(i), L.name, L.desc]) });

  // ---------- Nối từ với hình (luyện đọc) – 4 cấp độ dùng chung với "Bé tập đọc" ----------
  const WL = App.WORD_LEVELS, PER = 6;
  App.registerSheet({
    id: "noi-tu-hinh", subject: "tieng-viet", name: "Nối từ với hình", emoji: "🔗",
    desc: `Bé đọc to từng chữ rồi nối với hình đúng – 4 cấp độ, mỗi phiếu ${PAGES} trang`, ages: [1, 2, 3],
    options: [
      levelOption(WL),
      { key: "case", label: "Kiểu chữ", def: "thuong", choices: [["thuong", "chữ thường"], ["hoa", "CHỮ HOA"]], keep: true }
    ],
    thumb: `<div class="thumb-match"><b>ba</b><i></i><span>3</span><b>cá</b><i></i><span>🐟</span><b>xe</b><i></i><span>🚗</span></div>`,
    generate(age, opt) { return App.wordPages(WL[+opt.level].items, PAGES, PER); },
    render(pages, age, opt) {
      const L = WL[+opt.level];
      return {
        title: "NỐI TỪ VỚI HÌNH", tag: L.name,
        instruction: "Bé đọc to từng chữ ở cột bên trái, rồi kẻ đường nối với hình đúng ở cột bên phải.",
        pages: pages.map(({ words, order }) => matchBody(words.length, order,
          (i, d) => `<span class="m-word${opt.case === "hoa" ? " upper" : ""}" style="font-size:${d.fs}mm">${App.wordHtml(L, words[i].w)}</span>`,
          (i, d) => /^\d+$/.test(words[i].pic)
            ? `<span class="pic-num" style="font-size:${d.em * 0.95}mm">${words[i].pic}</span>`
            : `<span style="font-size:${d.em}mm;line-height:1">${words[i].pic}</span>`))
      };
    }
  });

  // ---------- Nối hình với hình: con vật – nơi ở / thức ăn (2–4 tuổi) ----------
  // 4 cấp độ theo số cặp cần nối trên mỗi trang
  const PIC_LEVELS = [3, 4, 5, 6].map((n, i) => ({ name: `Cấp ${i + 1}`, desc: `${n} cặp mỗi trang`, n }));
  const pictureSheet = (id, name, emoji, desc, key, title, instruction, thumb) => App.registerSheet({
    id, subject: "tieng-viet", name, emoji, desc: `${desc} – 4 cấp độ, mỗi phiếu ${PAGES} trang`, ages: [0, 1],
    options: [
      levelOption(PIC_LEVELS),
      { key: "names", label: "Tên dưới hình", def: "co", choices: [["co", "Có"], ["khong", "Không"]], keep: true }
    ],
    thumb,
    generate(age, opt) {
      const n = PIC_LEVELS[+opt.level].n;
      return Array.from({ length: PAGES }, () => ({ pairs: App.uniquePairs(App.DATA[key], n), order: App.derange(n) }));
    },
    render(pages, age, opt) {
      const names = opt.names === "co";
      return {
        title, instruction, tag: PIC_LEVELS[+opt.level].name,
        pages: pages.map(({ pairs, order }) =>
          matchBody(pairs.length, order, (i, d) => picture(pairs[i].l, d, names), (i, d) => picture(pairs[i].r, d, names)))
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
