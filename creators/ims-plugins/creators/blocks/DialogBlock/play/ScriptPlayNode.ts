import type { AssetPropValue } from '~ims-app-base/logic/types/Props';
import type { ScriptBlockPlainVariable } from '../logic/nodeStoring';

export type ScriptPlayNodeProps = {
  [prop: string]: AssetPropValue;
};

export type ScriptPlayNode = {
  id: string;
  type: string;
  subject?: string;
  values?: ScriptPlayNodeProps;
  next?: string | null;
  options?: {
    values?: ScriptPlayNodeProps;
    next: string | null;
  }[];
  params?: {
    in: ScriptBlockPlainVariable[];
    out: ScriptBlockPlainVariable[];
  };
};
