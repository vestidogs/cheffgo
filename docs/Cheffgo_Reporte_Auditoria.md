# Cheffgo — Demo web · Reporte de auditoría

**Archivo auditado:** `cheffgo_demo.html` (un solo archivo, sin dependencias externas en ejecución)
**Fecha:** 10 de julio de 2026
**Método:** pruebas automatizadas ejecutando el JavaScript real de la página (jsdom), axe-core para accesibilidad y análisis estático de seguridad.

---

## Resumen

| Auditoría | Herramienta | Resultado |
|---|---|---|
| Funcional (flujo completo) | jsdom + suite propia | **23 / 23 pruebas OK** |
| Accesibilidad WCAG 2.1 A/AA | axe-core | **0 violaciones** |
| Seguridad front-end | análisis estático | **25 OK · 0 fallos** |

Los tres exámenes pasan. A continuación el detalle.

---

## 1. Prueba funcional — 23/23

Se ejecutó el JavaScript real de la página y se simuló el recorrido completo del usuario:

- Renderiza las 6 tarjetas iniciales y el contador correcto.
- Las tarjetas son `<article>` con un botón accesible "Ver perfil" (sin controles anidados).
- Filtros por tipo (chef / bartender) y por cocina (Italiana, Parrilla, Mariscos…) funcionan.
- Buscador por ciudad y estado vacío cuando no hay coincidencias.
- Apertura del perfil (menú de ejemplo + reseñas) en un diálogo modal.
- **Cálculo de precio correcto:** subtotal + 18% de servicio (verificado: 8 invitados × $190.000 + 18% = $1.793.600).
- Validación: no deja reservar sin fecha.
- Checkout con 3 métodos (Nequi / PSE / Tarjeta) y aviso de pago simulado.
- Confirmación con código único `CHF-XXXXX` y cierre del modal.

## 2. Accesibilidad — 0 violaciones (WCAG 2.1 A/AA)

Auditado con **axe-core**, el estándar de la industria. Reglas cumplidas incluyen: textos alternativos en imágenes, nombres accesibles en botones y enlaces, etiquetas en formularios, atributos ARIA requeridos, título de documento e idioma del documento.

**Hallazgo corregido durante la auditoría:** las tarjetas eran un `<button>` que contenía otro `<button>` (el corazón de favoritos) — una violación *seria* de "controles interactivos anidados". Se rediseñó con el patrón *stretched link*: la tarjeta es un `<article>`, el botón "Ver perfil" cubre toda la tarjeta y el botón de favoritos queda por encima sin anidarse. También se oscureció un gris de bajo contraste.

Además, el demo incluye: enlace "saltar al catálogo", navegación por teclado con foco visible, cierre del modal con `Esc`, devolución del foco al cerrar, y regiones `aria-live` para los resultados.

## 3. Seguridad del front-end — 25 OK, 0 fallos

- **Sin XSS:** no usa `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval` ni `new Function`. Todo el contenido se construye con `createElement` + `textContent`.
- **No mueve dinero real:** sin `fetch`, XHR, WebSocket ni formularios con `action`. El pago es 100% simulado y así se advierte en pantalla.
- **No pide datos financieros:** no solicita número de tarjeta ni CVV; el checkout solo pide nombre y teléfono.
- **Cero dependencias de terceros** en ejecución (JavaScript propio, sin CDN).
- **Sin almacenamiento** de datos del usuario (no usa localStorage, sessionStorage ni cookies).
- Buenas prácticas: `"use strict"`, `lang=es`, viewport responsive.

---

## Nota sobre la verificación visual

En este entorno no fue posible instalar un navegador headless (la descarga del binario está bloqueada por la red del sandbox), por lo que la verificación visual con captura de pantalla no se realizó aquí. La verificación funcional se hizo ejecutando el JavaScript real de la página. **Para ver el demo, abre `cheffgo_demo.html` en tu navegador** (doble clic). Con internet, las tarjetas muestran fotos; sin internet, muestran un ícono de respaldo — en ambos casos el demo funciona.

## Recomendaciones para pasar a producción

1. Servir las imágenes desde tu propio dominio/almacenamiento (no desde un tercero).
2. Añadir backend real, base de datos de profesionales y verificación de identidad.
3. Integrar la pasarela real (Wompi recomendada) reemplazando el checkout simulado.
4. Añadir una Política de Privacidad y Términos (tratamiento de datos, Ley 1581).
5. Añadir una Content-Security-Policy cuando exista servidor.
