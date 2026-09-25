/**
 * VI VE RE - Shop Page JavaScript (shop.js)
 * Handles: Product catalog, filtering, sorting, pagination, and view toggle
 */

// Extended Product Catalog for Shop Page
// Extended Product Catalog for Shop Page with real luxury photography
const DEFAULT_SHOP_PRODUCTS = [
  {
    id: 1, name: "Papasan Bowl Chair", category: "armchairs",
    price: 3750000, oldPrice: 4800000, badge: "SALE", badgeType: "badge-sale",
    image: "asset/chair_papasan.jpg",
    rating: 4.8, reviews: 124, swatches: ["#B8977E", "#5A4E45", "#E4DDD3"], shape: "bowl"
  },
  {
    id: 2, name: "Classic Dining Chair", category: "chairs",
    price: 1500000, oldPrice: null, badge: null, badgeType: null,
    image: "asset/chair_dining.jpg",
    rating: 4.2, reviews: 87, swatches: ["#C5A880", "#2C2B29", "#8C6642"], shape: "chair"
  },
  {
    id: 3, name: "Classic Armchair", category: "armchairs",
    price: 2700000, oldPrice: null, badge: null, badgeType: null,
    image: "asset/chair_armchair.jpg",
    rating: 4.5, reviews: 63, swatches: ["#FFFFFF", "#8C7862", "#4A4742"], shape: "armchair"
  },
  {
    id: 4, name: "Bar Stool Scandinavian", category: "chairs",
    price: 3750000, oldPrice: null, badge: null, badgeType: null,
    image: "asset/chair_barstool.jpg",
    rating: 4.3, reviews: 51, swatches: ["#998D80", "#2D2B29"], shape: "stool"
  },
  {
    id: 5, name: "Wooden Night Stand", category: "tables",
    price: 2100000, oldPrice: 2600000, badge: "SALE", badgeType: "badge-sale",
    image: "asset/table_nightstand.jpg",
    rating: 4.1, reviews: 39, swatches: ["#BF9B7B", "#5C4A3A"], shape: "stand"
  },
  {
    id: 6, name: "White Minimalist Desk", category: "tables",
    price: 4800000, oldPrice: null, badge: "NEW", badgeType: "badge-new",
    image: "asset/table_desk.jpg",
    rating: 4.7, reviews: 28, swatches: ["#FFFFFF", "#D3C7B5"], shape: "table"
  },
  {
    id: 7, name: "Egg Lounge Chair", category: "armchairs",
    price: 6750000, oldPrice: 7900000, badge: "HOT", badgeType: "badge-hot",
    image: "asset/chair_egg.jpg",
    rating: 4.9, reviews: 210, swatches: ["#F0EDE6", "#33312E", "#A67C52"], shape: "egg"
  },
  {
    id: 8, name: "Minimalist Fabric Sofa", category: "sofas",
    price: 8700000, oldPrice: 9750000, badge: "SALE", badgeType: "badge-sale",
    image: "asset/sofa_fabric.jpg",
    rating: 4.6, reviews: 95, swatches: ["#828387", "#3B424C", "#D2C9BF"], shape: "sofa"
  },
  {
    id: 9, name: "Rattan Lounge Chair", category: "armchairs",
    price: 2900000, oldPrice: null, badge: "NEW", badgeType: "badge-new",
    image: "asset/chair_papasan.jpg",
    rating: 4.4, reviews: 42, swatches: ["#C9A87A", "#8B6F4E"], shape: "bowl"
  },
  {
    id: 10, name: "L-Shape Corner Sofa", category: "sofas",
    price: 14700000, oldPrice: 18000000, badge: "SALE", badgeType: "badge-sale",
    image: "asset/sofa_lshape.jpg",
    rating: 4.7, reviews: 77, swatches: ["#C2B8A8", "#3A3835", "#A67C52"], shape: "sofa"
  },
  {
    id: 11, name: "Velvet Accent Chair", category: "armchairs",
    price: 4100000, oldPrice: null, badge: null, badgeType: null,
    image: "asset/chair_armchair.jpg",
    rating: 4.3, reviews: 55, swatches: ["#5C4B7D", "#2C2B29", "#C9A0A0"], shape: "armchair"
  },
  {
    id: 12, name: "Minimalist Study Chair", category: "chairs",
    price: 2200000, oldPrice: null, badge: null, badgeType: null,
    image: "asset/chair_dining.jpg",
    rating: 4.0, reviews: 31, swatches: ["#FFFFFF", "#B0A99A"], shape: "chair"
  },
  {
    id: 13, name: "Solid Oak Dining Table", category: "tables",
    price: 8400000, oldPrice: 10200000, badge: "SALE", badgeType: "badge-sale",
    image: "asset/table_dining.jpg",
    rating: 4.8, reviews: 113, swatches: ["#C49A6C", "#7A5C3A"], shape: "table"
  },
  {
    id: 14, name: "2-Seater Linen Sofa", category: "sofas",
    price: 6300000, oldPrice: null, badge: null, badgeType: null,
    image: "asset/sofa_fabric.jpg",
    rating: 4.5, reviews: 68, swatches: ["#D3C4B0", "#8C7862", "#4A4742"], shape: "sofa"
  },
  {
    id: 15, name: "Wicker Storage Cabinet", category: "decor",
    price: 3450000, oldPrice: null, badge: "NEW", badgeType: "badge-new",
    image: "asset/table_nightstand.jpg",
    rating: 4.2, reviews: 22, swatches: ["#C9A87A", "#7D6145"], shape: "stand"
  },
  {
    id: 16, name: "Nordic Floor Lamp Decor", category: "decor",
    price: 1320000, oldPrice: 1650000, badge: "SALE", badgeType: "badge-sale",
    image: "asset/table_desk.jpg",
    rating: 4.4, reviews: 60, swatches: ["#FFFFFF", "#C5A880", "#1A1A1A"], shape: "table"
  }
];

