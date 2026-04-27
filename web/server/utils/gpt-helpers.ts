import { getProjectDb } from './project-db';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Property name aliases: maps clean names to actual IMS property names (handles typos in data)
const PROPERTY_ALIASES: Record<string, string> = {
  'language': 'lanuge',  // typo in original IMS data
};

// Reverse map for flattening output
const PROPERTY_DISPLAY_NAMES: Record<string, string> = {
  'lanuge': 'language',
};

// ── Helpers ───────────────────────────────────────────────────────────

/** Extract a single asset from assetsGetFull result (which uses ids + objects.assetFulls, NOT .list) */
function extractFullAsset(result: any, id?: string): any {
  const assetId = id || result.ids?.[0];
  return assetId ? result.objects?.assetFulls?.[assetId] : null;
}

/**
 * Extract __props metadata from flattened block props.
 * assetsGetFull flattens nested objects using \\ delimiters, so
 * `__props.damage.type` becomes `__props\\damage\\type`.
 * This reconstructs the nested object.
 */
function extractPropsMetadata(flatProps: any): Record<string, any> {
  if (!flatProps || typeof flatProps !== 'object') return {};

  // Fast path: if __props exists as a nested object (raw file format), use it directly
  if (flatProps.__props && typeof flatProps.__props === 'object') return flatProps.__props;

  // Slow path: reconstruct from flattened \\-delimited keys
  const schema: Record<string, any> = {};
  for (const [key, value] of Object.entries(flatProps)) {
    if (!key.startsWith('__props\\')) continue;
    const parts = key.split('\\');
    if (parts.length < 3) continue;
    const propName = parts[1];
    if (!schema[propName]) schema[propName] = {};
    let current = schema[propName];
    for (let i = 2; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return schema;
}

// ── Workspace resolution ──────────────────────────────────────────────

export async function getAllWorkspaces() {
  const db = await getProjectDb();
  const { list } = await db.workspace.workspacesGet({ where: { isSystem: false } });
  return list as any[];
}

export async function resolveWorkspace(slug: string) {
  const workspaces = await getAllWorkspaces();
  const normalized = slug.toLowerCase().replace(/[-_\s]+/g, '');
  return workspaces.find((w: any) => {
    const wNorm = (w.title || '').toLowerCase().replace(/[-_\s]+/g, '');
    return wNorm === normalized;
  }) || null;
}

// ── Type definition helpers ───────────────────────────────────────────

export async function getTypeForWorkspace(workspaceId: string) {
  const db = await getProjectDb();
  const workspaces = await getAllWorkspaces();

  const targetWs = workspaces.find((w: any) => w.id === workspaceId);
  if (!targetWs) return null;

  const typesWs = workspaces.find((w: any) => w.title === 'Types');
  if (!typesWs) return null;

  const { list: typeAssets } = await db.asset.assetsGetShort({ where: { workspaceId: typesWs.id } });
  const wsTitle = targetWs.title || '';
  const singular = wsTitle.replace(/ies$/, 'y').replace(/s$/, '');

  const match = (typeAssets || []).find((t: any) =>
    t.title === singular || t.title === wsTitle ||
    t.title?.toLowerCase() === singular.toLowerCase()
  );
  if (!match) {
    // Fallback: check workspace .imw.json for linked type asset ID
    // Dialogues use system ScriptElement type (00000000-0000-0000-0000-000000000033)
    if (wsTitle === 'Dialogues' || wsTitle === 'Quests') {
      const systemId = '00000000-0000-0000-0000-000000000033';
      const full = await db.asset.assetsGetFull({ where: { id: systemId } });
      return extractFullAsset(full, systemId);
    }
    return null;
  }

  const full = await db.asset.assetsGetFull({ where: { id: match.id } });
  return extractFullAsset(full, match.id);
}

/**
 * Extract property schema from a type definition AND from existing assets.
 * Merges both sources so we catch ad-hoc properties added per-instance.
 */
export async function getPropertySchema(workspaceId: string): Promise<Record<string, any>> {
  const schema: Record<string, any> = {};

  // 1. From type definition
  const typeAsset = await getTypeForWorkspace(workspaceId);
  if (typeAsset?.blocks) {
    for (const block of typeAsset.blocks) {
      if (!block || block.name === '__meta') continue;
      if (block.type === 'text') {
        const name = block.name || cleanTitle(block.title) || 'text';
        schema[name] = {
          type: 'string', title: block.title?.replace(/\[\[t:|\]\]/g, '') || name,
          blockType: 'text', blockId: block.id, blockName: block.name,
        };
      } else if (block.type === 'props') {
        const propsMetadata = extractPropsMetadata(block.computed || block.props);
        for (const [key, meta] of Object.entries(propsMetadata)) {
          schema[key] = { ...meta, blockType: 'props', blockId: block.id, blockName: block.name };
        }
      } else if (block.type === 'script') {
        schema['script'] = {
          type: 'array',
          title: 'Dialogue script',
          description: 'Array of dialogue lines with character, text, choices, chance, triggers',
          blockType: 'script', blockId: block.id, blockName: block.name,
        };
      }
    }
  }

  // 2. From first few existing assets (catches ad-hoc properties)
  const db = await getProjectDb();
  const { list } = await db.asset.assetsGetShort({ where: { workspaceId } });
  for (const shortAsset of (list || []).slice(0, 5)) {
    const full = await db.asset.assetsGetFull({ where: { id: shortAsset.id } });
    const asset = extractFullAsset(full, shortAsset.id);
    if (!asset?.blocks) continue;
    for (const block of asset.blocks) {
      if (!block || block.name === '__meta') continue;
      if (block.type === 'text' && !schema[block.name || cleanTitle(block.title) || 'text']) {
        const name = block.name || cleanTitle(block.title) || 'text';
        schema[name] = {
          type: 'string', title: block.title?.replace(/\[\[t:|\]\]/g, '') || name,
          blockType: 'text', blockId: block.id, blockName: block.name,
        };
      } else if (block.type === 'props') {
        const propsMetadata = extractPropsMetadata(block.computed || block.props);
        for (const [key, meta] of Object.entries(propsMetadata)) {
          if (!schema[key]) {
            schema[key] = { ...meta, blockType: 'props', blockId: block.id, blockName: block.name };
          }
        }
      } else if (block.type === 'script' && !schema['script']) {
        schema['script'] = {
          type: 'array',
          title: 'Dialogue script',
          description: 'Array of dialogue lines with character, text, choices, chance, triggers',
          blockType: 'script', blockId: block.id, blockName: block.name,
        };
      }
    }
  }

  return schema;
}

function cleanTitle(title: string | null | undefined): string {
  if (!title) return '';
  return title.replace(/\[\[t:|\]\]/g, '').toLowerCase().replace(/\s+/g, '_');
}

// ── Asset flattening (IMS format -> simple key-value) ─────────────────

export function flattenAsset(asset: any): Record<string, any> {
  const result: Record<string, any> = {
    id: asset.id,
    title: asset.title || asset.ownTitle || '',
  };
  if (!asset.blocks) return result;

  for (const block of asset.blocks) {
    if (!block || block.name === '__meta') continue;

    if (block.type === 'text') {
      const name = block.name || cleanTitle(block.title) || 'text';
      const val = block.computed?.value ?? block.props?.value;
      if (val == null) continue;
      if (typeof val === 'string') result[name] = val;
      else if (val.Str != null) result[name] = val.Str;
      else if (val.Ops) result[name] = val.Ops.map((op: any) => typeof op.insert === 'string' ? op.insert : '').join('').trim();
    } else if (block.type === 'props') {
      const props = block.computed || block.props || {};
      for (const [key, value] of Object.entries(props)) {
        if (key.startsWith('__') || key.startsWith('~') || value == null) continue;
        const displayKey = PROPERTY_DISPLAY_NAMES[key] || key;
        result[displayKey] = simplifyValue(value);
      }
    } else if (block.type === 'script') {
      const scriptProps = block.computed || block.props || {};
      const keyCount = Object.keys(scriptProps).length;
      const sampleKeys = Object.keys(scriptProps).slice(0, 3);
      console.log(`[flattenAsset] script block: ${keyCount} keys, sample:`, sampleKeys);
      const lines = flattenScript(scriptProps);
      console.log(`[flattenAsset] flattenScript returned ${lines.length} lines`);
      if (lines.length > 0) result.script = lines;
    }
  }
  return result;
}

function simplifyValue(value: any): any {
  if (value == null || typeof value !== 'object') return value;
  if ('AssetId' in value && 'Title' in value) return value.Title;
  if ('Enum' in value) return value.Title || value.Name;
  if (Array.isArray(value)) return value.map(simplifyValue);
  return value;
}

// ── Value resolution (simple value -> IMS internal format) ────────────

export async function resolveValue(key: string, value: any, propSchema: any): Promise<any> {
  if (value == null) return value;
  const propType = propSchema?.type;

  if (propType === 'gddElementSelector' && typeof value === 'string') {
    return await findAssetByName(value);
  }
  if ((propType === 'enum' || propType === 'enumRadio') && typeof value === 'string') {
    return await resolveEnumValue(value, propSchema);
  }
  if (propType === 'integer' && typeof value === 'string') return parseInt(value, 10);
  if (propType === 'number' && typeof value === 'string') return parseFloat(value);
  return value;
}

async function findAssetByName(name: string): Promise<any> {
  const db = await getProjectDb();
  const workspaces = await getAllWorkspaces();
  for (const ws of workspaces) {
    const { list } = await db.asset.assetsGetShort({ where: { workspaceId: ws.id } });
    for (const asset of (list || [])) {
      if (asset.title?.toLowerCase() === name.toLowerCase()) {
        return { Title: asset.title, AssetId: asset.id };
      }
    }
  }
  return name;
}

/**
 * Resolve an enum value by reading the enum definition asset directly.
 * Enum definitions have an `info` block with `items: [{name, title}, ...]`.
 */
async function resolveEnumValue(value: string, propSchema: any): Promise<any> {
  const enumAssetId = propSchema?.params?.type?.AssetId;
  if (!enumAssetId) return value;

  const db = await getProjectDb();
  const full = await db.asset.assetsGetFull({ where: { id: enumAssetId } });
  const enumAsset = extractFullAsset(full, enumAssetId);
  if (!enumAsset?.blocks) return value;

  // Use getEnumValues which handles the flattened format
  const enumItems = await getEnumValues(enumAssetId);
  const match = enumItems.find((item: any) =>
    item.name?.toLowerCase() === value.toLowerCase() ||
    item.title?.toLowerCase() === value.toLowerCase()
  );
  if (match) {
    return { Enum: enumAssetId, Name: match.name, Title: match.title };
  }
  return value;
}

/**
 * List valid enum values for an enum type asset.
 * Handles both raw format (array of {name, title}) and flattened format
 * (where assetsGetFull turns the array into indices + \\-delimited keys).
 */
export async function getEnumValues(enumAssetId: string): Promise<Array<{ name: string; title: string }>> {
  const db = await getProjectDb();
  const full = await db.asset.assetsGetFull({ where: { id: enumAssetId } });
  const enumAsset = extractFullAsset(full, enumAssetId);
  if (!enumAsset?.blocks) return [];
  for (const block of enumAsset.blocks) {
    const props = block.computed || block.props || {};
    const items = props.items;
    if (!Array.isArray(items)) continue;

    // Raw format: array of {name, title} objects
    if (items.length > 0 && typeof items[0] === 'object') return items;

    // Flattened format: items = [0,1,2,...] with items\\0\\name, items\\0\\title etc.
    const result: Array<{ name: string; title: string }> = [];
    for (const idx of items) {
      const name = props[`items\\${idx}\\name`];
      const title = props[`items\\${idx}\\title`];
      if (name || title) result.push({ name: name || '', title: title || '' });
    }
    if (result.length > 0) return result;
  }
  return [];
}

// ── Block building (flat key-value -> IMS block format) ───────────────

export async function buildBlocksFromFlat(
  flat: Record<string, any>,
  workspaceId: string
): Promise<Record<string, any>> {
  const schema = await getPropertySchema(workspaceId);
  const blockMap: Record<string, any> = {};

  // Find the default props block ID (for unknown properties)
  let defaultPropsBlockId: string | null = null;
  for (const meta of Object.values(schema)) {
    if (meta.blockType === 'props' && meta.blockId) {
      defaultPropsBlockId = meta.blockId;
      break;
    }
  }

  for (const [inputKey, value] of Object.entries(flat)) {
    if (inputKey === 'title' || inputKey === 'id') continue;
    if (value == null) continue;

    // Handle script/dialogue specially
    if (inputKey === 'script' && Array.isArray(value)) {
      const scriptData = await buildScriptFromSimple(value);
      // Find the content/script block ID from schema, or use name
      let scriptBlockKey = 'content';
      for (const meta of Object.values(schema)) {
        if (meta.blockType === 'script' || meta.blockName === 'content') {
          scriptBlockKey = meta.blockId ? `@${meta.blockId}` : 'content';
          break;
        }
      }
      blockMap[scriptBlockKey] = { type: 'script', props: scriptData };
      continue;
    }

    // Apply alias mapping (e.g. "language" -> "lanuge")
    const key = PROPERTY_ALIASES[inputKey] || inputKey;

    const propSchema = schema[key];

    if (propSchema) {
      // Known property - resolve value and place in correct block
      const resolved = await resolveValue(key, value, propSchema);
      const blockKey = propSchema.blockId ? `@${propSchema.blockId}` : (propSchema.blockName || key);

      if (propSchema.blockType === 'text') {
        blockMap[blockKey] = { type: 'text', props: { value: resolved } };
      } else if (propSchema.blockType === 'props') {
        if (!blockMap[blockKey]) blockMap[blockKey] = { type: 'props', props: {} };
        blockMap[blockKey].props[key] = resolved;
      }
    } else if (defaultPropsBlockId) {
      // Unknown property - pass through to default props block as-is
      const blockKey = `@${defaultPropsBlockId}`;
      if (!blockMap[blockKey]) blockMap[blockKey] = { type: 'props', props: {} };
      blockMap[blockKey].props[key] = value;
    }
  }

  return blockMap;
}

// ── Script/dialogue builder ───────────────────────────────────────────

interface SimpleDialogueLine {
  label?: string;
  character?: string;
  text: string;
  description?: string;
  choices?: Array<{ text: string; goto?: string }>;
  chance?: Array<{ weight: number; goto: string }>;
  trigger?: string;
  triggerParams?: Record<string, any>;
  setVar?: { variable: string; value: any };
  goto?: string;
}

/**
 * Convert a simplified dialogue script to IMS node graph format.
 * Resolves character names to asset references.
 */
export async function buildScriptFromSimple(lines: SimpleDialogueLine[]): Promise<any> {
  const { v4: uuidv4 } = await import('uuid');
  const nodes: Record<string, any> = {};
  const labelToId: Record<string, string> = {};

  // Pre-assign UUIDs and register labels
  const lineIds: string[] = [];
  for (const line of lines) {
    const id = uuidv4();
    lineIds.push(id);
    if (line.label) labelToId[line.label] = id;
  }

  // Create start and end nodes
  const startId = uuidv4();
  const endId = uuidv4();
  nodes[startId] = { type: 'start', next: lineIds[0] || endId, index: 0, pos: { x: 0, y: 0 } };
  nodes[endId] = { type: 'end', next: null, index: 0, pos: { x: 0, y: (lines.length + 1) * 200 } };

  // Build nodes
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nodeId = lineIds[i];
    const defaultNext = i + 1 < lineIds.length ? lineIds[i + 1] : endId;
    const y = (i + 1) * 200;

    // Resolve character reference
    let character: any = null;
    if (line.character) {
      character = await findAssetByName(line.character);
      // Ensure it's in asset reference format
      if (typeof character === 'string') character = null;
    }

    if (line.setVar) {
      // SetVar node
      nodes[nodeId] = {
        type: 'setVar',
        next: line.goto ? (labelToId[line.goto] || defaultNext) : defaultNext,
        index: 0,
        pos: { x: 0, y },
        values: { variable: line.setVar.variable, value: line.setVar.value },
      };
    } else if (line.trigger) {
      // Trigger node
      nodes[nodeId] = {
        type: 'trigger',
        next: line.goto ? (labelToId[line.goto] || defaultNext) : defaultNext,
        index: 0,
        subject: line.trigger,
        pos: { x: 0, y },
        values: line.triggerParams || {},
      };
    } else if (line.chance && line.chance.length > 0) {
      // Chance node - weighted random branching
      const options = line.chance.map(c => ({
        next: c.goto ? (labelToId[c.goto] || endId) : defaultNext,
        values: { weight: c.weight },
      }));
      nodes[nodeId] = {
        type: 'chance',
        next: null,
        index: 0,
        options,
        pos: { x: 0, y },
        values: {},
      };
    } else if (line.choices && line.choices.length > 0) {
      // Speech node with player choices
      const options = line.choices.map(choice => ({
        next: choice.goto ? (labelToId[choice.goto] || endId) : defaultNext,
        values: { text: choice.text },
      }));
      nodes[nodeId] = {
        type: 'speech',
        next: null,
        index: 0,
        options,
        pos: { x: 0, y },
        values: {
          text: line.text,
          character,
          description: line.description || null,
        },
      };
    } else {
      // Simple speech node
      nodes[nodeId] = {
        type: 'speech',
        next: line.goto ? (labelToId[line.goto] || defaultNext) : defaultNext,
        index: 0,
        pos: { x: 0, y },
        values: {
          text: line.text,
          character,
          description: line.description || null,
        },
      };
    }
  }

  // Resolve any goto references that were forward-declared
  for (const node of Object.values(nodes)) {
    if (typeof node.next === 'string' && labelToId[node.next]) {
      node.next = labelToId[node.next];
    }
    if (node.options) {
      for (const opt of node.options) {
        if (typeof opt.next === 'string' && labelToId[opt.next]) {
          opt.next = labelToId[opt.next];
        }
      }
    }
  }

  // Build variable declarations from setVar nodes
  const ownVars: Record<string, any> = {};
  for (const line of lines) {
    if (line.setVar) {
      const varName = line.setVar.variable;
      const varValue = line.setVar.value;
      const varType = typeof varValue === 'number' ? 'integer'
        : typeof varValue === 'boolean' ? 'boolean' : 'string';
      ownVars[varName] = {
        name: varName,
        type: { Type: varType },
        title: varName.charAt(0).toUpperCase() + varName.slice(1),
        autoFill: null,
        description: null,
      };
    }
  }

  // Standard speech field settings (IMS editor needs these to render nodes)
  const __settings = {
    speech: {
      main: {
        text: { name: 'text', type: { Type: 'text' }, index: 2, title: '[[t:Text]]', default: { Type: 'text' }, description: null },
        character: { name: 'character', type: { Type: 'asset' }, index: 1, title: '[[t:Character]]', autoFill: true, description: null },
        description: { name: 'description', type: { Type: 'text' }, index: 0, title: 'Description', autoFill: null, description: 'What happens behind the scenes?' },
      },
      option: {
        text: { name: 'text', type: { Type: 'text' }, title: '[[t:Text]]', default: { Type: 'text' }, description: null },
      },
    },
  };

  return {
    start: startId,
    variables: { own: ownVars },
    __settings,
    nodes,
  };
}

/**
 * Unflatten \\-delimited AssetProps back into nested objects.
 * assetsGetFull flattens { nodes: { uuid: { type: "speech" } } } into
 * { "nodes\\uuid\\type": "speech" }. Arrays become index placeholders
 * like options: [0,1,2] with options\\0\\text: "..." sub-keys.
 */
function unflattenProps(flat: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(flat)) {
    // Skip array index placeholders (e.g., options: [0, 1, 2])
    if (Array.isArray(value)) continue;

    const parts = key.split('\\');
    if (parts.length === 1) {
      result[key] = value;
      continue;
    }
    let current: any = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  // Convert objects with all-numeric keys back to arrays
  numericKeysToArrays(result);
  return result;
}

function numericKeysToArrays(obj: any): void {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      numericKeysToArrays(val);
      const subKeys = Object.keys(val);
      if (subKeys.length > 0 && subKeys.every(k => /^\d+$/.test(k))) {
        const arr: any[] = [];
        for (const k of subKeys.sort((a, b) => parseInt(a) - parseInt(b))) {
          arr.push(val[k]);
        }
        obj[key] = arr;
      }
    }
  }
}

