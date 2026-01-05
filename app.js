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
  const listSearchWrap = $("listSearchWrap");
  const listSearchInput = $("listSearchInput");

  const detailsName = $("detailsName");
  const detailsImage = $("detailsImage");
  const detailsAudio = $("detailsAudio");
  let detailsAutoStopTimer = null;
  function clearDetailsAutoStop(){ if(detailsAutoStopTimer){ clearTimeout(detailsAutoStopTimer); detailsAutoStopTimer=null; } }
  function armDetailsAutoStop() {
    if (!AUDIO_PREVIEW_LIMIT_ENABLED) return; clearDetailsAutoStop(); detailsAutoStopTimer = setTimeout(()=>{
    if(detailsAudio && !detailsAudio.paused){ try{ detailsAudio.pause(); }catch{} detailsAudio.currentTime=0; setDetailsPlaying(false); }
  }, PREVIEW_LIMIT_SECONDS*1000); }

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

  // أقسام "بالاسم" (لا تظهر في الأحدث + لها بحث + صورة تلقائية)
  const NAME_CATEGORIES = new Set(["أدعية بالاسم", "ردود آلية بالاسم"]);

  // State
  let currentCategory = null;
  let currentList = [];

  // Preview audio in list (single shared instance to avoid overlap)
  const previewAudio = new Audio();
  // تهيئة سريعة قدر الإمكان على الشبكات الضعيفة
  previewAudio.preload = "auto";
  let previewPlayingId = null;
  let previewPlayingBtn = null;
  let previewAutoStopTimer = null;
  const PREVIEW_LIMIT_SECONDS = 15;
  // ✅ تم تعطيل حد المدة داخل JavaScript — الاعتماد على قص الملفات الصوتية مسبقًا
  const AUDIO_PREVIEW_LIMIT_ENABLED = false;

  function clearPreviewAutoStop() {
    if (previewAutoStopTimer) {
      clearTimeout(previewAutoStopTimer);
      previewAutoStopTimer = null;
    }
  }

  function armPreviewAutoStop(expectedId) {
    clearPreviewAutoStop();
    previewAutoStopTimer = setTimeout(() => {
      // أوقف فقط لو ما زالت نفس النغمة هي التي تعمل
      if (previewPlayingId === expectedId && !previewAudio.paused) {
        try { previewAudio.pause(); } catch {}
        previewAudio.currentTime = 0;
        previewPlayingId = null;
        if (previewPlayingBtn) setPlayIcon(previewPlayingBtn, false);
      }
    }, PREVIEW_LIMIT_SECONDS * 1000);
  }
  // تنظيف عند الإيقاف/الخطأ
  previewAudio.addEventListener("pause", () => {
    clearPreviewAutoStop();
    if (previewPlayingBtn && previewAudio.paused) {
      // لا نغيّر الأيقونة هنا إلا إذا لم يعد لدينا تشغيل فعلي
      // (تتم إدارتها من stopPreview أو ended أو auto-stop)
    }
  });
  previewAudio.addEventListener("error", () => {
    clearPreviewAutoStop();
    previewPlayingId = null;
    if (previewPlayingBtn) setPlayIcon(previewPlayingBtn, false);
    previewPlayingBtn = null;
  });

  // عند انتهاء الصوت: رجّع زر التشغيل (مرة واحدة فقط)
  previewAudio.addEventListener("ended", () => {
    clearPreviewAutoStop();
    previewPlayingId = null;
    if (previewPlayingBtn) setPlayIcon(previewPlayingBtn, false);
    previewPlayingBtn = null;
  });


  // Toast
  let toastTimer = null;
  function toastMsg(msg) {
    if (!toast) return;
    toast.textContent = msg || "";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.textContent = ""), 2500);
  }

  function safe(s) { return (s ?? "").toString(); }

  // ---------- Normalize + ترتيب ----------
  function toArrayCategories(r) {
    // دعم توافق: category: "..." أو categories: ["...", ...]
    const cats = Array.isArray(r.categories)
      ? r.categories
      : (r.category ? [r.category] : []);
    // تنظيف + إزالة التكرارات
    return Array.from(new Set(cats.map((x) => safe(x).trim()).filter(Boolean)));
  }

  function ensureCodes(r) {
    const codes = r.codes || {};
    for (const k of Object.keys(SERVICE_NUMBERS)) {
      if (!codes[k]) codes[k] = {};
    }
    r.codes = codes;
    return r;
  }

  function makeStableId(r, idx) {
    const base = safe(r.id).trim();
    if (base) return base;
    const t = safe(r.title).trim() || "tone";
    return (
      t
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\u0600-\u06FFa-z0-9\-]/gi, "")
        .slice(0, 40) +
      "-" +
      (idx + 1)
    );
  }

  function ensureUniqueIds(list) {
    const seen = new Map();
    list.forEach((r, i) => {
      r.id = makeStableId(r, i);
      const key = String(r.id);
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
      if (n > 1) r.id = key + "-" + n; // ✅ يمنع تعارض التفاصيل/التشغيل
    });
    return list;
  }

  function parseDate(v) {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  function buildAutoNameImage(text) {
    // صورة تلقائية لأقسام (بالاسم): بطاقة رمادي فاتح + إطار ناعم + اسم كبير فقط
    const raw = safe(text).trim() || "";

    // نريد الاسم فقط بدون (دعاء/رد/رد آلي) في بداية العنوان
    const title = raw
      .replace(/^\s*دعاء\s+/u, "")
      .replace(/^\s*رد\s*آلي(?:ه)?\s+/u, "")
      .replace(/^\s*رد\s+/u, "")
      .trim();

    const size = 900;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "ringtones/images/placeholder.png";

    // حاول تحميل خط عربي جميل (إنترنت) مرة واحدة — وإن لم يتوفر نستخدم بدائل النظام
    try {
      if (!document.getElementById("cairo-font-link")) {
        const link = document.createElement("link");
        link.id = "cairo-font-link";
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&display=swap";
        document.head.appendChild(link);
      }
    } catch (_) {}

    // ألوان البطاقة
    const bg = "#f2f2f2";
    const border = "#d6d6d6";
    const textColor = "#222";

    // خلفية
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // دالة رسم مستطيل بزوايا دائرية
    function roundRect(x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    // إطار داخلي ناعم (Card)
    const margin = 60;
    const radius = 26;
    const innerX = margin;
    const innerY = margin;
    const innerW = size - margin * 2;
    const innerH = size - margin * 2;

    // ظل خفيف جدًا للإطار (فخامة بدون مبالغة)
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.08)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    roundRect(innerX, innerY, innerW, innerH, radius);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.restore();

    // حد الإطار
    roundRect(innerX, innerY, innerW, innerH, radius);
    ctx.strokeStyle = border;
    ctx.lineWidth = 6;
    ctx.stroke();

    // إعدادات النص
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";

    // مساحة النص (داخل الإطار)
    const pad = 90;
    const maxWidth = innerW - pad * 2;

    // خط عربي مناسب للأسماء + بدائل قوية
    const fontStack = "Cairo, Tajawal, 'Noto Naskh Arabic', 'Amiri', Tahoma, Arial, sans-serif";

    // تكبير الاسم: يبدأ كبير جدًا ثم يصغر حتى يناسب العرض
    let fontSize = 210;
    const minSize = 70;
    while (fontSize > minSize) {
      ctx.font = `900 ${fontSize}px ${fontStack}`;
      if (ctx.measureText(title).width <= maxWidth) break;
      fontSize -= 3;
    }

    // ظل بسيط للنص لزيادة الوضوح
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.12)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // إذا الاسم طويل جدًا نقسمه لسطرين
    const words = title.split(/\s+/).filter(Boolean);
    if (ctx.measureText(title).width > maxWidth && words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(" ");
      const line2 = words.slice(mid).join(" ");
      ctx.font = `900 ${fontSize}px ${fontStack}`;
      ctx.fillText(line1, size / 2, size / 2 - fontSize * 0.55);
      ctx.fillText(line2, size / 2, size / 2 + fontSize * 0.55);
    } else {
      ctx.font = `900 ${fontSize}px ${fontStack}`;
      ctx.fillText(title, size / 2, size / 2);
    }
    ctx.restore();

    try {
      return canvas.toDataURL("image/png");
    } catch {
      return "ringtones/images/placeholder.png";
    }
  }

