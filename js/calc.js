import { sanitize, formatSilver, safeSetText } from './storage.js';

export function calculateEconomics(chests, players, guildTaxPercent) {
  const totalGrossLoot = chests.reduce((sum, c) => sum + (c.loot || 0), 0);
  const totalMarketTax = chests.reduce((sum, c) => sum + ((c.loot || 0) * (Math.min(100, sanitize(c.marketTax || 0)) / 100)), 0);
  const totalRepairs = chests.reduce((sum, c) => sum + (c.repairs || 0), 0);
  
  const postMarketAndRepairsLoot = Math.max(0, totalGrossLoot - totalMarketTax - totalRepairs);
  const guildTaxAmount = (postMarketAndRepairsLoot * Math.min(100, sanitize(guildTaxPercent))) / 100;
  const totalRegearPool = players.reduce((sum, p) => sum + (p.regear || 0), 0);

  const rawNet = postMarketAndRepairsLoot - guildTaxAmount - totalRegearPool;
  const distributableNet = Math.max(0, rawNet);
  const totalPlayersCount = players.length;
  const baseSplit = totalPlayersCount > 0 ? distributableNet / totalPlayersCount : 0;

  // Suma de reparaciones por seller
  const repairsBySeller = {};
  chests.forEach(c => {
    if (c.sellerId && c.repairs > 0) {
      repairsBySeller[c.sellerId] = (repairsBySeller[c.sellerId] || 0) + c.repairs;
    }
  });

  return {
    totalGrossLoot,
    totalMarketTax,
    totalRepairs,
    guildTaxAmount,
    totalRegearPool,
    distributableNet,
    baseSplit,
    rawNet,
    repairsBySeller
  };
}

export function renderEconomicsView(eco, players) {
  const alertBox = document.getElementById('deficit-alert');
  if (alertBox) {
    if (eco.rawNet < 0) {
      alertBox.style.display = "block";
      safeSetText('deficit-amount', formatSilver(Math.abs(eco.rawNet)));
    } else {
      alertBox.style.display = "none";
    }
  }

  safeSetText('disp-total-loot', formatSilver(eco.totalGrossLoot));
  safeSetText('disp-total-market-tax', formatSilver(eco.totalMarketTax));
  safeSetText('disp-total-repairs', formatSilver(eco.totalRepairs));
  safeSetText('disp-tax', formatSilver(eco.guildTaxAmount));
  safeSetText('disp-regear-pool', formatSilver(eco.totalRegearPool));
  safeSetText('disp-distributable', formatSilver(eco.distributableNet));
  safeSetText('disp-base-split', formatSilver(eco.baseSplit));

  // Render Pagos Finales
  const payoutBody = document.getElementById('payout-rows');
  if (!payoutBody) return;
  payoutBody.innerHTML = "";

  players.forEach(p => {
    const refund = eco.repairsBySeller[p.id] || 0;
    const finalBalance = eco.baseSplit + (p.regear || 0) + refund - (p.buyout || 0);
    const tr = document.createElement('tr');

    let statusBadge = "";
    if (finalBalance > 0) {
      statusBadge = `<span class="status-badge status-receive">RECIBE ${formatSilver(finalBalance)}</span>`;
    } else if (finalBalance < 0) {
      statusBadge = `<span class="status-badge status-pay">DEBE ${formatSilver(Math.abs(finalBalance))}</span>`;
    } else {
      statusBadge = `<span class="status-badge status-zero">SALDADO (0)</span>`;
    }

    tr.innerHTML = `
      <td><strong>${p.name || 'Sin nombre'}</strong></td>
      <td>${formatSilver(eco.baseSplit)}</td>
      <td style="color: var(--success);">+${formatSilver(p.regear || 0)}</td>
      <td style="color: var(--gold);">${refund > 0 ? '+' + formatSilver(refund) : '-'}</td>
      <td style="color: var(--danger);">${(p.buyout || 0) > 0 ? '-' + formatSilver(p.buyout) : '0'}</td>
      <td><strong>${formatSilver(finalBalance)}</strong></td>
      <td>${statusBadge}</td>
    `;
    payoutBody.appendChild(tr);
  });
}