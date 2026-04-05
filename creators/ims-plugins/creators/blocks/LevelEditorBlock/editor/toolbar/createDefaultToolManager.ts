import type { Canvas } from 'fabric';
import ToolManager from './ToolManager';
import SelectTool from './tools/SelectTool';
import RectTool from './tools/RectTool';
import EllipseTool from './tools/EllipseTool';
// import PencilTool from './tools/PencilTool';
// import PenTool from './tools/PenTool';
import PolygonTool from './tools/PolygonTool';
// import ZoomTool from './tools/ZoomTool';
import { reactive } from 'vue';
import BringToFrontTool from './tools/BringToFrontTool';
import BringForwardTool from './tools/BringForwardTool';
import SendBackwardTool from './tools/SendBackwardTool';
import SendToBackTool from './tools/SendToBackTool';
import ImageTool from './tools/ImageTool';
import PointerTool from './tools/PointerTool';
import type LevelEditorCanvasController from '../LevelEditorCanvasController';
// import LockTool from './tools/LockTool';
import UnlockAllTool from './tools/UnlockAllTool';
import ViewAllTool from './tools/ViewAllTool';
// import SelectColorPresetTool from './tools/SelectColorPresetTool';
// import SelectStrokeColorTool from './tools/SelectStrokeColorTool';
// import SelectFillColorTool from './tools/SelectFillColorTool';
import TextTool from './tools/TextTool';
import GroupTool from './tools/GroupTool';
import UngroupTool from './tools/UngroupTool';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';

export default function createDefaultToolManager(
  canvas: Canvas,
  projectContext: IProjectContext,
  controller: LevelEditorCanvasController,
) {
  const raw_controller = controller;
  const manager = reactive(new ToolManager(canvas));

  const tools = [
    new SelectTool(projectContext, raw_controller),
    new RectTool(projectContext, raw_controller),
    new EllipseTool(projectContext, raw_controller),
    new PolygonTool(projectContext, raw_controller),
    // new PencilTool(projectContext, controller),
    // new PenTool(projectContext, controller),
    new ImageTool(projectContext, raw_controller),
    new PointerTool(projectContext, raw_controller),
    new TextTool(projectContext, raw_controller),
    // new ZoomTool(projectContext, controller),
    new BringToFrontTool(projectContext, raw_controller),
    new BringForwardTool(projectContext, raw_controller),
    new SendBackwardTool(projectContext, raw_controller),
    new SendToBackTool(projectContext, raw_controller),
    new GroupTool(projectContext, raw_controller),
    new UngroupTool(projectContext, raw_controller),

    // new LockTool(projectContext, raw_controller),
    new UnlockAllTool(projectContext, raw_controller),
    new ViewAllTool(projectContext, raw_controller),
    // new SelectColorPresetTool(projectContext, raw_controller),
    // new SelectFillColorTool(projectContext, raw_controller),
    // new SelectStrokeColorTool(projectContext, raw_controller),
  ];

  for (const tool of tools) {
    const reactive_tool = manager.register(tool);
    if (reactive_tool) reactive_tool.init();
  }

  return manager;
}
