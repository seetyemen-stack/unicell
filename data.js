/* =========================================================
   data.js — (نسخة متوافقة مع app.js)
   ✅ تثبيت أرقام خدمة الشركات
   ✅ الأقسام يدوية بالكامل
   ✅ متغيرات ظاهرة لـ app.js عبر window.*
   ========================================================= */

window.SERVICE_NUMBERS = {
  yemen: "1100",   // يمن موبايل
  sabafon: "111",  // سبأفون
  you: "1017"      // YOU
};

window.CATEGORIES = [
  "الأحدث",
  "الأكثر تحميلًا",
  "أدعية",
  "أناشيد",
  "أغاني",
  "زوامل",
  "أدعية بالاسم",
  "ردود آلية بالاسم",
  "رياضية",
  "منوعات"
];

window.COMPANIES = [
  { key: "yemen",   name: "Yemen Mobile", logo: "media/company/yemen.png" },
  { key: "sabafon", name: "Sabafon",      logo: "media/company/sabafon.png" },
  { key: "you",     name: "YOU",          logo: "media/company/you.png" }
];

/*
  ✅ تنسيق إضافة نغمة (Template)

  {
    id: "unique-id",                    // اختياري (لو تركته فاضي يتم توليده تلقائيًا)
    title: "اسم النغمة",                // مطلوب
    categories: ["زوامل", "الأكثر تحميلًا"],  // قسم واحد أو عدة أقسام
    createdAt: "2026-01-04",            // اختياري (ISO). لو لم تضعه: ترتيب الملف (الأعلى أحدث)
    rank: { "زوامل": 1, "الأكثر تحميلًا": 2 }, // اختياري: ترقيم/ترتيب يدوي داخل كل قسم
    image: "AUTO",                      // للأقسام بالاسم فقط: اكتب AUTO أو اتركه فارغ وسيُولد تلقائيًا
    audio: "ringtones/audio/file.mp3",
    codes: { yemen: { code: "..." }, sabafon: { code: "..." }, you: { code: "..." } }
  }
*/

