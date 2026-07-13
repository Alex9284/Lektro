// =========================================================
// LEKTRO — Catálogo central de productos
// =========================================================
// Acá vive el precio "real" de cada producto (usado por el
// carrito, el carrousel aleatorio, el pop-up de destacado y
// el sistema de puntos). Si un precio no es el correcto,
// editalo acá y se actualiza en TODO el sitio automáticamente.
//
// puntos = precio / LEKTRO_PUNTOS_CONFIG.pesosPorPunto (redondeado)
// Cuanto más caro el producto, más puntos suma al comprarlo.
// =========================================================

const LEKTRO_PUNTOS_CONFIG = {
  pesosPorPunto: 1000,   // cada $1000 de compra = 1 punto
  valorPunto: 10         // cada punto vale $10 de descuento al usarlo
};

const LEKTRO_CATALOGO = {
  // ---- Parlantes y SmartWatch ----
  p1: { nombre: "Parlante Portátil PULSE 5 MIDDLE", precio: 35000, img: "images/p1.png", cat: "parlantes.html", catNombre: "Parlantes y SmartWatch" },
  p8: { nombre: "SmartWatch T500 Reloj de Pulsera Digital", precio: 32000, img: "images/p8.png", cat: "parlantes.html", catNombre: "Parlantes y SmartWatch" },

  // ---- Auriculares ----
  p2: { nombre: "Auriculares Inalámbricos Dexlo Yx30 Con Pantalla", precio: 45000, img: "images/p2.png", cat: "Auriculares.html", catNombre: "Auriculares" },
  p3: { nombre: "Auricular Bluetooth Air25M BULLTEC", precio: 28000, img: "images/p3.png", cat: "Auriculares.html", catNombre: "Auriculares" },

  // ---- Cargadores y Cables ----
  p4: { nombre: "Cargador SAMSUNG Cabezal 45W", precio: 14000, img: "images/p4.png", cat: "cargadores.html", catNombre: "Cargadores y Cables" },
  p5: { nombre: "Cargador Motorola 50W Tipo C a Tipo C", precio: 15000, img: "images/p5.png", cat: "cargadores.html", catNombre: "Cargadores y Cables" },
  p6: { nombre: "Cargador 20W Para iPhone 16 Pro Max Con Cable Tipo C", precio: 16000, img: "images/p6.png", cat: "cargadores.html", catNombre: "Cargadores y Cables" },
  p7: { nombre: "Cable Tipo C a Tipo C 1mt. Mallado iPhone", precio: 8000, img: "images/p7.png", cat: "cargadores.html", catNombre: "Cargadores y Cables" },

  // ---- Iluminación y más ----
  p9:  { nombre: "Aro Led de 12″ Blanco + Trípode", precio: 18000, img: "images/p9.png", cat: "iluminacion.html", catNombre: "Iluminación y más" },
  p10: { nombre: "Botella Motivacional Deportiva", precio: 9000, img: "images/p10.png", cat: "iluminacion.html", catNombre: "Iluminación y más" },

  // ---- Bisutería Artesanal ----
  bis1: { nombre: "Rosario de Cristales", precio: 6000, img: "images/bis1.png", cat: "bisuteria.html", catNombre: "Bisutería Artesanal" },
  bis2: { nombre: "Rosario Artesanal", precio: 6000, img: "images/bis2.png", cat: "bisuteria.html", catNombre: "Bisutería Artesanal" },
  bis3: { nombre: "Rosario Elaborado en Perlas", precio: 7500, img: "images/bis3.png", cat: "bisuteria.html", catNombre: "Bisutería Artesanal" },
  bis4: { nombre: "Rosario Pulsera en Hilo Chino y Cristales", precio: 5000, img: "images/bis4.png", cat: "bisuteria.html", catNombre: "Bisutería Artesanal" },
  bis5: { nombre: "Pulsera Rosario en Hilo Chino y Cristales", precio: 5000, img: "images/bis5.png", cat: "bisuteria.html", catNombre: "Bisutería Artesanal" },
  bis6: { nombre: "Denario Elaborado en Piedras Naturales", precio: 8000, img: "images/bis6.png", cat: "bisuteria.html", catNombre: "Bisutería Artesanal" },
  bis7: { nombre: "Pulsera Rosario en Alambre y Cristales", precio: 5500, img: "images/bis7.png", cat: "bisuteria.html", catNombre: "Bisutería Artesanal" },
  bis8: { nombre: "Rosario Artesanal", precio: 6000, img: "images/bis8.png", cat: "bisuteria.html", catNombre: "Bisutería Artesanal" },

  // ---- Electro y algo más ----
  elec1: { nombre: 'Televisor Philips 4K 55" con Ambilight 55PUD7906/77', precio: 850000, img: "images/elec1.png", cat: "electro.html", catNombre: "Electro y algo más" },
  elec2: { nombre: "Juegos PlayStation 5", precio: 30000, img: "images/elec2.png", cat: "electro.html", catNombre: "Electro y algo más" }
};

function lektroPuntosDe(precio) {
  return Math.max(1, Math.round(precio / LEKTRO_PUNTOS_CONFIG.pesosPorPunto));
}

function lektroFormatoPrecio(n) {
  return "$ " + Math.round(n).toLocaleString("es-AR");
}

function lektroGetProducto(id) {
  const p = LEKTRO_CATALOGO[id];
  if (!p) return null;
  return Object.assign({ id, puntos: lektroPuntosDe(p.precio) }, p);
}

function lektroListaProductos() {
  return Object.keys(LEKTRO_CATALOGO).map(lektroGetProducto);
}
