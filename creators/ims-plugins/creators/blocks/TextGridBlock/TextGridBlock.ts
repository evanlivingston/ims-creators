import type { AssetPropValue } from '~ims-app-base/logic/types/Props';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';
import {
  type ExtractedEntriesForBlock,
  extractEntriesForBlock,
} from '~ims-app-base/components/Asset/Editor/extractEntriesForBlock';

export type TextGridItem = {
  key: string;
  content: AssetPropValue;
  inherited: boolean;
  index: number;
};

export type TextGridBlockExtractedEntries =
  ExtractedEntriesForBlock<TextGridItem>;

export function extractTextGridBlockEntries(
  block: ResolvedAssetBlock,
): TextGridBlockExtractedEntries {
  return extractEntriesForBlock(
    block,
    (props, base_entry) => {
      return {
        ...base_entry,
        content: props.content,
      };
    },
    ['columns'],
  );
}
