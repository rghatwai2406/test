// Stable Authentication System for Wowdash
// Designed to eliminate all flickering and redirect loops

class StableAuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.isRedirecting = false;
        this.authStateListenerSet = false;
        
        // Prevent multiple initializations
        if (window.stableAuthManager) {
            return window.stableAuthManager;
        }
        
        window.stableAuthManager = this;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🔧 Initializing Stable Auth Manager');
        
        // Determine current page type
        const currentPath = window.location.pathname;
        const isSignInPage = currentPath.includes('sign-in.html');
        const isDashboardPage = currentPath.includes('user.html') || 
                               currentPath.includes('admin.html') || 
                               currentPath.includes('super_admin.html');
        
        console.log('📍 Current page:', currentPath, 'isSignIn:', isSignInPage, 'isDashboard:', isDashboardPage);
        
        try {
            // Check current auth state
            const { data: { user } } = await supabase.auth.getUser();
            this.currentUser = user;
            
            console.log('👤 Current user:', user ? user.email : 'None');
            
            // Handle based on current state and page
            if (user && isSignInPage) {
                // User is logged in but on sign-in page - redirect to dashboard
                console.log('✅ User authenticated on sign-in page - redirecting to dashboard');
                await this.redirectToDashboard(user.email);
            } else if (!user && isDashboardPage) {
                // User not logged in but on dashboard - redirect to sign-in
                console.log('❌ User not authenticated on dashboard - redirecting to sign-in');
                this.redirectToSignIn();
            } else {
                console.log('✅ User on correct page - no redirect needed');
            }
            
            // Set up auth state listener only once
            this.setupAuthStateListener();
            
        } catch (error) {
            console.error('❌ Auth initialization error:', error);
        }
        
        this.isInitialized = true;
    }

    setupAuthStateListener() {
        if (this.authStateListenerSet) return;
        
        console.log('🔗 Setting up auth state listener');
        
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state change:', event);
            
            // Prevent handling during redirects
            if (this.isRedirecting) {
                console.log('🚫 Ignoring auth state change during redirect');
                return;
            }
            
            const currentPath = window.location.pathname;
            const isSignInPage = currentPath.includes('sign-in.html');
            
            if (event === 'SIGNED_IN' && session?.user) {
                this.currentUser = session.user;
                
                // Only redirect if on sign-in page
                if (isSignInPage) {
                    console.log('✅ User signed in - redirecting from sign-in page');
                    this.redirectToDashboard(session.user.email);
                }
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                
                // Only redirect if not already on sign-in page
                if (!isSignInPage) {
                    console.log('❌ User signed out - redirecting to sign-in');
                    this.redirectToSignIn();
                }
            }
        });
        
        this.authStateListenerSet = true;
    }

    async handleSignIn(email, password) {
        if (this.isRedirecting) return false;
        
        try {
            console.log('🔐 Attempting sign in for:', email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('❌ Sign in error:', error.message);
                this.showError(error.message);
                return false;
            }
            
            console.log('✅ Sign in successful');
            this.currentUser = data.user;
            
            // Redirect will be handled by auth state listener
            return true;
            
        } catch (error) {
            console.error('❌ Sign in exception:', error);
            this.showError('An unexpected error occurred. Please try again.');
            return false;
        }
    }

    async handleSignOut() {
        if (this.isRedirecting) return;
        
        try {
            console.log('🚪 Signing out user');
            
            this.isRedirecting = true;
            await supabase.auth.signOut();
            
            // Force redirect to sign-in
            window.location.href = 'sign-in.html';
            
        } catch (error) {
            console.error('❌ Sign out error:', error);
            // Force redirect even on error
            window.location.href = 'sign-in.html';
        }
    }

    async redirectToDashboard(email) {
        if (this.isRedirecting) return;
        
        this.isRedirecting = true;
        
        // Determine role based on email
        let targetPage = 'user.html'; // default
        
        if (email.toLowerCase() === 'superadmin@example.com') {
            targetPage = 'super_admin.html';
        } else if (email.toLowerCase() === 'admin@example.com') {
            targetPage = 'admin.html';
        } else if (email.toLowerCase() === 'user1@example.com') {
            targetPage = 'user.html';
        }
        
        console.log('🎯 Redirecting to:', targetPage);
        
        // Small delay to ensure state is stable
        setTimeout(() => {
            window.location.href = targetPage;
        }, 100);
    }

    redirectToSignIn() {
        if (this.isRedirecting) return;
        
        this.isRedirecting = true;
        console.log('🔙 Redirecting to sign-in page');
        
        setTimeout(() => {
            window.location.href = 'sign-in.html';
        }, 100);
    }

    showError(message) {
        // Simple error display
        const existingAlert = document.querySelector('.auth-error-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = 'auth-error-alert alert alert-danger';
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Simple success display
        const existingAlert = document.querySelector('.auth-success-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = 'auth-success-alert alert alert-success';
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }
}

// Initialize the stable auth manager
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if not already done
    if (!window.stableAuthManager) {
        window.stableAuthManager = new StableAuthManager();
    }
});