window.RINGTONES = [
  {
    id: "name-ashraf",
    title: "دعاء أشرف",
    categories: ["أدعية بالاسم"],
    image: "AUTO",
    audio: "ringtones/audio/ashraf.mp3",
    codes: {
      yemen: { code: "ASH01" },
      sabafon: { code: "ASH01" },
      you: { code: "ASH01" }
    }
  },

  {
    id: "name-amen",
    title: "دعاء آمين",
    categories: ["أدعية بالاسم"],
    image: "AUTO",
    audio: "ringtones/audio/amen.mp3",
    codes: {
      yemen: { code: "9930010087" },
      sabafon: { code: "AMEN" },
      you: { code: "AMEN" }
    }
  },

  {
    id: "sabr",
    title: "والصبر ياقلبي - ابراهيم الدوله",
    categories: ["الأكثر تحميلًا", "زوامل"],
    image: "ringtones/images/a1.jpg",
    audio: "ringtones/audio/sabr.mp3",
    createdAt: "2026-01-04T12:00:00Z",
  rank: {
    "زوامل": 1,
    "الأكثر تحميلًا": 1
  },
  codes: {
    yemen:   { code: "SON02" },
    sabafon: { code: "SON02" },
    you:     { code: "SON02" }
  }
},

{
  id: "reply-ibrahim",
  title: "رد ابراهيم",
  categories: ["ردود آلية بالاسم"],
  image: "AUTO",
  audio: "ringtones/audio/rdabra.mp3",
  codes: {
    yemen:   { code: "993001028" },
    sabafon: { code: "REP01" },
    you:     { code: "REP01" }
  }
},

{
  id: "sport-real",
  title: "لمشجعي مدريد",
  categories: ["رياضية"],
  image: "ringtones/images/real.jpg",
  audio: "ringtones/audio/real.mp3",
  codes: {
    yemen:   { code: "9930010200" },
    sabafon: { code: "SP01" },
    you:     { code: "SP01" }
  }
},

{
  id: "sport-barca",
  title: "لمشجعي برشلونا",
  categories: ["رياضية"],
  image: "ringtones/images/brsa.jpg",
  audio: "ringtones/audio/brsa.mp3",
  codes: {
    yemen:   { code: "9930010199" },
    sabafon: { code: "SP01" },
    you:     { code: "SP01" }
  }
},

{
  id: "dua-motari",
  title: "دعاء يجيبني - احمد المطري",
  categories: ["أدعية"],
  image: "ringtones/images/a3.jpg",
  audio: "ringtones/audio/mna.mp3",
  codes: {
    yemen:   { code: "DRA01" },
    sabafon: { code: "DRA01" },
    you:     { code: "DRA01" }
  }
},

{
  id: "nasheed-alf",
  title: "الف صلى - عبدالعظيم عزالدين",
  categories: ["أناشيد"],
  image: "ringtones/images/a2.jpg",
  audio: "ringtones/audio/alf.mp3",
  codes: {
    yemen:   { code: "NAS01" },
    sabafon: { code: "NAS01" },
    you:     { code: "NAS01" }
  }
},

{
  id: "song",
  title: "واقف انا - حسن الاميري",
  categories: ["أغاني", "الأكثر تحميلًا"],
  image: "ringtones/images/a4.jpg",
  audio: "ringtones/audio/oatf.mp3",
  createdAt: "2026-01-04T12:00:00Z",
  rank: {
    "أغاني": 1,
    "الأكثر تحميلًا": 3
  },
  codes: {
    yemen:   { code: "SON02" },
    sabafon: { code: "SON02" },
    you:     { code: "SON02" }
  }
},

{
  id: "zamil-ya-ilahi",
  title: "يا إلهي - ابراهيم الدوله",
  categories: ["زوامل"],
  image: "ringtones/images/a1.jpg",
  audio: "ringtones/audio/a2.mp3",
  codes: {
    yemen:   { code: "ZAM01" },
    sabafon: { code: "ZAM01" },
    you:     { code: "ZAM01" }
  }
},

{
  id: "name",
  title: "دعاء حمود",
  categories: ["أدعية بالاسم"],
  image: "AUTO",
  audio: "ringtones/audio/h1.mp3",
  createdAt: "2026-01-04T12:00:00Z",
  codes: {
    yemen:   { code: "RDA01" },
    sabafon: { code: "RDA01" },
    you:     { code: "RDA01" }
  }
},

{
  id: "name",
  title: "دعاء أيمن",
  categories: ["أدعية بالاسم"],
  image: "AUTO",
  audio: "ringtones/audio/ae1.mp3",
  createdAt: "2026-01-04T12:00:00Z",
  codes: {
    yemen:   { code: "RDA01" },
    sabafon: { code: "RDA01" },
    you:     { code: "RDA01" }
  }
},

{
  id: "zamil",
  title: "ياصاحبي- ابراهيم الدوله",
  categories: ["زوامل"],
  image: "ringtones/images/a1.jpg",
  audio: "ringtones/audio/sa1.mp3",
  createdAt: "2026-01-04T12:00:00Z",
  rank: {
    "زوامل": 2,
  },
  codes: {
    yemen:   { code: "SON02" },
    sabafon: { code: "SON02" },
    you:     { code: "SON02" }
  }
},

{
  id: "nasheed",
  title: "قف بالخضوع-عبدالعظيم عزالدين",
  categories: ["أناشيد", "الأكثر تحميلًا"],
  image: "ringtones/images/a2.jpg",
  audio: "ringtones/audio/ab1.mp3",
  createdAt: "2026-01-04T12:00:00Z",
  rank: {
    "أناشيد": 1,
    "الأكثر تحميلًا": 2,
  },
  codes: {
    yemen:   { code: "SON02" },
    sabafon: { code: "SON02" },
    you:     { code: "SON02" }
  }
},

{
  id: "nasheed",
  title: "يامن تحل-عبدالعظيم عزالدين",
  categories: ["أناشيد"],
  image: "ringtones/images/a2.jpg",
  audio: "ringtones/audio/ab2.mp3",
createdAt: "2026-01-04T12:00:00Z",
  rank: {
    "أناشيد": 2,
  },
  codes: {
    yemen:   { code: "SON02" },
    sabafon: { code: "SON02" },
    you:     { code: "SON02" }
  }
},

{
  id: "nasheed",
  title: "إلهي وخلاقي-عبدالعظيم عزالدين",
  categories: ["أناشيد"],
  image: "ringtones/images/a2.jpg",
  audio: "ringtones/audio/ab3.mp3",
createdAt: "2026-01-04T12:00:00Z",
  rank: {
    "أناشيد": 3,
  },
  codes: {
    yemen:   { code: "SON02" },
    sabafon: { code: "SON02" },
    you:     { code: "SON02" }
  }
},
];