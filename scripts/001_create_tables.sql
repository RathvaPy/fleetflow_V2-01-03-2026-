-- FleetFlow Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- ─── Profiles Table (extends Supabase auth.users) ───
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('manager', 'dispatcher')),
  avatar_initials TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Vehicles Table ───
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Truck', 'Van', 'Bike')),
  license_plate TEXT NOT NULL UNIQUE,
  max_capacity INTEGER NOT NULL DEFAULT 0,
  odometer INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
  region TEXT NOT NULL DEFAULT '',
  acquisition_cost NUMERIC NOT NULL DEFAULT 0,
  year_acquired INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Drivers Table ───
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  license_categories TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Off Duty' CHECK (status IN ('On Duty', 'Off Duty', 'Suspended')),
  safety_score INTEGER NOT NULL DEFAULT 75,
  trips_completed INTEGER NOT NULL DEFAULT 0,
  avatar_initials TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Trips Table ───
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  cargo_weight INTEGER NOT NULL DEFAULT 0,
  cargo_description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
  start_odometer INTEGER NOT NULL DEFAULT 0,
  end_odometer INTEGER,
  estimated_fuel_cost NUMERIC,
  actual_fuel_cost NUMERIC,
  liters_filled NUMERIC,
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Maintenance Logs Table ───
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cost NUMERIC NOT NULL DEFAULT 0,
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Expenses Table ───
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'Fuel' CHECK (category IN ('Fuel', 'Maintenance', 'Insurance', 'Tolls', 'Permits', 'Other')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Auto-create profile on signup ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'manager'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_initials', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ───
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- All other tables: authenticated users can CRUD
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view drivers" ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert drivers" ON public.drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update drivers" ON public.drivers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete drivers" ON public.drivers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view trips" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update trips" ON public.trips FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete trips" ON public.trips FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view maintenance_logs" ON public.maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert maintenance_logs" ON public.maintenance_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update maintenance_logs" ON public.maintenance_logs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);

-- ─── Helper RPCs ───
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_vehicles', (SELECT count(*) FROM public.vehicles),
    'active_vehicles', (SELECT count(*) FROM public.vehicles WHERE status = 'On Trip'),
    'available_vehicles', (SELECT count(*) FROM public.vehicles WHERE status = 'Available'),
    'in_shop_vehicles', (SELECT count(*) FROM public.vehicles WHERE status = 'In Shop'),
    'total_drivers', (SELECT count(*) FROM public.drivers),
    'on_duty_drivers', (SELECT count(*) FROM public.drivers WHERE status = 'On Duty'),
    'total_trips', (SELECT count(*) FROM public.trips),
    'completed_trips', (SELECT count(*) FROM public.trips WHERE status = 'Completed'),
    'draft_trips', (SELECT count(*) FROM public.trips WHERE status = 'Draft')
  );
$$ LANGUAGE sql SECURITY DEFINER;
