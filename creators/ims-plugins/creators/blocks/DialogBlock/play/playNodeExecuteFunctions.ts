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

export function playNodeExecuteSetVar(
  context: ScriptPlayContext,
  node: ScriptPlayNode,
  _choice: number | null,
): string | null {
  const variable = castAssetPropValueToString(node.values?.variable ?? null);
  context.variables.set(variable, node.values?.value ?? null);
  return node.next ?? null;
}
