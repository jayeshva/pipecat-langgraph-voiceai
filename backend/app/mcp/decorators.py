"""MCP Tool Decorators.

Provides the @mcp_tool decorator supporting standard python functions and LangChain @tool objects.
"""

import inspect
from typing import Any, Callable, Dict, List, Optional, Union
from loguru import logger


def mcp_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    input_schema: Optional[Dict[str, Any]] = None,
    scope: Union[str, List[str]] = "common",
):
    """Decorator to register a function or LangChain @tool as an MCP tool.

    Args:
        name: Name of the tool. Defaults to function or LangChain tool name.
        description: Description of tool purpose. Defaults to docstring or tool description.
        input_schema: JSON Schema for parameters. Inferred if omitted.
        scope: "common" for shared tools, specific agent_id string, or list of agent_ids.
    """

    def decorator(func: Union[Callable, Any]):
        # Un-wrap underlying callable if func is a LangChain StructuredTool / BaseTool
        raw_func = getattr(func, "func", func)
        if not callable(raw_func) and hasattr(func, "invoke"):
            raw_func = lambda **kwargs: func.invoke(kwargs)

        tool_name = name or getattr(func, "name", getattr(raw_func, "__name__", "tool"))
        tool_desc = description or getattr(func, "description", getattr(raw_func, "__doc__", "") or "").strip() or f"Execute {tool_name}"

        schema = input_schema
        if not schema and callable(raw_func):
            try:
                sig = inspect.signature(raw_func)
                properties = {}
                required = []
                for param_name, param in sig.parameters.items():
                    if param_name in ("self", "cls"):
                        continue
                    param_type = "string"
                    if param.annotation == int:
                        param_type = "integer"
                    elif param.annotation == float:
                        param_type = "number"
                    elif param.annotation == bool:
                        param_type = "boolean"
                    elif param.annotation == dict:
                        param_type = "object"

                    properties[param_name] = {"type": param_type}
                    if param.default == inspect.Parameter.empty:
                        required.append(param_name)

                schema = {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                }
            except Exception as e:
                logger.warning(f"Could not infer signature for tool '{tool_name}': {e}")
                schema = {"type": "object", "properties": {}}

        from app.mcp.manager import mcp_manager

        mcp_manager.register_custom_tool(
            name=tool_name,
            description=tool_desc,
            input_schema=schema or {"type": "object", "properties": {}},
            handler=raw_func,
            scope=scope,
        )
        return func

    return decorator
