"""MCP API Router.

Exposes endpoints to inspect registered MCP tool definitions and execute tools.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.mcp.manager import mcp_manager

router = APIRouter(prefix="/mcp", tags=["MCP"])


class ExecuteToolRequest(BaseModel):
    tool_name: str = Field(..., description="Name of the MCP tool to execute.")
    args: Dict[str, Any] = Field(default_factory=dict, description="Arguments dictionary for the tool handler.")
    agent_id: Optional[str] = Field("common", description="Agent ID requesting tool execution.")


@router.get("/tools")
async def list_mcp_tools():
    """List tools registered with the Model Context Protocol manager."""
    tools = await mcp_manager.list_tools()
    return {"tools": tools}


@router.post("/tools/execute")
async def execute_mcp_tool(req: ExecuteToolRequest):
    """Execute a registered MCP tool directly over REST API."""
    try:
        res = await mcp_manager.call_tool(req.tool_name, req.args, req.agent_id or "common")
        return {
            "status": "success",
            "tool_name": req.tool_name,
            "agent_id": req.agent_id or "common",
            "result": res,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tool execution failed: {e}")
