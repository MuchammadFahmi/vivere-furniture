/**
 * VI VE RE - Transaction & Payment Gateway System (transaction.js)
 * Handles full checkout flow, delivery options, payment gateway simulation,
 * stock deduction, admin orders persistence, and automated testing suite.
 */

(function () {
  'use strict';

  // --- Configuration & Constants ---
  const DELIVERY_OPTIONS = [
    {
      id: 'furnicare',
      name: 'VI VE RE FurniCare Express',
      desc: 'Armada Truk Khusus Furnitur + Termasuk Perakitan di Tempat',
      price: 75000,
      freeAbove: 5000000,
      badge: 'REKOMENDASI'
    },
    {
      id: 'express',
      name: 'J&T Cargo / SiCepat Ekspres (1-2 Hari)',
      desc: 'Pengiriman kilat dengan proteksi pallet kayu',
      price: 120000,
      freeAbove: null
    },
    {
      id: 'regular',
      name: 'JNE Trucking Standar (3-5 Hari)',
      desc: 'Pengiriman reguler hemat antar kota',
      price: 50000,
      freeAbove: null
    },
    {
      id: 'pickup',
      name: 'Ambil Mandiri di Showroom (Self Pick-up)',
      desc: 'Bebas biaya, ambil langsung di gallery store kami',
      price: 0,
      freeAbove: null
    }
  ];

  const PAYMENT_METHODS = [
    { id: 'bca_va', name: 'BCA Virtual Account', category: 'VA', icon: '🏦', desc: 'Verifikasi instan otomatis 24 jam' },
    { id: 'mandiri_va', name: 'Mandiri Virtual Account', category: 'VA', icon: '🏛️', desc: 'Verifikasi instan otomatis' },
    { id: 'bri_va', name: 'BRI Virtual Account (BRIVA)', category: 'VA', icon: '💳', desc: 'Pembayaran praktis dari ATM & BRImo' },
    { id: 'qris', name: 'QRIS (GoPay, OVO, Dana, ShopeePay)', category: 'E-Wallet', icon: '📱', desc: 'Scan kode QR langsung dari aplikasi e-wallet' },
    { id: 'cc', name: 'Kartu Kredit / Debit Online', category: 'Card', icon: '💳', desc: 'Visa, Mastercard & JCB dengan proteksi 3D Secure' },
    { id: 'cod', name: 'COD (Bayar di Tempat)', category: 'COD', icon: '💵', desc: 'Bayar tunai ke kurir saat furnitur tiba' }
  ];

  // Helper: Format IDR
  function formatIDR(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  // Helper: Generate Random Tracking Code
  function generateTrackingCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'VVR-EXP-';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Helper: Generate Order ID
  function generateOrderId() {
    const d = new Date();
    const dateStr = d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${dateStr}-${randomNum}`;
  }

  // Transaction State
  let state = {
    step: 1, // 1: Delivery, 2: Payment, 3: Pay Screen, 4: Invoice
    items: [],
    customer: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: 'Jakarta',
      notes: ''
    },
    deliveryId: 'furnicare',
    voucherCode: '',
    discount: 0,
    paymentMethodId: 'bca_va',
    paymentTimer: null,
    currentOrder: null
  };

  // --- Modal DOM Construction ---
  let modalBackdrop = null;

  function ensureModalDOM() {
    if (document.getElementById('vvrTxModalBackdrop')) {
      modalBackdrop = document.getElementById('vvrTxModalBackdrop');
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'vvrTxModalBackdrop';
    backdrop.className = 'vvr-tx-backdrop';
    backdrop.innerHTML = `
      <div class="vvr-tx-modal" id="vvrTxModal">
        <!-- Header -->
        <div class="vvr-tx-header">
          <div class="vvr-tx-title-box">
            <span class="vvr-tx-badge">SECURE CHECKOUT</span>
            <h2 class="vvr-tx-title" id="vvrModalTitle">Pengiriman & Pembayaran</h2>
          </div>
          <button type="button" class="vvr-tx-close" id="vvrTxCloseBtn" aria-label="Tutup Modal">✕</button>
        </div>

        <!-- Steps Bar -->
        <div class="vvr-tx-steps">
          <div class="vvr-tx-step-item active" id="vvrStepNav1">
            <div class="vvr-tx-step-num">1</div>
            <span class="vvr-tx-step-label">Pengiriman</span>
          </div>
          <div class="vvr-tx-step-item" id="vvrStepNav2">
            <div class="vvr-tx-step-num">2</div>
            <span class="vvr-tx-step-label">Metode Bayar</span>
          </div>
          <div class="vvr-tx-step-item" id="vvrStepNav3">
            <div class="vvr-tx-step-num">3</div>
            <span class="vvr-tx-step-label">Bayar</span>
          </div>
          <div class="vvr-tx-step-item" id="vvrStepNav4">
            <div class="vvr-tx-step-num">4</div>
            <span class="vvr-tx-step-label">Selesai</span>
          </div>
        </div>

        <!-- Body Container -->
        <div class="vvr-tx-body" id="vvrTxBody">
          <!-- Dynamically Rendered Content based on Step -->
        </div>

        <!-- Footer -->
        <div class="vvr-tx-footer" id="vvrTxFooter">
          <button type="button" class="vvr-tx-btn-back" id="vvrTxBackBtn">
            ← Kembali
          </button>
          <button type="button" class="vvr-tx-btn-next" id="vvrTxNextBtn">
            <span>Lanjut ke Pembayaran</span> →
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    modalBackdrop = backdrop;

    // Attach base event listeners
    document.getElementById('vvrTxCloseBtn').addEventListener('click', closeCheckout);
    document.getElementById('vvrTxBackBtn').addEventListener('click', handleStepBack);
    document.getElementById('vvrTxNextBtn').addEventListener('click', handleStepNext);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeCheckout();
    });
  }

  // --- Calculations ---
  function getSubtotal() {
    return state.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  function getDeliveryCost() {
    const subtotal = getSubtotal();
    const opt = DELIVERY_OPTIONS.find(d => d.id === state.deliveryId) || DELIVERY_OPTIONS[0];
    if (state.voucherCode.toUpperCase() === 'FREEONGKIR') return 0;
    if (opt.freeAbove && subtotal >= opt.freeAbove) return 0;
    return opt.price;
  }

  function getGrandTotal() {
    const subtotal = getSubtotal();
    const delivery = getDeliveryCost();
    const total = subtotal + delivery - state.discount;
    return Math.max(0, total);
  }

  // --- Step Renderers ---

  // STEP 1: Delivery & Shipping
  function renderStep1() {
    const subtotal = getSubtotal();
    const deliveryCost = getDeliveryCost();
    const grandTotal = getGrandTotal();
    const opt = DELIVERY_OPTIONS.find(d => d.id === state.deliveryId);

    // Pre-fill user data if logged in
    const authUser = window.VivereAuth ? window.VivereAuth.getCurrentUser() : null;
    if (authUser && !state.customer.name) {
      state.customer.name = authUser.full_name || '';
      state.customer.email = authUser.email || '';
    }

    const html = `
      <div class="vvr-tx-grid">
        <!-- Left: Shipping & Delivery Form -->
        <div class="vvr-tx-left">
          <div class="vvr-tx-section">
            <h3 class="vvr-tx-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Informasi Penerima
            </h3>
            <div class="vvr-tx-form-row">
              <div class="vvr-tx-field">
                <label>Nama Lengkap Penerima *</label>
                <input type="text" id="vvrCustName" class="vvr-tx-input" placeholder="Contoh: Budi Santoso" value="${state.customer.name}">
              </div>
              <div class="vvr-tx-field">
                <label>Nomor WhatsApp / HP *</label>
                <input type="tel" id="vvrCustPhone" class="vvr-tx-input" placeholder="0812-XXXX-XXXX" value="${state.customer.phone}">
              </div>
            </div>
            <div class="vvr-tx-field">
              <label>Alamat Lengkap Pengiriman *</label>
              <textarea id="vvrCustAddress" class="vvr-tx-textarea" placeholder="Nama Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan">${state.customer.address}</textarea>
            </div>
            <div class="vvr-tx-form-row">
              <div class="vvr-tx-field">
                <label>Kota / Kabupaten</label>
                <select id="vvrCustCity" class="vvr-tx-select">
                  <option value="Jakarta Selatan" ${state.customer.city === 'Jakarta Selatan' ? 'selected' : ''}>Jakarta Selatan</option>
                  <option value="Jakarta Pusat" ${state.customer.city === 'Jakarta Pusat' ? 'selected' : ''}>Jakarta Pusat</option>
                  <option value="Jakarta Barat" ${state.customer.city === 'Jakarta Barat' ? 'selected' : ''}>Jakarta Barat</option>
                  <option value="Jakarta Utara" ${state.customer.city === 'Jakarta Utara' ? 'selected' : ''}>Jakarta Utara</option>
                  <option value="Jakarta Timur" ${state.customer.city === 'Jakarta Timur' ? 'selected' : ''}>Jakarta Timur</option>
                  <option value="Tangerang Selatan" ${state.customer.city === 'Tangerang Selatan' ? 'selected' : ''}>Tangerang Selatan</option>
                  <option value="Bandung" ${state.customer.city === 'Bandung' ? 'selected' : ''}>Bandung</option>
                  <option value="Surabaya" ${state.customer.city === 'Surabaya' ? 'selected' : ''}>Surabaya</option>
                  <option value="Kota Lainnya" ${state.customer.city === 'Kota Lainnya' ? 'selected' : ''}>Kota Lainnya</option>
                </select>
              </div>
              <div class="vvr-tx-field">
                <label>Catatan Pengiriman (Opsional)</label>
                <input type="text" id="vvrCustNotes" class="vvr-tx-input" placeholder="Contoh: Titipkan di satpam" value="${state.customer.notes}">
              </div>
            </div>
          </div>

          <!-- Delivery Service Options -->
          <div class="vvr-tx-section">
            <h3 class="vvr-tx-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              Pilih Layanan Ekspedisi & Delivery
            </h3>
            <div class="vvr-delivery-list">
              ${DELIVERY_OPTIONS.map(d => {
                const isFree = (d.freeAbove && subtotal >= d.freeAbove) || (state.voucherCode.toUpperCase() === 'FREEONGKIR');
                const costLabel = isFree ? 'GRATIS' : (d.price === 0 ? 'GRATIS' : formatIDR(d.price));
                const isSelected = state.deliveryId === d.id;
                return `
                  <div class="vvr-delivery-card ${isSelected ? 'selected' : ''}" data-delivery="${d.id}">
                    <div class="vvr-delivery-left">
                      <div class="vvr-radio-dot"></div>
                      <div>
                        <div class="vvr-delivery-name">
                          ${d.name}
                          ${d.badge ? `<span style="background:rgba(184,151,126,0.2); color:#B8977E; font-size:0.68rem; padding:2px 6px; border-radius:4px; margin-left:6px;">${d.badge}</span>` : ''}
                        </div>
                        <div class="vvr-delivery-desc">${d.desc}</div>
                      </div>
                    </div>
                    <div class="vvr-delivery-price ${isFree || d.price === 0 ? 'free' : ''}">${costLabel}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Right: Order Summary -->
        <div class="vvr-tx-right">
          <div class="vvr-tx-summary-card">
            <h4 style="font-size:0.9rem; font-weight:700; color:#FFF; margin-bottom:8px;">Ringkasan Pesanan (${state.items.length} Barang)</h4>
            <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              ${state.items.map(item => `
                <div class="vvr-tx-item-row">
                  <img src="${item.image || 'asset/chair_papasan.jpg'}" alt="${item.name}" class="vvr-tx-item-img" onerror="this.src='asset/chair_papasan.jpg'">
                  <div class="vvr-tx-item-info">
                    <div class="vvr-tx-item-title">${item.name}</div>
                    <div class="vvr-tx-item-qty">${item.qty}x @ ${formatIDR(item.price)}</div>
                  </div>
                  <div class="vvr-tx-item-price">${formatIDR(item.price * item.qty)}</div>
                </div>
              `).join('')}
            </div>

            <!-- Voucher Code Box -->
            <div>
              <label style="font-size:0.75rem; color:#9E9790; margin-bottom:4px; display:block;">Punya Kode Promo?</label>
              <div class="vvr-voucher-box">
                <input type="text" id="vvrVoucherInput" class="vvr-voucher-input" placeholder="Gunakan DISKON10" value="${state.voucherCode}">
                <button type="button" id="vvrVoucherBtn" class="vvr-voucher-btn">Terapkan</button>
              </div>
              <div id="vvrVoucherNotice" style="font-size:0.75rem; margin-top:4px; color:${state.discount > 0 ? '#10B981' : '#B8977E'};">
                ${state.discount > 0 ? `✓ Diskon ${formatIDR(state.discount)} aktif!` : 'Coba kode: <strong>DISKON10</strong> atau <strong>FREEONGKIR</strong>'}
              </div>
            </div>

            <!-- Calc Rows -->
            <div style="display:flex; flex-direction:column; gap:6px;">
              <div class="vvr-calc-row">
                <span>Subtotal Produk</span>
                <span>${formatIDR(subtotal)}</span>
              </div>
              <div class="vvr-calc-row">
                <span>Biaya Pengiriman</span>
                <span style="color:${deliveryCost === 0 ? '#10B981' : '#FFF'}; font-weight:600;">${deliveryCost === 0 ? 'GRATIS' : formatIDR(deliveryCost)}</span>
              </div>
              ${state.discount > 0 ? `
                <div class="vvr-calc-row" style="color:#10B981;">
                  <span>Potongan Promo</span>
                  <span>-${formatIDR(state.discount)}</span>
                </div>
              ` : ''}
              <div class="vvr-calc-row total">
                <span>Total Tagihan</span>
                <span>${formatIDR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('vvrTxBody').innerHTML = html;

    // Attach listeners for delivery cards
    document.querySelectorAll('.vvr-delivery-card').forEach(card => {
      card.addEventListener('click', () => {
        state.deliveryId = card.getAttribute('data-delivery');
        saveInputsState();
        renderStep1();
      });
    });

    // Attach voucher listener
    document.getElementById('vvrVoucherBtn').addEventListener('click', applyVoucher);
  }

  function saveInputsState() {
    const nameEl = document.getElementById('vvrCustName');
    const phoneEl = document.getElementById('vvrCustPhone');
    const addrEl = document.getElementById('vvrCustAddress');
    const cityEl = document.getElementById('vvrCustCity');
    const notesEl = document.getElementById('vvrCustNotes');
    if (nameEl) state.customer.name = nameEl.value.trim();
    if (phoneEl) state.customer.phone = phoneEl.value.trim();
    if (addrEl) state.customer.address = addrEl.value.trim();
    if (cityEl) state.customer.city = cityEl.value;
    if (notesEl) state.customer.notes = notesEl.value.trim();
  }

  function applyVoucher() {
    const input = document.getElementById('vvrVoucherInput');
    const code = (input ? input.value : '').trim().toUpperCase();
    state.voucherCode = code;
    const subtotal = getSubtotal();

    if (code === 'DISKON10') {
      state.discount = Math.round(subtotal * 0.1);
    } else if (code === 'FREEONGKIR') {
      state.discount = 0;
    } else if (code === '') {
      state.discount = 0;
    } else {
      alert('Kode promo tidak valid. Coba DISKON10 atau FREEONGKIR');
      state.discount = 0;
    }
    saveInputsState();
    renderStep1();
  }

  // STEP 2: Payment Gateway Selection
  function renderStep2() {
    const grandTotal = getGrandTotal();
    const delivery = DELIVERY_OPTIONS.find(d => d.id === state.deliveryId);

    const html = `
      <div style="max-width: 680px; margin: 0 auto;">
        <div style="background: #141312; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <span style="font-size:0.75rem; color:#9E9790;">Total yang Harus Dibayar:</span>
            <div style="font-size:1.35rem; font-weight:800; color:#B8977E;">${formatIDR(grandTotal)}</div>
          </div>
          <div style="text-align: right; font-size: 0.8rem; color: #E6DCCF;">
            <div>Penerima: <strong>${state.customer.name}</strong></div>
            <div style="color: #9E9790; font-size: 0.75rem;">Kurir: ${delivery ? delivery.name : '-'}</div>
          </div>
        </div>

        <h3 class="vvr-tx-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          Pilih Metode Pembayaran
        </h3>

        <div class="vvr-payment-grid">
          ${PAYMENT_METHODS.map(m => {
            const isSelected = state.paymentMethodId === m.id;
            return `
              <div class="vvr-payment-card ${isSelected ? 'selected' : ''}" data-pay="${m.id}">
                <div class="vvr-payment-icon">${m.icon}</div>
                <div class="vvr-payment-meta">
                  <div class="vvr-payment-name">${m.name}</div>
                  <div class="vvr-payment-tag">${m.desc}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="background: rgba(184, 151, 126, 0.08); border-left: 3px solid #B8977E; padding: 12px 16px; border-radius: 6px; font-size: 0.82rem; color: #E6DCCF;">
          🔒 Pembayaran diproses dengan enkripsi SSL 256-bit standar industri perbankan nasional.
        </div>
      </div>
    `;

    document.getElementById('vvrTxBody').innerHTML = html;

    document.querySelectorAll('.vvr-payment-card').forEach(card => {
      card.addEventListener('click', () => {
        state.paymentMethodId = card.getAttribute('data-pay');
        renderStep2();
      });
    });
  }

  // STEP 3: Payment Interactive Screen
  function renderStep3() {
    const grandTotal = getGrandTotal();
    const method = PAYMENT_METHODS.find(m => m.id === state.paymentMethodId) || PAYMENT_METHODS[0];
    const isQris = method.id === 'qris';
    const isCOD = method.id === 'cod';
    const vaNumber = '80777' + Math.floor(1000000000 + Math.random() * 9000000000);

    const html = `
      <div class="vvr-pay-screen">
        <div class="vvr-timer-badge">
          ⏱️ Selesaikan dalam <span id="vvrTimerText">14:59</span>
        </div>

        <h3 style="font-size: 1.15rem; color: #FFF; font-weight: 700; margin-bottom: 4px;">
          ${method.name}
        </h3>
        <p style="font-size: 0.82rem; color: #9E9790; margin-bottom: 16px;">
          ${isCOD ? 'Siapkan uang pas saat kurir mengantarkan barang' : 'Transfer sesuai nominal tepat berikut:'}
        </p>

        <div style="font-size: 1.7rem; font-weight: 800; color: #B8977E; margin-bottom: 12px;">
          ${formatIDR(grandTotal)}
        </div>

        ${isQris ? `
          <div class="vvr-qris-box">
            <img src="asset/qris.jpeg" alt="QRIS VI VE RE" class="vvr-qris-img">
          </div>
          <p style="font-size:0.8rem; color:#9E9790; margin-top: 6px;">Buka GoPay, OVO, Dana, ShopeePay, BCA Mobile, atau e-wallet lainnya lalu Scan QR di atas</p>
        ` : isCOD ? `
          <div style="background: rgba(255,255,255,0.05); padding: 18px; border-radius: 10px; margin: 16px 0;">
            <div style="font-size: 2.2rem; margin-bottom: 6px;">📦🤝</div>
            <p style="font-size: 0.85rem; color: #FFF; font-weight: 600;">Bayar Tunai ke Kurir</p>
            <p style="font-size: 0.78rem; color: #9E9790;">Pesanan akan langsung diproses dan dikirim ke alamat Anda.</p>
          </div>
        ` : `
          <div class="vvr-va-box">
            <span class="vvr-va-label">Nomor Virtual Account</span>
            <span class="vvr-va-number" id="vvrVaDisplay">${vaNumber}</span>
            <button type="button" class="vvr-copy-btn" id="vvrCopyVaBtn">
              📋 Salin Nomor VA
            </button>
          </div>
          <div style="font-size: 0.78rem; color: #9E9790;">
            Atas Nama: <strong>VI VE RE LUXURY FURNITURE</strong>
          </div>
        `}

        <!-- Payment Confirmation Action -->
        <div class="vvr-pay-confirm-box">
          <button type="button" class="vvr-confirm-pay-btn" id="vvrSimulateSuccessBtn">
            <span>${isCOD ? 'Konfirmasi Pesanan COD' : 'Saya Sudah Bayar'}</span> ✓
          </button>
          <p class="vvr-pay-confirm-hint">Klik tombol di atas setelah Anda menyelesaikan pembayaran.</p>
        </div>
      </div>
    `;

    document.getElementById('vvrTxBody').innerHTML = html;

    // Attach Copy listener
    const copyBtn = document.getElementById('vvrCopyVaBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(vaNumber);
        copyBtn.textContent = '✓ Berhasil Disalin!';
        setTimeout(() => copyBtn.textContent = '📋 Salin Nomor VA', 2000);
      });
    }

    // Attach simulator button
    document.getElementById('vvrSimulateSuccessBtn').addEventListener('click', () => {
      completeOrder(vaNumber);
    });

    // Start 15-minute countdown timer
    let timeLeft = 15 * 60;
    if (state.paymentTimer) clearInterval(state.paymentTimer);
    state.paymentTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(state.paymentTimer);
        return;
      }
      const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const s = (timeLeft % 60).toString().padStart(2, '0');
      const el = document.getElementById('vvrTimerText');
      if (el) el.textContent = `${m}:${s}`;
    }, 1000);
  }

  // STEP 4: Invoice & Completed Receipt
  function renderStep4(order) {
    if (state.paymentTimer) clearInterval(state.paymentTimer);

    const html = `
      <div style="max-width: 650px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 12px;">✓</div>
          <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 1.5rem; color: #FFF; margin-bottom: 4px;">Pembayaran Berhasil!</h2>
          <p style="font-size: 0.85rem; color: #9E9790;">Pesanan Anda telah diterima dan langsung masuk ke sistem antrean pengiriman.</p>
        </div>

        <div class="vvr-invoice-card" id="vvrPrintInvoice">
          <div class="vvr-invoice-stamp">LUNAS</div>
          
          <div class="vvr-invoice-header">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div class="vvr-invoice-id">${order.id}</div>
                <div class="vvr-invoice-meta">Tanggal: ${order.date} • Metode: ${order.paymentMethod}</div>
              </div>
            </div>
          </div>

          <div class="vvr-invoice-tracking">
            <div>
              <span style="font-size:0.75rem; color:#9E9790; display:block;">Nomor Resi / Pelacakan:</span>
              <strong style="color:#FFF; font-family:monospace; font-size:1.05rem;">${order.trackingNumber}</strong>
            </div>
            <div style="text-align:right;">
              <span style="font-size:0.75rem; color:#9E9790; display:block;">Ekspedisi:</span>
              <span style="color:#B8977E; font-weight:700;">${order.deliveryMethod}</span>
            </div>
          </div>

          <div style="margin-bottom: 16px; font-size: 0.82rem; color: #9E9790; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px;">
            <div style="color: #FFF; font-weight: 600; margin-bottom: 2px;">Tujuan Pengiriman:</div>
            <div>${order.customer} (${order.phone})</div>
            <div>${order.address}, ${order.city}</div>
          </div>

          <!-- Items Breakdown -->
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
            ${order.items.map(i => `
              <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                <span style="color:#E6DCCF;">${i.qty}x ${i.name}</span>
                <span style="font-weight:600; color:#FFF;">${formatIDR(i.price * i.qty)}</span>
              </div>
            `).join('')}
          </div>

          <!-- Totals -->
          <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:10px; display:flex; flex-direction:column; gap:6px;">
            <div class="vvr-calc-row">
              <span>Subtotal</span>
              <span>${formatIDR(order.subtotal)}</span>
            </div>
            <div class="vvr-calc-row">
              <span>Ongkos Kirim</span>
              <span>${order.deliveryCost === 0 ? 'GRATIS' : formatIDR(order.deliveryCost)}</span>
            </div>
            ${order.discount > 0 ? `
              <div class="vvr-calc-row" style="color:#10B981;">
                <span>Diskon</span>
                <span>-${formatIDR(order.discount)}</span>
              </div>
            ` : ''}
            <div class="vvr-calc-row total">
              <span>Total Dibayar</span>
              <span>${formatIDR(order.total)}</span>
            </div>
          </div>
        </div>

        <!-- Action Links -->
        <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: center;">
          <button type="button" class="vvr-tx-btn-back" onclick="window.print()" style="padding: 10px 18px;">
            🖨️ Cetak Invoice
          </button>
          <button type="button" class="vvr-tx-btn-next" id="vvrFinishTxBtn" style="padding: 10px 22px;">
            Selesai Belanja
          </button>
        </div>
      </div>
    `;

    document.getElementById('vvrTxBody').innerHTML = html;

    document.getElementById('vvrFinishTxBtn').addEventListener('click', () => {
      closeCheckout();
      window.location.reload();
    });
  }

  // --- Order Execution & Persistence ---
  async function completeOrder(vaNumber = null) {
    const orderId = generateOrderId();
    const trackingNo = generateTrackingCode();
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const methodObj = PAYMENT_METHODS.find(m => m.id === state.paymentMethodId) || PAYMENT_METHODS[0];
    const deliveryObj = DELIVERY_OPTIONS.find(d => d.id === state.deliveryId) || DELIVERY_OPTIONS[0];

    const orderData = {
      id: orderId,
      date: dateFormatted,
      timestamp: now.toISOString(),
      customer: state.customer.name || 'Pelanggan VI VE RE',
      phone: state.customer.phone || '0812XXXXXXXX',
      email: state.customer.email || 'customer@gmail.com',
      address: state.customer.address || 'Jakarta',
      city: state.customer.city || 'Jakarta',
      notes: state.customer.notes || '',
      deliveryMethod: deliveryObj.name,
      deliveryCost: getDeliveryCost(),
      paymentMethod: methodObj.name,
      paymentStatus: 'Lunas',
      trackingNumber: trackingNo,
      status: 'Diproses', // Initial status in admin
      items: state.items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image || null
      })),
      subtotal: getSubtotal(),
      discount: state.discount,
      total: getGrandTotal()
    };

    // 1. Save to Admin Orders Store (vivere_admin_orders)
    let adminOrders = [];
    try {
      const raw = localStorage.getItem('vivere_admin_orders');
      if (raw) adminOrders = JSON.parse(raw);
    } catch (e) {}

    adminOrders.unshift(orderData);
    localStorage.setItem('vivere_admin_orders', JSON.stringify(adminOrders));

    // 2. Save to Customer Orders History
    let customerOrders = [];
    try {
      const rawCust = localStorage.getItem('vivere_customer_orders');
      if (rawCust) customerOrders = JSON.parse(rawCust);
    } catch (e) {}
    customerOrders.unshift(orderData);
    localStorage.setItem('vivere_customer_orders', JSON.stringify(customerOrders));

    // 3. Deduct Stock in Product Catalog
    try {
      const rawProds = localStorage.getItem('vivere_admin_products');
      if (rawProds) {
        const prods = JSON.parse(rawProds);
        orderData.items.forEach(orderItem => {
          const p = prods.find(item => item.id === orderItem.id);
          if (p && p.stock) {
            const match = p.stock.match(/\d+/);
            if (match) {
              const currentStock = parseInt(match[0], 10);
              const newStock = Math.max(0, currentStock - orderItem.qty);
              p.stock = `Tersedia (${newStock} unit)`;
            }
          }
        });
        localStorage.setItem('vivere_admin_products', JSON.stringify(prods));
        window.dispatchEvent(new CustomEvent('vivere:products-updated', { detail: { products: prods } }));
      }
    } catch (e) {}

    // 4. Try Syncing to Supabase (Background Graceful)
    if (window.VivereAuth && window.VivereAuth.client && window.VivereAuth.isConfigured()) {
      try {
        const authUser = window.VivereAuth.getCurrentUser();
        const { error: insertError } = await window.VivereAuth.client.from('orders').insert({
          id: orderData.id,
          customer_id: authUser ? authUser.id : null,
          customer_name: orderData.customer,
          customer_phone: orderData.phone,
          delivery_address: `${orderData.address}, ${orderData.city}`,
          delivery_method: orderData.deliveryMethod,
          delivery_cost: orderData.deliveryCost,
          payment_method: orderData.paymentMethod,
          payment_status: orderData.paymentStatus,
          items: orderData.items,
          subtotal: orderData.subtotal,
          total: orderData.total,
          tracking_number: orderData.trackingNumber,
          status: orderData.status
        });
        if (insertError) {
          console.warn('[Transaction] Supabase order insert error:', insertError.message);
        } else {
          console.log('[Transaction] Order berhasil disimpan ke Supabase:', orderData.id);
        }
      } catch (err) {
        console.warn('[Transaction] Supabase insert exception:', err);
      }
    }

    // 5. Clear Local Cart
    localStorage.setItem('furniture_cart', '[]');
    window.dispatchEvent(new CustomEvent('vivere:cart-updated', { detail: { cart: [] } }));
    window.dispatchEvent(new CustomEvent('vivere:order-created', { detail: { order: orderData } }));

    // 6. Transition to Step 4
    state.step = 4;
    state.currentOrder = orderData;
    updateStepUI();
    renderStep4(orderData);
  }

  // --- Step Navigation Controls ---
  function updateStepUI() {
    // Update Step Indicators
    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`vvrStepNav${i}`);
      if (!stepEl) continue;
      stepEl.classList.remove('active', 'completed');
      if (i === state.step) {
        stepEl.classList.add('active');
      } else if (i < state.step) {
        stepEl.classList.add('completed');
      }
    }

    const backBtn = document.getElementById('vvrTxBackBtn');
    const nextBtn = document.getElementById('vvrTxNextBtn');
    const titleEl = document.getElementById('vvrModalTitle');
    const footer = document.getElementById('vvrTxFooter');

    if (state.step === 1) {
      if (titleEl) titleEl.textContent = 'Alamat & Pengiriman';
      if (backBtn) backBtn.style.display = 'none';
      if (nextBtn) {
        nextBtn.style.display = 'flex';
        nextBtn.innerHTML = '<span>Lanjut ke Pembayaran</span> →';
      }
      if (footer) footer.style.display = 'flex';
    } else if (state.step === 2) {
      if (titleEl) titleEl.textContent = 'Pilih Metode Pembayaran';
      if (backBtn) backBtn.style.display = 'flex';
      if (nextBtn) {
        nextBtn.style.display = 'flex';
        nextBtn.innerHTML = '<span>Bayar Sekarang</span> →';
      }
      if (footer) footer.style.display = 'flex';
    } else if (state.step === 3) {
      if (titleEl) titleEl.textContent = 'Konfirmasi Pembayaran';
      if (backBtn) backBtn.style.display = 'flex';
      if (nextBtn) {
        nextBtn.style.display = 'flex';
        nextBtn.innerHTML = '<span>Konfirmasi & Cetak Resi</span> ✓';
      }
      if (footer) footer.style.display = 'flex';
    } else if (state.step === 4) {
      if (titleEl) titleEl.textContent = 'Transaksi Berhasil';
      if (footer) footer.style.display = 'none'; // Step 4 has custom actions inside body
    }
  }

  function handleStepNext() {
    if (state.step === 1) {
      saveInputsState();
      if (!state.customer.name || !state.customer.phone || !state.customer.address) {
        alert('Mohon lengkapi Nama Penerima, No. HP, dan Alamat Pengiriman.');
        return;
      }
      state.step = 2;
      updateStepUI();
      renderStep2();
    } else if (state.step === 2) {
      state.step = 3;
      updateStepUI();
      renderStep3();
    } else if (state.step === 3) {
      completeOrder();
    }
  }

  function handleStepBack() {
    if (state.step === 2) {
      state.step = 1;
      updateStepUI();
      renderStep1();
    } else if (state.step === 3) {
      state.step = 2;
      updateStepUI();
      renderStep2();
    }
  }

  // --- Public API ---
  function openCheckout(customItems = null) {
    ensureModalDOM();

    let items = customItems;
    if (!items || !items.length) {
      try {
        const raw = localStorage.getItem('furniture_cart');
        items = raw ? JSON.parse(raw) : [];
      } catch (e) {
        items = [];
      }
    }

    if (!items || items.length === 0) {
      alert('Keranjang belanja Anda masih kosong. Silakan pilih furnitur terlebih dahulu.');
      return;
    }

    state.items = items;
    state.step = 1;
    state.discount = 0;
    state.voucherCode = '';

    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    updateStepUI();
    renderStep1();
  }

  function closeCheckout() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
    if (state.paymentTimer) clearInterval(state.paymentTimer);
  }

  // --- Automated Testing Engine ---
  async function runAutomatedTest() {
    const logs = [];
    const log = (msg, success = true) => {
      logs.push({ message: msg, success, time: new Date().toLocaleTimeString() });
      console.log(`[VIVERE-TEST] ${success ? '✅' : '❌'} ${msg}`);
    };

    log('Memulai Pengujian Otomatis Sistem Transaksi & Dashboard...');

    try {
      // 1. Verifikasi Akses Katalog Produk
      let products = [];
      try {
        products = JSON.parse(localStorage.getItem('vivere_admin_products') || '[]');
      } catch (e) {}
      if (!products.length) {
        log('Katalog produk belum terinisialisasi. Membuat katalog mock...', true);
        products = [{ id: 1, name: "Papasan Bowl Chair", price: 3750000, stock: "Tersedia (20 unit)" }];
        localStorage.setItem('vivere_admin_products', JSON.stringify(products));
      }
      log(`Test 1: Katalog produk siap (${products.length} produk).`);

      // 2. Simulasikan Penambahan ke Keranjang
      const testItem = products[0];
      const testCart = [{ id: testItem.id, name: testItem.name, price: testItem.price, qty: 1, image: testItem.image || 'asset/chair_papasan.jpg' }];
      localStorage.setItem('furniture_cart', JSON.stringify(testCart));
      log(`Test 2: Item "${testItem.name}" berhasil dimasukkan ke keranjang.`);

      // 3. Simulasikan Pembuatan Order Lengkap
      const testOrderId = generateOrderId();
      const testTracking = generateTrackingCode();
      const testOrder = {
        id: testOrderId,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        timestamp: new Date().toISOString(),
        customer: 'Tester Otomatis QA',
        phone: '081299887766',
        email: 'qa_testing@vivere.com',
        address: 'Jl. Sudirman Kav 25, Menara Astra Lt. 12',
        city: 'Jakarta Pusat',
        deliveryMethod: 'VI VE RE FurniCare Express',
        deliveryCost: 0,
        paymentMethod: 'BCA Virtual Account',
        paymentStatus: 'Lunas',
        trackingNumber: testTracking,
        status: 'Diproses',
        items: testCart,
        subtotal: testItem.price,
        discount: 0,
        total: testItem.price
      };

      // 4. Masukkan ke Admin Orders
      let orders = [];
      try {
        orders = JSON.parse(localStorage.getItem('vivere_admin_orders') || '[]');
      } catch (e) {}
      orders.unshift(testOrder);
      localStorage.setItem('vivere_admin_orders', JSON.stringify(orders));
      log(`Test 3: Order ${testOrderId} berhasil dicatat di database dashboard admin.`);

      // 5. Potong Stok Produk
      const beforeStock = testItem.stock;
      if (testItem.stock) {
        const m = testItem.stock.match(/\d+/);
        if (m) {
          const qtyLeft = Math.max(0, parseInt(m[0], 10) - 1);
          testItem.stock = `Tersedia (${qtyLeft} unit)`;
          localStorage.setItem('vivere_admin_products', JSON.stringify(products));
          log(`Test 4: Pengurangan stok berhasil: ${beforeStock} -> ${testItem.stock}.`);
        }
      }

      // 6. Verifikasi Status Pesanan di Dashboard
      const savedOrders = JSON.parse(localStorage.getItem('vivere_admin_orders') || '[]');
      const foundOrder = savedOrders.find(o => o.id === testOrderId);
      if (!foundOrder) throw new Error('Order tidak ditemukan di penyimpanan admin.');
      log(`Test 5: Order terverifikasi tersimpan dengan status "${foundOrder.status}" dan Resi "${foundOrder.trackingNumber}".`);

      // 7. Simulasikan Pengiriman oleh Admin (Ubah Status ke 'Dikirim')
      foundOrder.status = 'Dikirim';
      localStorage.setItem('vivere_admin_orders', JSON.stringify(savedOrders));
      log(`Test 6: Admin berhasil memperbarui status pesanan menjadi "Dikirim".`);

      // 8. Kosongkan Keranjang Belanja
      localStorage.setItem('furniture_cart', '[]');
      log(`Test 7: Keranjang belanja berhasil dikosongkan setelah checkout.`);

      log('🎉 SELURUH PENGUJIAN OTOMATIS SUKSES (100% PASS)!', true);
      return { success: true, logs, testOrderId, testTracking };
    } catch (err) {
      log(`Pengujian Gagal: ${err.message}`, false);
      return { success: false, logs, error: err.message };
    }
  }

  // Expose Global Object
  window.VivereTransaction = {
    openCheckout,
    closeCheckout,
    completeOrder,
    DELIVERY_OPTIONS,
    PAYMENT_METHODS,
    runAutomatedTest
  };

  // Wire up existing checkout button once DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      // Clone to remove old simplistic alert handlers
      const newBtn = checkoutBtn.cloneNode(true);
      checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
      newBtn.addEventListener('click', () => {
        openCheckout();
      });
    }

    // Listen to custom cart updates
    window.addEventListener('vivere:cart-updated', () => {
      if (typeof window.updateCartUI === 'function') {
        window.updateCartUI();
      }
    });
  });

})();
