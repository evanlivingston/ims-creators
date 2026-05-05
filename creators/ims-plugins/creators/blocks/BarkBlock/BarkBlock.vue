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
        <div class="BarkBlock-row-grid">
          <label class="BarkBlock-row-label">Text</label>
          <textarea
            class="BarkBlock-row-text is-input"
            rows="1"
            :value="bark.text ?? ''"
            :readonly="readonly"
            placeholder="What the NPC says"
            @input="updateBark(idx, 'text', $event)"
          ></textarea>

          <label class="BarkBlock-row-label">Weight</label>
          <input
            class="BarkBlock-row-weight is-input"
            type="number"
            step="any"
            min="0"
            :value="bark.weight ?? 1"
            :readonly="readonly"
            @input="updateBark(idx, 'weight', $event)"
          />

          <label class="BarkBlock-row-label">Condition</label>
          <ConditionBuilder
            class="BarkBlock-row-condition"
            :model-value="typeof bark.condition === 'string' ? bark.condition : ''"
            :readonly="readonly"
            @update:model-value="updateCondition(idx, $event)"
          ></ConditionBuilder>
        </div>
        <button
          v-if="!readonly"
          type="button"
          class="BarkBlock-row-remove is-button is-button-icon"
          title="Remove bark"
          @click="removeBark(idx)"
        >
          <i class="ri-delete-bin-line"></i>
        </button>
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
import { makeBlockRef } from '~ims-app-base/logic/types/Props';
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
      const raw = this.resolvedBlock.computed['barks'];
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
  gap: 8px;
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
  gap: 6px;
}
.BarkBlock-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 4px;
}
.BarkBlock-row-grid {
  display: grid;
  grid-template-columns: minmax(70px, auto) 1fr;
  gap: 4px 8px;
  flex: 1 1 auto;
  min-width: 0;
  align-items: start;
}
.BarkBlock-row-label {
  font-size: 11px;
  opacity: 0.7;
  padding-top: 4px;
}
.BarkBlock-row-text {
  width: 100%;
  resize: vertical;
  font-size: 12px;
  padding: 4px 6px;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 2px;
  background: transparent;
  color: inherit;
}
.BarkBlock-row-weight {
  width: 80px;
  font-size: 12px;
  padding: 2px 6px;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 2px;
  background: transparent;
  color: inherit;
}
.BarkBlock-row-condition {
  min-width: 0;
}
.BarkBlock-row-remove {
  width: 22px;
  height: 22px;
  font-size: 12px;
  flex: 0 0 auto;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
}
.BarkBlock-add {
  align-self: flex-start;
  font-size: 12px;
  padding: 4px 12px;
}
</style>
