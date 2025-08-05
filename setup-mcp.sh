#!/bin/bash

echo "🚀 Setting up MCP Supabase Server for Windsurf..."

# Install MCP Supabase Server
echo "📦 Installing MCP Supabase Server..."
npm install --save-dev @modelcontextprotocol/server-supabase

echo "✅ MCP Supabase Server installed!"
echo ""
echo "🔧 Next steps:"
echo "1. Update your .env file with your actual Supabase credentials"
echo "2. Restart Windsurf IDE"
echo "3. You can now ask Windsurf to create database tables and manage your Supabase database!"
echo ""
echo "📋 To get your Supabase credentials:"
echo "   → Go to https://supabase.com/dashboard"
echo "   → Select your project"
echo "   → Go to Settings → API"
echo "   → Copy Project URL and both anon + service_role keys"
echo ""
