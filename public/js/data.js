// Shared content used by both interactive games and printable worksheets.
(function () {
  // [emoji trái, tên trái, emoji phải, tên phải, những hình bên phải khác CŨNG hợp lý với con vật này]
  // Hình "cũng hợp lý" không bao giờ được dùng làm đáp án sai, và không xuất hiện chung lượt/phiếu nối
  // (vd: bò cũng ăn cà rốt, cua cũng sống dưới nước) để tránh bài có hai đáp án.
  const P = (arr) => arr.map(([le, ln, re, rn, also]) => ({ l: { em: le, name: ln }, r: { em: re, name: rn }, also: also || [] }));

  App.DATA = {
    // Con vật – nơi ở
    homes: P([
      ["🐟", "con cá", "🌊", "dưới nước"],
      ["🐙", "bạch tuộc", "🌊", "dưới nước"],
      ["🐦", "con chim", "🪺", "tổ chim", ["🌳"]],
      ["🐵", "con khỉ", "🌳", "trên cây"],
      ["🐿️", "con sóc", "🌳", "trên cây"],
      ["🐶", "con chó", "🏠", "ngôi nhà"],
      ["🐔", "con gà", "🛖", "chuồng gà", ["🌾", "🏠"]],
      ["🐧", "chim cánh cụt", "🧊", "băng tuyết", ["🌊"]],
      ["🐪", "lạc đà", "🏜️", "sa mạc"],
      ["🦀", "con cua", "🏖️", "bãi biển", ["🌊"]],
      ["🐄", "con bò", "🌾", "cánh đồng", ["🛖"]]
    ]),
    // Con vật – thức ăn
    foods: P([
      ["🐰", "con thỏ", "🥕", "cà rốt", ["🌿"]],
      ["🐵", "con khỉ", "🍌", "quả chuối", ["🌽", "🐛"]],
      ["🐱", "con mèo", "🐟", "con cá", ["🧀"]],
      ["🐶", "con chó", "🦴", "khúc xương", ["🐟"]],
      ["🐝", "con ong", "🌸", "bông hoa"],
      ["🐔", "con gà", "🌽", "hạt ngô", ["🐛", "🌿"]],
      ["🐄", "con bò", "🌿", "bó cỏ", ["🥕", "🌽"]],
      ["🐭", "con chuột", "🧀", "phô mai", ["🌽", "🌰", "🍌"]],
      ["🐻", "con gấu", "🍯", "mật ong", ["🐟", "🍌"]],
      ["🐿️", "con sóc", "🌰", "hạt dẻ", ["🌽"]],
      ["🐼", "gấu trúc", "🎋", "cây tre"],
      ["🐦", "con chim", "🐛", "con sâu", ["🌽"]]
    ])
  };

  // Is picture `em` an acceptable answer for pair p's animal?
  App.fits = (p, em) => p.r.em === em || p.also.includes(em);

  // k shuffled choices for pair p: the right answer (ok: true) + wrong ones that don't also fit the animal.
  App.choiceOptions = (list, p, k) => {
    const seen = new Set([p.r.em]), wrong = [];
    for (const x of App.shuffle(list)) {
      if (wrong.length === k - 1) break;
      if (seen.has(x.r.em) || App.fits(p, x.r.em)) continue;
      seen.add(x.r.em); wrong.push({ ...x.r, ok: false });
    }
    return App.shuffle([{ ...p.r, ok: true }, ...wrong]);
  };

  // n random pairs where no picture repeats on either side (e.g. only one "trên cây"),
  // and no animal also fits another pair's answer – so every board has exactly one solution.
  App.uniquePairs = (list, n) => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const out = [];
      for (const p of App.shuffle(list)) {
        if (out.length === n) break;
        if (out.some((q) => q.l.em === p.l.em || q.r.em === p.r.em || App.fits(q, p.r.em) || App.fits(p, q.r.em))) continue;
        out.push(p);
      }
      if (out.length === n) return out;
    }
    return App.shuffle(list).slice(0, n);
  };

  // A shuffled order where no item stays in its own row.
  App.derange = (n) => {
    let o;
    do { o = App.shuffle([...Array(n).keys()]); } while (n > 1 && o.some((v, i) => v === i));
    return o;
  };
})();
