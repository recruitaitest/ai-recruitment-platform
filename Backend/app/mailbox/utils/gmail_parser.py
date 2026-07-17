import base64
from email.utils import parsedate_to_datetime
from email.utils import parseaddr

def get_header(headers, name):
    """
    Extract a header value from Gmail message headers.
    """

    for header in headers:
        if header["name"].lower() == name.lower():
            return header["value"]

    return None

def decode_body(data):
    """
    Decode Gmail Base64 URL-safe body.
    """

    if not data:
        return ""

    padding = "=" * (-len(data) % 4)

    return base64.urlsafe_b64decode(
        data + padding
    ).decode(
        "utf-8",
        errors="ignore"
    )
    
def extract_body(payload):

    body = payload.get("body", {})

    if body.get("data"):
        return decode_body(body["data"])

    for part in payload.get("parts", []):

        if part.get("mimeType") == "text/plain":
            return decode_body(
                part.get("body", {}).get("data")
            )

        if part.get("parts"):
            text = extract_body(part)
            if text:
                return text

    return ""

def has_attachments(payload):

    for part in payload.get("parts", []):

        if part.get("filename"):
            return True

    return False

def extract_email(message):

    payload = message["payload"]

    headers = payload.get(
        "headers",
        []
    )

    sender_name, sender_email = parseaddr(
        get_header(headers, "From") or ""
    )

    return {

        "provider_message_id": message["id"],
        "thread_id": message.get("threadId"),
        "in_reply_to": get_header(headers, "In-Reply-To"),
        "references": get_header(headers, "References"),

        "sender_name": sender_name,

        "sender_email": sender_email,

        "recipient": get_header(
            headers,
            "To"
        ),

        "subject": get_header(
            headers,
            "Subject"
        ),

        "received_at": parsedate_to_datetime(
            get_header(
                headers,
                "Date"
            )
        ),

        "body": extract_body(
            payload
        ),

        "snippet": message.get(
            "snippet",
            ""
        ),

        "has_attachment": has_attachments(
            payload
        ),
    }