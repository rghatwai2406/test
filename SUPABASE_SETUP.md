# Supabase Database Setup Guide

## 🚀 Complete Setup Instructions

Follow these steps to set up your Supabase database for the Wowdash Admin Dashboard.

## Step 1: Create Supabase Account & Project

1. **Visit [supabase.com](https://supabase.com)** and click "Start your project"
2. **Sign up** using GitHub, Google, or email
3. **Create a new project**:
   - Project name: `wowdash-admin`
   - Database password: Create a strong password (save it!)
   - Region: Choose closest to your location
   - Wait for project to be created (2-3 minutes)

## Step 2: Get Your Project Credentials

1. Go to your project dashboard
2. Click on **Settings** → **API**
3. Copy these values:
   - **Project URL** (looks like: `https://xyzcompany.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Configure Your Project

1. **Create `.env` file** in your project root:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and add your credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Update `assets/js/supabase-config.js`**:
   - Replace `YOUR_SUPABASE_URL_HERE` with your project URL
   - Replace `YOUR_SUPABASE_ANON_KEY_HERE` with your anon key

## Step 4: Set Up Database Schema

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `database/schema.sql`
3. **Click "Run"** to execute the SQL commands
4. **Verify tables created** in the Table Editor:
   - `user_profiles`
   - `dashboard_stats`
   - `activity_logs`
   - `notifications`
   - `app_settings`

## Step 5: Configure Authentication

1. **Go to Authentication** → **Settings**
2. **Enable Email confirmation**: Turn OFF for development (optional)
3. **Set Site URL**: `http://localhost:3000` (for development)
4. **Add redirect URLs**:
   - `http://localhost:3000/user.html`
   - `http://localhost:3000/admin.html`
   - `http://localhost:3000/super_admin.html`

## Step 6: Test Your Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser** and go to `http://localhost:3000`

4. **Test authentication**:
   - Go to sign-in page
   - Try creating a test account
   - Check if authentication works

## Step 7: Create Your First Admin User

1. **Go to Supabase Dashboard** → **Authentication** → **Users**
2. **Click "Add user"**
3. **Fill in details**:
   - Email: your admin email
   - Password: secure password
   - Email confirm: Yes
4. **After user is created**, go to **Table Editor** → **user_profiles**
5. **Find your user** and edit the `role` field to `super_admin`

## 🔧 Configuration Files Created

- ✅ `package.json` - Added Supabase dependency
- ✅ `assets/js/supabase-config.js` - Database configuration
- ✅ `assets/js/auth.js` - Authentication handler
- ✅ `database/schema.sql` - Database schema
- ✅ `.env.example` - Environment variables template

## 🛡️ Security Features Implemented

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control** (user, admin, super_admin)
- **Automatic user profile creation** on signup
- **Activity logging** for audit trails
- **Session management** with automatic redirects

## 📊 Database Tables

### `user_profiles`
- Extends auth.users with additional fields
- Stores user role, status, and profile information

### `dashboard_stats`
- Stores dashboard statistics and metrics
- Only accessible by admins

### `activity_logs`
- Tracks user actions and system events
- Includes IP address and user agent

### `notifications`
- User-specific notifications
- Supports different notification types

### `app_settings`
- Application-wide settings
- Only modifiable by super admins

## 🎯 User Roles & Permissions

### User (role: 'user')
- Access to `user.html` dashboard
- Can view/edit own profile
- Can view own notifications and activity

### Admin (role: 'admin')
- Access to `admin.html` dashboard
- Can view all user profiles
- Can view dashboard statistics
- Can view all activity logs

### Super Admin (role: 'super_admin')
- Access to `super_admin.html` dashboard
- Full access to all features
- Can modify app settings
- Can manage user roles

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API key" error**:
   - Check your `.env` file has correct credentials
   - Verify you updated `supabase-config.js`

2. **Database connection fails**:
   - Ensure your Supabase project is active
   - Check your project URL is correct

3. **Authentication not working**:
   - Verify Site URL in Supabase Auth settings
   - Check redirect URLs are configured

4. **RLS policies blocking access**:
   - Ensure user has correct role in `user_profiles` table
   - Check RLS policies in Supabase dashboard

### Getting Help:

- Check browser console for error messages
- Review Supabase logs in dashboard
- Verify database tables were created correctly

## 🎉 Next Steps

Once setup is complete, you can:

1. **Customize the database schema** for your specific needs
2. **Add more tables** for your application data
3. **Implement additional features** like file uploads, real-time updates
4. **Deploy to production** with proper environment variables

## 📚 Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Your Supabase database is now ready for the Wowdash Admin Dashboard!** 🎊
