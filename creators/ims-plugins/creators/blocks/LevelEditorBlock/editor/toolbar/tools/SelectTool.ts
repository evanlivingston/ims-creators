import type { ToolSection } from '../ToolManager';
import Tool from './base/Tool';

export default class SelectTool extends Tool {
  name = 'select';
  icon = 'ri-cursor-line';
  section: ToolSection = 'draw';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;

  override isDefaultInGroup: boolean = true;
  override exclusiveGroup: string = 'drawing';
}
