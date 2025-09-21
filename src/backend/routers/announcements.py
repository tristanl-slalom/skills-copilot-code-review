"""
Announcements endpoints for the High School Management System API
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from bson import ObjectId

from ..database import announcements_collection, teachers_collection

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"]
)


def is_valid_object_id(id_str: str) -> bool:
    """Check if a string is a valid ObjectId"""
    try:
        ObjectId(id_str)
        return True
    except Exception:
        return False


def serialize_announcement(announcement: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-serializable format"""
    if "_id" in announcement:
        announcement["id"] = str(announcement["_id"])
        del announcement["_id"]
    return announcement


def is_announcement_active(announcement: Dict[str, Any]) -> bool:
    """Check if an announcement is currently active based on dates"""
    current_date = datetime.now(timezone.utc).date()
    
    # Check expiration date (required)
    if "expiration_date" in announcement:
        expiration_date = datetime.fromisoformat(announcement["expiration_date"]).date()
        if current_date > expiration_date:
            return False
    
    # Check start date (optional)
    if "start_date" in announcement:
        start_date = datetime.fromisoformat(announcement["start_date"]).date()
        if current_date < start_date:
            return False
    
    return True


@router.get("/")
def get_active_announcements() -> List[Dict[str, Any]]:
    """Get all currently active announcements for public display"""
    try:
        announcements = list(announcements_collection.find())
        active_announcements = []
        
        for announcement in announcements:
            if is_announcement_active(announcement):
                active_announcements.append(serialize_announcement(announcement))
        
        # Sort by creation date, newest first
        active_announcements.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return active_announcements
    except Exception as e:
        # Log error but don't expose to frontend per backend guidelines
        print(f"Error fetching active announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")


@router.get("/manage")
def get_all_announcements(teacher_username: str = Query(...)) -> List[Dict[str, Any]]:
    """Get all announcements for management (authenticated users only)"""
    # Verify teacher exists
    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        announcements = list(announcements_collection.find())
        result = []
        
        for announcement in announcements:
            serialized = serialize_announcement(announcement)
            # Add active status for management view
            serialized["is_active"] = is_announcement_active(announcement)
            result.append(serialized)
        
        # Sort by creation date, newest first
        result.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return result
    except Exception as e:
        print(f"Error fetching announcements for management: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")


@router.post("/")
def create_announcement(
    title: str,
    message: str,
    expiration_date: str,
    teacher_username: str = Query(...),
    start_date: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new announcement (authenticated users only)"""
    # Verify teacher exists
    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Validate required fields
    if not title or not message or not expiration_date:
        raise HTTPException(status_code=400, detail="Title, message, and expiration_date are required")
    
    # Validate date formats
    try:
        exp_date = datetime.fromisoformat(expiration_date)
        if start_date:
            start_date_obj = datetime.fromisoformat(start_date)
            if start_date_obj > exp_date:
                raise HTTPException(status_code=400, detail="Start date cannot be after expiration date")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Validate expiration date is not in the past
    if exp_date.date() < datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="Expiration date cannot be in the past")
    
    try:
        announcement = {
            "title": title.strip(),
            "message": message.strip(),
            "expiration_date": expiration_date,
            "created_by": teacher_username,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        if start_date:
            announcement["start_date"] = start_date
        
        result = announcements_collection.insert_one(announcement)
        announcement["id"] = str(result.inserted_id)
        if "_id" in announcement:
            del announcement["_id"]
        
        return {"message": "Announcement created successfully", "announcement": announcement}
    except Exception as e:
        print(f"Error creating announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to create announcement")


@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: str,
    title: str,
    message: str,
    expiration_date: str,
    teacher_username: str = Query(...),
    start_date: Optional[str] = None
) -> Dict[str, Any]:
    """Update an existing announcement (authenticated users only)"""
    # Verify teacher exists
    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Validate ObjectId
    if not is_valid_object_id(announcement_id):
        raise HTTPException(status_code=400, detail="Invalid announcement ID")
    
    # Validate required fields
    if not title or not message or not expiration_date:
        raise HTTPException(status_code=400, detail="Title, message, and expiration_date are required")
    
    # Validate date formats
    try:
        exp_date = datetime.fromisoformat(expiration_date)
        if start_date:
            start_date_obj = datetime.fromisoformat(start_date)
            if start_date_obj > exp_date:
                raise HTTPException(status_code=400, detail="Start date cannot be after expiration date")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Validate expiration date is not in the past
    if exp_date.date() < datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="Expiration date cannot be in the past")
    
    try:
        # Check if announcement exists
        existing = announcements_collection.find_one({"_id": ObjectId(announcement_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        update_data = {
            "title": title.strip(),
            "message": message.strip(),
            "expiration_date": expiration_date,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": teacher_username
        }
        
        if start_date:
            update_data["start_date"] = start_date
        else:
            # Remove start_date if not provided
            announcements_collection.update_one(
                {"_id": ObjectId(announcement_id)},
                {"$unset": {"start_date": ""}}
            )
        
        result = announcements_collection.update_one(
            {"_id": ObjectId(announcement_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        return {"message": "Announcement updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to update announcement")


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    teacher_username: str = Query(...)
) -> Dict[str, Any]:
    """Delete an announcement (authenticated users only)"""
    # Verify teacher exists
    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Validate ObjectId
    if not is_valid_object_id(announcement_id):
        raise HTTPException(status_code=400, detail="Invalid announcement ID")
    
    try:
        result = announcements_collection.delete_one({"_id": ObjectId(announcement_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        return {"message": "Announcement deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete announcement")