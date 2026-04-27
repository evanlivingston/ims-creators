import { castAssetPropValueToString } from '~ims-app-base/logic/types/Props';
import type { ScriptPlayContext } from './ScriptPlayContext';
import type { ScriptPlayNode } from './ScriptPlayNode';

export function playNodeExecuteBranch(
  context: ScriptPlayContext,
  node: ScriptPlayNode,
  _choice: number | null,
): string | null {
  if (!node.options) {
    return node.next ?? null;
  }
  const value = node.values?.condition ?? false;
  if (value) {
    return node.options[0]?.next ?? null;
  } else {
    return node.options[1]?.next ?? null;
  }
}

export function playNodeExecuteChance(
  context: ScriptPlayContext,
  node: ScriptPlayNode,
  _choice: number | null,
): string | null {
  if (!node.options || node.options.length === 0) {
    return node.next ?? null;
  }
  const weights = node.options.map(
    (opt) => Number(opt.values?.weight) || 1,
  );
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < node.options.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return node.options[i].next ?? null;
    }
  }
  return node.options[node.options.length - 1].next ?? null;
}

export function playNodeExecuteTimer(
  _context: ScriptPlayContext,
  node: ScriptPlayNode,
  _choice: number | null,
): string | null {
  return node.next ?? null;
}

export function playNodeExecuteSetVar(
  context: ScriptPlayContext,
  node: ScriptPlayNode,
  _choice: number | null,
): string | null {
  const variable = castAssetPropValueToString(node.values?.variable ?? null);
  context.variables.set(variable, node.values?.value ?? null);
  return node.next ?? null;
}
