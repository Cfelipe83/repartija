import { formatSilver, saveState, LEDGER_KEY } from './storage.js';
import { exportPDFDocument } from './pdf.js';

export function renderLedgerView(ledgerSessions) {
  // 1. Balance Consolidado
  const consolidated = {};

  ledgerSessions.forEach(session => {
    session.players.forEach(p => {
      if (!p.paid) {
        const key = p.name.toLowerCase();
        if (!consolidated[key]) {
          consolidated[key] = { displayName: p.name, netBalance: 0, pendingParties: 0 };
        }
        consolidated[key].netBalance += p.balance;
        consolidated[key].pendingParties += 1;
      }
    });
  });

  const consTbody = document.getElementById('ledger-consolidated-rows');
  if (consTbody) {
    consTbody.innerHTML = "";
    const consKeys = Object.keys(consolidated);
    if (consKeys.length === 0) {
      consTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No hay deudas ni pagos pendientes acumulados.</td></tr>`;
    } else {
      consKeys.forEach(k => {
        const item = consolidated[k];
        const tr = document.createElement('tr');
        let statusBadge = item.netBalance > 0 
          ? `<span class="status-badge status-receive">SE LE DEBE: ${formatSilver(item.netBalance)}</span>`
          : (item.netBalance < 0 ? `<span class="status-badge status-pay">DEBE: ${formatSilver(Math.abs(item.netBalance))}</span>` : `<span class="status-badge status-zero">SALDADO (0)</span>`);

        tr.innerHTML = `
  <td><strong class="player-name-highlight">${item.displayName}</strong></td>
  <td style="font-size: 1rem; font-weight: bold;">${formatSilver(item.netBalance)} Silver</td>
  <td>${item.pendingParties} partida(s) pendiente(s)</td>
  <td>${statusBadge}</td>
`;
        consTbody.appendChild(tr);
      });
    }
  }

  // 2. Historial de Partys Guardadas
  const sessContainer = document.getElementById('ledger-sessions-container');
  if (!sessContainer) return;
  sessContainer.innerHTML = "";

  if (ledgerSessions.length === 0) {
    sessContainer.innerHTML = `<div style="text-align:center; color: var(--text-muted); padding: 20px;">No has guardado ninguna party todavía.</div>`;
    return;
  }

  ledgerSessions.forEach((sess, sIdx) => {
    const sessCard = document.createElement('div');
    sessCard.style.cssText = "background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 6px; padding: 16px;";

    let chestsRows = "";
    if (sess.chestsSummary && sess.chestsSummary.length > 0) {
      sess.chestsSummary.forEach(c => {
        chestsRows += `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${formatSilver(c.loot)} Silver</td>
            <td>${c.marketTax}% (${formatSilver(c.marketTaxAmount || 0)})</td>
            <td style="color: var(--danger);">${formatSilver(c.repairs)} Silver</td>
            <td>${c.sellerName || 'Banco'}</td>
            <td style="color: var(--gold); font-weight: bold;">${formatSilver(c.net)} Silver</td>
          </tr>
        `;
      });
    }

    let playersRows = "";
    sess.players.forEach((p, pIdx) => {
      const kbLink = p.killboard ? `<a href="${p.killboard}" target="_blank" style="color:var(--primary-hover); text-decoration:none; margin-left:6px;">🔗 KB</a>` : '';
      playersRows += `
        <tr>
          <td><strong>${p.name}</strong> ${kbLink}</td>
          <td>${formatSilver(p.balance)} Silver</td>
          <td>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" ${p.paid ? 'checked' : ''} onchange="window.toggleLedgerPay(${sIdx}, ${pIdx})">
              <span style="font-size: 0.8rem; color: ${p.paid ? 'var(--success)' : 'var(--warning)'}; font-weight: bold;">
                ${p.paid ? '✓ Pagado / Saldado' : '⏳ Pendiente'}
              </span>
            </label>
          </td>
        </tr>
      `;
    });

    const t = sess.totals || {};

    sessCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 8px; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div>
          <span style="font-size: 1.1rem; font-weight: bold; color: var(--gold);">${sess.name}</span>
          <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 10px;">📅 ${sess.date}</span>
        </div>
        <div class="actions-bar">
          <button class="btn btn-success" style="padding: 4px 10px; font-size: 0.75rem;" onclick="window.printLedgerSession(${sIdx})">📄 Exportar PDF</button>
          <button class="btn btn-danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="window.deleteLedgerSession(${sIdx})">Eliminar Party</button>
        </div>
      </div>

      <!-- Métricas de Auditoría: Se incluye Total Neto a Repartir -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 12px; background: rgba(0,0,0,0.25); padding: 10px; border-radius: 4px;">
        <div><div style="font-size: 0.7rem; color: var(--text-muted);">BOTÍN BRUTO</div><strong style="font-size: 0.85rem; color:#fff;">${formatSilver(t.grossLoot || 0)}</strong></div>
        <div><div style="font-size: 0.7rem; color: var(--text-muted);">MARKET TAX</div><strong style="font-size: 0.85rem; color:var(--warning);">${formatSilver(t.marketTax || 0)}</strong></div>
        <div><div style="font-size: 0.7rem; color: var(--text-muted);">REPARACIONES</div><strong style="font-size: 0.85rem; color:var(--danger);">${formatSilver(t.repairs || 0)}</strong></div>
        <div><div style="font-size: 0.7rem; color: var(--text-muted);">IMP. GREMIO</div><strong style="font-size: 0.85rem; color:var(--warning);">${formatSilver(t.guildTax || 0)}</strong></div>
        <div><div style="font-size: 0.7rem; color: var(--text-muted);">RE-EQUIPOS</div><strong style="font-size: 0.85rem; color:var(--primary-hover);">${formatSilver(t.regearPool || 0)}</strong></div>
        <div><div style="font-size: 0.7rem; color: var(--text-muted);">NETO A REPARTIR</div><strong style="font-size: 0.85rem; color:var(--success);">${formatSilver(t.distributableNet || 0)}</strong></div>
        <div><div style="font-size: 0.7rem; color: var(--text-muted);">CORTE BASE</div><strong style="font-size: 0.85rem; color:var(--gold);">${formatSilver(t.baseSplit || 0)}</strong></div>
      </div>

      <details style="margin-bottom: 12px; cursor: pointer;">
        <summary style="font-size: 0.85rem; font-weight: bold; color: var(--gold);">📦 Ver detalle auditado de cofres (${sess.chestsSummary ? sess.chestsSummary.length : 0})</summary>
        <div style="overflow-x: auto; margin-top: 8px;">
          <table style="font-size: 0.8rem;">
            <thead>
              <tr>
                <th>Cofre</th>
                <th>Bruto</th>
                <th>Tarifa Market</th>
                <th>Reparación</th>
                <th>Pagado por</th>
                <th>Neto</th>
              </tr>
            </thead>
            <tbody>${chestsRows}</tbody>
          </table>
        </div>
      </details>

      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Balance Individual</th>
              <th>Estado de Liquidación</th>
            </tr>
          </thead>
          <tbody>${playersRows}</tbody>
        </table>
      </div>
    `;
    sessContainer.appendChild(sessCard);
  });
}
