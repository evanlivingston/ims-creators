<template>
  <div class="ScriptBuilder">
    <div v-if="mode === 'form'" class="ScriptBuilder-form">
      <div
        v-for="(cmd, cmd_idx) in commands"
        :key="cmd_idx"
        class="ScriptBuilder-row"
      >
        <select
          class="ScriptBuilder-row-cmd"
          :value="cmd.name"
          :disabled="readonly"
          @change="onCommandChange(cmd_idx, $event)"
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
          v-for="(arg, arg_idx) in cmd.args"
          :key="arg_idx"
          class="ScriptBuilder-row-arg is-input"
          :type="argInputType(cmd, arg_idx)"
          :step="arg.kind === 'number' ? 'any' : undefined"
          :placeholder="argLabel(cmd, arg_idx)"
          :value="argDisplayValue(cmd, arg_idx)"
          :readonly="readonly"
          @input="onArgChange(cmd_idx, arg_idx, $event)"
        />
        <button
          v-if="!readonly"
          type="button"
          class="ScriptBuilder-row-remove is-button is-button-icon"
          title="Remove command"
          @click="removeCommand(cmd_idx)"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
      <button
        v-if="!readonly"
        type="button"
        class="ScriptBuilder-add is-button"
        @click="addCommand"
      >
        + Add command
      </button>
    </div>
    <div v-else class="ScriptBuilder-text">
      <textarea
        class="ScriptBuilder-text-input is-input"
        :value="modelValue"
        :readonly="readonly"
        rows="3"
        placeholder='SetVar("met_guard", true); AdjustRep("kalpin", 0.1)'
        @input="onTextInput"
      ></textarea>
      <p v-if="parseFailed" class="ScriptBuilder-text-warn">
        Form mode unavailable: this script uses syntax the simple builder
        doesn't recognise. Edit as text or rewrite using the standard
        commands.
      </p>
    </div>
    <div v-if="!readonly" class="ScriptBuilder-mode">
      <button
        type="button"
        class="is-button is-button-link"
        @click="toggleMode"
      >
        {{ mode === 'form' ? 'Switch to text' : 'Try form view' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  defaultArgFor,
  parseScript,
  serializeScript,
  SCRIPT_COMMANDS,
  type ScriptCommand,
  type ScriptCommandDef,
} from '../logic/scriptDsl';

export default defineComponent({
  name: 'ScriptBuilder',
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
      return parseScript(this.modelValue ?? '');
    },
    parseFailed(): boolean {
      return this.parsed.unsupported;
    },
    commands(): ScriptCommand[] {
      return this.parsed.commands;
    },
    commandDefs(): ScriptCommandDef[] {
      return SCRIPT_COMMANDS;
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
    cloneCommands(): ScriptCommand[] {
      return this.commands.map((c) => ({
        name: c.name,
        args: c.args.map((a) => ({ ...a })),
      }));
    },
    emitFromCommands(commands: ScriptCommand[]) {
      this.$emit('update:modelValue', serializeScript(commands));
    },
    argLabel(cmd: ScriptCommand, idx: number): string {
      const def = SCRIPT_COMMANDS.find((d) => d.name === cmd.name);
      return def?.args[idx]?.label ?? '';
    },
    argInputType(cmd: ScriptCommand, idx: number): string {
      const def = SCRIPT_COMMANDS.find((d) => d.name === cmd.name);
      const kind = def?.args[idx]?.kind ?? cmd.args[idx]?.kind ?? 'string';
      return kind === 'number' ? 'number' : 'text';
    },
    argDisplayValue(cmd: ScriptCommand, idx: number): string {
      const arg = cmd.args[idx];
      if (!arg) return '';
      if (arg.kind === 'bool') return arg.value ? 'true' : 'false';
      return String(arg.value);
    },
    onCommandChange(cmdIdx: number, evt: Event) {
      const target = evt.target as HTMLSelectElement;
      const def = SCRIPT_COMMANDS.find((d) => d.name === target.value);
      if (!def) return;
      const commands = this.cloneCommands();
      commands[cmdIdx] = {
        name: def.name,
        args: def.args.map((a) => defaultArgFor(a.kind)),
      };
      this.emitFromCommands(commands);
    },
    onArgChange(cmdIdx: number, argIdx: number, evt: Event) {
      const value = (evt.target as HTMLInputElement).value;
      const commands = this.cloneCommands();
      const def = SCRIPT_COMMANDS.find((d) => d.name === commands[cmdIdx].name);
      const argDef = def?.args[argIdx];
      if (argDef?.kind === 'number') {
        commands[cmdIdx].args[argIdx] = {
          kind: 'number',
          value: parseFloat(value) || 0,
        };
      } else if (argDef?.kind === 'bool') {
        commands[cmdIdx].args[argIdx] = {
          kind: 'bool',
          value: value === 'true',
        };
      } else {
        commands[cmdIdx].args[argIdx] = { kind: 'string', value };
      }
      this.emitFromCommands(commands);
    },
    addCommand() {
      const commands = this.cloneCommands();
      // Default to the first command type so the row has sensible inputs;
      // the writer can change it from the dropdown.
      const def = SCRIPT_COMMANDS[0];
      commands.push({
        name: def.name,
        args: def.args.map((a) => defaultArgFor(a.kind)),
      });
      this.emitFromCommands(commands);
    },
    removeCommand(cmdIdx: number) {
      const commands = this.cloneCommands();
      commands.splice(cmdIdx, 1);
      this.emitFromCommands(commands);
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
.ScriptBuilder {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}
.ScriptBuilder-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.ScriptBuilder-row-cmd,
.ScriptBuilder-row-arg {
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 2px;
  padding: 2px 4px;
  color: inherit;
  &:focus {
    outline: none;
    border-color: var(--imsde-node-playing-color, #888);
  }
}
.ScriptBuilder-row-cmd {
  min-width: 140px;
}
.ScriptBuilder-row-arg {
  min-width: 80px;
  flex: 1;
}
.ScriptBuilder-row-remove {
  width: 22px;
  height: 22px;
  font-size: 12px;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
}
.ScriptBuilder-add {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
}
.ScriptBuilder-text-input {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}
.ScriptBuilder-text-warn {
  color: var(--color-main-error, #d33);
  font-size: 11px;
  margin: 4px 0 0;
}
.ScriptBuilder-mode {
  display: flex;
  justify-content: flex-end;
  font-size: 11px;
}
.ScriptBuilder-mode .is-button-link {
  background: none;
  border: none;
  color: var(--imsde-node-playing-color, #888);
  cursor: pointer;
  font-size: 11px;
  text-decoration: underline;
  padding: 0;
  &:hover {
    color: inherit;
  }
}
</style>
