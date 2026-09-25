/**
 * VI VE RE - Supabase Configuration & Authentication Client
 * Provides Supabase client initialization, authentication methods,
 * and role management (user vs admin).
 */

// ============================================================
// SUPABASE CREDENTIALS — hardcoded agar semua user bisa login
// tanpa perlu konfigurasi manual di tiap browser/device.
// Anon Key aman dipakai di frontend (hanya akses publik).
// ============================================================
const SUPABASE_URL = 'https://xzkpixozekovhtsokrdu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zy1FCJfAo9o7RYB_qgHvfg_DE__kpqe';

// Expose ke window agar bisa diakses dari file JS lain (misal auth.js modal)
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Tetap baca dari localStorage jika admin ingin override lewat panel konfigurasi
const DEFAULT_SUPABASE_CONFIG = {
  url: window.localStorage.getItem('vivere_supabase_url') || SUPABASE_URL,
  anonKey: window.localStorage.getItem('vivere_supabase_key') || SUPABASE_ANON_KEY
};

class VivereAuthClient {
  constructor() {
    this.url = DEFAULT_SUPABASE_CONFIG.url;
    this.anonKey = DEFAULT_SUPABASE_CONFIG.anonKey;
    this.client = null;
    this._cleanUrl();
    this.initClient();
  }

  /**
   * Clean up the Supabase URL — strip trailing /rest/v1/ or trailing slash
   */
  _cleanUrl() {
    if (this.url) {
      this.url = this.url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    }
  }

  /**
   * Initialize Supabase client if credentials exist and Supabase JS SDK is loaded
   */
  initClient() {
    if (this.url && this.anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(this.url, this.anonKey);
        console.log('[VI VE RE Auth] Supabase Client Initialized:', this.url);
      } catch (err) {
        console.warn('[VI VE RE Auth] Failed to initialize Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  /**
   * Check if live Supabase is configured
   */
  isConfigured() {
    return !!(this.url && this.anonKey && this.client);
  }

  /**
   * Save Supabase configuration to localStorage and re-initialize
   */
  saveConfig(url, anonKey) {
    this.url = (url || '').trim();
    this.anonKey = (anonKey || '').trim();
    this._cleanUrl();
    localStorage.setItem('vivere_supabase_url', this.url);
    localStorage.setItem('vivere_supabase_key', this.anonKey);
    this.initClient();
  }

  /**
   * Clear Supabase configuration
   */
  clearConfig() {
    this.url = '';
    this.anonKey = '';
    localStorage.removeItem('vivere_supabase_url');
    localStorage.removeItem('vivere_supabase_key');
    this.client = null;
  }

  /**
   * Sign In with Email & Password (Supabase Auth only)
   */
  async signIn(email, password) {
    email = (email || '').trim().toLowerCase();

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Supabase belum dikonfigurasi. Silakan atur Supabase URL & Anon Key terlebih dahulu melalui tombol pengaturan.'
      };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Default: ambil dari user_metadata dulu
      let role = (data.user.user_metadata?.role || 'user').toLowerCase().trim();
      let fullName = data.user.user_metadata?.full_name || email.split('@')[0];

      // Coba ambil dari tabel profiles (prioritas tertinggi)
      try {
        const { data: profile, error: profileError } = await this.client
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', data.user.id)
          .single();

        if (profile && !profileError) {
          if (profile.role) role = profile.role.toLowerCase().trim();
          if (profile.full_name) fullName = profile.full_name;
        } else {
          console.warn('[VI VE RE Auth] profiles fetch error:', profileError?.message);
        }
      } catch (e) {
        console.warn('[VI VE RE Auth] profiles fetch exception:', e);
      }

      const sessionUser = {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role: role,
        is_demo: false
      };

      this._setSession(sessionUser);
      return { success: true, user: sessionUser };
    } catch (err) {
      return { success: false, error: err.message || 'Login gagal. Periksa kembali email dan password.' };
    }
  }

  /**
   * Re-validate session dari Supabase — panggil saat halaman dimuat
   * agar role selalu sinkron meski localStorage berbeda antar origin.
   */
  async refreshSession() {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await this.client.auth.getSession();
      if (error || !data.session) {
        // Tidak ada session aktif di Supabase — clear local session
        this._clearSession();
        return null;
      }

      const supabaseUser = data.session.user;
      let role = (supabaseUser.user_metadata?.role || 'user').toLowerCase().trim();
      let fullName = supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0];

      // Ambil role dari profiles table
      try {
        const { data: profile } = await this.client
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', supabaseUser.id)
          .single();

        if (profile) {
          if (profile.role) role = profile.role.toLowerCase().trim();
          if (profile.full_name) fullName = profile.full_name;
        }
      } catch (e) {}

      const sessionUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: fullName,
        role: role,
        is_demo: false
      };

