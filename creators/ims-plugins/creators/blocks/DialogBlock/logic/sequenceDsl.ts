/**
 * Round-trip parser for the dialogue runner's sequence-command DSL.
 *
 * Used in speech `sequence` and trigger `sequence` fields. The runner
 * (Scripts/sequence_runner.gd) executes each command on a tween chain.
 * Format: semicolon-separated, with optional `@<seconds>` prefix per command.
 *   FocusCamera("npc"); @0.5 PlayAnim("npc", "Talk"); @2.0 ResetCamera()
 */

export type SequenceArgValue =
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'bool'; value: boolean };

export type SequenceStep = {
  delay: number; // seconds; 0 means immediate
  name: string;
  args: SequenceArgValue[];
};

export type SequenceArgKind = 'string' | 'number' | 'bool';

export type SequenceCommandDef = {
  name: string;
  description: string;
  args: { label: string; kind: SequenceArgKind }[];
};

export const SEQUENCE_COMMANDS: SequenceCommandDef[] = [
  {
    name: 'FocusCamera',
    description: 'Focus camera on a node by group name or scene name.',
    args: [{ label: 'Target node', kind: 'string' }],
  },
  {
    name: 'ResetCamera',
    description: 'Return camera to default (player) focus.',
    args: [],
  },
  {
    name: 'FadeToBlack',
    description: 'Fade screen to black over 0.5s.',
    args: [],
  },
  {
    name: 'FadeFromBlack',
    description: 'Fade screen from black over 0.5s.',
    args: [],
  },
  {
    name: 'PlayAnim',
    description: 'Play an animation on a target actor.',
    args: [
      { label: 'Actor', kind: 'string' },
      { label: 'Animation name', kind: 'string' },
    ],
  },
  {
    name: 'PlaySound',
    description: 'Play a sound file (res:// path).',
    args: [{ label: 'Audio path', kind: 'string' }],
  },
  {
    name: 'Wait',
    description: 'Pause the timeline for N seconds.',
    args: [{ label: 'Seconds', kind: 'number' }],
  },
  {
    name: 'LockPlayer',
    description: 'Lock or unlock player movement.',
    args: [{ label: 'Locked?', kind: 'bool' }],
  },
  {
    name: 'HideUI',
    description: 'Hide or show the HUD.',
    args: [{ label: 'Hidden?', kind: 'bool' }],
  },
];

export function parseSequence(input: string): {
  steps: SequenceStep[];
  unsupported: boolean;
} {
  const trimmed = (input ?? '').trim();
  if (trimmed === '') return { steps: [], unsupported: false };

  const steps: SequenceStep[] = [];
  for (const raw of splitTopLevel(trimmed, ';')) {
    const piece = raw.trim();
    if (!piece) continue;
    const step = parseStep(piece);
    if (!step) return { steps: [], unsupported: true };
    steps.push(step);
  }
  return { steps, unsupported: false };
}

export function serializeSequence(steps: SequenceStep[]): string {
  return steps.map(serializeStep).join('; ');
}

function serializeStep(step: SequenceStep): string {
  const prefix = step.delay > 0 ? `@${step.delay} ` : '';
  return `${prefix}${step.name}(${step.args.map(serializeArg).join(', ')})`;
}

function serializeArg(arg: SequenceArgValue): string {
  if (arg.kind === 'bool') return arg.value ? 'true' : 'false';
  if (arg.kind === 'number') return String(arg.value);
  return `"${arg.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function parseStep(s: string): SequenceStep | null {
  let working = s.trim();
  let delay = 0;
  const delayMatch = working.match(/^@(-?\d+(?:\.\d+)?)\s+/);
  if (delayMatch) {
    delay = parseFloat(delayMatch[1]);
    working = working.slice(delayMatch[0].length).trim();
  }
  const m = working.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(([^]*)\)\s*$/);
  if (!m) return null;
  const name = m[1];
  const argsStr = m[2].trim();
  const args: SequenceArgValue[] = [];
  if (argsStr) {
    for (const piece of splitTopLevel(argsStr, ',')) {
      const arg = parseArg(piece.trim());
      if (!arg) return null;
      args.push(arg);
    }
  }
  return { delay, name, args };
}

function parseArg(s: string): SequenceArgValue | null {
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

export function defaultSequenceArgFor(kind: SequenceArgKind): SequenceArgValue {
  if (kind === 'number') return { kind: 'number', value: 0 };
  if (kind === 'bool') return { kind: 'bool', value: true };
  return { kind: 'string', value: '' };
}
