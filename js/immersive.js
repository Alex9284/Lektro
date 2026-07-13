/* ==========================================================================
   LEKTRO — IMMERSIVE ENGINE
   Escena 3D de "circuito vivo" + tilt real + parallax + reveal + cursor.
   Se auto-aplica sobre las clases existentes del sitio (.producto, .hero_img-box,
   .detail-box, botones) sin necesitar tocar el HTML de cada tarjeta.
   ========================================================================== */
(function () {
  "use strict";

  var isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
  var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- */
  /* 0. BOOT SCREEN — breve "encendido"                                */
  /* ---------------------------------------------------------------- */
  function boot() {
    var el = document.getElementById("lektro-boot");
    if (!el) return;
    window.addEventListener("load", function () {
      setTimeout(function () { el.classList.add("hide"); }, 550);
    });
    // fallback por si 'load' ya pasó
    setTimeout(function () { el.classList.add("hide"); }, 2200);
  }

  /* ---------------------------------------------------------------- */
  /* 1. BARRA DE PROGRESO DE SCROLL                                    */
  /* ---------------------------------------------------------------- */
  function progressBar() {
    var bar = document.getElementById("lektro-progress");
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var scrolled = h.scrollTop || document.body.scrollTop;
      var height = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
      var pct = height > 0 ? (scrolled / height) * 100 : 0;
      bar.style.width = pct + "%";
    }
    document.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------- */
  /* 2. CURSOR PERSONALIZADO                                           */
  /* ---------------------------------------------------------------- */
  function customCursor() {
    if (isTouch) return;
    var ring = document.getElementById("lektro-cursor");
    var dot = document.getElementById("lektro-cursor-dot");
    if (!ring || !dot) return;
    var rx = 0, ry = 0, dx = 0, dy = 0;
    window.addEventListener("mousemove", function (e) {
      dx = e.clientX; dy = e.clientY;
      dot.style.transform = "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
    });
    (function loop() {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    var hoverables = "a, button, .producto, .boton-comprar, .slider_btn, input, .whatsapp-float";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) ring.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) ring.classList.remove("is-hover");
    });
  }

  /* ---------------------------------------------------------------- */
  /* 3. REVEAL AL SCROLL (IntersectionObserver)                        */
  /* ---------------------------------------------------------------- */
  function revealOnScroll() {
    var candidates = document.querySelectorAll(
      ".destacados-section h2, .productos-grid, .detail-box, .footer-container > div, " +
      ".card, .mission, .vision, .valores, #contacto, .slider_item-detail, .hero_img-box"
    );
    candidates.forEach(function (el) {
      if (!el.classList.contains("reveal") &&
          !el.classList.contains("reveal-left") &&
          !el.classList.contains("reveal-right") &&
          !el.classList.contains("reveal-scale")) {
        el.classList.add("reveal");
      }
    });

    // stagger para tarjetas de producto
    document.querySelectorAll(".productos-grid").forEach(function (grid) {
      var items = grid.querySelectorAll(".producto");
      items.forEach(function (it, i) {
        it.classList.add("reveal-scale");
        it.style.setProperty("--i", i);
        it.style.transitionDelay = (i * 90) + "ms";
      });
    });

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal,.reveal-left,.reveal-right,.reveal-scale")
        .forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll(".reveal,.reveal-left,.reveal-right,.reveal-scale")
      .forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------- */
  /* 4a. TILT 3D REAL sobre detail-box (páginas institucionales, etc.)  */
  /* ---------------------------------------------------------------- */
  function tilt(selector, intensity) {
    if (isTouch || reducedMotion) return;
    document.querySelectorAll(selector).forEach(function (card) {
      var rect;
      card.addEventListener("mouseenter", function () { rect = card.getBoundingClientRect(); });
      card.addEventListener("mousemove", function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rotY = (px - 0.5) * intensity;
        var rotX = (0.5 - py) * intensity;
        card.style.transform = "perspective(1200px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) translateZ(4px)";
        card.style.setProperty("--mx", (px * 100) + "%");
        card.style.setProperty("--my", (py * 100) + "%");
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* 4b. TARJETAS DE PRODUCTO — "quick view" flip 3D real               */
  /*     Convierte cada .producto en una tarjeta con cara frontal      */
  /*     (imagen + título) y cara trasera (descripción + compra),      */
  /*     sin tener que tocar el HTML de cada página.                   */
  /* ---------------------------------------------------------------- */
  function enhanceProductCards() {
    document.querySelectorAll(".producto:not([data-lektro-enhanced])").forEach(function (card) {
      var img = card.querySelector("img");
      var title = card.querySelector("h3");
      var desc = card.querySelector("p");
      var buy = card.querySelector(".boton-comprar");
      if (!img || !title) return; // estructura inesperada, no tocar

      card.setAttribute("data-lektro-enhanced", "1");

      var inner = document.createElement("div");
      inner.className = "producto-inner";

      var front = document.createElement("div");
      front.className = "producto-face producto-front";

      var back = document.createElement("div");
      back.className = "producto-face producto-back";

      // -- Cara frontal: imagen + título + pista visual --
      front.appendChild(img);
      front.appendChild(title.cloneNode(true));
      var hint = document.createElement("span");
      hint.className = "producto-hint";
      hint.textContent = "🔎 Ver detalles";
      front.appendChild(hint);

      // -- Cara trasera: título + descripción completa + chips + compra --
      back.appendChild(title.cloneNode(true));
      if (desc) back.appendChild(desc);

      var chips = document.createElement("div");
      chips.className = "producto-chips";
      ["⚡ Stock disponible", "🚚 Envío rápido", "🛡️ Garantía Lektro"].forEach(function (t) {
        var s = document.createElement("span");
        s.textContent = t;
        chips.appendChild(s);
      });
      back.appendChild(chips);
      if (buy) back.appendChild(buy);

      var flipBack = document.createElement("button");
      flipBack.type = "button";
      flipBack.className = "producto-flip-back";
      flipBack.setAttribute("aria-label", "Volver");
      flipBack.textContent = "↺";
      back.appendChild(flipBack);

      inner.appendChild(front);
      inner.appendChild(back);
      card.innerHTML = "";
      card.appendChild(inner);

      front.addEventListener("click", function () {
        card.classList.add("is-flipped");
      });
      flipBack.addEventListener("click", function (e) {
        e.stopPropagation();
        card.classList.remove("is-flipped");
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* 4c. PROFUNDIDAD DE SCROLL REAL sobre tarjetas de producto          */
  /*     Efecto "coverflow": cada tarjeta rota y avanza en Z según su   */
  /*     posición respecto al centro de la pantalla mientras se hace    */
  /*     scroll, y además reacciona al mouse con un tilt real.          */
  /* ---------------------------------------------------------------- */
  function productDepthScroll() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".producto"));
    if (!cards.length) return;

    var state = cards.map(function () { return { hx: 0, hy: 0, base: 0, targetBase: 0 }; });

    function computeBase() {
      var vh = innerHeight || document.documentElement.clientHeight;
      cards.forEach(function (card, i) {
        var r = card.getBoundingClientRect();
        var cy = r.top + r.height / 2;
        var progress = (cy - vh / 2) / (vh / 2);
        if (progress > 1) progress = 1;
        if (progress < -1) progress = -1;
        state[i].targetBase = progress;
      });
    }

    function render() {
      cards.forEach(function (card, i) {
        var s = state[i];
        s.base += (s.targetBase - s.base) * 0.08;
        var rotX = (reducedMotion ? 0 : s.base * -12) + s.hy;
        var rotY = s.hx;
        var tz = reducedMotion ? 0 : (1 - Math.abs(s.base)) * 24;
        card.style.transform = "perspective(1400px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) translateZ(" + tz + "px)";
      });
      requestAnimationFrame(render);
    }

    window.addEventListener("scroll", computeBase, { passive: true });
    window.addEventListener("resize", computeBase);
    computeBase();
    requestAnimationFrame(render);

    if (!isTouch) {
      cards.forEach(function (card, i) {
        var rect;
        card.addEventListener("mouseenter", function () { rect = card.getBoundingClientRect(); });
        card.addEventListener("mousemove", function (e) {
          if (!rect) rect = card.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width;
          var py = (e.clientY - rect.top) / rect.height;
          state[i].hy = (0.5 - py) * 10;
          state[i].hx = (px - 0.5) * 10;
          card.style.setProperty("--mx", (px * 100) + "%");
          card.style.setProperty("--my", (py * 100) + "%");
        });
        card.addEventListener("mouseleave", function () {
          state[i].hx = 0;
          state[i].hy = 0;
        });
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* 4d. CAPAS DE PROFUNDIDAD AMBIENTAL — parallax de fondo en TODAS    */
  /*     las páginas, independiente de three.js                        */
  /* ---------------------------------------------------------------- */
  function depthLayers() {
    var scene = document.getElementById("lektro-scene");
    if (!scene || document.getElementById("lektro-depth")) return;
    var wrap = document.createElement("div");
    wrap.id = "lektro-depth";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = "<span></span><span></span><span></span>";
    scene.parentNode.insertBefore(wrap, scene);
    var layers = wrap.querySelectorAll("span");
    var speeds = [0.06, 0.11, 0.16];
    if (reducedMotion) return;
    function onScroll() {
      var sc = window.scrollY || document.documentElement.scrollTop || 0;
      layers.forEach(function (el, i) {
        el.style.transform = "translate3d(0," + (sc * speeds[i]) + "px,0)";
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------- */
  /* 4e. TRUST ORBIT — insignias de confianza con flip 3D + tilt grupal */
  /* ---------------------------------------------------------------- */
  function trustOrbit() {
    var cards = document.querySelectorAll(".trust-card");
    if (!cards.length) return;
    cards.forEach(function (c, i) {
      c.style.setProperty("--i", i);
      if (isTouch) {
        c.addEventListener("click", function () { c.classList.toggle("is-flipped"); });
      } else {
        c.addEventListener("mouseenter", function () { c.classList.add("is-flipped"); });
        c.addEventListener("mouseleave", function () { c.classList.remove("is-flipped"); });
      }
    });
    var orbit = document.querySelector(".trust-orbit");
    if (orbit && !isTouch && !reducedMotion) {
      orbit.addEventListener("mousemove", function (e) {
        var r = orbit.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        orbit.style.transform = "rotateX(" + (-py * 5) + "deg) rotateY(" + (px * 5) + "deg)";
      });
      orbit.addEventListener("mouseleave", function () {
        orbit.style.transform = "rotateX(0deg) rotateY(0deg)";
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* 5. PARALLAX del héroe / imagen de producto grande según scroll     */
  /* ---------------------------------------------------------------- */
  function heroParallax() {
    if (reducedMotion) return;
    var imgs = document.querySelectorAll(".hero_img-box img");
    if (!imgs.length) return;
    var mx = 0, my = 0;
    if (!isTouch) {
      window.addEventListener("mousemove", function (e) {
        mx = (e.clientX / innerWidth - 0.5) * 2;
        my = (e.clientY / innerHeight - 0.5) * 2;
      });
    }
    function loop() {
      var sc = window.scrollY || 0;
      imgs.forEach(function (img) {
        var rY = mx * 8;
        var rX = -my * 6;
        var tz = Math.max(-40, -sc * 0.15);
        img.style.transform = "translateZ(" + tz + "px) rotateY(" + rY + "deg) rotateX(" + rX + "deg)";
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------------- */
  /* 6. BOTONES MAGNÉTICOS                                             */
  /* ---------------------------------------------------------------- */
  function magnetic() {
    if (isTouch || reducedMotion) return;
    document.querySelectorAll(".slider_btn, .boton-comprar, .whatsapp-float").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.22 + "px," + y * 0.28 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* 7. ESCENA 3D DE FONDO — circuito de partículas vivo (three.js)     */
  /* ---------------------------------------------------------------- */
  var THEME_COLORS = {
    default:     { a: 0xFFD84D, b: 0x34F5D0 },
    auriculares: { a: 0x4FC3FF, b: 0x34F5D0 },
    cargadores:  { a: 0xFFB200, b: 0xFFD84D },
    parlantes:   { a: 0xB98BFF, b: 0x34F5D0 },
    iluminacion: { a: 0xFFE380, b: 0xFFB200 },
    seguimiento: { a: 0x34F5D0, b: 0x4FC3FF },
    nosotros:    { a: 0xFFD84D, b: 0xB98BFF }
  };

  function scene3D() {
    var canvasHolder = document.getElementById("lektro-scene");
    if (!canvasHolder || typeof THREE === "undefined") return;

    var themeKey = document.body.getAttribute("data-scene") || "default";
    var colors = THEME_COLORS[themeKey] || THEME_COLORS.default;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 1, 2000);
    camera.position.z = 420;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight);
    canvasHolder.appendChild(renderer.domElement);

    /* --- nodos de "circuito" flotando en el espacio --- */
    var NODES = isTouch ? 60 : 140;
    var positions = new Float32Array(NODES * 3);
    for (var i = 0; i < NODES; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 900;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 900;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    var spriteMat = new THREE.PointsMaterial({
      color: colors.a,
      size: 5.5,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });
    var points = new THREE.Points(geo, spriteMat);
    scene.add(points);

    /* --- líneas de conexión tipo circuito entre nodos cercanos --- */
    var lineGeo = new THREE.BufferGeometry();
    var linePositions = [];
    var maxDist = 190;
    for (var a = 0; a < NODES; a++) {
      for (var b = a + 1; b < NODES; b++) {
        var dx = positions[a * 3] - positions[b * 3];
        var dy = positions[a * 3 + 1] - positions[b * 3 + 1];
        var dz = positions[a * 3 + 2] - positions[b * 3 + 2];
        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < maxDist) {
          linePositions.push(
            positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2],
            positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]
          );
        }
      }
    }
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    var lineMat = new THREE.LineBasicMaterial({ color: colors.b, transparent: true, opacity: 0.14 });
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    /* --- un par de figuras wireframe grandes flotando, dan foco de "producto" --- */
    var shapes = [];
    var geometries = [
      new THREE.IcosahedronGeometry(70, 0),
      new THREE.TorusGeometry(50, 14, 8, 24),
      new THREE.OctahedronGeometry(60, 0)
    ];
    geometries.forEach(function (g, idx) {
      var mat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? colors.a : colors.b,
        wireframe: true,
        transparent: true,
        opacity: 0.22
      });
      var mesh = new THREE.Mesh(g, mat);
      mesh.position.set(
        (idx - 1) * 420 + (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 260,
        -300 - Math.random() * 200
      );
      scene.add(mesh);
      shapes.push(mesh);
    });

    var mouseX = 0, mouseY = 0;
    if (!isTouch) {
      window.addEventListener("mousemove", function (e) {
        mouseX = (e.clientX / innerWidth - 0.5);
        mouseY = (e.clientY / innerHeight - 0.5);
      });
    }

    var scrollFactor = 0;
    window.addEventListener("scroll", function () {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      scrollFactor = (h.scrollTop || document.body.scrollTop) / max;
    }, { passive: true });

    window.addEventListener("resize", function () {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    var clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      points.rotation.y = t * 0.02 + scrollFactor * 1.2;
      lines.rotation.y = points.rotation.y;
      points.rotation.x = scrollFactor * 0.6;
      lines.rotation.x = points.rotation.x;

      shapes.forEach(function (mesh, idx) {
        mesh.rotation.x = t * (0.08 + idx * 0.02);
        mesh.rotation.y = t * (0.1 + idx * 0.015);
        mesh.position.y += Math.sin(t * 0.6 + idx) * 0.05;
      });

      camera.position.x += (mouseX * 120 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 80 - camera.position.y) * 0.03;
      camera.position.z = 420 - scrollFactor * 150;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ---------------------------------------------------------------- */
  /* INIT                                                               */
  /* ---------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    boot();
    depthLayers();
    progressBar();
    customCursor();
    enhanceProductCards();
    revealOnScroll();
    productDepthScroll();
    tilt(".detail-box", 10);
    trustOrbit();
    heroParallax();
    magnetic();
    scene3D();
  });
})();
