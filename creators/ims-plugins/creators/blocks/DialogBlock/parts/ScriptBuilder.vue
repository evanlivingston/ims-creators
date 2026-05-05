<template>
  <div class="ScriptBuilder" @mousedown.stop>
    <div v-if="mode === 'form'" class="ScriptBuilder-form">
      <div
        v-for="(cmd, cmd_idx) in commands"
        :key="cmd_idx"
        class="ScriptBuilder-row"
      >
        <select
          class="ScriptBuilder-row-cmd nodrag nopan"
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
          class="ScriptBuilder-row-arg is-input nodrag nopan"
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
          class="ScriptBuilder-row-remove is-button is-button-icon nodrag nopan"
          title="Remove command"
          @click="removeCommand(cmd_idx)"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
      <div v-if="!readonly" class="ScriptBuilder-footer">
        <button
          type="button"
          class="ScriptBuilder-add is-button-link nodrag nopan"
          @click="addCommand"
        >
          + Add command
        </button>
        <button
          type="button"
          class="ScriptBuilder-toggle is-button-link nodrag nopan"
          @click="toggleMode"
        >
          text
        </button>
      </div>
    </div>
    <div v-else class="ScriptBuilder-text">
      <textarea
        class="ScriptBuilder-text-input is-input nodrag nopan"
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
      <div v-if="!readonly && !parseFailed" class="ScriptBuilder-footer">
        <button
          type="button"
          class="ScriptBuilder-toggle is-button-link nodrag nopan"
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
  align-items: flex-start;
  gap: 3px;
  font-size: 11px;
}
.ScriptBuilder-footer {
  align-self: stretch;
}
.ScriptBuilder-row {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid rgba(175, 178, 255, 0.3);
  border-radius: 10px;
  background: rgba(175, 178, 255, 0.06);
  padding: 1px 4px 1px 8px;
}
.ScriptBuilder-row-cmd,
.ScriptBuilder-row-arg {
  font-size: 11px;
  background: transparent;
  border: none;
  padding: 0 2px;
  color: inherit;
  height: 20px;
  box-sizing: border-box;
  &:focus {
    outline: none;
    background: rgba(175, 178, 255, 0.1);
    border-radius: 4px;
  }
}
select.ScriptBuilder-row-cmd {
  appearance: none;
  padding-right: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='rgba(175,178,255,0.5)'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 2px center;
  cursor: pointer;
  min-width: 90px;
}
.ScriptBuilder-row-arg {
  min-width: 50px;
}
.ScriptBuilder-row-remove {
  width: 14px;
  height: 14px;
  font-size: 10px;
  padding: 0;
  opacity: 0.4;
  flex-shrink: 0;
  &:hover {
    opacity: 1;
    color: var(--color-danger, #ff5b45);
  }
}
.ScriptBuilder-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
}
.ScriptBuilder-add,
.ScriptBuilder-toggle,
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
.ScriptBuilder-text-input {
  width: 100%;
  font-family: monospace;
  font-size: 11px;
  resize: vertical;
  min-height: 28px;
}
.ScriptBuilder-text-warn {
  color: var(--color-main-error, #d33);
  font-size: 10px;
  margin: 2px 0 0;
}
</style>
