<template>
  <div class="BarkBlock">
    <div v-if="barks.length === 0" class="BarkBlock-empty">
      No barks yet. Add one to get started.
    </div>
    <ol v-else class="BarkBlock-list">
      <li
        v-for="(bark, idx) in barks"
        :key="idx"
        class="BarkBlock-row"
      >
        <div class="BarkBlock-row-head">
          <span class="BarkBlock-row-num">{{ idx + 1 }}.</span>
          <textarea
            class="BarkBlock-row-text is-input"
            rows="1"
            :value="bark.text ?? ''"
            :readonly="readonly"
            placeholder="What the NPC says"
            @input="updateBark(idx, 'text', $event)"
          ></textarea>
          <label class="BarkBlock-row-weight-wrap">
            <span class="BarkBlock-row-weight-label">w</span>
            <input
              class="BarkBlock-row-weight is-input"
              type="number"
              step="any"
              min="0"
              :value="bark.weight ?? 1"
              :readonly="readonly"
              @input="updateBark(idx, 'weight', $event)"
            />
          </label>
          <button
            v-if="!readonly"
            type="button"
            class="BarkBlock-row-remove is-button is-button-icon"
            title="Remove bark"
            @click="removeBark(idx)"
          >
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
        <div class="BarkBlock-row-cond">
          <span class="BarkBlock-row-cond-label">Condition</span>
          <ConditionBuilder
            class="BarkBlock-row-cond-input"
            :model-value="typeof bark.condition === 'string' ? bark.condition : ''"
            :readonly="readonly"
            @update:model-value="updateCondition(idx, $event)"
          ></ConditionBuilder>
        </div>
      </li>
    </ol>
    <button
      v-if="!readonly"
      type="button"
      class="BarkBlock-add is-button"
      @click="addBark"
    >
      + Add bark
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AssetChanger } from '~ims-app-base/logic/types/AssetChanger';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';
import {
  convertAssetPropsToPlainObject,
  makeBlockRef,
} from '~ims-app-base/logic/types/Props';
import ConditionBuilder from '../DialogBlock/parts/ConditionBuilder.vue';

type Bark = {
  text?: string;
  weight?: number;
  condition?: string;
};

export default defineComponent({
  name: 'BarkBlock',
  components: {
    ConditionBuilder,
  },
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    assetChanger: {
      type: Object as PropType<AssetChanger>,
      required: true,
    },
    resolvedBlock: {
      type: Object as PropType<ResolvedAssetBlock>,
      required: true,
    },
  },
  computed: {
    barks(): Bark[] {
      // resolvedBlock.computed is in path-encoded AssetProps form
      // (keys like `barks\0\text`). Convert it back to a plain JS shape so
      // we can read the array as { text, weight, condition }[] objects.
      const plain = convertAssetPropsToPlainObject<{ barks?: Bark[] }>(
        this.resolvedBlock.computed,
      );
      const raw = plain.barks;
      return Array.isArray(raw) ? (raw as Bark[]) : [];
    },
  },
  methods: {
    saveBarks(next: Bark[]) {
      this.assetChanger.setBlockPropKey(
        this.resolvedBlock.assetId,
        makeBlockRef(this.resolvedBlock),
        null,
        'barks',
        next,
      );
    },
    cloneBarks(): Bark[] {
      return this.barks.map((b) => ({ ...b }));
    },
    addBark() {
      const next = this.cloneBarks();
      next.push({ text: '', weight: 1 });
      this.saveBarks(next);
    },
    removeBark(idx: number) {
      const next = this.cloneBarks();
      next.splice(idx, 1);
      this.saveBarks(next);
    },
    updateBark(idx: number, key: 'text' | 'weight' | 'condition', evt: Event) {
      const target = evt.target as HTMLInputElement | HTMLTextAreaElement;
      const next = this.cloneBarks();
      const bark = { ...next[idx] };
      if (key === 'weight') {
        const num = parseFloat(target.value);
        bark.weight = Number.isFinite(num) ? num : 1;
      } else {
        bark[key] = target.value;
      }
      next[idx] = bark;
      this.saveBarks(next);
    },
    updateCondition(idx: number, value: string) {
      const next = this.cloneBarks();
      const bark = { ...next[idx] };
      // Strip empty condition so the saved JSON omits the key entirely; the
      // runner treats empty/missing the same way (always-eligible).
      if (value === '') {
        delete bark.condition;
      } else {
        bark.condition = value;
      }
      next[idx] = bark;
      this.saveBarks(next);
    },
  },
});
</script>

<style lang="scss" scoped>
.BarkBlock {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}
.BarkBlock-empty {
  color: var(--imsde-node-content-caption-color, inherit);
  opacity: 0.6;
  font-style: italic;
}
.BarkBlock-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.BarkBlock-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.02);
}
.BarkBlock-row-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.BarkBlock-row-num {
  flex: 0 0 auto;
  font-size: 11px;
  opacity: 0.5;
  font-variant-numeric: tabular-nums;
  min-width: 18px;
  text-align: right;
}
.BarkBlock-row-text {
  flex: 1 1 auto;
  min-width: 0;
  resize: none;
  font-size: 12px;
  padding: 3px 6px;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 2px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  line-height: 1.3;
  &:focus {
    outline: none;
    border-color: var(--imsde-node-playing-color, #888);
  }
}
.BarkBlock-row-weight-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}
.BarkBlock-row-weight-label {
  font-size: 11px;
  opacity: 0.6;
}
.BarkBlock-row-weight {
  width: 50px;
  font-size: 11px;
  padding: 2px 4px;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 2px;
  background: transparent;
  color: inherit;
  &:focus {
    outline: none;
    border-color: var(--imsde-node-playing-color, #888);
  }
}
.BarkBlock-row-remove {
  width: 22px;
  height: 22px;
  font-size: 12px;
  flex: 0 0 auto;
  opacity: 0;
  transition: opacity 120ms ease;
}
.BarkBlock-row:hover .BarkBlock-row-remove {
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
}
.BarkBlock-row-cond {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding-left: 24px;
}
.BarkBlock-row-cond-label {
  font-size: 11px;
  opacity: 0.6;
  padding-top: 2px;
  flex: 0 0 auto;
}
.BarkBlock-row-cond-input {
  flex: 1 1 auto;
  min-width: 0;
}
.BarkBlock-add {
  align-self: flex-start;
  font-size: 12px;
  padding: 4px 12px;
}
</style>
