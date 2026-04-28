import { getProjectDb } from './project-db';
import { execFile } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
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
      const lines = flattenScript(scriptProps);
      if (lines.length > 0) result.script = lines;
    } else if (block.type === 'gallery') {
      const galleryProps = block.computed || block.props || {};
      // Extract main image - handle both nested and flattened format
      const mainValue = galleryProps['main\\value'] || galleryProps.main?.value;
      if (mainValue?.FileId) {
        const store = mainValue.Store || 'loc-project';
        result.image = {
          filename: mainValue.Title,
          size: mainValue.Size,
          url: `/api/file/${store}/${mainValue.FileId}`,
        };
      }
    }
  }

  // For type definitions: expose __props as defined_properties
  if (asset.parentIds?.includes('00000000-0000-0000-0000-000000000035') ||
      asset.workspaceId === 'ae2b3260-4448-4f89-9d6d-aac56479a7b5') {
    const propsBlock = asset.blocks?.find((b: any) => b.type === 'props' && b.name === 'props');
    if (propsBlock) {
      const metadata = extractPropsMetadata(propsBlock.computed || propsBlock.props || {});
      if (Object.keys(metadata).length > 0) {
        result.defined_properties = {};
        for (const [key, meta] of Object.entries(metadata)) {
          const prop: any = { type: meta.type || 'string' };
          if (meta.title) prop.title = meta.title;
          if (meta.multiple) prop.multiple = true;
          if (meta.params?.type?.Title) prop.references = meta.params.type.Title;
          result.defined_properties[key] = prop;
        }
      }
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

    // Handle type definition properties
    if (inputKey === 'defined_properties' && typeof value === 'object') {
      // Translate { propName: { type, title, references, multiple } } to __props format
      const propsBlockKey = defaultPropsBlockId ? `@${defaultPropsBlockId}` : 'props';
      if (!blockMap[propsBlockKey]) blockMap[propsBlockKey] = { type: 'props', props: {} };
      const __props: Record<string, any> = {};
      let index = 1;
      for (const [propName, propDef] of Object.entries(value as Record<string, any>)) {
        const meta: any = { type: propDef.type || 'string', index: index++, title: propDef.title || propName };
        if (propDef.multiple) meta.multiple = true;
        if (propDef.references) {
          // Resolve reference type name to asset ID
          const refAsset = await findAssetByName(propDef.references);
          if (typeof refAsset === 'object' && refAsset.AssetId) {
            meta.params = { type: { Title: propDef.references, AssetId: refAsset.AssetId } };
          }
        }
        blockMap[propsBlockKey].props[propName] = null; // Default value
        __props[propName] = meta;
      }
      blockMap[propsBlockKey].props.__props = __props;
      continue;
    }

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
      // Wipe existing flat keys before overlaying new nested objects.
      // Without `~: null`, applyPropsChange leaves stale `nodes\<uuid>\...` flat keys
      // that overwrite the new nested values during convertAssetPropsToPlainObject.
      blockMap[scriptBlockKey] = { type: 'script', props: [{ '~': null }, scriptData] };
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
    } else {
      // Unknown property - pass through to props block (create one if needed)
      const blockKey = defaultPropsBlockId ? `@${defaultPropsBlockId}` : 'props';
      if (!blockMap[blockKey]) blockMap[blockKey] = { type: 'props', props: {} };
      blockMap[blockKey].props[key] = value;
    }
  }

  return blockMap;
}

// ── Script/dialogue builder ───────────────────────────────────────────

interface SimpleDialogueLine {
  label?: string;
  character?: string | { Title: string; AssetId: string };
  text: string;
  description?: string;
  choices?: Array<{ text: string; goto?: string }>;
  chance?: Array<{ weight: number; goto: string }>;
  trigger?: string;
  triggerParams?: Record<string, any>;
  setVar?: { variable: string; value: any };
  condition?: { variable: string; equals: any; then: string; else: string };
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
  // Register "end" as a built-in label so callers can `goto: "end"` to terminate a branch.
  if (!labelToId['end']) labelToId['end'] = endId;

