/**
 * VI VE RE - Universal Auth Navigation Widget (auth-nav.js)
 * Manages the User Account button in the header across all store pages.
 * Displays login redirect when unauthenticated, and user/admin profile dropdown when authenticated.
 * 
 * Menggunakan refreshSession() agar role selalu sinkron dari Supabase,
 * tidak bergantung localStorage yang berbeda antar origin/browser.
 */

(function () {

  function renderAuthNav(currentUser) {
    const auth = window.VivereAuth;
    const accountBtn = document.querySelector('.action-btn[aria-label="Account"]');
    if (!accountBtn) return;

    // Ensure wrapper exists
    let wrapper = accountBtn.closest('.auth-dropdown-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'auth-dropdown-wrapper';
      accountBtn.parentNode.insertBefore(wrapper, accountBtn);
      wrapper.appendChild(accountBtn);
    }

    // Remove existing dropdown
    const existingMenu = wrapper.querySelector('.auth-dropdown-menu');
    if (existingMenu) existingMenu.remove();

    if (!currentUser) {
      // Unauthenticated state
      accountBtn.title = 'Masuk / Daftar Akun';
      if (accountBtn.dataset.modified) {
        accountBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>`;
        delete accountBtn.dataset.modified;
      }
      accountBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
      };
      return;
    }

    // Authenticated state
    accountBtn.dataset.modified = 'true';
    const initial = (currentUser.full_name || 'U').charAt(0).toUpperCase();
    const isAdmin = currentUser.role === 'admin';

    accountBtn.title = `${currentUser.full_name} (${isAdmin ? 'Admin' : 'Customer'})`;
    accountBtn.innerHTML = `
      <div class="auth-nav-avatar ${isAdmin ? 'admin-avatar-nav' : ''}">
        ${isAdmin ? '<span class="nav-crown-icon">👑</span>' : ''}
        <span>${initial}</span>
      </div>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'auth-dropdown-menu';
    dropdown.innerHTML = `
      <div class="auth-dropdown-header">
        <div class="auth-user-name">${currentUser.full_name || 'Pengguna'}</div>
        <div class="auth-user-email">${currentUser.email || ''}</div>
        <div style="margin-top: 6px;">
          ${isAdmin
            ? '<span class="auth-role-pill admin">👑 Administrator</span>'
            : '<span class="auth-role-pill user">🛍️ Pelanggan</span>'}
        </div>
      </div>
      <div class="auth-dropdown-divider"></div>
      <div class="auth-dropdown-body">
        ${isAdmin ? `
          <a href="admin.html" class="auth-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            <span>Dashboard Admin</span>
          </a>` : ''}
        <a href="shop.html" class="auth-dropdown-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span>Katalog Produk</span>
        </a>
        <button type="button" class="auth-dropdown-item logout-item" id="navLogoutBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Keluar (Logout)</span>
        </button>
      </div>`;

    wrapper.appendChild(dropdown);

    accountBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('active');
    };

    const logoutBtn = dropdown.querySelector('#navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = async (e) => {
        e.preventDefault();
        await auth.signOut();
        window.location.href = 'login.html?msg=logout_success';
      };
    }

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  async function initAuthNav() {
    const auth = window.VivereAuth;
    if (!auth) return;

    // Render dulu pakai localStorage (instan, tidak ada loading)
    renderAuthNav(auth.getCurrentUser());

    // Lalu refresh dari Supabase secara async untuk sinkron role lintas origin/browser
    if (auth.isConfigured() && typeof auth.refreshSession === 'function') {
      const freshUser = await auth.refreshSession();
      // Re-render hanya jika data berubah
      renderAuthNav(freshUser);
    }
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthNav);
  } else {
    initAuthNav();
  }

  // React to auth state changes dynamically
  window.addEventListener('vivere:auth-changed', () => {
    const auth = window.VivereAuth;
    if (auth) renderAuthNav(auth.getCurrentUser());
  });

})();
