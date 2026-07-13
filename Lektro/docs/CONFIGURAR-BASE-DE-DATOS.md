# Base de datos de clientes y pedidos — Configuración

El sitio guarda automáticamente en el navegador del cliente
(`localStorage`) su cuenta, sus puntos y su historial de pedidos, así
que **quedan guardados aunque cierre la página y vuelva otro día,
siempre que use el mismo navegador/dispositivo**. Eso ya funciona sin
que configures nada.

Para tener además una base de datos centralizada (que puedas ver vos
desde cualquier lado) y que le llegue un email automático al cliente
cuando se registra o compra, conectá el sitio a una planilla de
Google. Es gratis y no necesita servidor propio. Se tarda ~5 minutos.

## Paso 1 — Crear la planilla

1. Entrá a [sheets.google.com](https://sheets.google.com) con tu cuenta de Google.
2. Creá una planilla nueva y ponele un nombre, por ejemplo **"Lektro - Clientes"**.

## Paso 2 — Pegar el script

1. Arriba, andá a **Extensiones > Apps Script**.
2. Se abre un editor con un archivo `Code.gs` vacío (con una función de ejemplo).
   Borrá todo su contenido.
3. Abrí el archivo `docs/google-apps-script.gs` que te dejé junto al sitio,
   copiá todo su contenido y pegalo en el editor de Apps Script.
4. Guardá con el ícono del disquete (o Ctrl+S).

## Paso 3 — Publicar como aplicación web

1. Arriba a la derecha, tocá **Implementar > Nueva implementación**.
2. Al lado de "Seleccionar tipo", tocá el ícono del engranaje y elegí
   **Aplicación web**.
3. Completá:
   - **Ejecutar como:** Yo (tu cuenta de Google)
   - **Quién tiene acceso:** Cualquier usuario
4. Tocá **Implementar**. Google te va a pedir que autorices el script
   (es tuyo, es seguro autorizarlo).
5. Te va a aparecer una **URL de la aplicación web**. Copiala — es la
   que conecta tu formulario con la planilla.

## Paso 4 — Poner tu email para recibir avisos de pedidos

1. En el mismo editor de Apps Script, buscá esta línea cerca del principio:
   ```js
   var TU_EMAIL_NEGOCIO = "alexreina92@gmail.com";
   ```
2. Reemplazala por tu email real si es distinto, y volvé a **Implementar >
   Gestionar implementaciones > editar (lápiz) > Nueva versión > Implementar**
   para que el cambio se aplique.

## Paso 5 — Conectar el sitio

1. Abrí `registro.html` y buscá cerca del final:
   ```js
   const GOOGLE_SHEETS_ENDPOINT = "PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT";
   ```
   Reemplazá el texto entre comillas por la URL que copiaste en el paso 3.
2. Hacé lo mismo en `js/lektro-shop.js`, buscando la constante
   `GOOGLE_SHEETS_ENDPOINT` cerca del principio del archivo.
3. Guardá ambos archivos y subilos actualizados a tu hosting.

Listo. A partir de ahora:
- Cada persona que se registre va a aparecer como fila nueva en la hoja
  **"Clientes"** de tu planilla, y le va a llegar un email de bienvenida
  automático.
- Cada pedido confirmado desde el carrito va a aparecer en la hoja
  **"Pedidos"**, con los productos, el total y los puntos ganados, y te
  va a llegar un email a vos avisándote, además de otro al cliente
  confirmando su compra.

## Notas

- Si en algún momento necesitás cambiar de planilla, repetís los pasos 1 a 3
  con la planilla nueva y actualizás la URL en ambos archivos.
- El formulario de `registro.html` tiene un campo oculto "anti-spam"
  (honeypot): si un bot lo completa, el registro se descarta y no llega a
  tu planilla.
- La cuenta, los puntos y el historial de pedidos de cada cliente quedan
  guardados en el navegador (`localStorage`) para que persistan entre
  visitas sin necesitar la planilla; la planilla de Google es el respaldo
  centralizado y lo que dispara los emails automáticos.
- El QR de pago que se muestra en el checkout codifica tu alias/CVU de
  Mercado Pago como texto para que el cliente lo escanee y copie los datos
  fácilmente; no es un QR dinámico oficial de Mercado Pago (eso requiere
  generarlo desde tu propia cuenta de Mercado Pago / su API). Los datos de
  cobro (alias `reinalex30.mp`, CVU `0000003100033463487271`) están
  definidos en `js/lektro-shop.js`.
