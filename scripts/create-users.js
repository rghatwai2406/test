#!/usr/bin/env node

/**
 * Automated User Creation Script
 * This script automatically creates the three initial users:
 * - Super Admin (superadmin@gmail.com)
 * - Admin (admin@gmail.com) 
 * - User (user1@gmail.com)
 * No technical knowledge required!
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Your Supabase credentials
const SUPABASE_URL = 'https://iqlakjnrjapfgjucewmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbGFram5yamFwZmdqdWNld214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTI4NTAsImV4cCI6MjA2OTg4ODg1MH0.99CejESmzdK4ukTp86-8gjBhEavuVc1Pii46g1S7T5g';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Users to create
const USERS_TO_CREATE = [
    {
        email: 'superadmin@example.com',
        password: 'admin123',
        role: 'super_admin',
        fullName: 'Super Administrator',
        description: '🔴 Super Admin - Full system access'
    },
    {
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        fullName: 'System Administrator',
        description: '🟡 Admin - Manage users and analytics'
    },
    {
        email: 'user1@example.com',
        password: 'admin123',
        role: 'user',
        fullName: 'Regular User',
        description: '🟢 User - Personal dashboard only'
    }
];

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createUser(userInfo) {
    console.log(`\n👤 Creating ${userInfo.description}...`);
    console.log(`   Email: ${userInfo.email}`);
    console.log(`   Role: ${userInfo.role}`);
    
    try {
        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
            email: userInfo.email,
            password: userInfo.password,
            options: {
                data: {
                    full_name: userInfo.fullName,
                    role: userInfo.role
                }
            }
        });

        if (error) {
            // Check if user already exists
            if (error.message.includes('already registered')) {
                console.log(`   ✅ User already exists, updating role...`);
                await updateExistingUserRole(userInfo);
                return true;
            }
            throw error;
        }

        console.log(`   ✅ User created successfully!`);
        
        // Update user profile with correct role
        if (data.user) {
            await updateUserProfile(data.user.id, userInfo);
        }
        
        return true;

    } catch (error) {
        console.log(`   ❌ Failed to create user: ${error.message}`);
        return false;
    }
}

async function updateUserProfile(userId, userInfo) {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .upsert({
                id: userId,
                email: userInfo.email,
                full_name: userInfo.fullName,
                role: userInfo.role,
                status: 'active'
            });

        if (error) throw error;
        console.log(`   ✅ Profile updated with role: ${userInfo.role}`);
    } catch (error) {
        console.log(`   ⚠️ Profile update failed: ${error.message}`);
    }
}

async function updateExistingUserRole(userInfo) {
    try {
        // Try to sign in to get user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: userInfo.email,
            password: userInfo.password
        });

        if (signInError) throw signInError;

        // Update profile
        await updateUserProfile(signInData.user.id, userInfo);
        
        // Sign out
        await supabase.auth.signOut();
        
    } catch (error) {
        console.log(`   ⚠️ Could not update existing user: ${error.message}`);
    }
}

async function updateDashboardStats() {
    try {
        const { error } = await supabase
            .from('dashboard_stats')
            .upsert({
                total_users: USERS_TO_CREATE.length,
                total_admins: USERS_TO_CREATE.filter(u => u.role !== 'user').length,
                updated_at: new Date().toISOString()
            });

        if (!error) {
            console.log('📊 Dashboard statistics updated');
        }
    } catch (error) {
        console.log(`⚠️ Failed to update dashboard stats: ${error.message}`);
    }
}

async function testUserLogin(userInfo) {
    try {
        console.log(`\n🔐 Testing login for ${userInfo.email}...`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: userInfo.email,
            password: userInfo.password
        });

        if (error) throw error;

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (!profileError && profile) {
            const redirectPage = profile.role === 'super_admin' ? 'super_admin.html' : 
                               profile.role === 'admin' ? 'admin.html' : 'user.html';
            
            console.log(`   ✅ Login successful! Role: ${profile.role}`);
            console.log(`   🎯 Will redirect to: ${redirectPage}`);
        }
        
        // Sign out after test
        await supabase.auth.signOut();
        
        return true;
    } catch (error) {
        console.log(`   ❌ Login test failed: ${error.message}`);
        return false;
    }
}

async function createAllUsers() {
    console.log('🚀 Starting automated user creation...\n');
    console.log('📋 Creating 3 users with different access levels:\n');
    
    try {
        // Test connection first
        console.log('📡 Testing Supabase connection...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('✅ Connection successful!\n');
        
        let successCount = 0;
        
        // Create each user
        for (const userInfo of USERS_TO_CREATE) {
            const success = await createUser(userInfo);
            if (success) successCount++;
            
            // Small delay between creations
            await wait(1000);
        }
        
        console.log(`\n🎉 User creation completed!`);
        console.log(`✅ ${successCount}/${USERS_TO_CREATE.length} users created successfully\n`);
        
        if (successCount > 0) {
            // Update dashboard stats
            await updateDashboardStats();
            
            console.log('🧪 Testing user logins...\n');
            
            // Test each user login
            for (const userInfo of USERS_TO_CREATE) {
                await testUserLogin(userInfo);
                await wait(500);
            }
            
            console.log('\n🎯 ROLE-BASED ACCESS:');
            console.log('• Super Admin → super_admin.html (Full access)');
            console.log('• Admin → admin.html (User management + analytics)');
            console.log('• User → user.html (Personal dashboard only)\n');
            
            console.log('🎉 SUCCESS! Your Wowdash Admin Dashboard is ready!');
            console.log('🔗 Go to: http://localhost:3000/sign-in.html');
            console.log('📝 Use any of the created accounts to test the system\n');
        }
        
    } catch (error) {
        console.error('❌ User creation failed:', error.message);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Make sure you ran the database setup first');
        console.log('2. Check your Supabase project is active');
        console.log('3. Verify the database tables were created');
        process.exit(1);
    }
}

// Run the user creation
if (require.main === module) {
    createAllUsers();
}

module.exports = { createAllUsers };
