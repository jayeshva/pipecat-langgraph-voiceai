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

export async function executeMCPTool(toolName: string, args: Record<string, any>, agentId?: string) {
  const res = await fetch(`${API_BASE}/mcp/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool_name: toolName,
      args: args,
      agent_id: agentId || 'common',
    }),
  });
  return handleResponse<{ status: string; result: any }>(res);
}

export async function connectVoiceSession(agentId: string, callerId?: string, language?: string) {
  const res = await fetch(`${API_BASE}/voice/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId,
      caller_id: callerId || 'browser-user-01',
      language: language || 'en-IN',
    }),
  });
  const data = await handleResponse<{ token: string; url: string; room_name: string; room?: string; agent_id?: string }>(res);
  return {
    ...data,
    room: data.room || data.room_name,
    agent_id: data.agent_id || agentId,
  };
}

export async function placeOutboundCall(
  toPhone: string,
  purpose: string,
  agentId: string
): Promise<OutboundCall> {
  const res = await fetch(`${API_BASE}/voice/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: toPhone,
      agent_id: agentId,
      purpose: purpose,
    }),
  });
  return handleResponse<OutboundCall>(res);
}

export async function getOutboundCalls(): Promise<Record<string, OutboundCall>> {
  const res = await fetch(`${API_BASE}/voice/calls`);
  const data = await handleResponse<{ calls: Record<string, OutboundCall> }>(res);
  return data.calls;
}

export async function getCallerMemory(callerId: string) {
  const res = await fetch(`${API_BASE}/memory/${callerId}`);
  return handleResponse<{ caller_id: string; history: any[] }>(res);
}

export async function clearCallerMemory(callerId: string) {
  const res = await fetch(`${API_BASE}/memory/${callerId}`, { method: 'DELETE' });
  return handleResponse<{ status: string }>(res);
}

export async function sendChatMessage(agentId: string, callerId: string, messages: { role: string; content: string }[]) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId,
      caller_id: callerId,
      messages: messages,
    }),
  });
  return handleResponse<{
    agent_id: string;
    caller_id: string;
    response: string;
    tool_executions: { tool_name: string; args: any; result: any }[];
  }>(res);
}

export async function getAsteriskConfig() {
  const res = await fetch(`${API_BASE}/asterisk/config`);
  return handleResponse<{
    status: string;
    asterisk_host: string;
    sip_port: number;
    ami_port: number;
    websocket_url: string;
    pjsip_conf: string;
    extensions_conf: string;
  }>(res);
}

export async function triggerAsteriskCall(toExtension: string, agentId: string) {
  const res = await fetch(`${API_BASE}/asterisk/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_extension: toExtension,
      agent_id: agentId,
    }),
  });
  return handleResponse<{ status: string; call_id: string; message: string }>(res);
}
