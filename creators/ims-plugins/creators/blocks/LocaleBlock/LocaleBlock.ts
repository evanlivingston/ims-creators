import { md5 } from 'hash-wasm';
import {
  convertAssetPropsToPlainObject,
  type AssetPropValue,
} from '~ims-app-base/logic/types/Props';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';

export type LocaleBlockLocaleField = {
  title: string;
  propKey: string;
  localeKey: string;
  originalValue: AssetPropValue;
  originalValueHash: string;
  type: string;
};

export type LocalBlockLocaleStatus = 'new' | 'changed' | 'needReview' | 'done';

export type LocaleBlockStateLocale = {
  [locale: string]: { [key: string]: AssetPropValue };
};

export type LocaleBlockStateMetaObjectStatus = {
  hash: string;
  checked: boolean;
};

export type LocaleBlockStateMetaObject = {
  key: string;
  locales: { [locale: string]: LocaleBlockStateMetaObjectStatus };
};

export type LocaleBlockStateMeta = {
  [key: string]: LocaleBlockStateMetaObject;
};
export type LocaleBlockState = {
  [locale: string]: { [key: string]: AssetPropValue };
} & {
  __meta: LocaleBlockStateMeta;
};

export function extractLocaleState(block: ResolvedAssetBlock) {
  const val = convertAssetPropsToPlainObject<LocaleBlockState>(block.computed);
  if (!val.__meta) {
    val.__meta = {};
  }
  for (const [key, meta] of Object.entries(val.__meta)) {
    if (!meta.locales) meta.locales = {};
    if (!meta.key) meta.key = key;
  }
  return val;
}

export async function localeMd5AssetPropValue(val: AssetPropValue) {
  if (val === null) return '';
  else if (typeof val === 'string') return await md5(val);
  else return await md5(JSON.stringify(val));
}
