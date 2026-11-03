/* Hero "network sphere": a slowly turning dotted globe with champagne arcs and travelling light.
   Decorative only (aria-hidden). Pauses when the hero is not being rendered or the tab is hidden;
   draws one still frame for visitors who prefer reduced motion. */
(function () {
  "use strict";
  var canvas = document.getElementById("sphere");
  if (!canvas || !canvas.getContext) return;
  var host = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var GOLD = "224,196,142", DOT = "233,236,242";
  var N = 1200, pts = [], golden = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < N; i++) {
    var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = golden * i;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  function ll(lat, lon) { var a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [Math.cos(a) * Math.sin(b), -Math.sin(a), Math.cos(a) * Math.cos(b)]; }
  var nodes = [ll(45.5, -73.6), ll(47.4, -68.3), ll(12.4, -1.5), ll(48.9, 2.3), ll(5.3, -4.0), ll(43.7, -79.4), ll(14.7, -17.4), ll(40.4, -3.7)];
  var links = [[0, 2], [1, 3], [0, 5], [2, 4], [3, 6], [1, 0], [6, 2], [7, 4], [3, 7]];

  var w = 0, h = 0, R = 0, s = 1, rot = -0.75, last = 0, running = false, raf = 0;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), box = canvas.getBoundingClientRect();
    if (!box.width) return;
    canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
    w = canvas.width; h = canvas.height; s = dpr; R = Math.min(w, h) * 0.4;
  }
  function project(p) {
    var c = Math.cos(rot), sn = Math.sin(rot), tilt = -0.34, ct = Math.cos(tilt), st = Math.sin(tilt);
    var x = p[0] * c - p[2] * sn, z = p[0] * sn + p[2] * c, y = p[1];
    var y2 = y * ct - z * st; z = y * st + z * ct;
    return [w * 0.55 + x * R, h / 2 + y2 * R, z];
  }
  function slerp(a, b, t) {
    var d = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), sd = Math.sin(d) || 1;
    var k1 = Math.sin((1 - t) * d) / sd, k2 = Math.sin(t * d) / sd, lift = 1 + Math.sin(Math.PI * t) * 0.16;
    return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift];
  }
  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    var g = ctx.createRadialGradient(w * 0.55, h / 2, R * 0.15, w * 0.55, h / 2, R * 1.3);
    g.addColorStop(0, "rgba(" + GOLD + ",0.09)"); g.addColorStop(1, "rgba(" + GOLD + ",0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < pts.length; i++) {
      var q = project(pts[i]), z = q[2];
      var a = z > 0 ? 0.16 + z * 0.5 : 0.04 + (1 + z) * 0.05, d = (z > 0 ? 1.9 : 1.2) * s;
      ctx.fillStyle = "rgba(" + DOT + "," + a.toFixed(3) + ")";
      ctx.fillRect(q[0], q[1], d, d);
    }
    var phase = reduce ? 0.55 : (now / 2800) % 1;
    links.forEach(function (lk, k) {
      ctx.beginPath(); var started = false;
      for (var t = 0; t <= 1.0001; t += 0.04) {
        var q = project(slerp(nodes[lk[0]], nodes[lk[1]], t));
        if (q[2] < -0.05) { started = false; continue; }
        if (started) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
        started = true;
      }
      ctx.strokeStyle = "rgba(" + GOLD + ",0.5)"; ctx.lineWidth = 1.2 * s; ctx.stroke();
      var tt = (phase + k * 0.13) % 1, p = project(slerp(nodes[lk[0]], nodes[lk[1]], tt));
      if (p[2] > 0) { ctx.fillStyle = "rgba(240,218,170,0.95)"; ctx.beginPath(); ctx.arc(p[0], p[1], 2.4 * s, 0, 7); ctx.fill(); }
    });
    nodes.forEach(function (n, k) {
      var q = project(n); if (q[2] < 0) return;
      var pulse = reduce ? 0.5 : (Math.sin(now / 760 + k) + 1) / 2;
      ctx.fillStyle = "rgba(" + GOLD + "," + (0.16 + pulse * 0.18).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(q[0], q[1], (6 + pulse * 5) * s, 0, 7); ctx.fill();
      ctx.fillStyle = "rgb(" + GOLD + ")"; ctx.beginPath(); ctx.arc(q[0], q[1], 2.8 * s, 0, 7); ctx.fill();
    });
  }
  function frame(now) {
    if (!running) return;
    var dt = Math.min(64, now - (last || now)); last = now;
    rot += dt * 0.00008;
    draw(now);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (reduce || running || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  /* Re-measure and paint once before resuming: the canvas has no size while its host is skipped,
     and reduced-motion visitors only ever get this one frame. */
  function show() { size(); draw(performance.now()); start(); }

  size();
  draw(performance.now());
  window.addEventListener("resize", function () { size(); draw(performance.now()); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (onScreen) start(); });

  var onScreen = true;
  if ("oncontentvisibilityautostatechange" in host) {
    host.addEventListener("contentvisibilityautostatechange", function (e) { onScreen = !e.skipped; if (e.skipped) stop(); else show(); });
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; if (onScreen) show(); else stop(); }).observe(host);
  }
  start();
})();
