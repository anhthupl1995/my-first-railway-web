// Phiếu in A4 – Tiếng Việt: Nối từ với hình (luyện đọc / phát âm)
(function () {
  const { shuffle, sample } = App;
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

  const BODY_H = 190, BODY_W = 178, BOX_W = 56, DOT = 59; // mm – phải khớp với CSS .match

  App.registerSheet({
    id: "noi-tu-hinh", subject: "tieng-viet", name: "Nối từ với hình", emoji: "🔗",
    desc: "Bé đọc to từng chữ rồi nối với hình đúng – luyện phát âm", ages: [1, 2, 3],
    options: [
      { key: "theme", label: "Chủ đề", def: "so", choices: ["so", "convat", "dovat", "tron"].map((k) => [k, THEMES[k].name]) },
      { key: "case", label: "Kiểu chữ", def: "thuong", choices: [["thuong", "chữ thường"], ["hoa", "CHỮ HOA"]], keep: true }
    ],
    thumb: `<div class="thumb-match"><b>ba</b><i></i><span>3</span><b>cá</b><i></i><span>🐟</span><b>xe</b><i></i><span>🚗</span></div>`,

    // Chọn từ (đổi khi bấm "Tạo phiếu khác" hoặc đổi chủ đề)
    generate(age, opt) {
      const n = { 1: 4, 2: 5, 3: 6 }[age], maxLvl = { 1: 1, 2: 2, 3: 3 }[age];
      let pool = THEMES[opt.theme].items.filter((x) => x.lvl <= maxLvl);
      if (pool.length < n) pool = THEMES[opt.theme].items;
      const words = sample(pool, n);
      let order; // order[i] = hàng của hình ứng với từ i; không hình nào nằm ngay hàng với từ của nó
      do { order = shuffle([...Array(n).keys()]); } while (order.some((v, i) => v === i));
      return { words, order };
    },

    render({ words, order }, age, opt) {
      const n = words.length, rowH = BODY_H / n, boxH = Math.min(rowH - 8, 36);
      const fs = Math.min(boxH * 0.5, 15), em = Math.min(boxH * 0.72, 26);
      const text = (w) => (opt.case === "hoa" ? w.toLocaleUpperCase("vi") : w);
      const pic = (p) => (typeof p === "number" ? `<span class="pic-num" style="font-size:${em * 0.95}mm">${p}</span>` : `<span style="font-size:${em}mm;line-height:1">${p}</span>`);
      const left = words.map((x, i) => `<div class="m-cell m-word" style="grid-row:${i + 1};height:${boxH}mm"><span style="font-size:${fs}mm">${text(x.w)}</span></div>`).join("");
      const right = words.map((x, i) => `<div class="m-cell m-pic" style="grid-row:${order[i] + 1};height:${boxH}mm">${pic(x.pic)}</div>`).join("");
      const lines = words.map((x, i) => `<line x1="${DOT}" y1="${(i + 0.5) * rowH}" x2="${BODY_W - DOT}" y2="${(order[i] + 0.5) * rowH}"/>`).join("");
      return {
        title: "NỐI TỪ VỚI HÌNH",
        instruction: "Bé đọc to từng chữ ở cột bên trái, rồi kẻ đường nối với hình đúng ở cột bên phải.",
        body: `<div class="match" style="--n:${n}">
          <svg class="answer-lines" viewBox="0 0 ${BODY_W} ${BODY_H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
          ${left}${right}
        </div>`
      };
    }
  });
})();
