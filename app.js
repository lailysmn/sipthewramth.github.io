(function () {
  "use strict";

  /* =====================================================================
     Sip the Warmth
     - Peta nyata: Leaflet + tile OpenStreetMap + satelit Esri
     - Lokasi saya: GPS browser (watchPosition), real-time
     - Alamat: Nominatim (cari alamat dan nama jalan dari koordinat)
     - Rute dan petunjuk belok: OSRM (routing.openstreetmap.de)
     Posisi tag tumbler sendiri tetap data contoh / input manual, karena
     jaringan Find My dan Find Hub tidak bisa diakses dari website.
     ===================================================================== */

  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  };

  /* ---------- ikon ---------- */
  var IC = {
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    route:
      '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H14a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h5.8"/>',
    map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    guide:
      '<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M9 9h6M9 13h6"/>',
    tag: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
    tumbler:
      '<path d="M8 3h8l-.8 3H8.8z"/><path d="M8.6 6h6.8l-1 14.2a1 1 0 0 1-1 .8h-2.8a1 1 0 0 1-1-.8z"/>',
    key: '<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5L20 3M16 7l3 3M13.5 9.5l2 2"/>',
    bag: '<rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    wallet:
      '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    target:
      '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    briefcase:
      '<rect x="3.5" y="8" width="17" height="11" rx="2"/><path d="M9 8V6h6v2M3.5 13h17"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    tright: '<path d="M5 20v-6a4 4 0 0 1 4-4h9M14 5l5 5-5 5"/>',
    tleft: '<path d="M19 20v-6a4 4 0 0 0-4-4H6M10 5L5 10l5 5"/>',
    uturn: '<path d="M8 20V8a4 4 0 0 1 8 0v8M12 12l4 4 4-4"/>',
    flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>',
    phone:
      '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
    navi: '<path d="M12 3l7 17-7-4-7 4z"/>',
  };
  function ic(n, s) {
    s = s || 20;
    return (
      '<svg class="ic" width="' +
      s +
      '" height="' +
      s +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      IC[n] +
      "</svg>"
    );
  }
  var TYPES = {
    tumbler: { n: "Tumbler", i: "tumbler" },
    key: { n: "Kunci", i: "key" },
    bag: { n: "Tas", i: "bag" },
    wallet: { n: "Dompet", i: "wallet" },
    other: { n: "Lainnya", i: "box" },
  };

  /* ---------- geometri ---------- */
  var RAD = Math.PI / 180;
  function haversineM(lat1, lon1, lat2, lon2) {
    var R = 6371000,
      dLat = (lat2 - lat1) * RAD,
      dLon = (lon2 - lon1) * RAD;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * RAD) *
        Math.cos(lat2 * RAD) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function bearingDeg(lat1, lon1, lat2, lon2) {
    var y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
    var x =
      Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) -
      Math.sin(lat1 * RAD) *
        Math.cos(lat2 * RAD) *
        Math.cos((lon2 - lon1) * RAD);
    return ((Math.atan2(y, x) / RAD) + 360) % 360;
  }
  var COMPASS = [
    "utara",
    "timur laut",
    "timur",
    "tenggara",
    "selatan",
    "barat daya",
    "barat",
    "barat laut",
  ];
  function compassName(deg) {
    return COMPASS[Math.round(deg / 45) % 8];
  }
  function fmtM(m) {
    if (m >= 1000) return (m / 1000).toFixed(1).replace(".", ",") + " km";
    if (m < 100) return Math.max(5, Math.round(m / 5) * 5) + " m";
    return Math.round(m / 10) * 10 + " m";
  }
  function fmtDur(s) {
    var m = Math.max(1, Math.round(s / 60));
    if (m < 60) return m + " mnt";
    var h = Math.floor(m / 60);
    return h + " j " + (m % 60) + " mnt";
  }
  function offToLL(a, e, n) {
    var lat = a.lat + n / 111320;
    return { lat: lat, lon: a.lon + e / (111320 * Math.cos(a.lat * RAD)) };
  }
  function hhmm() {
    var d = new Date();
    return (
      ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2)
    );
  }

  /* ---------- data contoh ---------- */
  /* Titik acuan awal: Jakarta. Begitu GPS pertama kali aktif, semua data contoh
     dipindahkan ke sekitar posisi Anda supaya rute bisa dicoba di tempat Anda. */
  var BASE = { lat: -6.1951, lon: 106.8231, fromGps: false };
  function seedData(a) {
    function P(o) {
      return offToLL(a, o[0], o[1]);
    }
    function pt(o, t, l) {
      var p = P(o);
      return { t: t, l: l, lat: p.lat, lon: p.lon, off: o };
    }
    function zone(id, name, icon, o) {
      var p = P(o);
      return {
        id: id,
        name: name,
        i: icon,
        r: 150,
        on: true,
        lat: p.lat,
        lon: p.lon,
        off: o,
      };
    }
    function item(o) {
      var p = P(o.off);
      o.lat = p.lat;
      o.lon = p.lon;
      return o;
    }
    var RUMAH = [-220, -160],
      KANTOR = [520, 380],
      KAFE = [250, 210];
    return {
      zones: [
        zone("rumah", "Rumah", "home", RUMAH),
        zone("kantor", "Kantor", "briefcase", KANTOR),
      ],
      items: [
        item({
          id: "tumbler",
          name: "Tumbler Sip the Warmth",
          type: "tumbler",
          off: KAFE,
          battery: 86,
          seen: "Baru saja",
          online: true,
          net: "Find My",
          acc: 22,
          lost: false,
          hist: [
            pt(RUMAH, "06:40", "Berangkat dari Rumah"),
            pt(KANTOR, "07:25", "Tiba di Kantor"),
            pt(KAFE, "12:10", "Makan siang di kafe"),
            pt(KANTOR, "12:55", "Kembali ke Kantor"),
            pt(KAFE, "15:48", "Di kafe (sekarang)"),
          ],
        }),
        item({
          id: "kunci",
          name: "Kunci Motor",
          type: "key",
          off: [-198, -190],
          battery: 24,
          seen: "3 jam lalu",
          online: false,
          net: "Find Hub",
          acc: 30,
          lost: false,
          hist: [
            pt(RUMAH, "Kemarin 21:10", "Pulang ke Rumah"),
            pt([-198, -190], "Kemarin 21:15", "Rumah (terakhir terlihat)"),
          ],
        }),
        item({
          id: "tas",
          name: "Tas Kerja",
          type: "bag",
          off: [530, 392],
          battery: 54,
          seen: "12 menit lalu",
          online: true,
          net: "Find My",
          acc: 26,
          lost: false,
          hist: [
            pt(KANTOR, "07:25", "Tiba di Kantor"),
            pt([530, 392], "15:36", "Kantor (terakhir terlihat)"),
          ],
        }),
      ],
    };
  }
  function detectPlatform() {
    return /android/i.test(navigator.userAgent || "") ? "android" : "ios";
  }

  /* ---------- state ---------- */
  var seed0 = seedData(BASE);
  var state = {
    view: "perangkat",
    sel: "tumbler",
    items: seed0.items,
    zones: seed0.zones,
    anchor: BASE,
    manual: null /* titik awal manual jika GPS mati */,
    mode: "walk",
    alertOn: true,
    hist: -1,
    confirmDel: null,
    placing: false,
    hs: "A",
    check: {},
    dest: null /* null = barang terpilih; atau {lat,lon,name} dari pencarian */,
    route: null,
    routeLoading: false,
    routeAt: 0,
    routeErr: "",
    nav: { on: false, pending: false, arrived: false },
    prog: null,
    q: {},
    results: {},
    youAddr: "",
    youAddrAt: 0,
    youAddrPos: null,
    gps: {
      on: false,
      status: "off",
      watchId: null,
      lat: null,
      lon: null,
      acc: null,
      heading: null,
      speed: null,
    },
    add: {
      step: 1,
      type: "tumbler",
      name: "",
      platform: detectPlatform(),
      scan: "idle",
      tag: "",
      pos: null,
    },
  };
  var KEY = "stw-v2";
  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          items: state.items,
          zones: state.zones,
          anchor: state.anchor,
          manual: state.manual,
          alertOn: state.alertOn,
          check: state.check,
          platform: state.add.platform,
          mode: state.mode,
        }),
      );
    } catch (e) {}
  }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!d) return;
      if (Array.isArray(d.items)) state.items = d.items;
      if (Array.isArray(d.zones) && d.zones.length) state.zones = d.zones;
      if (d.anchor && typeof d.anchor.lat === "number") state.anchor = d.anchor;
      if (d.manual && typeof d.manual.lat === "number") state.manual = d.manual;
      if (typeof d.alertOn === "boolean") state.alertOn = d.alertOn;
      if (d.check) state.check = d.check;
      if (d.platform) state.add.platform = d.platform;
      if (d.mode && /^(walk|bike|car)$/.test(d.mode)) state.mode = d.mode;
    } catch (e) {}
  }
  load();
  if (
    !state.items.some(function (i) {
      return i.id === state.sel;
    })
  )
    state.sel = state.items[0] ? state.items[0].id : null;
  function cur() {
    for (var i = 0; i < state.items.length; i++)
      if (state.items[i].id === state.sel) return state.items[i];
    return null;
  }
  function zoneOf(p) {
    for (var i = 0; i < state.zones.length; i++) {
      var z = state.zones[i];
      if (z.on && haversineM(p.lat, p.lon, z.lat, z.lon) <= z.r) return z;
    }
    return null;
  }
  function you() {
    var g = state.gps;
    if (g.on && g.lat != null) return { lat: g.lat, lon: g.lon, acc: g.acc };
    if (state.manual) return state.manual;
    return null;
  }
  function dest() {
    if (state.dest) return state.dest;
    var it = cur();
    return it
      ? { lat: it.lat, lon: it.lon, name: it.name, item: it.id }
      : null;
  }

  /* ---------- jaringan ---------- */
  function fetchJSON(url, ms) {
    var ctl = "AbortController" in window ? new AbortController() : null;
    var t = ctl
      ? setTimeout(function () {
          ctl.abort();
        }, ms || 10000)
      : 0;
    return fetch(url, ctl ? { signal: ctl.signal } : undefined)
      .then(function (r) {
        clearTimeout(t);
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .catch(function (e) {
        clearTimeout(t);
        throw e;
      });
  }

  /* ---------- alamat (Nominatim) ---------- */
  var addrCache = {};
  try {
    addrCache = JSON.parse(localStorage.getItem("stw-addr") || "{}") || {};
  } catch (e) {}
  var addrQ = [],
    addrPending = {},
    addrBusy = false;
  function ak(lat, lon) {
    return lat.toFixed(4) + "," + lon.toFixed(4);
  }
  function saveAddr() {
    try {
      var ks = Object.keys(addrCache);
      if (ks.length > 120)
        ks.slice(0, ks.length - 120).forEach(function (k) {
          delete addrCache[k];
        });
      localStorage.setItem("stw-addr", JSON.stringify(addrCache));
    } catch (e) {}
  }
  function shortAddr(j) {
    var a = j.address || {};
    var road = a.road || a.pedestrian || a.footway || a.path || "";
    var first =
      (road && a.house_number ? road + " " + a.house_number : road) ||
      a.amenity ||
      a.building ||
      a.shop ||
      a.leisure ||
      j.name ||
      "";
    var area = a.neighbourhood || a.suburb || a.village || a.quarter || "";
    var city =
      a.city_district || a.city || a.town || a.municipality || a.county || "";
    var out = [];
    [first, area, city].forEach(function (p) {
      if (p && out.indexOf(p) < 0) out.push(p);
    });
    return (
      out.join(", ") ||
      String(j.display_name || "")
        .split(",")
        .slice(0, 3)
        .join(",")
    );
  }
  function pumpAddr() {
    if (addrBusy || !addrQ.length) return;
    addrBusy = true;
    var q = addrQ.shift();
    var url =
      "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=id&lat=" +
      q.lat +
      "&lon=" +
      q.lon;
    fetchJSON(url, 9000)
      .then(function (j) {
        var t = shortAddr(j);
        if (t) {
          addrCache[q.k] = t;
          saveAddr();
        }
        return t || q.lat.toFixed(5) + ", " + q.lon.toFixed(5);
      })
      .catch(function () {
        return q.lat.toFixed(5) + ", " + q.lon.toFixed(5);
      })
      .then(function (t) {
        delete addrPending[q.k];
        q.ps.forEach(function (res) {
          res(t);
        });
        setTimeout(function () {
          addrBusy = false;
          pumpAddr();
        }, 1100); /* Nominatim: maksimal 1 permintaan per detik */
      });
  }
  function getAddr(lat, lon, prio) {
    var k = ak(lat, lon);
    if (addrCache[k]) return Promise.resolve(addrCache[k]);
    var e = addrPending[k];
    if (!e) {
      e = addrPending[k] = { k: k, lat: lat, lon: lon, ps: [] };
      if (prio) addrQ.unshift(e);
      else addrQ.push(e);
    }
    return new Promise(function (res) {
      e.ps.push(res);
      pumpAddr();
    });
  }
  /* <span> yang terisi sendiri saat alamat sudah didapat, tanpa render ulang */
  function addrSpan(lat, lon) {
    var k = ak(lat, lon),
      c = addrCache[k];
    if (!c)
      getAddr(lat, lon).then(function (t) {
        $$('[data-addr="' + k + '"]').forEach(function (el) {
          el.textContent = t;
        });
      });
    return (
      '<span data-addr="' + k + '">' + esc(c || "Memuat alamat…") + "</span>"
    );
  }

  /* ---------- pencarian alamat ---------- */
  function geocode(q) {
    var y = you();
    var u =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=id&q=" +
      encodeURIComponent(q);
    if (y)
      u +=
        "&viewbox=" +
        [y.lon - 0.4, y.lat + 0.4, y.lon + 0.4, y.lat - 0.4].join(",");
    return fetchJSON(u, 10000);
  }
  function searchHTML(ctx, placeholder) {
    return (
      '<div class="sbox"><form class="sform" data-search="' +
      ctx +
      '" role="search"><input type="search" name="q" placeholder="' +
      esc(placeholder) +
      '" autocomplete="off" enterkeyhint="search" aria-label="' +
      esc(placeholder) +
      '" value="' +
      esc(state.q[ctx] || "") +
      '"><button class="btn primary" type="submit">' +
      ic("search", 18) +
      'Cari</button></form><ul class="sres" id="sres-' +
      ctx +
      '"></ul></div>'
    );
  }
  function showResults(ctx, list, msg) {
    var ul = $("#sres-" + ctx);
    if (!ul) return;
    if (msg) {
      ul.innerHTML = '<li class="msg">' + esc(msg) + "</li>";
      return;
    }
    ul.innerHTML = list
      .map(function (r, i) {
        var parts = String(r.display_name || "").split(",");
        var title = (r.name || parts[0] || "").trim();
        var sub = parts.slice(r.name ? 0 : 1, 4).join(",").trim();
        return (
          '<li><button type="button" data-act="pick-result" data-ctx="' +
          ctx +
          '" data-i="' +
          i +
          '"><span>' +
          ic("pin", 18) +
          "</span><span><b>" +
          esc(title) +
          '</b><span class="sub">' +
          esc(sub) +
          "</span></span></button></li>"
        );
      })
      .join("");
  }
  function runSearch(ctx, q) {
    state.q[ctx] = q;
    if (!q.trim()) return;
    showResults(ctx, [], "Mencari…");
    geocode(q.trim())
      .then(function (list) {
        state.results[ctx] = list;
        if (!list.length)
          showResults(
            ctx,
            [],
            "Alamat tidak ditemukan. Coba tambahkan nama jalan atau kota.",
          );
        else showResults(ctx, list);
      })
      .catch(function () {
        showResults(
          ctx,
          [],
          "Pencarian alamat gagal. Periksa koneksi internet Anda lalu coba lagi.",
        );
      });
  }
  function pickResult(ctx, i) {
    var r = (state.results[ctx] || [])[i];
    if (!r) return;
    var lat = +r.lat,
      lon = +r.lon,
      parts = String(r.display_name || "").split(","),
      name = (r.name || parts[0] || "Tujuan").trim();
    state.results[ctx] = [];
    var ul = $("#sres-" + ctx);
    if (ul) ul.innerHTML = "";
    if (ctx === "dest") {
      stopNav();
      state.dest = { lat: lat, lon: lon, name: name };
      renderRoute();
      recompute();
    } else if (ctx === "add") {
      state.add.pos = { lat: lat, lon: lon };
      renderAddAfter();
      drawMap("mc-pick");
      fit("mc-pick");
    }
  }

  /* ---------- rute (OSRM) ---------- */
  var MODES = {
    walk: { n: "Jalan kaki", p: "routed-foot", v: 1.4 },
    bike: { n: "Sepeda", p: "routed-bike", v: 4.5 },
    car: { n: "Kendaraan", p: "routed-car", v: 8.3 },
  };
  var DIRN = {
    left: "kiri",
    right: "kanan",
    "slight left": "kiri",
    "slight right": "kanan",
    "sharp left": "kiri tajam",
    "sharp right": "kanan tajam",
    straight: "lurus",
    uturn: "putar balik",
  };
  function stepIcon(s) {
    var m = s.maneuver,
      mod = m.modifier || "";
    if (m.type === "arrive") return "flag";
    if (mod === "uturn") return "uturn";
    if (/left/.test(mod)) return "tleft";
    if (/right/.test(mod)) return "tright";
    return "up";
  }
  function stepText(s) {
    var m = s.maneuver,
      t = m.type,
      mod = m.modifier || "",
      n = s.name || "",
      to = n ? " ke " + n : "",
      at = n ? " di " + n : "";
    switch (t) {
      case "depart":
        return (
          "Mulai menuju " + compassName(m.bearing_after || 0) + at
        );
      case "arrive":
        return (
          "Tiba di tujuan" +
          (mod.indexOf("left") >= 0
            ? ", tujuan di sebelah kiri"
            : mod.indexOf("right") >= 0
              ? ", tujuan di sebelah kanan"
              : "")
        );
      case "roundabout":
      case "rotary":
        return "Masuk bundaran, ambil jalan keluar ke-" + (m.exit || 1) + to;
      case "roundabout turn":
        return "Di bundaran, belok " + (DIRN[mod] || "") + to;
      case "exit roundabout":
      case "exit rotary":
        return "Keluar dari bundaran" + to;
      case "merge":
        return "Gabung" + to;
      case "on ramp":
        return "Masuk jalur" + to;
      case "off ramp":
        return "Ambil jalur keluar" + to;
      case "fork":
        return (
          "Di pertigaan, ambil " + (mod.indexOf("left") >= 0 ? "kiri" : "kanan") + to
        );
      case "end of road":
        return "Di ujung jalan, belok " + (DIRN[mod] || "") + to;
      case "turn":
        if (mod === "uturn") return "Putar balik" + at;
        if (mod === "straight") return "Lurus" + at;
        return "Belok " + (DIRN[mod] || "") + to;
      default:
        if (mod === "uturn") return "Putar balik" + at;
        if (/left|right/.test(mod)) return "Lanjut ke " + (DIRN[mod] || "") + at;
        return "Lanjut lurus" + at;
    }
  }
  function buildRoute(pts, dist, dur, steps, fallback) {
    var cum = [0];
    for (var i = 1; i < pts.length; i++)
      cum.push(
        cum[i - 1] +
          haversineM(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]),
      );
    var len = cum[cum.length - 1] || dist || 1;
    var sum = steps.reduce(function (a, s) {
      return a + s.d;
    }, 0);
    var scale = sum > 0 ? len / sum : 1,
      acc = 0;
    steps.forEach(function (s) {
      acc += s.d * scale;
      s.end = acc;
    });
    if (steps.length) steps[steps.length - 1].end = len + 1;
    return {
      pts: pts,
      cum: cum,
      len: len,
      dur: dur,
      steps: steps,
      fallback: !!fallback,
    };
  }
  function fetchRoute(a, b, mode) {
    var u =
      "https://routing.openstreetmap.de/" +
      MODES[mode].p +
      "/route/v1/driving/" +
      a.lon +
      "," +
      a.lat +
      ";" +
      b.lon +
      "," +
      b.lat +
      "?overview=full&geometries=geojson&steps=true";
    return fetchJSON(u, 12000).then(function (j) {
      var r = j.routes && j.routes[0];
      if (!r) throw new Error("tidak ada rute");
      var pts = r.geometry.coordinates.map(function (c) {
        return [c[1], c[0]];
      });
      var steps = [];
      r.legs.forEach(function (l) {
        l.steps.forEach(function (s) {
          steps.push({ i: stepIcon(s), t: stepText(s), d: s.distance });
        });
      });
      return buildRoute(pts, r.distance, r.duration, steps, false);
    });
  }
  function straightRoute(a, b, mode) {
    var d = haversineM(a.lat, a.lon, b.lat, b.lon);
    return buildRoute(
      [
        [a.lat, a.lon],
        [b.lat, b.lon],
      ],
      d,
      d / MODES[mode].v,
      [
        {
          i: "up",
          t:
            "Menuju " +
            compassName(bearingDeg(a.lat, a.lon, b.lat, b.lon)) +
            " (garis lurus)",
          d: d,
        },
        { i: "flag", t: "Tiba di tujuan", d: 0 },
      ],
      true,
    );
  }
  var routeSeq = 0;
  function recompute() {
    var from = you(),
      to = dest();
    if (!from || !to) {
      state.route = null;
      state.prog = null;
      state.routeLoading = false;
      updateRoute();
      drawMap("mc-route");
      return;
    }
    var id = ++routeSeq;
    state.routeLoading = true;
    state.routeErr = "";
    updateRoute();
    fetchRoute(from, to, state.mode)
      .catch(function () {
        state.routeErr =
          "Rute jalan tidak bisa dimuat (periksa koneksi internet). Menampilkan garis lurus.";
        return straightRoute(from, to, state.mode);
      })
      .then(function (r) {
        if (id !== routeSeq) return;
        state.route = r;
        state.routeLoading = false;
        state.routeAt = Date.now();
        updateProgress();
        updateRoute();
        drawMap("mc-route");
        if (!state.nav.on) fit("mc-route");
      });
  }
  function projectOnRoute(r, p) {
    var kx = 111320 * Math.cos(p.lat * RAD),
      ky = 111320,
      px = p.lon * kx,
      py = p.lat * ky,
      best = { d: 1e12, along: 0 };
    for (var i = 1; i < r.pts.length; i++) {
      var ax = r.pts[i - 1][1] * kx,
        ay = r.pts[i - 1][0] * ky,
        bx = r.pts[i][1] * kx,
        by = r.pts[i][0] * ky,
        dx = bx - ax,
        dy = by - ay,
        l2 = dx * dx + dy * dy,
        t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      var d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d < best.d)
        best = { d: d, along: r.cum[i - 1] + t * Math.sqrt(l2) };
    }
    return best;
  }
  function updateProgress() {
    var r = state.route,
      y = you();
    if (!r || !y) {
      state.prog = null;
      return;
    }
    var pr = projectOnRoute(r, y),
      remain = Math.max(0, r.len - pr.along),
      idx = r.steps.length - 1;
    for (var i = 0; i < r.steps.length; i++)
      if (pr.along < r.steps[i].end) {
        idx = i;
        break;
      }
    var tol = Math.max(60, (y.acc || 0) * 1.3);
    state.prog = {
      along: pr.along,
      off: pr.d,
      offRoute: !r.fallback && pr.d > tol,
      remain: remain,
      eta: r.len ? (r.dur * remain) / r.len : 0,
      idx: idx,
      toNext: Math.max(0, r.steps[idx] ? r.steps[idx].end - pr.along : 0),
    };
  }

  /* ---------- GPS nyata ---------- */
  function secureOK() {
    return (
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    );
  }
  function onGpsPos(pos) {
    var c = pos.coords,
      g = state.gps,
      first = g.lat == null;
    g.status = "aktif";
    g.lat = c.latitude;
    g.lon = c.longitude;
    g.acc = c.accuracy;
    g.heading = c.heading;
    g.speed = c.speed;
    if (first) {
      state.route = null;
      state.prog = null;
      rebaseSeeds();
    }
    refreshYouAddr();
    onYouMoved(first);
  }
  var lastGpsToast = 0;
  function onGpsErr(err) {
    var g = state.gps,
      code = err && err.code;
    if (code === 1) {
      /* izin ditolak: berhenti total */
      g.status = "error";
      g.on = false;
      state.nav.pending = false;
      if (g.watchId != null && navigator.geolocation)
        navigator.geolocation.clearWatch(g.watchId);
      g.watchId = null;
      toast(
        'Izin lokasi ditolak. Di iPhone: Pengaturan > Safari > Lokasi (atau tombol "aA" di address bar > Pengaturan Situs), izinkan, lalu muat ulang halaman.',
      );
      updateGpsUI();
      updateRoute();
      return;
    }
    /* sinyal hilang sesaat: tetap menunggu, posisi terakhir dipertahankan */
    if (g.lat == null) g.status = "mencari";
    if (Date.now() - lastGpsToast > 20000) {
      lastGpsToast = Date.now();
      toast(
        code === 3
          ? "Sinyal GPS lambat. Coba di luar ruangan atau dekat jendela."
          : "Sinyal lokasi sedang tidak tersedia. Mencoba lagi…",
      );
    }
    updateGpsUI();
  }
  function gpsStart() {
    var g = state.gps;
    if (g.on) return;
    if (!("geolocation" in navigator)) {
      toast("Browser ini tidak mendukung GPS.");
      return;
    }
    if (!secureOK()) {
      toast(
        "GPS hanya jalan di alamat https:// (atau localhost). Buka situs ini lewat https agar izin lokasi muncul.",
      );
      return;
    }
    g.on = true;
    g.status = "mencari";
    g.lat = g.lon = null;
    updateGpsUI();
    g.watchId = navigator.geolocation.watchPosition(onGpsPos, onGpsErr, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 20000,
    });
  }
  function gpsStop() {
    var g = state.gps;
    if (g.watchId != null && navigator.geolocation)
      navigator.geolocation.clearWatch(g.watchId);
    g.watchId = null;
    g.on = false;
    g.status = "off";
    g.lat = g.lon = null;
    state.nav.pending = false;
    if (state.nav.on) stopNav();
    paintYouAll();
    updateGpsUI();
    updateRoute();
    if (state.view === "arah") recompute();
  }
  /* Pertama kali GPS aktif: pindahkan data contoh ke sekitar posisi Anda. */
  function rebaseSeeds() {
    var y = you();
    if (!y || state.anchor.fromGps) return;
    state.anchor = { lat: y.lat, lon: y.lon, fromGps: true };
    state.route = null;
    state.prog = null;
    function mv(o) {
      if (!o.off) return;
      var p = offToLL(state.anchor, o.off[0], o.off[1]);
      o.lat = p.lat;
      o.lon = p.lon;
    }
    state.items.forEach(function (it) {
      mv(it);
      (it.hist || []).forEach(mv);
    });
    state.zones.forEach(mv);
    save();
    render();
    fitCurrent();
    toast("Contoh barang dipindahkan ke sekitar lokasi Anda agar rute bisa dicoba.");
  }
  function refreshYouAddr() {
    var y = you();
    if (!y) return;
    var now = Date.now(),
      moved = state.youAddrPos
        ? haversineM(y.lat, y.lon, state.youAddrPos.lat, state.youAddrPos.lon)
        : 1e9;
    if (moved < 40 && now - state.youAddrAt < 90000) return;
    state.youAddrAt = now;
    state.youAddrPos = { lat: y.lat, lon: y.lon };
    getAddr(y.lat, y.lon, true).then(function (t) {
      state.youAddr = t;
      updateGpsUI();
      updateFrom();
    });
  }
  function onYouMoved(first) {
    paintYouAll();
    updateGpsUI();
    var m = MAPS["mc-route"];
    if (state.view === "arah") {
      if (state.nav.pending) {
        state.nav.pending = false;
        if (state.route) startNav();
      }
      if (!state.route && !state.routeLoading) recompute();
      else {
        updateProgress();
        var p = state.prog;
        if (
          p &&
          p.offRoute &&
          !state.routeLoading &&
          Date.now() - state.routeAt > 8000
        ) {
          recompute();
          return;
        }
        if (state.nav.on && p && !state.nav.arrived && p.remain < 25) {
          state.nav.arrived = true;
          unwake();
          toast("Anda tiba di tujuan.");
        }
        updateRoute();
        if (state.nav.on && m && m.map && Date.now() > (m.pauseUntil || 0)) {
          var y = you();
          m.map.setView(
            [y.lat, y.lon],
            Math.max(m.map.getZoom(), 17),
            { animate: true },
          );
        }
      }
    } else if (state.view === "perangkat" || state.view === "lokasi") {
      var d = $("#f-dist");
      var it = cur(),
        y2 = you();
      if (d && it && y2)
        d.textContent = fmtM(haversineM(y2.lat, y2.lon, it.lat, it.lon));
    }
    if (first && state.view !== "arah") fitCurrent();
  }
  function gpsStatusText() {
    var g = state.gps;
    if (g.status === "mencari") return "Mencari sinyal GPS…";
    if (g.status === "error") return "Gagal mengambil lokasi. Coba nyalakan lagi.";
    if (g.status === "aktif")
      return (
        (state.youAddr ? state.youAddr + " · " : "") +
        "akurasi ± " +
        Math.round(g.acc || 0) +
        " m"
      );
    return state.anchor.fromGps
      ? "Nyalakan untuk melihat posisi Anda dan rute real-time."
      : "Nyalakan untuk melihat posisi Anda. Contoh barang akan dipindahkan ke sekitar Anda.";
  }
  function gpsCardHTML() {
    return (
      '<div class="card stack"><div class="row-sw"><div><b>Lokasi saya (GPS)</b><small data-gps-sub></small></div><button class="sw" type="button" role="switch" data-act="gps-toggle" data-gps-sw aria-checked="false" aria-label="Lacak lokasi saya"></button></div>' +
      (secureOK()
        ? ""
        : '<div class="note">' +
          ic("alert", 18) +
          "<span>Alamat ini bukan HTTPS, jadi browser menolak akses lokasi. Buka lewat https:// (mis. GitHub Pages) atau localhost.</span></div>") +
      "</div>"
    );
  }
  function updateGpsUI() {
    var on = state.gps.on;
    $$("[data-gps-sub]").forEach(function (el) {
      el.textContent = gpsStatusText();
    });
    $$("[data-gps-sw]").forEach(function (el) {
      el.setAttribute("aria-checked", on ? "true" : "false");
    });
  }
  var wl = null;
  function wake() {
    try {
      if ("wakeLock" in navigator)
        navigator.wakeLock
          .request("screen")
          .then(function (l) {
            wl = l;
          })
          .catch(function () {});
    } catch (e) {}
  }
  function unwake() {
    try {
      if (wl) wl.release();
    } catch (e) {}
    wl = null;
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state.nav.on && !state.nav.arrived) wake();
  });

  /* ---------- navigasi langsung ---------- */
  function startNav() {
    if (!state.route) return;
    var g = state.gps;
    if (!g.on || g.lat == null) {
      state.nav.pending = true;
      if (!g.on) gpsStart();
      toast("Menunggu sinyal GPS untuk memulai navigasi…");
      updateRoute();
      return;
    }
    state.nav = { on: true, pending: false, arrived: false };
    wake();
    updateProgress();
    updateRoute();
    var m = MAPS["mc-route"],
      y = you();
    if (m && m.map) m.map.setView([y.lat, y.lon], 17, { animate: true });
  }
  function stopNav() {
    state.nav = { on: false, pending: false, arrived: false };
    unwake();
  }

  /* ---------- peta (Leaflet) ---------- */
  var MAPS = {};
  var TILE =
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  function pinIcon(it, sel) {
    var col = sel ? "#F7A5A5" : !it.online ? "#8D94A6" : "#1A2A4F",
      ink = sel ? "#1A2A4F" : "#FFF2EF",
      edge = sel ? "#1A2A4F" : "#FFF2EF";
    return L.divIcon({
      className: "pinicon",
      html:
        (sel ? '<span class="halo"></span>' : "") +
        '<svg width="36" height="46" viewBox="0 0 36 46" aria-hidden="true"><path d="M18 44C18 44 4 29.5 4 18a14 14 0 1 1 28 0c0 11.5-14 26-14 26z" fill="' +
        col +
        '" stroke="' +
        edge +
        '" stroke-width="2.5" stroke-linejoin="round"/><g transform="translate(6 6)" fill="none" stroke="' +
        ink +
        '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        IC[(TYPES[it.type] || TYPES.other).i] +
        "</g></svg>",
      iconSize: [36, 46],
      iconAnchor: [18, 44],
      tooltipAnchor: [0, -40],
    });
  }
  function flagIcon() {
    return L.divIcon({
      className: "pinicon",
      html:
        '<svg width="36" height="46" viewBox="0 0 36 46" aria-hidden="true"><path d="M18 44C18 44 4 29.5 4 18a14 14 0 1 1 28 0c0 11.5-14 26-14 26z" fill="#F7A5A5" stroke="#1A2A4F" stroke-width="2.5" stroke-linejoin="round"/><g transform="translate(6 6)" fill="none" stroke="#1A2A4F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        IC.flag +
        "</g></svg>",
      iconSize: [36, 46],
      iconAnchor: [18, 44],
      tooltipAnchor: [0, -40],
    });
  }
  function ensureMap(id, mode) {
    if (MAPS[id]) return MAPS[id];
    var card = document.getElementById(id),
      host = $(".map", card);
    if (!window.L) {
      host.innerHTML =
        '<div class="mapfail">Peta tidak bisa dimuat. Periksa koneksi internet lalu muat ulang halaman.</div>';
      MAPS[id] = { card: card, mode: mode, map: null };
      return MAPS[id];
    }
    $$(".mapctl button", card).forEach(function (b) {
      var k = b.getAttribute("data-zoom");
      b.innerHTML = ic(
        k === "in" ? "plus" : k === "out" ? "minus" : k === "me" ? "navi" : "target",
        20,
      );
    });
    var a = state.anchor;
    var map = L.map(host, {
      zoomControl: false,
      attributionControl: true,
      zoomSnap: 0.5,
    }).setView([a.lat, a.lon], 15);
    var osm = L.tileLayer(TILE, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    var sat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics",
      },
    );
    L.control
      .layers({ Peta: osm, Satelit: sat }, null, {
        position: "bottomleft",
        collapsed: true,
      })
      .addTo(map);
    var m = (MAPS[id] = {
      card: card,
      mode: mode,
      map: map,
      layer: L.layerGroup().addTo(map),
      youLayer: L.layerGroup().addTo(map),
      pauseUntil: 0,
    });
    map.on("dragstart", function () {
      m.pauseUntil = Date.now() + 12000;
    });
    map.on("click", function (e) {
      onMapClick(id, e.latlng);
    });
    card.addEventListener("click", function (e) {
      var zb = e.target.closest("[data-zoom]");
      if (!zb || !m.map) return;
      var k = zb.getAttribute("data-zoom");
      if (k === "in") m.map.zoomIn();
      else if (k === "out") m.map.zoomOut();
      else if (k === "fit") fit(id);
      else if (k === "me") {
        var y = you();
        if (y) {
          m.pauseUntil = 0;
          m.map.setView([y.lat, y.lon], Math.max(m.map.getZoom(), 16), {
            animate: true,
          });
        } else if (!state.gps.on) {
          gpsStart();
        } else toast("Masih mencari sinyal GPS…");
      }
    });
    paintYou(m);
    return m;
  }
  function paintYou(m) {
    if (!m || !m.map) return;
    m.youLayer.clearLayers();
    var y = you();
    if (!y) return;
    if (y.acc && y.acc > 8)
      L.circle([y.lat, y.lon], {
        radius: y.acc,
        color: "#1A2A4F",
        weight: 1,
        opacity: 0.35,
        fillColor: "#1A2A4F",
        fillOpacity: 0.07,
        interactive: false,
      }).addTo(m.youLayer);
    L.marker([y.lat, y.lon], {
      icon: L.divIcon({
        className: "youicon",
        html: "<i></i>",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    }).addTo(m.youLayer);
  }
  function paintYouAll() {
    Object.keys(MAPS).forEach(function (id) {
      paintYou(MAPS[id]);
    });
  }
  function itemMarker(it, sel, layer) {
    var mk = L.marker([it.lat, it.lon], {
      icon: pinIcon(it, sel),
      zIndexOffset: sel ? 500 : 0,
      title: it.name,
      keyboard: true,
    }).addTo(layer);
    if (sel)
      mk.bindTooltip(esc(it.name), {
        permanent: true,
        direction: "top",
        className: "nm",
        offset: [0, -2],
      });
    mk.on("click", function () {
      selectItem(it.id);
    });
    return mk;
  }
  function drawMap(id) {
    var m = MAPS[id];
    if (!m || !m.map) return;
    var layer = m.layer,
      sel = cur();
    layer.clearLayers();
    if (m.mode === "location") {
      state.zones.forEach(function (z) {
        L.circle([z.lat, z.lon], {
          radius: z.r,
          color: "#1A2A4F",
          weight: 1.5,
          opacity: z.on ? 0.7 : 0.25,
          dashArray: "6 6",
          fillColor: "#FFDBB6",
          fillOpacity: z.on ? 0.35 : 0.1,
          interactive: false,
        })
          .bindTooltip(esc(z.name), {
            permanent: true,
            direction: "center",
            className: "dt",
          })
          .addTo(layer);
      });
      if (sel && sel.hist && sel.hist.length) {
        if (sel.hist.length > 1)
          L.polyline(
            sel.hist.map(function (p) {
              return [p.lat, p.lon];
            }),
            {
              color: "#1A2A4F",
              weight: 3,
              opacity: 0.8,
              dashArray: "1 8",
              lineCap: "round",
              interactive: false,
            },
          ).addTo(layer);
        sel.hist.forEach(function (p, i) {
          var on = i === state.hist;
          var c = L.circleMarker([p.lat, p.lon], {
            radius: on ? 9 : 5,
            color: "#1A2A4F",
            weight: 2,
            fillColor: on ? "#F7A5A5" : "#FFF2EF",
            fillOpacity: 1,
          }).addTo(layer);
          if (on)
            c.bindTooltip(esc(p.t), {
              permanent: true,
              direction: "top",
              className: "dt",
            });
          c.on("click", function () {
            state.hist = i;
            renderLocation();
            drawMap("mc-location");
          });
        });
      }
    }
    if (m.mode === "devices" || m.mode === "location") {
      if (sel)
        L.circle([sel.lat, sel.lon], {
          radius: sel.acc || 20,
          color: "#F7A5A5",
          weight: 1.5,
          dashArray: "4 4",
          fillColor: "#F7A5A5",
          fillOpacity: 0.2,
          interactive: false,
        }).addTo(layer);
      state.items.forEach(function (it) {
        if (it.id !== state.sel) itemMarker(it, false, layer);
      });
      if (sel) itemMarker(sel, true, layer);
    }
    if (m.mode === "route") {
      var r = state.route,
        d = dest(),
        y = you();
      if (r) {
        var ll = r.pts;
        L.polyline(ll, {
          color: "#FFFFFF",
          weight: 11,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(layer);
        L.polyline(ll, {
          color: "#1A2A4F",
          weight: 6,
          opacity: r.fallback ? 0.5 : 1,
          dashArray: r.fallback ? "2 10" : null,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(layer);
        if (!r.fallback) {
          if (y && haversineM(y.lat, y.lon, ll[0][0], ll[0][1]) > 8)
            L.polyline([[y.lat, y.lon], ll[0]], {
              color: "#1A2A4F",
              weight: 3,
              dashArray: "2 7",
              interactive: false,
            }).addTo(layer);
          var last = ll[ll.length - 1];
          if (d && haversineM(d.lat, d.lon, last[0], last[1]) > 8)
            L.polyline([last, [d.lat, d.lon]], {
              color: "#1A2A4F",
              weight: 3,
              dashArray: "2 7",
              interactive: false,
            }).addTo(layer);
        }
      }
      if (d) {
        var it = d.item
          ? state.items.filter(function (x) {
              return x.id === d.item;
            })[0]
          : null;
        var mk = L.marker([d.lat, d.lon], {
          icon: it ? pinIcon(it, true) : flagIcon(),
          zIndexOffset: 500,
          keyboard: false,
        }).addTo(layer);
        mk.bindTooltip(esc(d.name), {
          permanent: true,
          direction: "top",
          className: "nm",
          offset: [0, -2],
        });
      }
    }
    if (m.mode === "pick") {
      var p = state.add.pos || you() || state.anchor;
      var tmp = {
        type: state.add.type,
        online: true,
      };
      var pk = L.marker([p.lat, p.lon], {
        icon: pinIcon(tmp, true),
        draggable: true,
        zIndexOffset: 500,
      }).addTo(layer);
      pk.on("dragend", function () {
        var ll2 = pk.getLatLng();
        state.add.pos = { lat: ll2.lat, lon: ll2.lng };
        renderAddAfter();
      });
    }
  }
  function onMapClick(id, ll) {
    var m = MAPS[id];
    if (!m) return;
    if (m.mode === "route") {
      if (state.gps.on) return;
      stopNav();
      state.manual = { lat: ll.lat, lon: ll.lng };
      save();
      paintYouAll();
      updateFrom();
      recompute();
    } else if (m.mode === "pick") {
      state.add.pos = { lat: ll.lat, lon: ll.lng };
      renderAddAfter();
      drawMap("mc-pick");
    } else if (m.mode === "devices" && state.placing) {
      var it = cur();
      if (!it) return;
      moveItem(it, ll.lat, ll.lng, "Posisi diperbarui manual");
      state.placing = false;
      render();
      toast(it.name + " dipindahkan ke titik yang Anda ketuk.");
    }
  }
  function moveItem(it, lat, lon, label) {
    it.lat = lat;
    it.lon = lon;
    delete it.off;
    it.seen = "Baru saja";
    it.online = true;
    it.hist = (it.hist || []).concat([
      { t: hhmm(), lat: lat, lon: lon, l: label },
    ]);
    save();
  }
  function fit(id) {
    var m = MAPS[id];
    if (!m || !m.map) return;
    m.map.invalidateSize();
    var it = cur(),
      y = you(),
      pad = { padding: [50, 50], maxZoom: 17, animate: true };
    if (m.mode === "route") {
      var r = state.route;
      if (r && r.pts.length > 1) {
        var b = L.latLngBounds(r.pts);
        if (y) b.extend([y.lat, y.lon]);
        return m.map.fitBounds(b, pad);
      }
      var d = dest();
      if (y && d) return m.map.fitBounds([[y.lat, y.lon], [d.lat, d.lon]], pad);
      if (d) return m.map.setView([d.lat, d.lon], 16);
      if (y) return m.map.setView([y.lat, y.lon], 16);
      return;
    }
    if (m.mode === "pick") {
      var p = state.add.pos || y || state.anchor;
      return m.map.setView([p.lat, p.lon], 17);
    }
    if (m.mode === "location" && it && it.hist && it.hist.length > 1) {
      var b2 = L.latLngBounds(
        it.hist.map(function (p) {
          return [p.lat, p.lon];
        }),
      );
      return m.map.fitBounds(b2, pad);
    }
    if (it) {
      if (
        y &&
        m.mode === "devices" &&
        haversineM(y.lat, y.lon, it.lat, it.lon) < 4000
      )
        return m.map.fitBounds([[y.lat, y.lon], [it.lat, it.lon]], pad);
      return m.map.setView([it.lat, it.lon], 16);
    }
    if (y) m.map.setView([y.lat, y.lon], 16);
  }
  var VIEW_MAP = {
    perangkat: ["mc-devices", "devices"],
    arah: ["mc-route", "route"],
    lokasi: ["mc-location", "location"],
  };
  function fitCurrent() {
    var v = VIEW_MAP[state.view];
    if (v && MAPS[v[0]]) fit(v[0]);
  }

  /* ---------- aksi umum ---------- */
  var toastT;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () {
      t.classList.remove("show");
    }, 3600);
  }
  function selectItem(id) {
    if (state.sel !== id) {
      stopNav();
      state.hist = -1;
      state.confirmDel = null;
      state.placing = false;
    }
    state.sel = id;
    state.dest = null;
    render();
    if (state.view === "arah") recompute();
    else {
      drawMapsForView();
      fitCurrent();
    }
  }
  function drawMapsForView() {
    var v = VIEW_MAP[state.view];
    if (v) drawMap(v[0]);
  }

  /* ---------- render: perangkat ---------- */
  function batHTML(b) {
    return (
      '<span class="bat' +
      (b < 30 ? " low" : "") +
      '"><i><b style="width:' +
      b +
      '%"></b></i>' +
      b +
      "%</span>"
    );
  }
  function statusChip(it) {
    return it.lost
      ? '<span class="chip lost">Hilang</span>'
      : it.online
        ? '<span class="chip on">Online</span>'
        : '<span class="chip">Offline</span>';
  }
  function itemCard(it) {
    var sel = it.id === state.sel,
      z = zoneOf(it),
      y = you(),
      h = '<article class="item" data-sel="' + sel + '">';
    h +=
      '<button class="item-head" type="button" data-act="select" data-id="' +
      it.id +
      '" aria-expanded="' +
      sel +
      '"><span class="item-ico' +
      (it.type === "tumbler" ? " tum" : "") +
      '">' +
      ic(TYPES[it.type].i, 24) +
      '</span><span class="item-main"><b>' +
      esc(it.name) +
      "</b><small>" +
      esc(it.seen) +
      "</small></span>" +
      statusChip(it) +
      "</button>";
    if (sel) {
      h +=
        '<div class="item-body"><dl class="facts"><div class="wide"><dt>Lokasi</dt><dd>' +
        addrSpan(it.lat, it.lon) +
        "</dd></div><div><dt>Jarak dari Anda</dt><dd id=\"f-dist\">" +
        (y ? fmtM(haversineM(y.lat, y.lon, it.lat, it.lon)) : "Nyalakan GPS") +
        "</dd></div><div><dt>Zona</dt><dd>" +
        (z ? esc(z.name) : "Di luar Zona Aman") +
        "</dd></div><div><dt>Baterai tag</dt><dd>" +
        batHTML(it.battery) +
        "</dd></div><div><dt>Jaringan</dt><dd>" +
        esc(it.net) +
        "</dd></div></dl>";
      if (state.alertOn && !z && it.online && !it.lost)
        h +=
          '<div class="note">' +
          ic("alert", 18) +
          "<span>" +
          esc(it.name) +
          " berada di luar Zona Aman. Pengingat tertinggal aktif.</span></div>";
      if (it.lost)
        h +=
          '<div class="note bad">' +
          ic("alert", 18) +
          "<span>Mode Hilang aktif. Anda diberi tahu saat perangkat lain di jaringan menemukan barang ini.</span></div>";
      if (!it.online)
        h +=
          '<div class="note info">' +
          ic("bell", 18) +
          "<span>Tag di luar jangkauan. Posisi di peta adalah lokasi terakhir yang terbaca.</span></div>";
      if (it.battery < 30)
        h +=
          '<div class="note">' +
          ic("alert", 18) +
          "<span>Baterai tag tinggal " +
          it.battery +
          "%. Ganti atau isi ulang segera.</span></div>";
      h +=
        '<div class="actions"><button class="btn primary sm" type="button" data-act="go">' +
        ic("route", 18) +
        'Arah</button><button class="btn sm" type="button" data-act="place-item" aria-pressed="' +
        state.placing +
        '">' +
        ic("pin", 18) +
        "Tandai di peta</button>" +
        (y
          ? '<button class="btn sm" type="button" data-act="item-here">' +
            ic("target", 18) +
            "Taruh di posisi saya</button>"
          : "") +
        '<button class="btn sm" type="button" data-act="lost" aria-pressed="' +
        it.lost +
        '">' +
        ic("shield", 18) +
        "Mode Hilang</button>";
      if (state.confirmDel === it.id)
        h +=
          '<button class="btn sm" type="button" data-act="del-yes">Ya, hapus</button><button class="btn sm" type="button" data-act="del-no">Batal</button>';
      else
        h +=
          '<button class="btn sm" type="button" data-act="del" aria-label="Hapus ' +
          esc(it.name) +
          '">' +
          ic("trash", 18) +
          "</button>";
      h += "</div></div>";
    }
    return h + "</article>";
  }
  function renderDevices() {
    var on = state.items.filter(function (i) {
      return i.online;
    }).length;
    $("#sub-perangkat").textContent =
      state.items.length +
      " barang terlacak · " +
      on +
      " online · " +
      (state.items.length - on) +
      " offline";
    $("#dev-gps").innerHTML = gpsCardHTML();
    $("#list").innerHTML = state.items.length
      ? state.items.map(itemCard).join("")
      : '<div class="card"><p><b>Belum ada barang.</b> Tambahkan tag pertama Anda untuk melihatnya di peta.</p></div>';
    $("#add-shortcut").innerHTML = ic("plus", 18) + "Tambah barang";
    var it = cur();
    $("#note-devices").textContent = state.placing
      ? "Ketuk peta untuk memindahkan " + (it ? it.name : "barang")
      : "";
    updateGpsUI();
    drawMap("mc-devices");
  }

  /* ---------- render: arah ---------- */
  function fromTextHTML() {
    var y = you(),
      g = state.gps;
    if (g.on && g.lat != null)
      return esc(state.youAddr || "Lokasi saya") + ' <span class="chip on">GPS aktif</span>';
    if (g.on) return "Mencari sinyal GPS…";
    if (y) return "Titik di peta · " + addrSpan(y.lat, y.lon);
    return "Belum ada titik awal";
  }
  function updateFrom() {
    var el = $("#rt-from");
    if (el) el.innerHTML = fromTextHTML();
  }
  function stepsHTML() {
    var r = state.route,
      p = state.prog;
    if (!r) return "";
    var ci = state.nav.on && p ? p.idx : -1;
    return r.steps
      .map(function (s, i) {
        return (
          '<li class="' +
          (i === ci ? "cur" : ci >= 0 && i < ci ? "done" : "") +
          '"><span class="sic">' +
          ic(s.i, 18) +
          "</span><span>" +
          esc(s.t) +
          "</span><small>" +
          (s.d > 1 ? fmtM(s.d) : "") +
          "</small></li>"
        );
      })
      .join("");
  }
  function renderRoute() {
    var box = $("#route-panel");
    var h = '<div id="rt-now"></div>';
    h +=
      '<div class="card stack"><div class="rt-from"><span class="dotyou"></span><div><small>Dari</small><b id="rt-from"></b></div></div>' +
      '<div class="rt-from"><span class="dotto"></span><div><small>Ke</small><b id="rt-to"></b></div></div>' +
      '<div class="seg" role="group" aria-label="Moda perjalanan">' +
      Object.keys(MODES)
        .map(function (k) {
          return (
            '<button type="button" data-mode="' +
            k +
            '" aria-pressed="' +
            (state.mode === k) +
            '">' +
            MODES[k].n +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="rt-sum"><div><b id="rt-dist">–</b><small>jarak tersisa</small></div><div><b id="rt-eta">–</b><small id="rt-eta-l">perkiraan waktu</small></div></div>' +
      '<div class="prog" aria-hidden="true"><b id="rt-bar" style="width:0%"></b></div>' +
      '<div class="actions" id="rt-actions"></div><small id="rt-msg"></small></div>';
    h += gpsCardHTML();
    h +=
      '<div class="card stack"><h2>Tujuan</h2>' +
      '<div class="chips" role="group" aria-label="Pilih barang" id="rt-chips"></div>' +
      searchHTML("dest", "Cari alamat atau tempat") +
      "</div>";
    h += '<div id="rt-near"></div>';
    h +=
      '<div class="card stack"><h2>Petunjuk arah</h2><ol class="steps" id="rt-steps"></ol></div>';
    box.innerHTML = h;
    updateGpsUI();
    updateRoute();
  }
  function updateRoute() {
    if (state.view !== "arah" || !$("#rt-dist")) return;
    var r = state.route,
      p = state.prog,
      d = dest(),
      y = you(),
      g = state.gps,
      nav = state.nav;
    updateFrom();
    $("#rt-to").innerHTML = d
      ? esc(d.name) +
        '<small style="display:block;font-weight:500">' +
        addrSpan(d.lat, d.lon) +
        "</small>"
      : "Pilih barang atau cari alamat";
    $("#rt-chips").innerHTML = state.items
      .map(function (i) {
        return (
          '<button class="chipbtn" type="button" data-act="dest-item" data-id="' +
          i.id +
          '" aria-pressed="' +
          (!state.dest && i.id === state.sel) +
          '">' +
          ic(TYPES[i.type].i, 18) +
          esc(i.name) +
          "</button>"
        );
      })
      .join("");
    $$("[data-mode]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-mode") === state.mode);
    });
    var remain = p ? p.remain : r ? r.len : 0,
      eta = p ? p.eta : r ? r.dur : 0;
    $("#rt-dist").textContent = r ? fmtM(remain) : "–";
    $("#rt-eta").textContent = r ? fmtDur(eta) : "–";
    $("#rt-eta-l").textContent = MODES[state.mode].n.toLowerCase();
    $("#rt-bar").style.width =
      r && p && r.len ? Math.min(100, (p.along / r.len) * 100) + "%" : "0%";
    /* tombol */
    var a = "";
    if (nav.on)
      a +=
        '<button class="btn" type="button" data-act="nav-stop">Hentikan navigasi</button>';
    else
      a +=
        '<button class="btn primary" type="button" data-act="nav-start"' +
        (r && !state.routeLoading ? "" : " disabled") +
        ">" +
        ic("navi", 18) +
        (nav.pending ? "Menunggu GPS…" : "Mulai navigasi") +
        "</button>";
    $("#rt-actions").innerHTML = a;
    /* pesan */
    var msg = "";
    if (state.routeLoading) msg = "Mencari rute…";
    else if (!y)
      msg = g.on
        ? "Mencari sinyal GPS…"
        : "Nyalakan GPS di atas, atau ketuk peta untuk menentukan titik awal.";
    else if (state.routeErr) msg = state.routeErr;
    else if (!g.on) msg = "Ketuk peta untuk memindahkan titik awal.";
    else if (p && p.offRoute && !nav.arrived) msg = "Anda keluar jalur. Menghitung ulang rute…";
    $("#rt-msg").textContent = msg;
    var note = $("#note-route");
    if (note)
      note.textContent = g.on
        ? nav.on
          ? "Peta mengikuti posisi Anda"
          : ""
        : "Ketuk peta untuk memindahkan titik awal";
    /* kartu instruksi saat navigasi */
    var now = "";
    if (nav.on && r && p) {
      if (nav.arrived)
        now =
          '<div class="now"><span class="nic">' +
          ic("flag", 28) +
          "</span><div><b>Anda tiba di tujuan</b><span>" +
          esc(d ? d.name : "") +
          "</span></div></div>";
      else {
        var s = r.steps[p.idx];
        now =
          '<div class="now"><span class="nic">' +
          ic(s ? s.i : "up", 28) +
          "</span><div><b>" +
          esc(s ? s.t : "Ikuti rute") +
          "</b><span>" +
          (s && s.i !== "flag" ? "dalam " + fmtM(p.toNext) + " · " : "") +
          fmtM(p.remain) +
          " lagi</span></div></div>";
      }
    }
    $("#rt-now").innerHTML = now;
    /* dekat barang */
    var near = "";
    if (d && d.item && y) {
      var dm = haversineM(y.lat, y.lon, d.lat, d.lon);
      if (dm <= 30)
        near =
          '<div class="card nearbox"><span class="nic">' +
          ic("check", 26) +
          '</span><div><span class="big">± ' +
          Math.max(1, Math.round(dm)) +
          " m</span><br><small>" +
          (dm < 5
            ? "Tepat di dekat Anda"
            : "Arah " +
              compassName(bearingDeg(y.lat, y.lon, d.lat, d.lon)) +
              " dari Anda") +
          ". Tag sudah dalam jangkauan Bluetooth.</small></div></div>";
    }
    $("#rt-near").innerHTML = near;
    $("#rt-steps").innerHTML = stepsHTML();
  }

  /* ---------- render: lokasi ---------- */
  function renderLocation() {
    var it = cur(),
      box = $("#loc-panel"),
      y = you(),
      h = gpsCardHTML();
    h +=
      '<div class="card stack"><h2>Barang</h2><div class="chips" role="group" aria-label="Pilih barang">' +
      state.items
        .map(function (i) {
          return (
            '<button class="chipbtn" type="button" data-act="select" data-id="' +
            i.id +
            '" aria-pressed="' +
            (i.id === state.sel) +
            '">' +
            ic(TYPES[i.type].i, 18) +
            esc(i.name) +
            "</button>"
          );
        })
        .join("") +
      "</div>";
    if (it) {
      var z = zoneOf(it);
      h +=
        '<div class="sumline">' +
        statusChip(it) +
        '<span class="chip plain">' +
        addrSpan(it.lat, it.lon) +
        '</span><span class="chip plain">' +
        (z ? "Di " + esc(z.name) : "Di luar Zona Aman") +
        "</span></div>";
    }
    h += "</div>";
    if (it) {
      h +=
        '<div class="card stack"><h2>Riwayat lokasi</h2><ol class="tl">' +
        (it.hist || [])
          .map(function (p, i) {
            return (
              '<li><button type="button" data-act="hist" data-i="' +
              i +
              '" aria-pressed="' +
              (state.hist === i) +
              '"><span class="tm">' +
              esc(p.t) +
              '</span><span class="dt"></span><span class="tx">' +
              (p.l ? esc(p.l) : addrSpan(p.lat, p.lon)) +
              "</span></button></li>"
            );
          })
          .join("") +
        "</ol><small>Ketuk satu titik untuk menandainya di peta.</small></div>";
    }
    h +=
      '<div class="card stack"><h2>Zona Aman</h2><div>' +
      state.zones
        .map(function (p) {
          return (
            '<div class="row-sw"><div><b>' +
            esc(p.name) +
            "</b><small>Radius " +
            p.r +
            " m" +
            (y
              ? ' · <button class="link" type="button" data-act="zone-here" data-id="' +
                p.id +
                '">Pakai posisi saya</button>'
              : "") +
            '</small></div><button class="sw" type="button" role="switch" data-act="zone" data-id="' +
            p.id +
            '" aria-checked="' +
            !!p.on +
            '" aria-label="Zona Aman ' +
            esc(p.name) +
            '"></button></div>'
          );
        })
        .join("") +
      '<div class="row-sw"><div><b>Pengingat barang tertinggal</b><small>Beri tahu saat barang berada di luar semua Zona Aman aktif</small></div><button class="sw" type="button" role="switch" data-act="alert" aria-checked="' +
      state.alertOn +
      '" aria-label="Pengingat barang tertinggal"></button></div></div></div>';
    box.innerHTML = h;
    updateGpsUI();
    drawMap("mc-location");
  }

  /* ---------- render: tambah ---------- */
  var ADDSTEPS = ["Pilih barang", "Pasangkan tag", "Tandai lokasi"];
  function defName(t) {
    return {
      tumbler: "Tumbler baru",
      key: "Kunci baru",
      bag: "Tas baru",
      wallet: "Dompet baru",
      other: "Barang baru",
    }[t];
  }
  function renderAdd() {
    var a = state.add;
    $("#stepper").innerHTML = ADDSTEPS.map(function (s, i) {
      var n = i + 1;
      return (
        '<li class="' +
        (a.step > n ? "ok" : "") +
        '" ' +
        (a.step === n ? 'aria-current="step"' : "") +
        '><span class="n">' +
        (a.step > n ? ic("check", 16) : n) +
        "</span>" +
        s +
        "</li>"
      );
    }).join("");
    var h = "";
    if (a.step === 1) {
      h +=
        '<h2>Barang apa yang ingin dilacak?</h2><div class="types" role="radiogroup" aria-label="Jenis barang">' +
        Object.keys(TYPES)
          .map(function (k) {
            return (
              '<button class="typ" type="button" role="radio" data-act="type" data-k="' +
              k +
              '" aria-checked="' +
              (a.type === k) +
              '">' +
              ic(TYPES[k].i, 26) +
              TYPES[k].n +
              "</button>"
            );
          })
          .join("") +
        "</div>";
      h +=
        '<div class="field"><label for="nameInput">Nama barang</label><input id="nameInput" type="text" maxlength="40" autocomplete="off" placeholder="' +
        esc(defName(a.type)) +
        '" value="' +
        esc(a.name) +
        '"></div>';
      h +=
        '<div class="field"><span class="lbl">HP yang dipakai untuk melacak</span><div class="seg" role="group" aria-label="Jenis HP"><button type="button" data-plat="ios" aria-pressed="' +
        (a.platform === "ios") +
        '">iPhone / iPad</button><button type="button" data-plat="android" aria-pressed="' +
        (a.platform === "android") +
        '">Android</button></div></div>';
      h +=
        '<div class="note info">' +
        ic("phone", 18) +
        "<span>Tag dual-network aktif di satu jaringan sekali waktu: Find My untuk iPhone atau Find Hub untuk Android. Untuk pindah jaringan, tag perlu direset.</span></div>";
      h +=
        '<div class="nav2"><span></span><button class="btn primary" type="button" data-act="next">Lanjut</button></div>';
    }
    if (a.step === 2) {
      var ios = a.platform === "ios",
        net = ios ? "Find My" : "Find Hub";
      h += "<h2>Pasangkan tag ke " + net + "</h2>";
      h +=
        '<ol class="how">' +
        (ios
          ? "<li><span>Nyalakan tag: tarik pelindung baterai atau tekan lama sampai berbunyi.</span></li><li><span>Buka aplikasi <b>Lacak (Find My)</b>, pilih tab <b>Barang</b>, lalu <b>Tambah Barang Baru</b> dan <b>Tambah Barang Lainnya</b>. Butuh iOS 14.5 atau lebih baru.</span></li><li><span>Dekatkan tag ke iPhone, ikuti layar, lalu beri nama.</span></li>"
          : "<li><span>Aktifkan Bluetooth dan Lokasi di HP. Butuh Android 9 atau lebih baru.</span></li><li><span>Nyalakan tag di dekat HP, lalu ketuk notifikasi pairing yang muncul, atau buka <b>Find Hub</b> dan tambahkan perangkat.</span></li><li><span>Pilih nama barang dan selesaikan pairing.</span></li>") +
        "</ol>";
      var sc = a.scan;
      h += '<div class="scan' + (sc === "scanning" ? " go" : "") + '">';
      if (sc === "idle")
        h +=
          '<div class="radar-s">' +
          ic("tag", 40) +
          "</div><b>Simulasi pairing</b><small>Dekatkan tag, lalu cari. Di sini hanya contoh alur; pairing sungguhan dilakukan di aplikasi " +
          net +
          '.</small><button class="btn primary" type="button" data-act="scan">Cari tag di sekitar</button>';
      if (sc === "scanning")
        h +=
          '<div class="radar-s">' +
          ic("tag", 40) +
          "</div><b>Mencari tag…</b><small>Pastikan tag menyala dan dekat dengan HP.</small>";
      if (sc === "found")
        h +=
          '<div class="radar-s">' +
          ic("tag", 40) +
          "</div><b>Tag " +
          esc(a.tag) +
          ' ditemukan</b><small>Sinyal kuat · baterai 100%</small><button class="btn primary" type="button" data-act="pair">Hubungkan ke ' +
          net +
          "</button>";
      if (sc === "paired")
        h +=
          '<span class="okc">' +
          ic("check", 30) +
          "</span><b>Terhubung ke " +
          net +
          "</b><small>" +
          esc(a.name || defName(a.type)) +
          " siap diberi lokasi.</small>";
      h += "</div>";
      h +=
        '<div class="nav2"><button class="btn" type="button" data-act="back">Kembali</button><button class="btn primary" type="button" data-act="next"' +
        (sc === "paired" ? "" : " disabled") +
        ">Lanjut</button></div>";
    }
    if (a.step === 3) {
      h +=
        "<h2>Di mana barang berada sekarang?</h2><p>Cari alamatnya, pakai lokasi GPS Anda, atau ketuk peta. Setelah itu posisi diperbarui oleh jaringan " +
        (a.platform === "ios" ? "Find My" : "Find Hub") +
        ".</p>";
      h += searchHTML("add", "Cari alamat atau tempat");
      h +=
        '<div><button class="btn sm" type="button" data-act="use-gps">' +
        ic("target", 18) +
        "Pakai lokasi GPS saya sekarang</button></div>";
    }
    $("#add-panel").innerHTML = h;
    $("#addmap").hidden = a.step !== 3;
    $("#add-after").hidden = a.step !== 3;
    if (a.step === 3) {
      if (!a.pos) {
        var y = you();
        a.pos = y
          ? { lat: y.lat, lon: y.lon }
          : { lat: state.anchor.lat, lon: state.anchor.lon };
      }
      ensureMap("mc-pick", "pick");
      renderAddAfter();
      drawMap("mc-pick");
      fit("mc-pick");
    }
  }
  function renderAddAfter() {
    var a = state.add,
      p = a.pos;
    if (!p) return;
    $("#add-after").innerHTML =
      '<div class="sumline"><span class="chip plain">' +
      addrSpan(p.lat, p.lon) +
      '</span><span class="chip plain">' +
      esc(a.name || defName(a.type)) +
      '</span></div><div class="nav2"><button class="btn" type="button" data-act="back">Kembali</button><button class="btn primary" type="button" data-act="save-item">' +
      ic("check", 18) +
      "Simpan barang</button></div>";
  }
  var scanT;
  function resetAdd() {
    clearTimeout(scanT);
    state.add = {
      step: 1,
      type: "tumbler",
      name: "",
      platform: state.add.platform,
      scan: "idle",
      tag: "",
      pos: null,
    };
  }

  /* ---------- render: panduan ---------- */
  var HS = {
    A: {
      t: "A · Tutup perak",
      s: 1,
      bad: true,
      lab: "Sinyal terhambat",
      p: "Logam perak meredam Bluetooth. Jangan menaruh tag di dalam atau di bawah tutup logam. Cincin cyan di atas bisa dipakai sebagai lampu status, misalnya menyala saat tag terhubung (ide untuk versi berikutnya).",
    },
    B: {
      t: "B · Grip hitam bertekstur",
      s: 4,
      bad: false,
      lab: "Sinyal baik, cocok untuk prototipe 1",
      p: "Buat kantong tag di luar badan logam, di bawah sleeve silikon. Tag tidak tertutup logam, mudah diganti, dan tumbler tidak perlu dibongkar. Jauhkan dari dinding dalam yang panas saat minuman hangat.",
    },
    C: {
      t: "C · Dasar hitam",
      s: 4,
      bad: false,
      lab: "Sinyal baik jika dasarnya plastik atau silikon",
      p: "Buat kompartemen tag di dasar dengan penutup plastik atau silikon. Tersembunyi dan terlindung dari benturan. Jika dasar tumbler logam, sediakan jendela plastik di sisi bawah. Cocok untuk prototipe 2.",
    },
  };
  var CHECK = [
    [
      "Siapkan tag dual-network",
      "Pilih tag yang tertulis Find My dan Find Hub, rating IP6/7 atau lebih. Beli 2 atau 3 buah dari merek berbeda untuk dibandingkan.",
    ],
    [
      "Pasangkan dan tes sebelum dipasang",
      "Hubungkan tag ke HP, beri nama, lalu pastikan posisinya muncul di aplikasi. Kalau gagal di luar botol, tidak akan berhasil di dalam botol.",
    ],
    [
      "Ukur tag dan tumbler",
      "Tag bulat berbaterai koin biasanya sekitar 32 × 32 × 8 mm, tetapi ukur tag yang Anda beli dengan jangka sorong.",
    ],
    [
      "Pilih posisi: B untuk prototipe 1, C untuk prototipe 2",
      "Hindari bagian logam. Kantong silikon di grip adalah cara tercepat tanpa membongkar tumbler.",
    ],
    [
      "Pasang dengan aman",
      "Tempelkan kantong atau kompartemen dengan silikon food-grade. Pastikan tag tidak menyentuh area minuman dan tutup baterai tetap bisa dibuka.",
    ],
    [
      "Lindungi dari air dan panas",
      "Baterai koin umumnya tidak cocok untuk suhu tinggi. Letakkan tag di luar dinding yang menahan minuman panas, lalu cek suhu permukaannya.",
    ],
    [
      "Uji sinyal",
      "Taruh tumbler di dalam tas, lalu jauhkan 10 sampai 20 m. Cek apakah tag masih terbaca di aplikasi.",
    ],
    [
      "Uji lapangan 1 sampai 2 minggu",
      "Bawa ke kampus, kantor, dan transportasi. Catat seberapa sering lokasinya diperbarui, lalu minta masukan 10 sampai 20 calon pengguna.",
    ],
  ];
  function renderGuide() {
    var s = HS[state.hs];
    $$("#dia .hs").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-hs") === state.hs);
    });
    var m = "";
    for (var i = 0; i < 5; i++)
      m += '<i class="' + (i < s.s ? "f" : "") + '"></i>';
    $("#hs-panel").innerHTML =
      "<h2>" +
      s.t +
      '</h2><div class="meter' +
      (s.bad ? " bad" : "") +
      '" role="img" aria-label="Perkiraan kualitas sinyal ' +
      s.s +
      ' dari 5">' +
      m +
      "</div><b>" +
      s.lab +
      "</b><p>" +
      s.p +
      "</p><small>Penilaian ini perkiraan. Selalu uji dengan tag dan tumbler Anda.</small>";
    var done = CHECK.filter(function (c, i) {
      return state.check[i];
    }).length;
    $("#chk-sum").textContent =
      done + " dari " + CHECK.length + " langkah selesai";
    $("#chk-bar").style.width = (done / CHECK.length) * 100 + "%";
    $("#chk-list").innerHTML = CHECK.map(function (c, i) {
      return (
        '<div class="chk' +
        (state.check[i] ? " done" : "") +
        '"><span class="num">' +
        (i + 1) +
        '</span><label for="c' +
        i +
        '"><b>' +
        c[0] +
        "</b><p>" +
        c[1] +
        '</p></label><input type="checkbox" id="c' +
        i +
        '" data-chk="' +
        i +
        '"' +
        (state.check[i] ? " checked" : "") +
        "></div>"
      );
    }).join("");
  }

  /* ---------- router ---------- */
  var VIEWS = [
    ["perangkat", "Perangkat", "tag"],
    ["arah", "Arah", "route"],
    ["lokasi", "Lokasi", "map"],
    ["tambah", "Tambah", "plus"],
    ["panduan", "Panduan", "guide"],
  ];
  function buildNav() {
    $("#nav-side").innerHTML = VIEWS.map(function (v) {
      return (
        '<button type="button" data-go="' +
        v[0] +
        '">' +
        ic(v[2], 22) +
        "<span>" +
        v[1] +
        (v[0] === "panduan"
          ? " penempatan"
          : v[0] === "tambah"
            ? " barang"
            : v[0] === "arah"
              ? " &amp; petunjuk"
              : "") +
        "</span></button>"
      );
    }).join("");
    $("#nav-tab").innerHTML = VIEWS.map(function (v) {
      return (
        '<button type="button" data-go="' +
        v[0] +
        '">' +
        ic(v[2], 22) +
        "<span>" +
        v[1] +
        "</span></button>"
      );
    }).join("");
  }
  function showView(v, fromHash) {
    if (
      !VIEWS.some(function (x) {
        return x[0] === v;
      })
    )
      v = "perangkat";
    if (state.view === "arah" && v !== "arah" && state.nav.on) stopNav();
    if (state.view === "tambah" && v !== "tambah") {
      clearTimeout(scanT);
      if (state.add.scan === "scanning") state.add.scan = "idle";
    }
    state.placing = false;
    state.view = v;
    VIEWS.forEach(function (x) {
      $("#v-" + x[0]).hidden = x[0] !== v;
    });
    $$("[data-go]").forEach(function (b) {
      if (b.id === "add-shortcut") return;
      if (b.getAttribute("data-go") === v)
        b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (!fromHash) {
      try {
        history.replaceState(null, "", "#" + v);
      } catch (e) {
        location.hash = v;
      }
    }
    var vm = VIEW_MAP[v];
    if (vm) ensureMap(vm[0], vm[1]);
    render();
    if (vm) {
      if (v === "arah") recompute();
      else fit(vm[0]);
    }
    window.scrollTo(0, 0);
  }
  function render() {
    var v = state.view;
    if (v === "perangkat") renderDevices();
    if (v === "arah") renderRoute();
    if (v === "lokasi") renderLocation();
    if (v === "tambah") renderAdd();
    if (v === "panduan") renderGuide();
  }

  /* ---------- event ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    var go = t.closest("[data-go]");
    if (go) {
      showView(go.getAttribute("data-go"));
      return;
    }
    var md = t.closest("[data-mode]");
    if (md) {
      stopNav();
      state.mode = md.getAttribute("data-mode");
      save();
      recompute();
      return;
    }
    var pl = t.closest("[data-plat]");
    if (pl) {
      state.add.platform = pl.getAttribute("data-plat");
      state.add.scan = "idle";
      save();
      renderAdd();
      return;
    }
    var hs = t.closest("[data-hs]");
    if (hs) {
      state.hs = hs.getAttribute("data-hs");
      renderGuide();
      return;
    }
    var act = t.closest("[data-act]");
    if (!act) return;
    var a = act.getAttribute("data-act"),
      it = cur();
    if (a === "select") {
      selectItem(act.getAttribute("data-id"));
      return;
    }
    if (a === "go" && it) {
      state.dest = null;
      showView("arah");
      return;
    }
    if (a === "dest-item") {
      stopNav();
      state.dest = null;
      state.sel = act.getAttribute("data-id");
      state.hist = -1;
      renderRoute();
      recompute();
      return;
    }
    if (a === "pick-result") {
      pickResult(act.getAttribute("data-ctx"), +act.getAttribute("data-i"));
      return;
    }
    if (a === "lost" && it) {
      it.lost = !it.lost;
      save();
      toast(
        it.lost
          ? "Mode Hilang aktif untuk " + it.name + "."
          : "Mode Hilang dimatikan.",
      );
      render();
      return;
    }
    if (a === "place-item") {
      state.placing = !state.placing;
      renderDevices();
      return;
    }
    if (a === "item-here" && it) {
      var y = you();
      if (!y) return;
      moveItem(it, y.lat, y.lon, "Dipindahkan ke posisi Anda");
      render();
      fitCurrent();
      toast(it.name + " ditaruh di posisi Anda sekarang.");
      return;
    }
    if (a === "del") {
      state.confirmDel = state.sel;
      renderDevices();
      return;
    }
    if (a === "del-no") {
      state.confirmDel = null;
      renderDevices();
      return;
    }
    if (a === "del-yes") {
      var nm = it.name;
      state.items = state.items.filter(function (i) {
        return i.id !== state.sel;
      });
      state.sel = state.items[0] ? state.items[0].id : null;
      state.confirmDel = null;
      save();
      render();
      fitCurrent();
      toast(nm + " dihapus dari daftar.");
      return;
    }
    if (a === "gps-toggle") {
      if (state.gps.on) gpsStop();
      else gpsStart();
      return;
    }
    if (a === "use-gps") {
      var yy = you();
      if (state.gps.on && yy) {
        state.add.pos = { lat: yy.lat, lon: yy.lon };
        renderAddAfter();
        drawMap("mc-pick");
        fit("mc-pick");
        toast("Posisi barang memakai lokasi GPS Anda sekarang.");
      } else {
        if (!state.gps.on) gpsStart();
        toast("Menyalakan GPS. Setelah posisi terbaca, ketuk tombol ini lagi.");
      }
      return;
    }
    if (a === "nav-start") {
      startNav();
      return;
    }
    if (a === "nav-stop") {
      stopNav();
      updateRoute();
      fit("mc-route");
      return;
    }
    if (a === "hist") {
      var i = +act.getAttribute("data-i");
      state.hist = state.hist === i ? -1 : i;
      renderLocation();
      var mm = MAPS["mc-location"];
      if (state.hist >= 0 && it && mm && mm.map) {
        var p = it.hist[state.hist];
        mm.map.setView([p.lat, p.lon], Math.max(mm.map.getZoom(), 16), {
          animate: true,
        });
      }
      return;
    }
    if (a === "zone") {
      var id = act.getAttribute("data-id");
      state.zones.forEach(function (z) {
        if (z.id === id) z.on = !z.on;
      });
      save();
      renderLocation();
      return;
    }
    if (a === "zone-here") {
      var yz = you();
      if (!yz) return;
      state.zones.forEach(function (z) {
        if (z.id === act.getAttribute("data-id")) {
          z.lat = yz.lat;
          z.lon = yz.lon;
          delete z.off;
        }
      });
      save();
      renderLocation();
      toast("Zona Aman dipindahkan ke posisi Anda.");
      return;
    }
    if (a === "alert") {
      state.alertOn = !state.alertOn;
      save();
      renderLocation();
      return;
    }
    if (a === "type") {
      state.add.type = act.getAttribute("data-k");
      renderAdd();
      return;
    }
    if (a === "next") {
      state.add.step = Math.min(3, state.add.step + 1);
      renderAdd();
      return;
    }
    if (a === "back") {
      state.add.step = Math.max(1, state.add.step - 1);
      renderAdd();
      return;
    }
    if (a === "scan") {
      state.add.scan = "scanning";
      renderAdd();
      clearTimeout(scanT);
      scanT = setTimeout(function () {
        state.add.tag =
          "SW-" +
          Math.floor(4096 + Math.random() * 61000)
            .toString(16)
            .toUpperCase();
        state.add.scan = "found";
        if (state.view === "tambah" && state.add.step === 2) renderAdd();
      }, 2200);
      return;
    }
    if (a === "pair") {
      state.add.scan = "paired";
      renderAdd();
      return;
    }
    if (a === "save-item") {
      var ad = state.add,
        p2 = ad.pos || you() || state.anchor,
        nid = "i" + Date.now().toString(36);
      var item = {
        id: nid,
        name: (ad.name || defName(ad.type)).trim(),
        type: ad.type,
        lat: p2.lat,
        lon: p2.lon,
        battery: 100,
        seen: "Baru saja",
        online: true,
        net: ad.platform === "ios" ? "Find My" : "Find Hub",
        acc: 20,
        lost: false,
        hist: [{ t: hhmm(), lat: p2.lat, lon: p2.lon, l: null }],
      };
      state.items.push(item);
      state.sel = nid;
      resetAdd();
      save();
      showView("perangkat");
      toast(item.name + " ditambahkan ke daftar perangkat.");
      return;
    }
    if (a === "reset") {
      stopNav();
      clearTimeout(scanT);
      try {
        localStorage.removeItem(KEY);
      } catch (x) {}
      var sd = seedData(BASE);
      state.items = sd.items;
      state.zones = sd.zones;
      state.anchor = BASE;
      state.manual = null;
      state.sel = "tumbler";
      state.dest = null;
      state.alertOn = true;
      state.check = {};
      state.hist = -1;
      state.confirmDel = null;
      state.placing = false;
      resetAdd();
      if (you() && state.gps.on && state.gps.lat != null) rebaseSeeds();
      render();
      if (state.view === "arah") recompute();
      else fitCurrent();
      toast("Data contoh dikembalikan.");
      return;
    }
  });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest && e.target.closest("form[data-search]");
    if (!f) return;
    e.preventDefault();
    runSearch(f.getAttribute("data-search"), f.elements.q.value);
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute("data-chk")) {
      state.check[t.getAttribute("data-chk")] = t.checked;
      save();
      renderGuide();
    }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "nameInput") {
      state.add.name = t.value;
    } else if (t.form && t.form.hasAttribute("data-search")) {
      state.q[t.form.getAttribute("data-search")] = t.value;
    }
  });
  window.addEventListener("hashchange", function () {
    var h = location.hash.replace("#", "");
    if (h && h !== state.view) showView(h, true);
  });

  /* ---------- mulai ---------- */
  buildNav();
  showView((location.hash || "").replace("#", "") || "perangkat", true);
  /* Jika izin lokasi sudah pernah diberikan, nyalakan otomatis. */
  try {
    if (navigator.permissions && navigator.permissions.query && secureOK())
      navigator.permissions
        .query({ name: "geolocation" })
        .then(function (r) {
          if (r.state === "granted") gpsStart();
        })
        .catch(function () {});
  } catch (e) {}
})();
