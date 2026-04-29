#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "http";
import { z } from "zod";

const IMS_URL = (process.env.IMS_URL || "https://ims.sieisst.com").replace(
  /\/$/,
  ""
);
const IMS_API_KEY = process.env.IMS_API_KEY || "";

const INSTRUCTIONS = `# If This - Game Design Assistant

You help design "If This" - a fictional concentration camp game. Isometric 3D. Player arrives by train, goes through intake, gets assigned to a barracks block, survives daily life.

IMPORTANT: Entirely fictional world-building. Never use real historical names for countries, languages, or religions.

## How to work

1. **Always call getContext first.** It tells you entity types, properties, valid values, and reference data.
2. **Use plain names** for references - "Emorian" not a UUID.
3. **Only send fields you want to set.** Property names are workspace-specific - check getContext.
4. **title is always required** when creating anything.
5. **Always link related assets** after creating or discussing entities.
6. **Write dialogue scripts directly** using the script array.

## Dialogue metadata

Every dialogue MUST have these properties:
- \`character\`: character name (resolved to asset reference). Who this dialogue belongs to.
- \`location\`: location name (resolved to asset reference). Where this triggers. Must match a Location asset.
- \`priority\`: integer (default 0). Higher wins when multiple match same character+location.
- \`requires\`: string (optional). Dialogue variable that must equal "true" for this to be active.

Example: \`"properties": "{\\"character\\": \\"Lena\\", \\"location\\": \\"Railway\\", \\"priority\\": 0}"\`
With quest gate: \`"properties": "{\\"character\\": \\"Lena\\", \\"location\\": \\"Camp\\", \\"priority\\": 10, \\"requires\\": \\"lena_delivered_letter\\"}"\`

The game engine auto-selects the right dialogue per character based on location and quest state. Dialogues without character+location won't load.

## Writing dialogue scripts

Script array defines conversation flow. Each line can be:

- **Speech:** \`{ "character": "Guard", "text": "Halt!", "description": "Guard blocks path" }\`
- **Choices:** \`{ "character": "Guard", "text": "Why?", "choices": [{"text": "Doctor", "goto": "doc"}, {"text": "None of your business", "goto": "defiant"}] }\`
- **Label:** \`{ "label": "doc", "character": "Guard", "text": "Follow me." }\`
- **Chance:** \`{ "text": "", "chance": [{"weight": 70, "goto": "caught"}, {"weight": 30, "goto": "safe"}] }\`
- **Trigger:** \`{ "trigger": "AcceptLetter", "triggerParams": {"add_item": "res://design/Items/Lena's Letter.ima.json", "add_task": "deliver_letter", "task_text": "Deliver letter"}, "text": "" }\`
- **SetVar:** \`{ "setVar": {"variable": "guard_met", "value": "true"}, "text": "" }\`
- **Condition:** \`{ "text": "", "condition": {"variable": "guard_met", "equals": "true", "then": "return_path", "else": "first_time"} }\`
- **Goto:** \`{ "text": "Get out!", "goto": "end_scene" }\`

Lines flow top-to-bottom unless redirected by goto, choices, or conditions.

### Conditions (repeat-visit routing)

Use \`condition\` at dialogue start to route based on persisted state.

### Variable persistence

Variables set with \`setVar\` auto-persist to game state. On re-entry, \`condition\` reads persisted values. Always \`setVar\` before dialogue ends.

**Naming convention:** Prefix variables with character name to avoid collisions: \`lena_met\`, \`lena_accepted_letter\`, \`guard_met\`, \`guard_gave_watch\`.

### Critical rules

1. **Player responses are \`choices\` on the NPC line.** Never create a separate player speech node.
2. **Every branch must end with \`goto\`**, or it falls through into the next branch.

## Trigger actions

Use \`triggerParams\` to define game effects. No code changes needed for new triggers.

- \`add_item\`: item .ima.json path (adds to inventory)
- \`remove_item\`: item ID (removes from inventory)
- \`add_task\` + \`task_text\`: creates a player task
- \`if_var\`: variable name (only execute if equals "true")

\`EndDialogue\` is reserved - signals dialogue end, no actions on it.

## Auto-linking

ALWAYS link related assets: Character-Dialogue, Character-Quest, Dialogue-Quest, Quest-Item, Character-Item, Location-Dialogue, Building-Character.`;

