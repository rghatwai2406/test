// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://iqlakjnrjapfgjucewmx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbGFram5yamFwZmdqdWNld214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTI4NTAsImV4cCI6MjA2OTg4ODg1MH0.99CejESmzdK4ukTp86-8gjBhEavuVc1Pii46g1S7T5g'

// Initialize Supabase client
const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Export for use in other files
window.supabase = supabaseClient

// Database helper functions
const DatabaseHelper = {
    // Users table operations
    users: {
        // Get all users
        async getAll() {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
            return { data, error }
        },

        // Get user by ID
        async getById(id) {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', id)
                .single()
            return { data, error }
        },

        // Create new user
        async create(userData) {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .insert([userData])
                .select()
            return { data, error }
        },

        // Update user
        async update(id, userData) {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .update(userData)
                .eq('id', id)
                .select()
            return { data, error }
        },

        // Delete user
        async delete(id) {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .delete()
                .eq('id', id)
            return { data, error }
        }
    },

    // Authentication functions
    auth: {
        // Sign up new user
        async signUp(email, password, userData = {}) {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            })
            return { data, error }
        },

        // Sign in user
        async signIn(email, password) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            })
            return { data, error }
        },

        // Sign out user
        async signOut() {
            const { error } = await supabaseClient.auth.signOut()
            return { error }
        },

        // Get current user
        async getCurrentUser() {
            const { data: { user } } = await supabaseClient.auth.getUser()
            return user
        },

        // Listen to auth changes
        onAuthStateChange(callback) {
            return supabaseClient.auth.onAuthStateChange(callback)
        }
    },

    // Dashboard data operations
    dashboard: {
        // Get dashboard stats
        async getStats() {
            const { data, error } = await supabaseClient
                .from('dashboard_stats')
                .select('*')
            return { data, error }
        },

        // Update dashboard stats
        async updateStats(statsData) {
            const { data, error } = await supabaseClient
                .from('dashboard_stats')
                .upsert(statsData)
                .select()
            return { data, error }
        }
    }
}

// Make DatabaseHelper available globally
window.DatabaseHelper = DatabaseHelper

console.log('Supabase configuration loaded successfully!')
