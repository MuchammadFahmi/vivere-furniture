/**
 * VI VE RE - Auth Page Logic (auth.js)
 * Manages login, registration, role redirection, and Supabase config modal.
 * No demo mode — requires live Supabase connection.
 */

document.addEventListener('DOMContentLoaded', () => {
  const auth = window.VivereAuth;

  // DOM Elements
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const alertBox = document.getElementById('alertBox');
  const submitLoginBtn = document.getElementById('submitLoginBtn');
  const submitRegBtn = document.getElementById('submitRegBtn');

  // Supabase Status & Modal Elements
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const openConfigModalBtn = document.getElementById('openConfigModalBtn');
  const closeConfigModalBtn = document.getElementById('closeConfigModalBtn');
  const supabaseModal = document.getElementById('supabaseModal');
  const supabaseConfigForm = document.getElementById('supabaseConfigForm');
  const cfgUrl = document.getElementById('cfgUrl');
  const cfgKey = document.getElementById('cfgKey');
  const modalAlertBox = document.getElementById('modalAlertBox');
  const resetConfigBtn = document.getElementById('resetConfigBtn');

  // Update Status Badge UI
  function updateConnectionBadge() {
    if (auth.isConfigured()) {
      statusDot.className = 'status-dot';
      statusText.textContent = 'Supabase Terhubung (Live)';
    } else {
      statusDot.className = 'status-dot demo';
      statusText.textContent = 'Belum Terhubung (Klik utk konfigurasi)';
    }
  }

  updateConnectionBadge();

  // Show warning if Supabase is NOT configured
  if (!auth.isConfigured()) {
    showAlert('⚠️ Supabase belum dikonfigurasi. Silakan klik tombol pengaturan di atas untuk menghubungkan database Anda sebelum login atau mendaftar.', 'error');
  }

  // Check URL params for errors or messages
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'unauthorized') {
    showAlert('Akses ditolak: Anda harus login sebagai Administrator untuk membuka halaman tersebut.', 'error');
  } else if (urlParams.get('msg') === 'logout_success') {
    showAlert('Anda telah berhasil keluar dari akun.', 'success');
  }

  // Check if already logged in
  const currentUser = auth.getCurrentUser();
  if (currentUser) {
    if (currentUser.role === 'admin') {
      showAlert(`Anda sudah login sebagai Admin (${currentUser.full_name}). <a href="admin.html" style="font-weight:700; color:inherit; text-decoration:underline;">Buka Dashboard Admin</a> atau <a href="#" id="inlineLogoutBtn" style="color:inherit; text-decoration:underline;">Keluar</a>`, 'info');
    } else {
      showAlert(`Anda sudah login sebagai Pelanggan (${currentUser.full_name}). <a href="index.html" style="font-weight:700; color:inherit; text-decoration:underline;">Kembali Berbelanja</a> atau <a href="#" id="inlineLogoutBtn" style="color:inherit; text-decoration:underline;">Keluar</a>`, 'info');
    }
    const inlineLogout = document.getElementById('inlineLogoutBtn');
    if (inlineLogout) {
      inlineLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        await auth.signOut();
        window.location.href = 'login.html?msg=logout_success';
      });
    }
  }

  // Tab switching
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
    authTitle.textContent = 'Selamat Datang';
    authSubtitle.textContent = 'Masuk ke akun Anda untuk mulai berbelanja.';
    clearAlert();
  });

  tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    authTitle.textContent = 'Daftar Akun Baru';
    authSubtitle.textContent = 'Buat akun baru untuk mulai berbelanja.';
    clearAlert();
  });

  // Password visibility toggle
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.style.color = 'var(--accent)';
        } else {
          input.type = 'password';
          btn.style.color = 'var(--text-muted)';
        }
      }
    });
  });

  // Handle Login Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!auth.isConfigured()) {
      showAlert('⚠️ Supabase belum dikonfigurasi. Silakan klik tombol pengaturan di atas untuk menghubungkan database terlebih dahulu.', 'error');
      return;
    }

    setLoading(submitLoginBtn, true, 'Memproses...');

    try {
      const result = await auth.signIn(email, password);

      if (!result.success) {
        showAlert(result.error, 'error');
        setLoading(submitLoginBtn, false, 'Masuk Sekarang');
        return;
      }

      showAlert(`Login berhasil! Selamat datang, <strong>${result.user.full_name}</strong>. Mengalihkan...`, 'success');

      setTimeout(() => {
        if (result.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          const redirect = urlParams.get('redirect') || 'index.html';
          window.location.href = redirect;
        }
      }, 1000);

    } catch (err) {
      showAlert('Terjadi kesalahan yang tidak terduga: ' + err.message, 'error');
      setLoading(submitLoginBtn, false, 'Masuk Sekarang');
    }
  });

  // Handle Register Submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = 'user';

    if (!auth.isConfigured()) {
      showAlert('⚠️ Supabase belum dikonfigurasi. Silakan klik tombol pengaturan di atas untuk menghubungkan database terlebih dahulu.', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Kata sandi minimal harus 6 karakter.', 'error');
      return;
    }

    setLoading(submitRegBtn, true, 'Mendaftarkan...');

    try {
      const result = await auth.signUp(email, password, fullName, role);

      if (!result.success) {
        showAlert(result.error, 'error');
        setLoading(submitRegBtn, false, 'Daftar Akun');
        return;
      }

      if (result.needsConfirmation) {
        showAlert('✅ Pendaftaran berhasil! Tautan konfirmasi telah dikirim ke email Anda. Silakan verifikasi email Anda sebelum login.', 'info');
        setLoading(submitRegBtn, false, 'Daftar Akun');
        return;
      }

      showAlert(`✅ Akun berhasil dibuat! Mengalihkan...`, 'success');

      setTimeout(() => {
        if (result.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          const redirect = urlParams.get('redirect') || 'index.html';
          window.location.href = redirect;
        }
      }, 1200);

    } catch (err) {
      showAlert('Gagal mendaftar: ' + err.message, 'error');
      setLoading(submitRegBtn, false, 'Daftar Akun');
    }
  });

  // Modal Supabase Handlers
  openConfigModalBtn.addEventListener('click', () => {
    cfgUrl.value = localStorage.getItem('vivere_supabase_url') || (window.SUPABASE_URL || '');
    cfgKey.value = localStorage.getItem('vivere_supabase_key') || (window.SUPABASE_ANON_KEY || '');
    modalAlertBox.style.display = 'none';
    supabaseModal.classList.add('open');
  });

  closeConfigModalBtn.addEventListener('click', () => {
    supabaseModal.classList.remove('open');
  });

  supabaseModal.addEventListener('click', (e) => {
    if (e.target === supabaseModal) {
      supabaseModal.classList.remove('open');
    }
  });

  // Save Supabase Config
  supabaseConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = cfgUrl.value.trim();
    const key = cfgKey.value.trim();

    showModalAlert('Menguji koneksi ke Supabase...', 'info');

    const test = await auth.testConnection(url, key);
    if (!test.success) {
      showModalAlert(`Koneksi Gagal: ${test.error}. Pastikan URL dan Anon Key benar.`, 'error');
      return;
    }

    auth.saveConfig(url, key);
    updateConnectionBadge();
    showModalAlert('✅ Koneksi Supabase Berhasil dan telah disimpan!', 'success');

    setTimeout(() => {
      supabaseModal.classList.remove('open');
      clearAlert();
      showAlert('✅ Supabase berhasil dihubungkan. Anda sekarang dapat login atau register menggunakan database Supabase Anda.', 'success');
    }, 1200);
  });

  // Reset / Clear Config
  if (resetConfigBtn) {
    resetConfigBtn.addEventListener('click', () => {
      auth.clearConfig();
      cfgUrl.value = '';
      cfgKey.value = '';
      updateConnectionBadge();
      showModalAlert('Konfigurasi Supabase telah dihapus.', 'info');
      setTimeout(() => {
        supabaseModal.classList.remove('open');
      }, 800);
    });
  }

  // Helpers
  function showAlert(msg, type = 'error') {
    alertBox.className = `auth-alert ${type}`;
    alertBox.innerHTML = `
      <div style="flex: 1;">${msg}</div>
    `;
    alertBox.style.display = 'flex';
  }

  function clearAlert() {
    alertBox.style.display = 'none';
    alertBox.innerHTML = '';
  }

  function showModalAlert(msg, type = 'info') {
    modalAlertBox.className = `auth-alert ${type}`;
    modalAlertBox.innerHTML = msg;
    modalAlertBox.style.display = 'flex';
  }

  function setLoading(btn, isLoading, text) {
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `
        <div class="spinner-ring"></div>
        <span>${text}</span>
      `;
    } else {
      btn.disabled = false;
      btn.innerHTML = `
        <span>${text}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      `;
    }
  }
});
