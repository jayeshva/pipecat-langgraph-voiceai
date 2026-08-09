export interface AgentMetadata {
  agent_id: string;
  name: string;
  description: string;
  language: string;
  is_langgraph: boolean;
}

export interface MCPToolFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolSchema {
  type: "function";
  function: MCPToolFunction;
}

export interface MCPToolsSummary {
  common: Array<{ name: string; description: string; scope: string }>;
  agent_specific: Record<string, Array<{ name: string; description: string; scope: string }>>;
}

export interface MCPServerInfo {
  name: string;
  transport: string;
  scopes: string[];
  enabled: boolean;
}

export interface OutboundCall {
  outbound_id: string;
  to: string;
  purpose: string;
  agent_id: string;
  status: string;
  call_sid?: string;
  created_at: number;
  age_seconds: number;
}

export interface SystemHealthStatus {
  status: string;
  service: string;
  providers?: {
    llm: string;
    stt: string;
    tts: string;
  };
  models?: {
    llm: { provider: string; model: string };
    stt: { provider: string; model: string };
    tts: { provider: string; model: string; voice?: string };
  };
  livekit_configured: boolean;
  sarvam_configured: boolean;
  openai_configured?: boolean;
  twilio_configured: boolean;
  config: {
    public_hostname: string;
    twilio_account_sid_set: boolean;
    twilio_auth_token_set: boolean;
    twilio_validate_signature: boolean;
    twilio_language: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system' | 'tool';
  text: string;
  timestamp: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
}

export interface ToolLogItem {
  id: string;
  toolName: string;
  toolArgs: Record<string, any>;
  executedAt: string;
  agentId?: string;
  status: 'executing' | 'success' | 'failed';
  category?: 'stt' | 'llm' | 'mcp' | 'tts' | 'pipeline' | string;
}

export type VoiceState = 'disconnected' | 'connecting' | 'listening' | 'user_speaking' | 'processing' | 'agent_speaking';
