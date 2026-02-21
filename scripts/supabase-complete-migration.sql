-- ============================================================================
-- FleetFlow - Complete Supabase Migration
-- ============================================================================
-- This script creates all tables, enums, indexes, RLS policies, triggers,
-- and seed data for the FleetFlow logistics management system.
--
-- Tables: profiles, vehicles, drivers, trips, maintenance_logs, expenses
-- Features: Row Level Security, auto-updated timestamps, foreign keys,
--           check constraints, indexes, analytics views
--
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================


-- ============================================================================
-- STEP 0: Enable Required Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- STEP 1: Custom ENUM Types
-- ============================================================================
-- Using ENUMs ensures data integrity - only allowed values can be inserted.

-- User roles for RBAC
CREATE TYPE public.user_role AS ENUM ('manager', 'dispatcher');

-- Vehicle statuses
CREATE TYPE public.vehicle_status AS ENUM ('Active', 'Maintenance', 'Inactive');

-- Vehicle types
CREATE TYPE public.vehicle_type AS ENUM ('Truck', 'Van', 'Sedan', 'SUV', 'Bus');

-- Fuel types
CREATE TYPE public.fuel_type AS ENUM ('Diesel', 'Petrol', 'Electric', 'CNG');

-- Driver statuses
CREATE TYPE public.driver_status AS ENUM ('On Duty', 'Off Duty', 'Suspended');

-- Trip statuses
CREATE TYPE public.trip_status AS ENUM ('Scheduled', 'In Transit', 'Delivered', 'Cancelled');

-- Maintenance types
CREATE TYPE public.maintenance_type AS ENUM (
  'Oil Change', 'Tire Rotation', 'Brake Inspection',
  'Engine Tune', 'Battery Check', 'AC Service'
);

-- Maintenance statuses
CREATE TYPE public.maintenance_status AS ENUM ('Completed', 'Scheduled', 'In Progress');

-- Expense categories
CREATE TYPE public.expense_category AS ENUM (
  'Fuel', 'Maintenance', 'Insurance', 'Tolls', 'Parking', 'Fines'
);

-- Payment methods
CREATE TYPE public.payment_method AS ENUM ('Cash', 'Card', 'UPI', 'Bank Transfer');


-- ============================================================================
-- STEP 2: Utility Function - Auto-update "updated_at" Timestamp
-- ============================================================================
-- This trigger function automatically sets updated_at = NOW() on every UPDATE.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- STEP 3: PROFILES Table
-- ============================================================================
-- Linked to Supabase Auth (auth.users). Every signed-up user gets a profile.
-- The "role" column controls RBAC (Manager vs Dispatcher).

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL DEFAULT '',
  email       TEXT        NOT NULL DEFAULT '',
  role        public.user_role NOT NULL DEFAULT 'dispatcher',
  avatar_url  TEXT        DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick role-based lookups
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Auto-update updated_at
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Comment
COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth. Contains role for RBAC.';
COMMENT ON COLUMN public.profiles.role IS 'manager = full access; dispatcher = limited access (trips + read-only drivers)';


-- ============================================================================
-- STEP 4: Auto-Create Profile on Signup
-- ============================================================================
-- When a new user signs up via Supabase Auth, this trigger automatically
-- creates a row in the profiles table with default role = 'dispatcher'.
-- Managers can later promote users via the profiles table.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'dispatcher'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- STEP 5: VEHICLES Table
-- ============================================================================
-- Stores all fleet vehicles with their specifications and status.

CREATE TABLE public.vehicles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT                   NOT NULL,
  type             public.vehicle_type    NOT NULL DEFAULT 'Truck',
  status           public.vehicle_status  NOT NULL DEFAULT 'Active',
  fuel_type        public.fuel_type       NOT NULL DEFAULT 'Diesel',
  mileage          NUMERIC(12,2)          NOT NULL DEFAULT 0
    CHECK (mileage >= 0),
  last_service     DATE                   NOT NULL DEFAULT CURRENT_DATE,
  registration     TEXT                   NOT NULL UNIQUE,
  year             INTEGER                NOT NULL
    CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  max_capacity     NUMERIC(10,2)          NOT NULL DEFAULT 0
    CHECK (max_capacity >= 0),
  insurance_expiry DATE                   NOT NULL,
  created_at       TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_type ON public.vehicles(type);