      this._setSession(sessionUser);
      return sessionUser;
    } catch (e) {
      console.warn('[VI VE RE Auth] refreshSession error:', e);
      return null;
    }
  }

  /**
   * Sign Up / Register new account (Supabase Auth only)
   */
  async signUp(email, password, fullName, role = 'user') {
    email = (email || '').trim().toLowerCase();
    fullName = (fullName || '').trim() || email.split('@')[0];

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Supabase belum dikonfigurasi. Silakan atur Supabase URL & Anon Key terlebih dahulu melalui tombol pengaturan.'
      };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (error) throw error;

      // Attempt to insert directly to profiles table as well (if enabled and user is confirmed)
      if (data.user) {
        try {
          await this.client.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            role: role
          });
        } catch (e) {
          // Profile trigger might handle it
        }
      }

      const sessionUser = {
        id: data.user?.id || 'new-user',
        email: email,
        full_name: fullName,
        role: role,
        is_demo: false
      };

      // Only set session if the user is confirmed (no email verification needed)
      if (data.session) {
        this._setSession(sessionUser);
      }

      return {
        success: true,
        user: sessionUser,
        needsConfirmation: !data.session && !data.user?.confirmed_at
      };
    } catch (err) {
      return { success: false, error: err.message || 'Pendaftaran gagal.' };
    }
  }

  /**
   * Sign Out
   */
  async signOut() {
    if (this.isConfigured() && this.client) {
      try {
        await this.client.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    this._clearSession();
    return { success: true };
  }

  /**
   * Get Current Logged-in User
   */
  getCurrentUser() {
    try {
      const raw = localStorage.getItem('vivere_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if current user is an Admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  /**
   * Require Admin access on a page; if not admin, redirect to login.
   * Async: refresh session dari Supabase dulu sebelum cek role.
   */
  async requireAdmin(redirectUrl = 'login.html?error=unauthorized') {
    // Coba refresh session dari Supabase agar role selalu up-to-date
    if (this.isConfigured() && typeof this.refreshSession === 'function') {
      await this.refreshSession();
    }
    const user = this.getCurrentUser();
    if (!user || user.role !== 'admin') {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  /**
   * Test Supabase Connection
   */
  async testConnection(url, anonKey) {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return { success: false, error: 'Supabase JS SDK belum termuat di browser.' };
    }
    try {
      // Clean URL before testing
      url = (url || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
      const tempClient = window.supabase.createClient(url, anonKey);
      const { data, error } = await tempClient.auth.getSession();
      if (error && !error.message?.includes('session')) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Koneksi gagal.' };
    }
  }

  // --- Internal Session Helpers ---
  _setSession(user) {
    localStorage.setItem('vivere_current_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('vivere:auth-changed', { detail: { user } }));
  }

  _clearSession() {
    localStorage.removeItem('vivere_current_user');
    window.dispatchEvent(new CustomEvent('vivere:auth-changed', { detail: { user: null } }));
  }
}

// Global Singleton Instance
window.VivereAuth = new VivereAuthClient();