// --- HTTP helpers ---

async function apiRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const url = `${IMS_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (IMS_API_KEY) {
    headers["Authorization"] = `Bearer ${IMS_API_KEY}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IMS API ${method} ${path} returned ${res.status}: ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
}

function formatResult(data: unknown): string {
  if (typeof data === "string") return data;
  return JSON.stringify(data, null, 2);
}

// --- Server setup ---

const server = new McpServer(
  {
    name: "ims-creators",
    version: "1.0.0",
  },
  {
    instructions: INSTRUCTIONS,
  }
);

// --- Tool definitions ---

function registerTools(s: McpServer) {

s.tool(
  "getContext",
  "Get all entity types, workspace slugs, their properties, valid values, and reference data. ALWAYS call this first - workspace slugs required by listEntities and other tools come from here.",
  async () => {
    const data = await apiRequest("GET", "/api/gpt/context");
    return { content: [{ type: "text", text: formatResult(data) }] };
  }
);

s.tool(
  "listWorkspaces",
  "List all workspace slugs. Use one of these as the workspace argument to listEntities, getEntity, createEntity, updateEntity.",
  async () => {
    const data = await apiRequest("GET", "/api/gpt/context") as { entityTypes?: Record<string, unknown> };
    const slugs = Object.keys(data?.entityTypes || {}).sort();
    return { content: [{ type: "text", text: formatResult(slugs) }] };
  }
);

s.tool(
  "listEntities",
  "List all entities in a workspace. Use a workspace slug returned by getContext or listWorkspaces - do not guess.",
  {
    workspace: z
      .string()
      .describe("Workspace slug from getContext"),
  },
  async ({ workspace }) => {
    const data = await apiRequest("GET", `/api/gpt/${encodeURIComponent(workspace)}`);
    return { content: [{ type: "text", text: formatResult(data) }] };
  }
);

s.tool(
  "getEntity",
  "Get full entity details as flat key-value pairs. Dialogues include a script array.",
  {
    workspace: z.string().describe("Workspace slug"),
    id: z.string().describe("Entity UUID"),
  },
  async ({ workspace, id }) => {
    const data = await apiRequest(
      "GET",
      `/api/gpt/${encodeURIComponent(workspace)}/${encodeURIComponent(id)}`
    );
    return { content: [{ type: "text", text: formatResult(data) }] };
  }
);

s.tool(
  "createEntity",
  "Create an entity. Properties are workspace-specific - check getContext. title is required. For dialogues, include a script array to define conversation flow.",
  {
    workspace: z.string().describe("Workspace slug from getContext"),
    title: z.string().describe("Entity name (required)"),
    properties: z
      .string()
      .optional()
      .describe(
        'JSON string of entity properties. Keys come from getContext. Use plain names for references. Example: \'{"description": "A guard", "language": "Emorian", "health": 100}\''
      ),
    script: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .describe(
        "Dialogue script array. Each item has character, text, description, choices, chance, trigger, setVar, condition, goto, label fields."
      ),
  },
  async ({ workspace, title, properties, script }) => {
    const body: Record<string, unknown> = { title };
    if (properties !== undefined) body.properties = properties;
    if (script !== undefined) body.script = script;
    const data = await apiRequest(
      "POST",
      `/api/gpt/${encodeURIComponent(workspace)}`,
      body
    );
    return { content: [{ type: "text", text: formatResult(data) }] };
  }
);

s.tool(
  "updateEntity",
  "Update an entity. Only send fields to change. For dialogues, sending script replaces the entire dialogue flow.",
  {
    workspace: z.string().describe("Workspace slug"),
    id: z.string().describe("Entity UUID"),
    title: z.string().optional().describe("New title"),
    properties: z
      .string()
      .optional()
      .describe(
        'JSON string of properties to update. Only include fields to change. Use plain names for references.'
      ),
    script: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .describe("Replacement dialogue script (same format as createEntity)"),
  },
  async ({ workspace, id, title, properties, script }) => {
    const body: Record<string, unknown> = {};
    if (title !== undefined) body.title = title;
    if (properties !== undefined) body.properties = properties;
    if (script !== undefined) body.script = script;
    const data = await apiRequest(
      "PUT",
      `/api/gpt/${encodeURIComponent(workspace)}/${encodeURIComponent(id)}`,
      body
    );
    return { content: [{ type: "text", text: formatResult(data) }] };
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
    const data = await apiRequest(
      "DELETE",
      `/api/gpt/${encodeURIComponent(workspace)}/${encodeURIComponent(id)}`
    );
    return { content: [{ type: "text", text: formatResult(data) }] };
  }
);

s.tool(
  "searchAssets",
  "Search entities by name across all types. Returns IDs needed for linking.",
  {
    q: z.string().describe("Search term (partial match on title)"),
  },
  async ({ q }) => {
    const data = await apiRequest(
      "GET",
      `/api/gpt/search?q=${encodeURIComponent(q)}`
    );
    return { content: [{ type: "text", text: formatResult(data) }] };
  }
);

s.tool(
  "linkAssets",
  "Create a bidirectional link between two entities. Use searchAssets first to get the UUIDs.",
  {
    from: z
      .string()
      .describe("Source entity UUID (from searchAssets or a create/list response)"),
    to: z
      .string()
      .describe("Target entity UUID (from searchAssets or a create/list response)"),
  },
  async ({ from, to }) => {
    const data = await apiRequest("POST", "/api/gpt/link", { from, to });
    return { content: [{ type: "text", text: formatResult(data) }] };
  }
);

s.tool(
  "setImage",
  "Set an image on an entity using a public URL.",
  {
    id: z.string().describe("Entity UUID to set the image on"),
    url: z.string().describe("A public image URL the server can download"),
    filename: z.string().optional().describe("Optional filename for the image"),
  },
  async ({ id, url, filename }) => {
    const body: Record<string, unknown> = { id, url };
    if (filename !== undefined) body.filename = filename;
    const data = await apiRequest("POST", "/api/gpt/set-image", body);
    return { content: [{ type: "text", text: formatResult(data) }] };
  }
);

} // end registerTools

