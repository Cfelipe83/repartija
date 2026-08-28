import { sanitize, formatSilver, saveState, loadState, CURRENT_STATE_KEY, LEDGER_KEY } from './storage.js';
import { createChest, renderChestsTable } from './chests.js';
import { createPlayer, renderPlayersTable } from './players.js';
import { calculateEconomics, renderEconomicsView } from './calc.js';
import { renderLedgerView } from './ledger.js';
import { exportPDFDocument } from './pdf.js';
import { renderCityBonuses } from './cities.js';

let chests = [];
let players = [];
let evidenceImages = [];
let ledgerSessions = [];
let currentCityFilter = "all";

function init() {
  ledgerSessions = loadState(LEDGER_KEY) || [];
  const state = loadState(CURRENT_STATE_KEY);

  if (!state) {
    if (document.getElementById('party-date')) document.getElementById('party-date').valueAsDate = new Date();
    chests = [createChest("Cofre 1", 4)];
    players = [createPlayer("Jugador 1")];
  } else {
    document.getElementById('party-name').value = state.partyName || "Gank / Roaming Session";
    document.getElementById('party-date').value = state.partyDate || new Date().toISOString().split('T')[0];
    document.getElementById('guild-tax').value = state.guildTax || 0;
    chests = state.chests?.length ? state.chests : [createChest("Cofre 1", 4)];
    players = state.players?.length ? state.players : [createPlayer("Jugador 1")];
    evidenceImages = state.evidenceImages || [];
  }

  renderChestsTable(chests, players, onChestUpdate, onChestRemove);
  renderPlayersTable(players, onPlayerUpdate, onPlayerRemove);
  renderGallery();
  recalculate();

  // Listeners Generales
  document.getElementById('guild-tax')?.addEventListener('input', () => { recalculate(); persist(); });
  document.getElementById('party-name')?.addEventListener('input', persist);
  document.getElementById('party-date')?.addEventListener('change', persist);
}

function persist() {
  saveState(CURRENT_STATE_KEY, {
    partyName: document.getElementById('party-name')?.value,
    partyDate: document.getElementById('party-date')?.value,
    guildTax: document.getElementById('guild-tax')?.value,
    chests,
    players,
    evidenceImages
  });
}

function recalculate() {
  const tax = document.getElementById('guild-tax')?.value || 0;
  const eco = calculateEconomics(chests, players, tax);
  renderEconomicsView(eco, players);
}

// Chest handlers
function onChestUpdate(id, field, value) {
  const c = chests.find(item => item.id === id);
  if (!c) return;
  c[field] = (field === 'loot' || field === 'repairs' || field === 'marketTax') ? sanitize(value) : value;

  // Actualiza celda neta de cofre
  const netEl = document.getElementById(`chest-net-${id}`);
  if (netEl) {
    const taxP = Math.min(100, sanitize(c.marketTax || 0));
    const mTax = (c.loot * taxP) / 100;
    netEl.innerText = formatSilver(Math.max(0, c.loot - mTax - c.repairs));
  }
  recalculate();
  persist();
}

function onChestRemove(id) {
  if (chests.length <= 1) {
    alert("Debe existir al menos un cofre.");
    return;
  }
  chests = chests.filter(c => c.id !== id);
  renderChestsTable(chests, players, onChestUpdate, onChestRemove);
  recalculate();
  persist();
}

// Player handlers
function onPlayerUpdate(id, field, value) {
  const p = players.find(item => item.id === id);
  if (!p) return;
  p[field] = (field === 'buyout' || field === 'regear') ? sanitize(value) : value;

  if (field === 'killboard') {
    const linkEl = document.getElementById(`kb-link-${id}`);
    if (linkEl) {
      linkEl.style.display = value.trim().startsWith('http') ? 'inline-flex' : 'none';
      linkEl.href = value.trim();
    }
  }

  // Si cambia el nombre, refrescar selects de sellers en los cofres
  if (field === 'name') {
    renderChestsTable(chests, players, onChestUpdate, onChestRemove);
  }

  recalculate();
  persist();
}

function onPlayerRemove(id) {
  players = players.filter(p => p.id !== id);
  // Limpiar referencias de seller
  chests.forEach(c => { if (c.sellerId === id) c.sellerId = ""; });
  renderChestsTable(chests, players, onChestUpdate, onChestRemove);
  renderPlayersTable(players, onPlayerUpdate, onPlayerRemove);
  recalculate();
  persist();
}

// Exposición a Window para interactividad inline en HTML
window.switchTab = (tabId) => {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  
  if (tabId === 'tab-calc') {
    document.getElementById('tab-btn-calc').classList.add('active');
    document.getElementById('tab-calc').classList.add('active');
  } else {
    document.getElementById('tab-btn-ledger').classList.add('active');
    document.getElementById('tab-ledger').classList.add('active');
    renderLedgerView(ledgerSessions);
  }
};

