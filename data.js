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

window.RINGTONES = [
  {
    id: "name_ashraf",
    title: "دعاء أشرف",
    category: "أدعية بالاسم",
    image: "ringtones/images/ashraf.jpg",
    audio: "ringtones/audio/ashraf.mp3",
    codes: {
      yemen: { code: "ASH01" },
      sabafon: { code: "ASH01" },
      you: { code: "ASH01" }
    }
  },

  {
    id: "name_amen",
    title: "دعاء آمين",
    category: "أدعية بالاسم",
    image: "ringtones/images/amen.jpg",
    audio: "ringtones/audio/amen.mp3",
    codes: {
      yemen: { code: "9930010087" },
      sabafon: { code: "AMEN" },
      you: { code: "AMEN" }
    }
  },

  {
    id: "top_sabr_yaqalbi",
    title: "والصبر - ابراهيم الدوله",
    category: "الأكثر تحميلًا",
    image: "ringtones/images/sabr.jpg",
    audio: "ringtones/audio/sabr.mp3",
    codes: {
      yemen: { code:"9930010087" },
      sabafon: { code: "SABR" },
      you: { code: "SABR" }
    }
  },

{
    id: "zamil_sabr_yaqalbi",
    title: "والصبر ياقلبي- ابراهيم الدوله",
    category: "زوامل",
    image: "ringtones/images/sabr.jpg",
    audio: "ringtones/audio/sabr.mp3",
    codes: {
      yemen: { code: "SABR" },
      sabafon: { code: "SABR" },
      you: { code: "SABR" }
    }
  },

{
  id: "reply_rdabra",
  title: "رد ابراهيم",
  category: "ردود آلية بالاسم",
  image: "ringtones/images/rdabra.jpg",
  audio: "ringtones/audio/rdabra.mp3",
  codes: {
    yemen:   { code: "993001028" },
    sabafon: { code: "REP01" },
    you:     { code: "REP01" }
  }
},

{
  id: "sport_real",
  title: "لمشجعي مدريد",
  category: "رياضية",
  image: "ringtones/images/real.jpg",
  audio: "ringtones/audio/real.mp3",
  codes: {
    yemen:   { code: "9930010200" },
    sabafon: { code: "SP01" },
    you:     { code: "SP01" }
  }
},

{
  id: "sport_brsa",
  title: "لمشجعي برشلونا",
  category: "رياضية",
  image: "ringtones/images/brsa.jpg",
  audio: "ringtones/audio/brsa.mp3",
  codes: {
    yemen:   { code: "9930010199" },
    sabafon: { code: "SP01" },
    you:     { code: "SP01" }
  }
},

{
    id: "top_sahbe_yaqalbi",
    title: "يصاحبي- ابراهيم الدولة",
    category: "الأكثر تحميلًا",
    image: "ringtones/images/sabr.jpg",
    audio: "ringtones/audio/sahbe.mp3",
    codes: {
      yemen: { code:"993001044" },
      sabafon: { code: "SABR" },
      you: { code: "SABR" }
   }
},

{
    id: "top_baetk_yaqalbi",
    title: "ياإلهي- ابراهيم الدولة",
    category: "الأكثر تحميلًا",
    image: "ringtones/images/sabr.jpg",
    audio: "ringtones/audio/baetk.mp3",
    codes: {
      yemen: { code:"993001044" },
      sabafon: { code: "SABR" },
      you: { code: "SABR" }
   }
},
];