/**
 * Flatten a script block's nodes into simplified dialogue lines for API output.
 */
export function flattenScript(scriptProps: any): SimpleDialogueLine[] {
  // Unflatten \\-delimited props from assetsGetFull
  const props = scriptProps?.nodes ? scriptProps : unflattenProps(scriptProps || {});
  console.log(`[flattenScript] after unflatten: hasNodes=${!!props?.nodes} hasStart=${!!props?.start} nodeCount=${props?.nodes ? Object.keys(props.nodes).length : 0}`);
  if (props?.nodes) {
    const firstNodeId = Object.keys(props.nodes)[0];
    const firstNode = props.nodes[firstNodeId];
    console.log(`[flattenScript] first node: id=${firstNodeId} type=${firstNode?.type} next=${firstNode?.next}`);
    if (props.start) {
      const startNode = props.nodes[props.start];
      console.log(`[flattenScript] start node: id=${props.start} type=${startNode?.type} next=${startNode?.next}`);
    }
  }
  if (!props?.nodes || !props?.start) return [];
  const nodes = props.nodes;
  const lines: SimpleDialogueLine[] = [];
  const visited = new Set<string>();

  // Walk the graph from start
  let currentId = nodes[props.start]?.next;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = nodes[currentId];
    if (!node) break;

    if (node.type === 'speech') {
      const line: SimpleDialogueLine = {
        text: node.values?.text || '',
        character: node.values?.character?.Title || undefined,
        description: typeof node.values?.description === 'string'
          ? node.values.description
          : node.values?.description?.Str || undefined,
      };
      if (node.options?.length) {
        line.choices = node.options.map((opt: any) => ({
          text: opt.values?.text || '',
        }));
      }
      lines.push(line);
      // Follow first option or next
      currentId = node.options?.[0]?.next || node.next;
    } else if (node.type === 'chance') {
      const weights = (node.options || []).map((opt: any) => opt.values?.weight || 1);
      lines.push({ text: `[chance: ${weights.join('/')}]`, chance: (node.options || []).map((opt: any) => ({ weight: opt.values?.weight || 1, goto: '' })) });
      currentId = node.options?.[0]?.next;
    } else if (node.type === 'trigger') {
      lines.push({ text: `[trigger: ${node.subject}]`, trigger: node.subject });
      currentId = node.next;
    } else if (node.type === 'setVar') {
      lines.push({ text: `[set ${node.values?.variable} = ${node.values?.value}]`, setVar: node.values });
      currentId = node.next;
    } else if (node.type === 'end') {
      break;
    } else {
      currentId = node.next;
    }
  }
  return lines;
}