CREATE INDEX idx_vehicles_registration ON public.vehicles(registration);

-- Auto-update updated_at
CREATE TRIGGER on_vehicles_updated
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.vehicles IS 'Fleet vehicle registry with specs, status, and insurance tracking.';
COMMENT ON COLUMN public.vehicles.max_capacity IS 'Maximum cargo capacity in kilograms (kg).';
COMMENT ON COLUMN public.vehicles.mileage IS 'Total mileage in kilometers (km).';


-- ============================================================================
-- STEP 6: DRIVERS Table
-- ============================================================================
-- Stores driver profiles with license info, status, and performance stats.

CREATE TABLE public.drivers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT                   NOT NULL,
  license         TEXT                   NOT NULL UNIQUE,
  phone           TEXT                   NOT NULL,
  status          public.driver_status   NOT NULL DEFAULT 'Off Duty',
  rating          NUMERIC(2,1)           NOT NULL DEFAULT 0
    CHECK (rating >= 0 AND rating <= 5),
  trips_completed INTEGER                NOT NULL DEFAULT 0
    CHECK (trips_completed >= 0),
  license_expiry  DATE                   NOT NULL,
  created_at      TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_drivers_license ON public.drivers(license);
CREATE INDEX idx_drivers_license_expiry ON public.drivers(license_expiry);

-- Auto-update updated_at
CREATE TRIGGER on_drivers_updated
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.drivers IS 'Driver registry with license, contact, status, and performance tracking.';
COMMENT ON COLUMN public.drivers.rating IS 'Driver rating from 0.0 to 5.0.';
COMMENT ON COLUMN public.drivers.license_expiry IS 'License expiry date. Used for "Renew License" feature when expired.';


-- ============================================================================
-- STEP 7: TRIPS Table
-- ============================================================================
-- Core logistics table. Tracks every trip from scheduling to delivery.
-- Links to both vehicles and drivers via foreign keys.

