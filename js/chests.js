import { sanitize, formatSilver } from './storage.js';

export function createChest(defaultName = "", defaultMarketTax = 4) {
  return {
    id: "chest_" + Date.now() + Math.random().toString(36).substring(2, 6),
    name: defaultName,
    loot: 0,
    marketTax: defaultMarketTax,
    repairs: 0,
    sellerId: ""
  };
}

export function renderChestsTable(chests, players, onUpdate, onRemove) {
  const tbody = document.getElementById('chest-rows');
  if (!tbody) return;
  tbody.innerHTML = "";

  chests.forEach(c => {
    const taxPercent = Math.min(100, sanitize(c.marketTax || 0));
    const marketTaxAmount = (c.loot * taxPercent) / 100;
    const netFromChest = Math.max(0, c.loot - marketTaxAmount - c.repairs);

    let sellerOptions = `<option value="">-- Banco / Nadie --</option>`;
    players.forEach(p => {
      const isSelected = p.id === c.sellerId ? "selected" : "";
      sellerOptions += `<option value="${p.id}" ${isSelected}>${p.name || 'Sin nombre'}</option>`;
    });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="table-input" value="${c.name}" placeholder="Ej: Cofre Avalon" data-field="name"></td>
      <td><input type="number" class="table-input" min="0" value="${c.loot || ''}" placeholder="0" data-field="loot"></td>
      <td><input type="number" class="table-input" min="0" max="100" value="${c.marketTax !== undefined ? c.marketTax : 4}" placeholder="4" data-field="marketTax"></td>
      <td><input type="number" class="table-input" min="0" value="${c.repairs || ''}" placeholder="0" data-field="repairs"></td>
      <td>
        <select class="table-input" data-field="sellerId">${sellerOptions}</select>
      </td>
      <td style="font-weight: bold; color: var(--gold);" id="chest-net-${c.id}">${formatSilver(netFromChest)}</td>
      <td><button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;">Eliminar</button></td>
    `;

    // Listeners
    tr.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', (e) => {
        onUpdate(c.id, e.target.dataset.field, e.target.value);
      });
    });

    tr.querySelector('button.btn-danger').addEventListener('click', () => {
      onRemove(c.id);
    });

    tbody.appendChild(tr);
  });
}