# 🗄️ Complete Database Setup Guide

## Step-by-Step Setup for Three User Roles

This guide will help you set up your Supabase database with three different user types: **Super Admin**, **Admin**, and **User**, each with specific access levels and landing pages.

## 🎯 User Roles & Access Levels

### 🔴 Super Admin
- **Email**: `superadmin@example.com`
- **Password**: `admin123`
- **Landing Page**: `super_admin.html`
- **Access**: Full system access, can manage all users, view all data, modify system settings

### 🟡 Admin  
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Landing Page**: `admin.html`
- **Access**: Can manage regular users, view analytics, but cannot modify system settings

### 🟢 User
- **Email**: `user1@example.com`
- **Password**: `admin123`
- **Landing Page**: `user.html`
- **Access**: Can only view and edit their own data

## 📋 Setup Steps

### Step 1: Run Database Schema
1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `database/schema.sql`
3. **Paste and Run** the SQL to create all tables

### Step 2: Run Enhanced User Setup
1. In **Supabase SQL Editor**, copy the contents of `database/setup-users.sql`
2. **Paste and Run** to set up enhanced permissions and policies

### Step 3: Create Initial Users
1. Open `http://localhost:3000/create-initial-users.html` in your browser
2. Click **"Create All Users"** button
3. Wait for all three users to be created successfully
4. The system will automatically assign the correct roles

### Step 4: Test Authentication
1. Use the test buttons on the user creation page, or
2. Go to `sign-in.html` and test each user login:
   - **Super Admin**: `superadmin@gmail.com` / `admin`
   - **Admin**: `admin@gmail.com` / `admin`  
   - **User**: `user1@gmail.com` / `admin`

## 🔐 Authentication Flow

When users log in, they will be automatically redirected based on their role:

```javascript
// Automatic redirect logic
Super Admin → super_admin.html
Admin       → admin.html  
User        → user.html
```

## 🛡️ Security & Permissions

### Row Level Security (RLS) Policies:

#### User Profiles
- ✅ Users can view/edit their own profile
- ✅ Admins can view all user profiles
- ✅ Super Admins can modify any user profile

#### Dashboard Stats
- ❌ Users cannot access dashboard statistics
- ✅ Admins can view dashboard statistics
- ✅ Super Admins can view and modify dashboard statistics

#### Activity Logs
- ✅ Users can view their own activity
- ✅ Admins can view all user activity
- ✅ Super Admins have full access to all logs

#### App Settings
- ❌ Users cannot access app settings
- ✅ Admins can view app settings
- ✅ Super Admins can modify app settings

## 📊 Database Tables Created

### `user_profiles`
```sql
- id (UUID, Primary Key)
- email (TEXT, Unique)
- full_name (TEXT)
- role (TEXT: 'user', 'admin', 'super_admin')
- status (TEXT: 'active', 'inactive', 'suspended')
- created_at, updated_at (TIMESTAMP)
```

### `dashboard_stats`
```sql
- total_users (INTEGER)
- total_admins (INTEGER)
- total_revenue (DECIMAL)
- total_orders (INTEGER)
- active_sessions (INTEGER)
```

### `activity_logs`
```sql
- user_id (UUID)
- action (TEXT)
- description (TEXT)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

### `notifications`
```sql
- user_id (UUID)
- title (TEXT)
- message (TEXT)
- type (TEXT: 'info', 'success', 'warning', 'error')
- is_read (BOOLEAN)
```

### `app_settings`
```sql
- key (TEXT, Unique)
- value (JSONB)
- description (TEXT)
```

## 🧪 Testing Your Setup

### Test Authentication:
```bash
# Open in browser
http://localhost:3000/create-initial-users.html

# Test each user login
1. Click "Login as Super Admin" → Should redirect to super_admin.html
2. Click "Login as Admin" → Should redirect to admin.html  
3. Click "Login as User" → Should redirect to user.html
```

### Test Permissions:
1. **Login as User** → Try accessing admin.html (should be blocked)
2. **Login as Admin** → Try accessing super_admin.html (should be blocked)
3. **Login as Super Admin** → Should have access to all pages

## 🚨 Troubleshooting

### Common Issues:

1. **"Table doesn't exist" error**:
   - Make sure you ran `schema.sql` first
   - Check Supabase Table Editor to verify tables exist

2. **"Permission denied" error**:
   - This is normal! RLS policies are working
   - Make sure user has correct role assigned

3. **User creation fails**:
   - Check Supabase Auth settings
   - Ensure email confirmation is disabled for testing

4. **Wrong redirect after login**:
   - Check user role in `user_profiles` table
   - Verify the role is exactly: 'user', 'admin', or 'super_admin'

### Verify Setup:
```sql
-- Check if users were created correctly
SELECT email, role, status FROM user_profiles;

-- Check dashboard stats
SELECT * FROM dashboard_stats;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('user_profiles', 'dashboard_stats');
```

## 🎉 Success!

Once setup is complete, you'll have:
- ✅ Three user accounts with different access levels
- ✅ Automatic role-based redirects
- ✅ Secure database with proper permissions
- ✅ Activity logging and notifications
- ✅ Dashboard statistics tracking

Your Wowdash Admin Dashboard is now fully functional with a complete user management system! 🚀

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Verify all SQL scripts ran successfully
4. Test the connection using `test-connection.html`
