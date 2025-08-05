// Authentication Handler for Wowdash Admin Dashboard
// Handles user login, logout, and session management with Supabase

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authListenerSet = false;
        this.init();
    }

    async init() {
        // Check if we're on a dashboard page to prevent unnecessary redirects
        const isDashboard = window.isDashboardPage || 
                           window.location.pathname.includes('user.html') ||
                           window.location.pathname.includes('admin.html') ||
                           window.location.pathname.includes('super_admin.html');
        
        // Check if user is already logged in
        const user = await DatabaseHelper.auth.getCurrentUser();
        if (user) {
            this.currentUser = user;
            // Only handle auth redirects if we're on sign-in page
            if (window.location.pathname.includes('sign-in.html')) {
                this.handleAuthenticatedUser();
            } else if (isDashboard) {
                console.log('User authenticated on dashboard page - no redirect needed');
            }
        } else if (isDashboard) {
            // User not authenticated but on dashboard - redirect to sign-in
            console.log('User not authenticated on dashboard - redirecting to sign-in');
            window.location.href = 'sign-in.html';
            return;
        }

        // Listen for auth state changes (only once)
        if (!this.authListenerSet) {
            DatabaseHelper.auth.onAuthStateChange((event, session) => {
                console.log('Auth state change:', event, 'isDashboard:', isDashboard);
                if (event === 'SIGNED_IN' && session?.user) {
                    this.currentUser = session.user;
                    // Only redirect if we're on sign-in page
                    if (window.location.pathname.includes('sign-in.html')) {
                        this.handleAuthenticatedUser();
                    }
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    // Only redirect to sign-in if we're not already there
                    if (!window.location.pathname.includes('sign-in.html')) {
                        window.location.href = 'sign-in.html';
                    }
                }
            });
            this.authListenerSet = true;
        }
    }

    // Handle sign in form submission
    async handleSignIn(email, password) {
        try {
            console.log('🔐 Attempting sign in for:', email);
            const { data, error } = await DatabaseHelper.auth.signIn(email, password);
            
            if (error) {
                console.error('❌ Sign in error:', error);
                this.showError(error.message);
                return false;
            }

            console.log('✅ Authentication successful for user:', data.user.email);
            console.log('🆔 User ID:', data.user.id);

            // Get user profile to check role
            console.log('📋 Fetching user profile...');
            const { data: profile, error: profileError } = await DatabaseHelper.users.getById(data.user.id);
            
            if (profileError) {
                console.error('❌ Error fetching user profile:', profileError);
                console.log('⚠️ Profile error details:', profileError);
                
                // If no profile exists, create one with default role
                console.log('🔧 Creating default user profile...');
                await this.createDefaultProfile(data.user);
                
                // Default to user role if profile fetch fails
                console.log('🎯 Using default role: user');
                this.redirectBasedOnRole('user');
                return true;
            }

            console.log('✅ User profile found:', profile);
            console.log('👤 User role:', profile?.role);
            console.log('📧 Profile email:', profile?.email);

            // Log activity
            await this.logActivity('sign_in', 'User signed in successfully');

            // Determine role with email-based override (more reliable than database)
            let userRole = 'user'; // default
            
            // Email-based role detection (primary method)
            if (email.toLowerCase() === 'superadmin@example.com') {
                userRole = 'super_admin';
                console.log('🔴 SUPER ADMIN detected by email match: super_admin');
            } else if (email.toLowerCase() === 'admin@example.com') {
                userRole = 'admin';
                console.log('🟡 ADMIN detected by email match: admin');
            } else if (email.toLowerCase() === 'user1@example.com') {
                userRole = 'user';
                console.log('🟢 USER detected by email match: user');
            } else {
                // Fallback to database role if email doesn't match predefined accounts
                userRole = profile?.role || 'user';
                console.log('📋 Using database role as fallback:', userRole);
            }

            console.log('🎯 FINAL ROLE DECISION:', userRole);
            console.log('🚀 REDIRECTING TO:', userRole === 'super_admin' ? 'super_admin.html' : userRole === 'admin' ? 'admin.html' : 'user.html');

            // Redirect based on user role
            this.redirectBasedOnRole(userRole);
            return true;

        } catch (error) {
            console.error('❌ Sign in error:', error);
            this.showError('An unexpected error occurred. Please try again.');
            return false;
        }
    }

    // Handle sign up
    async handleSignUp(email, password, fullName, role = 'user') {
        try {
            const { data, error } = await DatabaseHelper.auth.signUp(email, password, {
                full_name: fullName,
                role: role
            });

            if (error) {
                this.showError(error.message);
                return false;
            }

            this.showSuccess('Account created successfully! Please check your email to verify your account.');
            return true;

        } catch (error) {
            console.error('Sign up error:', error);
            this.showError('An unexpected error occurred. Please try again.');
            return false;
        }
    }

    // Create default profile for user if it doesn't exist
    async createDefaultProfile(user) {
        try {
            let role = 'user'; // default role
            
            // Determine role based on email
            if (user.email.toLowerCase().includes('superadmin')) {
                role = 'super_admin';
            } else if (user.email.toLowerCase().includes('admin') && !user.email.toLowerCase().includes('superadmin')) {
                role = 'admin';
            }
            
            console.log(`🔧 Creating profile for ${user.email} with role: ${role}`);
            
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                    role: role,
                    status: 'active'
                });

            if (error) {
                console.error('❌ Failed to create default profile:', error);
            } else {
                console.log('✅ Default profile created successfully');
            }
        } catch (error) {
            console.error('❌ Error creating default profile:', error);
        }
    }

    // Handle sign out
    async handleSignOut() {
        try {
            await this.logActivity('sign_out', 'User signed out');
            await DatabaseHelper.auth.signOut();
            
            // Redirect to sign in page
            window.location.href = 'sign-in.html';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    // Redirect user based on their role
    redirectBasedOnRole(role) {
        const redirectMap = {
            'user': 'user.html',
            'admin': 'admin.html', 
            'super_admin': 'super_admin.html'
        };

        const redirectUrl = redirectMap[role] || 'user.html';
        const currentPage = window.location.pathname.split('/').pop();
        
        // Log the redirect for debugging
        console.log(`Current page: ${currentPage}, Target page: ${redirectUrl}`);
        
        // Only redirect if we're not already on the correct page
        if (currentPage !== redirectUrl) {
            console.log(`Redirecting user with role '${role}' to: ${redirectUrl}`);
            window.location.href = redirectUrl;
        } else {
            console.log(`Already on correct page: ${redirectUrl}`);
        }
    }

    // Handle authenticated user
    handleAuthenticatedUser() {
        // If on sign-in page, redirect to appropriate dashboard
        if (window.location.pathname.includes('sign-in.html')) {
            this.getUserProfileAndRedirect();
        }
        
        // Update UI elements for authenticated user
        this.updateAuthenticatedUI();
    }

    // Get user profile and redirect
    async getUserProfileAndRedirect() {
        if (this.currentUser) {
            const { data: profile } = await DatabaseHelper.users.getById(this.currentUser.id);
            this.redirectBasedOnRole(profile?.role || 'user');
        }
    }

    // Update UI for authenticated user
    updateAuthenticatedUI() {
        // Update user info in navigation
        const userNameElements = document.querySelectorAll('.user-name');
        const userEmailElements = document.querySelectorAll('.user-email');
        const userAvatarElements = document.querySelectorAll('.user-avatar');

        if (this.currentUser) {
            userNameElements.forEach(el => {
                el.textContent = this.currentUser.user_metadata?.full_name || 'User';
            });
            
            userEmailElements.forEach(el => {
                el.textContent = this.currentUser.email;
            });

            userAvatarElements.forEach(el => {
                if (this.currentUser.user_metadata?.avatar_url) {
                    el.src = this.currentUser.user_metadata.avatar_url;
                }
            });
        }
    }

    // Log user activity
    async logActivity(action, description) {
        try {
            await supabase
                .from('activity_logs')
                .insert([{
                    user_id: this.currentUser?.id,
                    action: action,
                    description: description,
                    ip_address: await this.getClientIP(),
                    user_agent: navigator.userAgent
                }]);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // Get client IP (simplified version)
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return null;
        }
    }

    // Show error message
    showError(message) {
        // Create or update error alert
        this.showAlert(message, 'error');
    }

    // Show success message
    showSuccess(message) {
        // Create or update success alert
        this.showAlert(message, 'success');
    }

    // Show alert message
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.auth-alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `auth-alert alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert alert at the top of the form
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(alertDiv, form.firstChild);
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Check if user has required role
    async hasRole(requiredRole) {
        if (!this.currentUser) return false;

        const { data: profile } = await DatabaseHelper.users.getById(this.currentUser.id);
        const userRole = profile?.role || 'user';

        const roleHierarchy = {
            'user': 1,
            'admin': 2,
            'super_admin': 3
        };

        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }

    // Protect page based on required role
    async protectPage(requiredRole = 'user') {
        if (!this.currentUser) {
            window.location.href = 'sign-in.html';
            return false;
        }

        const hasAccess = await this.hasRole(requiredRole);
        if (!hasAccess) {
            this.showError('You do not have permission to access this page.');
            setTimeout(() => {
                window.location.href = 'user.html';
            }, 2000);
            return false;
        }

        return true;
    }
}

// Initialize AuthManager
const authManager = new AuthManager();

// Make it globally available
window.authManager = authManager;

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Handle sign-in form
    const signInForm = document.querySelector('#signInForm, form');
    if (signInForm && window.location.pathname.includes('sign-in.html')) {
        signInForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.querySelector('input[type="email"]').value;
            const password = document.querySelector('input[type="password"]').value;
            
            if (!email || !password) {
                authManager.showError('Please fill in all fields.');
                return;
            }

            // Show loading state
            const submitBtn = signInForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing in...';
            submitBtn.disabled = true;

            const success = await authManager.handleSignIn(email, password);

            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }

    // Handle logout buttons
    const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            authManager.handleSignOut();
        });
    });

    // Protect admin pages
    if (window.location.pathname.includes('admin.html')) {
        authManager.protectPage('admin');
    } else if (window.location.pathname.includes('super_admin.html')) {
        authManager.protectPage('super_admin');
    } else if (window.location.pathname.includes('user.html')) {
        authManager.protectPage('user');
    }
});

console.log('Authentication system initialized!');
