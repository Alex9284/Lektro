# QR de pago en el checkout — cómo ponerlo funcional

## Por qué el QR anterior no funcionaba

Antes el sitio generaba una imagen de QR con una librería externa que
codificaba tu alias y CVU como **texto plano**. Un QR así se puede leer
con cualquier lector de códigos, pero **no dispara un pago** en la app del
banco o la billetera: esas apps solo inician un pago cuando el QR trae el
formato especial de "QR interoperable" (el estándar **Transferencias 3.0**
del Banco Central), que es el que hace que un mismo QR sirva para cobrar
con Mercado Pago, MODO, Cuenta DNI, Ualá, o cualquier banco.

Ese formato solo lo puede generar **tu propia cuenta de Mercado Pago**
(o de tu banco), porque necesita quedar asociado a tu CVU real de forma
oficial. No es algo que se pueda armar "a mano" de forma confiable — un
QR mal armado puede parecer que funciona y en realidad no acreditar el
pago en ningún lado, así que preferimos no inventarlo.

## Cómo conseguir tu QR interoperable real (2 minutos)

1. Abrí la app de **Mercado Pago** en tu celular, con la cuenta que
   tiene el alias `reinalex30.mp`.
2. Andá a **Cobrar** (o "Tu QR" / "Cobrar con QR", según la versión de
   la app).
3. Vas a ver tu QR fijo para cobros. Tocá **Compartir** o **Descargar**
   y guardá la imagen en tu celular o computadora.
4. Renombrá esa imagen a `qr-mercadopago.png`.
5. Copiala dentro de la carpeta `images/` del sitio (reemplazando o
   agregando el archivo), y volvé a subir el sitio a tu hosting.

Listo — el checkout del carrito ya está preparado para mostrar
automáticamente `images/qr-mercadopago.png`. Si el archivo no está
todavía, el sitio no rompe: oculta el QR y muestra un aviso pidiendo
pagar por transferencia con el alias y el CVU, que siempre se muestran
igual.

## Importante sobre el monto

El QR fijo de "Cobrar" de Mercado Pago **no lleva un monto cargado**
(el cliente lo tipea a mano al escanear), así que en el checkout del
sitio se muestra siempre el total exacto a pagar justo al lado del QR
para que el cliente lo copie. Si en algún momento preferís que el monto
venga precargado automáticamente en cada QR (uno distinto por compra),
eso requiere generar un "QR dinámico" desde la API de Mercado Pago con
tu Access Token — es un paso más grande (necesita guardar tu credencial
de forma segura en un servidor, no en el sitio) y no está incluido en
esta versión estática del sitio.
