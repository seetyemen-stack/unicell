/* =========================================================
   app.js — تشغيل الموقع
   - Header يظهر فقط في الصفحة الرئيسية (الأقسام)
   - القائمة: الضغط على الصورة تشغيل/إيقاف (Preview)
   - زر اشتراك في القائمة: يفتح التفاصيل
   - التفاصيل: الضغط على الصورة تشغيل/إيقاف
   ========================================================= */

(function () {
  const $ = (id) => document.getElementById(id);

  // Footer year
  const yearEl = $("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header (home only)
  const homeHeader = $("homeHeader");

  // Views
  const views = {
    categories: $("viewCategories"),
    list: $("viewList"),
    details: $("viewDetails"),
  };

  // Nodes
  const categoriesGrid = $("categoriesGrid");
  const listGrid = $("listGrid");
  const listTitle = $("listTitle");

  const detailsName = $("detailsName");
  const detailsImage = $("detailsImage");
  const detailsAudio = $("detailsAudio");
  const mediaToggle = $("mediaToggle");

  const subsGrid = $("subsGrid");
  const toast = $("toast");

  const btnBackToCategories = $("btnBackToCategories");
  const btnBackToList = $("btnBackToList");

  // Data
  const CATEGORIES = window.CATEGORIES || [];
  const RINGTONES = window.RINGTONES || [];
  const COMPANIES = window.COMPANIES || [];
  const SERVICE_NUMBERS = window.SERVICE_NUMBERS || {};

  // State
  let currentCategory = null;
  let currentList = [];

  // Preview audio in list (single shared instance to avoid overlap)
  const previewAudio = new Audio();
  let previewPlayingId = null;

  // Toast
  let toastTimer = null;
  function toastMsg(msg) {
    if (!toast) return;
    toast.textContent = msg || "";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.textContent = ""), 2500);
  }

  function safe(s) { return (s ?? "").toString(); }

  // Ensure fixed service numbers
  function normalizeRingtone(r) {
    const codes = r.codes || {};
    for (const k of Object.keys(SERVICE_NUMBERS)) {
      if (!codes[k]) codes[k] = {};
      // لا نحتاج تخزين الرقم داخل النغمة — لكن نسمح إن وجد
    }
    r.codes = codes;
    return r;
  }
  const R = RINGTONES.map(normalizeRingtone);

  function showView(name) {
    Object.values(views).forEach((v) => v && v.classList.add("hidden"));
    if (views[name]) views[name].classList.remove("hidden");

    // Header يظهر فقط في الصفحة الرئيسية
    if (homeHeader) {
      homeHeader.style.display = (name === "categories") ? "" : "none";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ===============================
  // History (Back/Swipe = previous view)
  // ===============================
  const VIEW_KEY_TO_HASH = (k) => "#" + k;

  function pushView(name) {
    // سجّل الانتقال حتى يعمل زر الرجوع/السحب بشكل صحيح
    history.pushState({ view: name }, "", VIEW_KEY_TO_HASH(name));
    showView(name);
  }

  // تهيئة أول تحميل: نضع حالة ابتدائية حتى لا يخرج مباشرة
  (function initHistory() {
    const start = (location.hash || "").replace("#", "") || "categories";
    history.replaceState({ view: start }, "", VIEW_KEY_TO_HASH(start));
    showView(start);
  })();

  // عند الرجوع (زر الهاتف أو السحب)
  window.addEventListener("popstate", (e) => {
    const name = (e.state && e.state.view) || "categories";
    showView(name);
  });

  // ---------- Categories ----------
  function renderCategories() {
    if (!categoriesGrid) return;
    categoriesGrid.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const div = document.createElement("div");
      div.className = "card category-card";
      div.setAttribute("role", "button");
      div.tabIndex = 0;
      div.innerHTML = `<div class="category-title">${safe(cat)}</div>`;

      const open = () => openCategory(cat);
      div.addEventListener("click", open);
      div.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open();
      });

      categoriesGrid.appendChild(div);
    });
  }

  // ---------- List ----------
  function getCategoryRingtones(cat) {
    // يدوي 100%: لا فرز ولا تلقائي
    return R.filter((x) => x.category === cat);
  }

  function stopPreview() {
    try { previewAudio.pause(); } catch {}
    previewAudio.currentTime = 0;
    previewPlayingId = null;
  }

  function toneCard(t) {
    const div = document.createElement("div");
    div.className = "tone-card";

    div.innerHTML = `
      <div class="tone-thumb-wrap">
        <img class="tone-thumb" src="${t.image}" alt="${safe(t.title)}"
             onerror="this.src='ringtones/images/placeholder.png'">
      </div>

      <div class="tone-name">${safe(t.title)}</div>

      <div class="tone-actions">
        <button class="btn btn-soft tone-subscribe" type="button">اشتراك</button>
      </div>
    `;

    const img = div.querySelector(".tone-thumb");
    const btn = div.querySelector(".tone-subscribe");

    // تشغيل/إيقاف من الصورة (Preview)
    img.addEventListener("click", async () => {
      try {
        // إذا كانت نفس النغمة شغالة -> إيقاف
        if (previewPlayingId === t.id && !previewAudio.paused) {
          stopPreview();
          return;
        }

        // إيقاف أي نغمة سابقة
        stopPreview();

        previewAudio.src = t.audio;
        previewPlayingId = t.id;
        await previewAudio.play();
      } catch {
        stopPreview();
        toastMsg("تعذر تشغيل الصوت (تحقق من ملف الصوت).");
      }
    });

    // زر اشتراك -> تفاصيل
    btn.addEventListener("click", () => {
      stopPreview();          // توقف أي معاينة قبل الدخول للتفاصيل
      openDetails(t.id);
    });

    return div;
  }

  function renderList(items) {
    if (!listGrid) return;
    listGrid.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "card";
      empty.style.padding = "14px";
      empty.style.textAlign = "center";
      empty.innerHTML = `
        <div style="font-weight:900">لا توجد نغمات في هذا القسم</div>
        <div style="color:rgba(255,255,255,.80);margin-top:6px;font-size:13px">أضف نغمات من ملف data.js</div>
      `;
      listGrid.appendChild(empty);
      return;
    }

    items.forEach((t) => listGrid.appendChild(toneCard(t)));
  }

  function openCategory(cat) {
    currentCategory = cat;
    currentList = getCategoryRingtones(cat);

    if (listTitle) listTitle.textContent = cat;

    renderList(currentList);
    pushView("list"); // ✅ بدل showView("list")
  }

  // ---------- Details ----------
  function setDetailsPlaying(isPlaying) {
    if (!mediaToggle) return;
    mediaToggle.classList.toggle("is-playing", !!isPlaying);
    mediaToggle.dataset.playing = isPlaying ? "1" : "0";
  }

  async function toggleDetailsPlay() {
    const isPlaying = mediaToggle?.dataset.playing === "1";
    try {
      if (isPlaying) {
        detailsAudio.pause();
        setDetailsPlaying(false);
      } else {
        await detailsAudio.play();
        setDetailsPlaying(true);
      }
    } catch {
      setDetailsPlaying(false);
      toastMsg("تعذر تشغيل الصوت (تحقق من ملف الصوت).");
    }
  }

  function makeSmsLink(number, body) {
    const enc = encodeURIComponent(body);
    return `sms:${number}?&body=${enc}`;
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      return true;
    }
  }

  function renderSubscriptions(t) {
    if (!subsGrid) return;
    subsGrid.innerHTML = "";

    COMPANIES.forEach((c) => {
      const cfg = (t.codes || {})[c.key] || {};
      const number = SERVICE_NUMBERS[c.key] || "";
      const code = cfg.code || "";

      const item = document.createElement("div");
      item.className = "sub-item";
      item.innerHTML = `
        <div class="sub-left">
          <img class="company-logo" src="${c.logo}" alt="${safe(c.name)}" onerror="this.style.display='none'">
          <div class="company-info">
            <div class="company-name">${safe(c.name)}</div>
            <div class="company-code">الرقم: <span class="mono">${safe(number)}</span> — الكود: <span class="mono">${safe(code)}</span></div>
          </div>
        </div>
        <button class="btn" type="button">اشتراك</button>
      `;

      item.querySelector("button").addEventListener("click", async () => {
        if (!number || !code) {
          toastMsg("ضع كود الاشتراك لهذه الشركة داخل data.js");
          return;
        }
        window.location.href = makeSmsLink(number, code);

        // Copy fallback
        setTimeout(async () => {
          await copyToClipboard(code);
          toastMsg("تم نسخ الكود للحافظة: " + code);
        }, 550);
      });

      subsGrid.appendChild(item);
    });
  }

  function openDetails(id) {
    const t = R.find((x) => x.id === id);
    if (!t) return;

    // توقف أي تشغيل سابق في التفاصيل
    try { detailsAudio.pause(); } catch {}
    setDetailsPlaying(false);

    if (detailsName) detailsName.textContent = t.title;

    if (detailsImage) {
      detailsImage.src = t.image;
      detailsImage.onerror = () => (detailsImage.src = "ringtones/images/placeholder.png");
    }

    if (detailsAudio) detailsAudio.src = t.audio;

    toastMsg("");
    renderSubscriptions(t);
    pushView("details"); // ✅ بدل showView("details")
  }

  // ---------- Bindings ----------
  if (btnBackToCategories) {
    btnBackToCategories.addEventListener("click", () => {
      stopPreview();
      history.back(); // ✅ بدل showView("categories")
    });
  }

  if (btnBackToList) {
    btnBackToList.addEventListener("click", () => {
      try { detailsAudio.pause(); } catch {}
      setDetailsPlaying(false);
      history.back(); // ✅ بدل showView("list")
    });
  }

  if (mediaToggle) {
    mediaToggle.addEventListener("click", toggleDetailsPlay);
    mediaToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") toggleDetailsPlay();
    });
  }

  if (detailsAudio) {
    detailsAudio.addEventListener("ended", () => setDetailsPlaying(false));
    detailsAudio.addEventListener("pause", () => setDetailsPlaying(false));
  }

  // Start
  renderCategories();
  // لا نحتاج showView هنا لأن initHistory() قام بعرض الصفحة المناسبة
})();