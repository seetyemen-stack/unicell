/* =========================================================
   app.js — تشغيل الموقع
   - Header يظهر فقط في الصفحة الرئيسية (الأقسام)
   - القائمة: تشغيل/إيقاف من زر التشغيل فقط (Preview)
   - زر اشتراك في القائمة: يفتح التفاصيل
   - التفاصيل: الضغط على الصورة تشغيل/إيقاف (كما هو)
   - إصلاح مهم: عند تحديث الصفحة داخل list/details لا تختفي البيانات
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
    history.pushState({ view: name }, "", VIEW_KEY_TO_HASH(name));
    showView(name);
  }

  function stopPreview() {
    try { previewAudio.pause(); } catch {}
    previewAudio.currentTime = 0;
    previewPlayingId = null;
  }

  // عند الرجوع (زر الهاتف أو السحب)
  window.addEventListener("popstate", (e) => {
    stopPreview();
    try { detailsAudio.pause(); } catch {}
    setDetailsPlaying(false);

    const name = (e.state && e.state.view) || "categories";
    showView(name);

    // ✅ إذا رجع لصفحة القائمة: ارسم آخر قسم محفوظ
    if (name === "list") {
      const cat = sessionStorage.getItem("lastCategory");
      if (cat) openCategory(cat, true);
    }

    // ✅ إذا رجع للتفاصيل: ارسم آخر نغمة محفوظة
    if (name === "details") {
      const id = sessionStorage.getItem("lastDetailsId");
      if (id) openDetails(id, true);
    }
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

  function setPlayIcon(btn, isPlaying) {
    if (!btn) return;
    btn.classList.toggle("is-playing", !!isPlaying);
    btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    btn.textContent = isPlaying ? "❚❚" : "▶";
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
        <button class="btn btn-soft tone-play" type="button" aria-label="تشغيل/إيقاف">▶</button>
        <button class="btn btn-soft tone-subscribe" type="button">اشتراك</button>
      </div>
    `;

    const playBtn = div.querySelector(".tone-play");
    const subBtn = div.querySelector(".tone-subscribe");

    // ✅ تشغيل/إيقاف من زر التشغيل فقط (وليس الصورة)
    playBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      try {
        // نفس النغمة شغالة -> إيقاف
        if (previewPlayingId === t.id && !previewAudio.paused) {
          stopPreview();
          setPlayIcon(playBtn, false);
          playBtn.blur(); // ✅ إزالة focus (يقلل أي إطار/لون)
          return;
        }

        // إيقاف أي نغمة سابقة + تحديث أي أزرار قديمة
        stopPreview();
        // (لو كان فيه زر سابق مفعّل داخل كارد آخر، المتصفح سيعيد رسمه عند إعادة renderList، لكن هنا نحدّث الحالي)
        previewAudio.src = t.audio;
        previewPlayingId = t.id;
        await previewAudio.play();

        setPlayIcon(playBtn, true);
        playBtn.blur(); // ✅
      } catch {
        stopPreview();
        setPlayIcon(playBtn, false);
        playBtn.blur(); // ✅
        toastMsg("تعذر تشغيل الصوت (تحقق من ملف الصوت).");
      }
    });

    // عند انتهاء الصوت: رجّع زر التشغيل
    previewAudio.addEventListener("ended", () => {
      // فقط لو هذه هي نفس النغمة
      if (previewPlayingId === t.id) {
        previewPlayingId = null;
        setPlayIcon(playBtn, false);
      }
    });

    // زر اشتراك -> تفاصيل
    subBtn.addEventListener("click", () => {
      stopPreview();
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

  // ✅ openCategory مع خيار بدون push (للاسترجاع عند التحديث)
  function openCategory(cat, noPush) {
    currentCategory = cat;
    currentList = getCategoryRingtones(cat);

    // ✅ حفظ آخر قسم لعدم فقدانه عند Refresh
    sessionStorage.setItem("lastCategory", cat);

    if (listTitle) listTitle.textContent = cat;
    renderList(currentList);

    if (noPush) {
      showView("list");
    } else {
      pushView("list");
    }
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

        // أوقف صوت التفاصيل قبل الانتقال للـ SMS
        try { detailsAudio.pause(); } catch {}
        setDetailsPlaying(false);

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

  // ✅ openDetails مع خيار بدون push (للاسترجاع عند التحديث)
  function openDetails(id, noPush) {
    const t = R.find((x) => String(x.id) === String(id));
    if (!t) return;

    // ✅ حفظ آخر تفاصيل لعدم فقدانه عند Refresh
    sessionStorage.setItem("lastDetailsId", String(id));

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

    if (noPush) {
      showView("details");
    } else {
      pushView("details");
    }
  }

  // ===============================
  // Init History + Restore on Refresh
  // ===============================
  (function initHistory() {
    const start = (location.hash || "").replace("#", "") || "categories";
    history.replaceState({ view: start }, "", VIEW_KEY_TO_HASH(start));

    // ✅ استرجاع صحيح عند Refresh
    if (start === "list") {
      const cat = sessionStorage.getItem("lastCategory");
      if (cat) {
        openCategory(cat, true);
        return;
      }
      showView("categories");
      return;
    }

    if (start === "details") {
      const id = sessionStorage.getItem("lastDetailsId");
      if (id) {
        openDetails(id, true);
        return;
      }
      showView("categories");
      return;
    }

    showView(start);
  })();

  // ---------- Bindings ----------
  if (btnBackToCategories) {
    btnBackToCategories.addEventListener("click", () => {
      stopPreview();
      history.back();
    });
  }

  if (btnBackToList) {
    btnBackToList.addEventListener("click", () => {
      try { detailsAudio.pause(); } catch {}
      setDetailsPlaying(false);
      history.back();
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
})();
