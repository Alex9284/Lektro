/**
 * LEKTRO — Base de datos de clientes y pedidos + email de aviso
 * ------------------------------------------------------------
 * Este script recibe:
 *  - los registros del formulario de registro (registro.html / mi-cuenta.html)
 *  - los pedidos que se confirman desde el carrito de compras
 * y los guarda como filas nuevas en esta misma planilla de Google
 * (en dos hojas separadas: "Clientes" y "Pedidos").
 * También envía un email de aviso automático al cliente cuando se
 * registra, y a vos cuando alguien confirma una compra.
 *
 * CÓMO INSTALARLO (una sola vez, 5 minutos):
 *  1. Andá a https://sheets.google.com y creá una planilla nueva.
 *     Nombrala, por ejemplo, "Lektro - Clientes".
 *  2. Arriba, andá a Extensiones > Apps Script.
 *  3. Borrá el código de ejemplo que aparece y pegá TODO este archivo.
 *  4. Guardá (ícono del disquete).
 *  5. Arriba a la derecha, tocá "Implementar" > "Nueva implementación".
 *  6. En "Seleccionar tipo", elegí "Aplicación web".
 *  7. Configurá:
 *       - Ejecutar como: Yo (tu cuenta)
 *       - Quién tiene acceso: Cualquier usuario
 *  8. Tocá "Implementar" y aceptá los permisos que te pida Google
 *     (te va a pedir permiso extra para "enviar emails en tu nombre",
 *     acéptalo, es necesario para el aviso automático).
 *  9. Copiá la URL que te da ("URL de la aplicación web").
 * 10. Pegá esa URL en registro.html Y en js/lektro-shop.js,
 *     reemplazando el valor de GOOGLE_SHEETS_ENDPOINT en ambos archivos.
 *
 * Editá el email de abajo (TU_EMAIL_NEGOCIO) por tu email real, para
 * recibir un aviso cada vez que se confirma un pedido.
 */

var TU_EMAIL_NEGOCIO = "alexreina92@gmail.com";

function doPost(e) {
  var datos = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (datos.tipo === "pedido") {
    guardarPedido(ss, datos);
  } else {
    guardarCliente(ss, datos);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function guardarCliente(ss, datos) {
  var sheet = ss.getSheetByName("Clientes") || ss.getActiveSheet();
  if (sheet.getName() !== "Clientes") sheet.setName("Clientes");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Fecha de registro", "Nombre", "Email", "Teléfono",
      "Fecha de nacimiento", "Cómo nos conoció", "Quiere promociones"
    ]);
  }

  sheet.appendRow([
    new Date(),
    datos.nombre || "",
    datos.email || "",
    datos.telefono || "",
    datos.cumpleanos || "",
    datos.comoConocio || "",
    datos.quierePromos ? "Sí" : "No"
  ]);

  if (datos.email) {
    try {
      MailApp.sendEmail({
        to: datos.email,
        subject: "¡Bienvenido/a a Lektro! 🎉",
        body:
          "Hola " + (datos.nombre || "") + ",\n\n" +
          "Tu registro en Lektro se completó con éxito. A partir de ahora " +
          "vas a sumar puntos con cada compra que hagas y vas a poder ver " +
          "tu historial de pedidos ingresando a \"Mi cuenta\" en el sitio.\n\n" +
          "¡Gracias por sumarte!\n\n" +
          "— Equipo Lektro"
      });
    } catch (err) {}
  }
}

function guardarPedido(ss, datos) {
  var sheet = ss.getSheetByName("Pedidos");
  if (!sheet) sheet = ss.insertSheet("Pedidos");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Fecha", "Cliente", "Email", "Items", "Subtotal",
      "Descuento", "Puntos usados", "Total", "Puntos ganados"
    ]);
  }

  sheet.appendRow([
    new Date(),
    datos.nombre || "Invitado",
    datos.email || "",
    datos.items || "",
    datos.subtotal || 0,
    datos.descuento || 0,
    datos.puntosUsados || 0,
    datos.total || 0,
    datos.puntosGanados || 0
  ]);

  try {
    MailApp.sendEmail({
      to: TU_EMAIL_NEGOCIO,
      subject: "🛒 Nuevo pedido en Lektro — $" + (datos.total || 0),
      body:
        "Nuevo pedido confirmado.\n\n" +
        "Cliente: " + (datos.nombre || "Invitado") + " (" + (datos.email || "sin email") + ")\n" +
        "Items: " + (datos.items || "") + "\n" +
        "Total: $" + (datos.total || 0) + "\n" +
        "Puntos ganados por el cliente: " + (datos.puntosGanados || 0) + "\n\n" +
        "Recordá confirmar el pago recibido por Mercado Pago antes de despachar."
    });
  } catch (err) {}

  if (datos.email) {
    try {
      MailApp.sendEmail({
        to: datos.email,
        subject: "Confirmamos tu pedido en Lektro ✅",
        body:
          "Hola " + (datos.nombre || "") + ",\n\n" +
          "Recibimos tu pedido por un total de $" + (datos.total || 0) + ".\n" +
          "Ganaste " + (datos.puntosGanados || 0) + " puntos, ya quedaron acreditados en tu cuenta.\n\n" +
          "En breve te confirmamos por WhatsApp el estado del pago y el envío.\n\n" +
          "— Equipo Lektro"
      });
    } catch (err) {}
  }
}
