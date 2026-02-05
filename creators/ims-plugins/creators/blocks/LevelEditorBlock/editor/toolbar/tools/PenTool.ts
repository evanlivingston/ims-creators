import type { ToolSection } from '../ToolManager';
import Tool from './base/Tool';

export default class PenTool extends Tool {
  name = 'pen';
  icon = 'ri-pen-nib-line';
  section: ToolSection = 'draw';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;
}
