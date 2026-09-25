-- ============================================================================
-- VI VE RE - Supabase Database Setup & Schema
-- Jalankan query SQL ini di Supabase SQL Editor (Dashboard Supabase -> SQL Editor)
-- ============================================================================

-- 1. Buat Tabel Profiles (Menyimpan Role 'user' atau 'admin' dan nama lengkap)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (Security Policies)
-- Semua user dapat melihat profile (untuk mengecek peran/avatar)
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT 
  USING (true);

-- User hanya dapat mengupdate profil miliknya sendiri
CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 4. Function Trigger Otomatis: Saat user baru mendaftar di Supabase Auth,
-- otomatis membuat baris profil di public.profiles dengan role dari metadata
-- CATATAN: ON CONFLICT hanya update full_name, TIDAK overwrite role yang sudah ada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name
  -- SENGAJA tidak update role agar tidak overwrite role admin yang sudah diset manual
  WHERE public.profiles.role = 'user'; -- hanya update kalau masih user biasa
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger event pada tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. Tabel Orders (Penyimpanan Transaksi Pesanan & Pengiriman)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES auth.users ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  delivery_cost NUMERIC DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Lunas',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  tracking_number TEXT,
  status TEXT NOT NULL DEFAULT 'Diproses',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS Orders:
-- Drop dulu kalau sudah ada, untuk menghindari konflik
DROP POLICY IF EXISTS "Orders are viewable by owner or admin." ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders." ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders." ON public.orders;

-- Admin dapat melihat SEMUA pesanan
CREATE POLICY "Admin can view all orders."
  ON public.orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Customer dapat melihat pesanan miliknya sendiri
CREATE POLICY "Customers can view own orders."
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Siapapun (termasuk guest) dapat membuat pesanan baru
CREATE POLICY "Anyone can insert orders."
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Hanya Admin yang dapat mengupdate status pesanan
CREATE POLICY "Admin can update orders."
  ON public.orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- TIPS ADMIN:
-- Jika Anda ingin mengubah seorang user menjadi ADMIN secara manual via SQL:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'ID_USER_DARI_AUTH';
-- ATAU berdasarkan email:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'email_admin_anda@gmail.com');
-- ============================================================================
