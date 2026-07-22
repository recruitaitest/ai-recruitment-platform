import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage
from app.services.copilot_agent import agent_executor

router = APIRouter()

@router.websocket("/ws")
async def copilot_websocket(websocket: WebSocket):
    await websocket.accept()
    
    # Keep track of the chat history in memory for this session
    messages = []
    
    try:
        while True:
            # Receive input from the frontend
            data = await websocket.receive_text()
            user_message = json.loads(data).get("message", "")
            
            if not user_message:
                continue

            # Append the user message
            messages.append(HumanMessage(content=user_message))
            
            # Track whether the agent is currently inside a tool call cycle.
            # When a tool starts, we suppress LLM streaming (those are just
            # the model's internal "reasoning" tokens to decide tool args).
            # We only stream the final-answer LLM tokens that come AFTER
            # all tools have finished.
            is_inside_tool_cycle = False
            
            # Stream the response from LangGraph
            async for event in agent_executor.astream_events(
                {"messages": messages}, 
                version="v2"
            ):
                kind = event["event"]
                
                # Capture the final state from the root graph execution
                if kind == "on_chain_end" and event.get("name") == "LangGraph" and "output" in event["data"]:
                    output = event["data"]["output"]
                    if isinstance(output, dict) and "messages" in output:
                        messages = output["messages"]
                
                # If the LLM is streaming a chunk of text
                if kind == "on_chat_model_stream":
                    # Only forward chunks when we are NOT inside a tool-call cycle.
                    # This prevents the duplicate "thinking" tokens from being sent.
                    if not is_inside_tool_cycle:
                        content = event["data"]["chunk"].content
                        if content:
                            await websocket.send_json({
                                "type": "stream",
                                "content": content
                            })
                        
                # If the LLM decided to use a tool
                elif kind == "on_tool_start":
                    is_inside_tool_cycle = True
                    await websocket.send_json({
                        "type": "tool_start",
                        "tool_name": event["name"],
                        "tool_input": event["data"].get("input")
                    })
                    
                # If the tool finished executing
                elif kind == "on_tool_end":
                    is_inside_tool_cycle = False
                    await websocket.send_json({
                        "type": "tool_end",
                        "tool_name": event["name"],
                    })
            
            # Tell the frontend the response is completely finished
            await websocket.send_json({
                "type": "done"
            })

    except WebSocketDisconnect:
        print("Copilot WebSocket disconnected")
    except Exception as e:
        print(f"Error in Copilot WebSocket: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": "An error occurred while generating the response."
            })
        except:
            pass

