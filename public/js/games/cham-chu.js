// Tiếng Việt – Chạm chữ, xem hình (3–4 tuổi)
// Bên trái 10 chữ; bé chạm một chữ thì bên phải hiện con vật / đồ vật đó cử động (ngựa phi, bướm bay, cá bơi…),
// kèm câu mô tả và máy đọc to. Xem hết 10 chữ là xong lượt.
// "Chơi lại" = đúng 10 chữ đó; "Chơi tiếp" = 10 chữ khác (ưu tiên chữ chưa xem).
(function () {
  const { register, shuffle } = App;
  const PER = 10;
  // [chữ, hình, câu mô tả, kiểu cử động: run = chạy ngang, fly = bay lượn, swim = bơi lắc lư, hop = nhảy nhún]
  const WORDS = [
    ["con ngựa", "🐎", "Con ngựa phi rất nhanh.", "run"], ["con mèo", "🐱", "Con mèo kêu meo meo.", "hop"],
    ["con chó", "🐶", "Con chó kêu gâu gâu, giữ nhà.", "hop"], ["con gà", "🐔", "Con gà trống gáy ò ó o.", "hop"],
    ["con vịt", "🦆", "Con vịt bơi dưới ao.", "swim"], ["con cá", "🐟", "Con cá bơi dưới nước.", "swim"],
    ["con voi", "🐘", "Con voi có cái vòi thật dài.", "run"], ["con thỏ", "🐰", "Con thỏ thích ăn cà rốt.", "hop"],
    ["con bò", "🐄", "Con bò ăn cỏ ngoài đồng.", "run"], ["con khỉ", "🐵", "Con khỉ leo cây rất giỏi.", "hop"],
    ["con ong", "🐝", "Con ong bay đi hút mật hoa.", "fly"], ["con bướm", "🦋", "Con bướm bay lượn quanh vườn hoa.", "fly"],
    ["con rùa", "🐢", "Con rùa bò rất chậm.", "run"], ["con hổ", "🐯", "Con hổ là chúa sơn lâm.", "run"],
    ["con heo", "🐷", "Con heo kêu ụt ịt.", "hop"], ["con cua", "🦀", "Con cua bò ngang.", "swim"],
    ["con chim", "🐦", "Con chim hót líu lo.", "fly"], ["quả táo", "🍎", "Quả táo màu đỏ, ăn giòn ngọt.", "hop"],
    ["quả chuối", "🍌", "Quả chuối màu vàng.", "hop"], ["quả dưa hấu", "🍉", "Quả dưa hấu ruột đỏ, ăn mát lành.", "hop"],
    ["ô tô", "🚗", "Ô tô chạy bon bon trên đường.", "run"], ["máy bay", "✈️", "Máy bay bay trên bầu trời.", "fly"],
    ["tàu hỏa", "🚂", "Tàu hỏa chạy trên đường ray: xình xịch.", "run"], ["xe đạp", "🚲", "Bé đạp xe đạp đi chơi.", "run"],
    ["quả bóng", "⚽", "Bé đá quả bóng lăn tròn.", "hop"], ["mặt trời", "☀️", "Ông mặt trời chiếu sáng ban ngày.", "fly"],
    ["mặt trăng", "🌙", "Mặt trăng sáng vào ban đêm.", "fly"], ["bông hoa", "🌸", "Bông hoa nở thơm ngát.", "hop"],
    ["cái ô", "☂️", "Cái ô che mưa cho bé.", "hop"], ["ngôi nhà", "🏠", "Ngôi nhà là nơi cả nhà mình ở.", "hop"]
  ].map(([w, em, say, move]) => ({ w, em, say, move }));

  register({
    id: "cham-chu", subject: "tieng-viet", name: "Chạm chữ, xem hình", emoji: "👆",
    desc: "Chạm vào chữ bên trái, hình bên phải cử động và đọc to cho bé nghe", ages: [1],
    mount(el) {
      let set = [], seen, cur, done;

      function renew() {
        const fresh = shuffle(WORDS.filter((x) => !set.includes(x)));
        set = fresh.concat(shuffle(WORDS.filter((x) => !fresh.includes(x)))).slice(0, PER);
        replay();
      }
      function replay() {
        seen = new Set(); cur = null; done = false;
        el.innerHTML = `
          <div class="quiz">
            <div class="progress"><span style="width:0%"></span></div>
            <div class="q-count">Bé đã xem <b>0</b>/${set.length} chữ</div>
            <div class="cc-board">
              <div class="cc-words" role="group" aria-label="Các chữ">${set.map((x, i) =>
                `<button type="button" class="cc-word" data-i="${i}" aria-pressed="false">${x.w}</button>`).join("")}</div>
              <div class="cc-stage" aria-live="polite">
                <div class="cc-hint"><span aria-hidden="true">👈</span>Bé chạm vào một chữ nhé!</div>
              </div>
            </div>
          </div>`;
        App.speak("Bé chạm vào một chữ nhé!", "vi-VN");
      }

      function show(i) {
        const x = set[i], stage = el.querySelector(".cc-stage");
        cur = i; seen.add(i);
        el.querySelectorAll(".cc-word").forEach((b) => {
          b.setAttribute("aria-pressed", +b.dataset.i === i);
          if (seen.has(+b.dataset.i)) b.classList.add("seen");
        });
        stage.innerHTML = `
          <div class="cc-pic cc-${x.move}" aria-hidden="true"><span>${x.em}</span></div>
          <div class="cc-name">${x.w}</div>
          <p class="cc-say">${x.say}</p>
          ${App.canSpeak ? '<button class="speak" type="button" data-say aria-label="Nghe lại">🔊</button>' : ""}`;
        el.querySelector(".progress span").style.width = (seen.size / set.length) * 100 + "%";
        el.querySelector(".q-count b").textContent = seen.size;
        App.speak(`${x.w}. ${x.say}`, "vi-VN");
        if (seen.size === set.length && !done) {
          done = true;
          setTimeout(() => App.finish(el, {
            score: set.length, total: set.length, text: `Bé đã xem hết <b>${set.length}</b> chữ. Giỏi quá!`, again: replay, renew
          }), 3500);
        }
      }

      el.addEventListener("click", (e) => {
        const b = e.target.closest(".cc-word"); if (b) return show(+b.dataset.i);
        if (e.target.closest("[data-say]") && cur !== null) App.speak(`${set[cur].w}. ${set[cur].say}`, "vi-VN");
      });
      renew();
    }
  });
})();
