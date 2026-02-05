import type { Component } from 'vue';
import type {
  AssetPropValue,
  AssetPropValueType,
} from '~ims-app-base/logic/types/Props';
import type { NodeData } from '../editor/NodeDataController';
import type { ScriptPlayNode } from '../play/ScriptPlayNode';
import type { ScriptPlayContext } from '../play/ScriptPlayContext';

export enum NodeType {
  EXEC_START = 'exec-start',
  EXEC_END = 'exec-end',
  EXEC = 'exec',
  DATA = 'data',
  DATA_START = 'data-start',
}

export type NodeDescriptor = {
  name: string;
  icon: string;
  node: Component;
  params?: any;
  color: string;
  type: NodeType;
  dataInTypes?: AssetPropValueType[] | null;
  dataOutTypes?: AssetPropValueType[] | null;
  initData?: () => NodeData;
  playDataCompute?: (
    context: ScriptPlayContext,
    playNode: ScriptPlayNode,
    param: string,
  ) => AssetPropValue;
  playNodeExecute?: (
    context: ScriptPlayContext,
    playNode: ScriptPlayNode,
    choice: number | null,
  ) => string | null;
};
