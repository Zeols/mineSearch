const DOM = {
    itemForm: document.getElementById('itemSearchForm'),
    itemInput: document.getElementById('itemInput'),
    itemBtn: document.getElementById('itemSearchBtn'),
    itemClearBtn: document.getElementById('itemClearBtn'),
    itemResult: document.getElementById('itemResult'),

    playerForm: document.getElementById('playerSearchForm'),
    playerInput: document.getElementById('playerInput'),
    playerBtn: document.getElementById('playerSearchBtn'),
    playerClearBtn: document.getElementById('playerClearBtn'),
    playerResult: document.getElementById('playerResult')
};

let itemsCache = null;

const ITEMS_API_PRIMARY = 'https://minecraft-api.vercel.app/api/items';
const ITEMS_API_FALLBACK = 'https://raw.githubusercontent.com/anish-shanbhag/minecraft-api/master/data/items.json';
const ITEMS_IMAGE_BASE = 'https://raw.githubusercontent.com/anish-shanbhag/minecraft-api/master/public/images/items/';

async function fetchItemsList() {
    if (itemsCache) {
        return itemsCache;
    }

    try {
        const response = await fetch(ITEMS_API_PRIMARY);
        if (response.ok) {
            itemsCache = await response.json();
            return itemsCache;
        }
    } catch {
        // Fallback to static repository endpoint if primary service is unavailable
    }

    const fallbackResponse = await fetch(ITEMS_API_FALLBACK);
    if (!fallbackResponse.ok) {
        throw new Error('No fue posible cargar el catálogo de ítems.');
    }

    itemsCache = await fallbackResponse.json();
    return itemsCache;
}

function getItemImageUrl(item) {
    if (item.image && !item.image.includes('minecraft-api.vercel.app')) {
        return item.image;
    }
    return `${ITEMS_IMAGE_BASE}${item.namespacedId}.png`;
}

function renderItemLoading() {
    DOM.itemResult.innerHTML = `
        <div class="state-box">
            <div class="spinner item-spinner"></div>
            <div class="state-title">Buscando ítem...</div>
            <p class="state-message">Consultando el catálogo de Minecraft</p>
        </div>
    `;
}

function renderItemError(message) {
    DOM.itemResult.innerHTML = `
        <div class="state-box error-state">
            <div class="state-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            </div>
            <div class="state-title">Ítem no encontrado</div>
            <p class="state-message">${message}</p>
        </div>
    `;
}

function renderItemCard(item) {
    const imageUrl = getItemImageUrl(item);
    const fallbackUrl = `${ITEMS_IMAGE_BASE}${item.namespacedId}.png`;
    const description = item.description || 'Sin descripción disponible para este objeto en el registro.';
    const stackSize = item.stackSize || 64;
    const renewableText = typeof item.renewable === 'boolean' ? (item.renewable ? 'Sí' : 'No') : 'Desconocido';

    DOM.itemResult.innerHTML = `
        <article class="result-card item-card">
            <div class="card-image-box">
                <img 
                    src="${imageUrl}" 
                    alt="${item.name}" 
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${fallbackUrl}';"
                >
            </div>
            <h3 class="card-title">${item.name}</h3>
            <span class="card-tag item-tag">Bloque / Objeto</span>
            <p class="card-description">${description}</p>
            <div class="card-details-grid">
                <div class="detail-row">
                    <span class="detail-label">ID Técnico:</span>
                    <span class="detail-value" title="${item.namespacedId}">${item.namespacedId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Stack Máximo:</span>
                    <span class="detail-value">${stackSize}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Renovable:</span>
                    <span class="detail-value">${renewableText}</span>
                </div>
            </div>
        </article>
    `;
}