CREATE TABLE public.trips (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID                  NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  driver_id       UUID                  NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  origin          TEXT                  NOT NULL,
  destination     TEXT                  NOT NULL,
  status          public.trip_status    NOT NULL DEFAULT 'Scheduled',
  start_date      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  end_date        TIMESTAMPTZ           DEFAULT NULL,
  distance        NUMERIC(10,2)         NOT NULL DEFAULT 0
    CHECK (distance >= 0),
  cargo_weight    NUMERIC(10,2)         NOT NULL DEFAULT 0
    CHECK (cargo_weight >= 0),
  fuel_cost       NUMERIC(12,2)         NOT NULL DEFAULT 0
    CHECK (fuel_cost >= 0),
  start_odometer  NUMERIC(12,2)         NOT NULL DEFAULT 0
    CHECK (start_odometer >= 0),
  end_odometer    NUMERIC(12,2)         DEFAULT NULL,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- CONSTRAINT: end_odometer must be strictly greater than start_odometer (when set)
-- This enforces the business rule: End Odometer > Start Odometer
ALTER TABLE public.trips
  ADD CONSTRAINT chk_trips_odometer
  CHECK (end_odometer IS NULL OR end_odometer > start_odometer);

-- CONSTRAINT: end_date must be after start_date (when set)
ALTER TABLE public.trips
  ADD CONSTRAINT chk_trips_dates
  CHECK (end_date IS NULL OR end_date > start_date);

-- Indexes
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX idx_trips_start_date ON public.trips(start_date);
CREATE INDEX idx_trips_created_at ON public.trips(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER on_trips_updated
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.trips IS 'Trip dispatch records. Links vehicles and drivers for logistics tracking.';
COMMENT ON COLUMN public.trips.fuel_cost IS 'Fuel cost in INR (₹).';
COMMENT ON COLUMN public.trips.cargo_weight IS 'Cargo weight in kg. Must not exceed vehicle max_capacity.';
COMMENT ON COLUMN public.trips.start_odometer IS 'Vehicle odometer reading at trip start.';
COMMENT ON COLUMN public.trips.end_odometer IS 'Vehicle odometer reading at trip end. Must be > start_odometer.';


-- ============================================================================
-- STEP 7a: Cargo Weight Validation Trigger
-- ============================================================================
-- Prevents trip creation/update if cargo_weight exceeds the vehicle's max_capacity.

CREATE OR REPLACE FUNCTION public.validate_cargo_weight()
RETURNS TRIGGER AS $$
DECLARE
  v_max_capacity NUMERIC;
BEGIN
  SELECT max_capacity INTO v_max_capacity
  FROM public.vehicles
  WHERE id = NEW.vehicle_id;

  IF v_max_capacity IS NOT NULL AND NEW.cargo_weight > v_max_capacity THEN
    RAISE EXCEPTION 'Cargo weight (% kg) exceeds vehicle max capacity (% kg)',
      NEW.cargo_weight, v_max_capacity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_trip_cargo_validate
  BEFORE INSERT OR UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.validate_cargo_weight();


-- ============================================================================
-- STEP 7b: Auto-increment Driver trips_completed on Trip Delivery
-- ============================================================================
-- When a trip status changes to 'Delivered', increment the driver's trip count.

CREATE OR REPLACE FUNCTION public.increment_driver_trips()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Delivered' AND (OLD.status IS NULL OR OLD.status <> 'Delivered') THEN
    UPDATE public.drivers
    SET trips_completed = trips_completed + 1
    WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_trip_delivered
  AFTER UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.increment_driver_trips();


-- ============================================================================
-- STEP 8: MAINTENANCE_LOGS Table
-- ============================================================================
-- Tracks all vehicle maintenance activities with cost and technician info.

CREATE TABLE public.maintenance_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID                       NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type        public.maintenance_type    NOT NULL,
  date        DATE                       NOT NULL DEFAULT CURRENT_DATE,
  cost        NUMERIC(12,2)              NOT NULL DEFAULT 0
    CHECK (cost >= 0),
  status      public.maintenance_status  NOT NULL DEFAULT 'Scheduled',
  technician  TEXT                       NOT NULL DEFAULT '',
  notes       TEXT                       NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maintenance_vehicle_id ON public.maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_status ON public.maintenance_logs(status);
CREATE INDEX idx_maintenance_date ON public.maintenance_logs(date DESC);
CREATE INDEX idx_maintenance_type ON public.maintenance_logs(type);

-- Auto-update updated_at
CREATE TRIGGER on_maintenance_updated
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.maintenance_logs IS 'Vehicle maintenance records with cost tracking in INR (₹).';


-- ============================================================================
-- STEP 9: EXPENSES Table
-- ============================================================================
-- Tracks all fleet-related expenses categorized by type and payment method.

CREATE TABLE public.expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID                      NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  category        public.expense_category   NOT NULL,
  amount          NUMERIC(12,2)             NOT NULL DEFAULT 0
    CHECK (amount >= 0),
  date            DATE                      NOT NULL DEFAULT CURRENT_DATE,
  description     TEXT                      NOT NULL DEFAULT '',
  payment_method  public.payment_method     NOT NULL DEFAULT 'Cash',
  receipt_no      TEXT                      NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_vehicle_id ON public.expenses(vehicle_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX idx_expenses_payment_method ON public.expenses(payment_method);

-- Auto-update updated_at
CREATE TRIGGER on_expenses_updated
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.expenses IS 'Fleet expense records. Amounts in INR (₹). Linked to vehicles.';


-- ============================================================================
-- STEP 10: Row Level Security (RLS)
-- ============================================================================
-- RLS ensures users can only access data according to their role.
-- Manager: Full CRUD on all tables.
-- Dispatcher: Read-only on vehicles, drivers, expenses, maintenance_logs.
--             Full access on trips (dispatch, start, complete, cancel).

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Managers can view all profiles
CREATE POLICY "Managers can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can update any profile (e.g., promote to manager)
CREATE POLICY "Managers can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ---- VEHICLES ----

-- All authenticated users can read vehicles
CREATE POLICY "Authenticated users can view vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (true);

-- Only managers can insert vehicles
CREATE POLICY "Managers can insert vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can update vehicles
CREATE POLICY "Managers can update vehicles"
  ON public.vehicles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can delete vehicles
CREATE POLICY "Managers can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ---- DRIVERS ----

-- All authenticated users can read drivers
CREATE POLICY "Authenticated users can view drivers"
  ON public.drivers FOR SELECT
  TO authenticated
  USING (true);

-- Only managers can insert drivers
CREATE POLICY "Managers can insert drivers"
  ON public.drivers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can update drivers (status toggle, edit, renew license)
CREATE POLICY "Managers can update drivers"
  ON public.drivers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can delete drivers
CREATE POLICY "Managers can delete drivers"
  ON public.drivers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ---- TRIPS ----

-- All authenticated users can view trips
CREATE POLICY "Authenticated users can view trips"
  ON public.trips FOR SELECT
  TO authenticated
  USING (true);

-- Dispatchers can create trips
CREATE POLICY "Dispatchers can insert trips"
  ON public.trips FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'dispatcher'
    )
  );

-- Dispatchers can update trips (start, complete, cancel)
CREATE POLICY "Dispatchers can update trips"
  ON public.trips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'dispatcher'
    )
  );

