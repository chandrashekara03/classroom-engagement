-- Supabase Auto-Deployment Schema Helper
-- Instructions: Paste this entirely into the Supabase Dashboard -> SQL Editor and hit "RUN"

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid varchar(255) UNIQUE NOT NULL,
  email varchar(255) NOT NULL,
  role varchar(50) DEFAULT 'resident',
  name varchar(255),
  room_number varchar(50),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title varchar(100) NOT NULL,
  description text NOT NULL,
  status varchar(50) DEFAULT 'pending',
  category varchar(50) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  month varchar(10) NOT NULL, -- Format: YYYY-MM
  transaction_id varchar(100) UNIQUE NOT NULL,
  status varchar(50) DEFAULT 'pending',
  verified_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  content text NOT NULL,
  is_important boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optional: Enable Row Level Security (RLS) and close off public access
-- Since our NextAuth / Next.js API Routes handle all validation via the SERVICE_ROLE_KEY:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
