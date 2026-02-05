import { BlockTypeDefinition } from '~ims-app-base/logic/types/BlockTypeDefinition';

export class DiagramBlockDefinition extends BlockTypeDefinition {
  name = 'diagram';
  component = async () => (await import('./DiagramBlock.vue')).default;
  icon = 'organization-chart';
  override resizableBlockHeight = true;
}
