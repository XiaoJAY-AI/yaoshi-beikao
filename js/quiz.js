// 在线模拟试卷：渲染、作答、判分、解析
// 页面需先定义 window.MOCK_DATA = [...]，然后引入本脚本

(function () {
  var TYPE_LABEL = { A: "A 单选", B: "B 配伍", C: "C 综合分析", X: "X 多选" };
  var flat = []; // 扁平化后的题目（B 型按题配展开）
  var page = 0;
  var pager = null;
  var pagerInfo = null;

  function letter(i) {
    return String.fromCharCode(65 + i);
  }

  function countAnswered() {
    var n = 0;
    document.querySelectorAll(".quiz-q").forEach(function (card) {
      if (card.querySelector(".opts li.selected")) n++;
    });
    return n;
  }

  function updatePager() {
    if (!pagerInfo) return;
    pagerInfo.textContent = "第 " + (page + 1) + " / " + flat.length + " 题 · 已答 " + countAnswered() + " 题";
    var prevBtn = pager.querySelector(".q-prev");
    var nextBtn = pager.querySelector(".q-next");
    if (prevBtn) prevBtn.disabled = page === 0;
    if (nextBtn) nextBtn.disabled = page >= flat.length - 1;
  }

  function showPage(i, root) {
    page = Math.max(0, Math.min(flat.length - 1, i));
    root.querySelectorAll(".quiz-q").forEach(function (card, idx) {
      card.style.display = idx === page ? "" : "none";
      card.dataset.current = idx === page ? "1" : "0";
    });
    if (pager) {
      pager.style.display = "flex";
      pagerInfo.textContent = "第 " + (page + 1) + " / " + flat.length + " 题 · 已答 " + countAnswered() + " 题";
      var prevBtn = pager.querySelector(".q-prev");
      var nextBtn = pager.querySelector(".q-next");
      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = page >= flat.length - 1;
    }
  }

  function buildPager(root) {
    pager = document.createElement("div");
    pager.className = "q-pager";
    var prevBtn = document.createElement("button");
    prevBtn.className = "btn btn-outline q-prev";
    prevBtn.type = "button";
    prevBtn.textContent = "← 上一题";
    pagerInfo = document.createElement("span");
    pagerInfo.className = "q-pager-info";
    var nextBtn = document.createElement("button");
    nextBtn.className = "btn q-next";
    nextBtn.type = "button";
    nextBtn.textContent = "下一题 →";
    prevBtn.addEventListener("click", function () { showPage(page - 1, root); });
    nextBtn.addEventListener("click", function () { showPage(page + 1, root); });
    pager.appendChild(prevBtn);
    pager.appendChild(pagerInfo);
    pager.appendChild(nextBtn);
    root.parentNode.insertBefore(pager, root.nextSibling);
  }

  // 将 MOCK_DATA 展平：B 型题每个"题干-题配"成为一道小题，共用选项与答案
  function flatten(data) {
    var out = [];
    data.forEach(function (q) {
      if (q.type === "B" && q.pairs && q.pairs.length) {
        q.pairs.forEach(function (pair, pi) {
          out.push({
            type: "B",
            stem: q.stem,
            pair: pair,
            pairLabel: "(" + letter(pi) + ")",
            opts: q.opts,
            answer: [q.answer[pi]],
            explain: q.explain,
            total: q.pairs.length,
            idx: pi,
          });
        });
      } else {
        out.push(q);
      }
    });
    return out;
  }

  function render(root) {
    var data = window.MOCK_DATA || [];
    flat = flatten(data);
    root.innerHTML = "";
    flat.forEach(function (q, i) {
      var card = document.createElement("div");
      card.className = "quiz-q";
      card.dataset.answer = JSON.stringify(q.answer);

      var head = document.createElement("div");
      head.className = "q-head";
      var no = document.createElement("span");
      no.className = "q-no";
      no.textContent = i + 1;
      var type = document.createElement("span");
      type.className = "q-type";
      type.textContent = TYPE_LABEL[q.type] || q.type;
      head.appendChild(no);
      head.appendChild(type);

      var text = document.createElement("div");
      text.className = "q-text";
      if (q.type === "B") {
        text.textContent = q.stem + "　" + q.pairLabel + " " + q.pair;
      } else {
        text.textContent = q.q || q.stem || "";
      }

      var opts = document.createElement("ul");
      opts.className = "opts";
      q.opts.forEach(function (opt, j) {
        var li = document.createElement("li");
        li.dataset.idx = j;
        li.textContent = letter(j) + ". " + opt;
        li.addEventListener("click", function () {
          if (li.classList.contains("disabled")) return;
          if (q.type === "X") {
            li.classList.toggle("selected");
          } else {
            opts.querySelectorAll("li").forEach(function (el) { el.classList.remove("selected"); });
            li.classList.add("selected");
          }
        });
        opts.appendChild(li);
      });

      var explain = document.createElement("div");
      explain.className = "explain";
      explain.textContent = "解析：" + (q.explain || "");

      card.appendChild(head);
      card.appendChild(text);
      card.appendChild(opts);
      card.appendChild(explain);
      root.appendChild(card);
    });
  }

  function score(root) {
    var total = 0;
    var right = 0;
    root.querySelectorAll(".quiz-q").forEach(function (card) {
      var data = flat[parseInt(card.querySelector(".q-no").textContent, 10) - 1];
      var picked = [];
      card.querySelectorAll(".opts li.selected").forEach(function (li) {
        picked.push(parseInt(li.dataset.idx, 10));
      });
      card.querySelectorAll(".opts li").forEach(function (li) { li.classList.add("disabled"); });

      var correct = JSON.parse(card.dataset.answer);
      var isRight = picked.length === correct.length && correct.every(function (c) { return picked.indexOf(c) !== -1; });
      total += 1;
      if (isRight) right += 1;

      correct.forEach(function (c) {
        card.querySelectorAll(".opts li")[c].classList.add("correct");
      });
      picked.forEach(function (p) {
        if (correct.indexOf(p) === -1) {
          card.querySelectorAll(".opts li")[p].classList.add("wrong");
        }
      });
      card.querySelector(".explain").classList.add("show");
      var mark = document.createElement("span");
      mark.className = "mark " + (isRight ? "mark-right" : "mark-wrong");
      mark.textContent = isRight ? "✓ 正确" : "✗ 错误";
      card.querySelector(".q-text").appendChild(mark);
    });
    return { right: right, total: total };
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("quizRoot");
    if (!root) return;
    var scoreBox = document.getElementById("quizScore");
    var submit = document.getElementById("quizSubmit");
    var reset = document.getElementById("quizReset");

    render(root);
    if (!flat.length) return;
    buildPager(root);
    showPage(0, root);

    submit.addEventListener("click", function () {
      var unselected = 0;
      root.querySelectorAll(".quiz-q").forEach(function (card) {
        if (!card.querySelector(".opts li.selected")) unselected++;
      });
      if (unselected > 0) {
        if (!confirm("还有 " + unselected + " 题未作答，确定交卷？（可用上一题/下一题检查未答题目）")) return;
      }
      var r = score(root);
      scoreBox.textContent = "得分：" + r.right + " / " + r.total + " 分";
      submit.disabled = true;
      reset.disabled = false;
      if (pager) {
        var prevBtn = pager.querySelector(".q-prev");
        var nextBtn = pager.querySelector(".q-next");
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
      }
      scoreBox.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    reset.addEventListener("click", function () {
      root.querySelectorAll(".quiz-q").forEach(function (card) {
        card.querySelectorAll(".opts li").forEach(function (li) {
          li.classList.remove("selected", "correct", "wrong", "disabled");
        });
        card.querySelector(".explain").classList.remove("show");
        var mark = card.querySelector(".q-text .mark");
        if (mark) mark.remove();
      });
      scoreBox.textContent = "得分：--";
      submit.disabled = false;
      reset.disabled = true;
      if (pager) {
        var prevBtn = pager.querySelector(".q-prev");
        var nextBtn = pager.querySelector(".q-next");
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;
      }
      showPage(0, root);
    });
  });
})();
