-- Enhanced Database Setup with Initial Users
-- Run this script in your Supabase SQL Editor after running schema.sql

-- First, ensure the schema is set up (run schema.sql first if not done)

-- Create initial user profiles for the three roles
-- Note: You'll need to create the auth users first through Supabase Auth, then run this

-- Function to create user profile after auth user is created
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_role TEXT DEFAULT 'user',
    full_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role, status)
    VALUES (user_id, user_email, full_name, user_role, 'active')
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS Policies for role-based access

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view dashboard stats" ON public.dashboard_stats;
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins can modify settings" ON public.app_settings;

-- Enhanced User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can view all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update user profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Dashboard Stats Policies
CREATE POLICY "Admins can view dashboard stats" ON public.dashboard_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can modify dashboard stats" ON public.dashboard_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Activity Logs Policies
CREATE POLICY "Users can view own activity" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- App Settings Policies
CREATE POLICY "Admins can view settings" ON public.app_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can modify settings" ON public.app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Update dashboard stats with initial values
UPDATE public.dashboard_stats SET 
    total_users = 3,
    total_admins = 2,
    total_revenue = 0.00,
    total_orders = 0,
    active_sessions = 0,
    updated_at = NOW()
WHERE id IS NOT NULL;

-- Insert initial dashboard stats if not exists
INSERT INTO public.dashboard_stats (total_users, total_admins, total_revenue, total_orders, active_sessions)
SELECT 3, 2, 0.00, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.dashboard_stats);

-- Insert welcome notifications for each role
INSERT INTO public.notifications (user_id, title, message, type) VALUES
-- These will be inserted after users are created via the auth system

-- Sample app settings
INSERT INTO public.app_settings (key, value, description) VALUES
('welcome_message', '"Welcome to Wowdash Admin Dashboard!"', 'Welcome message for new users'),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
('enable_email_notifications', 'true', 'Enable email notifications'),
('dashboard_refresh_interval', '30000', 'Dashboard refresh interval in milliseconds')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM public.user_profiles 
    WHERE id = user_uuid;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    role_hierarchy JSONB := '{"user": 1, "admin": 2, "super_admin": 3}';
BEGIN
    SELECT get_user_role(auth.uid()) INTO user_role;
    
    RETURN (role_hierarchy->>user_role)::INT >= (role_hierarchy->>required_role)::INT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMENT ON FUNCTION create_user_profile IS 'Creates or updates user profile with specified role';
COMMENT ON FUNCTION get_user_role IS 'Returns the role of a user by UUID';
COMMENT ON FUNCTION has_permission IS 'Checks if current user has required permission level';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create auth users in Supabase Auth dashboard';
    RAISE NOTICE '2. Run the user creation script to assign roles';
    RAISE NOTICE '3. Test the authentication system';
END $$;