// --- Start ---

const MCP_PORT = parseInt(process.env.MCP_PORT || "0", 10);
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || IMS_API_KEY;

if (MCP_PORT > 0) {
  // SSE mode - remote MCP server for Claude.ai connectors
  const sessions = new Map<string, SSEServerTransport>();

  const httpServer = createServer(async (req, res) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Auth check
    if (MCP_AUTH_TOKEN) {
      const auth = req.headers.authorization || "";
      const provided = auth.replace(/^Bearer\s+/i, "");
      if (provided !== MCP_AUTH_TOKEN) {
        res.writeHead(401, { "Content-Type": "text/plain" });
        res.end("Unauthorized");
        return;
      }
    }

    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname === "/sse" && req.method === "GET") {
      // New SSE connection
      const transport = new SSEServerTransport("/messages", res);
      sessions.set(transport.sessionId, transport);
      transport.onclose = () => sessions.delete(transport.sessionId);
      const mcpInstance = new McpServer(
        { name: "ims-creators", version: "1.0.0" },
        { instructions: INSTRUCTIONS }
      );
      registerTools(mcpInstance);
      await mcpInstance.connect(transport);
    } else if (url.pathname === "/messages" && req.method === "POST") {
      // Message from client
      const sessionId = url.searchParams.get("sessionId") || "";
      const transport = sessions.get(sessionId);
      if (!transport) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Session not found");
        return;
      }
      await transport.handlePostMessage(req, res);
    } else {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("IMS Creators MCP Server (SSE). Connect to /sse");
    }
  });

  httpServer.listen(MCP_PORT, () => {
    console.log(`MCP SSE server listening on port ${MCP_PORT}`);
  });
} else {
  // Stdio mode - local MCP for Claude Code
  async function main() {
    registerTools(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }

  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
