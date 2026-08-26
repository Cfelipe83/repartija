import { formatSilver, safeSetText } from './storage.js';

export function exportPDFDocument(sessionData) {
  const partyName = sessionData.name || 'Reparto';
  const partyDate = sessionData.date || '';
  const t = sessionData.totals;

  safeSetText('pdf-title', `LIQUIDACIÓN: ${partyName.toUpperCase()}`);
  safeSetText('pdf-date-val', partyDate);
  safeSetText('pdf-gross-loot', formatSilver(t.grossLoot));
  safeSetText('pdf-deductions', formatSilver(t.marketTax + t.repairs + t.guildTax));
  safeSetText('pdf-regear-total', formatSilver(t.regearPool));
  safeSetText('pdf-base-cut', formatSilver(t.baseSplit));

  // Render Cofres
  const pdfChestBody = document.getElementById('pdf-chest-rows');
  if (pdfChestBody) {
    pdfChestBody.innerHTML = "";
    sessionData.chestsSummary.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:#fff;"><strong>${c.name}</strong></td>
        <td>${formatSilver(c.loot)} Silver</td>
        <td style="color: var(--warning);">${c.marketTax}% (${formatSilver(c.marketTaxAmount)})</td>
        <td style="color: var(--danger);">${formatSilver(c.repairs)} Silver</td>
        <td>${c.sellerName || 'Banco'}</td>
        <td style="color: var(--gold); font-weight: bold;">${formatSilver(c.net)} Silver</td>
      `;
      pdfChestBody.appendChild(tr);
    });
  }

  // Render Pagos
  const pdfTbody = document.getElementById('pdf-payout-rows');
  if (pdfTbody) {
    pdfTbody.innerHTML = "";
    sessionData.players.forEach(p => {
      const tr = document.createElement('tr');
      const badgeHtml = p.balance > 0 
        ? `<span class="pdf-badge pdf-badge-green">RECIBE ${formatSilver(p.balance)}</span>`
        : (p.balance < 0 ? `<span class="pdf-badge pdf-badge-red">DEBE ${formatSilver(Math.abs(p.balance))}</span>` : `<span class="pdf-badge" style="background:#333;color:#aaa;">0</span>`);

      tr.innerHTML = `
        <td style="color:#fff;"><strong>${p.name || 'Sin nombre'}</strong></td>
        <td>${formatSilver(t.baseSplit)}</td>
        <td style="color: #85e89d;">${(p.regear || 0) > 0 ? '+' + formatSilver(p.regear) : '-'}</td>
        <td style="color: var(--gold);">${(p.refundRepairs || 0) > 0 ? '+' + formatSilver(p.refundRepairs) : '-'}</td>
        <td style="color: #f97583;">${(p.buyout || 0) > 0 ? '-' + formatSilver(p.buyout) : '-'}</td>
        <td><strong>${formatSilver(p.balance)}</strong> ${badgeHtml}</td>
        <td style="font-size: 7.5pt; word-break: break-all; color: var(--primary-hover);">${p.killboard || '-'}</td>
      `;
      pdfTbody.appendChild(tr);
    });
  }

  // Galería de imágenes (si existen)
  const pdfImagesSection = document.getElementById('pdf-images-section');
  const pdfGallery = document.getElementById('pdf-gallery-container');
  if (pdfGallery && pdfImagesSection) {
    pdfGallery.innerHTML = "";
    if (sessionData.evidenceImages && sessionData.evidenceImages.length > 0) {
      pdfImagesSection.style.display = "block";
      sessionData.evidenceImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'pdf-full-img';
        pdfGallery.appendChild(img);
      });
    } else {
      pdfImagesSection.style.display = "none";
    }
  }

  document.body.classList.add('pdf-mode');
  const element = document.getElementById('pdf-printable-doc');

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `Payout_${partyName.replace(/\s+/g, '_')}_${partyDate}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0, backgroundColor: '#11141a' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    document.body.classList.remove('pdf-mode');
  }).catch(err => {
    console.error(err);
    document.body.classList.remove('pdf-mode');
  });
}