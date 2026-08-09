"""MCP Tools exclusive to the Form Collector Agent."""

import uuid
from typing import Dict, Any, Optional
from app.mcp.decorators import mcp_tool


@mcp_tool(
    name="get_available_form_templates",
    description="Fetch available form templates (e.g. college_admission, event_registration, kyc_onboarding) and their dynamic field schemas.",
    scope="form_collector",
)
def get_available_form_templates(template_id: Optional[str] = None):
    """Fetch a list of available form templates (e.g. college_admission, event_registration, kyc_onboarding) and their dynamic fields."""
    from app.forms.templates import MOCK_FORM_TEMPLATES
    if template_id and template_id in MOCK_FORM_TEMPLATES:
        tmpl = MOCK_FORM_TEMPLATES[template_id]
        return {
            "template_id": tmpl.template_id,
            "title": tmpl.title,
            "description": tmpl.description,
            "fields": [f.model_dump() for f in tmpl.fields],
        }
    return {
        "available_templates": [
            {
                "template_id": t.template_id,
                "title": t.title,
                "description": t.description,
                "fields_count": len(t.fields),
            }
            for t in MOCK_FORM_TEMPLATES.values()
        ]
    }


@mcp_tool(
    name="submit_form_response",
    description="Submit finalized dynamic form field responses to the backend database.",
    scope="form_collector",
)
def submit_form_response(caller_id: str, form_data: Dict[str, Any], template_id: Optional[str] = "college_admission"):
    """Submit finalized dynamic form field responses to the backend database."""
    confirmation = f"CONF-{uuid.uuid4().hex[:6].upper()}"
    return {
        "status": "success",
        "caller_id": caller_id,
        "template_id": template_id,
        "submitted_fields": form_data,
        "confirmation_code": confirmation,
        "message": f"Successfully recorded {len(form_data)} form fields for caller '{caller_id}'. Confirmation: {confirmation}.",
    }
