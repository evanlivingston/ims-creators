import type { ToolSection } from '../ToolManager';
import Tool from './base/Tool';

export default class PencilTool extends Tool {
  name = 'pencil';
  icon = 'ri-pencil-line';
  section: ToolSection = 'draw';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;
}
