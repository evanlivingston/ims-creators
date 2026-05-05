import type {
  AssetPropValue,
  AssetPropValueType,
} from '~ims-app-base/logic/types/Props';
import type { DialogVariable } from '../editor/DialogBlockController';

export type ScriptBlockPlainPropValueBind = { get: string; param: string };

export type ScriptBlockPlainPropValue =
  | AssetPropValue
  | ScriptBlockPlainPropValueBind;

export type ScriptBlockPlainProps = {
  [prop: string]: ScriptBlockPlainPropValue;
};

export type ScriptBlockPlainVariable = {
  name: string;
  title: string;
  type: AssetPropValueType | null;
  description: string | null;
  default: AssetPropValue;
  autoFill?: boolean;
  index?: number;
};

export type ScriptBlockPlainNode = {
  type: string;
  subject?: string;
  values?: ScriptBlockPlainProps;
  next?: string | null;
  options?: {
    values?: ScriptBlockPlainProps;
    next: string | null;
    // Cross-conversation jump target. May be a plain title string or an
    // AssetPropValueAsset reference; the web save layer flattens to Title.
    dialogue?: ScriptBlockPlainPropValue | null;
  }[];
  params?: {
    in: ScriptBlockPlainVariable[];
    out: ScriptBlockPlainVariable[];
  };
  pos: {
    x: number;
    y: number;
  };
  index: number;
};

export type ScriptBlockPlain = {
  start: string | null;
  nodes: {
    [id: string]: ScriptBlockPlainNode;
  };
  variables: {
    own: {
      [name: string]: ScriptBlockPlainVariable;
    };
  };
  __settings: {
    speech: {
      main: {
        [name: string]: DialogVariable;
      };
      option: {
        [name: string]: DialogVariable;
      };
    };
  };
};