// ── Git auto-commit ───────────────────────────────────────────────────

export async function autoCommit(message: string) {
  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) {
    console.warn('[auto-commit] PROJECT_PATH not set, skipping');
    return;
  }
  try {
    await execFileAsync('git', ['add', '-A'], { cwd: projectPath });
    await execFileAsync('git', ['diff', '--cached', '--quiet'], { cwd: projectPath }).catch(async () => {
      // diff --quiet exits 1 when there are staged changes
      await execFileAsync('git', ['commit', '-m', message], { cwd: projectPath });
      console.log(`[auto-commit] ${message}`);
    });
  } catch (err) {
    console.error('[auto-commit] failed:', err);
  }
}

// ── Asset CRUD helpers ────────────────────────────────────────────────

export async function listAssetsFlat(workspaceId: string) {
  const db = await getProjectDb();
  const { list } = await db.asset.assetsGetShort({ where: { workspaceId } });
  return (list || []).map((a: any) => ({ id: a.id, title: a.title, icon: a.icon }));
}

export async function getAssetFlat(id: string): Promise<Record<string, any> | null> {
  const db = await getProjectDb();
  const full = await db.asset.assetsGetFull({ where: { id } });
  const asset = extractFullAsset(full, id);
  if (!asset) return null;
  return flattenAsset(asset);
}

