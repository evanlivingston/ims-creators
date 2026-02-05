import 'mxgraph/javascript/src/css/common.css';
import '@typed-mxgraph/typed-mxgraph';
import type { mxGraphExportObject } from 'mxgraph';
import { v4 as uuidv4 } from 'uuid';

declare global {
  interface Window {
    mxBasePath: string;
    mxLoadResources: boolean;
    mxForceIncludes: boolean;
    mxLoadStylesheets: boolean;
    mxResourceExtension: string;
    mxInitRef:
      | Promise<{
          mx: mxGraphExportObject;
        }>
      | undefined;
  }
}

export function initMxGraphClientSide(): Promise<{
  mx: mxGraphExportObject;
}> {
  if (!window.mxInitRef) {
    window.mxInitRef = Promise.resolve().then(async () => {
      const factoryDep = await import('mxgraph');

      window.mxBasePath = '/app/mxgraph';
      window.mxLoadResources = true;
      window.mxForceIncludes = false;
      window.mxLoadStylesheets = true;
      window.mxResourceExtension = '.txt';

      const mx = factoryDep.default();

      // Overridden to define per-shape connection points
      mx.mxGraph.prototype.getAllConnectionConstraints = function (
        terminal,
        _source,
      ) {
        if (terminal != null && terminal.shape != null) {
          if (terminal.shape.stencil != null) {
            if (terminal.shape.stencil.constraints != null) {
              return terminal.shape.stencil.constraints;
            }
          } else if (terminal.shape.constraints != null) {
            return terminal.shape.constraints;
          }
        }

        return [];
      };

      // Defines the default constraints for all shapes
      mx.mxShape.prototype.constraints = [
        new mx.mxConnectionConstraint(new mx.mxPoint(0.25, 0), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(0.5, 0), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(0.75, 0), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(0, 0.25), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(0, 0.5), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(0, 0.75), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(1, 0.25), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(1, 0.5), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(1, 0.75), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(0.25, 1), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(0.5, 1), true),
        new mx.mxConnectionConstraint(new mx.mxPoint(0.75, 1), true),
      ];

      // Edges have no connection points
      mx.mxPolyline.prototype.constraints = [];

      const initShapes = (await import('./Shapes')).default;
      initShapes(mx);

      const mxTooltipHandler_original_init = mx.mxTooltipHandler.prototype.init;
      mx.mxTooltipHandler.prototype.init = function () {
        mxTooltipHandler_original_init.call(this);
        if ((this as any).div) {
          (this as any).div.classList.add('ImcDiagramTooltip');
        }
      };

      mx.mxGraphModel.prototype.createId = () => {
        return uuidv4();
      };

      return {
        mx,
      };
    });
  }
  return window.mxInitRef;
}
