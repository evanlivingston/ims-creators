<template>
  <div class="ImcDiagramToolbar">
    <div class="ImcDiagramToolbar-section">
      <button
        class="is-button is-button-toolbar"
        :title="$t('diagram.tools.select')"
        :class="{ 'state-active': !activeTool }"
        @click="resetTool"
      >
        <i class="ri-cursor-line"></i>
      </button>
      <button
        v-for="figure of figures"
        :key="figure.id"
        :title="figure.title"
        class="is-button is-button-toolbar"
        :class="{ 'state-active': activeTool === figure.id }"
        :draggable="true"
        @click="selectFigure(figure)"
        @dragstart="onFigureDragStart($event, figure)"
      >
        <i :class="figure.icon"></i>
      </button>
    </div>
    <div class="ImcDiagramToolbar-section">
      <button
        class="is-button is-button-toolbar"
        :title="$t('diagram.tools.bringToFront')"
        :disabled="!canBringToFront"
        @click="bringToFront()"
      >
        <i class="ri-bring-to-front"></i>
      </button>
      <button
        class="is-button is-button-toolbar"
        :title="$t('diagram.tools.sendToBack')"
        :disabled="!canSendToBack"
        @click="sendToBack()"
      >
        <i class="ri-send-to-back"></i>
      </button>
    </div>
    <div class="ImcDiagramToolbar-section">
      <button
        class="is-button is-button-toolbar"
        :title="$t('diagram.tools.group')"
        :disabled="!canGroup"
        @click="group()"
      >
        <i class="ims-icon-font-group-line"></i>
      </button>
      <button
        class="is-button is-button-toolbar"
        :title="$t('diagram.tools.group')"
        :disabled="!canUngroup"
        @click="ungroup()"
      >
        <i class="ims-icon-font-ungroup-line"></i>
      </button>
    </div>
    <div class="ImcDiagramToolbar-section">
      <menu-button>
        <template #button="{ toggle }">
          <button
            class="is-button is-button-toolbar"
            :disabled="!canSetColor"
            :title="$t('diagram.tools.setColor')"
            :class="{ 'state-active': currentFillColor }"
            :style="{
              '--ImcEditorToolbar-button-activeColor': currentFillColor,
            }"
            @click="toggle"
          >
            <i class="ri-paint-fill"></i>
          </button>
        </template>
        <div class="ImcDiagramToolbar-colorButton-dropdown">
          <button
            v-for="color of figureColors"
            :key="color.fill"
            class="ImcDiagramToolbar-colorButton-color"
            :style="{
              '--ImcDiagramToolbar-colorButton-color': color.fill
                ? color.fill
                : undefined,
            }"
            @click="setColor(color)"
          >
            <i
              v-if="
                color.fill === currentFillColor ||
                (!color.fill && !currentFillColor)
              "
              class="ri-check-fill"
            ></i>
            <i v-else-if="!color.fill" class="ri-close-fill"></i>
          </button>
        </div>
      </menu-button>
    </div>
  </div>
</template>

<script lang="ts">
import { type PropType, defineComponent } from 'vue';
import type { mxCell, mxGraphExportObject, mxEditor, mxGraph } from 'mxgraph';
import { createMxCellByFigure, type ImcDiagramFigure } from './editor';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';

type FigureColor = { fill: string; stroke: string };
const FIGURE_COLORS: FigureColor[] = [
  { fill: '', stroke: '' },
  { fill: '#e6000099', stroke: '#e60000' },
  { fill: '#ff990099', stroke: '#ff9900' },
  { fill: '#ffff0099', stroke: '#ffff00' },
  { fill: '#008a0099', stroke: '#008a00' },
  { fill: '#0066cc99', stroke: '#0066cc' },
  { fill: '#9933ff99', stroke: '#9933ff' },
  { fill: '#99999944', stroke: '#000000' },
  { fill: '#e6000044', stroke: '#e60000' },
  { fill: '#ff990044', stroke: '#ff9900' },
  { fill: '#ffff0044', stroke: '#ffff00' },
  { fill: '#008a0044', stroke: '#008a00' },
  { fill: '#0066cc44', stroke: '#0066cc' },
  { fill: '#9933ff44', stroke: '#9933ff' },
];

