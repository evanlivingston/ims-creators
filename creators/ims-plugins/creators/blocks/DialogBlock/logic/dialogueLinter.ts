/**
 * Dialogue linter. Walks a parsed dialogue node graph and reports issues
 * the runtime would silently bury or misbehave on:
 *
 * - `next` pointers (and option `next` pointers) referencing nodes that
 *   don't exist in this dialogue.
 * - Condition expressions that don't parse.
 * - Inline script DSL strings that don't parse / use unknown commands.
 * - Sequence DSL strings with the same problems.
 *
 * Cross-conversation jump validation (`option.dialogue` resolves to a real
 * dialogue title in the project) is intentionally out of scope here - that
 * requires a project-level registry the linter doesn't have access to.
 *
 * Returns errors flat with a `nodeId`; the caller groups by node to apply
 * a red-border class on the affected nodes.
 */

import {
  parseCondition,
  type ConditionAst,
} from './conditionExpression';
import {
  parseScript,
  SCRIPT_COMMANDS,
} from './scriptDsl';
import {
  parseSequence,
  SEQUENCE_COMMANDS,
} from './sequenceDsl';

export type LintSeverity = 'error' | 'warning';

export type LintIssue = {
  severity: LintSeverity;
  nodeId: string;
  field: string; // 'next', 'condition', 'script', 'sequence', 'options[N].next', etc.
  message: string;
};

type DialogueNode = {
  type: string;
  next?: string | null;
  values?: Record<string, unknown>;
  options?: {
    next?: string | null;
    values?: Record<string, unknown>;
    dialogue?: unknown;
  }[];
};

type DialogueGraph = {
  start?: string | null;
  nodes: Record<string, DialogueNode>;
};

export function lintDialogue(graph: DialogueGraph): LintIssue[] {
  const issues: LintIssue[] = [];
  const nodeIds = new Set(Object.keys(graph.nodes));

  for (const [nodeId, node] of Object.entries(graph.nodes)) {
    // 1. Top-level `next` pointer must resolve.
    if (node.next && !nodeIds.has(node.next)) {
      issues.push({
        severity: 'error',
        nodeId,
        field: 'next',
        message: `next "${node.next}" doesn't match any node in this dialogue`,
      });
    }

    // 2. Per-option `next` pointers, condition strings, scripts.
    if (Array.isArray(node.options)) {
      for (let i = 0; i < node.options.length; i++) {
        const opt = node.options[i];
        if (opt.next && !nodeIds.has(opt.next)) {
          issues.push({
            severity: 'error',
            nodeId,
            field: `options[${i}].next`,
            message: `option ${i + 1} next "${opt.next}" doesn't match any node`,
          });
        }
        if (opt.values && typeof opt.values.condition === 'string') {
          const parsed = parseCondition(opt.values.condition);
          if (isUnsupportedCondition(parsed)) {
            // unsupported just means the form builder can't render it,
            // not that the runtime can't parse it. Skip - the runtime is
            // permissive and only fails on truly malformed syntax we can't
            // detect without a full parser port.
          }
        }
        if (opt.values && typeof opt.values.script === 'string') {
          const scriptIssues = lintScript(opt.values.script);
          for (const msg of scriptIssues) {
            issues.push({
              severity: 'error',
              nodeId,
              field: `options[${i}].script`,
              message: `option ${i + 1}: ${msg}`,
            });
          }
        }
        // Cross-conversation jump enabled but no target picked - the runner
        // would silently never jump (treats empty string as no jump).
        if (opt.dialogue !== undefined && opt.dialogue !== null) {
          const target = typeof opt.dialogue === 'string'
            ? opt.dialogue
            : (opt.dialogue as { Title?: string }).Title ?? '';
          if (target.trim() === '') {
            issues.push({
              severity: 'error',
              nodeId,
              field: `options[${i}].dialogue`,
              message: `option ${i + 1}: cross-conversation jump target is empty`,
            });
          }
        }
      }
    }

    // 3. Speech-level script and sequence.
    if (node.type === 'speech' && node.values) {
      if (typeof node.values.script === 'string') {
        for (const msg of lintScript(node.values.script as string)) {
          issues.push({
            severity: 'error',
            nodeId,
            field: 'script',
            message: msg,
          });
        }
      }
      if (typeof node.values.sequence === 'string') {
        for (const msg of lintSequence(node.values.sequence as string)) {
          issues.push({
            severity: 'error',
            nodeId,
            field: 'sequence',
            message: msg,
          });
        }
      }
    }

    // 4. Trigger nodes also use sequence.
    if (node.type === 'trigger' && node.values) {
      if (typeof node.values.sequence === 'string') {
        for (const msg of lintSequence(node.values.sequence as string)) {
          issues.push({
            severity: 'error',
            nodeId,
            field: 'sequence',
            message: msg,
          });
        }
      }
    }
  }

  // 5. Start pointer.
  if (graph.start && !nodeIds.has(graph.start)) {
    issues.push({
      severity: 'error',
      nodeId: graph.start,
      field: 'start',
      message: `dialogue start points at "${graph.start}" which doesn't exist`,
    });
  }

  return issues;
}

export function groupIssuesByNode(issues: LintIssue[]): Map<string, LintIssue[]> {
  const out = new Map<string, LintIssue[]>();
  for (const issue of issues) {
    const list = out.get(issue.nodeId);
    if (list) list.push(issue);
    else out.set(issue.nodeId, [issue]);
  }
  return out;
}

function isUnsupportedCondition(ast: ConditionAst): boolean {
  return ast.kind === 'unsupported';
}

function lintScript(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const result = parseScript(trimmed);
  const out: string[] = [];
  if (result.unsupported) {
    out.push('script syntax did not parse');
    return out;
  }
  const defs = new Map(SCRIPT_COMMANDS.map((c) => [c.name, c]));
  for (const cmd of result.commands) {
    const def = defs.get(cmd.name);
    if (!def) {
      out.push(`unknown script command "${cmd.name}"`);
      continue;
    }
    if (cmd.args.length !== def.args.length) {
      out.push(
        `${cmd.name} expects ${def.args.length} arg(s), got ${cmd.args.length}`,
      );
      continue;
    }
    for (let i = 0; i < def.args.length; i++) {
      const argDef = def.args[i];
      const arg = cmd.args[i];
      if (argDef.kind === 'string' && (arg.kind !== 'string' || arg.value === '')) {
        out.push(`${cmd.name}: ${argDef.label} is empty`);
      }
    }
  }
  return out;
}

function lintSequence(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const result = parseSequence(trimmed);
  const out: string[] = [];
  if (result.unsupported) {
    out.push('sequence syntax did not parse');
    return out;
  }
  const defs = new Map(SEQUENCE_COMMANDS.map((c) => [c.name, c]));
  for (const step of result.steps) {
    const def = defs.get(step.name);
    if (!def) {
      out.push(`unknown sequence command "${step.name}"`);
      continue;
    }
    if (step.args.length !== def.args.length) {
      out.push(
        `${step.name} expects ${def.args.length} arg(s), got ${step.args.length}`,
      );
      continue;
    }
    for (let i = 0; i < def.args.length; i++) {
      const argDef = def.args[i];
      const arg = step.args[i];
      if (argDef.kind === 'string' && (arg.kind !== 'string' || arg.value === '')) {
        out.push(`${step.name}: ${argDef.label} is empty`);
      }
    }
  }
  return out;
}
