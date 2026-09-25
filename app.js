/**
 * Furniture Store - Interactive Application Logic
 * Cart System, Category Filters, Dynamic Rendering & State Management
 */

// Sample Product Catalog matching reference design mockup
// Sample Product Catalog with real luxury photography
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Papasan Bowl Chair",
    category: "armchairs",
    price: 3750000,
    oldPrice: 4800000,
    badge: "SALE",
    badgeType: "badge-sale",
    image: "asset/chair_papasan.jpg",
    swatches: ["#B8977E", "#5A4E45", "#E4DDD3"],
    shape: "bowl"
  },
  {
    id: 2,
    name: "Classic Dining Chair",
    category: "chairs",
    price: 1500000,
    oldPrice: null,
    badge: null,
    badgeType: null,
    image: "asset/chair_dining.jpg",
    swatches: ["#C5A880", "#2C2B29", "#8C6642"],
    shape: "chair"
  },
  {
    id: 3,
    name: "Classic Armchair",
    category: "armchairs",
    price: 2700000,
    oldPrice: null,
    badge: null,
    badgeType: null,
    image: "asset/chair_armchair.jpg",
    swatches: ["#FFFFFF", "#8C7862", "#4A4742"],
    shape: "armchair"
  },
  {
    id: 4,
    name: "Bar Stool Scandinavian",
    category: "chairs",
    price: 3750000,
    oldPrice: null,
    badge: null,
    badgeType: null,
    image: "asset/chair_barstool.jpg",
    swatches: ["#998D80", "#2D2B29"],
    shape: "stool"
  },
  {
    id: 5,
    name: "Wooden Night Stand",
    category: "tables",
    price: 2100000,
    oldPrice: 2600000,
    badge: "SALE",
    badgeType: "badge-sale",
    image: "asset/table_nightstand.jpg",
    swatches: ["#BF9B7B", "#5C4A3A"],
    shape: "stand"
  },
  {
    id: 6,
    name: "White Minimalist Desk",
    category: "tables",
    price: 4800000,
    oldPrice: null,
    badge: "NEW",
    badgeType: "badge-new",
    image: "asset/table_desk.jpg",
    swatches: ["#FFFFFF", "#D3C7B5"],
    shape: "table"
  },
  {
    id: 7,
    name: "Egg Lounge Chair",
    category: "armchairs",
    price: 6750000,
    oldPrice: 7900000,
    badge: "HOT",
    badgeType: "badge-hot",
    image: "asset/chair_egg.jpg",
    swatches: ["#F0EDE6", "#33312E", "#A67C52"],
    shape: "egg"
  },
  {
    id: 8,
    name: "Minimalist Fabric Sofa",
    category: "sofas",
    price: 8700000,
    oldPrice: 9750000,
    badge: "SALE",
    badgeType: "badge-sale",
    image: "asset/sofa_fabric.jpg",
    swatches: ["#828387", "#3B424C", "#D2C9BF"],
    shape: "sofa"
  }
];

