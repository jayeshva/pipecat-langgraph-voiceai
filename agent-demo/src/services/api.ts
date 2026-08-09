import type { AgentMetadata, MCPToolsSummary, OutboundCall, SystemHealthStatus } from '../types';

const API_BASE = 'http://localhost:8080/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `API request failed with status ${res.status}`);
  }
  return res.json();
}

export async function getHealthStatus(): Promise<SystemHealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse<SystemHealthStatus>(res);
}

export async function getAgentsList(): Promise<AgentMetadata[]> {
  const res = await fetch(`${API_BASE}/agents`);
  const data = await handleResponse<{ agents: AgentMetadata[] }>(res);
  return data.agents;
}

export async function getAgentDetails(agentId: string): Promise<AgentMetadata> {
  const res = await fetch(`${API_BASE}/agents/${agentId}`);
  return handleResponse<AgentMetadata>(res);
}

export async function getMCPTools(): Promise<MCPToolsSummary> {
  const res = await fetch(`${API_BASE}/mcp/tools`);
  const data = await handleResponse<{ tools: MCPToolsSummary }>(res);
  return data.tools;
}

export async function connectVoiceSession(agentId: string, callerId?: string, language?: string) {
  const res = await fetch(`${API_BASE}/voice/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId,
      caller_id: callerId,
      language: language || 'en-IN',
    }),
  });
  return handleResponse<{ url: string; token: string; room: string; caller_id: string; agent_id: string }>(res);
}

export async function placeOutboundCall(to: string, purpose: string, agentId: string, language?: string) {
  const res = await fetch(`${API_BASE}/voice/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      purpose,
      agent_id: agentId,
      language: language || 'en-IN',
    }),
  });
  return handleResponse<{ outbound_id: string; call_sid: string; to: string; status: string; agent_id: string }>(res);
}

export async function getOutboundCalls(): Promise<Record<string, OutboundCall>> {
  const res = await fetch(`${API_BASE}/voice/calls`);
  const data = await handleResponse<{ calls: Record<string, OutboundCall> }>(res);
  return data.calls;
}

export async function clearCallerMemory(callerId: string) {
  const res = await fetch(`${API_BASE}/voice/memory/${callerId}`, {
    method: 'DELETE',
  });
  return handleResponse<{ status: string; caller_id: string }>(res);
}

export async function executeMCPTool(toolName: string, args: Record<string, any>, agentId: string = 'common') {
  const res = await fetch(`${API_BASE}/mcp/tools/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool_name: toolName,
      args,
      agent_id: agentId,
    }),
  });
  return handleResponse<any>(res);
}

export async function sendChatMessage(
  agentId: string,
  callerId: string,
  messages: Array<{ role: string; content: string }>,
  language: string = 'en-IN'
) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId,
      caller_id: callerId,
      messages,
      language,
    }),
  });
  return handleResponse<{
    agent_id: string;
    caller_id: string;
    response: string;
    tool_executions: Array<{ tool_name: string; args: Record<string, any>; result?: any }>;
  }>(res);
}
