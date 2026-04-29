import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import {
  buildGptContext,
  listAssetsFlat,
  getAssetFlat,
  createAssetFromFlat,
  updateAssetFromFlat,
  deleteAsset,
  resolveWorkspace,
  getAllWorkspaces,
} from './gpt-helpers';
import { getProjectDb } from './project-db';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load instructions
let INSTRUCTIONS = 'IMS Creators game design tools.';
for (const p of [
  resolve(process.cwd(), 'gpt-instructions.md'),
  resolve(process.cwd(), '..', 'gpt-instructions.md'),
  resolve(process.cwd(), 'web', 'gpt-instructions.md'),
]) {
  try { INSTRUCTIONS = readFileSync(p, 'utf-8'); break; } catch {}
}

const sessions = new Map<string, SSEServerTransport>();

function formatResult(data: unknown): string {
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
}

function registerTools(s: McpServer) {
  s.tool(
    "getContext",
    "Get all entity types, properties, valid values, and reference data. ALWAYS call this first.",
    async () => {
      const data = await buildGptContext();
      return { content: [{ type: "text" as const, text: formatResult(data) }] };
    }
  );

  s.tool(
    "listEntities",
    "List all entities in a workspace.",
    { workspace: z.string().describe("Workspace slug from getContext") },
    async ({ workspace }) => {
      const ws = await resolveWorkspace(workspace);
      if (!ws) return { content: [{ type: "text" as const, text: `Workspace "${workspace}" not found` }] };
      const data = await listAssetsFlat(ws.id);
      return { content: [{ type: "text" as const, text: formatResult(data) }] };
    }
  );

  s.tool(
    "getEntity",
    "Get full entity details. Dialogues include a script array.",
    {
      workspace: z.string().describe("Workspace slug"),
      id: z.string().describe("Entity UUID"),
    },
    async ({ workspace, id }) => {
      const data = await getAssetFlat(id);
      return { content: [{ type: "text" as const, text: formatResult(data) }] };
    }
  );

  s.tool(
    "createEntity",
    "Create an entity. title is required. For dialogues include a script array.",
    {
      workspace: z.string().describe("Workspace slug"),
      title: z.string().describe("Entity name (required)"),
      properties: z.string().optional().describe("JSON string of properties"),
      script: z.array(z.record(z.string(), z.unknown())).optional().describe("Dialogue script array"),
    },
    async ({ workspace, title, properties, script }) => {
      const ws = await resolveWorkspace(workspace);
      if (!ws) return { content: [{ type: "text" as const, text: `Workspace "${workspace}" not found` }] };
      const flat: Record<string, any> = { title };
      if (properties) Object.assign(flat, JSON.parse(properties));
      if (script) flat.script = script;
      const data = await createAssetFromFlat(ws.id, flat);
      return { content: [{ type: "text" as const, text: formatResult(data) }] };
    }
  );

  s.tool(
    "updateEntity",
    "Update an entity. Only send fields to change.",
    {
      workspace: z.string().describe("Workspace slug"),
      id: z.string().describe("Entity UUID"),
      title: z.string().optional().describe("New title"),
      properties: z.string().optional().describe("JSON string of properties to update"),
      script: z.array(z.record(z.string(), z.unknown())).optional().describe("Replacement dialogue script"),
    },
    async ({ workspace, id, title, properties, script }) => {
      const flat: Record<string, any> = {};
      if (title) flat.title = title;
      if (properties) Object.assign(flat, JSON.parse(properties));
      if (script) flat.script = script;
      const data = await updateAssetFromFlat(id, flat);
      return { content: [{ type: "text" as const, text: formatResult(data) }] };
    }
  );

  s.tool(
    "deleteEntity",
    "Delete an entity.",
    {
      workspace: z.string().describe("Workspace slug"),
      id: z.string().describe("Entity UUID"),
    },
    async ({ workspace, id }) => {
      const data = await deleteAsset(id);
      return { content: [{ type: "text" as const, text: formatResult(data) }] };
    }
  );

  s.tool(
    "searchAssets",
    "Search entities by name across all types.",
    { q: z.string().describe("Search term") },
    async ({ q }) => {
      const db = await getProjectDb();
      const workspaces = await getAllWorkspaces();
      const results: any[] = [];
      for (const ws of workspaces) {
        const { list } = await db.asset.assetsGetShort({ where: { workspaceId: ws.id, query: q } });
        for (const a of (list || [])) {
          results.push({ id: a.id, title: a.title, workspace: ws.title });
        }
      }
      return { content: [{ type: "text" as const, text: formatResult(results) }] };
    }
  );

  s.tool(
    "linkAssets",
    "Create a link between two entities.",
    {
      from: z.string().describe("Source entity UUID"),
      to: z.string().describe("Target entity UUID"),
    },
    async ({ from, to }) => {
      const db = await getProjectDb();
      await db.asset.assetsCreateRef({ fromAssetId: from, toAssetId: to });
      return { content: [{ type: "text" as const, text: "Linked" }] };
    }
  );
}

export function createMcpSession(): { server: McpServer; transport: SSEServerTransport | null } {
  const mcpInstance = new McpServer(
    { name: "ims-creators", version: "1.0.0" },
    { instructions: INSTRUCTIONS }
  );
  registerTools(mcpInstance);
  return { server: mcpInstance, transport: null };
}

export function getSession(sessionId: string): SSEServerTransport | undefined {
  return sessions.get(sessionId);
}

export function storeSession(id: string, transport: SSEServerTransport): void {
  sessions.set(id, transport);
  transport.onclose = () => sessions.delete(id);
}