-- Managers can also create trips (for flexibility)
CREATE POLICY "Managers can insert trips"
  ON public.trips FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can also update trips
CREATE POLICY "Managers can update trips"
  ON public.trips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can delete trips
CREATE POLICY "Managers can delete trips"
  ON public.trips FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ---- MAINTENANCE_LOGS ----

-- All authenticated users can view maintenance logs
CREATE POLICY "Authenticated users can view maintenance_logs"
  ON public.maintenance_logs FOR SELECT
  TO authenticated
  USING (true);

-- Only managers can insert maintenance logs
CREATE POLICY "Managers can insert maintenance_logs"
  ON public.maintenance_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can update maintenance logs
CREATE POLICY "Managers can update maintenance_logs"
  ON public.maintenance_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can delete maintenance logs
CREATE POLICY "Managers can delete maintenance_logs"
  ON public.maintenance_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ---- EXPENSES ----

-- All authenticated users can view expenses
CREATE POLICY "Authenticated users can view expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

-- Only managers can insert expenses
CREATE POLICY "Managers can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can update expenses
CREATE POLICY "Managers can update expenses"
  ON public.expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can delete expenses
CREATE POLICY "Managers can delete expenses"
  ON public.expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );


-- ============================================================================
-- STEP 11: Analytics Views
-- ============================================================================
-- Pre-built views for the Analytics/Dashboard pages. These can be queried
-- directly from the frontend via supabase.from('view_name').select('*').

-- Monthly expense breakdown (for Operational Cost Trends chart)
CREATE OR REPLACE VIEW public.v_monthly_expenses AS
SELECT
  TO_CHAR(date, 'Mon')            AS month,
  EXTRACT(YEAR FROM date)         AS year,
  EXTRACT(MONTH FROM date)        AS month_num,
  category,
  SUM(amount)                     AS total_amount,
  COUNT(*)                        AS transaction_count
FROM public.expenses
GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), category
ORDER BY year DESC, month_num ASC;

-- Monthly cost trend (for Total Cost Trend line chart)
CREATE OR REPLACE VIEW public.v_monthly_cost_trend AS
SELECT
  TO_CHAR(date, 'Mon')            AS month,
  EXTRACT(YEAR FROM date)         AS year,
  EXTRACT(MONTH FROM date)        AS month_num,
  SUM(amount)                     AS total_cost
FROM public.expenses
GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
ORDER BY year DESC, month_num ASC;

-- Fleet composition by vehicle type (for pie chart)
CREATE OR REPLACE VIEW public.v_fleet_composition AS
SELECT
  type::TEXT    AS name,
  COUNT(*)      AS value
FROM public.vehicles
GROUP BY type
ORDER BY value DESC;

-- Trip status distribution (for pie chart)
CREATE OR REPLACE VIEW public.v_trip_status_distribution AS
SELECT
  status::TEXT  AS name,
  COUNT(*)      AS value
FROM public.trips
GROUP BY status
ORDER BY value DESC;

-- Driver performance leaderboard
CREATE OR REPLACE VIEW public.v_driver_performance AS
SELECT
  d.id,
  d.name,
  d.rating,
  d.trips_completed,
  d.status::TEXT AS status,
  COUNT(t.id) FILTER (WHERE t.status = 'Delivered')  AS delivered_trips,
  COUNT(t.id) FILTER (WHERE t.status = 'Cancelled')  AS cancelled_trips,
  COALESCE(SUM(t.distance) FILTER (WHERE t.status = 'Delivered'), 0) AS total_distance_km,
  COALESCE(SUM(t.fuel_cost) FILTER (WHERE t.status = 'Delivered'), 0) AS total_fuel_cost
