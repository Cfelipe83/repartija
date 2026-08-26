import { sanitize } from './storage.js';

export function createPlayer(defaultName = "") {
  return {
    id: "pl_" + Date.now() + Math.random().toString(36).substring(2, 6),
    name: defaultName,
    buyout: 0,
    regear: 0,
    killboard: ""
  };
}

export function renderPlayersTable(players, onUpdate, onRemove) {
  const tbody = document.getElementById('player-rows');
  if (!tbody) return;
  tbody.innerHTML = "";

  players.forEach(p => {
    const tr = document.createElement('tr');
    const hasUrl = p.killboard && p.killboard.trim().startsWith('http');

    tr.innerHTML = `
      <td><input type="text" class="table-input table-input-player" value="${p.name}" placeholder="Nick" data-field="name"></td>
      <td><input type="number" class="table-input" min="0" value="${p.buyout || ''}" placeholder="0" data-field="buyout"></td>
      <td><input type="number" class="table-input" min="0" value="${p.regear || ''}" placeholder="0" data-field="regear"></td>
      <td>
        <input type="url" class="table-input" value="${p.killboard}" placeholder="https://..." data-field="killboard">
        <a id="kb-link-${p.id}" class="kb-link" href="${p.killboard}" target="_blank" style="display: ${hasUrl ? 'inline-flex' : 'none'};">🔗 Ver Killboard</a>
      </td>
      <td><button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;">Eliminar</button></td>
    `;

    tr.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        onUpdate(p.id, e.target.dataset.field, e.target.value);
      });
    });

    tr.querySelector('button.btn-danger').addEventListener('click', () => {
      onRemove(p.id);
    });

    tbody.appendChild(tr);
  });
}