export async function createAssetFromFlat(workspaceId: string, flat: Record<string, any>) {
  const db = await getProjectDb();
  const blocks = await buildBlocksFromFlat(flat, workspaceId);

  // Find parent type
  const typeAsset = await getTypeForWorkspace(workspaceId);
  const parentIds = typeAsset ? [typeAsset.id] : [];

  const params: any = {
    set: {
      workspaceId,
      title: flat.title,
      parentIds,
      blocks: Object.keys(blocks).length > 0 ? blocks : undefined,
    },
  };

  const result = await db.asset.assetsCreate(params);
  // assetsCreate returns { ids: string[], objects: { assetFulls: {...} }, ... }
  const createdId = result.ids?.[0];
  if (createdId) {
    await autoCommit(`Create ${flat.title || 'asset'}`);
    const fullAsset = result.objects?.assetFulls?.[createdId];
    if (fullAsset) return flattenAsset(fullAsset);
    return await getAssetFlat(createdId);
  }
  return { success: true, ...result };
}

export async function updateAssetFromFlat(id: string, flat: Record<string, any>) {
  const db = await getProjectDb();

  // Get existing asset to find its workspace
  const existing = await db.asset.assetsGetFull({ where: { id } });
  const asset = extractFullAsset(existing, id);
  if (!asset) return null;

  const workspaceId = asset.workspaceId;
  const blocks = await buildBlocksFromFlat(flat, workspaceId);

  const setData: any = {};
  if (flat.title) setData.title = flat.title;
  if (Object.keys(blocks).length > 0) setData.blocks = blocks;

  if (Object.keys(setData).length === 0) return flattenAsset(asset);

  await db.asset.assetsChange({ where: { id }, set: setData });
  await autoCommit(`Update ${flat.title || asset.title || id}`);

  // Return updated asset
  return await getAssetFlat(id);
}