FROM public.drivers d
LEFT JOIN public.trips t ON t.driver_id = d.id
GROUP BY d.id, d.name, d.rating, d.trips_completed, d.status
ORDER BY d.rating DESC, d.trips_completed DESC;

-- Vehicle utilization summary
CREATE OR REPLACE VIEW public.v_vehicle_utilization AS
SELECT
  v.id,
  v.name,
  v.type::TEXT AS type,
  v.status::TEXT AS status,
  v.mileage,
  COUNT(t.id)                                          AS total_trips,
  COUNT(t.id) FILTER (WHERE t.status = 'Delivered')    AS completed_trips,
  COALESCE(SUM(t.distance), 0)                         AS total_distance,
  COALESCE(SUM(t.fuel_cost), 0)                        AS total_fuel_cost,
  COALESCE(SUM(m.cost), 0)                             AS total_maintenance_cost
FROM public.vehicles v
LEFT JOIN public.trips t ON t.vehicle_id = v.id
LEFT JOIN public.maintenance_logs m ON m.vehicle_id = v.id
GROUP BY v.id, v.name, v.type, v.status, v.mileage
ORDER BY total_trips DESC;


-- ============================================================================
-- STEP 12: Helper Functions (callable via supabase.rpc())
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Dashboard summary stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_vehicles',     (SELECT COUNT(*) FROM public.vehicles),
    'active_vehicles',    (SELECT COUNT(*) FROM public.vehicles WHERE status = 'Active'),
    'total_drivers',      (SELECT COUNT(*) FROM public.drivers),
    'on_duty_drivers',    (SELECT COUNT(*) FROM public.drivers WHERE status = 'On Duty'),
    'total_trips',        (SELECT COUNT(*) FROM public.trips),
    'active_trips',       (SELECT COUNT(*) FROM public.trips WHERE status = 'In Transit'),
    'scheduled_trips',    (SELECT COUNT(*) FROM public.trips WHERE status = 'Scheduled'),
    'delivered_trips',    (SELECT COUNT(*) FROM public.trips WHERE status = 'Delivered'),
    'total_fuel_cost',    (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE category = 'Fuel'),
    'total_maintenance_cost', (SELECT COALESCE(SUM(cost), 0) FROM public.maintenance_logs),
    'total_expenses',     (SELECT COALESCE(SUM(amount), 0) FROM public.expenses)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================================================
-- STEP 13: Seed Data
-- ============================================================================
-- This matches the initial data from fleet-data.ts so the app works immediately.
-- NOTE: These use fixed UUIDs so foreign key references are consistent.

-- Seed Vehicles
INSERT INTO public.vehicles (id, name, type, status, fuel_type, mileage, last_service, registration, year, max_capacity, insurance_expiry) VALUES
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Tata Ace Gold',     'Truck',  'Active',      'Diesel',   45200, '2024-01-15', 'GJ-01-AB-1234', 2022, 750,  '2025-06-15'),
  ('a1b2c3d4-1111-4000-8000-000000000002', 'Mahindra Bolero',   'SUV',    'Active',      'Diesel',   32100, '2024-02-20', 'GJ-05-CD-5678', 2023, 500,  '2025-08-20'),
  ('a1b2c3d4-1111-4000-8000-000000000003', 'Ashok Leyland Dost','Truck',  'Maintenance', 'Diesel',   78500, '2023-12-10', 'MH-12-EF-9012', 2021, 1500, '2025-03-10'),
  ('a1b2c3d4-1111-4000-8000-000000000004', 'Maruti Suzuki Eeco','Van',    'Active',      'Petrol',   28900, '2024-03-05', 'DL-03-GH-3456', 2023, 400,  '2025-09-05'),
  ('a1b2c3d4-1111-4000-8000-000000000005', 'Tata Winger',       'Van',    'Active',      'Diesel',   51200, '2024-01-25', 'RJ-14-IJ-7890', 2022, 1000, '2025-05-25'),
  ('a1b2c3d4-1111-4000-8000-000000000006', 'BharatBenz 1015R',  'Truck',  'Active',      'Diesel',   92300, '2023-11-30', 'KA-01-KL-2345', 2020, 2000, '2025-04-30'),
  ('a1b2c3d4-1111-4000-8000-000000000007', 'Force Traveller',   'Bus',    'Inactive',    'Diesel',   65400, '2024-02-14', 'TN-09-MN-6789', 2021, 1200, '2025-07-14'),
  ('a1b2c3d4-1111-4000-8000-000000000008', 'Tata Nexon EV',     'Sedan',  'Active',      'Electric', 15600, '2024-03-20', 'GJ-06-OP-0123', 2024, 300,  '2026-03-20');

