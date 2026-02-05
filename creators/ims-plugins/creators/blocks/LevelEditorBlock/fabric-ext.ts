import * as fabric from 'fabric';
import type DecorationLabel from './canvas/DecorationLabel';

declare module 'fabric' {
  interface FabricObject {
    id: string;
    index: number;
    decorationObject?: DecorationLabel;
    parentId?: string;
    __renderedIndex?: number;
    __isTemp: boolean;
  }

  interface SerializedObjectProps {
    id: string;
    index: number;
    decorationObject?: DecorationLabel;
    parentId?: string;
    __renderedIndex?: number;
    __isTemp: boolean;
  }

  interface CanvasEvents {
    'shape:content-changed': Partial<fabric.TEvent> & {
      target: fabric.FabricObject;
    };
  }
}

fabric.FabricObject.customProperties = ['id'];
