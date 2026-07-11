// Auditoría de accesibilidad automatizada con axe-core (WCAG 2.0/2.1 A y AA) sobre el DOM renderizado.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');

const html = fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true });
const { window } = dom;

// dialog polyfill para que el script no falle
const dlg = window.document.getElementById('modal');
if (dlg) Object.assign(dlg, { showModal(){this.open=true;}, close(){this.open=false;} });

setTimeout(() => {
  window.eval(axe.source);
  window.axe.run(window.document, {
    runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] }
  }).then(r => {
    console.log("=== AUDITORÍA axe-core (WCAG 2.1 A/AA) ===\n");
    console.log("Reglas evaluadas: " + (r.passes.length + r.violations.length + r.incomplete.length));
    console.log("✅ Cumplidas: " + r.passes.length);
    console.log("❌ Violaciones: " + r.violations.length);
    console.log("⚠️  Requiere revisión manual: " + r.incomplete.length + "\n");

    if (r.violations.length) {
      console.log("--- VIOLACIONES ---");
      r.violations.forEach(v => {
        console.log(`❌ [${v.impact}] ${v.id}: ${v.help}`);
        console.log(`   ${v.nodes.length} nodo(s). ${v.helpUrl}`);
        v.nodes.slice(0,3).forEach(n => console.log("     · " + n.html.slice(0,90)));
      });
    } else {
      console.log("No se encontraron violaciones automáticas de WCAG 2.1 A/AA. 🎉");
    }
    console.log("\n--- Muestra de reglas CUMPLIDAS (relevantes) ---");
    ['color-contrast','image-alt','button-name','label','link-name','aria-required-attr','document-title','html-has-lang','landmark-one-main','list']
      .forEach(id => { const p = r.passes.find(x=>x.id===id); if(p) console.log("  ✅ " + id + " — " + p.help); });

    process.exit(r.violations.filter(v=>['serious','critical'].includes(v.impact)).length ? 1 : 0);
  }).catch(e => { console.error("Error axe:", e.message); process.exit(2); });
}, 80);
