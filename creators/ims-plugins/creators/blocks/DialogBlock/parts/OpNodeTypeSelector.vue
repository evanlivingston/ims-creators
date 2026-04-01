<template>
  <menu-button v-model:shown="dropdownShown" class="OpNodeTypeSelector">
    <template #button="{ toggle }">
      <button
        class="OpNodeTypeSelector-value"
        :class="{
          shown: dropdownShown,
        }"
        :title="$t(`imsDialogEditor.nodes.${operator}.description`)"
        :disabled="readonly"
        @click.prevent="onButtonClick($event, toggle)"
      >
        {{ sign }}
      </button>
    </template>
    <node-descriptors-dropdown
      class="OpNodeTypeSelector-dropdown"
      :node-descriptors="nodeDescriptors"
      @choose="chooseOption($event)"
    >
    </node-descriptors-dropdown>
  </menu-button>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { getNodeDescriptors, opOptions } from '../nodes/getNodeDescriptiors';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import type { NodeDescriptor } from '../nodes/NodeDescriptor';
import NodeDescriptorsDropdown from '../editor/NodeDescriptorsDropdown.vue';

export default defineComponent({
  name: 'OpNodeTypeSelector',
  components: {
    MenuButton,
    NodeDescriptorsDropdown,
  },
  props: {
    operator: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['choose'],
  data() {
    return {
      dropdownShown: false,
    };
  },
  computed: {
    sign() {
      return opOptions[this.operator] ? opOptions[this.operator].sign : null;
    },
    nodeDescriptors() {
      return getNodeDescriptors().filter(
        (descriptor) =>
          Object.keys(opOptions).includes(descriptor.name) &&
          descriptor.params.operator !== this.operator,
      );
    },
  },
  methods: {
    chooseOption(descriptor: NodeDescriptor) {
      this.$emit('choose', descriptor.name);
    },
    onButtonClick(event: MouseEvent, toggle: () => void) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      toggle();
    },
  },
});
</script>
<style>
.OpNodeTypeSelector-value {
  color: var(--imsde-node-color);
}
[data-theme='ims-light'] {
  .OpNodeTypeSelector-value {
    color: var(--imsde-node-content-text-color);
  }
}
</style>
<style lang="scss" scoped>
.OpNodeTypeSelector {
  display: flex;
  align-items: center;
  justify-content: center;
}
.OpNodeTypeSelector-value {
  text-align: center;
  font-size: 30px;
  line-height: 30px;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 5px 10px;
  margin: 0 5px;
  width: 100%;
  transition: border-color 0.1s;

  &:not(:disabled) {
    cursor: pointer;
    &:hover,
    &.shown {
      border-color: var(--local-border-color);
    }
  }
}
.OpNodeTypeSelector-dropdown-types {
  .is-button {
    border-radius: 4px;
    width: fit-content !important;
  }
}
</style>