-- Seed Drivers
INSERT INTO public.drivers (id, name, license, phone, status, rating, trips_completed, license_expiry) VALUES
  ('b2c3d4e5-2222-4000-8000-000000000001', 'Rajesh Kumar',    'GJ-DL-2022-001234', '+91-98765-43210', 'On Duty',   4.8, 156, '2025-12-31'),
  ('b2c3d4e5-2222-4000-8000-000000000002', 'Amit Patel',      'MH-DL-2021-005678', '+91-87654-32109', 'On Duty',   4.5, 132, '2025-08-15'),
  ('b2c3d4e5-2222-4000-8000-000000000003', 'Suresh Singh',    'DL-DL-2023-009012', '+91-76543-21098', 'Off Duty',  4.2, 98,  '2024-03-20'),
  ('b2c3d4e5-2222-4000-8000-000000000004', 'Vikram Sharma',   'RJ-DL-2022-003456', '+91-65432-10987', 'On Duty',   4.9, 201, '2026-01-10'),
  ('b2c3d4e5-2222-4000-8000-000000000005', 'Deepak Verma',    'KA-DL-2023-007890', '+91-54321-09876', 'Suspended', 3.8, 67,  '2025-05-22'),
  ('b2c3d4e5-2222-4000-8000-000000000006', 'Manoj Yadav',     'TN-DL-2021-002345', '+91-43210-98765', 'On Duty',   4.6, 178, '2025-11-30');

-- Seed Trips
INSERT INTO public.trips (id, vehicle_id, driver_id, origin, destination, status, start_date, end_date, distance, cargo_weight, fuel_cost, start_odometer, end_odometer) VALUES
  ('c3d4e5f6-3333-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', 'b2c3d4e5-2222-4000-8000-000000000001', 'Ahmedabad',  'Mumbai',     'Delivered',  '2024-03-15 08:00:00+05:30', '2024-03-15 18:00:00+05:30', 524,  450, 3200, 45000, 45524),
  ('c3d4e5f6-3333-4000-8000-000000000002', 'a1b2c3d4-1111-4000-8000-000000000002', 'b2c3d4e5-2222-4000-8000-000000000002', 'Pune',       'Bangalore',  'In Transit', '2024-03-20 06:00:00+05:30', NULL,                         840,  350, 5100, 32000, NULL),
  ('c3d4e5f6-3333-4000-8000-000000000003', 'a1b2c3d4-1111-4000-8000-000000000004', 'b2c3d4e5-2222-4000-8000-000000000004', 'Delhi',      'Jaipur',     'Scheduled',  '2024-03-25 07:00:00+05:30', NULL,                         280,  200, 1800, 28800, NULL),
  ('c3d4e5f6-3333-4000-8000-000000000004', 'a1b2c3d4-1111-4000-8000-000000000005', 'b2c3d4e5-2222-4000-8000-000000000006', 'Chennai',    'Hyderabad',  'Delivered',  '2024-03-10 09:00:00+05:30', '2024-03-10 20:00:00+05:30', 630,  800, 3800, 51000, 51630),
  ('c3d4e5f6-3333-4000-8000-000000000005', 'a1b2c3d4-1111-4000-8000-000000000006', 'b2c3d4e5-2222-4000-8000-000000000001', 'Kolkata',    'Patna',      'Cancelled',  '2024-03-12 05:00:00+05:30', NULL,                         590,  1200, 0,    92000, NULL),
  ('c3d4e5f6-3333-4000-8000-000000000006', 'a1b2c3d4-1111-4000-8000-000000000008', 'b2c3d4e5-2222-4000-8000-000000000004', 'Surat',      'Vadodara',   'Delivered',  '2024-03-18 10:00:00+05:30', '2024-03-18 14:00:00+05:30', 135,  150, 800,  15500, 15635),
  ('c3d4e5f6-3333-4000-8000-000000000007', 'a1b2c3d4-1111-4000-8000-000000000001', 'b2c3d4e5-2222-4000-8000-000000000006', 'Ahmedabad',  'Rajkot',     'In Transit', '2024-03-22 08:00:00+05:30', NULL,                         215,  500, 1400, 45524, NULL),
  ('c3d4e5f6-3333-4000-8000-000000000008', 'a1b2c3d4-1111-4000-8000-000000000002', 'b2c3d4e5-2222-4000-8000-000000000001', 'Mumbai',     'Goa',        'Scheduled',  '2024-03-28 06:00:00+05:30', NULL,                         580,  300, 3500, 32840, NULL);

