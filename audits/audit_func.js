// Auditoría funcional: ejecuta el JS real de la página con jsdom y verifica el flujo completo.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log("  OK  " + m)) : (fail++, console.log("  XX  " + m)); };

const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true });
const { window } = dom;
const doc = window.document;
const dlg = doc.getElementById('modal');
Object.assign(dlg, { showModal(){this.open=true;}, close(){this.open=false;this.dispatchEvent(new window.Event('close'));} });

setTimeout(runTests, 80);
function click(elm){ elm.dispatchEvent(new window.Event('click',{bubbles:true})); }
function setVal(sel,v){ const e=doc.querySelector(sel); e.value=v; e.dispatchEvent(new window.Event('input',{bubbles:true})); e.dispatchEvent(new window.Event('change',{bubbles:true})); }
const cards = () => doc.querySelectorAll('#grid .card');

function runTests(){
  console.log("\n=== 1. Render inicial ===");
  ok(cards().length === 6, "Renderiza 6 tarjetas (obtenidas: "+cards().length+")");
  ok(doc.querySelector('#result-count').textContent.includes('6'), "Contador muestra 6");
  ok(doc.querySelectorAll('#grid article.card').length===6, "Las tarjetas son <article> (no <button> anidable)");
  ok(doc.querySelectorAll('#grid .card button.card-open').length===6, "Cada tarjeta tiene botón 'Ver perfil' accesible");

  console.log("\n=== 2. Filtro bartenders ===");
  const chipBar = [...doc.querySelectorAll('.chip')].find(c=>c.dataset.filter==='bartender');
  click(chipBar);
  ok(chipBar.getAttribute('aria-pressed')==='true', "Chip queda aria-pressed=true");
  ok(cards().length === 2, "Filtra a 2 bartenders (obtenidas: "+cards().length+")");

  console.log("\n=== 3. Filtro cocina Italiana ===");
  click([...doc.querySelectorAll('.chip')].find(c=>c.dataset.filter==='Italiana'));
  ok(cards().length === 2, "2 de cocina Italiana (obtenidas: "+cards().length+")");

  console.log("\n=== 4. Buscador por ciudad ===");
  click([...doc.querySelectorAll('.chip')].find(c=>c.dataset.filter==='all'));
  setVal('#f-ciudad','Cali');
  ok(cards().length === 1, "Ciudad=Cali deja 1 (obtenidas: "+cards().length+")");
  setVal('#f-ciudad','');

  console.log("\n=== 5. Estado vacío ===");
  setVal('#f-ciudad','Bogotá'); setVal('#f-servicio','bartender');
  ok(doc.querySelector('#grid .empty')!=null, "Combinación imposible => estado vacío");
  setVal('#f-servicio',''); setVal('#f-ciudad','');

  console.log("\n=== 6. Abrir perfil ===");
  setVal('#f-invitados','8');
  click(cards()[0].querySelector('.card-open'));
  ok(dlg.open===true, "El diálogo se abre");
  ok(doc.querySelector('#m-title')!=null, "Modal con id m-title (aria-labelledby)");
  ok(doc.querySelector('.menu-list li')!=null, "Muestra menú");
  ok(doc.querySelector('.review')!=null, "Muestra reseñas");

  console.log("\n=== 7. Cálculo de precio (18%) ===");
  const box = doc.querySelector('.book-box');
  const inv = parseInt(box.dataset.inv), tot = parseInt(box.dataset.total);
  const eSub = 190000*8, eTot = eSub + Math.round(eSub*0.18);
  ok(inv===8, "Toma 8 invitados (obtenido: "+inv+")");
  ok(tot===eTot, "Total = subtotal + 18% ($"+tot.toLocaleString('es-CO')+" == $"+eTot.toLocaleString('es-CO')+")");

  console.log("\n=== 8. Reserva requiere fecha ===");
  const btnReservar = [...doc.querySelectorAll('.book-box .btn-primary')][0];
  const fecha = doc.querySelector('#b-fecha'); fecha.value='';
  click(btnReservar);
  ok(doc.querySelector('.pay-methods')==null, "Sin fecha NO avanza (validación)");
  fecha.value='2026-09-20'; click(btnReservar);
  ok(doc.querySelector('.pay-methods')!=null, "Con fecha avanza al checkout");

  console.log("\n=== 9. Checkout ===");
  ok(doc.querySelectorAll('.pay-opt').length===3, "3 métodos (Nequi/PSE/Tarjeta)");
  ok(doc.querySelector('.demo-note').textContent.toLowerCase().includes('simulado'), "Nota visible: pago simulado");
  const pse=[...doc.querySelectorAll('.pay-opt')].find(b=>b.textContent==='PSE'); click(pse);
  ok(pse.getAttribute('aria-pressed')==='true', "PSE actualiza aria-pressed");

  console.log("\n=== 10. Confirmación ===");
  const btnPagar = [...doc.querySelectorAll('.modal-body .btn-primary')].find(b=>/Pagar/.test(b.textContent));
  click(btnPagar);
  const code = doc.querySelector('.code');
  ok(code!=null && /^CHF-[A-Z0-9]{5}$/.test(code.textContent), "Código CHF-XXXXX ("+(code&&code.textContent)+")");
  ok(doc.querySelector('.confirm h2').textContent.includes('confirmada'), "Pantalla '¡Reserva confirmada!'");

  console.log("\n=== 11. Cerrar ===");
  click([...doc.querySelectorAll('.confirm .btn-primary')][0]);
  ok(dlg.open===false, "Botón 'Listo' cierra el diálogo");

  console.log("\n================ "+pass+" OK · "+fail+" fallos ================");
  process.exit(fail?1:0);
}
