// =========================================================
// LEKTRO SHOP — cuenta de cliente, carrito, puntos, popups y checkout
// =========================================================
// Todo funciona sobre localStorage del navegador (no hay servidor
// propio). Los registros y pedidos también se intentan mandar a la
// misma Google Sheet que ya usa registro.html, así el dueño del
// sitio tiene un respaldo centralizado y le llega un mail avisando.
// =========================================================
(function () {
  "use strict";

  // -------- Datos del negocio (edit here si cambian) --------
  const WHATSAPP_NUM = "5491150980467";
  const MP_ALIAS = "reinalex30.mp";
  const MP_CVU = "0000003100033463487271";
  const GOOGLE_SHEETS_ENDPOINT = "https://script.google.com/macros/library/d/1mrHtOcf5C3BYfkrAxPJn4Js3oaGkuvVm4bCER9sf6dBUZinMU6WH9UZK/1";
  const CODIGOS_DESCUENTO = {
    "LEKTRO10": 10,
    "BIENVENIDO5": 5
  };

  // -------- Claves de almacenamiento --------
  const K_CLIENTES = "lektroClientesDB";
  const K_SESION = "lektroSesionEmail";
  const K_INVITADO = "lektroInvitado";
  const K_CARRITO = "lektroCarrito";
  const K_DESCUENTO = "lektroDescuentoActivo";
  const K_USARPUNTOS = "lektroUsarPuntos";

  // ===================== Utilidades de storage =====================
  function getClientes() {
    try { return JSON.parse(localStorage.getItem(K_CLIENTES) || "{}"); }
    catch (e) { return {}; }
  }
  function saveClientes(db) { localStorage.setItem(K_CLIENTES, JSON.stringify(db)); }

  function hashSimple(str) {
    // Ofuscación simple, NO es seguridad real (esto es un sitio sin servidor).
    try { return btoa(unescape(encodeURIComponent(str))); } catch (e) { return str; }
  }

  function getSesionEmail() { return localStorage.getItem(K_SESION) || null; }
  function esInvitado() { return sessionStorage.getItem(K_INVITADO) === "1"; }

  function getClienteActual() {
    const email = getSesionEmail();
    if (!email) return null;
    const db = getClientes();
    return db[email] || null;
  }

  function getCarrito() {
    try { return JSON.parse(localStorage.getItem(K_CARRITO) || "[]"); }
    catch (e) { return []; }
  }
  function saveCarrito(c) {
    localStorage.setItem(K_CARRITO, JSON.stringify(c));
    actualizarBadgeCarrito();
  }

  // ===================== Registro / Login / Invitado =====================
  function registrar(datos) {
    const db = getClientes();
    if (db[datos.email]) {
      return { ok: false, msg: "Ya existe una cuenta registrada con ese email. Iniciá sesión." };
    }
    db[datos.email] = {
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono || "",
      passHash: hashSimple(datos.password || ""),
      puntos: 0,
      pedidos: [],
      fechaRegistro: new Date().toISOString()
    };
    saveClientes(db);
    localStorage.setItem(K_SESION, datos.email);
    sessionStorage.removeItem(K_INVITADO);

    // Respaldo local (compatibilidad con registro.html viejo)
    try {
      const actuales = JSON.parse(localStorage.getItem("lektroClientes") || "[]");
      actuales.push(datos);
      localStorage.setItem("lektroClientes", JSON.stringify(actuales));
    } catch (e) {}

    enviarASheets(Object.assign({ tipo: "registro" }, datos));
    return { ok: true };
  }

  function login(email, password) {
    const db = getClientes();
    const c = db[email];
    if (!c) return { ok: false, msg: "No encontramos una cuenta con ese email." };
    if (c.passHash !== hashSimple(password)) return { ok: false, msg: "Contraseña incorrecta." };
    localStorage.setItem(K_SESION, email);
    sessionStorage.removeItem(K_INVITADO);
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(K_SESION);
    location.reload();
  }

  function continuarInvitado() {
    sessionStorage.setItem(K_INVITADO, "1");
  }

  async function enviarASheets(payload) {
    if (!GOOGLE_SHEETS_ENDPOINT || GOOGLE_SHEETS_ENDPOINT.startsWith("PEGA_AQUI")) return;
    try {
      await fetch(GOOGLE_SHEETS_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ fecha: new Date().toISOString() }, payload))
      });
    } catch (err) { console.error("Lektro: error enviando a Sheets", err); }
  }

  // ===================== Carrito =====================
  function addToCart(id, cant) {
    cant = cant || 1;
    const prod = lektroGetProducto(id);
    if (!prod) return;
    const carrito = getCarrito();
    const existente = carrito.find(function (it) { return it.id === id; });
    if (existente) existente.cant += cant;
    else carrito.push({ id: id, cant: cant });
    saveCarrito(carrito);
    toast(prod.nombre + " agregado al carrito 🛒");
    renderCarrito();
  }

  function quitarDelCarrito(id) {
    saveCarrito(getCarrito().filter(function (it) { return it.id !== id; }));
    renderCarrito();
  }

  function cambiarCantidad(id, delta) {
    const carrito = getCarrito();
    const it = carrito.find(function (x) { return x.id === id; });
    if (!it) return;
    it.cant += delta;
    if (it.cant <= 0) {
      quitarDelCarrito(id);
      return;
    }
    saveCarrito(carrito);
    renderCarrito();
  }

  function totalCarritoItems() {
    return getCarrito().reduce(function (a, it) { return a + it.cant; }, 0);
  }

  function subtotalCarrito() {
    return getCarrito().reduce(function (a, it) {
      const p = lektroGetProducto(it.id);
      return a + (p ? p.precio * it.cant : 0);
    }, 0);
  }

  function puntosAGanar() {
    return getCarrito().reduce(function (a, it) {
      const p = lektroGetProducto(it.id);
      return a + (p ? p.puntos * it.cant : 0);
    }, 0);
  }

  function getDescuentoActivo() {
    try { return JSON.parse(localStorage.getItem(K_DESCUENTO) || "null"); }
    catch (e) { return null; }
  }
  function setDescuentoActivo(obj) { localStorage.setItem(K_DESCUENTO, JSON.stringify(obj)); }
  function quitarDescuento() { localStorage.removeItem(K_DESCUENTO); }

  function puntosDisponibles() {
    const c = getClienteActual();
    return c ? (c.puntos || 0) : 0;
  }

  function usandoPuntos() { return localStorage.getItem(K_USARPUNTOS) === "1"; }
  function setUsandoPuntos(v) { localStorage.setItem(K_USARPUNTOS, v ? "1" : "0"); }

  function calcularTotales() {
    const subtotal = subtotalCarrito();
    const descuento = getDescuentoActivo();
    let descuentoMonto = descuento ? Math.round(subtotal * (descuento.porcentaje / 100)) : 0;
    let puntosUsadosMonto = 0;
    let puntosUsados = 0;
    if (usandoPuntos()) {
      const disp = puntosDisponibles();
      const restante = Math.max(0, subtotal - descuentoMonto);
      const maxPorPuntos = disp * LEKTRO_PUNTOS_CONFIG.valorPunto;
      puntosUsadosMonto = Math.min(maxPorPuntos, restante);
      puntosUsados = Math.floor(puntosUsadosMonto / LEKTRO_PUNTOS_CONFIG.valorPunto);
      puntosUsadosMonto = puntosUsados * LEKTRO_PUNTOS_CONFIG.valorPunto;
    }
    const total = Math.max(0, subtotal - descuentoMonto - puntosUsadosMonto);
    return { subtotal: subtotal, descuentoMonto: descuentoMonto, puntosUsados: puntosUsados, puntosUsadosMonto: puntosUsadosMonto, total: total };
  }

  // ===================== Confirmar compra =====================
  function confirmarCompra() {
    const carrito = getCarrito();
    if (!carrito.length) return;
    const cliente = getClienteActual();
    const totales = calcularTotales();
    const ganados = puntosAGanar();

    const items = carrito.map(function (it) {
      const p = lektroGetProducto(it.id);
      return { id: it.id, nombre: p.nombre, cant: it.cant, precio: p.precio };
    });

    const pedido = {
      fecha: new Date().toISOString(),
      items: items,
      subtotal: totales.subtotal,
      descuento: totales.descuentoMonto,
      puntosUsados: totales.puntosUsados,
      total: totales.total,
      puntosGanados: ganados
    };

    if (cliente) {
      const db = getClientes();
      const c = db[cliente.email];
      c.pedidos = c.pedidos || [];
      c.pedidos.unshift(pedido);
      c.puntos = Math.max(0, (c.puntos || 0) - totales.puntosUsados + ganados);
      saveClientes(db);
    }

    enviarASheets(Object.assign({ tipo: "pedido", email: cliente ? cliente.email : "invitado", nombre: cliente ? cliente.nombre : "Invitado" }, pedido, { items: JSON.stringify(items) }));

    // Mensaje de WhatsApp de confirmación al negocio
    const lineas = items.map(function (it) { return "• " + it.cant + "x " + it.nombre + " — " + lektroFormatoPrecio(it.precio * it.cant); }).join("%0A");
    const nombreCliente = cliente ? cliente.nombre : "Cliente invitado";
    const texto =
      "🛒 *Nuevo pedido Lektro*%0A" +
      "Cliente: " + encodeURIComponent(nombreCliente) + "%0A" +
      (cliente ? "Email: " + encodeURIComponent(cliente.email) + "%0A" : "") +
      lineas + "%0A" +
      "Subtotal: " + encodeURIComponent(lektroFormatoPrecio(totales.subtotal)) + "%0A" +
      (totales.descuentoMonto ? "Descuento: -" + encodeURIComponent(lektroFormatoPrecio(totales.descuentoMonto)) + "%0A" : "") +
      (totales.puntosUsadosMonto ? "Puntos usados: -" + encodeURIComponent(lektroFormatoPrecio(totales.puntosUsadosMonto)) + "%0A" : "") +
      "*Total a pagar: " + encodeURIComponent(lektroFormatoPrecio(totales.total)) + "*%0A" +
      "Pago por: Mercado Pago (alias " + MP_ALIAS + ")%0A" +
      "Ya realicé el pago, adjunto comprobante.";
    const waLink = "https://wa.me/" + WHATSAPP_NUM + "?text=" + texto;

    saveCarrito([]);
    quitarDescuento();
    setUsandoPuntos(false);
    renderCarrito();

    return { pedido: pedido, waLink: waLink };
  }

  // ===================== UI: inyección en el DOM =====================
  let uiRoot;

  function toast(msg) {
    let t = document.getElementById("lektroToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "lektroToast";
      t.className = "lektro-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function actualizarBadgeCarrito() {
    const badge = document.getElementById("lektroCartBadge");
    if (badge) {
      const n = totalCarritoItems();
      badge.textContent = n;
      badge.style.display = n > 0 ? "flex" : "none";
    }
  }

  function actualizarBotonCuenta() {
    const btn = document.getElementById("lektroAccountLabel");
    if (!btn) return;
    const c = getClienteActual();
    btn.textContent = c ? c.nombre.split(" ")[0] : (esInvitado() ? "Invitado" : "Mi cuenta");
  }

  function buildUI() {
    if (document.getElementById("lektroUiRoot")) return;

    // ---- Iconos de cuenta y carrito en el nav ----
    const navInner = document.querySelector(".lek-nav__inner");
    if (navInner) {
      const actions = document.createElement("div");
      actions.className = "lek-nav__lektro-actions";
      actions.innerHTML =
        '<button type="button" class="lektro-nav-btn" id="lektroAccountBtn" title="Mi cuenta">' +
        '<i class="fas fa-user"></i><span id="lektroAccountLabel">Mi cuenta</span></button>' +
        '<button type="button" class="lektro-nav-btn lektro-cart-btn" id="lektroCartBtn" title="Carrito">' +
        '<i class="fas fa-shopping-cart"></i><span id="lektroCartBadge" class="lektro-badge">0</span></button>';
      const toggle = navInner.querySelector(".lek-nav__toggle");
      if (toggle) navInner.insertBefore(actions, toggle);
      else navInner.appendChild(actions);
    }

    uiRoot = document.createElement("div");
    uiRoot.id = "lektroUiRoot";
    uiRoot.innerHTML =
      // overlay
      '<div class="lektro-overlay" id="lektroOverlay"></div>' +

      // panel de cuenta
      '<aside class="lektro-panel" id="lektroAccountPanel">' +
        '<div class="lektro-panel__head"><h3><i class="fas fa-user-circle"></i> Mi cuenta</h3><button class="lektro-x" data-close>&times;</button></div>' +
        '<div class="lektro-panel__body" id="lektroAccountBody"></div>' +
      '</aside>' +

      // panel de carrito
      '<aside class="lektro-panel lektro-panel--cart" id="lektroCartPanel">' +
        '<div class="lektro-panel__head"><h3><i class="fas fa-shopping-cart"></i> Tu carrito</h3><button class="lektro-x" data-close>&times;</button></div>' +
        '<div class="lektro-panel__body" id="lektroCartBody"></div>' +
      '</aside>' +

      // popup producto destacado
      '<div class="lektro-modal" id="lektroPopupDestacado">' +
        '<div class="lektro-modal__card">' +
          '<button class="lektro-x" data-close>&times;</button>' +
          '<div class="lektro-destacado-tag">⭐ Producto destacado de la semana</div>' +
          '<div id="lektroDestacadoBody"></div>' +
        '</div>' +
      '</div>' +

      // popup descuento
      '<div class="lektro-modal" id="lektroPopupDescuento">' +
        '<div class="lektro-modal__card lektro-modal__card--descuento">' +
          '<button class="lektro-x" data-close>&times;</button>' +
          '<div class="lektro-descuento-icon">🎉</div>' +
          '<h3>¡Tenés un 10% OFF!</h3>' +
          '<p>Usá el código <strong>LEKTRO10</strong> en tu carrito antes de finalizar la compra.</p>' +
          '<button class="slider_btn" id="lektroClaimDescuento">Aplicar a mi carrito</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(uiRoot);

    // eventos generales
    document.getElementById("lektroOverlay").addEventListener("click", closeAllPanels);
    uiRoot.querySelectorAll("[data-close]").forEach(function (b) {
      b.addEventListener("click", closeAllPanels);
    });

    const accBtn = document.getElementById("lektroAccountBtn");
    if (accBtn) accBtn.addEventListener("click", function () { openPanel("lektroAccountPanel"); renderCuenta(); });
    const cartBtn = document.getElementById("lektroCartBtn");
    if (cartBtn) cartBtn.addEventListener("click", function () { openPanel("lektroCartPanel"); renderCarrito(); });

    document.getElementById("lektroClaimDescuento").addEventListener("click", function () {
      setDescuentoActivo({ codigo: "LEKTRO10", porcentaje: 10 });
      toast("Código LEKTRO10 aplicado ✅");
      cerrarPopup("lektroPopupDescuento");
      openPanel("lektroCartPanel");
      renderCarrito();
    });

    // delegación: botones "Agregar al carrito" repartidos por las páginas
    document.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-lektro-add]");
      if (btn) {
        e.preventDefault();
        addToCart(btn.getAttribute("data-lektro-add"), 1);
        openPanel("lektroCartPanel");
      }
    });

    actualizarBadgeCarrito();
    actualizarBotonCuenta();
  }

  function openPanel(id) {
    document.getElementById("lektroOverlay").classList.add("show");
    document.getElementById(id).classList.add("show");
    document.body.classList.add("lektro-lock");
  }
  function closeAllPanels() {
    document.querySelectorAll(".lektro-panel, .lektro-modal").forEach(function (p) { p.classList.remove("show"); });
    document.getElementById("lektroOverlay").classList.remove("show");
    document.body.classList.remove("lektro-lock");
  }
  function cerrarPopup(id) {
    document.getElementById(id).classList.remove("show");
    if (!document.querySelector(".lektro-panel.show")) {
      document.getElementById("lektroOverlay").classList.remove("show");
      document.body.classList.remove("lektro-lock");
    }
  }

  // ---- Render: panel de cuenta ----
  function renderCuenta(containerId) {
    const body = document.getElementById(containerId || "lektroAccountBody");
    if (!body) return;
    const cliente = getClienteActual();

    if (cliente) {
      const pedidosHtml = (cliente.pedidos || []).length
        ? cliente.pedidos.map(function (p) {
            const fecha = new Date(p.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
            const items = p.items.map(function (it) { return it.cant + "x " + it.nombre; }).join(", ");
            return '<div class="lektro-pedido">' +
              '<div class="lektro-pedido__top"><span>' + fecha + '</span><strong>' + lektroFormatoPrecio(p.total) + '</strong></div>' +
              '<div class="lektro-pedido__items">' + items + '</div>' +
              '<div class="lektro-pedido__puntos">+' + p.puntosGanados + ' puntos ganados</div>' +
            '</div>';
          }).join("")
        : '<p class="lektro-empty">Todavía no hiciste ningún pedido.</p>';

      body.innerHTML =
        '<div class="lektro-perfil">' +
          '<div class="lektro-perfil__avatar"><i class="fas fa-user"></i></div>' +
          '<div><h4>' + cliente.nombre + '</h4><p>' + cliente.email + '</p></div>' +
        '</div>' +
        '<div class="lektro-puntos-box"><i class="fas fa-star"></i> <span>' + (cliente.puntos || 0) + '</span> puntos disponibles <small>(equivalen a ' + lektroFormatoPrecio((cliente.puntos || 0) * LEKTRO_PUNTOS_CONFIG.valorPunto) + ' de descuento)</small></div>' +
        '<h5 class="lektro-subtitle">Tus pedidos</h5>' +
        '<div class="lektro-pedidos-list">' + pedidosHtml + '</div>' +
        '<button class="lektro-btn-secundario" id="lektroLogoutBtn">Cerrar sesión</button>';

      document.getElementById("lektroLogoutBtn").addEventListener("click", logout);
      return;
    }

    // No logueado: mostrar tabs registro / login / invitado
    body.innerHTML =
      '<div class="lektro-tabs">' +
        '<button class="lektro-tab active" data-tab="registro">Registrarme</button>' +
        '<button class="lektro-tab" data-tab="login">Ya tengo cuenta</button>' +
      '</div>' +
      '<form id="lektroRegForm" class="lektro-form">' +
        '<label>Nombre completo</label><input type="text" id="lrNombre" required>' +
        '<label>Email</label><input type="email" id="lrEmail" required>' +
        '<label>WhatsApp / Teléfono</label><input type="tel" id="lrTelefono" required>' +
        '<label>Contraseña</label><input type="password" id="lrPass" required minlength="4">' +
        '<button type="submit" class="slider_btn">Crear cuenta</button>' +
        '<div class="lektro-msg" id="lrMsg"></div>' +
      '</form>' +
      '<form id="lektroLoginForm" class="lektro-form" style="display:none">' +
        '<label>Email</label><input type="email" id="llEmail" required>' +
        '<label>Contraseña</label><input type="password" id="llPass" required>' +
        '<button type="submit" class="slider_btn">Iniciar sesión</button>' +
        '<div class="lektro-msg" id="llMsg"></div>' +
      '</form>' +
      '<div class="lektro-divider">o también podés</div>' +
      '<button class="lektro-btn-secundario" id="lektroGuestBtn"><i class="fas fa-user-clock"></i> Continuar como invitado</button>';

    body.querySelectorAll(".lektro-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        body.querySelectorAll(".lektro-tab").forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        const isReg = tab.dataset.tab === "registro";
        document.getElementById("lektroRegForm").style.display = isReg ? "flex" : "none";
        document.getElementById("lektroLoginForm").style.display = isReg ? "none" : "flex";
      });
    });

    document.getElementById("lektroGuestBtn").addEventListener("click", function () {
      continuarInvitado();
      closeAllPanels();
      actualizarBotonCuenta();
      toast("Comprando como invitado 👋");
    });

    document.getElementById("lektroRegForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const msg = document.getElementById("lrMsg");
      const res = registrar({
        nombre: document.getElementById("lrNombre").value.trim(),
        email: document.getElementById("lrEmail").value.trim(),
        telefono: document.getElementById("lrTelefono").value.trim(),
        password: document.getElementById("lrPass").value
      });
      if (!res.ok) { msg.textContent = res.msg; msg.className = "lektro-msg error"; return; }
      msg.textContent = "¡Cuenta creada! Te enviamos un aviso a tu email.";
      msg.className = "lektro-msg ok";
      actualizarBotonCuenta();
      setTimeout(function () { renderCuenta(containerId); }, 700);
    });

    document.getElementById("lektroLoginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const msg = document.getElementById("llMsg");
      const res = login(document.getElementById("llEmail").value.trim(), document.getElementById("llPass").value);
      if (!res.ok) { msg.textContent = res.msg; msg.className = "lektro-msg error"; return; }
      actualizarBotonCuenta();
      renderCuenta(containerId);
    });
  }

  // ---- Render: panel de carrito ----
  function renderCarrito() {
    const body = document.getElementById("lektroCartBody");
    if (!body) return;
    const carrito = getCarrito();

    if (!carrito.length) {
      body.innerHTML = '<p class="lektro-empty">Tu carrito está vacío. ¡Sumá algún producto! 🛍️</p>';
      return;
    }

    const totales = calcularTotales();
    const descuento = getDescuentoActivo();
    const disp = puntosDisponibles();

    const itemsHtml = carrito.map(function (it) {
      const p = lektroGetProducto(it.id);
      if (!p) return "";
      return '<div class="lektro-cart-item">' +
        '<img src="' + p.img + '" alt="">' +
        '<div class="lektro-cart-item__info">' +
          '<strong>' + p.nombre + '</strong>' +
          '<span>' + lektroFormatoPrecio(p.precio) + ' · +' + p.puntos + ' pts c/u</span>' +
          '<div class="lektro-qty">' +
            '<button data-menos="' + it.id + '">−</button><span>' + it.cant + '</span><button data-mas="' + it.id + '">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="lektro-remove" data-quitar="' + it.id + '" title="Quitar"><i class="fas fa-trash"></i></button>' +
      '</div>';
    }).join("");

    body.innerHTML =
      '<div class="lektro-cart-items">' + itemsHtml + '</div>' +
      '<div class="lektro-descuento-row">' +
        '<input type="text" id="lektroCodigoInput" placeholder="Código de descuento" value="' + (descuento ? descuento.codigo : "") + '">' +
        '<button id="lektroAplicarCodigo" class="lektro-btn-mini">Aplicar</button>' +
      '</div>' +
      (descuento ? '<div class="lektro-desc-activo">✅ ' + descuento.codigo + ' aplicado (-' + descuento.porcentaje + '%) <button id="lektroQuitarCodigo">quitar</button></div>' : '') +
      (disp > 0 ? '<label class="lektro-usar-puntos"><input type="checkbox" id="lektroUsarPuntosChk" ' + (usandoPuntos() ? "checked" : "") + '> Usar mis ' + disp + ' puntos (' + lektroFormatoPrecio(disp * LEKTRO_PUNTOS_CONFIG.valorPunto) + ' de descuento)</label>' : '<p class="lektro-hint">Registrate o iniciá sesión para ganar y usar puntos.</p>') +
      '<div class="lektro-totales">' +
        '<div><span>Subtotal</span><span>' + lektroFormatoPrecio(totales.subtotal) + '</span></div>' +
        (totales.descuentoMonto ? '<div><span>Descuento</span><span>-' + lektroFormatoPrecio(totales.descuentoMonto) + '</span></div>' : '') +
        (totales.puntosUsadosMonto ? '<div><span>Puntos usados</span><span>-' + lektroFormatoPrecio(totales.puntosUsadosMonto) + '</span></div>' : '') +
        '<div class="lektro-total-final"><span>Total</span><span>' + lektroFormatoPrecio(totales.total) + '</span></div>' +
      '</div>' +
      '<div class="lektro-puntos-ganar">🎁 Vas a ganar <strong>' + puntosAGanar() + ' puntos</strong> con esta compra</div>' +
      '<button class="slider_btn lektro-checkout-btn" id="lektroFinalizarBtn">Finalizar compra</button>';

    body.querySelectorAll("[data-mas]").forEach(function (b) { b.addEventListener("click", function () { cambiarCantidad(b.dataset.mas, 1); }); });
    body.querySelectorAll("[data-menos]").forEach(function (b) { b.addEventListener("click", function () { cambiarCantidad(b.dataset.menos, -1); }); });
    body.querySelectorAll("[data-quitar]").forEach(function (b) { b.addEventListener("click", function () { quitarDelCarrito(b.dataset.quitar); }); });

    document.getElementById("lektroAplicarCodigo").addEventListener("click", function () {
      const val = document.getElementById("lektroCodigoInput").value.trim().toUpperCase();
      if (CODIGOS_DESCUENTO[val]) {
        setDescuentoActivo({ codigo: val, porcentaje: CODIGOS_DESCUENTO[val] });
        toast("Código aplicado: -" + CODIGOS_DESCUENTO[val] + "%");
      } else {
        toast("Código no válido");
      }
      renderCarrito();
    });
    const qc = document.getElementById("lektroQuitarCodigo");
    if (qc) qc.addEventListener("click", function () { quitarDescuento(); renderCarrito(); });

    const chk = document.getElementById("lektroUsarPuntosChk");
    if (chk) chk.addEventListener("change", function () { setUsandoPuntos(chk.checked); renderCarrito(); });

    document.getElementById("lektroFinalizarBtn").addEventListener("click", abrirCheckout);
  }

  // ---- Checkout: pago por QR / transferencia ----
  function abrirCheckout() {
    const body = document.getElementById("lektroCartBody");
    const totales = calcularTotales();
    const ganados = puntosAGanar();
    // El QR interoperable (funciona con cualquier banco/billetera: MODO, MP,
    // Cuenta DNI, apps bancarias, etc.) solo lo puede generar tu propia
    // cuenta de Mercado Pago desde "Cobrar" > "QR". Colocá esa imagen en
    // images/qr-mercadopago.png y se va a mostrar automáticamente acá.
    // Ver docs/CONFIGURAR-QR-PAGO.md para el paso a paso.
    const qrImg = "images/qr-mercadopago.png";

    body.innerHTML =
      '<button class="lektro-btn-secundario" id="lektroVolverCarrito"><i class="fas fa-arrow-left"></i> Volver al carrito</button>' +
      '<h4 class="lektro-subtitle">Pagá con Mercado Pago</h4>' +
      '<div class="lektro-pago-box">' +
        '<img src="' + qrImg + '" alt="QR interoperable Mercado Pago" class="lektro-qr" id="lektroQrImg">' +
        '<p class="lektro-qr-fallback" id="lektroQrFallback" style="display:none">Todavía no se cargó el QR interoperable del comercio. Pagá por transferencia con los datos de abajo.</p>' +
        '<p class="lektro-hint">Escaneá el QR con la app de tu banco o billetera (Mercado Pago, MODO, Cuenta DNI, etc.) o transferí manualmente con estos datos:</p>' +
        '<div class="lektro-datos-pago">' +
          '<div><span>Alias</span><strong>' + MP_ALIAS + '</strong></div>' +
          '<div><span>CVU</span><strong>' + MP_CVU + '</strong></div>' +
          '<div><span>Monto a pagar</span><strong>' + lektroFormatoPrecio(totales.total) + '</strong></div>' +
        '</div>' +
      '</div>' +
      '<div class="lektro-puntos-ganar">🎁 Ganás <strong>' + ganados + ' puntos</strong>, se acreditan al confirmar el pago</div>' +
      '<button class="slider_btn lektro-checkout-btn" id="lektroConfirmarPagoBtn"><i class="fab fa-whatsapp"></i> Ya pagué, confirmar por WhatsApp</button>' +
      '<p class="lektro-hint lektro-hint--small">Al confirmar se abre WhatsApp con el detalle de tu pedido para que nos envíes el comprobante. Tus puntos quedan acreditados recién ahí.</p>';

    const qrImgEl = document.getElementById("lektroQrImg");
    qrImgEl.addEventListener("error", function () {
      qrImgEl.style.display = "none";
      document.getElementById("lektroQrFallback").style.display = "block";
    });

    document.getElementById("lektroVolverCarrito").addEventListener("click", renderCarrito);
    document.getElementById("lektroConfirmarPagoBtn").addEventListener("click", function () {
      const resultado = confirmarCompra();
      if (!resultado) return;
      window.open(resultado.waLink, "_blank");
      body.innerHTML =
        '<div class="lektro-gracias">' +
          '<div class="icon">✅</div>' +
          '<h4>¡Gracias por tu compra!</h4>' +
          '<p>Ganaste <strong>' + resultado.pedido.puntosGanados + ' puntos</strong>. Quedaron guardados en tu perfil para tu próxima compra.</p>' +
          '<button class="slider_btn" id="lektroCerrarGracias">Seguir comprando</button>' +
        '</div>';
      document.getElementById("lektroCerrarGracias").addEventListener("click", closeAllPanels);
      actualizarBadgeCarrito();
    });
  }

  // ===================== Pop-ups automáticos =====================
  function mostrarPopupDestacado() {
    if (sessionStorage.getItem("lektroPopupDestacadoVisto")) return;
    sessionStorage.setItem("lektroPopupDestacadoVisto", "1");
    const productos = lektroListaProductos();
    const prod = productos[Math.floor(Math.random() * productos.length)];
    const destacadoBody = document.getElementById("lektroDestacadoBody");
    destacadoBody.innerHTML =
      '<img src="' + prod.img + '" alt="' + prod.nombre + '" class="lektro-destacado-img">' +
      '<h3>' + prod.nombre + '</h3>' +
      '<p class="lektro-destacado-precio">' + lektroFormatoPrecio(prod.precio) + ' <span>· +' + prod.puntos + ' puntos</span></p>' +
      '<div class="lektro-destacado-actions">' +
        '<button class="slider_btn" data-lektro-add="' + prod.id + '">Agregar al carrito</button>' +
        '<a href="' + prod.cat + '" class="lektro-btn-secundario">Ver categoría</a>' +
      '</div>';
    setTimeout(function () {
      document.getElementById("lektroOverlay").classList.add("show");
      document.getElementById("lektroPopupDestacado").classList.add("show");
    }, 1800);
  }

  function mostrarPopupDescuento() {
    if (sessionStorage.getItem("lektroPopupDescuentoVisto")) return;
    if (getDescuentoActivo()) return;
    sessionStorage.setItem("lektroPopupDescuentoVisto", "1");
    // aparece de forma aleatoria (60% de probabilidad) para que se sienta una sorpresa
    if (Math.random() > 0.6) return;
    setTimeout(function () {
      document.getElementById("lektroOverlay").classList.add("show");
      document.getElementById("lektroPopupDescuento").classList.add("show");
    }, 9000);
  }

  // ===================== Carrousel aleatorio por página =====================
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function armarCarouselAleatorio() {
    const inner = document.querySelector("#carouselExampleControls .carousel-inner");
    if (!inner) return;

    const pagina = document.body.getAttribute("data-scene") || "";
    let todos = lektroListaProductos();
    let propios = todos.filter(function (p) { return p.cat.toLowerCase().indexOf(pagina.toLowerCase()) !== -1; });
    let resto = todos.filter(function (p) { return propios.indexOf(p) === -1; });

    let seleccion = shuffle(propios).slice(0, 2).concat(shuffle(resto).slice(0, 2));
    seleccion = shuffle(seleccion).slice(0, 3);
    if (!seleccion.length) return;

    inner.innerHTML = seleccion.map(function (p, i) {
      return '<div class="carousel-item' + (i === 0 ? " active" : "") + '">' +
        '<div class="slider_item-box"><div class="slider_item-container"><div class="container-fluid"><div class="row">' +
        '<div class="offset-md-2 col-md-4"><div class="slider_item-detail"><div>' +
        '<h2 class="slider_heading">' + p.nombre + '</h2>' +
        '<p>' + lektroFormatoPrecio(p.precio) + '</p>' +
        '<div class="d-flex">' +
        '<button class="slider_btn" data-lektro-add="' + p.id + '" style="border:none;cursor:pointer;margin-right:10px;">Agregar al carrito</button>' +
        '<a href="' + p.cat + '" class="slider_btn" style="background:transparent;border:1px solid var(--electric,#34f5d0);">Ver más</a>' +
        '</div></div></div></div>' +
        '<div class="col-md-6"><div class="hero_img-box"><img src="' + p.img + '" alt="' + p.nombre + '"></div></div>' +
        '</div></div></div></div></div>';
    }).join("");
  }

  // ===================== Init =====================
  document.addEventListener("DOMContentLoaded", function () {
    buildUI();
    renderCarrito();
    armarCarouselAleatorio();
    mostrarPopupDestacado();
    mostrarPopupDescuento();
  });

  // API pública por si alguna página quiere usarla directamente
  window.lektroShop = {
    addToCart: addToCart,
    getClienteActual: getClienteActual,
    openCuenta: function () { buildUI(); openPanel("lektroAccountPanel"); renderCuenta(); },
    openCarrito: function () { buildUI(); openPanel("lektroCartPanel"); renderCarrito(); },
    mountCuenta: function (containerId) { buildUI(); renderCuenta(containerId); }
  };
})();