  // Build nodes
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nodeId = lineIds[i];
    const defaultNext = i + 1 < lineIds.length ? lineIds[i + 1] : endId;
    const y = (i + 1) * 200;

    // Resolve character reference
    let character: any = null;
    if (line.character) {
      if (typeof line.character === 'object' && 'AssetId' in line.character) {
        // Already an asset reference - use directly
        character = line.character;
      } else {
        character = await findAssetByName(line.character as string);
        // Ensure it's in asset reference format
        if (typeof character === 'string') character = null;
      }
    }

    if (line.condition) {
      // Condition node: generates getVar + opEqual + branch (3 internal nodes)
      // The lineId becomes the branch node; getVar and opEqual are helpers.
      const getVarId = uuidv4();
      const opEqualId = uuidv4();
      const branchId = nodeId; // The line's ID is the branch (flow entry point)

      nodes[getVarId] = {
        type: 'getVar',
        next: null,
        index: 0,
        pos: { x: -200, y },
        values: { variable: line.condition.variable },
      };
      nodes[opEqualId] = {
        type: 'opEqual',
        next: null,
        index: 0,
        pos: { x: -100, y },
        values: {
          arg1: { get: getVarId, param: 'result' },
          arg2: line.condition.equals,
        },
      };
      nodes[branchId] = {
        type: 'branch',
        next: null,
        index: 0,
        pos: { x: 0, y },
        options: [
          {
            next: labelToId[line.condition.else] || defaultNext,
            values: { value: false },
          },
          {
            next: labelToId[line.condition.then] || defaultNext,
            values: { value: true },
          },
        ],
        values: {
          condition: { get: opEqualId, param: 'result' },
        },
      };
    } else if (line.setVar) {
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

  // Build variable declarations from setVar and condition nodes
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
    if (line.condition && !ownVars[line.condition.variable]) {
      const varName = line.condition.variable;
      const eqVal = line.condition.equals;
      const varType = typeof eqVal === 'number' ? 'integer'
        : typeof eqVal === 'boolean' ? 'boolean' : 'string';
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
 *
 * Round-trips with buildScriptFromSimple: every reachable speech/setVar/trigger/chance/condition
 * node is emitted as a line in BFS order. Lines flow sequentially; `goto` is emitted
 * only when a node's actual next (or option's next) deviates from the next sequential
 * line. Labels are emitted only on lines referenced as goto targets.
 *
 * Branch nodes backed by getVar + opEqual are emitted as `condition` lines.
 *
 * Labels use the first 8 chars of the node UUID so they're stable within a single read.
 * They change after every save (since save regenerates UUIDs), but that's expected -
 * GPT should always use labels from the most recent read.
 */
export function flattenScript(scriptProps: any): SimpleDialogueLine[] {
  const props = scriptProps?.nodes ? scriptProps : unflattenProps(scriptProps || {});
  if (!props?.nodes || !props?.start) return [];
  const nodes = props.nodes;

  // Try to reconstruct a condition from a branch node.
  // Pattern: branch.values.condition -> { get: opEqualId } -> opEqual.values.arg1 -> { get: getVarId }
  const tryExtractCondition = (branchNode: any): { variable: string; equals: any; thenId: string | null; elseId: string | null } | null => {
    const condRef = branchNode.values?.condition;
    if (!condRef?.get) return null;
    const opNode = nodes[condRef.get];
    if (!opNode || (opNode.type !== 'opEqual' && opNode.type !== 'opEquals')) return null;
    const arg1Ref = opNode.values?.arg1;
    if (!arg1Ref?.get) return null;
    const getVarNode = nodes[arg1Ref.get];
    if (!getVarNode || getVarNode.type !== 'getVar') return null;

    const options = branchNode.options || [];
    let thenId: string | null = null;
    let elseId: string | null = null;
    for (const opt of options) {
      if (opt.values?.value === true) thenId = opt.next;
      else if (opt.values?.value === false) elseId = opt.next;
    }

    return {
      variable: getVarNode.values?.variable,
      equals: opNode.values?.arg2,
      thenId,
      elseId,
    };
  };

  // Nodes we emit as lines. branch nodes backed by conditions are also emitted.
  const isLineNode = (t: string) =>
    t === 'speech' || t === 'setVar' || t === 'trigger' || t === 'chance' || t === 'end' || t === 'branch';

  // Skip past non-line nodes (start, op*, getVar) to the next line node.
  const resolveLink = (id: string | null | undefined): string | null => {
    const seen = new Set<string>();
    let cur: string | null | undefined = id;
    while (cur && !seen.has(cur) && nodes[cur]) {
      seen.add(cur);
      const n = nodes[cur];
      if (isLineNode(n.type)) return cur;
      if (n.type === 'start') { cur = n.next; continue; }
      return null; // op*, getVar, etc.
    }
    return null;
  };

  // BFS from start through line nodes only.
  const order: string[] = [];
  const seen = new Set<string>();
  const enqueue = (id: string | null) => {
    if (!id || seen.has(id) || !nodes[id]) return;
    seen.add(id);
    order.push(id);
    const n = nodes[id];
    if (n.type === 'branch') {
      // Enqueue both branch targets
      for (const opt of n.options || []) enqueue(resolveLink(opt.next));
    } else {
      enqueue(resolveLink(n.next));
      for (const opt of n.options || []) enqueue(resolveLink(opt.next));
    }
  };
  enqueue(resolveLink(props.start));

  // Find which nodes are jump targets (need a label).
  const labelOf = (id: string) => id.slice(0, 8);
  const targets = new Set<string>();
  for (let i = 0; i < order.length; i++) {
    const n = nodes[order[i]];
    const naturalNext = order[i + 1] ?? null;
    if (n.type === 'branch') {
      for (const opt of n.options || []) {
        const t = resolveLink(opt.next);
        if (t) targets.add(t);
      }
    } else {
      const actualNext = resolveLink(n.next);
      if (actualNext && actualNext !== naturalNext) targets.add(actualNext);
      for (const opt of n.options || []) {
        const t = resolveLink(opt.next);
        if (t) targets.add(t);
      }
    }
  }

  // Emit lines.
  const lines: SimpleDialogueLine[] = [];
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    const n = nodes[id];
    const naturalNext = order[i + 1] ?? null;
    const line: SimpleDialogueLine = { text: '' };
    if (targets.has(id)) line.label = labelOf(id);

    const emitGoto = (target: string | null) => {
      if (!target) return undefined;
      if (nodes[target]?.type === 'end') return 'end';
      return labelOf(target);
    };
    const fallthroughGoto = () => {
      const actualNext = resolveLink(n.next);
      if (!actualNext || actualNext === naturalNext) return;
      line.goto = emitGoto(actualNext);
    };

    if (n.type === 'branch') {
      const cond = tryExtractCondition(n);
      if (cond) {
        const thenTarget = resolveLink(cond.thenId);
        const elseTarget = resolveLink(cond.elseId);
        line.condition = {
          variable: cond.variable,
          equals: cond.equals,
          then: emitGoto(thenTarget) || '',
          else: emitGoto(elseTarget) || '',
        };
      } else {
        // Unrecognized branch pattern - emit as choices to preserve branching
        line.text = '[branch]';
        line.choices = (n.options || []).map((opt: any) => {
          const target = resolveLink(opt.next);
          const choice: { text: string; goto?: string } = {
            text: opt.values?.value != null ? String(opt.values.value) : 'option',
          };
          const g = emitGoto(target);
          if (g) choice.goto = g;
          return choice;
        });
      }
    } else if (n.type === 'speech') {
      line.text = n.values?.text || '';
      if (n.values?.character?.AssetId && n.values?.character?.Title) {
        line.character = { Title: n.values.character.Title, AssetId: n.values.character.AssetId };
      } else if (n.values?.character?.Title) {
        line.character = n.values.character.Title;
      }
      const desc = n.values?.description;
      if (typeof desc === 'string' && desc) line.description = desc;
      else if (desc?.Str) line.description = desc.Str;
      if (n.options?.length) {
        line.choices = n.options.map((opt: any) => {
          const optText = typeof opt.values?.text === 'string'
            ? opt.values.text
            : opt.values?.text?.Str || '';
          const target = resolveLink(opt.next);
          const choice: { text: string; goto?: string } = { text: optText };
          const g = emitGoto(target);
          if (g) choice.goto = g;
          return choice;
        });
      } else {
        fallthroughGoto();
      }
    } else if (n.type === 'setVar') {
      line.setVar = { variable: n.values?.variable, value: n.values?.value };
      fallthroughGoto();
    } else if (n.type === 'trigger') {
      line.trigger = n.subject;
      if (n.values && Object.keys(n.values).length) line.triggerParams = n.values;
      fallthroughGoto();
    } else if (n.type === 'chance') {
      line.chance = (n.options || []).map((opt: any) => ({
        weight: opt.values?.weight || 1,
        goto: emitGoto(resolveLink(opt.next)) || '',
      }));
    } else if (n.type === 'end') {
      // Only emit end if it's a labeled jump target; otherwise it's implicit.
      if (!targets.has(id)) continue;
      line.text = '';
      line.label = 'end';
    }
    lines.push(line);
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
      // Push in background (don't block the response)
      execFileAsync('git', ['push'], { cwd: projectPath }).catch(
        (err) => console.error('[auto-push] failed:', err.message)
      );
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
  await refreshCharacterTitles(asset);
  return flattenAsset(asset);
}

/**
 * Refresh stale character Title fields in script blocks by resolving AssetIds
 * against the current asset database. Mutates the asset in place.
 */
async function refreshCharacterTitles(asset: any): Promise<void> {
  if (!asset?.blocks) return;
  const db = await getProjectDb();
  const titleCache: Record<string, string> = {};

  for (const block of asset.blocks) {
    if (block.type !== 'script') continue;
    // Handle both nested and flattened props format.
    // assetsGetFull can return flattened keys like `nodes\\uuid\\values\\character\\Title`.
    // Only unflatten props (mutable), not computed (read-only cache).
    const rawProps = block.props || {};
    const propsNeedUnflatten = !rawProps.nodes && Object.keys(rawProps).some(k => k.startsWith('nodes\\'));
    if (propsNeedUnflatten) {
      const unflattened = unflattenProps(rawProps);
      // Merge unflattened structure back into block.props so downstream consumers see it
      Object.assign(rawProps, unflattened);
    }

    const nodes = rawProps.nodes || block.computed?.nodes;
    if (!nodes) continue;

    for (const node of Object.values(nodes) as any[]) {
      const char = node.values?.character;
      if (!char?.AssetId) continue;
      const assetId = char.AssetId;

      if (!(assetId in titleCache)) {
        const full = await db.asset.assetsGetFull({ where: { id: assetId } });
        const charAsset = extractFullAsset(full, assetId);
        titleCache[assetId] = charAsset?.title || charAsset?.ownTitle || char.Title || '';
      }

      if (titleCache[assetId] && titleCache[assetId] !== char.Title) {
        char.Title = titleCache[assetId];
      }
    }
  }
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
    // Include all workspaces including Types (so ChatGPT can discover and modify type definitions)
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

  let instructions = 'Always call getContext first. Use entity names (not UUIDs) for references.';
  for (const p of [
    resolve(process.cwd(), 'gpt-instructions.md'),
    resolve(process.cwd(), '..', 'gpt-instructions.md'),
    resolve(process.cwd(), 'web', 'gpt-instructions.md'),
  ]) {
    try { instructions = readFileSync(p, 'utf-8'); break; } catch {}
  }

  return {
    game: 'If This',
    description: 'Game set in a fictional concentration camp. Isometric 3D. Fictional countries, languages, religions.',
    instructions,
    entityTypes,
    referenceData,
  };
}