window.addChest = () => {
  chests.push(createChest(`Cofre ${chests.length + 1}`, 4));
  renderChestsTable(chests, players, onChestUpdate, onChestRemove);
  recalculate();
  persist();
};

window.addPlayer = (name = "") => {
  players.push(createPlayer(name));
  renderChestsTable(chests, players, onChestUpdate, onChestRemove);
  renderPlayersTable(players, onPlayerUpdate, onPlayerRemove);
  recalculate();
  persist();
};

window.resetCurrentSession = () => {
  if (!confirm("¿Deseas vaciar los campos del reparto actual?")) return;
  chests = [createChest("Cofre 1", 4)];
  players = [createPlayer("Jugador 1")];
  evidenceImages = [];
  document.getElementById('guild-tax').value = 0;
  document.getElementById('party-name').value = "Gank / Roaming Session";
  document.getElementById('party-date').valueAsDate = new Date();
  renderChestsTable(chests, players, onChestUpdate, onChestRemove);
  renderPlayersTable(players, onPlayerUpdate, onPlayerRemove);
  renderGallery();
  recalculate();
  persist();
};

window.openBulkModal = () => { document.getElementById('bulk-modal').style.display = "flex"; };
window.closeBulkModal = () => {
  document.getElementById('bulk-modal').style.display = "none";
  document.getElementById('bulk-nicks').value = "";
};

window.processBulkNicks = () => {
  const raw = document.getElementById('bulk-nicks').value;
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  if (players.length === 1 && players[0].name === "Jugador 1" && players[0].buyout === 0 && players[0].regear === 0) {
    players = [];
  }

  lines.forEach(nick => players.push(createPlayer(nick)));
  renderChestsTable(chests, players, onChestUpdate, onChestRemove);
  renderPlayersTable(players, onPlayerUpdate, onPlayerRemove);
  recalculate();
  persist();
  window.closeBulkModal();
};

// Galería e Imágenes
window.handleImageUpload = (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        evidenceImages.push(canvas.toDataURL('image/jpeg', 0.85));
        renderGallery();
        persist();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
  e.target.value = "";
};

window.removeImage = (e, index) => {
  e.stopPropagation();
  evidenceImages.splice(index, 1);
  renderGallery();
  persist();
};

function renderGallery() {
  const gallery = document.getElementById('evidence-gallery');
  if (!gallery) return;
  gallery.innerHTML = "";

  evidenceImages.forEach((src, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = "evidence-card";
    wrapper.onclick = () => {
      document.getElementById('lightbox-img').src = src;
      document.getElementById('lightbox-modal').style.display = "flex";
    };
    wrapper.innerHTML = `
      <img src="${src}" class="evidence-thumb" alt="Respaldo ${idx + 1}">
      <button class="btn-delete-img" onclick="window.removeImage(event, ${idx})">✕</button>
    `;
    gallery.appendChild(wrapper);
  });
}

window.closeLightbox = () => {
  document.getElementById('lightbox-modal').style.display = "none";
  document.getElementById('lightbox-img').src = "";
};

// Historial y PDF
function buildCurrentSessionSnapshot() {
  const tax = document.getElementById('guild-tax')?.value || 0;
  const eco = calculateEconomics(chests, players, tax);

  return {
    id: "session_" + Date.now(),
    name: document.getElementById('party-name')?.value || 'Reparto',
    date: document.getElementById('party-date')?.value || '',
    totals: {
      grossLoot: eco.totalGrossLoot,
      marketTax: eco.totalMarketTax,
      repairs: eco.totalRepairs,
      guildTax: eco.guildTaxAmount,
      regearPool: eco.totalRegearPool,
      distributableNet: eco.distributableNet,
      baseSplit: eco.baseSplit
    },
    chestsSummary: chests.map(c => {
      const mTax = Math.min(100, sanitize(c.marketTax || 0));
      const mAmount = ((c.loot || 0) * mTax) / 100;
      const seller = players.find(p => p.id === c.sellerId);
      return {
        name: c.name || "Cofre",
        loot: c.loot || 0,
        marketTax: mTax,
        marketTaxAmount: mAmount,
        repairs: c.repairs || 0,
        sellerName: seller ? seller.name : 'Banco',
        net: Math.max(0, (c.loot || 0) - mAmount - (c.repairs || 0))
      };
    }),
    players: players.map(p => {
      const refund = eco.repairsBySeller[p.id] || 0;
      return {
        name: (p.name || "Sin nombre").trim(),
        regear: p.regear || 0,
        refundRepairs: refund,
        buyout: p.buyout || 0,
        balance: eco.baseSplit + (p.regear || 0) + refund - (p.buyout || 0),
        killboard: p.killboard || "",
        paid: false
      };
    }),
    evidenceImages: [...evidenceImages]
  };
}

