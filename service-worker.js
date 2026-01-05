/* =========================================================
   service-worker.js — PWA support (add new, don't delete old)
   - لا يحذف القديم من الكاش
   - يجلب data.js من الشبكة عند توفرها ويحدّثه
   - يقرأ data.js ويضيف النغمات الجديدة للكاش تلقائيًا
   ========================================================= */

const CORE_CACHE = "core-cache";
const RUNTIME_CACHE = "runtime-cache";

// ملفات أساسية (لا نحذف القديم، فقط نضيف)
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./logo.png",
  "./offline.html"
];

// (اختياري) لو تبغى data.js يتكاش أول مرة للتصفح بدون إنترنت:
const DATA_URL = "./data.js";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();

    // عند تفعيل السرويس ووركر: حاول تجيب أحدث data.js ثم كاش النغمات الجديدة
    await warmRingtonesFromLatestData();
  })());
});

/**
 * يجلب أحدث data.js (إنترنت أولًا)
 * ثم يستخرج جميع audio: "...." ويعمل لها cache (إضافة فقط).
 */
async function warmRingtonesFromLatestData() {
  try {
    const runtime = await caches.open(RUNTIME_CACHE);

    // 1) حاول من الشبكة أولًا
    let dataResp = null;
    try {
      dataResp = await fetch(DATA_URL, { cache: "no-store" });
      if (dataResp && dataResp.ok) {
        // خزّن أحدث data.js
        await runtime.put(DATA_URL, dataResp.clone());
      }
    } catch (_) {
      // تجاهل
    }

    // 2) لو ما نجحت الشبكة، خذ من الكاش
    if (!dataResp || !dataResp.ok) {
      dataResp = await runtime.match(DATA_URL) || await caches.match(DATA_URL);
      if (!dataResp) return;
    }

    const text = await dataResp.clone().text();

    // استخراج مسارات الصوت من data.js (حسب تركيبة ملفك audio: "ringtones/....")
    const re = /audio\s*:\s*"([^"]+)"/g;
    const urls = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      // نخزن فقط الروابط النسبية داخل مشروعك
      const u = m[1];
      if (u && !u.startsWith("http")) urls.push(u);
    }

    // إزالة التكرار
    const unique = [...new Set(urls)];

    // 3) أضف الجديد للكاش (بدون حذف القديم)
    // ملاحظة: cache.addAll سيحاول تنزيلها الآن (يحتاج إنترنت)
    await runtime.addAll(unique.map((u) => "./" + u.replace(/^\.?\//, ""))).catch(() => {});
  } catch (_) {
    // تجاهل أي أخطاء حتى لا يتعطل التطبيق
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // نفس الدومين فقط
  if (url.origin !== self.location.origin) return;

  // صفحات: Network First + fallback
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const runtime = await caches.open(RUNTIME_CACHE);
        runtime.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        return (await caches.match(req)) || (await caches.match("./offline.html"));
      }
    })());
    return;
  }

  // data.js: Network First (ليجيك الجديد دائمًا) ثم fallback للكاش
  if (url.pathname.endsWith("/data.js") || url.pathname.endsWith("data.js")) {
    event.respondWith((async () => {
      const runtime = await caches.open(RUNTIME_CACHE);
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        if (fresh && fresh.ok) runtime.put(req, fresh.clone());

        // بعد ما يحدث data.js حاول كاش النغمات الجديدة
        // (لا ننتظرها في الاستجابة حتى ما نبطئ التحميل)
        warmRingtonesFromLatestData();

        return fresh;
      } catch (_) {
        return (await runtime.match(req)) || (await caches.match(req));
      }
    })());
    return;
  }

  // ملفات ثابتة (CSS/JS/صور/صوت): Cache First + تخزين عند أول زيارة
  event.respondWith((async () => {
    const runtime = await caches.open(RUNTIME_CACHE);
    const cached = await caches.match(req) || await runtime.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) runtime.put(req, fresh.clone());
      return fresh;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
