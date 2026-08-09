"""Mock Form Templates & Schema Registry.

Defines dynamic form templates (e.g. College Admission, Event Registration, Customer KYC)
used by the LangGraph Form Collector Agent to gather, validate, and submit dynamic user responses to MCP tools.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FormFieldSchema(BaseModel):
    name: str = Field(..., description="Field key name (e.g. 'student_name', 'email')")
    label: str = Field(..., description="Human readable field label")
    type: str = Field("string", description="Field data type: 'string', 'number', 'email', 'phone', 'select'")
    required: bool = True
    description: str = Field(..., description="Guidance instructions for agent conversational prompts")
    options: Optional[List[str]] = Field(None, description="Selectable options for 'select' field type")


class FormTemplateSchema(BaseModel):
    template_id: str
    title: str
    description: str
    target_mcp_tool: str = "submit_form_response"
    fields: List[FormFieldSchema]


# Mock Form Templates Store
MOCK_FORM_TEMPLATES: Dict[str, FormTemplateSchema] = {
    "college_admission": FormTemplateSchema(
        template_id="college_admission",
        title="College Admission Application Form",
        description="Gather applicant personal details, contact info, preferred academic course, and high school percentage.",
        target_mcp_tool="submit_form_response",
        fields=[
            FormFieldSchema(
                name="student_name",
                label="Student Full Name",
                type="string",
                required=True,
                description="Full legal name of the student applying.",
            ),
            FormFieldSchema(
                name="email",
                label="Email Address",
                type="email",
                required=True,
                description="Primary contact email address.",
            ),
            FormFieldSchema(
                name="phone",
                label="Phone Number",
                type="phone",
                required=True,
                description="10-digit mobile contact number.",
            ),
            FormFieldSchema(
                name="preferred_course",
                label="Preferred Academic Course",
                type="select",
                required=True,
                description="Preferred degree course.",
                options=[
                    "Computer Science & Engineering",
                    "AI & Data Science",
                    "Business Administration (BBA)",
                    "Mechanical Engineering",
                    "Electronics & Communication",
                ],
            ),
            FormFieldSchema(
                name="high_school_percentage",
                label="High School (Grade 12) Percentage",
                type="number",
                required=True,
                description="Grade 12 or High School completion percentage score.",
            ),
        ],
    ),
    "event_registration": FormTemplateSchema(
        template_id="event_registration",
        title="Tech Conference Event Registration Form",
        description="Register attendee for the upcoming AI Tech Summit.",
        target_mcp_tool="submit_form_response",
        fields=[
            FormFieldSchema(
                name="full_name",
                label="Full Name",
                type="string",
                required=True,
                description="Attendee full name.",
            ),
            FormFieldSchema(
                name="email",
                label="Email Address",
                type="email",
                required=True,
                description="Ticket confirmation email.",
            ),
            FormFieldSchema(
                name="ticket_type",
                label="Ticket Type",
                type="select",
                required=True,
                description="Pass category.",
                options=["General Pass", "VIP All-Access Pass", "Student Pass"],
            ),
            FormFieldSchema(
                name="company_or_college",
                label="Company / Institution Name",
                type="string",
                required=False,
                description="Company or college affiliation.",
            ),
        ],
    ),
    "kyc_onboarding": FormTemplateSchema(
        template_id="kyc_onboarding",
        title="Customer Identity KYC Onboarding Form",
        description="Collect customer identity verification details.",
        target_mcp_tool="submit_form_response",
        fields=[
            FormFieldSchema(
                name="full_name",
                label="Legal Full Name",
                type="string",
                required=True,
                description="Legal name as it appears on government ID.",
            ),
            FormFieldSchema(
                name="id_type",
                label="Government ID Type",
                type="select",
                required=True,
                description="Type of ID document.",
                options=["Passport", "Aadhar Card", "Driver License", "Voter ID"],
            ),
            FormFieldSchema(
                name="id_number",
                label="Government ID Number",
                type="string",
                required=True,
                description="ID card document number.",
            ),
            FormFieldSchema(
                name="phone",
                label="Primary Phone Number",
                type="phone",
                required=True,
                description="Primary contact number.",
            ),
        ],
    ),
}


def get_form_template(template_id: str) -> FormTemplateSchema:
    """Retrieve FormTemplateSchema by ID, defaulting to college_admission if not found."""
    return MOCK_FORM_TEMPLATES.get(template_id, MOCK_FORM_TEMPLATES["college_admission"])