function getShopProducts() {
  try {
    const raw = localStorage.getItem('vivere_admin_products');
    if (raw) {
      const adminProds = JSON.parse(raw);
      if (Array.isArray(adminProds) && adminProds.length > 0) {
        // Merge with additional shop catalog items
        const merged = [...adminProds];
        DEFAULT_SHOP_PRODUCTS.forEach(item => {
          if (!merged.some(m => m.id === item.id)) {
            merged.push(item);
          }
        });
        return merged;
      }
    }
  } catch (e) {}
  return DEFAULT_SHOP_PRODUCTS;
}

let SHOP_PRODUCTS = getShopProducts();

const ITEMS_PER_PAGE = 9;

// ========= State =========
let shopState = {
  category: 'all',
  maxPrice: 25000000,
  minRating: 0,
  badges: [],
  sort: 'default',
  page: 1,
  viewMode: 'grid',
  searchQuery: ''
};

// ========= Helpers =========
function formatCurrency(val) {
  return 'Rp ' + val.toLocaleString('id-ID');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    '<span class="star filled">★</span>'.repeat(full) +
    (half ? '<span class="star filled" style="opacity:0.5">★</span>' : '') +
    '<span class="star">★</span>'.repeat(empty)
  );
}

function getProductSvg(shape) {
  const svgs = {
    bowl: `<svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
      <circle cx="50" cy="40" r="28" fill="#EDE4D6" stroke-width="2"/><path d="M26 48 Q50 72 74 48" stroke-width="3.5"/>
      <path d="M34 68 L28 88" stroke-width="3"/><path d="M66 68 L72 88" stroke-width="3"/>
      <ellipse cx="50" cy="86" rx="22" ry="4" stroke-width="2"/></svg>`,
    chair: `<svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
      <path d="M32 20 Q50 14 68 20 L66 52 Q50 56 34 52 Z" fill="#E6DCCF"/>
      <line x1="36" y1="52" x2="30" y2="88" stroke-width="3.5"/><line x1="64" y1="52" x2="70" y2="88" stroke-width="3.5"/>
      <line x1="34" y1="72" x2="66" y2="72" stroke-width="2"/></svg>`,
    armchair: `<svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
      <rect x="25" y="32" width="50" height="38" rx="8" fill="#E8DEC8"/>
      <rect x="33" y="40" width="34" height="24" rx="4" fill="#F4EFE6"/>
      <line x1="28" y1="70" x2="24" y2="88" stroke-width="3.5"/><line x1="72" y1="70" x2="76" y2="88" stroke-width="3.5"/></svg>`,
    stool: `<svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
      <rect x="36" y="20" width="28" height="22" rx="4" fill="#D3C7B5"/>
      <path d="M32 42 L24 88" stroke-width="3.5"/><path d="M68 42 L76 88" stroke-width="3.5"/>
      <path d="M28 68 L72 68" stroke-width="2"/></svg>`,
    stand: `<svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
      <rect x="30" y="30" width="40" height="36" rx="4" fill="#D8CEBD"/>
      <line x1="30" y1="48" x2="70" y2="48" stroke-width="2"/>
      <circle cx="50" cy="39" r="2" fill="currentColor"/><circle cx="50" cy="57" r="2" fill="currentColor"/>
      <line x1="34" y1="66" x2="30" y2="88" stroke-width="3"/><line x1="66" y1="66" x2="70" y2="88" stroke-width="3"/></svg>`,
    table: `<svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
      <rect x="18" y="40" width="64" height="12" rx="2" fill="#E8DEC8"/>
      <line x1="26" y1="52" x2="20" y2="88" stroke-width="3.5"/><line x1="74" y1="52" x2="80" y2="88" stroke-width="3.5"/>
      <line x1="28" y1="46" x2="48" y2="46" stroke-width="2"/><line x1="52" y1="46" x2="72" y2="46" stroke-width="2"/></svg>`,
    egg: `<svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
      <ellipse cx="50" cy="42" rx="26" ry="32" fill="#EAE5DB"/>
      <path d="M34 50 Q50 62 66 50" stroke-width="2.5"/>
      <line x1="50" y1="74" x2="50" y2="85" stroke-width="4"/>
      <line x1="35" y1="85" x2="65" y2="85" stroke-width="3.5"/></svg>`,
    sofa: `<svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
      <rect x="18" y="42" width="64" height="26" rx="4" fill="#D3C7B5"/>
      <rect x="28" y="28" width="44" height="20" rx="3" fill="#E5D9C7"/>
      <line x1="24" y1="68" x2="20" y2="86" stroke-width="3.5"/><line x1="76" y1="68" x2="80" y2="86" stroke-width="3.5"/></svg>`
  };
  return svgs[shape] || svgs.chair;
}

