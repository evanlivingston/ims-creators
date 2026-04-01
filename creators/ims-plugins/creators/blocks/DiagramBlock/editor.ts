import type { ImcDiagramInterface } from './ImcDiagramInterface';
import { createImcCellEditor } from './ImcCellEditor';
import type {
  mxCell,
  mxGraph,
  mxGraphExportObject,
  mxMouseEvent,
} from 'mxgraph';
import type { ImcHTMLRenderer } from '~ims-app-base/components/ImcText/useImcHTMLRenderer';
import type {
  AssetProps,
  AssetPropsPlainObject,
  AssetPropValue,
} from '~ims-app-base/logic/types/Props';
import {
  castAssetPropValueToString,
  convertAssetPropsToPlainObject,
  assignPlainValueToAssetProps,
} from '~ims-app-base/logic/types/Props';

export function createEditor(
  mx: mxGraphExportObject,
  comp: ImcDiagramInterface,
) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(`<mxEditor></mxEditor>`, 'text/xml');

  const config_element = xmlDoc.getRootNode().childNodes[0];
  const editor = new mx.mxEditor(config_element);
  editor.keyHandler.bindAction(13, 'expand', false);
  editor.keyHandler.bindAction(46, 'delete', false);
  editor.keyHandler.bindAction(8, 'delete', false);
  editor.keyHandler.bindAction(65, 'selectAll', true);
  editor.keyHandler.bindAction(90, 'undo', true);
  editor.keyHandler.bindAction(89, 'redo', true);
  editor.keyHandler.bindAction(88, 'cut', true);
  editor.keyHandler.bindAction(67, 'copy', true);
  editor.keyHandler.bindAction(86, 'paste', true);
  editor.keyHandler.bindAction(71, 'group', true);
  editor.keyHandler.bindAction(85, 'ungroup', true);
  editor.keyHandler.bindAction(113, 'edit');
  editor.keyHandler.bindAction(187, 'zoomIn', true);
  editor.keyHandler.bindAction(189, 'zoomOut', true);
  editor.keyHandler.bindAction(48, 'zoom100', true);

  editor.addAction('zoom100', () => {
    editor.graph.view.setScale(1);
  });
  editor.setGraphContainer(comp.$refs.container);
  editor.graph.setConnectable(true);
  editor.graph.graphHandler.guidesEnabled = true;

  editor.graph.connectionHandler.isValidSource = function (_cell, _me) {
    return false;
  };

  editor.graph.cellEditor = createImcCellEditor(mx, editor.graph, comp);
  editor.graph.getEditingValue = (cell, _trigger) =>
    editor.graph.model.getValue(cell);

  const orig_gh_mouseDown = editor.graph.graphHandler.mouseDown;
  editor.graph.graphHandler.mouseDown = function (
    sender: any,
    me: mxMouseEvent,
  ) {
    const cell = this.getInitialCellForEvent(me);
    if ((cell && editor.graph.isCellSelected(cell)) || !comp.isMobile) {
      orig_gh_mouseDown.call(this, sender, me);
    }
  };
  return editor;
}

