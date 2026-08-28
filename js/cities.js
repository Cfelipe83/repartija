export const ALBION_CITIES_DATA = [
  {
    name: "Martlock",
    color: "#4f8ff7",
    refining: "Pieles / Cuero (Hide -> Leather)",
    crafting: [
      "Hachas (Axes)",
      "Zapatos de Cuero (Leather Shoes)",
      "Bastones de Hielo (Frost Staffs)",
      "Zapatos de Placa (Plate Shoes)",
      "Tomos / Libros (Off-hands Mágicos)"
    ],
    rrrBase: "24.8% (Especialidad) / 15.2% (General)",
    rrrFocus: "47.9% (Especialidad) / 43.5% (General)"
  },
  {
    name: "Bridgewatch",
    color: "#f59e0b",
    refining: "Roca / Bloques de Piedra (Rock -> Stone Blocks)",
    crafting: [
      "Ballestas (Crossbows)",
      "Chaquetas de Cuero (Leather Armor)",
      "Varas (Quarterstaffs)",
      "Armaduras de Placa (Plate Armor)",
      "Zapatos de Tela (Cloth Shoes)"
    ],
    rrrBase: "24.8% (Especialidad) / 15.2% (General)",
    rrrFocus: "47.9% (Especialidad) / 43.5% (General)"
  },
  {
    name: "Lymhurst",
    color: "#10b981",
    refining: "Fibra / Telas (Fiber -> Cloth)",
    crafting: [
      "Espadas (Swords)",
      "Arcos (Bows)",
      "Cascos de Cuero (Leather Hoods)",
      "Bastones Sagrados (Holy Staffs)",
      "Cascos de Placa (Plate Helmets)"
    ],
    rrrBase: "24.8% (Especialidad) / 15.2% (General)",
    rrrFocus: "47.9% (Especialidad) / 43.5% (General)"
  },
  {
    name: "Fort Sterling",
    color: "#e2e8f0",
    refining: "Madera / Tablones (Wood -> Planks)",
    crafting: [
      "Martillos (Hammers)",
      "Lanzas (Spears)",
      "Túnicas de Tela (Cloth Robes)",
      "Bastones de Fuego (Fire Staffs)",
      "Cascos de Tela (Cloth Cowls)"
    ],
    rrrBase: "24.8% (Especialidad) / 15.2% (General)",
    rrrFocus: "47.9% (Especialidad) / 43.5% (General)"
  },
  {
    name: "Thetford",
    color: "#a855f7",
    refining: "Mineral / Barras de Metal (Ore -> Metal Bars)",
    crafting: [
      "Mazas (Maces)",
      "Bastones de Naturaleza (Nature Staffs)",
      "Bastones Malditos (Cursed Staffs)",
      "Armaduras de Tela (Cloth Armor)",
      "Escudos y Antorchas (Off-hands Guerreros/Cazadores)"
    ],
    rrrBase: "24.8% (Especialidad) / 15.2% (General)",
    rrrFocus: "47.9% (Especialidad) / 43.5% (General)"
  },
  {
    name: "Caerleon",
    color: "#ef4444",
    refining: "Sin bonos de refinado de materias primas",
    crafting: [
      "Dagas (Daggers)",
      "Armas Arcanas (Arcane Staffs)",
      "Guantes de Guerra (War Gloves)",
      "Armaduras de Reunión / Gathering Gear",
      "Comida y Pociones (Consumibles)"
    ],
    rrrBase: "24.8% (Crafteo Caerleon) / 15.2% (Otros)",
    rrrFocus: "47.9% (Crafteo Caerleon) / 43.5% (Otros)"
  },
  {
    name: "Brecilien",
    color: "#2dd4bf",
    refining: "Sin bonos de refinado",
    crafting: [
      "Capas (Capes)",
      "Bolsos (Bags)",
      "Piedras Feéricas (Fey Stones)",
      "Herramientas de Recolección (Tools)"
    ],
    rrrBase: "24.8% (Capas / Bolsos) / 15.2% (General)",
    rrrFocus: "47.9% (Capas / Bolsos) / 43.5% (General)"
  }
];

export function renderCityBonuses(filterCity = "all", searchQuery = "") {
  const tbody = document.getElementById('city-bonus-rows');
  if (!tbody) return;
  tbody.innerHTML = "";

  const query = searchQuery.trim().toLowerCase();

  const filtered = ALBION_CITIES_DATA.filter(city => {
    const matchesCity = filterCity === "all" || city.name.toLowerCase() === filterCity.toLowerCase();
    
    if (!matchesCity) return false;
    if (!query) return true;

    const inName = city.name.toLowerCase().includes(query);
    const inRefining = city.refining.toLowerCase().includes(query);
    const inCrafting = city.crafting.some(c => c.toLowerCase().includes(query));

    return inName || inRefining || inCrafting;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No se encontraron resultados para la búsqueda.</td></tr>`;
    return;
  }

  filtered.forEach(city => {
    const tr = document.createElement('tr');
    
    const craftingList = city.crafting.map(item => `<li style="margin-left: 16px; font-size: 0.82rem; color: var(--text-main);">${item}</li>`).join('');

    tr.innerHTML = `
      <td>
        <strong style="color: ${city.color}; font-size: 0.98rem;">${city.name}</strong>
      </td>
      <td>
        <span style="font-weight: 600; color: var(--success);">${city.refining}</span>
      </td>
      <td>
        <ul style="padding-left: 4px; margin: 0;">
          ${craftingList}
        </ul>
      </td>
      <td>
        <span class="status-badge status-receive">${city.rrrBase}</span>
      </td>
      <td>
        <span class="status-badge status-zero">${city.rrrFocus}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}