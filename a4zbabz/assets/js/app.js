/* a4zbabz · 页面脚本（无依赖）
 * 根据页面上存在的容器自动渲染对应内容。
 */

(function () {
  "use strict";

  var SITE = window.SITE || { works: [], notes: [] };

  /* ---------------- 小工具 ---------------- */
  function h(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") e.className = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else if (k === "text") e.textContent = attrs[k];
        else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(d) {
    var p = String(d || "").split("-");
    if (p.length !== 3) return d || "";
    return p[0] + " 年 " + Number(p[1]) + " 月 " + Number(p[2]) + " 日";
  }

  /* ---------------- Markdown（够用的子集） ---------------- */
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function mdToHtml(md) {
    var lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    var out = [];
    var inCode = false;
    var inList = false;
    var buf = [];

    function flushP() {
      if (buf.length) {
        out.push("<p>" + inline(buf.join(" ")) + "</p>");
        buf = [];
      }
    }
    function closeList() {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
    }

    lines.forEach(function (raw) {
      var line = raw;
      if (/^```/.test(line.trim())) {
        flushP();
        closeList();
        if (!inCode) {
          out.push("<pre><code>");
          inCode = true;
        } else {
          out.push("</code></pre>");
          inCode = false;
        }
        return;
      }
      if (inCode) {
        out.push(esc(line));
        return;
      }
      if (/^##\s+/.test(line)) {
        flushP();
        closeList();
        out.push("<h2>" + inline(line.replace(/^##\s+/, "")) + "</h2>");
        return;
      }
      if (/^[-*]\s+/.test(line)) {
        flushP();
        if (!inList) {
          out.push("<ul>");
          inList = true;
        }
        out.push("<li>" + inline(line.replace(/^[-*]\s+/, "")) + "</li>");
        return;
      }
      if (line.trim() === "") {
        flushP();
        closeList();
        return;
      }
      buf.push(line.trim());
    });
    flushP();
    closeList();
    if (inCode) out.push("</code></pre>");
    return out.join("\n");
  }

  /* ---------------- 作品卡片 ---------------- */
  function workCard(w) {
    var chips = h("div", { class: "chips" }, [
      h("span", { class: "chip chip--platform", text: w.platform }),
    ]);
    (w.tags || []).forEach(function (t) {
      chips.appendChild(h("span", { class: "chip chip--tag", text: t }));
    });

    var foot = h("div", { class: "work-foot" }, [
      h("span", { class: "status", "data-s": w.status, text: w.status }),
      h("span", {
        class: "meta",
        text: (w.version ? "v" + w.version + " / " : "") + w.updated,
      }),
    ]);

    var title = h("h3", { text: w.name });
    if (w.link) {
      title = h("h3", {}, [h("a", { href: w.link, text: w.name })]);
    }

    return h("article", { class: "work" }, [
      h("div", { class: "work-top" }, [
        h("img", { src: "assets/img/icon-" + w.id + ".svg", alt: "", loading: "lazy" }),
        h("div", {}, [title, h("p", { class: "tagline", text: w.tagline })]),
      ]),
      h("p", { class: "desc", text: w.desc }),
      chips,
      foot,
    ]);
  }

  function renderWorks(container, list) {
    container.innerHTML = "";
    list.forEach(function (w) {
      container.appendChild(workCard(w));
    });
  }

  /* ---------------- 笔记行 ---------------- */
  function noteRow(n) {
    var chips = h(
      "div",
      { class: "chips" },
      (n.tags || []).map(function (t) {
        return h("span", { class: "chip chip--tag", text: t });
      })
    );
    return h("article", { class: "note-row" }, [
      h("div", { class: "date", text: n.date }),
      h("div", {}, [
        h("h3", {}, [
          h("a", { href: "note.html?id=" + encodeURIComponent(n.slug), text: n.title }),
        ]),
        h("p", { class: "excerpt", text: n.excerpt }),
      ]),
      chips,
    ]);
  }

  function renderNotes(container, list) {
    container.innerHTML = "";
    if (!list.length) {
      container.appendChild(
        h("p", { class: "meta", style: "padding:24px 4px", text: "这个标签下还没有笔记。" })
      );
      return;
    }
    list.forEach(function (n) {
      container.appendChild(noteRow(n));
    });
  }

  /* ---------------- 筛选条 ---------------- */
  function buildFilters(host, values, onChange) {
    host.innerHTML = "";
    var all = ["全部"].concat(values);
    all.forEach(function (v) {
      var b = h("button", {
        class: "filter",
        type: "button",
        text: v,
        "aria-pressed": v === "全部" ? "true" : "false",
      });
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(host.querySelectorAll(".filter"), function (x) {
          x.setAttribute("aria-pressed", "false");
        });
        b.setAttribute("aria-pressed", "true");
        onChange(v);
      });
      host.appendChild(b);
    });
  }

  function uniq(arr) {
    var seen = {};
    return arr.filter(function (x) {
      if (seen[x]) return false;
      seen[x] = 1;
      return true;
    });
  }

  /* ---------------- Hero 货架 ---------------- */
  function renderShelf(host) {
    var list = (SITE.works || []).slice(0, 5);
    host.innerHTML = "";
    host.appendChild(h("p", { class: "shelf-label", text: "// 工作台" }));
    var grid = h("div", { class: "shelf-grid" });
    list.forEach(function (w, i) {
      if (i === 0) {
        grid.appendChild(
          h("div", { class: "shelf-item shelf-item--wide" }, [
            h("img", { src: "assets/img/icon-" + w.id + ".svg", alt: "" }),
            h("div", { style: "flex:1;min-width:0" }, [
              h("div", { class: "n", text: w.name }),
              h("div", { class: "p", text: w.platform + " / " + w.status }),
            ]),
            h("img", { class: "shelf-qr", src: "assets/img/qr-" + w.id + ".svg", alt: w.name + " 二维码（占位）" }),
          ])
        );
      } else {
        grid.appendChild(
          h("div", { class: "shelf-item" }, [
            h("img", { src: "assets/img/icon-" + w.id + ".svg", alt: "" }),
            h("div", { style: "min-width:0" }, [
              h("div", { class: "n", text: w.name }),
              h("div", { class: "p", text: w.platform }),
            ]),
          ])
        );
      }
    });
    host.appendChild(grid);
  }

  /* ---------------- 导航高亮 ---------------- */
  function markNav() {
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    Array.prototype.forEach.call(document.querySelectorAll(".site-nav a"), function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      if (href === here || (here === "note.html" && href === "notes.html")) {
        a.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------- 启动 ---------------- */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    markNav();

    var shelf = document.getElementById("hero-shelf");
    if (shelf) renderShelf(shelf);

    var featured = document.getElementById("featured-works");
    if (featured) renderWorks(featured, (SITE.works || []).slice(0, 3));

    var allWorks = document.getElementById("all-works");
    if (allWorks) {
      var platforms = uniq((SITE.works || []).map(function (w) { return w.platform; }));
      var filterHost = document.getElementById("work-filters");
      var countHost = document.getElementById("work-count");
      function apply(v) {
        var list = (SITE.works || []).filter(function (w) {
          return v === "全部" || w.platform === v;
        });
        renderWorks(allWorks, list);
        if (countHost) countHost.textContent = list.length + " / " + (SITE.works || []).length;
      }
      if (filterHost) buildFilters(filterHost, platforms, apply);
      apply("全部");
    }

    var latestNotes = document.getElementById("latest-notes");
    if (latestNotes) renderNotes(latestNotes, (SITE.notes || []).slice(0, 3));

    var allNotes = document.getElementById("all-notes");
    if (allNotes) {
      var tags = uniq(
        (SITE.notes || []).reduce(function (a, n) { return a.concat(n.tags || []); }, [])
      );
      var nf = document.getElementById("note-filters");
      var nc = document.getElementById("note-count");
      function applyN(v) {
        var list = (SITE.notes || []).filter(function (n) {
          return v === "全部" || (n.tags || []).indexOf(v) !== -1;
        });
        renderNotes(allNotes, list);
        if (nc) nc.textContent = list.length + " / " + (SITE.notes || []).length;
      }
      if (nf) buildFilters(nf, tags, applyN);
      applyN("全部");
    }

    var article = document.getElementById("note-article");
    if (article) {
      var id = new URLSearchParams(location.search).get("id");
      var note = (SITE.notes || []).filter(function (n) { return n.slug === id; })[0];
      if (!note) {
        article.innerHTML =
          '<p class="lead">没有找到这篇笔记。<a href="notes.html">回到笔记列表 →</a></p>';
      } else {
        document.title = note.title + " · " + (SITE.owner || "a4zbabz");
        article.innerHTML =
          '<header><a class="back" href="notes.html">← 全部笔记</a>' +
          "<h1>" + esc(note.title) + "</h1>" +
          '<div class="meta">' + esc(fmtDate(note.date)) + "</div></header>" +
          '<div class="prose">' + mdToHtml(note.content) + "</div>";
      }
    }

    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  });
})();
