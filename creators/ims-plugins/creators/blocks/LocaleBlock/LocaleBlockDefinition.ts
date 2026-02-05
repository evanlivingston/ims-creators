import { BlockTypeDefinition } from '~ims-app-base/logic/types/BlockTypeDefinition';

export class LocaleBlockDefinition extends BlockTypeDefinition {
  name = 'locale';
  component = async () => (await import('./LocaleBlock.vue')).default;
  icon = 'table-2';

  override hideInAdding = true;
}
