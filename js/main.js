// 通用脚本：导航高亮、页脚年份、学习打卡（localStorage）、站内搜索、进度条

document.addEventListener("DOMContentLoaded", function () {
  // 页脚年份
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // 导航当前页高亮
  var path = location.pathname.split("/").pop();
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    var href = a.getAttribute("href").split("/").pop();
    if (href.indexOf("javascript:") === 0) return;
    if (href === path) a.classList.add("active");
    if (path === "" && href === "index.html") a.classList.add("active");
  });
  // 当前页在子菜单中时，自动展开下拉
  document.querySelectorAll(".site-nav .dropdown").forEach(function (dd) {
    if (dd.querySelector("a.active")) dd.classList.add("open");
    var toggle = dd.querySelector(".drop-toggle");
    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        dd.classList.toggle("open");
      });
    }
  });
  // 分组页面（如 mock-zonghe → mock）自动高亮父入口并展开下拉
  document.querySelectorAll(".site-nav a[data-group]").forEach(function (a) {
    var page = document.body.dataset.page || "";
    if (page.indexOf(a.dataset.group + "-") === 0) {
      a.classList.add("active");
      var dd = a.closest(".dropdown");
      if (dd) dd.classList.add("open");
    }
  });

  // 学习打卡 + 进度
  var storeKey = "yaoshi-check-" + (document.body.dataset.page || "index");
  var boxes = document.querySelectorAll(".checklist input[type=checkbox]");
  var fill = document.querySelector(".progress-fill");
  var text = document.querySelector(".progress-text");

  function countDone() {
    return document.querySelectorAll(".checklist input[type=checkbox]:checked").length;
  }
  function save() {
    var state = {};
    boxes.forEach(function (b) { state[b.dataset.k] = b.checked; });
    try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch (e) {}
    updateUI();
  }
  function load() {
    try {
      var state = JSON.parse(localStorage.getItem(storeKey) || "{}");
      boxes.forEach(function (b) {
        if (state[b.dataset.k]) b.checked = true;
        b.closest("li").classList.toggle("done", b.checked);
      });
    } catch (e) {}
  }
  function updateUI() {
    if (!fill || !text) return;
    var total = boxes.length;
    var done = countDone();
    var pct = total ? Math.round(done / total * 100) : 0;
    fill.style.width = pct + "%";
    text.textContent = "进度：" + done + " / " + total + "（" + pct + "%）";
  }
  boxes.forEach(function (b) {
    b.addEventListener("change", function () {
      b.closest("li").classList.toggle("done", b.checked);
      save();
    });
  });
  load();
  updateUI();

  // 站内搜索：按关键词过滤资料卡片与折叠面板
  var search = document.getElementById("siteSearch");
  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll("[data-search]").forEach(function (el) {
        var hay = (el.textContent || "").toLowerCase();
        el.style.display = q && hay.indexOf(q) === -1 ? "none" : "";
      });
    });
  }
});
