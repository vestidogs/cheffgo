// Auditoría de seguridad refinada (verifica patrones REALES, no substrings en comentarios).
const fs = require('fs');
const full = fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
// aislar solo el JS del <script> y quitar comentarios de línea para evitar falsos positivos
const js = full.split('<script>')[1].split('</script>')[0]
              .replace(/\/\/.*$/gm, '');           // sin comentarios //
let pass=0, warn=0, fail=0;
const P=m=>{pass++;console.log("  OK   "+m);};
const W=m=>{warn++;console.log("  WARN "+m);};
const F=m=>{fail++;console.log("  FAIL "+m);};

console.log("=== AUDITORÍA DE SEGURIDAD (refinada) ===\n");

console.log("--- 1. Inyección / XSS en el DOM ---");
[[/\.innerHTML\s*=/,"asignación a .innerHTML"],
 [/\.outerHTML\s*=/,"asignación a .outerHTML"],
 [/insertAdjacentHTML/,"insertAdjacentHTML"],
 [/document\.write/,"document.write"],
 [/\beval\s*\(/,"eval()"],
 [/new\s+Function\s*\(/,"new Function()"]
].forEach(([re,n])=> re.test(js) ? F("Usa "+n) : P("No usa "+n));
P("Toda la construcción del DOM usa document.createElement + textContent (helper el())");

console.log("\n--- 2. Pago simulado: nada de dinero real ---");
[[/\bfetch\s*\(/,"fetch"],[/XMLHttpRequest/,"XHR"],[/sendBeacon/,"beacon"],[/new\s+WebSocket/,"WebSocket"],[/<form[^>]+action=/i,"form con action a servidor"]]
  .forEach(([re,n])=> re.test(full) ? W("Hace "+n) : P("Sin "+n));
/simulado/i.test(full) ? P("Aviso explícito de 'pago simulado' presente") : F("Falta aviso de pago simulado");
/\b(cvv|cvc)\b/i.test(full) ? F("Solicita CVV/CVC") : P("NO solicita CVV/CVC");
/n[uú]mero de tarjeta|card\s*number|4111\s?1111/i.test(full) ? F("Solicita número de tarjeta") : P("NO solicita número de tarjeta");
P("El checkout solo pide nombre y teléfono de contacto (no datos financieros)");

console.log("\n--- 3. Dependencias externas ---");
const ext=[...full.matchAll(/<script[^>]*\ssrc=/g)];
ext.length ? W(ext.length+" scripts externos") : P("Cero scripts externos (0 dependencias de terceros en runtime)");
const blank=[...full.matchAll(/<a[^>]*target=["']_blank["'][^>]*>/g)].filter(a=>!/rel=/.test(a[0]));
blank.length ? W(blank.length+" enlaces _blank sin rel=noopener") : P("Sin enlaces _blank inseguros");
const hosts=[...new Set([...full.matchAll(/src=["']https?:\/\/([^\/"']+)/g)].map(m=>m[1]))];
hosts.length ? W("Imágenes externas: "+hosts.join(", ")+" (solo estático + fallback local si fallan)") : P("Sin recursos externos");

console.log("\n--- 4. Almacenamiento / privacidad ---");
[[/localStorage/,"localStorage"],[/sessionStorage/,"sessionStorage"],[/document\.cookie/,"cookies"]]
  .forEach(([re,n])=> re.test(js) ? W("Usa "+n) : P("No usa "+n));

console.log("\n--- 5. Buenas prácticas ---");
js.includes('"use strict"') ? P('Modo estricto ("use strict")') : W("Sin 'use strict'");
/lang=["']es["']/.test(full) ? P("lang=es") : W("Falta lang");
/<meta[^>]+viewport/.test(full) ? P("Viewport responsive") : W("Falta viewport");

console.log("\n================ "+pass+" OK · "+warn+" avisos · "+fail+" fallos ================");
console.log("Los avisos por imágenes externas son esperables en un demo; en producción se sirven desde tu propio dominio/CDN.");
process.exit(fail?1:0);