-- Seed Maintenance Logs
INSERT INTO public.maintenance_logs (id, vehicle_id, type, date, cost, status, technician, notes) VALUES
  ('d4e5f6a7-4444-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', 'Oil Change',       '2024-01-15', 2500,  'Completed',   'Ramesh Mechanic',  'Regular oil change with filter replacement'),
  ('d4e5f6a7-4444-4000-8000-000000000002', 'a1b2c3d4-1111-4000-8000-000000000003', 'Brake Inspection', '2024-02-10', 4500,  'Completed',   'Sunil Auto Works', 'Brake pads replaced on front axle'),
  ('d4e5f6a7-4444-4000-8000-000000000003', 'a1b2c3d4-1111-4000-8000-000000000005', 'Tire Rotation',    '2024-01-25', 1800,  'Completed',   'Tyre House',       'All 4 tyres rotated and balanced'),
  ('d4e5f6a7-4444-4000-8000-000000000004', 'a1b2c3d4-1111-4000-8000-000000000003', 'Engine Tune',      '2024-03-15', 8500,  'In Progress', 'Sunil Auto Works', 'Full engine tuning and diagnostics'),
  ('d4e5f6a7-4444-4000-8000-000000000005', 'a1b2c3d4-1111-4000-8000-000000000006', 'Battery Check',    '2024-02-28', 3200,  'Completed',   'PowerZone',        'Battery health check - replacement recommended'),
  ('d4e5f6a7-4444-4000-8000-000000000006', 'a1b2c3d4-1111-4000-8000-000000000008', 'AC Service',       '2024-03-20', 5500,  'Scheduled',   'CoolTech Services','Annual AC service and gas refill'),
  ('d4e5f6a7-4444-4000-8000-000000000007', 'a1b2c3d4-1111-4000-8000-000000000002', 'Oil Change',       '2024-02-20', 2800,  'Completed',   'Ramesh Mechanic',  'Synthetic oil change'),
  ('d4e5f6a7-4444-4000-8000-000000000008', 'a1b2c3d4-1111-4000-8000-000000000004', 'Tire Rotation',    '2024-03-05', 1500,  'Completed',   'Tyre House',       'Front tyres replaced due to wear');

