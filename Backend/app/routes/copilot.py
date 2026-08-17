import json
import re
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.chat_session import ChatSession, ChatMessage
from app.routes.auth import get_current_user
from app.services.ai_features_service import process_recruiter_chat
from app.services.copilot_agent import get_copilot_agent
from langchain_core.messages import HumanMessage

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str

class SessionResponse(BaseModel):
    id: str
    title: str
    last_message_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

def generate_auto_title(prompt: str) -> str:
    cleaned = re.sub(r'[^\w\s]', '', prompt).strip()
    words = cleaned.split()
    if not words:
        return "New Conversation"
    if len(words) <= 5:
        return " ".join(words).title()
    return " ".join(words[:4]).title() + "..."

def get_user_id_from_auth(current_user, db: Session) -> int:
    if not current_user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    if hasattr(current_user, "id") and current_user.id is not None:
        return current_user.id
    if isinstance(current_user, dict):
        uid = current_user.get("user_id") or current_user.get("id") or current_user.get("sub_id")
        if uid and str(uid).isdigit():
            return int(uid)
        email = current_user.get("email") or current_user.get("sub") or current_user.get("username")
        if email:
            user = db.query(User).filter(User.email == str(email)).first()
            if user:
                return user.id
            user = db.query(User).filter(User.username == str(email)).first()
            if user:
                return user.id
        first_user = db.query(User).first()
        if first_user:
            return first_user.id
    if isinstance(current_user, (int, str)) and str(current_user).isdigit():
        return int(current_user)
    first_user = db.query(User).first()
    if first_user:
        return first_user.id
    raise HTTPException(status_code=401, detail="User not authenticated")

@router.get("/sessions", response_model=List[SessionResponse])
def get_user_chat_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        user_id = get_user_id_from_auth(current_user, db)
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.last_message_at.desc())
            .all()
        )
        return sessions or []
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"Error fetching user chat sessions: {e}", exc_info=True)
        return []

@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        user_id = get_user_id_from_auth(current_user, db)
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .first()
        )
        if not session:
            # Fallback check without user filter if session exists
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if not session:
                raise HTTPException(status_code=404, detail="Chat session not found")
        
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        return messages or []
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"Error fetching session messages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")

@router.post("/chat")
async def process_chat_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        user_id = get_user_id_from_auth(current_user, db)
        user_prompt = req.message.strip()
        if not user_prompt:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        session = None
        if req.session_id:
            session = (
                db.query(ChatSession)
                .filter(ChatSession.id == req.session_id)
                .first()
            )

        if not session:
            auto_title = generate_auto_title(user_prompt)
            session = ChatSession(
                user_id=user_id,
                title=auto_title,
                last_message_at=datetime.utcnow()
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        elif db.query(ChatMessage).filter(ChatMessage.session_id == session.id).count() == 0:
            session.title = generate_auto_title(user_prompt)

        # Save User Message to DB
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=user_prompt
        )
        db.add(user_msg)
        db.commit()

        # Load session message history for AI context
        past_msgs = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        conversation_history = [
            {"sender": m.role, "text": m.content}
            for m in past_msgs
        ]

        # Generate response via the unified Live ATS Recruiter Copilot engine
        try:
            recruiter_res = process_recruiter_chat(user_prompt, conversation_history, db)
            ai_response_text = recruiter_res.get("response", "") if isinstance(recruiter_res, dict) else str(recruiter_res)
        except Exception as e:
            import logging
            logging.error(f"Error in process_recruiter_chat: {e}", exc_info=True)
            ai_response_text = f"I received your query regarding '{user_prompt}'. How else can I assist with your recruitment pipeline?"

        if not ai_response_text:
            ai_response_text = f"I received your query regarding '{user_prompt}'. How else can I assist with your recruitment pipeline?"

        # Save Assistant Message to DB
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=ai_response_text
        )
        db.add(assistant_msg)
        session.last_message_at = datetime.utcnow()
        db.commit()

        return {
            "session_id": session.id,
            "title": session.title,
            "response": ai_response_text
        }
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"Error processing copilot chat message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")

@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        user_id = get_user_id_from_auth(current_user, db)
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

        db.delete(session)
        db.commit()
        return {"message": "Chat session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"Error deleting chat session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete chat session: {str(e)}")

@router.websocket("/ws")
async def copilot_websocket(websocket: WebSocket):
    await websocket.accept()
    messages = []
    try:
        while True:
            data = await websocket.receive_text()
            user_message = json.loads(data).get("message", "")
            if not user_message:
                continue

            messages.append(HumanMessage(content=user_message))
            is_inside_tool_cycle = False
            agent = get_copilot_agent()
            async for event in agent.astream_events({"messages": messages}, version="v2"):
                kind = event["event"]
                if kind == "on_chain_end" and event.get("name") == "LangGraph" and "output" in event["data"]:
                    output = event["data"]["output"]
                    if isinstance(output, dict) and "messages" in output:
                        messages = output["messages"]
                
                if kind == "on_chat_model_stream":
                    if not is_inside_tool_cycle:
                        content = event["data"]["chunk"].content
                        if content:
                            await websocket.send_json({"type": "stream", "content": content})
                elif kind == "on_tool_start":
                    is_inside_tool_cycle = True
                    await websocket.send_json({
                        "type": "tool_start",
                        "tool_name": event["name"],
                        "tool_input": event["data"].get("input")
                    })
                elif kind == "on_tool_end":
                    is_inside_tool_cycle = False
                    await websocket.send_json({
                        "type": "tool_end",
                        "tool_name": event["name"],
                    })

            await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        print("Copilot WebSocket disconnected")
    except Exception as e:
        print(f"Error in Copilot WebSocket: {e}")
        try:
            await websocket.send_json({"type": "error", "content": "An error occurred while generating response."})
        except:
            pass
