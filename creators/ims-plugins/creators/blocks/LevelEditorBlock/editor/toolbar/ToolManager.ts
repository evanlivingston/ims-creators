import type { Canvas } from 'fabric';
import type Tool from './tools/base/Tool';
import { assert } from '~ims-app-base/logic/utils/typeUtils';

export type ToolSection =
  | 'draw'
  | 'layers'
  | 'lock'
  | 'view'
  | 'group'
  | 'shapeEdit';

export default class ToolManager {
  readonly canvas: Canvas;

  readonly tools: Map<string, Tool> = new Map();

  private _activeTools: Set<Tool> = new Set();

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  register<T extends Tool>(tool: T) {
    if (tool.isDefaultInGroup && tool.exclusiveGroup) {
      const existingDefault = Array.from(this.tools.values()).find(
        (t) => t.exclusiveGroup === tool.exclusiveGroup && t.isDefaultInGroup,
      );
      if (existingDefault) {
        throw new Error(
          `Group "${tool.exclusiveGroup}" already has default tool "${existingDefault.name}"`,
        );
      }
    }
    this.tools.set(tool.name, tool);
    return this.tools.get(tool.name); // берется из мапы чтобы получить реактивный
  }
  async triggerTool(name: string) {
    const tool = this.tools.get(name);
    assert(tool, `Tool "${name}" isn't registered`);

    if (tool.exclusiveGroup) {
      const active_in_group = Array.from(this._activeTools).filter(
        (t) => t.exclusiveGroup === tool.exclusiveGroup,
      );
      for (const active_exclusive_tool of active_in_group) {
        active_exclusive_tool.deactivate();
      }
    }

    this._activeTools.add(tool);
    tool.activate(() => {
      this._deactivateTool(tool);
    });
  }

  private _deactivateTool(tool: Tool) {
    this._activeTools.delete(tool);

    if (tool.exclusiveGroup) {
      const active_in_group = Array.from(this._activeTools).filter(
        (t) => t.exclusiveGroup === tool.exclusiveGroup,
      );
      if (active_in_group.length === 0) {
        const fallback_tool = Array.from(this.tools.values()).find(
          (t) => t.exclusiveGroup === tool.exclusiveGroup && t.isDefaultInGroup,
        );
        if (fallback_tool && fallback_tool.name !== tool.name) {
          fallback_tool.activate(() => {
            this._deactivateTool(fallback_tool);
          });
          this._activeTools.add(fallback_tool);
        }
      }
    }
  }

  getTool(name: string) {
    return this.tools.get(name);
  }

  isToolActive(tool: Tool) {
    return this._activeTools.has(tool);
  }

  getTools() {
    return Array.from(this.tools.values());
  }
}
