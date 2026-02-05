import { useAppManager, useHead } from '#imports';
import type { MaybeFalsy, MergeHead, ReactiveHead, UseHeadInput, UseHeadOptions } from '@unhead/vue';
import DesktopUiManager from '../logic/managers/DesktopUiManager';

export function usePageHead<T extends MergeHead>(
  input: UseHeadInput<T>,
  options?: UseHeadOptions,
) {
  const appManager = useAppManager();
  let tabController = appManager.get(DesktopUiManager).tabController;

  let res_input: MaybeFalsy<ReactiveHead> = input as MaybeFalsy<ReactiveHead>;
  if (typeof input === 'function') {
    res_input = input();
  }
  useHead(res_input, options);
  if (res_input && typeof res_input !== 'boolean' && res_input.title !== undefined ){
    tabController.updateCurrentTabTitle((res_input.title?.toString() ?? '').split('|')[0].trim());
  }
}
