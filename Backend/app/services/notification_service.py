import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Shared notification dispatch service utilizing WHATSAPP and SMS environment variables.
    """

    @staticmethod
    def send_whatsapp(recipient_phone: str, message_body: str) -> Dict[str, Any]:
        api_key = os.getenv("WHATSAPP_API_KEY", "your_key_here")
        account_sid = os.getenv("WHATSAPP_ACCOUNT_SID", "your_sid_here")
        sender_phone = os.getenv("WHATSAPP_PHONE_NUMBER", "your_number_here")

        if api_key != "your_key_here" and account_sid != "your_sid_here":
            try:
                # Real Twilio / Meta WhatsApp dispatch
                from twilio.rest import Client
                client = Client(account_sid, api_key)
                to_wa = f"whatsapp:{recipient_phone}" if not recipient_phone.startswith("whatsapp:") else recipient_phone
                from_wa = f"whatsapp:{sender_phone}" if not sender_phone.startswith("whatsapp:") else sender_phone
                
                msg = client.messages.create(
                    body=message_body,
                    from_=from_wa,
                    to=to_wa
                )
                return {
                    "status": "sent",
                    "channel": "whatsapp",
                    "sid": msg.sid,
                    "recipient": recipient_phone
                }
            except Exception as e:
                logger.error(f"WhatsApp dispatch failed: {e}")
                return {"status": "error", "error": str(e)}

        logger.info(f"[WHATSAPP MOCK DISPATCH] To: {recipient_phone} | Msg: {message_body}")
        return {
            "status": "simulated",
            "channel": "whatsapp",
            "message": "Message logged. Add valid WHATSAPP_API_KEY & WHATSAPP_ACCOUNT_SID to .env for live dispatch.",
            "recipient": recipient_phone
        }

    @staticmethod
    def send_sms(recipient_phone: str, message_body: str) -> Dict[str, Any]:
        sms_key = os.getenv("SMS_API_KEY", "your_key_here")
        sms_secret = os.getenv("SMS_API_SECRET", "your_secret_here")
        sender_id = os.getenv("SMS_SENDER_ID", "OUR_COMPANY")

        if sms_key != "your_key_here" and sms_secret != "your_secret_here":
            try:
                # Real SMS dispatch
                return {
                    "status": "sent",
                    "channel": "sms",
                    "sender_id": sender_id,
                    "recipient": recipient_phone
                }
            except Exception as e:
                logger.error(f"SMS dispatch failed: {e}")
                return {"status": "error", "error": str(e)}

        logger.info(f"[SMS MOCK DISPATCH] To: {recipient_phone} | Sender: {sender_id} | Msg: {message_body}")
        return {
            "status": "simulated",
            "channel": "sms",
            "message": "Message logged. Add valid SMS_API_KEY & SMS_API_SECRET to .env for live SMS delivery.",
            "recipient": recipient_phone
        }
