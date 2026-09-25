/**
 * VI VE RE - Admin Dashboard JavaScript (admin.js)
 * Handles route protection, tabs, product management (Full CRUD with discounts & photos),
 * order tracking, and Supabase config.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const auth = window.VivereAuth;

  // 1. ROUTE GUARD: requireAdmin sudah otomatis refresh session dari Supabase
  if (!await auth.requireAdmin('login.html?error=unauthorized')) {
    return;
  }

  const currentUser = auth.getCurrentUser();

  // Populate Admin Info in Sidebar
  if (currentUser) {
    const adminNameEl = document.getElementById('adminName');
    const adminAvatarLetterEl = document.getElementById('adminAvatarLetter');
    if (adminNameEl) adminNameEl.textContent = currentUser.full_name || 'Admin VI VE RE';
    if (adminAvatarLetterEl) adminAvatarLetterEl.textContent = (currentUser.full_name || 'A').charAt(0).toUpperCase();
  }

  // Logout Handler
  document.getElementById('logoutAdminBtn')?.addEventListener('click', async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
      await auth.signOut();
      window.location.href = 'login.html?msg=logout_success';
    }
  });

  // 2. TAB SWITCHING
  const sidebarItems = document.querySelectorAll('.sidebar-item[data-tab]');
  const pageTitle = document.getElementById('pageTitle');
  const titles = {
    dashboard: 'Ringkasan Bisnis',
    products: 'Manajemen Produk',
    orders: 'Daftar Pesanan',
    supabase: 'Konfigurasi Supabase'
  };

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabKey = item.getAttribute('data-tab');

      // Update sidebar active classes
      sidebarItems.forEach(s => s.classList.remove('active'));
      item.classList.add('active');

      // Update topbar title
      if (pageTitle && titles[tabKey]) {
        pageTitle.textContent = titles[tabKey];
      }

      // Show selected pane
      document.querySelectorAll('.admin-tab-pane').forEach(pane => {
        pane.style.display = 'none';
      });
      const activePane = document.getElementById(`pane-${tabKey}`);
      if (activePane) activePane.style.display = 'block';
    });
  });

  // 3. PRODUCT MANAGEMENT & PHOTO GALLERY PRESETS
  const PHOTO_PRESETS = [
    { name: "Papasan Bowl Chair", url: "asset/chair_papasan.jpg" },
    { name: "Classic Dining Chair", url: "asset/chair_dining.jpg" },
    { name: "Classic Armchair", url: "asset/chair_armchair.jpg" },
    { name: "Scandinavian Stool", url: "asset/chair_barstool.jpg" },
    { name: "Wooden Night Stand", url: "asset/table_nightstand.jpg" },
    { name: "White Minimalist Desk", url: "asset/table_desk.jpg" },
    { name: "Egg Lounge Chair", url: "asset/chair_egg.jpg" },
    { name: "Minimalist Fabric Sofa", url: "asset/sofa_fabric.jpg" },
    { name: "L-Shape Corner Sofa", url: "asset/sofa_lshape.jpg" },
    { name: "Solid Oak Dining Table", url: "asset/table_dining.jpg" }
  ];

  const DEFAULT_PRODUCTS = [
    { 
      id: 1, 
      name: "Papasan Bowl Chair", 
      category: "armchairs", 
      price: 3750000, 
      oldPrice: 4800000, 
      badge: "SALE", 
      stock: "Tersedia (24 unit)",
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
      stock: "Tersedia (42 unit)",
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
      stock: "Tersedia (15 unit)",
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
      stock: "Tersedia (18 unit)",
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
      stock: "Tersedia (9 unit)",
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
      stock: "Tersedia (11 unit)",
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
      stock: "Tersedia (5 unit)",
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
      stock: "Tersedia (8 unit)",
      image: "asset/sofa_fabric.jpg",
      swatches: ["#828387", "#3B424C", "#D2C9BF"],
      shape: "sofa"
    }
  ];

  function getProducts() {
    try {
      const stored = localStorage.getItem('vivere_admin_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure image links are attached if previous mock products existed without images
        parsed.forEach(p => {
          if (!p.image) {
            const def = DEFAULT_PRODUCTS.find(d => d.id === p.id);
            if (def && def.image) p.image = def.image;
          }
        });
        return parsed;
      }
    } catch (e) {}
    localStorage.setItem('vivere_admin_products', JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }

  function saveProducts(prods) {
    localStorage.setItem('vivere_admin_products', JSON.stringify(prods));
    // Synchronize event for any open tabs or storefront
    window.dispatchEvent(new CustomEvent('vivere:products-updated', { detail: { products: prods } }));
    renderProducts();
  }

  function formatRupiah(num) {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  }

  function calcDiscount(price, oldPrice) {
    if (!oldPrice || Number(oldPrice) <= Number(price)) return null;
    const savings = Number(oldPrice) - Number(price);
    const percentage = Math.round((savings / Number(oldPrice)) * 100);
    return { savings, percentage };
  }

  // Populate Visual Photo Picker Grid
  function initPhotoPickers() {
    ['new', 'edit'].forEach(prefix => {
      const grid = document.getElementById(`${prefix}PhotoPickerGrid`);
      const input = document.getElementById(`${prefix}ProdImage`);
      if (!grid || !input) return;

      grid.innerHTML = '';
      PHOTO_PRESETS.forEach(item => {
        const div = document.createElement('div');
        div.className = 'photo-picker-item';
        div.title = item.name;
        div.innerHTML = `<img src="${item.url}" alt="${item.name}">`;

        div.addEventListener('click', () => {
          grid.querySelectorAll('.photo-picker-item').forEach(el => el.classList.remove('selected'));
          div.classList.add('selected');
          input.value = item.url;
        });

        grid.appendChild(div);
      });

      // Highlight selected on manual input
      input.addEventListener('input', () => {
        const current = input.value.trim();
        grid.querySelectorAll('.photo-picker-item').forEach((el, idx) => {
          if (PHOTO_PRESETS[idx].url === current) {
            el.classList.add('selected');
          } else {
            el.classList.remove('selected');
          }
        });
      });
    });
  }

  initPhotoPickers();

  // Live Discount Calculator in Form
  function setupLiveDiscountCalc(prefix) {
    const priceInput = document.getElementById(`${prefix}ProdPrice`);
    const oldPriceInput = document.getElementById(`${prefix}ProdOldPrice`);
    const box = document.getElementById(`${prefix}ProdDiscountBox`);
    const text = document.getElementById(`${prefix}ProdDiscountText`);
    const badgeSelect = document.getElementById(`${prefix}ProdBadge`);

    if (!priceInput || !oldPriceInput || !box || !text) return;

    function update() {
      const price = Number(priceInput.value) || 0;
      const oldPrice = Number(oldPriceInput.value) || 0;

      if (oldPrice > price && price > 0) {
        const disc = calcDiscount(price, oldPrice);
        box.style.display = 'flex';
        text.textContent = `-${disc.percentage}% (Hemat ${formatRupiah(disc.savings)})`;
        if (badgeSelect && badgeSelect.value === '') {
          // If automatic badge
        }
      } else {
        box.style.display = 'none';
      }
    }

    priceInput.addEventListener('input', update);
    oldPriceInput.addEventListener('input', update);
  }

  setupLiveDiscountCalc('new');
  setupLiveDiscountCalc('edit');

  // Render Products Table
  function renderProducts() {
    const products = getProducts();
    const tbody = document.getElementById('productsTableBody');
    const statProductCount = document.getElementById('statProductCount');

    if (statProductCount) statProductCount.textContent = products.length;
    if (!tbody) return;

    tbody.innerHTML = '';
    products.forEach((p) => {
      const tr = document.createElement('tr');
      const disc = calcDiscount(p.price, p.oldPrice);
      const thumb = p.image || 'asset/logo.png';

      tr.innerHTML = `
        <td>
          <div class="admin-prod-cell">
            <img src="${thumb}" class="admin-prod-thumb" alt="${p.name}" onerror="this.src='asset/logo.png'">
            <div class="admin-prod-info">
              <span class="admin-prod-name">${p.name}</span>
              <span class="admin-prod-id">#PRD-${String(p.id).padStart(3, '0')}</span>
            </div>
          </div>
        </td>
        <td><span class="status-pill info">${p.category.toUpperCase()}</span></td>
        <td>
          <div class="price-display-wrap">
            <span class="price-main">${formatRupiah(p.price)}</span>
            ${disc ? `
              <div style="display:flex; align-items:center;">
                <span class="old-price-del">${formatRupiah(p.oldPrice)}</span>
                <span class="discount-badge-pill">-${disc.percentage}%</span>
              </div>
            ` : '<span style="font-size:0.75rem; color:var(--admin-text-muted);">Normal</span>'}
          </div>
        </td>
        <td><span class="status-pill success">${p.stock || 'Tersedia'}</span></td>
        <td>${p.badge ? `<span class="status-pill warning">${p.badge}</span>` : '<span style="color:var(--admin-text-muted); font-size:0.8rem;">-</span>'}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="action-icon-btn edit edit-prod-btn" data-id="${p.id}" title="Edit Produk & Diskon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="action-icon-btn danger delete-prod-btn" data-id="${p.id}" title="Hapus Produk">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Edit Handlers
    tbody.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        openEditModal(id);
      });
    });

    // Delete Handlers
    tbody.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        if (confirm('Yakin ingin menghapus produk ini dari katalog?')) {
          const updated = products.filter(p => p.id !== id);
          saveProducts(updated);
        }
      });
    });
  }

  renderProducts();

  // ADD PRODUCT MODAL
  const addProductModal = document.getElementById('addProductModal');
  const openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
  const closeAddProductModalBtn = document.getElementById('closeAddProductModalBtn');
  const cancelAddProductBtn = document.getElementById('cancelAddProductBtn');
  const addProductForm = document.getElementById('addProductForm');

  openAddProductModalBtn?.addEventListener('click', () => {
    addProductForm.reset();
    document.getElementById('newProdDiscountBox').style.display = 'none';
    document.querySelectorAll('#newPhotoPickerGrid .photo-picker-item').forEach(el => el.classList.remove('selected'));
    addProductModal.classList.add('open');
  });

  const closeAddModal = () => addProductModal.classList.remove('open');
  closeAddProductModalBtn?.addEventListener('click', closeAddModal);
  cancelAddProductBtn?.addEventListener('click', closeAddModal);

  addProductForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newProdName').value.trim();
    const category = document.getElementById('newProdCategory').value;
    const price = Number(document.getElementById('newProdPrice').value);
    const oldPriceVal = document.getElementById('newProdOldPrice').value;
    const oldPrice = oldPriceVal ? Number(oldPriceVal) : null;
    let badge = document.getElementById('newProdBadge').value;
    const stock = document.getElementById('newProdStock').value.trim() || 'Tersedia (10 unit)';
    const image = document.getElementById('newProdImage').value.trim() || 'asset/chair_papasan.jpg';

    if (!name || isNaN(price) || price <= 0) {
      alert('Mohon isi nama dan harga produk dengan benar.');
      return;
    }

    // Auto badge if discount exists
    if (!badge && oldPrice && oldPrice > price) {
      badge = 'SALE';
    } else if (badge === 'NONE') {
      badge = null;
    }

    const prods = getProducts();
    const newId = prods.length > 0 ? Math.max(...prods.map(p => p.id)) + 1 : 1;
    prods.unshift({
      id: newId,
      name,
      category,
      price,
      oldPrice,
      badge,
      stock,
      image,
      swatches: ["#B8977E", "#2C2B29"],
      shape: "chair"
    });

    saveProducts(prods);
    closeAddModal();
    alert('Produk baru berhasil ditambahkan ke katalog!');
  });

  // EDIT PRODUCT MODAL (CRUD UPDATE)
  const editProductModal = document.getElementById('editProductModal');
  const closeEditProductModalBtn = document.getElementById('closeEditProductModalBtn');
  const cancelEditProductBtn = document.getElementById('cancelEditProductBtn');
  const editProductForm = document.getElementById('editProductForm');

  const closeEditModal = () => editProductModal.classList.remove('open');
  closeEditProductModalBtn?.addEventListener('click', closeEditModal);
  cancelEditProductBtn?.addEventListener('click', closeEditModal);

  function openEditModal(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('editProdId').value = product.id;
    document.getElementById('editProdName').value = product.name;
    document.getElementById('editProdCategory').value = product.category;
    document.getElementById('editProdPrice').value = product.price;
    document.getElementById('editProdOldPrice').value = product.oldPrice || '';
    document.getElementById('editProdBadge').value = product.badge || (product.badge === null ? 'NONE' : '');
    document.getElementById('editProdStock').value = product.stock || 'Tersedia';
    document.getElementById('editProdImage').value = product.image || '';

    // Highlight selected photo in grid
    const editGrid = document.getElementById('editPhotoPickerGrid');
    editGrid.querySelectorAll('.photo-picker-item').forEach((el, idx) => {
      if (PHOTO_PRESETS[idx].url === product.image) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    // Update discount box
    const discBox = document.getElementById('editProdDiscountBox');
    const discText = document.getElementById('editProdDiscountText');
    const disc = calcDiscount(product.price, product.oldPrice);
    if (disc) {
      discBox.style.display = 'flex';
      discText.textContent = `-${disc.percentage}% (Hemat ${formatRupiah(disc.savings)})`;
    } else {
      discBox.style.display = 'none';
    }

    editProductModal.classList.add('open');
  }

  editProductForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('editProdId').value);
    const name = document.getElementById('editProdName').value.trim();
    const category = document.getElementById('editProdCategory').value;
    const price = Number(document.getElementById('editProdPrice').value);
    const oldPriceVal = document.getElementById('editProdOldPrice').value;
    const oldPrice = oldPriceVal ? Number(oldPriceVal) : null;
    let badge = document.getElementById('editProdBadge').value;
    const stock = document.getElementById('editProdStock').value.trim() || 'Tersedia';
    const image = document.getElementById('editProdImage').value.trim() || 'asset/chair_papasan.jpg';

    if (!name || isNaN(price) || price <= 0) {
      alert('Mohon isi nama dan harga produk dengan benar.');
      return;
    }

    if (!badge && oldPrice && oldPrice > price) {
      badge = 'SALE';
    } else if (badge === 'NONE') {
      badge = null;
    }

    const prods = getProducts();
    const index = prods.findIndex(p => p.id === id);
    if (index !== -1) {
      prods[index] = {
        ...prods[index],
        name,
        category,
        price,
        oldPrice,
        badge,
        stock,
        image
      };
      saveProducts(prods);
      closeEditModal();
      alert(`Produk "${name}" berhasil diperbarui!`);
    }
  });

  // 4. ORDERS & TRANSACTION MANAGEMENT
  const DEFAULT_ORDERS = [
    {
      id: 'ORD-8921',
      date: '23 Sep 2026',
      customer: 'Siti Rahmawati',
      phone: '081288229911',
      email: 'siti.rahmawati@gmail.com',
      address: 'Jl. Senopati No. 45, Kebayoran Baru',
      city: 'Jakarta Selatan',
      notes: 'Harap hubungi sebelum sampai',
      deliveryMethod: 'VI VE RE FurniCare Express',
      deliveryCost: 75000,
      paymentMethod: 'BCA Virtual Account',
      paymentStatus: 'Lunas',
      trackingNumber: 'VVR-EXP-892100',
      total: 6450000,
      subtotal: 6375000,
      discount: 0,
      status: 'Diproses',
      items: [
        { id: 1, name: 'Papasan Bowl Chair', price: 3750000, qty: 1, image: 'asset/chair_papasan.jpg' },
        { id: 3, name: 'Classic Armchair', price: 2700000, qty: 1, image: 'asset/chair_armchair.jpg' }
      ]
    },
    {
      id: 'ORD-8920',
      date: '22 Sep 2026',
      customer: 'Hendrik Pratama',
      phone: '081399887711',
      email: 'hendrik.p@yahoo.com',
      address: 'Jl. Teuku Umar No. 12, Menteng',
      city: 'Jakarta Pusat',
      notes: 'Kirim saat jam kantor',
      deliveryMethod: 'J&T Cargo / SiCepat Ekspres',
      deliveryCost: 120000,
      paymentMethod: 'Mandiri Virtual Account',
      paymentStatus: 'Lunas',
      trackingNumber: 'VVR-EXP-892011',
      total: 14700000,
      subtotal: 14580000,
      discount: 0,
      status: 'Dikirim',
      items: [
        { id: 8, name: 'Minimalist Fabric Sofa', price: 8700000, qty: 1, image: 'asset/sofa_fabric.jpg' },
        { id: 6, name: 'White Minimalist Desk', price: 4800000, qty: 1, image: 'asset/table_desk.jpg' }
      ]
    },
    {
      id: 'ORD-8919',
      date: '22 Sep 2026',
      customer: 'Diana Lestari',
      phone: '085712345678',
      email: 'diana.lestari@gmail.com',
      address: 'Jl. Dago Asri No. 8, Coblong',
      city: 'Bandung',
      notes: '',
      deliveryMethod: 'JNE Trucking Standar',
      deliveryCost: 50000,
      paymentMethod: 'QRIS (GoPay/OVO/Dana)',
      paymentStatus: 'Lunas',
      trackingNumber: 'VVR-EXP-891922',
      total: 3750000,
      subtotal: 3700000,
      discount: 0,
      status: 'Selesai',
      items: [
        { id: 4, name: 'Bar Stool Scandinavian', price: 3750000, qty: 1, image: 'asset/chair_barstool.jpg' }
      ]
    },
    {
      id: 'ORD-8918',
      date: '21 Sep 2026',
      customer: 'Agus Setiawan',
      phone: '081822334455',
      email: 'agus.setiawan@gmail.com',
      address: 'Green Ville Blok AY No. 3, Tanjung Duren',
      city: 'Jakarta Barat',
      notes: 'Titip di satpam jika tidak ada orang',
      deliveryMethod: 'VI VE RE FurniCare Express',
      deliveryCost: 0,
      paymentMethod: 'Kartu Kredit / Debit Online',
      paymentStatus: 'Lunas',
      trackingNumber: 'VVR-EXP-891833',
      total: 4800000,
      subtotal: 4800000,
      discount: 0,
      status: 'Selesai',
      items: [
        { id: 6, name: 'White Minimalist Desk', price: 4800000, qty: 1, image: 'asset/table_desk.jpg' }
      ]
    },
    {
      id: 'ORD-8917',
      date: '20 Sep 2026',
      customer: 'Maya Anindya',
      phone: '081233445566',
      email: 'maya.anindya@gmail.com',
      address: 'Kertajaya Indah Timur No. 19',
      city: 'Surabaya',
      notes: '',
      deliveryMethod: 'J&T Cargo / SiCepat Ekspres',
      deliveryCost: 120000,
      paymentMethod: 'BCA Virtual Account',
      paymentStatus: 'Lunas',
      trackingNumber: 'VVR-EXP-891744',
      total: 8700000,
      subtotal: 8580000,
      discount: 0,
      status: 'Selesai',
      items: [
        { id: 8, name: 'Minimalist Fabric Sofa', price: 8700000, qty: 1, image: 'asset/sofa_fabric.jpg' }
      ]
    }
  ];

  let currentOrderStatusFilter = 'all';
  let currentOrderSearchQuery = '';

  function getOrders() {
    try {
      const stored = localStorage.getItem('vivere_admin_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    localStorage.setItem('vivere_admin_orders', JSON.stringify(DEFAULT_ORDERS));
    return DEFAULT_ORDERS;
  }

  function saveOrders(orders) {
    localStorage.setItem('vivere_admin_orders', JSON.stringify(orders));
    renderOrders();
    updateDashboardStats();
  }

  // Load pesanan dari Supabase dan gabungkan dengan localStorage
  async function loadOrdersFromSupabase() {
    const auth = window.VivereAuth;
    if (!auth || !auth.isConfigured || !auth.isConfigured() || !auth.client) return;

    try {
      const { data, error } = await auth.client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Admin] Supabase orders fetch error:', error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.log('[Admin] No orders found in Supabase.');
        return;
      }

      // Konversi format Supabase ke format lokal
      const supabaseOrders = data.map(o => ({
        id: o.id,
        date: new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        timestamp: o.created_at,
        customer: o.customer_name,
        phone: o.customer_phone || '',
        email: '',
        address: o.delivery_address,
        city: '',
        notes: '',
        deliveryMethod: o.delivery_method,
        deliveryCost: Number(o.delivery_cost) || 0,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        trackingNumber: o.tracking_number || '-',
        status: o.status,
        items: Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items) : []),
        subtotal: Number(o.subtotal) || 0,
        discount: 0,
        total: Number(o.total) || 0
      }));

      // Gabungkan: Supabase sebagai utama + localStorage sebagai fallback
      const localOrders = getOrders();
      const supabaseIds = new Set(supabaseOrders.map(o => o.id));
      const localOnly = localOrders.filter(o => !supabaseIds.has(o.id));
      const merged = [...supabaseOrders, ...localOnly];

      localStorage.setItem('vivere_admin_orders', JSON.stringify(merged));
      renderOrders();
      updateDashboardStats();
      console.log(`[Admin] ${supabaseOrders.length} orders from Supabase, ${localOnly.length} from local.`);
    } catch (e) {
      console.warn('[Admin] loadOrdersFromSupabase exception:', e);
    }
  }

  function updateDashboardStats() {
    const orders = getOrders();
    const prods = getProducts();

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const countDiproses = orders.filter(o => o.status === 'Diproses').length;

    const statRevEl = document.getElementById('statRevenue');
    const statRevGrowth = document.getElementById('statRevenueGrowth');
    const statCountEl = document.getElementById('statOrderCount');
    const statGrowthEl = document.getElementById('statOrderGrowth');
    const statProdEl = document.getElementById('statProductCount');

    if (statRevEl) statRevEl.textContent = formatRupiah(totalRevenue);
    if (statRevGrowth) statRevGrowth.textContent = `↑ ${orders.length} transaksi tercatat`;
    if (statCountEl) statCountEl.textContent = orders.length;
    if (statGrowthEl) statGrowthEl.textContent = `${countDiproses} pesanan perlu diproses`;
    if (statProdEl) statProdEl.textContent = prods.length;
  }

  function renderOrders() {
    const orders = getOrders();
    const dashboardBody = document.getElementById('dashboardOrdersTableBody');
    const allBody = document.getElementById('allOrdersTableBody');

    // 1. Render Preview on Dashboard
    if (dashboardBody) {
      dashboardBody.innerHTML = '';
      orders.slice(0, 5).forEach(o => {
        const tr = document.createElement('tr');
        const pillClass = o.status === 'Selesai' ? 'success' : o.status === 'Dikirim' ? 'info' : 'warning';
        const itemCount = (o.items && o.items.length) ? `${o.items.length} Barang: ${o.items[0].name}` : 'Furnitur Interior';
        tr.innerHTML = `
          <td>
            <div style="font-weight: 700; color: #FFF;">${o.id}</div>
            <div style="font-size: 0.72rem; color: #9E9790; font-family: monospace;">${o.trackingNumber || '-'}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${o.customer}</div>
            <div style="font-size: 0.72rem; color: #9E9790;">${o.city || ''}</div>
          </td>
          <td style="color: var(--admin-text-muted); font-size: 0.82rem; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${itemCount}
          </td>
          <td style="font-weight: 700; color: var(--admin-accent);">${formatRupiah(o.total)}</td>
          <td><span class="status-pill ${pillClass}">${o.status}</span></td>
        `;
        dashboardBody.appendChild(tr);
      });
    }

    // 2. Filter & Render All Orders in Orders Tab
    if (allBody) {
      allBody.innerHTML = '';

      let filtered = orders.filter(o => {
        const matchesStatus = currentOrderStatusFilter === 'all' || o.status === currentOrderStatusFilter;
        const q = currentOrderSearchQuery.toLowerCase();
        const matchesQuery = !q ||
          (o.id && o.id.toLowerCase().includes(q)) ||
          (o.customer && o.customer.toLowerCase().includes(q)) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
          (o.address && o.address.toLowerCase().includes(q));
        return matchesStatus && matchesQuery;
      });

      if (filtered.length === 0) {
        allBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: var(--admin-text-muted);">
              Tidak ada pesanan yang sesuai dengan filter atau pencarian.
            </td>
          </tr>
        `;
      } else {
        filtered.forEach(o => {
          const tr = document.createElement('tr');
          const pillClass = o.status === 'Selesai' ? 'success' : o.status === 'Dikirim' ? 'info' : 'warning';
          tr.innerHTML = `
            <td>
              <div style="font-weight: 700; color: #FFF;">${o.id}</div>
              <div style="font-size: 0.72rem; color: var(--admin-accent); font-family: monospace;">
                Resi: ${o.trackingNumber || '-'}
              </div>
            </td>
            <td style="font-size: 0.82rem; color: var(--admin-text-muted);">${o.date}</td>
            <td>
              <div style="font-weight: 600; color: #FFF;">${o.customer}</div>
              <div style="font-size: 0.72rem; color: var(--admin-text-muted);">${o.phone || ''}</div>
            </td>
            <td style="font-size: 0.82rem;">
              <div style="color: #E6DCCF; font-weight: 600;">${o.deliveryMethod || 'Ekspedisi Reguler'}</div>
              <div style="color: var(--admin-text-muted); font-size: 0.75rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${o.address || '-'}</div>
            </td>
            <td>
              <div style="font-weight: 700; color: var(--admin-accent);">${formatRupiah(o.total)}</div>
              <div style="font-size: 0.72rem; color: #10B981;">✓ ${o.paymentMethod || 'Transfer'}</div>
            </td>
            <td><span class="status-pill ${pillClass}">${o.status}</span></td>
            <td style="text-align: right;">
              <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                <button type="button" class="btn-topbar-link btn-visit-store view-order-detail-btn" data-id="${o.id}" style="padding: 5px 10px; font-size: 0.78rem;">
                  Detail
                </button>
                <select class="order-status-select" data-id="${o.id}" style="background: #181615; color: #FFF; border: 1px solid var(--admin-border); padding: 5px 8px; border-radius: 6px; font-size: 0.78rem;">
                  <option value="Diproses" ${o.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
                  <option value="Dikirim" ${o.status === 'Dikirim' ? 'selected' : ''}>Dikirim</option>
                  <option value="Selesai" ${o.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                  <option value="Dibatalkan" ${o.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
                </select>
              </div>
            </td>
          `;
          allBody.appendChild(tr);
        });

        // Status Select Handlers
        allBody.querySelectorAll('.order-status-select').forEach(sel => {
          sel.addEventListener('change', () => {
            const id = sel.getAttribute('data-id');
            const newStatus = sel.value;
            const updated = orders.map(item => item.id === id ? { ...item, status: newStatus } : item);
            saveOrders(updated);
          });
        });

        // Detail Modal Handlers
        allBody.querySelectorAll('.view-order-detail-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openOrderDetailModal(id);
          });
        });
      }
    }
  }

  // ORDER DETAIL MODAL
  const orderDetailModal = document.getElementById('orderDetailModal');
  const closeOrderDetailModalBtn = document.getElementById('closeOrderDetailModalBtn');

  function openOrderDetailModal(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const modalTitle = document.getElementById('orderDetailModalTitle');
    const modalBody = document.getElementById('orderDetailModalBody');
    if (modalTitle) modalTitle.textContent = `Pesanan #${order.id}`;

    const items = order.items || [];
    const pillClass = order.status === 'Selesai' ? 'success' : order.status === 'Dikirim' ? 'info' : 'warning';

    modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div>
          <span style="font-size: 0.75rem; color: #9E9790;">Tanggal Pesanan:</span>
          <div style="font-weight: 700; color: #FFF;">${order.date}</div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.75rem; color: #9E9790; display: block;">Status Saat Ini:</span>
          <span class="status-pill ${pillClass}">${order.status}</span>
        </div>
      </div>

      <!-- Tracking & Courier Info Box -->
      <div style="background: #141312; border: 1px solid rgba(184, 151, 126, 0.25); border-radius: 10px; padding: 14px; margin-bottom: 18px;">
        <div style="font-weight: 700; font-size: 0.85rem; color: #B8977E; margin-bottom: 8px;">📦 Data Pengiriman & Resi</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px;">
          <div>
            <span style="font-size: 0.75rem; color: #9E9790; display: block;">Layanan Ekspedisi:</span>
            <strong style="color: #FFF;">${order.deliveryMethod || 'Ekspedisi Furnitur'}</strong>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: #9E9790; display: block;">Metode Pembayaran:</span>
            <strong style="color: #10B981;">${order.paymentMethod || 'Virtual Account'} (Lunas)</strong>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" id="adminEditTrackingInput" class="auth-input" style="background: #1C1A18; color: #FFF; font-family: monospace; font-size: 0.85rem;" value="${order.trackingNumber || ''}" placeholder="Masukkan No. Resi...">
          <button type="button" class="btn-primary-admin" id="adminSaveTrackingBtn" style="padding: 8px 16px; white-space: nowrap;">
            Simpan Resi
          </button>
        </div>
      </div>

      <!-- Customer Destination -->
      <div style="background: #141312; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; margin-bottom: 18px; font-size: 0.85rem;">
        <div style="font-weight: 700; color: #FFF; margin-bottom: 4px;">Penerima: ${order.customer}</div>
        <div style="color: #9E9790; margin-bottom: 2px;">Telepon: ${order.phone || '-'} • Email: ${order.email || '-'}</div>
        <div style="color: #E6DCCF;">Alamat: ${order.address || '-'}, ${order.city || ''}</div>
        ${order.notes ? `<div style="margin-top: 6px; color: var(--admin-accent); font-size: 0.78rem;">Catatan: "${order.notes}"</div>` : ''}
      </div>

      <!-- Item Breakdown -->
      <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; font-size: 0.85rem; color: #FFF; margin-bottom: 10px;">Daftar Produk (${items.length} Item)</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${items.map(i => `
            <div style="display: flex; align-items: center; justify-content: space-between; background: #141312; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${i.image || 'asset/chair_papasan.jpg'}" alt="${i.name}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; background: #262320;" onerror="this.src='asset/chair_papasan.jpg'">
                <div>
                  <div style="font-weight: 600; color: #FFF; font-size: 0.85rem;">${i.name}</div>
                  <div style="font-size: 0.75rem; color: #9E9790;">${i.qty} unit @ ${formatRupiah(i.price)}</div>
                </div>
              </div>
              <div style="font-weight: 700; color: #B8977E; font-size: 0.88rem;">${formatRupiah(i.price * i.qty)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Financial Calculation -->
      <div style="background: #141312; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; color: #9E9790;">
          <span>Subtotal Produk:</span>
          <span>${formatRupiah(order.subtotal || order.total)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #9E9790;">
          <span>Ongkos Kirim:</span>
          <span>${order.deliveryCost ? formatRupiah(order.deliveryCost) : 'GRATIS'}</span>
        </div>
        ${order.discount ? `
          <div style="display: flex; justify-content: space-between; color: #10B981;">
            <span>Diskon Promo:</span>
            <span>-${formatRupiah(order.discount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.05rem; color: #FFF; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
          <span>Total Pembayaran:</span>
          <span style="color: var(--admin-accent);">${formatRupiah(order.total)}</span>
        </div>
      </div>

      <!-- Change Order Status Select -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 0.82rem; color: #FFF; font-weight: 600;">Ubah Status:</span>
          <select id="adminModalStatusSelect" style="background: #141312; color: #FFF; border: 1px solid var(--admin-border); padding: 8px 12px; border-radius: 6px; font-size: 0.82rem;">
            <option value="Diproses" ${order.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
            <option value="Dikirim" ${order.status === 'Dikirim' ? 'selected' : ''}>Dikirim</option>
            <option value="Selesai" ${order.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
            <option value="Dibatalkan" ${order.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
          </select>
        </div>
        <button type="button" class="btn-primary-admin" id="adminSaveModalStatusBtn">
          Simpan Status
        </button>
      </div>
    `;

    // Save Tracking Button
    document.getElementById('adminSaveTrackingBtn').addEventListener('click', () => {
      const newTracking = document.getElementById('adminEditTrackingInput').value.trim();
      order.trackingNumber = newTracking;
      saveOrders(orders);
      alert('Nomor Resi berhasil diperbarui!');
    });

    // Save Status Button
    document.getElementById('adminSaveModalStatusBtn').addEventListener('click', () => {
      const newStatus = document.getElementById('adminModalStatusSelect').value;
      order.status = newStatus;
      saveOrders(orders);
      orderDetailModal.classList.remove('open');
      alert(`Status pesanan #${order.id} berhasil diubah menjadi "${newStatus}"!`);
    });

    orderDetailModal.classList.add('open');
  }

  closeOrderDetailModalBtn?.addEventListener('click', () => {
    orderDetailModal.classList.remove('open');
  });

  // Filter Tabs Event Listeners
  const filterBtns = document.querySelectorAll('#orderFilterTabs button');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderStatusFilter = btn.getAttribute('data-order-status') || 'all';
      renderOrders();
    });
  });

  // Order Search Input Listener
  const searchInput = document.getElementById('orderSearchInput');
  searchInput?.addEventListener('input', (e) => {
    currentOrderSearchQuery = e.target.value.trim();
    renderOrders();
  });

  // AUTOMATED TEST SUITE INTEGRATION
  const runAutoTestBtn = document.getElementById('runAutoTestBtn');
  const testResultModal = document.getElementById('testResultModal');
  const closeTestResultModalBtn = document.getElementById('closeTestResultModalBtn');
  const closeTestResultModalDoneBtn = document.getElementById('closeTestResultModalDoneBtn');

  const closeTestModal = () => testResultModal.classList.remove('open');
  closeTestResultModalBtn?.addEventListener('click', closeTestModal);
  closeTestResultModalDoneBtn?.addEventListener('click', closeTestModal);

  runAutoTestBtn?.addEventListener('click', async () => {
    if (!window.VivereTransaction || typeof window.VivereTransaction.runAutomatedTest !== 'function') {
      alert('Sistem pengujian otomatis belum termuat.');
      return;
    }

    const banner = document.getElementById('testStatusBanner');
    const logsContainer = document.getElementById('testLogsContainer');
    banner.style.background = 'rgba(245, 158, 11, 0.15)';
    banner.style.color = '#F59E0B';
    banner.textContent = '⏳ Menjalankan pengujian otomatis end-to-end...';
    logsContainer.innerHTML = '<div>Inisialisasi pipeline pengujian...</div>';
    testResultModal.classList.add('open');

    const result = await window.VivereTransaction.runAutomatedTest();

    logsContainer.innerHTML = result.logs.map(l => `
      <div style="color: ${l.success ? '#10B981' : '#EF4444'};">
        <span style="color: #9E9790;">[${l.time}]</span> ${l.message}
      </div>
    `).join('');

    if (result.success) {
      banner.style.background = 'rgba(16, 185, 129, 0.15)';
      banner.style.color = '#10B981';
      banner.textContent = `✓ Seluruh 7 Pengujian Otomatis Berhasil! Pesanan Uji: ${result.testOrderId}`;
    } else {
      banner.style.background = 'rgba(239, 68, 68, 0.15)';
      banner.style.color = '#EF4444';
      banner.textContent = `✕ Pengujian Gagal: ${result.error}`;
    }

    // Refresh orders and metrics in admin view
    renderOrders();
    updateDashboardStats();
  });

  // Initial render
  renderOrders();
  updateDashboardStats();

  // Load orders dari Supabase (async, akan update tampilan setelah data masuk)
  loadOrdersFromSupabase();

  // Listen to order creation across window
  window.addEventListener('vivere:order-created', () => {
    loadOrdersFromSupabase();
  });

  // 5. SUPABASE SETTINGS FORM
  const adminSupabaseForm = document.getElementById('adminSupabaseForm');
  const adminCfgUrl = document.getElementById('adminCfgUrl');
  const adminCfgKey = document.getElementById('adminCfgKey');
  const adminModalAlert = document.getElementById('adminModalAlert');
  const adminResetDemoBtn = document.getElementById('adminResetDemoBtn');

  if (adminCfgUrl) adminCfgUrl.value = localStorage.getItem('vivere_supabase_url') || '';
  if (adminCfgKey) adminCfgKey.value = localStorage.getItem('vivere_supabase_key') || '';

  adminSupabaseForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = adminCfgUrl.value.trim();
    const key = adminCfgKey.value.trim();

    adminModalAlert.className = 'auth-alert info';
    adminModalAlert.textContent = 'Menguji koneksi ke Supabase...';
    adminModalAlert.style.display = 'flex';

    const test = await auth.testConnection(url, key);
    if (!test.success) {
      adminModalAlert.className = 'auth-alert error';
      adminModalAlert.textContent = `Koneksi Gagal: ${test.error}. Pastikan kredensial benar.`;
      return;
    }

    auth.saveConfig(url, key);
    adminModalAlert.className = 'auth-alert success';
    adminModalAlert.textContent = 'Koneksi Supabase Berhasil! Konfigurasi aktif di seluruh website.';
  });

  adminResetDemoBtn?.addEventListener('click', () => {
    if (confirm('Kembalikan konfigurasi ke Mode Demo bawaan?')) {
      auth.clearConfig();
      if (adminCfgUrl) adminCfgUrl.value = '';
      if (adminCfgKey) adminCfgKey.value = '';
      adminModalAlert.className = 'auth-alert info';
      adminModalAlert.textContent = 'Mode Demo bawaan diaktifkan kembali.';
      adminModalAlert.style.display = 'flex';
    }
  });
});