export default defineComponent({
  name: 'ImcDiagramToolbar',
  components: {
    MenuButton,
  },
  props: {
    mx: {
      type: Object as PropType<mxGraphExportObject>,
      required: true,
    },
    editor: {
      type: Object as PropType<mxEditor>,
      required: true,
    },
    graph: {
      type: Object as PropType<mxGraph>,
      required: true,
    },
    selectedCells: {
      type: Array<mxCell>,
      required: true,
    },
  },
  emits: ['toolReset', 'groupCreated'],
  data() {
    return {
      activeTool: null as any,
    };
  },
  computed: {
    figures(): ImcDiagramFigure[] {
      return [
        {
          id: 'rect',
          icon: 'ri-rectangle-line',
          title: this.$t('diagram.tools.rect'),
          style: '',
          initialWidth: 100,
          initialHeight: 40,
          initalContent: 'Text',
        },
        {
          id: 'ellipse',
          icon: 'ri-circle-line',
          title: this.$t('diagram.tools.ellipse'),
          style: 'shape=ellipse',
          initialWidth: 60,
          initialHeight: 60,
          initalContent: 'Text',
        },
        {
          id: 'rhombus',
          icon: 'ims-icon-font-rhombus-line',
          title: this.$t('diagram.tools.rhombus'),
          style: 'shape=rhombus',
          initialWidth: 100,
          initialHeight: 40,
          initalContent: 'Text',
        },
        {
          id: 'text',
          icon: 'ri-text',
          title: this.$t('diagram.tools.text'),
          style:
            'shape=text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;',
          initialWidth: 60,
          initialHeight: 40,
          initalContent: 'Text',
        },
        {
          id: 'actor',
          icon: 'ims-icon-font-actor-line',
          title: this.$t('diagram.tools.actor'),
          style:
            'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;outlineConnect=0',
          initialWidth: 30,
          initialHeight: 60,
          initalContent: 'Actor',
        },
        {
          id: 'stateStart',
          icon: 'ims-icon-font-state-start',
          title: this.$t('diagram.tools.stateStart'),
          style: 'ellipse;shape=startState;fillColor=strokeColor;',
          initialWidth: 30,
          initialHeight: 30,
          initalContent: '',
        },
        {
          id: 'stateEnd',
          icon: 'ims-icon-font-state-end',
          title: this.$t('diagram.tools.stateEnd'),
          style: 'ellipse;shape=endState;fillColor=strokeColor;',
          initialWidth: 30,
          initialHeight: 30,
          initalContent: '',
        },
      ];
    },
    canBringToFront() {
      return this.selectedCells.length > 0;
    },
    canSendToBack() {
      return this.selectedCells.length > 0;
    },
    canGroup() {
      return this.selectedCells.length > 1;
    },
    canUngroup() {
      return this.selectedCells.some(
        (g) => g.children && g.children.length > 0,
      );
    },
    figureColors() {
      return FIGURE_COLORS;
    },
    canSetColor() {
      return this.selectedCells.length > 0;
    },
    currentFillColor() {
      for (const cell of this.selectedCells) {
        const style = this.graph.getCellStyle(cell);
        const fill = style[this.mx.mxConstants.STYLE_FILLCOLOR];
        if (fill && this.figureColors.some((c) => c.fill === fill)) {
          return fill;
        }
      }
      return null;
    },
  },
  methods: {
    bringToFront() {
      if (this.graph.isEnabled()) {
        this.graph.orderCells(false);
      }
    },
    sendToBack() {
      if (this.graph.isEnabled()) {
        this.graph.orderCells(true);
      }
    },
    group() {
      if (this.selectedCells.length > 0) {
        const group = this.graph.groupCells(null, 20, this.selectedCells);
        if (!group.id) {
          group.id = this.graph.model.createId(group);
        }
        this.$emit('groupCreated');
      }
    },
    ungroup() {
      const groups = this.selectedCells.filter(
        (g) => g.children && g.children.length > 0,
      );
      if (groups.length > 0) {
        this.graph.ungroupCells(groups);
      }
    },
    resetTool() {
      const editor = this.editor;
      editor.insertFunction = null as any;
      this.activeTool = null;
      this.$emit('toolReset');
    },
    selectFigure(figure: ImcDiagramFigure) {
      const editor = this.editor;
      this.activeTool = figure.id;
      editor.insertFunction = (evt: MouseEvent, cell: mxCell) => {
        const vertex = createMxCellByFigure(this.mx, figure);
        this.editor.toolbar.drop(vertex, evt, cell);
        this.resetTool();
      };
    },
    onFigureDragStart(ev: DragEvent, figure: ImcDiagramFigure) {
      if (!ev.dataTransfer) {
        return;
      }
      ev.dataTransfer.setData('imc-diagram-figure', JSON.stringify(figure));
    },
    setColor(color: FigureColor) {
      this.graph.setCellStyles(
        this.mx.mxConstants.STYLE_STROKECOLOR,
        color.stroke,
        this.selectedCells,
      );
      this.graph.setCellStyles(
        this.mx.mxConstants.STYLE_FILLCOLOR,
        color.fill,
        this.selectedCells,
      );
    },
  },
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
@use '~ims-app-base/components/ImcText/Toolbar/ImcEditorToolbar.scss';

.ImcDiagramToolbar-section {
  @include ImcEditorToolbar.ImcEditorToolbar-section;
}

.ImcDiagramToolbar {
  display: inline-flex;
  @include ImcEditorToolbar.ImcEditorToolbar-toolbar;

  &:deep(.is-button-toolbar) {
    @include ImcEditorToolbar.ImcEditorToolbar-button;
  }
}

.ImcDiagramToolbar-colorButton-dropdown {
  @include ImcEditorToolbar.ImcEditorToolbar-dropdown;
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(7, 1fr);
  padding: 3px;
}
.ImcDiagramToolbar-colorButton-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background-color: var(--ImcDiagramToolbar-colorButton-color, transparent);
  padding: 0;
  color: var(--local-text-color);
  line-height: 16px;
  & > i.ri-close-fill {
    opacity: 0.5;
  }
  &:hover {
    outline: 1px solid var(--ImcDiagramToolbar-colorButton-color, transparent);
    & > i.ri-close-fill {
      opacity: 1;
    }
  }
}
</style>
