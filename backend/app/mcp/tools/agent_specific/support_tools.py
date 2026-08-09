"""MCP Tools exclusive to the Customer Support Agent."""

import uuid
from app.mcp.decorators import mcp_tool


@mcp_tool(
    name="create_support_ticket",
    description="Create a customer support ticket for unresolved inquiries or escalation.",
    scope="customer_support",
)
def create_support_ticket(caller_id: str, issue_description: str, priority: str = "normal"):
    ticket_id = f"TICK-{uuid.uuid4().hex[:8].upper()}"
    return {
        "status": "created",
        "ticket_id": ticket_id,
        "caller_id": caller_id,
        "priority": priority,
        "message": f"Support ticket {ticket_id} created successfully.",
    }


@mcp_tool(
    name="lookup_user_account",
    description="Fetch account status and active service requests for a caller ID.",
    scope="customer_support",
)
def lookup_user_account(caller_id: str):
    return {
        "caller_id": caller_id,
        "account_status": "Active",
        "recent_tickets": [],
        "verified": True,
    }
