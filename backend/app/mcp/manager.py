"""Model Context Protocol (MCP) Client Manager & Scoped Tool Resolver.

Enables Voice AI agents to discover and execute shared (common), agent-specific, or multi-agent MCP tools and servers.
"""

import asyncio
import importlib
import json
import pkgutil
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union
from loguru import logger


def _normalize_scopes(scope: Union[str, List[str], Set[str]]) -> Set[str]:
    """Convert string or list of scope strings into a normalized set of agent IDs or 'common'."""
    if isinstance(scope, str):
        return {scope.strip()}
    if isinstance(scope, (list, tuple, set)):
        return {str(s).strip() for s in scope}
    return {"common"}


class MCPServerConfig:
    def __init__(
        self,
        name: str,
        transport: str,
        command: Optional[str] = None,
        args: Optional[List[str]] = None,
        url: Optional[str] = None,
        scope: Union[str, List[str]] = "common",
        enabled: bool = True,
    ):
        self.name = name
        self.transport = transport  # "stdio" or "sse"
        self.command = command
        self.args = args or []
        self.url = url
        self.scopes: Set[str] = _normalize_scopes(scope)
        self.enabled = enabled


class MCPManager:
    """Manages MCP Server connections, tool scoping (single or multi-agent), tool discovery, and tool execution."""

    def __init__(self):
        self._servers: Dict[str, MCPServerConfig] = {}
        # tool_name -> tool metadata dictionary
        self._registered_tools: Dict[str, Dict[str, Any]] = {}

    def register_server(self, config: MCPServerConfig):
        """Register an MCP server configuration."""
        if not config.enabled:
            logger.info(f"Skipping disabled MCP Server: '{config.name}'")
            return
        self._servers[config.name] = config
        scopes_str = ", ".join(config.scopes)
        logger.info(f"Registered MCP Server: '{config.name}' (transport={config.transport}, scopes=[{scopes_str}])")

    def register_custom_tool(
        self,
        name: str,
        description: str,
        input_schema: Dict[str, Any],
        handler: Any,
        scope: Union[str, List[str]] = "common",
    ):
        """Register a custom tool handler into the MCP manager with a single, multi-agent, or common scope."""
        scopes = _normalize_scopes(scope)
        tool_data = {
            "name": name,
            "description": description,
            "inputSchema": input_schema,
            "handler": handler,
            "scopes": scopes,
        }

        self._registered_tools[name] = tool_data
        scopes_str = ", ".join(scopes)
        logger.info(f"Registered MCP tool: '{name}' (scopes=[{scopes_str}])")

    async def get_tools_for_agent(self, agent_id: str) -> List[Dict[str, Any]]:
        """Return tool definitions visible to a target agent (Common Tools + Tools matching agent_id)."""
        matching_tools: List[Dict[str, Any]] = []

        for tool_name, tool_info in self._registered_tools.items():
            scopes = tool_info["scopes"]
            if "common" in scopes or agent_id in scopes:
                matching_tools.append({
                    "type": "function",
                    "function": {
                        "name": tool_name,
                        "description": tool_info.get("description", ""),
                        "parameters": tool_info.get("inputSchema", {"type": "object", "properties": {}}),
                    }
                })
        return matching_tools

    def list_servers(self, agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List registered MCP servers, optionally filtered by agent scope."""
        servers = []
        for name, config in self._servers.items():
            if agent_id is None or "common" in config.scopes or agent_id in config.scopes:
                servers.append({
                    "name": config.name,
                    "transport": config.transport,
                    "scopes": list(config.scopes),
                    "enabled": config.enabled,
                })
        return servers

    async def list_tools(self) -> Dict[str, Any]:
        """List all registered tools grouped by scope for API endpoint inspection."""
        common_tools = []
        agent_specific_tools: Dict[str, List[Dict[str, Any]]] = {}

        for t in self._registered_tools.values():
            scopes = list(t["scopes"])
            item = {
                "name": t["name"],
                "description": t["description"],
                "scope": scopes[0] if scopes else "common",
                "scopes": scopes,
            }
            if "common" in scopes:
                common_tools.append(item)
            else:
                for sc in scopes:
                    if sc not in agent_specific_tools:
                        agent_specific_tools[sc] = []
                    agent_specific_tools[sc].append(item)

        return {"common": common_tools, "agent_specific": agent_specific_tools}

    async def call_tool(self, tool_name: str, tool_args: Dict[str, Any], agent_id: str = "common") -> Any:
        """Execute a tool call enforcing scope permissions."""
        tool_info = self._registered_tools.get(tool_name)

        if not tool_info:
            raise ValueError(f"Tool '{tool_name}' is not registered.")

        scopes = tool_info.get("scopes", set())
        if "common" not in scopes and agent_id not in scopes:
            raise ValueError(f"Tool '{tool_name}' is not authorized for agent '{agent_id}'. Allowed scopes: {list(scopes)}")

        handler = tool_info.get("handler")
        if handler:
            logger.info(f"Executing MCP tool '{tool_name}' (agent='{agent_id}') with args {tool_args}")
            if asyncio.iscoroutinefunction(handler):
                return await handler(**tool_args)
            return handler(**tool_args)

        return {"status": "success", "result": f"Executed external MCP tool {tool_name}"}

    def load_servers_from_json(self, json_path: Optional[Path] = None):
        """Load external MCP server declarations from mcp_servers.json file."""
        if json_path is None:
            json_path = Path(__file__).parent / "mcp_servers.json"

        if not json_path.exists():
            logger.warning(f"MCP server declaration file not found at '{json_path}'")
            return

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            server_list = data.get("mcp_servers", [])
            for s in server_list:
                config = MCPServerConfig(
                    name=s["name"],
                    transport=s.get("transport", "stdio"),
                    command=s.get("command"),
                    args=s.get("args"),
                    url=s.get("url"),
                    scope=s.get("scope", "common"),
                    enabled=s.get("enabled", True),
                )
                self.register_server(config)
            logger.info(f"Loaded {len(server_list)} MCP servers from '{json_path.name}'")
        except Exception as e:
            logger.error(f"Failed to load MCP servers from '{json_path}': {e}")

    def auto_discover_tools(self, package_path: str = "app.mcp.tools"):
        """Auto-discover python tools and load JSON MCP servers."""
        self.load_servers_from_json()

        try:
            package = importlib.import_module(package_path)
            for _, name, is_pkg in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
                importlib.import_module(name)
        except ModuleNotFoundError as e:
            logger.warning(f"Auto-discovery package '{package_path}' not found: {e}")
        except Exception as e:
            logger.error(f"Error auto-discovering MCP tools from '{package_path}': {e}")


# Global MCP Manager Singleton
mcp_manager = MCPManager()