// ========= Filter & Sort =========
function getFilteredProducts() {
  let products = [...SHOP_PRODUCTS];

  if (shopState.category !== 'all') {
    products = products.filter(p => p.category === shopState.category);
  }
  if (shopState.maxPrice < 25000000) {
    products = products.filter(p => p.price <= shopState.maxPrice);
  }
  if (shopState.minRating > 0) {
    products = products.filter(p => p.rating >= shopState.minRating);
  }
  if (shopState.badges.length > 0) {
    products = products.filter(p => p.badge && shopState.badges.includes(p.badge));
  }
  if (shopState.searchQuery) {
    const q = shopState.searchQuery.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }

  // Sort
  switch (shopState.sort) {
    case 'price-asc': products.sort((a, b) => a.price - b.price); break;
    case 'price-desc': products.sort((a, b) => b.price - a.price); break;
    case 'name-asc': products.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'name-desc': products.sort((a, b) => b.name.localeCompare(a.name)); break;
    default: break;
  }

  return products;
}

// ========= Render =========
function renderShopProducts() {
  const grid = document.getElementById('shopProductsGrid');
  const resultCount = document.getElementById('shopResultCount');
  if (!grid) return;

  // Show skeleton first
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w40"></div>
        <div class="skeleton-line w80"></div>
        <div class="skeleton-line w60"></div>
      </div>
    </div>
  `).join('');

  setTimeout(() => {
    const all = getFilteredProducts();
    const totalPages = Math.ceil(all.length / ITEMS_PER_PAGE);
    if (shopState.page > totalPages) shopState.page = Math.max(1, totalPages);
    const start = (shopState.page - 1) * ITEMS_PER_PAGE;
    const paged = all.slice(start, start + ITEMS_PER_PAGE);

    if (resultCount) resultCount.textContent = all.length;

    if (paged.length === 0) {
      grid.innerHTML = `
        <div class="shop-empty-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p style="font-size:1.05rem; font-weight:700; margin-bottom:6px;">Produk Tidak Ditemukan</p>
          <p>Coba ubah filter atau pilih kategori yang berbeda.</p>
        </div>`;
      renderPagination(0, 0);
      return;
    }

    SHOP_PRODUCTS = getShopProducts();

    grid.innerHTML = paged.map(p => {
      let discountPct = null;
      if (p.oldPrice && p.oldPrice > p.price) {
        discountPct = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
      }

      let badgeHtml = '';
      if (discountPct) {
        badgeHtml = `<span class="product-badge badge-sale">-${discountPct}%</span>`;
      } else if (p.badge && p.badge !== 'NONE') {
        const bClass = p.badge.toLowerCase().includes('sale') ? 'badge-sale' : p.badge.toLowerCase().includes('hot') ? 'badge-hot' : 'badge-new';
        badgeHtml = `<span class="product-badge ${bClass}">${p.badge}</span>`;
      }

      const swatches = p.swatches || ["#B8977E", "#2C2B29"];

      return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-thumb">
            ${badgeHtml}
            <button class="quick-wishlist" onclick="toggleWishlist(${p.id})" aria-label="Wishlist">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            ${p.image ? `
              <img src="${p.image}" alt="${p.name}" class="product-thumb-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">
                ${getProductSvg(p.shape || 'chair')}
              </div>
            ` : getProductSvg(p.shape || 'chair')}
          </div>
          <div class="product-details">
            <span class="product-cat">${p.category}</span>
            <h3 class="product-title">${p.name}</h3>
            <div class="swatches-row">
              ${swatches.map(c => `<span class="swatch-dot" style="background:${c}"></span>`).join('')}
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <div style="display:flex;">${renderStars(p.rating || 4.5)}</div>
              <span style="font-size:0.75rem;color:var(--text-muted);">${p.rating || 4.5} (${p.reviews || 40})</span>
            </div>
            <div class="price-row">
              <div class="product-price">
                ${formatCurrency(p.price)}
                ${p.oldPrice ? `<span class="old-price">${formatCurrency(p.oldPrice)}</span>` : ''}
              </div>
              <button class="btn-add-cart" onclick="addToCart(${p.id})" aria-label="Add to cart">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    renderPagination(all.length, totalPages);
    updateActiveFiltersUI();
    updateMobileFilterBadge();
  }, 300);
}

function renderPagination(total, totalPages) {
  const nums = document.getElementById('pageNumbers');
  const prev = document.getElementById('prevPageBtn');
  const next = document.getElementById('nextPageBtn');
  if (!nums) return;

  prev.disabled = shopState.page <= 1;
  next.disabled = shopState.page >= totalPages;

  nums.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-num' + (i === shopState.page ? ' active' : '');
    btn.textContent = i;
    btn.addEventListener('click', () => {
      shopState.page = i;
      renderShopProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    nums.appendChild(btn);
  }
}

// ========= Active Filter Tags UI =========
function updateActiveFiltersUI() {
  const row = document.getElementById('activeFiltersRow');
  const tagsEl = document.getElementById('activeFilterTags');
  if (!row || !tagsEl) return;

  const tags = [];
  if (shopState.category !== 'all') {
    tags.push({ label: shopState.category, key: 'category' });
  }
  if (shopState.maxPrice < 25000000) {
    tags.push({ label: `Max ${formatCurrency(shopState.maxPrice)}`, key: 'price' });
  }
  if (shopState.minRating > 0) {
    tags.push({ label: `${shopState.minRating}★ ke atas`, key: 'rating' });
  }
  shopState.badges.forEach(b => {
    tags.push({ label: b, key: 'badge_' + b });
  });

  if (tags.length === 0) {
    row.style.display = 'none';
    return;
  }
  row.style.display = 'flex';
  tagsEl.innerHTML = tags.map(t => `
    <span class="af-tag">
      ${t.label}
      <span class="af-remove" data-key="${t.key}" title="Hapus filter">×</span>
    </span>
  `).join('');

  tagsEl.querySelectorAll('.af-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      if (key === 'category') { shopState.category = 'all'; document.querySelector('input[name="category"][value="all"]').checked = true; }
      if (key === 'price') { shopState.maxPrice = 25000000; document.getElementById('priceSlider').value = 25000000; updatePriceDisplay(25000000); }
      if (key === 'rating') { shopState.minRating = 0; document.getElementById('ratAll').checked = true; }
      if (key.startsWith('badge_')) {
        const b = key.replace('badge_', '');
        shopState.badges = shopState.badges.filter(x => x !== b);
        const el = [...document.querySelectorAll('.badge-filter-list input')].find(i => i.value === b);
        if (el) el.checked = false;
      }
      shopState.page = 1;
      renderShopProducts();
    });
  });
}

function updateMobileFilterBadge() {
  const badge = document.getElementById('mobileFilterBadge');
  if (!badge) return;
  let count = 0;
  if (shopState.category !== 'all') count++;
  if (shopState.maxPrice < 25000000) count++;
  if (shopState.minRating > 0) count++;
  count += shopState.badges.length;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function updatePriceDisplay(val) {
  const max = document.getElementById('priceMaxDisplay');
  const min = document.getElementById('priceMinDisplay');
  if (max) max.textContent = val >= 25000000 ? 'Rp 25.000.000+' : formatCurrency(val);
  if (min) min.textContent = 'Rp 0';

  const slider = document.getElementById('priceSlider');
  if (slider) {
    const pct = (val / 25000000) * 100;
    slider.style.background = `linear-gradient(to right, var(--primary) ${pct}%, #E5E1D8 ${pct}%)`;
  }
}