export async function deleteAsset(id: string) {
  const db = await getProjectDb();
  // assetsDelete takes the where clause directly, NOT wrapped in { where: ... }
  const result = await db.asset.assetsDelete({ id });
  await autoCommit(`Delete ${id}`);
  return result;
}

// ── Context building ──────────────────────────────────────────────────

export async function buildGptContext() {
  const db = await getProjectDb();
  const workspaces = await getAllWorkspaces();

  const entityTypes: Record<string, any> = {};

  for (const ws of workspaces) {
    if (ws.title === 'Types') continue;
    const slug = ws.title.toLowerCase().replace(/\s+/g, '-');

    // Get property schema
    const schema = await getPropertySchema(ws.id);
    const properties: Record<string, any> = {};

    for (const [key, meta] of Object.entries(schema)) {
      const displayKey = PROPERTY_DISPLAY_NAMES[key] || key;
      const prop: any = { type: meta.type || 'string' };
      if (meta.title) prop.description = meta.title;

      // For enums, list valid values
      if ((meta.type === 'enum' || meta.type === 'enumRadio') && meta.params?.type?.AssetId) {
        const enumValues = await getEnumValues(meta.params.type.AssetId);
        prop.validValues = enumValues.map((v: any) => v.title || v.name);
      }

      // For references, note what they point to
      if (meta.type === 'gddElementSelector' && meta.params?.type?.Title) {
        prop.referencesType = meta.params.type.Title;
        prop.description = `${meta.title || key}. Use the name (e.g. "Emorian"), not a UUID.`;
      }

      properties[displayKey] = prop;
    }

    // Count assets
    const { list } = await db.asset.assetsGetShort({ where: { workspaceId: ws.id } });
    const assetCount = (list || []).length;

    entityTypes[slug] = {
      workspaceId: ws.id,
      title: ws.title,
      properties,
      assetCount,
    };
  }

  // Collect reference data (languages, countries, etc.)
  const referenceData: Record<string, string[]> = {};
  for (const ws of workspaces) {
    if (['Types', 'Gameplay'].includes(ws.title)) continue;
    const { list } = await db.asset.assetsGetShort({ where: { workspaceId: ws.id } });
    if ((list || []).length > 0 && (list || []).length <= 30) {
      referenceData[ws.title.toLowerCase()] = (list || []).map((a: any) => a.title).filter(Boolean);
    }
  }

  return {
    game: 'If This',
    description: 'Game set in a fictional concentration camp. Isometric 3D. Fictional countries, languages, religions.',
    instructions: 'Always call getContext first. Use entity names (not UUIDs) for references. All properties are flat key-value pairs.',
    entityTypes,
    referenceData,
  };
}
