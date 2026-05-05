<template>
  <div class="SequenceBuilder">
    <div v-if="mode === 'form'" class="SequenceBuilder-form">
      <div
        v-for="(step, step_idx) in steps"
        :key="step_idx"
        class="SequenceBuilder-row"
      >
        <span class="SequenceBuilder-row-at">@</span>
        <input
          class="SequenceBuilder-row-time is-input"
          type="number"
          step="any"
          min="0"
          :value="step.delay"
          :readonly="readonly"
          @input="onDelayChange(step_idx, $event)"
        />
        <select
          class="SequenceBuilder-row-cmd"
          :value="step.name"
          :disabled="readonly"
          @change="onCommandChange(step_idx, $event)"
        >
          <option value="" disabled>Pick a command</option>
          <option
            v-for="def in commandDefs"
            :key="def.name"
            :value="def.name"
            :title="def.description"
          >
            {{ def.name }}
          </option>
        </select>
        <input
          v-for="(arg, arg_idx) in step.args"
          :key="arg_idx"
          class="SequenceBuilder-row-arg is-input"
          :type="argInputType(step, arg_idx)"
          :step="arg.kind === 'number' ? 'any' : undefined"
          :placeholder="argLabel(step, arg_idx)"
          :value="argDisplayValue(step, arg_idx)"
          :readonly="readonly"
          @input="onArgChange(step_idx, arg_idx, $event)"
        />
        <button
          v-if="!readonly"
          type="button"
          class="SequenceBuilder-row-remove is-button is-button-icon"
          title="Remove step"
          @click="removeStep(step_idx)"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
      <div v-if="!readonly" class="SequenceBuilder-footer">
        <button
          type="button"
          class="SequenceBuilder-add is-button-link"
          @click="addStep"
        >
          + Add step
        </button>
        <button
          type="button"
          class="SequenceBuilder-toggle is-button-link"
          @click="toggleMode"
        >
          text
        </button>
      </div>
    </div>
    <div v-else class="SequenceBuilder-text">
      <textarea
        class="SequenceBuilder-text-input is-input"
        :value="modelValue"
        :readonly="readonly"
        rows="3"
        placeholder='FocusCamera("npc"); @0.5 PlayAnim("npc", "Talk"); @2.0 ResetCamera()'
        @input="onTextInput"
      ></textarea>
      <p v-if="parseFailed" class="SequenceBuilder-text-warn">
        Form mode unavailable: this sequence uses syntax the simple builder
        doesn't recognise. Edit as text or rewrite using the standard commands.
      </p>
      <div v-if="!readonly && !parseFailed" class="SequenceBuilder-footer">
        <button
          type="button"
          class="SequenceBuilder-toggle is-button-link"
          @click="toggleMode"
        >
          form
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  defaultSequenceArgFor,
  parseSequence,
  serializeSequence,
  SEQUENCE_COMMANDS,
  type SequenceCommandDef,
  type SequenceStep,
} from '../logic/sequenceDsl';

