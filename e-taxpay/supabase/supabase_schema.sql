-- ============================================
-- E-TaxPay Database Schema for Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.roles (name, description) VALUES
  ('user', 'Regular shop owner'),
  ('district_admin', 'District level administrator'),
  ('super_admin', 'State level super administrator')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  gst_id VARCHAR(50) UNIQUE NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  father_name VARCHAR(100),
  district VARCHAR(50) NOT NULL,
  block VARCHAR(100) NOT NULL,
  business_type VARCHAR(50) NOT NULL,
  shop_photo_url TEXT,
  user_photo_url TEXT,
  role_id INTEGER REFERENCES public.roles(id) DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_gst ON public.users(gst_id);
CREATE INDEX idx_users_district ON public.users(district);
CREATE INDEX idx_users_block ON public.users(block);
CREATE INDEX idx_users_business_type ON public.users(business_type);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);

-- ============================================
-- AUTOMATIC USER CREATION TRIGGER (SUPABASE AUTH)
-- ============================================
-- This trigger automatically creates a row in the public.users table 
-- when a user signs up via Supabase Authentication.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, username, email, gst_id, mobile, district, block, business_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User ' || substr(NEW.id::text, 1, 6)),
    NEW.email,
    -- Provides fallback values so the NOT NULL constraints do not fail during a standard email signup
    COALESCE(NEW.raw_user_meta_data->>'gst_id', 'PENDING_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'mobile', '0000000000'),
    COALESCE(NEW.raw_user_meta_data->>'district', 'Pending'),
    COALESCE(NEW.raw_user_meta_data->>'block', 'Pending'),
    COALESCE(NEW.raw_user_meta_data->>'business_type', 'Pending')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role_id INTEGER REFERENCES public.roles(id) DEFAULT 2,
  district VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  passkey_hash TEXT NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TAXES TABLE
-- ============================================
CREATE TABLE public.taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  penalty DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) GENERATED ALWAYS AS (amount + penalty) STORED,
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid','unpaid','overdue','pending')),
  due_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_taxes_user ON public.taxes(user_id);
CREATE INDEX idx_taxes_status ON public.taxes(status);
CREATE INDEX idx_taxes_year_month ON public.taxes(year, month);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_id UUID REFERENCES public.taxes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'online',
  payment_gateway VARCHAR(50) DEFAULT 'razorpay',
  gateway_response JSONB,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success','failed','pending','refunded')),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_transaction ON public.payments(transaction_id);

-- ============================================
-- NOTICES TABLE
-- ============================================
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admins(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notice_month INTEGER,
  notice_year INTEGER,
  is_urgent BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notices_user ON public.notices(user_id);

-- ============================================
-- COMPLAINTS TABLE
-- ============================================
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','verified','action_taken','rejected')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES public.admins(id),
  resolved_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_user ON public.complaints(user_id);

-- ============================================
-- GOVERNMENT UPDATES TABLE
-- ============================================
CREATE TABLE public.government_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.admins(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'notice' CHECK (category IN ('tax_update','scheme','notice','announcement')),
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  admin_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_updates ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users read own data" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users update own data" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

-- TAXES POLICIES
CREATE POLICY "Users read own taxes" ON public.taxes
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- PAYMENTS POLICIES
CREATE POLICY "Users read own payments" ON public.payments
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- NOTICES POLICIES
CREATE POLICY "Users read own notices" ON public.notices
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- COMPLAINTS POLICIES
CREATE POLICY "Users insert complaints" ON public.complaints
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users read own complaints" ON public.complaints
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- GOVERNMENT UPDATES POLICIES
CREATE POLICY "Public read updates" ON public.government_updates
  FOR SELECT USING (is_published = TRUE);