// ========= Read URL params (for category linking) =========
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat) {
    shopState.category = cat;
    const radio = document.querySelector(`input[name="category"][value="${cat}"]`);
    if (radio) radio.checked = true;
  }
}

// ========= Init =========
document.addEventListener('DOMContentLoaded', () => {
  readUrlParams();

  // Initial render
  renderShopProducts();

  // Price slider
  const priceSlider = document.getElementById('priceSlider');
  if (priceSlider) {
    updatePriceDisplay(25000000);
    priceSlider.addEventListener('input', () => {
      updatePriceDisplay(parseInt(priceSlider.value));
    });
  }

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      shopState.sort = sortSelect.value;
      shopState.page = 1;
      renderShopProducts();
    });
  }

  // Apply filters button
  const applyBtn = document.getElementById('applyFiltersBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      // Category
      const catRadio = document.querySelector('input[name="category"]:checked');
      if (catRadio) shopState.category = catRadio.value;

      // Price
      if (priceSlider) shopState.maxPrice = parseInt(priceSlider.value);

      // Rating
      const ratRadio = document.querySelector('input[name="rating"]:checked');
      if (ratRadio) shopState.minRating = parseFloat(ratRadio.value);

      // Badges
      shopState.badges = [];
      document.querySelectorAll('.badge-filter-list input:checked').forEach(el => {
        shopState.badges.push(el.value);
      });

      shopState.page = 1;
      renderShopProducts();

      // Close mobile sidebar
      const sidebar = document.getElementById('shopSidebar');
      if (sidebar) sidebar.classList.remove('open');
    });
  }

  // Reset / Clear all
  const clearBtn = document.getElementById('clearAllFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      shopState.category = 'all';
      shopState.maxPrice = 25000000;
      shopState.minRating = 0;
      shopState.badges = [];
      shopState.page = 1;

      document.querySelector('input[name="category"][value="all"]').checked = true;
      document.getElementById('ratAll').checked = true;
      if (priceSlider) { priceSlider.value = 25000000; updatePriceDisplay(25000000); }
      document.querySelectorAll('.badge-filter-list input').forEach(el => el.checked = false);

      renderShopProducts();
    });
  }

  // Grid / List view
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const grid = document.getElementById('shopProductsGrid');

  if (gridBtn) {
    gridBtn.addEventListener('click', () => {
      shopState.viewMode = 'grid';
      grid.classList.remove('list-view');
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
    });
  }
  if (listBtn) {
    listBtn.addEventListener('click', () => {
      shopState.viewMode = 'list';
      grid.classList.add('list-view');
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
    });
  }

  // Pagination arrows
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (shopState.page > 1) { shopState.page--; renderShopProducts(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const total = getFilteredProducts().length;
    if (shopState.page < Math.ceil(total / ITEMS_PER_PAGE)) {
      shopState.page++;
      renderShopProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Mobile Filter Toggle
  const mobileToggle = document.getElementById('mobileFilterToggle');
  const sidebar = document.getElementById('shopSidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Top search bar
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchSubmitBtn');
  const catSelect = document.getElementById('searchCategorySelect');

  function doTopSearch() {
    if (searchInput) shopState.searchQuery = searchInput.value.trim();
    if (catSelect && catSelect.value !== 'all') shopState.category = catSelect.value;
    shopState.page = 1;
    renderShopProducts();
  }

  if (searchBtn) searchBtn.addEventListener('click', doTopSearch);
  if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doTopSearch(); });

  // Cart open/close
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  const checkoutBtn = document.getElementById('checkoutBtn');

  function openDrawer() {
    if (cartDrawer && cartBackdrop) {
      cartDrawer.classList.add('open');
      cartBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeDrawer() {
    if (cartDrawer && cartBackdrop) {
      cartDrawer.classList.remove('open');
      cartBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openCartBtn) openCartBtn.addEventListener('click', openDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeDrawer);
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!cart || cart.length === 0) return;
      closeDrawer();
      if (window.VivereTransaction && typeof window.VivereTransaction.openCheckout === 'function') {
        window.VivereTransaction.openCheckout(cart);
      }
    });
  }

  // Sync cart UI from app.js
  updateCartUI();
});

// Extend SHOP_PRODUCTS into PRODUCTS array used by app.js
// so addToCart still works on shop page
if (typeof PRODUCTS === 'undefined') {
  window.PRODUCTS = SHOP_PRODUCTS;
} else {
  SHOP_PRODUCTS.forEach(p => {
    if (!PRODUCTS.find(x => x.id === p.id)) PRODUCTS.push(p);
  });
}
