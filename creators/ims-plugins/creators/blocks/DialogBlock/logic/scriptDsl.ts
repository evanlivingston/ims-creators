/**
 * Round-trip parser for the dialogue runner's inline-script DSL.
 *
 * Used in option `script` and speech `script` fields. The runner
 * (Scripts/dialogue_script.gd) accepts strings like:
 *   SetVar("met_guard", true); AdjustRep("kalpin", 0.1); AddItem("bread.json")
 *
 * Each command runs synchronously when the option/speech is reached.
 * Unknown commands are silently ignored by the runner.
 */

export type ScriptArgValue =
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'bool'; value: boolean };

export type ScriptCommand = {
  name: string;
  args: ScriptArgValue[];
};

export type ScriptArgKind = 'string' | 'number' | 'bool';

export type ScriptCommandDef = {
  name: string;
  description: string;
  args: { label: string; kind: ScriptArgKind }[];
};

export const SCRIPT_COMMANDS: ScriptCommandDef[] = [
  {
    name: 'SetVar',
    description: 'Assign a dialogue variable. Persists via the binding system.',
    args: [
      { label: 'Variable name', kind: 'string' },
      { label: 'Value', kind: 'string' },
    ],
  },
  {
    name: 'AdjustRep',
    description: 'Add to the named faction\'s reputation. Clamped [-1, 1].',
    args: [
      { label: 'Faction id', kind: 'string' },
      { label: 'Delta', kind: 'number' },
    ],
  },
  {
    name: 'AdjustRelationship',
    description: 'Add to the named NPC\'s relationship score. Clamped [-1, 1].',
    args: [
      { label: 'NPC name', kind: 'string' },
      { label: 'Delta', kind: 'number' },
    ],
  },
  {
    name: 'AddItem',
    description:
      'Add an item to the player inventory. Path is res:// or design/Items/<id>.json.',
    args: [{ label: 'Item path', kind: 'string' }],
  },
  {
    name: 'RemoveItem',
    description: 'Remove an item from the player inventory by id.',
    args: [{ label: 'Item id', kind: 'string' }],
  },
  {
    name: 'AddTask',
    description: 'Add an active task. Text is shown to the player.',
    args: [
      { label: 'Task id', kind: 'string' },
      { label: 'Task text', kind: 'string' },
    ],
  },
  {
    name: 'CompleteTask',
    description: 'Mark an active task complete.',
    args: [{ label: 'Task id', kind: 'string' }],
  },
];

export function parseScript(input: string): {
  commands: ScriptCommand[];
  unsupported: boolean;
} {
  const trimmed = (input ?? '').trim();
  if (trimmed === '') return { commands: [], unsupported: false };

  const commands: ScriptCommand[] = [];
  const pieces = splitTopLevel(trimmed, ';');
  for (const raw of pieces) {
    const piece = raw.trim();
    if (!piece) continue;
    const cmd = parseCommand(piece);
    if (!cmd) return { commands: [], unsupported: true };
    commands.push(cmd);
  }
  return { commands, unsupported: false };
}

export function serializeScript(commands: ScriptCommand[]): string {
  return commands.map(serializeCommand).join('; ');
}

function serializeCommand(cmd: ScriptCommand): string {
  return `${cmd.name}(${cmd.args.map(serializeArg).join(', ')})`;
}

function serializeArg(arg: ScriptArgValue): string {
  if (arg.kind === 'bool') return arg.value ? 'true' : 'false';
  if (arg.kind === 'number') return String(arg.value);
  return `"${arg.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function parseCommand(s: string): ScriptCommand | null {
  const m = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(([^]*)\)\s*$/);
  if (!m) return null;
  const name = m[1];
  const argsStr = m[2].trim();
  const args: ScriptArgValue[] = [];
  if (argsStr) {
    for (const piece of splitTopLevel(argsStr, ',')) {
      const arg = parseArg(piece.trim());
      if (!arg) return null;
      args.push(arg);
    }
  }
  return { name, args };
}

function parseArg(s: string): ScriptArgValue | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  if (trimmed === 'true') return { kind: 'bool', value: true };
  if (trimmed === 'false') return { kind: 'bool', value: false };
  if (trimmed.startsWith('"')) {
    if (!trimmed.endsWith('"') || trimmed.length < 2) return null;
    const inner = trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return { kind: 'string', value: inner };
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { kind: 'number', value: parseFloat(trimmed) };
  }
  return null;
}

function splitTopLevel(s: string, sep: ';' | ','): string[] {
  const out: string[] = [];
  let buf = '';
  let inStr = false;
  let parenDepth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      buf += c;
      if (c === '\\' && i + 1 < s.length) {
        buf += s[i + 1];
        i++;
      } else if (c === '"') {
        inStr = false;
      }
      continue;
    }
    if (c === '"') {
      inStr = true;
      buf += c;
      continue;
    }
    if (c === '(') parenDepth++;
    else if (c === ')') parenDepth--;
    if (c === sep && parenDepth === 0) {
      out.push(buf);
      buf = '';
      continue;
    }
    buf += c;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

export function defaultArgFor(kind: ScriptArgKind): ScriptArgValue {
  if (kind === 'number') return { kind: 'number', value: 0 };
  if (kind === 'bool') return { kind: 'bool', value: true };
  return { kind: 'string', value: '' };
}