window.commitSessionToLedger = () => {
  const snap = buildCurrentSessionSnapshot();
  ledgerSessions.unshift(snap);
  saveState(LEDGER_KEY, ledgerSessions);
  alert(`¡Sesión "${snap.name}" guardada en el Libro Contable!`);
};

window.toggleLedgerPay = (sIdx, pIdx) => {
  ledgerSessions[sIdx].players[pIdx].paid = !ledgerSessions[sIdx].players[pIdx].paid;
  saveState(LEDGER_KEY, ledgerSessions);
  renderLedgerView(ledgerSessions);
};

window.deleteLedgerSession = (sIdx) => {
  if (!confirm("¿Eliminar esta partida del historial?")) return;
  ledgerSessions.splice(sIdx, 1);
  saveState(LEDGER_KEY, ledgerSessions);
  renderLedgerView(ledgerSessions);
};

window.printLedgerSession = (sIdx) => {
  const session = ledgerSessions[sIdx];
  if (session) exportPDFDocument(session);
};

window.exportCurrentPDF = () => {
  const currentSnap = buildCurrentSessionSnapshot();
  exportPDFDocument(currentSnap);
};

window.copyDiscordMarkdown = () => {
  const currentSnap = buildCurrentSessionSnapshot();
  const t = currentSnap.totals;

  let md = `📦 **REPARTO DE BOTÍN: ${currentSnap.name.toUpperCase()}** (${currentSnap.date})\n`;
  md += `💰 **Botín Bruto (${currentSnap.chestsSummary.length} cofres):** \`${formatSilver(t.grossLoot)} Silver\`\n`;
  md += `🏷️ **Impuesto de Mercado Total:** \`${formatSilver(t.marketTax)} Silver\`\n`;
  md += `🛠️ **Reparaciones Totales:** \`${formatSilver(t.repairs)} Silver\`\n`;
  md += `⚖️ **Corte Base:** \`${formatSilver(t.baseSplit)} Silver / persona\`\n\n`;
  
  md += `**Desglose de Cofres:**\n`;
  currentSnap.chestsSummary.forEach(c => {
    md += `* **${c.name}**: ${formatSilver(c.loot)} (Tax: ${c.marketTax}% | Rep: ${formatSilver(c.repairs)} por ${c.sellerName}) -> **Neto: ${formatSilver(c.net)}**\n`;
  });

  md += `\n**Desglose de Pagos:**\n\`\`\`diff\n`;
  currentSnap.players.forEach(p => {
    if (p.balance > 0) {
      md += `+ ${p.name.padEnd(16)}: Recibe ${formatSilver(p.balance)} (Base: ${formatSilver(t.baseSplit)} | Re-gear: +${formatSilver(p.regear)} | Rep: +${formatSilver(p.refundRepairs)} | Buyout: -${formatSilver(p.buyout)})\n`;
    } else if (p.balance < 0) {
      md += `- ${p.name.padEnd(16)}: DEBE ${formatSilver(Math.abs(p.balance))} (Buyout: -${formatSilver(p.buyout)})\n`;
    } else {
      md += `  ${p.name.padEnd(16)}: Saldado (0)\n`;
    }
  });
  md += `\`\`\``;

  navigator.clipboard.writeText(md).then(() => {
    alert("Reporte copiado para Discord.");
  }).catch(() => {
    alert("Error al copiar portapapeles.");
  });
};

// Actualiza switchTab para manejar la pestaña 3
window.switchTab = (tabId) => {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  
  if (tabId === 'tab-calc') {
    document.getElementById('tab-btn-calc').classList.add('active');
    document.getElementById('tab-calc').classList.add('active');
  } else if (tabId === 'tab-ledger') {
    document.getElementById('tab-btn-ledger').classList.add('active');
    document.getElementById('tab-ledger').classList.add('active');
    renderLedgerView(ledgerSessions);
  } else if (tabId === 'tab-cities') {
    document.getElementById('tab-btn-cities').classList.add('active');
    document.getElementById('tab-cities').classList.add('active');
    renderCityBonuses(currentCityFilter, document.getElementById('city-search')?.value || "");
  }
};

window.setCityFilter = (city, btnEl) => {
  currentCityFilter = city;
  document.querySelectorAll('.city-filter-bar button').forEach(b => b.classList.remove('active-city'));
  if (btnEl) btnEl.classList.add('active-city');
  renderCityBonuses(currentCityFilter, document.getElementById('city-search')?.value || "");
};

window.filterCityBonuses = () => {
  const query = document.getElementById('city-search')?.value || "";
  renderCityBonuses(currentCityFilter, query);
};

// Arrancar App
init();