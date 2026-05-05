/**
 * Round-trip parser for the dialogue runner's condition expression syntax.
 *
 * The runner (Scripts/dialogue_expression.gd) accepts strings like:
 *   met_guard == true and FactionRep("kalpin") > 0.3
 *   not HasItem("cigarettes") or DayNumber() >= 5
 *
 * For non-technical writers, the editor renders this as a list of clauses
 * joined by AND, each clause built from picker dropdowns. This module turns
 * a string into structured form (best effort) and back.
 *
 * Supported in the structured representation:
 *   - Comma-separated AND clauses at the top level
 *   - Each clause is either:
 *     - A bare identifier (truthy check)
 *     - A function call as a truthy check
 *     - A binary comparison: <left> <op> <right>
 *   - Operators: ==, !=, >, <, >=, <=
 *   - Negation (`not`/`!`) wraps a clause
 *   - Literals: bool, number, string (double-quoted)
 *
 * Anything more complex (OR, parentheses, mixed precedence) falls back
 * to free-form text mode in the UI.
 */

export type ConditionLiteral =
  | { kind: 'bool'; value: boolean }
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string };

export type ConditionTerm =
  | { kind: 'identifier'; name: string }
  | { kind: 'function'; name: string; args: ConditionLiteral[] };

export type ConditionClause = {
  negated: boolean;
  left: ConditionTerm;
  // op + right are absent for a bare truthy check
  op?: '==' | '!=' | '>' | '<' | '>=' | '<=';
  right?: ConditionLiteral;
};

export type ConditionAst =
  | { kind: 'and-list'; clauses: ConditionClause[] }
  | { kind: 'unsupported'; raw: string };

const OPS = ['>=', '<=', '==', '!=', '>', '<'] as const;

export function parseCondition(input: string): ConditionAst {
  const trimmed = (input ?? '').trim();
  if (trimmed === '') return { kind: 'and-list', clauses: [] };

  // The dialogue runner supports `or` and parentheses; the form mode does not.
  // If the string contains either at the top level, render text mode instead.
  if (containsTopLevelOr(trimmed) || containsParens(trimmed)) {
    return { kind: 'unsupported', raw: trimmed };
  }

  const partStrings = splitTopLevelAnd(trimmed);
  const clauses: ConditionClause[] = [];
  for (const part of partStrings) {
    const clause = parseClause(part.trim());
    if (!clause) return { kind: 'unsupported', raw: trimmed };
    clauses.push(clause);
  }
  return { kind: 'and-list', clauses };
}

export function serializeCondition(ast: ConditionAst): string {
  if (ast.kind === 'unsupported') return ast.raw;
  return ast.clauses.map(serializeClause).join(' and ');
}

export function serializeClause(clause: ConditionClause): string {
  const lhs = serializeTerm(clause.left);
  const negated = clause.negated ? 'not ' : '';
  if (!clause.op) return `${negated}${lhs}`;
  return `${negated}${lhs} ${clause.op} ${serializeLiteral(clause.right!)}`;
}

function serializeTerm(term: ConditionTerm): string {
  if (term.kind === 'identifier') return term.name;
  return `${term.name}(${term.args.map(serializeLiteral).join(', ')})`;
}