export default defineComponent({
  name: 'SequenceBuilder',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      mode: 'form' as 'form' | 'text',
    };
  },
  computed: {
    parsed() {
      return parseSequence(this.modelValue ?? '');
    },
    parseFailed(): boolean {
      return this.parsed.unsupported;
    },
    steps(): SequenceStep[] {
      return this.parsed.steps;
    },
    commandDefs(): SequenceCommandDef[] {
      return SEQUENCE_COMMANDS;
    },
  },
  watch: {
    parsed: {
      immediate: true,
      handler() {
        if (this.parseFailed && this.mode === 'form') {
          this.mode = 'text';
        }
      },
    },
  },
  methods: {
    cloneSteps(): SequenceStep[] {
      return this.steps.map((s) => ({
        delay: s.delay,
        name: s.name,
        args: s.args.map((a) => ({ ...a })),
      }));
    },
    emitFromSteps(steps: SequenceStep[]) {
      this.$emit('update:modelValue', serializeSequence(steps));
    },
    argLabel(step: SequenceStep, idx: number): string {
      const def = SEQUENCE_COMMANDS.find((d) => d.name === step.name);
      return def?.args[idx]?.label ?? '';
    },
    argInputType(step: SequenceStep, idx: number): string {
      const def = SEQUENCE_COMMANDS.find((d) => d.name === step.name);
      const kind = def?.args[idx]?.kind ?? step.args[idx]?.kind ?? 'string';
      return kind === 'number' ? 'number' : 'text';
    },
    argDisplayValue(step: SequenceStep, idx: number): string {
      const arg = step.args[idx];
      if (!arg) return '';
      if (arg.kind === 'bool') return arg.value ? 'true' : 'false';
      return String(arg.value);
    },
    onDelayChange(stepIdx: number, evt: Event) {
      const value = parseFloat((evt.target as HTMLInputElement).value) || 0;
      const steps = this.cloneSteps();
      steps[stepIdx].delay = value;
      this.emitFromSteps(steps);
    },
    onCommandChange(stepIdx: number, evt: Event) {
      const target = evt.target as HTMLSelectElement;
      const def = SEQUENCE_COMMANDS.find((d) => d.name === target.value);
      if (!def) return;
      const steps = this.cloneSteps();
      const oldDelay = steps[stepIdx].delay;
      steps[stepIdx] = {
        delay: oldDelay,
        name: def.name,
        args: def.args.map((a) => defaultSequenceArgFor(a.kind)),
      };
      this.emitFromSteps(steps);
    },
    onArgChange(stepIdx: number, argIdx: number, evt: Event) {
      const value = (evt.target as HTMLInputElement).value;
      const steps = this.cloneSteps();
      const def = SEQUENCE_COMMANDS.find((d) => d.name === steps[stepIdx].name);
      const argDef = def?.args[argIdx];
      if (argDef?.kind === 'number') {
        steps[stepIdx].args[argIdx] = {
          kind: 'number',
          value: parseFloat(value) || 0,
        };
      } else if (argDef?.kind === 'bool') {
        steps[stepIdx].args[argIdx] = {
          kind: 'bool',
          value: value === 'true',
        };
      } else {
        steps[stepIdx].args[argIdx] = { kind: 'string', value };
      }
      this.emitFromSteps(steps);
    },
    addStep() {
      const steps = this.cloneSteps();
      const def = SEQUENCE_COMMANDS[0];
      steps.push({
        delay: 0,
        name: def.name,
        args: def.args.map((a) => defaultSequenceArgFor(a.kind)),
      });
      this.emitFromSteps(steps);
    },
    removeStep(stepIdx: number) {
      const steps = this.cloneSteps();
      steps.splice(stepIdx, 1);
      this.emitFromSteps(steps);
    },
    onTextInput(evt: Event) {
      const value = (evt.target as HTMLTextAreaElement).value;
      this.$emit('update:modelValue', value);
    },
    toggleMode() {
      this.mode = this.mode === 'form' ? 'text' : 'form';
    },
  },
});
</script>

<style lang="scss" scoped>
.SequenceBuilder {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
}
.SequenceBuilder-row {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
  min-height: 22px;
}
.SequenceBuilder-row-at {
  font-family: monospace;
  opacity: 0.6;
  font-size: 10px;
}
.SequenceBuilder-row-time,
.SequenceBuilder-row-cmd,
.SequenceBuilder-row-arg {
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 2px;
  padding: 1px 3px;
  color: inherit;
  height: 20px;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: var(--imsde-node-playing-color, #888);
  }
}
.SequenceBuilder-row-time {
  width: 46px;
  flex: 0 0 auto;
}
.SequenceBuilder-row-cmd {
  min-width: 110px;
  flex: 0 0 auto;
}
.SequenceBuilder-row-arg {
  min-width: 60px;
  flex: 1 1 60px;
}
.SequenceBuilder-row-remove {
  width: 18px;
  height: 18px;
  font-size: 10px;
  padding: 0;
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
}
.SequenceBuilder-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
}
.SequenceBuilder-add,
.SequenceBuilder-toggle,
:deep(.is-button-link) {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 10px;
  text-decoration: underline;
  padding: 0;
  &:hover {
    color: var(--imsde-node-playing-color, inherit);
  }
}
.SequenceBuilder-text-input {
  width: 100%;
  font-family: monospace;
  font-size: 11px;
  resize: vertical;
  min-height: 28px;
}
.SequenceBuilder-text-warn {
  color: var(--color-main-error, #d33);
  font-size: 10px;
  margin: 2px 0 0;
}
</style>
