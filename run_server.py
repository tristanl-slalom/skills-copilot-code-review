#!/usr/bin/env python3
"""
Test script to verify the announcement system functionality
"""

import uvicorn
from src.app import app

if __name__ == "__main__":
    print("🚀 Starting Mergington High School API with Announcement System...")
    print("📢 Database-driven announcements are now available!")
    print("🔗 Open http://localhost:8001 in your browser")
    print("👤 Login with: username='principal', password='admin789'")
    print("⚙️  Click 'Manage Announcements' to test CRUD operations")
    print("=" * 60)
    
    uvicorn.run(
        "src.app:app", 
        host="0.0.0.0", 
        port=8001, 
        reload=True,
        log_level="info"
    )