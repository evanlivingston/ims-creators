<template>
  <div class="CreateNodeDropdown">
    <div
      v-for="option of nodeDesсriptors"
      :key="option.name"
      class="CreateNodeDropdown-item"
      :style="{
        '--imsde-node-color': option.color,
      }"
      :title="$t(`imsDialogEditor.nodes.${option.name}.description`)"
      @click="choseOption(option)"
    >
      <i class="CreateNodeDropdown-item-icon" :class="option.icon"></i>
      {{ $t(`imsDialogEditor.nodes.${option.name}.title`) }}
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { getNodeDescriptors } from '../nodes/getNodeDescriptiors';
import type { NodeDescriptor, NodeType } from '../nodes/NodeDescriptor';
import type { AssetPropValueType } from '~ims-app-base/logic/types/Props';

export default defineComponent({
  name: 'CreateNodeDropdown',
  components: {},
  props: {
    allowedTypes: {
      type: Array<NodeType>,
      required: true,
    },
    needDataIn: {
      type: [Array<AssetPropValueType>, null] as PropType<
        AssetPropValueType[] | null
      >,
      default: null,
    },
    needDataOut: {
      type: [Array<AssetPropValueType>, null] as PropType<
        AssetPropValueType[] | null
      >,
      default: null,
    },
  },
  emits: ['choose'],
  data() {
    return {};
  },
  computed: {
    nodeDesсriptors() {
      const need_data_in_set = this.needDataIn
        ? new Set(this.needDataIn.map((t) => t.Type))
        : null;
      const need_data_out_set = this.needDataOut
        ? new Set(this.needDataOut.map((t) => t.Type))
        : null;
      return getNodeDescriptors().filter((option) => {
        if (this.allowedTypes && !this.allowedTypes.includes(option.type)) {
          return false;
        }
        if (need_data_in_set) {
          if (
            option.dataInTypes === undefined ||
            (option.dataInTypes &&
              option.dataInTypes.every((t) => !need_data_in_set.has(t.Type)))
          ) {
            return false;
          }
        }
        if (need_data_out_set) {
          if (
            option.dataOutTypes === undefined ||
            (option.dataOutTypes &&
              option.dataOutTypes.every((t) => !need_data_out_set.has(t.Type)))
          ) {
            return false;
          }
        }
        return true;
      });
    },
  },
  methods: {
    choseOption(opt: NodeDescriptor) {
      this.$emit('choose', opt);
    },
  },
});
</script>

<style lang="scss" scoped>
.CreateNodeDropdown {
  background-color: var(--imsde-dropdown-bg-color);
  border-radius: var(--imsde-dropdown-border-radius);
  box-shadow: var(--imsde-dropdown-box-shadow);
  overflow: hidden;
}
.CreateNodeDropdown-item {
  padding: 5px 10px;
  cursor: pointer;

  &:not(:last-child) {
    border-bottom: 1px solid var(--imsde-dropdown-border-color);
  }

  &:hover {
    color: var(--imsde-text-color);
    background: var(--imsde-node-color);
    .CreateNodeDropdown-item-icon {
      color: var(--imsde-text-color);
    }
  }
}
.CreateNodeDropdown-item-icon {
  color: var(--imsde-node-color);
}
</style>