export function initGraph(
  mx: mxGraphExportObject,
  graph: mxGraph,
  comp: ImcDiagramInterface,
  htmlRenderer: ImcHTMLRenderer,
) {
  graph.getLabel = function (cell) {
    const el = document.createElement('span');
    const val = graph.model.getValue(cell);
    if ((cell as any).mxObjectId && !cell.edge) {
      const state = graph.getView().getState(cell);
      comp.updateLabel((cell as any).mxObjectId, el, val, state);
    } else {
      el.innerText = castAssetPropValueToString(val);
      el.className = 'ImcDiagram-arrowLabel';
    }
    return el;
  };
  graph.getTooltipForCell = (cell) => {
    let tip: string;

    if (cell != null && cell.getTooltip != null) {
      tip = cell.getTooltip();
    } else {
      const val = graph.model.getValue(cell);
      tip = val !== '' && val !== null ? htmlRenderer(val) : '';
    }

    return tip;
  };

  graph.selectionModel.addListener(mx.mxEvent.CHANGE, () => {
    comp.onSelectionChange();
  });

  graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] =
    'orthogonalEdgeStyle';
  graph.setHtmlLabels(true);

  graph.setPanning(true);
  graph.panningHandler.setPinchEnabled(true);
  if (comp.isMobile) {
    graph.panningHandler.useLeftButtonForPanning = true;
  }

  // Define the SVG source and dimensions
  const svgUrl =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpattern id='pattern-ImcDiagram-background' x='0' y='0' width='20' height='20' patternUnits='userSpaceOnUse' %3E%3Ccircle fill='%2381818a' cx='0.5' cy='0.5' r='0.5'%3E%3C/circle%3E%3C/pattern%3E%3Crect x='0' y='0' width='100%25' height='100%25' fill='url(%23pattern-ImcDiagram-background)' %3E%3C/rect%3E%3C/svg%3E";

  // Create the mxImage object
  const backgroundImage = new mx.mxImage(svgUrl, 200, 200);

  // Set the image and refresh the graph view
  graph.setBackgroundImage(backgroundImage);
  (graph.view.getBackgroundPane() as SVGElement).classList.add(
    'ImcDiagram-background',
  );

  updateGraphStyle(mx, graph, comp);
}

export function updateGraphStyle(
  mx: mxGraphExportObject,
  graph: mxGraph,
  comp: ImcDiagramInterface,
) {
  if (!comp.$el) {
    return;
  }

  const style = graph.getStylesheet();
  const vertex_style = style.getDefaultVertexStyle();
  const edge_style = style.getDefaultEdgeStyle();

  vertex_style[mx.mxConstants.STYLE_FONTCOLOR] = window
    .getComputedStyle(comp.$el)
    .getPropertyValue('--Diagram-textColor');
  vertex_style[mx.mxConstants.STYLE_FILLCOLOR] = window
    .getComputedStyle(comp.$el)
    .getPropertyValue('--Diagram-fillColor');
  vertex_style[mx.mxConstants.STYLE_STROKECOLOR] = window
    .getComputedStyle(comp.$el)
    .getPropertyValue('--Diagram-strokeColor');

  edge_style[mx.mxConstants.STYLE_STROKECOLOR] = window
    .getComputedStyle(comp.$el)
    .getPropertyValue('--Diagram-strokeColor');

  graph.refresh();
}