function serializeLiteral(lit: ConditionLiteral): string {
  if (lit.kind === 'bool') return lit.value ? 'true' : 'false';
  if (lit.kind === 'number') return String(lit.value);
  return `"${lit.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function containsTopLevelOr(s: string): boolean {
  return /(^|\s)or(\s|$)/i.test(s);
}

function containsParens(s: string): boolean {
  // Allow parens inside string literals; only flag bare ones at the top level.
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '(' || c === ')') {
      // A function call like Foo(bar) is fine, only bare grouping parens
      // around top-level expressions trigger fallback. Approximate by
      // checking whether the `(` is immediately preceded by an identifier.
      if (c === '(') {
        const prev = i > 0 ? s[i - 1] : '';
        if (!/[A-Za-z0-9_]/.test(prev)) return true;
        depth++;
      } else {
        depth--;
      }
    }
  }
  return depth !== 0;
}

function splitTopLevelAnd(s: string): string[] {
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
    if (c === '(') {
      parenDepth++;
      buf += c;
      continue;
    }
    if (c === ')') {
      parenDepth--;
      buf += c;
      continue;
    }
    if (parenDepth === 0 && i + 4 < s.length) {
      const ahead = s.slice(i, i + 5);
      if (/^\s+and\s/i.test(s.slice(i, i + 5)) || /^\sand\s/i.test(s.slice(i, i + 5))) {
        // Simpler check: look back/forward for word boundaries
      }
    }
    buf += c;
  }
  // Use a regex-based split as a clearer fallback. The hand-written walker
  // above tracks string/paren state to avoid splitting inside them, but the
  // split itself is easier to express as a loop over keyword positions.
  return splitByKeyword(buf, 'and');
}

function splitByKeyword(s: string, keyword: string): string[] {
  const out: string[] = [];
  const pattern = new RegExp(`\\s+${keyword}\\s+`, 'gi');
  let last = 0;
  let inStr = false;
  let parenDepth = 0;
  // Walk character-by-character to find safe split points.
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\' && i + 1 < s.length) i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '(') parenDepth++;
    else if (c === ')') parenDepth--;
    else if (parenDepth === 0 && /\s/.test(c)) {
      const tail = s.slice(i);
      const m = tail.match(new RegExp(`^\\s+${keyword}\\s+`, 'i'));
      if (m) {
        out.push(s.slice(last, i));
        last = i + m[0].length;
        i = last - 1;
      }
    }
  }
  out.push(s.slice(last));
  pattern.lastIndex = 0;
  return out.map((p) => p.trim()).filter(Boolean);
}

function parseClause(s: string): ConditionClause | null {
  let working = s.trim();
  let negated = false;
  if (/^not\s/i.test(working)) {
    negated = true;
    working = working.slice(4).trim();
  } else if (working.startsWith('!')) {
    negated = true;
    working = working.slice(1).trim();
  }
  if (!working) return null;

  // Find the first top-level operator (outside strings and parens)
  const opLoc = findTopLevelOp(working);
  if (!opLoc) {
    // No operator -> bare truthy check (identifier or function call)
    const term = parseTerm(working);
    if (!term) return null;
    return { negated, left: term };
  }

  const left = parseTerm(working.slice(0, opLoc.start).trim());
  const right = parseLiteral(working.slice(opLoc.end).trim());
  if (!left || !right) return null;
  return { negated, left, op: opLoc.op, right };
}

function findTopLevelOp(
  s: string,
): { op: ConditionClause['op']; start: number; end: number } | null {
  let inStr = false;
  let parenDepth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\' && i + 1 < s.length) i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '(') parenDepth++;
    else if (c === ')') parenDepth--;
    else if (parenDepth === 0) {
      for (const op of OPS) {
        if (s.slice(i, i + op.length) === op) {
          return { op: op as ConditionClause['op'], start: i, end: i + op.length };
        }
      }
    }
  }
  return null;
}

function parseTerm(s: string): ConditionTerm | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  // Function call: Name(args...)
  const callMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(([^]*)\)\s*$/);
  if (callMatch) {
    const name = callMatch[1];
    const argsStr = callMatch[2].trim();
    const args: ConditionLiteral[] = [];
    if (argsStr) {
      for (const piece of splitArgs(argsStr)) {
        const lit = parseLiteral(piece.trim());
        if (!lit) return null;
        args.push(lit);
      }
    }
    return { kind: 'function', name, args };
  }
  // Bare identifier
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
    return { kind: 'identifier', name: trimmed };
  }
  return null;
}

function parseLiteral(s: string): ConditionLiteral | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  if (trimmed === 'true') return { kind: 'bool', value: true };
  if (trimmed === 'false') return { kind: 'bool', value: false };
  if (trimmed.startsWith('"')) {
    if (trimmed.length < 2 || !trimmed.endsWith('"')) return null;
    const inner = trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return { kind: 'string', value: inner };
  }
  // Number (allow negative + decimals)
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { kind: 'number', value: parseFloat(trimmed) };
  }
  return null;
}

function splitArgs(s: string): string[] {
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
    if (c === ',' && parenDepth === 0) {
      out.push(buf);
      buf = '';
      continue;
    }
    buf += c;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/**
 * Built-in condition functions the dialogue runner registers.
 * Used by ConditionBuilder to populate the function picker dropdown
 * and provide argument hints.
 */
export type ConditionFunction = {
  name: string;
  description: string;
  args: { label: string; kind: 'string' | 'number' }[];
  /** What this function returns - drives operator choices in the UI. */
  returnKind: 'bool' | 'number';
};

export const CONDITION_FUNCTIONS: ConditionFunction[] = [
  {
    name: 'HasItem',
    description: 'True if the player inventory contains an item by id or title.',
    args: [{ label: 'Item id or title', kind: 'string' }],
    returnKind: 'bool',
  },
  {
    name: 'IsInCamp',
    description: 'True if the player is currently in the camp scene.',
    args: [],
    returnKind: 'bool',
  },
  {
    name: 'HasTask',
    description: 'True if the player has the given task active.',
    args: [{ label: 'Task id', kind: 'string' }],
    returnKind: 'bool',
  },
  {
    name: 'FactionRep',
    description: 'Reputation with the named faction (-1.0 to 1.0).',
    args: [{ label: 'Faction id', kind: 'string' }],
    returnKind: 'number',
  },
  {
    name: 'NPCRelationship',
    description: 'Relationship score with the named NPC (-1.0 to 1.0).',
    args: [{ label: 'NPC name', kind: 'string' }],
    returnKind: 'number',
  },
  {
    name: 'DayNumber',
    description: 'Current in-game day number.',
    args: [],
    returnKind: 'number',
  },
  {
    name: 'RestartCount',
    description: 'How many times the player has died and restarted.',
    args: [],
    returnKind: 'number',
  },
  {
    name: 'LanguageProf',
    description: 'Player proficiency with the named language (0.0 to 1.0).',
    args: [{ label: 'Language id', kind: 'string' }],
    returnKind: 'number',
  },
];
