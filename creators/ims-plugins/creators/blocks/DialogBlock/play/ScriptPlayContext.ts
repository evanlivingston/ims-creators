import type { AssetPropValue } from '~ims-app-base/logic/types/Props';
import type { ScriptPlayNode } from './ScriptPlayNode';

export type ScriptPlayContext = {
  variables: Map<string, AssetPropValue>;
  nodeParams: Map<string, AssetPropValue>;
  currentNode: ScriptPlayNode | null;
  ended: boolean;
};

export function createScriptPlayContext(): ScriptPlayContext {
  return {
    variables: new Map(),
    nodeParams: new Map(),
    currentNode: null,
    ended: false,
  };
}

export function cloneScriptPlayContext(
  original: ScriptPlayContext,
): ScriptPlayContext {
  return {
    variables: new Map(original.variables.entries()),
    nodeParams: new Map(original.nodeParams.entries()),
    currentNode: original.currentNode,
    ended: original.ended,
  };
}

export function getScriptPlayContextNodeParam(
  context: ScriptPlayContext,
  node_id: string,
  param: string,
): AssetPropValue {
  return context.nodeParams.get(node_id + '-' + param) ?? null;
}

export function setScriptPlayContextNodeParam(
  context: ScriptPlayContext,
  node_id: string,
  param: string,
  value: AssetPropValue,
): void {
  context.nodeParams.set(node_id + '-' + param, value);
}