async function buscarItem(query) {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return;

    renderItemLoading();

    try {
        const items = await fetchItemsList();
        const found = items.find(item => {
            const nameMatch = item.name && item.name.toLowerCase() === cleanQuery;
            const idMatch = item.namespacedId && item.namespacedId.toLowerCase() === cleanQuery;
            return nameMatch || idMatch;
        }) || items.find(item => {
            const partialName = item.name && item.name.toLowerCase().includes(cleanQuery);
            const partialId = item.namespacedId && item.namespacedId.toLowerCase().includes(cleanQuery);
            return partialName || partialId;
        });

        if (found) {
            renderItemCard(found);
        } else {
            renderItemError(`No se encontraron resultados para "${query}". Intenta con términos como 'Diamond Sword', 'TNT' o 'Apple'.`);
        }
    } catch {
        renderItemError('Error al conectar con la base de datos de ítems. Por favor, reintenta en unos instantes.');
    }
}

function renderPlayerLoading() {
    DOM.playerResult.innerHTML = `
        <div class="state-box">
            <div class="spinner player-spinner"></div>
            <div class="state-title">Buscando jugador...</div>
            <p class="state-message">Consultando servidores de Mojang</p>
        </div>
    `;
}

function renderPlayerError(message) {
    DOM.playerResult.innerHTML = `
        <div class="state-box error-state">
            <div class="state-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            </div>
            <div class="state-title">Jugador no encontrado</div>
            <p class="state-message">${message}</p>
        </div>
    `;
}

function renderPlayerCard(player) {
    const bodyRenderUrl = `https://mc-heads.net/body/${player.id}/right`;
    const avatarUrl = player.avatar || `https://mc-heads.net/avatar/${player.id}`;

    DOM.playerResult.innerHTML = `
        <article class="result-card player-card">
            <div class="card-image-box">
                <img 
                    src="${bodyRenderUrl}" 
                    alt="Skin de ${player.username}" 
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${avatarUrl}';"
                >
            </div>
            <h3 class="card-title">${player.username}</h3>
            <span class="card-tag player-tag">Cuenta Oficial Mojang</span>
            <p class="card-description">Perfil verificado en la red de Minecraft Java Edition con skin activa y UUID persistente.</p>
            <div class="card-details-grid">
                <div class="detail-row">
                    <span class="detail-label">UUID:</span>
                    <span class="detail-value" title="${player.id}">${player.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ID Corto:</span>
                    <span class="detail-value" title="${player.raw_id}">${player.raw_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value">Activo / Verificado</span>
                </div>
            </div>
        </article>
    `;
}

async function buscarJugador(username) {
    const cleanUsername = username.trim();
    if (!cleanUsername) return;

    renderPlayerLoading();

    try {
        const endpoint = `https://playerdb.co/api/player/minecraft/${encodeURIComponent(cleanUsername)}`;
        const response = await fetch(endpoint);
        const data = await response.json();

        if (response.ok && data.code === 'player.found' && data.data && data.data.player) {
            renderPlayerCard(data.data.player);
        } else {
            renderPlayerError(`No existe una cuenta activa de Minecraft registrada con el nombre "${cleanUsername}".`);
        }
    } catch {
        renderPlayerError('No fue posible contactar con el servicio de PlayerDB. Verifica tu conexión.');
    }
}

function setupEventListeners() {
    DOM.itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        buscarItem(DOM.itemInput.value);
    });

    DOM.itemInput.addEventListener('input', () => {
        DOM.itemClearBtn.hidden = !DOM.itemInput.value;
    });

    DOM.itemClearBtn.addEventListener('click', () => {
        DOM.itemInput.value = '';
        DOM.itemClearBtn.hidden = true;
        DOM.itemInput.focus();
    });

    DOM.playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        buscarJugador(DOM.playerInput.value);
    });

    DOM.playerInput.addEventListener('input', () => {
        DOM.playerClearBtn.hidden = !DOM.playerInput.value;
    });

    DOM.playerClearBtn.addEventListener('click', () => {
        DOM.playerInput.value = '';
        DOM.playerClearBtn.hidden = true;
        DOM.playerInput.focus();
    });
}

function initDefaultSearch() {
    const defaultItem = 'Diamond Pickaxe';
    const defaultPlayer = 'Notch';

    DOM.itemInput.value = defaultItem;
    DOM.itemClearBtn.hidden = false;
    buscarItem(defaultItem);

    DOM.playerInput.value = defaultPlayer;
    DOM.playerClearBtn.hidden = false;
    buscarJugador(defaultPlayer);
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initDefaultSearch();
});
