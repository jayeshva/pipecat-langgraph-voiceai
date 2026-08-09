"""Common Shared MCP Tools available to ALL Voice AI Agents."""

import datetime
from app.mcp.decorators import mcp_tool


@mcp_tool(
    name="get_current_time",
    description="Get current server date and time in UTC.",
    scope="common",
)
def get_current_time():
    now = datetime.datetime.now(datetime.timezone.utc)
    return {"utc_time": now.isoformat(), "formatted": now.strftime("%Y-%m-%d %H:%M:%S UTC")}


@mcp_tool(
    name="search_knowledge_base",
    description="Search the global department knowledge base for policies, hours, or guidance.",
    scope="common",
)
def search_knowledge_base(query: str):
    return {
        "query": query,
        "results": [
            {
                "title": "General Operating Hours",
                "content": "IntelliForm AI assistance operates 24/7 online. Department offices open Monday to Friday 9 AM to 5 PM.",
            }
        ],
    }


@mcp_tool(
    name="hangup_call",
    description="End and disconnect the phone call or WebRTC voice session when the user says goodbye, bye, end call, or asks to disconnect.",
    scope="common",
)
def hangup_call(reason: str = "user_requested"):
    return {
        "status": "hangup_initiated",
        "reason": reason,
        "instruction": "Say a brief, polite farewell (e.g. 'Goodbye!') and stop.",
    }