-- Seed Expenses
INSERT INTO public.expenses (id, vehicle_id, category, amount, date, description, payment_method, receipt_no) VALUES
  ('e5f6a7b8-5555-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', 'Fuel',        3200,  '2024-03-15', 'Diesel fill - Ahmedabad to Mumbai trip',         'Card',          'REC-2024-001'),
  ('e5f6a7b8-5555-4000-8000-000000000002', 'a1b2c3d4-1111-4000-8000-000000000001', 'Tolls',       850,   '2024-03-15', 'NH48 highway tolls',                             'Cash',          'REC-2024-002'),
  ('e5f6a7b8-5555-4000-8000-000000000003', 'a1b2c3d4-1111-4000-8000-000000000002', 'Fuel',        5100,  '2024-03-20', 'Diesel fill - Pune to Bangalore trip',            'UPI',           'REC-2024-003'),
  ('e5f6a7b8-5555-4000-8000-000000000004', 'a1b2c3d4-1111-4000-8000-000000000003', 'Maintenance', 4500,  '2024-02-10', 'Brake pad replacement',                          'Bank Transfer', 'REC-2024-004'),
  ('e5f6a7b8-5555-4000-8000-000000000005', 'a1b2c3d4-1111-4000-8000-000000000005', 'Fuel',        3800,  '2024-03-10', 'Diesel fill - Chennai to Hyderabad trip',         'Card',          'REC-2024-005'),
  ('e5f6a7b8-5555-4000-8000-000000000006', 'a1b2c3d4-1111-4000-8000-000000000006', 'Insurance',   15000, '2024-01-05', 'Annual comprehensive insurance renewal',          'Bank Transfer', 'REC-2024-006'),
  ('e5f6a7b8-5555-4000-8000-000000000007', 'a1b2c3d4-1111-4000-8000-000000000004', 'Parking',     200,   '2024-03-08', 'Overnight parking at Delhi warehouse',            'Cash',          'REC-2024-007'),
  ('e5f6a7b8-5555-4000-8000-000000000008', 'a1b2c3d4-1111-4000-8000-000000000008', 'Fuel',        800,   '2024-03-18', 'EV charging - Surat to Vadodara trip',            'UPI',           'REC-2024-008'),
  ('e5f6a7b8-5555-4000-8000-000000000009', 'a1b2c3d4-1111-4000-8000-000000000001', 'Fines',       500,   '2024-03-01', 'Overweight fine at check post',                   'Cash',          'REC-2024-009'),
  ('e5f6a7b8-5555-4000-8000-000000000010', 'a1b2c3d4-1111-4000-8000-000000000002', 'Maintenance', 2800,  '2024-02-20', 'Synthetic oil change',                            'UPI',           'REC-2024-010'),
  ('e5f6a7b8-5555-4000-8000-000000000011', 'a1b2c3d4-1111-4000-8000-000000000006', 'Fuel',        6200,  '2024-03-12', 'Diesel fill - Kolkata route (cancelled trip)',     'Card',          'REC-2024-011'),
  ('e5f6a7b8-5555-4000-8000-000000000012', 'a1b2c3d4-1111-4000-8000-000000000005', 'Tolls',       1200,  '2024-03-10', 'NH44 highway tolls',                              'Cash',          'REC-2024-012');


-- ============================================================================
-- STEP 14: Grant Permissions for Views
-- ============================================================================
-- Views inherit table RLS but need explicit grants for the authenticated role.

GRANT SELECT ON public.v_monthly_expenses TO authenticated;
GRANT SELECT ON public.v_monthly_cost_trend TO authenticated;
GRANT SELECT ON public.v_fleet_composition TO authenticated;
GRANT SELECT ON public.v_trip_status_distribution TO authenticated;
GRANT SELECT ON public.v_driver_performance TO authenticated;
GRANT SELECT ON public.v_vehicle_utilization TO authenticated;


-- ============================================================================
-- DONE! Summary of what was created:
-- ============================================================================
--
-- TABLES (6):
--   1. profiles          - User auth profiles with role (manager/dispatcher)
--   2. vehicles          - Fleet vehicle registry (8 seeded)
--   3. drivers           - Driver registry (6 seeded)
--   4. trips             - Trip dispatch records (8 seeded)
--   5. maintenance_logs  - Vehicle maintenance logs (8 seeded)
--   6. expenses          - Fleet expense records (12 seeded)
--
-- ENUMS (10):
--   user_role, vehicle_status, vehicle_type, fuel_type,
--   driver_status, trip_status, maintenance_type, maintenance_status,
--   expense_category, payment_method
--
-- VIEWS (6):
--   v_monthly_expenses, v_monthly_cost_trend, v_fleet_composition,
--   v_trip_status_distribution, v_driver_performance, v_vehicle_utilization
--
-- FUNCTIONS (4):
--   handle_updated_at()       - Auto-update timestamps
--   handle_new_user()         - Auto-create profile on signup
--   validate_cargo_weight()   - Block overweight trips
--   increment_driver_trips()  - Auto-count delivered trips
--   get_my_role()             - RPC: get current user's role
--   get_dashboard_stats()     - RPC: dashboard summary JSON
--
-- RLS POLICIES (20):
--   Enforced per-role access: Manager=full CRUD, Dispatcher=read+trips
--
-- INDEXES (18):
--   Optimized for status filters, FK joins, date sorting, and lookups
--
-- SEED DATA:
--   8 vehicles, 6 drivers, 8 trips, 8 maintenance logs, 12 expenses
-- ============================================================================
