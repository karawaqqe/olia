window.requestAnimationFrame =
  window.__requestAnimationFrame ||
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (function () {
    return function (callback, element) {
      var lastTime = element.__lastTime || 0;
      var currTime = Date.now();
      var timeToCall = Math.max(1, 33 - (currTime - lastTime));
      window.setTimeout(callback, timeToCall);
      element.__lastTime = currTime + timeToCall;
    };
  })();

window.isDevice =
  /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
  );

var loaded = false;

var init = function () {
  if (loaded) return;
  loaded = true;

  var mobile = window.isDevice;
  var canvas = document.getElementById("heart");
  var ctx = canvas.getContext("2d");
  var rand = Math.random;

  var width, height;

  // 🔥 DPR + resize FIX
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    width = rect.width;
    height = rect.height;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  var drawText = function () {
    ctx.font = mobile ? "32px Arial" : "60px Arial";
    ctx.fillStyle = "lightblue";
    ctx.textAlign = "center";
    ctx.fillText("", width / 2, height / 2.2 + 200);
  };

  var heartPosition = function (rad) {
    return [
      Math.pow(Math.sin(rad), 3),
      -(
        15 * Math.cos(rad) -
        5 * Math.cos(2 * rad) -
        2 * Math.cos(3 * rad) -
        Math.cos(4 * rad)
      ),
    ];
  };

  var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
    return [dx + pos[0] * sx, dy + pos[1] * sy];
  };

  var traceCount = mobile ? 12 : 50;
  var pointsOrigin = [];
  var dr = mobile ? 0.3 : 0.1;

  // 💙 масштаб сердца под мобилу
  var scale = mobile ? 180 : 310;
  var scaleY = mobile ? 11 : 19;

  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), scale, scaleY, 0, 0));

  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(
      scaleAndTranslate(heartPosition(i), scale * 0.8, scaleY * 0.8, 0, 0)
    );

  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(
      scaleAndTranslate(heartPosition(i), scale * 0.6, scaleY * 0.6, 0, 0)
    );

  var heartPointsCount = pointsOrigin.length;
  var targetPoints = [];

  var pulse = function (kx, ky) {
    for (var i = 0; i < pointsOrigin.length; i++) {
      targetPoints[i] = [
        kx * pointsOrigin[i][0] + width / 2,
        ky * pointsOrigin[i][1] + height / 2.2,
      ];
    }
  };

  var e = [];
  for (var i = 0; i < heartPointsCount; i++) {
    var x = rand() * width;
    var y = rand() * height;
    e[i] = {
      vx: 0,
      vy: 0,
      speed: rand() + 5,
      q: ~~(rand() * heartPointsCount),
      D: 2 * (i % 2) - 1,
      force: 0.2 * rand() + 0.7,
      f: "rgb(255, 20, 147)"
,
      trace: Array.from({ length: traceCount }, () => ({ x, y })),
    };
  }

  var config = { traceK: 0.4, timeDelta: 0.6 };
  var time = 0;

  var loop = function () {
    var n = -Math.cos(time);
    pulse((1 + n) * 0.5, (1 + n) * 0.5);
    time += (Math.sin(time) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * config.timeDelta;

    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, width, height);

    for (var i = e.length; i--; ) {
      var u = e[i];
      var q = targetPoints[u.q];
      var dx = u.trace[0].x - q[0];
      var dy = u.trace[0].y - q[1];
      var length = Math.sqrt(dx * dx + dy * dy) || 0.001;

      if (length < 10) {
        if (rand() > 0.95) u.q = ~~(rand() * heartPointsCount);
        else {
          if (rand() > 0.99) u.D *= -1;
          u.q = (u.q + u.D + heartPointsCount) % heartPointsCount;
        }
      }

      u.vx += (-dx / length) * u.speed;
      u.vy += (-dy / length) * u.speed;
      u.trace[0].x += u.vx;
      u.trace[0].y += u.vy;
      u.vx *= u.force;
      u.vy *= u.force;

      for (var k = 0; k < u.trace.length - 1; k++) {
        var T = u.trace[k];
        var N = u.trace[k + 1];
        N.x -= config.traceK * (N.x - T.x);
        N.y -= config.traceK * (N.y - T.y);
      }

      ctx.fillStyle = u.f;
      u.trace.forEach((t) => ctx.fillRect(t.x, t.y, 1, 1));
    }

    drawText();
    requestAnimationFrame(loop);
  };

  loop();
};

if (
  document.readyState === "complete" ||
  document.readyState === "loaded" ||
  document.readyState === "interactive"
)
  init();
else document.addEventListener("DOMContentLoaded", init);
