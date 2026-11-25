/* C Plus · lee la foto de una factura.
   1) Claude en el servidor (función "receipt"), si la empresa le puso la clave.
   2) Si no, Tesseract en el mismo teléfono (archivos en vendor/tess) y reglas para encontrar
      tienda, fecha, total, impuesto, forma de pago y artículos.
   El resultado siempre se revisa en el formulario antes de guardar. */
(function () {
  const S = window.CPLUS;
  const VENDORS = [
    [/home\s*depot/i, 'The Home Depot', 'materials'], [/lowe'?s/i, "Lowe's", 'materials'], [/menards/i, 'Menards', 'materials'],
    [/floor\s*(&|and)?\s*decor/i, 'Floor & Decor', 'materials'], [/sherwin|williams/i, 'Sherwin-Williams', 'materials'],
    [/ace\s*hardware/i, 'Ace Hardware', 'materials'], [/harbor\s*freight/i, 'Harbor Freight', 'tools'], [/costco/i, 'Costco', 'materials'],
    [/walmart/i, 'Walmart', 'materials'], [/lumber|stock\s*building|bmc|84\s*lumber/i, null, 'materials'], [/tile\s*shop|msi/i, null, 'materials'],
    [/sunbelt|united\s*rentals|herc/i, null, 'equipment'], [/maverik|chevron|shell|sinclair|exxon|conoco|phillips\s*66|texaco|7-?eleven|holiday/i, null, 'vehicle'],
    [/waste\s*management|republic\s*services|dumpster|landfill/i, null, 'disposal'], [/city\s*of|county|permit/i, null, 'permits'],
    [/restaurant|cafe|grill|taco|pizza|burger|mcdonald|subway|wendy|chick-?fil|starbucks|in-?n-?out/i, null, 'meals'],
    [/office\s*depot|staples/i, null, 'office']
  ];
  const MONEY = /\$?\s*(-?\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})|-?\d+[.,]\d{2})\b/g;
  const num = s => +String(s).replace(/[\s$]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
  const lastMoney = line => { const m = [...line.matchAll(MONEY)]; return m.length ? num(m[m.length - 1][1]) : null; };
  const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12, ene: 1, abr: 4, ago: 8, dic: 12 };
  const iso = (y, m, d) => { y = +y; if (y < 100) y += 2000; m = +m; d = +d; if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 2000 && y < 2100)) return ''; return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };

  function parse(text) {
    const lines = text.split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const out = { vendor: '', date: '', total: 0, subtotal: null, sales_tax: null, pay_method: '', card_last4: '', items: [], summary: '', tax_cat: 'materials', source: 'ocr', confidence: 'low' };
    for (const [re, name, cat] of VENDORS) { if (re.test(text)) { out.tax_cat = cat; if (name) out.vendor = name; break; } }
    if (!out.vendor) { const v = lines.slice(0, 6).find(l => /[a-z]{3,}/i.test(l) && (l.match(/\d/g) || []).length < 4 && !/receipt|invoice|welcome|store|#/i.test(l)); out.vendor = v ? v.replace(/[^\w&'.\- ]/g, '').trim().slice(0, 60) : ''; }
    // fecha
    for (const l of lines) {
      let m = l.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/); if (m) { out.date = iso(m[3], m[1], m[2]); if (out.date) break; }
      m = l.match(/\b(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/); if (m) { out.date = iso(m[1], m[2], m[3]); if (out.date) break; }
      m = l.match(/\b([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(20\d{2})\b/i); if (m && MON[m[1].toLowerCase()]) { out.date = iso(m[3], MON[m[1].toLowerCase()], m[2]); if (out.date) break; }
    }
    // totales
    const totals = [];
    lines.forEach((l, i) => {
      const v = lastMoney(l) ?? lastMoney(lines[i + 1] || '');
      if (/sub\s*-?\s*total/i.test(l)) { if (v != null) out.subtotal = v; }
      else if (/\b(total|amount\s*due|balance\s*due|grand\s*total|importe)\b/i.test(l) && !/tax|items?\s*sold|savings|qty/i.test(l)) { if (v != null && v > 0) totals.push(v); }
      else if (/\b(sales\s*)?tax\b/i.test(l) && out.sales_tax == null && v != null && v < 10000) out.sales_tax = v;
      if (/visa|master\s*card|amex|american\s*express|discover|debit|credit|card/i.test(l)) out.pay_method = 'card';
      else if (!out.pay_method && /\bcash\b/i.test(l)) out.pay_method = 'cash';
      else if (!out.pay_method && /\bcheck\b/i.test(l)) out.pay_method = 'check';
      const c = l.match(/(?:\*{2,}|x{2,}|#{2,})\s*(\d{4})\b/i); if (c) out.card_last4 = c[1];
    });
    const all = [...text.matchAll(MONEY)].map(m => num(m[1])).filter(v => v > 0 && v < 1e6);
    out.total = totals.length ? Math.max(...totals) : (all.length ? Math.max(...all) : 0);
    if (!out.total && out.subtotal) out.total = out.subtotal + (out.sales_tax || 0);
    // artículos: texto seguido de un monto, sin las líneas de totales ni pagos
    for (const l of lines) {
      if (/total|tax|change|cash|visa|master|debit|credit|card|balance|tender|savings|auth|approval|ref\b/i.test(l)) continue;
      const v = lastMoney(l); if (v == null || v <= 0 || v > out.total) continue;
      const q = l.match(/^(\d+(?:\.\d+)?)\s*(?:@|x|ea\b)/i);
      if (q && out.items.length) { const it = out.items[out.items.length - 1]; it.amount = v; it.desc = (it.desc + ' (' + q[1] + ')').slice(0, 60); continue; }
      const desc = l.replace(MONEY, '').replace(/\b\d{6,}\b/g, '').replace(/[^\w&'"/.\- ]/g, ' ').replace(/\s+/g, ' ').trim();
      if ((desc.match(/[a-z]/gi) || []).length < 3) continue;
      out.items.push({ desc: desc.slice(0, 60), amount: v }); if (out.items.length >= 15) break;
    }
    out.summary = out.items.slice(0, 3).map(i => i.desc.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())).join(', ').slice(0, 80);
    out.confidence = out.total && out.date && out.vendor ? 'medium' : 'low';
    return out;
  }

  let worker = null;
  async function ocr(blob, onStep) {
    if (!window.Tesseract) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/tess/tesseract.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    if (!worker) {
      onStep && onStep('load');
      worker = await Tesseract.createWorker('eng', 1, { workerPath: 'vendor/tess/worker.min.js', corePath: 'vendor/tess/', langPath: 'vendor/tess', workerBlobURL: false, cacheMethod: 'write' });
      await worker.setParameters({ preserve_interword_spaces: '1' });
    }
    onStep && onStep('read');
    const { data } = await worker.recognize(blob);
    return data.text || '';
  }

  /* imagen para leer: más grande y en escala de grises ayuda a Tesseract */
  async function prep(file) { return S.compress(file, 2000, .9); }
  const b64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });

  S.receipt = {
    parse,
    async read(file, onStep) {
      const blob = await prep(file);
      if (API.receiptAI) {
        try { onStep && onStep('ai'); const r = await API.receiptAI(await b64(blob), blob.type || 'image/jpeg'); if (r && r.total != null) return { ...r, blob }; }
        catch (e) { if (!/no_key|501/.test(e.message || '')) console.warn('receipt ai', e); }
      }
      const text = await ocr(blob, onStep);
      return { ...parse(text), text, blob };
    }
  };
})();
