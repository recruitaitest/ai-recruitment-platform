import os

from fastapi import HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token


GOOGLE_CLIENT_ID = (
    os.getenv("GOOGLE_CLIENT_ID")
    or os.getenv("GMAIL_CLIENT_ID")
)


def verify_google_token(credential: str):
    try:
        user_info = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token",
        )

    if not user_info.get("email_verified"):
        raise HTTPException(
            status_code=401,
            detail="Google email is not verified.",
        )

    return {
        "provider_id": user_info["sub"],
        "email": user_info["email"],
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
        "email_verified": user_info.get("email_verified", False),
    }

def get_calendar_service():
    import google.auth
    from googleapiclient.discovery import build
    try:
        credentials, _ = google.auth.default(scopes=['https://www.googleapis.com/auth/calendar.events'])
        service = build('calendar', 'v3', credentials=credentials)
        return service
    except Exception as e:
        print(f"Failed to initialize Google Calendar Service: {e}")
        return None

def create_calendar_event(summary: str, description: str, start_time: str, end_time: str, attendees: list, location: str = ""):
    service = get_calendar_service()
    if not service:
        print("Calendar service not available. Skipping event creation.")
        return None

    event = {
        'summary': summary,
        'location': location,
        'description': description,
        'start': {
            'dateTime': start_time,
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': end_time,
            'timeZone': 'UTC',
        },
        'attendees': [{'email': email} for email in attendees if email],
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60},
                {'method': 'popup', 'minutes': 10},
            ],
        },
    }

    try:
        event = service.events().insert(calendarId='primary', body=event).execute()
        print(f"Event created: {event.get('htmlLink')}")
        return event.get('htmlLink')
    except Exception as e:
        print(f"Error creating calendar event: {e}")
        return None