// Dynamically read from admin catalog storage
function getActiveProducts() {
  try {
    const raw = localStorage.getItem('vivere_admin_products');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_PRODUCTS;
}

let PRODUCTS = getActiveProducts();

// Cart State (Persisted in localStorage)
let cart = JSON.parse(localStorage.getItem('furniture_cart') || '[]');

// SVG Icon Generator for Product Illustrations
function getProductSvg(shape) {
  switch (shape) {
    case 'bowl':
      return `
        <svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
          <circle cx="50" cy="40" r="28" fill="#EDE4D6" stroke-width="2"/>
          <path d="M26 48 Q50 72 74 48" stroke-width="3.5"/>
          <path d="M34 68 L28 88" stroke-width="3"/>
          <path d="M66 68 L72 88" stroke-width="3"/>
          <ellipse cx="50" cy="86" rx="22" ry="4" stroke-width="2"/>
        </svg>`;
    case 'chair':
      return `
        <svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M32 20 Q50 14 68 20 L66 52 Q50 56 34 52 Z" fill="#E6DCCF"/>
          <line x1="36" y1="52" x2="30" y2="88" stroke-width="3.5"/>
          <line x1="64" y1="52" x2="70" y2="88" stroke-width="3.5"/>
          <line x1="34" y1="72" x2="66" y2="72" stroke-width="2"/>
        </svg>`;
    case 'armchair':
      return `
        <svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
          <rect x="25" y="32" width="50" height="38" rx="8" fill="#E8DEC8"/>
          <rect x="33" y="40" width="34" height="24" rx="4" fill="#F4EFE6"/>
          <line x1="28" y1="70" x2="24" y2="88" stroke-width="3.5"/>
          <line x1="72" y1="70" x2="76" y2="88" stroke-width="3.5"/>
        </svg>`;
    case 'stool':
      return `
        <svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
          <rect x="36" y="20" width="28" height="22" rx="4" fill="#D3C7B5"/>
          <path d="M32 42 L24 88" stroke-width="3.5"/>
          <path d="M68 42 L76 88" stroke-width="3.5"/>
          <path d="M28 68 L72 68" stroke-width="2"/>
        </svg>`;
    case 'stand':
      return `
        <svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
          <rect x="30" y="30" width="40" height="36" rx="4" fill="#D8CEBD"/>
          <line x1="30" y1="48" x2="70" y2="48" stroke-width="2"/>
          <circle cx="50" cy="39" r="2" fill="currentColor"/>
          <circle cx="50" cy="57" r="2" fill="currentColor"/>
          <line x1="34" y1="66" x2="30" y2="88" stroke-width="3"/>
          <line x1="66" y1="66" x2="70" y2="88" stroke-width="3"/>
        </svg>`;
    case 'table':
      return `
        <svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
          <rect x="18" y="40" width="64" height="12" rx="2" fill="#E8DEC8"/>
          <line x1="26" y1="52" x2="20" y2="88" stroke-width="3.5"/>
          <line x1="74" y1="52" x2="80" y2="88" stroke-width="3.5"/>
          <line x1="28" y1="46" x2="48" y2="46" stroke-width="2"/>
          <line x1="52" y1="46" x2="72" y2="46" stroke-width="2"/>
        </svg>`;
    case 'egg':
      return `
        <svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
          <ellipse cx="50" cy="42" rx="26" ry="32" fill="#EAE5DB"/>
          <path d="M34 50 Q50 62 66 50" stroke-width="2.5"/>
          <line x1="50" y1="74" x2="50" y2="85" stroke-width="4"/>
          <line x1="35" y1="85" x2="65" y2="85" stroke-width="3.5"/>
        </svg>`;
    case 'sofa':
    default:
      return `
        <svg class="product-thumb-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
          <rect x="18" y="42" width="64" height="26" rx="4" fill="#D3C7B5"/>
          <rect x="28" y="28" width="44" height="20" rx="3" fill="#E5D9C7"/>
          <line x1="24" y1="68" x2="20" y2="86" stroke-width="3.5"/>
          <line x1="76" y1="68" x2="80" y2="86" stroke-width="3.5"/>
        </svg>`;
  }
}

// Format Currency
function formatCurrency(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// Save Cart
function saveCart() {
  localStorage.setItem('furniture_cart', JSON.stringify(cart));
  updateCartUI();
}

// Render Products Grid
function renderProducts(filter = 'all', searchQuery = '') {
  const container = document.getElementById('productsContainer');
  const countLabel = document.getElementById('productCountLabel');
  if (!container) return;

  PRODUCTS = getActiveProducts();

  let filtered = PRODUCTS.filter(p => {
    const matchesFilter = filter === 'all' || p.category === filter;
    const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (countLabel) {
    countLabel.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
        <p style="font-weight: 700; font-size: 1.1rem; margin-bottom: 6px;">Produk Tidak Ditemukan</p>
        <p style="font-size: 0.9rem;">Coba cari dengan kata kunci lain atau pilih kategori yang berbeda.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(product => {
    let discountPct = null;
    if (product.oldPrice && product.oldPrice > product.price) {
      discountPct = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
    }

    let badgeHtml = '';
    if (discountPct) {
      badgeHtml = `<span class="product-badge badge-sale">-${discountPct}%</span>`;
    } else if (product.badge && product.badge !== 'NONE') {
      const bClass = product.badge.toLowerCase().includes('sale') ? 'badge-sale' : product.badge.toLowerCase().includes('hot') ? 'badge-hot' : 'badge-new';
      badgeHtml = `<span class="product-badge ${bClass}">${product.badge}</span>`;
    }

    const swatches = product.swatches || ["#B8977E", "#2C2B29"];

    return `
      <article class="product-card" data-id="${product.id}">
        <div class="product-thumb">
          ${badgeHtml}
          <button class="quick-wishlist" onclick="toggleWishlist(${product.id})" aria-label="Add to Wishlist">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          ${product.image ? `
            <img src="${product.image}" alt="${product.name}" class="product-thumb-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">
              ${getProductSvg(product.shape || 'chair')}
            </div>
          ` : getProductSvg(product.shape || 'chair')}
        </div>
        <div class="product-details">
          <span class="product-cat">${product.category}</span>
          <h3 class="product-title">${product.name}</h3>
          
          <div class="swatches-row">
            ${swatches.map(color => `
              <span class="swatch-dot" style="background-color: ${color};" title="Varian warna"></span>
            `).join('')}
          </div>

          <div class="price-row">
            <div class="product-price">
              ${formatCurrency(product.price)}
              ${product.oldPrice ? `<span class="old-price">${formatCurrency(product.oldPrice)}</span>` : ''}
            </div>
            <button class="btn-add-cart" onclick="addToCart(${product.id})" aria-label="Tambah ${product.name} ke keranjang">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add to cart
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Add Item to Cart
function addToCart(productId) {
  let allCatalog = getActiveProducts();
  if (typeof getShopProducts === 'function') {
    allCatalog = getShopProducts();
  }
  const product = allCatalog.find(p => p.id === productId) || PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      shape: product.shape || 'chair',
      image: product.image || null,
      qty: 1
    });
  }

  saveCart();
  showToast(`"${product.name}" ditambahkan ke keranjang!`);

  // Animate badge
  const badge = document.getElementById('cartCountBadge');
  if (badge) {
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 250);
  }
}

// Update Cart Quantity
function updateQty(productId, delta) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex > -1) {
    cart[itemIndex].qty += delta;
    if (cart[itemIndex].qty <= 0) {
      cart.splice(itemIndex, 1);
    }
  }
  saveCart();
}

// Remove Item from Cart
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

// Update Cart Drawer UI
function updateCartUI() {
  const badge = document.getElementById('cartCountBadge');
  const drawerBadge = document.getElementById('drawerBadge');
  const itemsContainer = document.getElementById('cartItemsContainer');
  const emptyState = document.getElementById('cartEmptyState');
  const drawerFooter = document.getElementById('drawerFooter');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');

  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (badge) badge.textContent = totalItemsCount;
  if (drawerBadge) drawerBadge.textContent = `${totalItemsCount} item`;

  if (cart.length === 0) {
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (drawerFooter) drawerFooter.style.display = 'none';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (drawerFooter) drawerFooter.style.display = 'block';

    if (itemsContainer) {
      itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-img" style="overflow: hidden; border-radius: 6px; padding: 0;">
            ${item.image ? `
              <img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">
                ${getProductSvg(item.shape || 'chair')}
              </div>
            ` : getProductSvg(item.shape || 'chair')}
          </div>
          <div class="cart-item-info">
            <div>
              <div class="cart-item-title">${item.name}</div>
              <div class="cart-item-price">${formatCurrency(item.price)}</div>
            </div>
            <div class="cart-item-actions">
              <div class="qty-control">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)" aria-label="Kurangi kuantitas">−</button>
                <span class="qty-display">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)" aria-label="Tambah kuantitas">+</button>
              </div>
              <button class="btn-remove-item" onclick="removeFromCart(${item.id})" aria-label="Hapus produk">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Hapus
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (cartSubtotal) cartSubtotal.textContent = formatCurrency(totalAmount);
    if (cartTotal) cartTotal.textContent = formatCurrency(totalAmount);
  }
}

// Toast Notice Helper
function showToast(message) {
  const toast = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// Dummy Wishlist toggle
function toggleWishlist(productId) {
  const prod = PRODUCTS.find(p => p.id === productId);
  if (prod) {
    showToast(`"${prod.name}" disimpan ke wishlist!`);
  }
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  renderProducts('all');
  updateCartUI();

  // Drawer Open/Close Listeners
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

  // Close on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Mobile Navigation Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  if (mobileMenuBtn && navLinks) {
    function toggleMobileMenu(open) {
      const shouldOpen = open !== undefined ? open : !navLinks.classList.contains('active');
      mobileMenuBtn.classList.toggle('active', shouldOpen);
      navLinks.classList.toggle('active', shouldOpen);
      if (navOverlay) navOverlay.classList.toggle('active', shouldOpen);
      document.body.style.overflow = shouldOpen ? 'hidden' : '';
    }

    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });

    if (navOverlay) {
      navOverlay.addEventListener('click', () => toggleMobileMenu(false));
    }

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMobileMenu(false));
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        toggleMobileMenu(false);
      }
    });
  }

  // Filter Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter') || 'all';
      renderProducts(filter);
    });
  });

  // Category Cards Click in "Shop by Categories"
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.getAttribute('data-cat');
      // Set active tab
      tabButtons.forEach(b => {
        if (b.getAttribute('data-filter') === cat) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      // Scroll smoothly to products section
      const prodSection = document.getElementById('products-section');
      if (prodSection) {
        prodSection.scrollIntoView({ behavior: 'smooth' });
      }
      renderProducts(cat);
    });
  });

  // Search input handling
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchSubmitBtn');
  const categorySelect = document.getElementById('searchCategorySelect');

  function executeSearch() {
    const query = searchInput ? searchInput.value.trim() : '';
    const cat = categorySelect ? categorySelect.value : 'all';
    
    // Switch tabs
    tabButtons.forEach(b => {
      if (b.getAttribute('data-filter') === cat) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const prodSection = document.getElementById('products-section');
    if (prodSection) {
      prodSection.scrollIntoView({ behavior: 'smooth' });
    }
    renderProducts(cat, query);
  }

  if (searchBtn) searchBtn.addEventListener('click', executeSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeSearch();
    });
  }

  // Checkout Action
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!cart || cart.length === 0) {
        showToast('Keranjang belanja Anda masih kosong.');
        return;
      }
      closeDrawer();
      if (window.VivereTransaction && typeof window.VivereTransaction.openCheckout === 'function') {
        window.VivereTransaction.openCheckout(cart);
      }
    });
  }
});

/* ==========================================================================
   HERO SLIDESHOW AUTO-ROTATION
   ========================================================================== */
(function() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;

  let currentSlide = 0;
  const intervalMs = 5000; // 5 seconds per slide

  setInterval(() => {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, intervalMs);
})();