function createImcCodec(mx: mxGraphExportObject) {
  class ImcCodec extends mx.mxCodec {
    override decode(node: Node, into?: any) {
      this.updateElements();
      let obj = null;

      if (node != null && node.nodeType == mx.mxConstants.NODETYPE_ELEMENT) {
        let ctor = null;

        if (node.nodeName === 'Array') {
          const res: any[] = [];
          for (const child of node.childNodes) {
            res.push(this.decode(child));
          }
          return res;
        } else {
          try {
            ctor = (mx as any)[node.nodeName];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (err: any) {
            // ignore
          }

          const dec = mx.mxCodecRegistry.getCodec(ctor);

          if (dec != null) {
            obj = dec.decode(this, node, into);
          } else {
            obj = node.cloneNode(true);
            (obj as any).removeAttribute('as');
          }
        }
      }

      return obj;
    }
  }

  return new ImcCodec();
}

export function setGraphValue(
  mx: mxGraphExportObject,
  graph: mxGraph,
  value: AssetProps,
): boolean {
  if (value.graph) {
    // Old format
    const parser = new DOMParser();
    try {
      const codec = createImcCodec(mx);
      const xmlDoc = parser.parseFromString(
        castAssetPropValueToString(value.graph),
        'text/xml',
      );
      codec.decode(xmlDoc.documentElement, graph.getModel());
      for (const cell of Object.values(graph.model.cells) as mxCell[]) {
        const val = value[`values\\id${cell.id}`] ?? '';
        if (val !== null) {
          graph.model.setValue(cell, val);
        }
      }
      return true;
    } catch (err) {
      console.error('setGraphValue: ', err);
      return false;
    }
  }

  const plain_value = convertAssetPropsToPlainObject<DiagramSavingData>(value);
  const created_cells = new Map<string, mxCell>();
  const root_parent = graph.getDefaultParent();

  graph.getModel().beginUpdate();
  try {
    if (Array.isArray(plain_value.vertices)) {
      let some_added = false;
      let added_counter = 0;
      do {
        some_added = false;
        for (const vertex of plain_value.vertices) {
          if (created_cells.has(vertex.id)) {
            continue; // Already added
          }
          const parent = vertex.parent
            ? created_cells.get(vertex.parent)
            : root_parent;
          if (!parent) {
            continue; // Parent is not availabled yet
          }
          const cell = graph.insertVertex(
            parent,
            vertex.id,
            vertex.value,
            vertex.geometry.x,
            vertex.geometry.y,
            vertex.geometry.w,
            vertex.geometry.h,
            vertex.style,
            vertex.geometry.r,
          );
          created_cells.set(cell.id, cell);
          some_added = true;
          added_counter++;
        }
      } while (some_added && added_counter < plain_value.vertices.length);
      if (added_counter < plain_value.vertices.length) {
        console.error(
          'DiagramBlock: failed to restore vertices',
          plain_value.vertices.filter((v) => !created_cells.has(v.id)),
        );
      }
    }
    if (Array.isArray(plain_value.edges)) {
      let some_added = false;
      let added_counter = 0;
      do {
        some_added = false;
        for (const edge of plain_value.edges) {
          if (created_cells.has(edge.id)) {
            continue; // Already added
          }
          const parent = edge.parent
            ? created_cells.get(edge.parent)
            : root_parent;
          if (!parent) {
            continue; // Parent is not availabled yet
          }
          const source = edge.source ? created_cells.get(edge.source) : null;
          if (source === undefined) {
            continue; // source is not availabled yet
          }
          const target = edge.target ? created_cells.get(edge.target) : null;
          if (target === undefined) {
            continue; // source is not availabled yet
          }
          const cell = graph.insertEdge(
            parent,
            edge.id,
            edge.value,
            source as mxCell,
            target as mxCell,
            edge.style,
          );
          cell.geometry.relative = edge.geometry.r;
          cell.geometry.setRect(
            edge.geometry.x,
            edge.geometry.y,
            edge.geometry.w,
            edge.geometry.h,
          );
          if (edge.geometry.sp) {
            cell.geometry.setTerminalPoint(
              new mx.mxPoint(edge.geometry.sp.x, edge.geometry.sp.y),
              true,
            );
          }
          if (edge.geometry.tp) {
            cell.geometry.setTerminalPoint(
              new mx.mxPoint(edge.geometry.tp.x, edge.geometry.tp.y),
              false,
            );
          }
          created_cells.set(cell.id, cell);
          some_added = true;
          added_counter++;
        }
      } while (some_added && added_counter < plain_value.edges.length);
      if (added_counter < plain_value.edges.length) {
        console.error(
          'DiagramBlock: failed to restore edges',
          plain_value.edges.filter((v) => !created_cells.has(v.id)),
        );
      }
    }
  } finally {
    graph.getModel().endUpdate();
  }

  return true;
}

interface DiagramSavingDataPoint extends AssetPropsPlainObject {
  x: number;
  y: number;
}

interface DiagramSavingDataGeometry extends AssetPropsPlainObject {
  x: number;
  y: number;
  w: number;
  h: number;
  r: boolean;
  sp: DiagramSavingDataPoint | null;
  tp: DiagramSavingDataPoint | null;
}

interface DiagramSavingDataVertex extends AssetPropsPlainObject {
  id: string;
  parent: string | null;
  style: string;
  value: AssetPropValue;
  geometry: DiagramSavingDataGeometry;
  index: number;
}

interface DiagramSavingDataEdge extends AssetPropsPlainObject {
  id: string;
  parent: string | null;
  style: string;
  value: AssetPropValue;
  source: string | null;
  target: string | null;
  geometry: DiagramSavingDataGeometry;
  index: number;
}

interface DiagramSavingData extends AssetPropsPlainObject {
  vertices: DiagramSavingDataVertex[];
  edges: DiagramSavingDataEdge[];
}

export function getGraphValue(
  mx: mxGraphExportObject,
  graph: mxGraph,
): AssetProps {
  const model = graph.getModel();
  const res_plain: DiagramSavingData = {
    vertices: [],
    edges: [],
  };

  const root_cell_ids = [model.root.id];
  if (model.root.children.length > 0 && !model.root.children[0].geometry) {
    root_cell_ids.push(model.root.children[0].id); // Two elements are default. Ignore them
  }
  const processed_cells = new Set<string>();

  const process_cell = (cell: mxCell, index: number) => {
    if (processed_cells.has(cell.id)) {
      return;
    }
    processed_cells.add(cell.id);
    const parent =
      cell.parent && !root_cell_ids.includes(cell.parent.id)
        ? cell.parent
        : null;
    if (cell.vertex) {
      res_plain.vertices.push({
        id: cell.id,
        parent: parent ? parent.id : null,
        style: cell.style,
        index,
        geometry: {
          x: cell.geometry.x,
          y: cell.geometry.y,
          w: cell.geometry.width,
          h: cell.geometry.height,
          r: cell.geometry.relative,
          sp: cell.geometry.sourcePoint
            ? {
                x: cell.geometry.sourcePoint.x,
                y: cell.geometry.sourcePoint.y,
              }
            : null,
          tp: cell.geometry.targetPoint
            ? {
                x: cell.geometry.targetPoint.x,
                y: cell.geometry.targetPoint.y,
              }
            : null,
        },
        value: (cell.value !== '' ? cell.value : null) ?? null,
      });
    } else if (cell.edge) {
      res_plain.edges.push({
        id: cell.id,
        parent: parent ? parent.id : null,
        source:
          cell.source && !root_cell_ids.includes(cell.source.id)
            ? cell.source.id
            : null,
        target:
          cell.target && !root_cell_ids.includes(cell.target.id)
            ? cell.target.id
            : null,
        style: cell.style,
        index,
        geometry: {
          x: cell.geometry.x,
          y: cell.geometry.y,
          w: cell.geometry.width,
          h: cell.geometry.height,
          r: cell.geometry.relative,
          sp: cell.geometry.sourcePoint
            ? {
                x: cell.geometry.sourcePoint.x,
                y: cell.geometry.sourcePoint.y,
              }
            : null,
          tp: cell.geometry.targetPoint
            ? {
                x: cell.geometry.targetPoint.x,
                y: cell.geometry.targetPoint.y,
              }
            : null,
        },
        value: (cell.value !== '' ? cell.value : null) ?? null,
      });
    }
    if (cell.children && cell.children.length > 0) {
      for (let i = 0; i < cell.children.length; i++) {
        process_cell(cell.children[i], i);
      }
    }
  };

  const root_parent = graph.getDefaultParent();
  if (root_parent.children) {
    for (let i = 0; i < root_parent.children.length; i++) {
      process_cell(root_parent.children[i], i);
    }
  }
  return assignPlainValueToAssetProps({}, res_plain);
}

export type ImcDiagramFigure = {
  id: string;
  icon: string;
  title: string;
  style: string;
  initialWidth: number;
  initialHeight: number;
  initalContent: string;
};

export function createMxCellByFigure(
  mx: mxGraphExportObject,
  figure: ImcDiagramFigure,
): mxCell {
  const vertex = new mx.mxCell(
    figure.initalContent,
    new mx.mxGeometry(0, 0, figure.initialWidth, figure.initialHeight),
    figure.style,
  );
  vertex.setVertex(true);
  return vertex;
}
