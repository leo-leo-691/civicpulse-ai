import os
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests

security = HTTPBearer()

def get_current_user_role(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    
    if token == "DEMO_TOKEN_ADMIN":
        return "admin"
    if token == "DEMO_TOKEN_POLICYMAKER":
        return "policymaker"
    if token == "DEMO_TOKEN_CITIZEN":
        return "citizen"

    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    
    if not client_id:
        raise HTTPException(status_code=500, detail="Google Client ID not configured on server")
        
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), client_id)
        email = id_info.get("email", "")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")
        
    policymaker_emails = [e.strip() for e in os.environ.get("POLICYMAKER_EMAILS", "").split(",") if e.strip()]
    admin_emails = [e.strip() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]
    
    if email in admin_emails:
        return "admin"
    elif email in policymaker_emails:
        return "policymaker"
    else:
        return "citizen" # Allow any valid Google user as citizen

def require_policymaker(role: str = Depends(get_current_user_role)):
    if role != "policymaker":
        raise HTTPException(status_code=403, detail="Requires policymaker role")
    return role

def require_admin(role: str = Depends(get_current_user_role)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Requires admin role")
    return role