function normalizeRingtone(r, idx) {
    const out = { ...r };
    out.categories = toArrayCategories(out);
    delete out.category; // منع الالتباس
    out._createdIndex = idx; // fallback للفرز

    // createdAt اختياري: إن لم يوجد سيُستخدم ترتيب الإدخال
    const d = parseDate(out.createdAt);
    out._createdAtMs = d ? d.getTime() : null;

    // rank اختياري: رقم ترتيب يدوي (كل ما كان أصغر = أعلى)
    // يمكن أن يكون رقمًا عامًا أو كائنًا حسب القسم {"زوامل": 1, "الأكثر تحميلًا": 3}
    out.rank = out.rank ?? null;

    // صورة تلقائية للأقسام بالاسم (إذا لم تُحدد صورة أو كانت AUTO)
    const isNameCat = out.categories.some((c) => NAME_CATEGORIES.has(c));
    if (isNameCat) {
      if (!out.image || String(out.image).toUpperCase() === "AUTO") {
        out.image = buildAutoNameImage(out.title);
      }
    }

    ensureCodes(out);
    return out;
  }

  const R = ensureUniqueIds(RINGTONES.map((r, i) => normalizeRingtone(r, i)));

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
    clearPreviewAutoStop();
    try { previewAudio.pause(); } catch {}
    previewAudio.currentTime = 0;
    previewPlayingId = null;
    if (previewPlayingBtn) setPlayIcon(previewPlayingBtn, false);
    previewPlayingBtn = null;
  }

  function stopAllAudio() {
    stopPreview();
    try { detailsAudio.pause(); } catch {}
    try { detailsAudio.currentTime = 0; } catch {}
    clearDetailsAutoStop();
    setDetailsPlaying(false);
  }

  // أوقف الصوت عند الخروج/فتح رابط خارجي/إخفاء الصفحة
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAllAudio();
  });
  window.addEventListener("pagehide", () => stopAllAudio());
  window.addEventListener("beforeunload", () => stopAllAudio());

  // أي رابط تواصل / اتصالات / روابط تفتح تبويب جديد
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a");
    if (!a) return;
    const href = (a.getAttribute("href") || "").trim().toLowerCase();
    const inFooter = !!a.closest("footer");
    const isExternal = a.target === "_blank";
    const isContact = href.startsWith("tel:") || href.startsWith("mailto:") || href.includes("wa.me") || href.includes("whatsapp") || href.includes("t.me") || href.includes("telegram") || href.includes("facebook") || href.includes("instagram") || href.includes("tiktok") || href.includes("x.com") || href.includes("twitter");
    if (inFooter || isExternal || isContact) stopAllAudio();
  }, true);

  // عند الرجوع (زر الهاتف أو السحب)
  window.addEventListener("popstate", (e) => {
    stopPreview();
    try { detailsAudio.pause(); } catch {}
    detailsAudio.currentTime = 0;
    clearDetailsAutoStop();
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
  function getRankForCategory(t, cat) {
    if (t.rank == null) return null;
    if (typeof t.rank === "number") return t.rank;
    if (typeof t.rank === "object" && t.rank) {
      const v = t.rank[cat];
      if (v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function sortForCategory(list, cat) {
    return [...list].sort((a, b) => {
      const ra = getRankForCategory(a, cat);
      const rb = getRankForCategory(b, cat);
      if (ra != null && rb != null && ra !== rb) return ra - rb;
      if (ra != null && rb == null) return -1;
      if (ra == null && rb != null) return 1;

      // ✅ الافتراضي: لو ما فيه createdAt اعتبر ترتيب الملف (الأعلى أحدث)
      const da = (a._createdAtMs ?? -a._createdIndex);
      const db = (b._createdAtMs ?? -b._createdIndex);
      return db - da; // الأحدث أولاً
    });
  }

  function isExcludedFromLatest(t) {
    return t.categories.some((c) => NAME_CATEGORIES.has(c));
  }

  function primaryCategoryForLatest(t) {
    // إظهار اسم القسم تحت الاسم في "الأحدث" (مع تجاهل الأحدث/الأكثر تحميلًا)
    const skip = new Set(["الأحدث", "الأكثر تحميلًا"]);
    const c = t.categories.find((x) => !skip.has(x));
    return c || null;
  }

  function getCategoryRingtones(cat) {
    // ✅ "الأحدث" تلقائي: كل الأقسام ما عدا الأقسام بالاسم
    if (cat === "الأحدث") {
      const list = R.filter((t) => !isExcludedFromLatest(t));
      return sortForCategory(list, cat);
    }

    // باقي الأقسام: حسب التصنيف (يدعم تعدد الأقسام)
    const list = R.filter((t) => t.categories.includes(cat));
    return sortForCategory(list, cat);
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

    const metaParts = [];
    // ✅ في الأحدث: أظهر اسم القسم بين قوسين تحت الاسم
    if (currentCategory === "الأحدث") {
      const c = primaryCategoryForLatest(t);
      if (c) metaParts.push(`(${c})`);
    }
    const metaLine = metaParts.length ? `<div class="tone-meta">${metaParts.join(" ")}</div>` : "";

    div.innerHTML = `
      <div class="tone-thumb-wrap">
        <img class="tone-thumb" src="${t.image}" alt="${safe(t.title)}"
             onerror="this.src='ringtones/images/placeholder.png'">
      </div>

      <div class="tone-name">${safe(t.title)}</div>
      ${metaLine}

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

        previewPlayingId = t.id;
        previewPlayingBtn = playBtn;

        // ✅ شغّل فورًا عند الضغط (لا تنتظر canplaythrough)
        previewAudio.src = t.audio;

        const tryPlay = () =>
          previewAudio.play().then(() => {
            setPlayIcon(playBtn, true);
          }).catch(() => {
            // fallback: جرّب بعد جاهزية أبسط (canplay) بدل canplaythrough
            const onCanPlay = () => {
              previewAudio.removeEventListener("canplay", onCanPlay);
              previewAudio.play().then(() => {
                setPlayIcon(playBtn, true);
              }).catch(() => {
                stopPreview();
                setPlayIcon(playBtn, false);
              });
            };
            previewAudio.addEventListener("canplay", onCanPlay, { once: true });
            try { previewAudio.load(); } catch {}
          });

        tryPlay();
        playBtn.blur(); // ✅
      } catch {
        stopPreview();
        setPlayIcon(playBtn, false);
        playBtn.blur(); // ✅
        toastMsg("تعذر تشغيل الصوت (تحقق من ملف الصوت).");
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

  function setSearchEnabled(isEnabled) {
    if (!listSearchWrap || !listSearchInput) return;
    listSearchWrap.classList.toggle("hidden", !isEnabled);
    if (!isEnabled) {
      listSearchInput.value = "";
    }
  }

  function applySearchFilter() {
    if (!listSearchInput) return;
    const q = safe(listSearchInput.value).trim();
    if (!q) {
      renderList(currentList);
      return;
    }
    const qq = q.toLowerCase();
    const filtered = currentList.filter((t) => safe(t.title).toLowerCase().includes(qq));
    renderList(filtered);
  }

  // ✅ openCategory مع خيار بدون push (للاسترجاع عند التحديث)
  function openCategory(cat, noPush) {
    currentCategory = cat;
    currentList = getCategoryRingtones(cat);

    // ✅ حفظ آخر قسم لعدم فقدانه عند Refresh
    sessionStorage.setItem("lastCategory", cat);

    if (listTitle) listTitle.textContent = cat;
    // ✅ تفعيل البحث فقط في الأقسام بالاسم
    const enableSearch = NAME_CATEGORIES.has(cat);
    setSearchEnabled(enableSearch);
    renderList(currentList);
    if (enableSearch) {
      // bind once
      if (!listSearchInput.dataset.bound) {
        listSearchInput.dataset.bound = "1";
        listSearchInput.addEventListener("input", applySearchFilter);
        listSearchInput.addEventListener("search", applySearchFilter);
      }
      // إعادة تطبيق بعد تغيير القسم
      setTimeout(() => listSearchInput.focus(), 50);
    }

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
        detailsAudio.currentTime = 0;
        clearDetailsAutoStop();
        setDetailsPlaying(false);
      } else {
        detailsAudio.load();
        detailsAudio.play().catch(() => {});
        armDetailsAutoStop();
        setDetailsPlaying(true);
      }

  // عند انتهاء معاينة التفاصيل (20 ثانية أو نهاية الملف)
  if (detailsAudio) {
    detailsAudio.addEventListener("ended", () => {
      clearDetailsAutoStop();
      try { detailsAudio.currentTime = 0; } catch {}
      setDetailsPlaying(false);
    });
    detailsAudio.addEventListener("pause", () => {
      clearDetailsAutoStop();
    });
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
            <div class="company-meta">
              <div class="company-number">الرقم: <span class="mono">${safe(number)}</span></div>
              <div class="company-code">الكود: <span class="mono">${safe(code)}</span></div>
            </div>
          </div>
        </div>
        <button class="btn" type="button">اشتراك</button>
      `;

      item.querySelector("button").addEventListener("click", async () => {
        if (!number || !code) {
          toastMsg("المعذرة، هذه النغمة غير موجودة في هذه الشركة");
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
    detailsAudio.currentTime = 0;
    clearDetailsAutoStop();
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
/* --- single-line auto-fit (added as requested) --- */
(function () {
  function fitTextSingleLine(selector, minSize, limit) {
    minSize = minSize || 10;

    // Limit work on low-end mobiles (long lists can freeze the UI)
    const nodes = Array.from(document.querySelectorAll(selector));
    const els = (typeof limit === "number" && limit >= 0) ? nodes.slice(0, limit) : nodes;

    els.forEach(function (el) {
      // Reset to base first
      var base = 14;
      el.style.whiteSpace = "nowrap";
      el.style.overflow = "hidden";
      el.style.textOverflow = "ellipsis";
      el.style.fontSize = base + "px";

      // If it fits, keep it
      if (el.scrollWidth <= el.clientWidth) return;

      // Reduce until it fits or hits minSize
      for (var size = base; size >= minSize; size--) {
        el.style.fontSize = size + "px";
        if (el.scrollWidth <= el.clientWidth) break;
      }
    });
  }

  function fitAll() {
    fitTextSingleLine(".tone-name", 10, 40);
    fitTextSingleLine(".company-name", 10);
    fitTextSingleLine(".company-number", 10);
    fitTextSingleLine(".company-code", 10);
  }

  // Run on load + resize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fitAll);
  } else {
    fitAll();
  }
  window.addEventListener("resize", fitAll);

  // Also run when DOM changes (e.g., navigating between sections)
  var t;
  var obs = new MutationObserver(function () {
    clearTimeout(t);
    t = setTimeout(fitAll, 50);
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();
