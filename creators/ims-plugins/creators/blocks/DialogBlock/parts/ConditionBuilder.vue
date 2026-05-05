<template>
  <div class="ConditionBuilder" @mousedown.stop>
    <div v-if="mode === 'form'" class="ConditionBuilder-form">
      <div
        v-for="(clause, clause_idx) in formClauses"
        :key="clause_idx"
        class="ConditionBuilder-clause"
      >
        <span v-if="clause_idx > 0" class="ConditionBuilder-clause-conjunction">
          and
        </span>
        <button
          type="button"
          class="ConditionBuilder-clause-negate is-button is-button-icon nodrag nopan"
          :class="{ 'state-active': clause.negated }"
          :title="clause.negated ? 'Remove negation' : 'Negate (not)'"
          :disabled="readonly"
          @click="toggleNegate(clause_idx)"
        >
          <i class="ri-prohibited-line"></i>
        </button>
        <select
          class="ConditionBuilder-clause-term nodrag nopan"
          :value="clauseTermKey(clause)"
          :disabled="readonly"
          @change="onTermChange(clause_idx, $event)"
        >
          <option value="" disabled>Pick a variable or function</option>
          <optgroup v-if="variableOptions.length > 0" label="Dialogue variables">
            <option
              v-for="varName in variableOptions"
              :key="`v-${varName}`"
              :value="`var:${varName}`"
            >
              {{ varName }}
            </option>
          </optgroup>
          <optgroup label="Built-in functions">
            <option
              v-for="fn in functionOptions"
              :key="`f-${fn.name}`"
              :value="`fn:${fn.name}`"
              :title="fn.description"
            >
              {{ fn.name }}({{ fn.args.map((a) => a.label).join(', ') }})
            </option>
          </optgroup>
        </select>
        <template v-if="clause.left.kind === 'function'">
          <input
            v-for="(arg, arg_idx) in functionArgsFor(clause)"
            :key="arg_idx"
            class="ConditionBuilder-clause-arg is-input nodrag nopan"
            :type="arg.kind === 'number' ? 'number' : 'text'"
            :placeholder="arg.label"
            :value="argDisplayValue(clause, arg_idx)"
            :readonly="readonly"
            @input="onArgChange(clause_idx, arg_idx, $event)"
          />
        </template>
        <select
          class="ConditionBuilder-clause-op nodrag nopan"
          :value="clause.op ?? ''"
          :disabled="readonly"
          @change="onOpChange(clause_idx, $event)"
        >
          <option value="">(truthy)</option>
          <option value="==">==</option>
          <option value="!=">!=</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value=">=">&gt;=</option>
          <option value="<=">&lt;=</option>
        </select>
        <template v-if="clause.op">
          <input
            v-if="rightInputType(clause) === 'number'"
            class="ConditionBuilder-clause-right is-input nodrag nopan"
            type="number"
            step="any"
            :value="rightDisplayValue(clause)"
            :readonly="readonly"
            @input="onRightChange(clause_idx, 'number', $event)"
          />
          <select
            v-else-if="rightInputType(clause) === 'bool'"
            class="ConditionBuilder-clause-right nodrag nopan"
            :value="rightDisplayValue(clause)"
            :disabled="readonly"
            @change="onRightChange(clause_idx, 'bool', $event)"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
          <input
            v-else
            class="ConditionBuilder-clause-right is-input nodrag nopan"
            type="text"
            placeholder="value"
            :value="rightDisplayValue(clause)"
            :readonly="readonly"
            @input="onRightChange(clause_idx, 'string', $event)"
          />
        </template>
        <button
          v-if="!readonly"
          type="button"
          class="ConditionBuilder-clause-remove is-button is-button-icon nodrag nopan"
          title="Remove clause"
          @click="removeClause(clause_idx)"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
      <div v-if="!readonly" class="ConditionBuilder-footer">
        <button
          type="button"
          class="ConditionBuilder-add is-button-link nodrag nopan"
          @click="addClause"
        >
          + Add clause
        </button>
        <button
          type="button"
          class="ConditionBuilder-toggle is-button-link nodrag nopan"
          @click="toggleMode"
        >
          text
        </button>
      </div>
    </div>
    <div v-else class="ConditionBuilder-text">
      <textarea
        class="ConditionBuilder-text-input is-input nodrag nopan"
        :value="textValue"
        :readonly="readonly"
        rows="2"
        placeholder='e.g. met_guard == true and FactionRep("kalpin") > 0.3'
        @input="onTextInput"
      ></textarea>
      <p v-if="parseFailed" class="ConditionBuilder-text-warn">
        Form mode unavailable: this expression uses features (or, parentheses,
        nested logic) that the simple builder doesn't support. Edit as text or
        rewrite as AND clauses.
      </p>
      <div v-if="!readonly && !parseFailed" class="ConditionBuilder-footer">
        <button
          type="button"
          class="ConditionBuilder-toggle is-button-link nodrag nopan"
          @click="toggleMode"
        >
          form
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  CONDITION_FUNCTIONS,
  parseCondition,
  serializeCondition,
  type ConditionAst,
  type ConditionClause,
  type ConditionFunction,
  type ConditionLiteral,
} from '../logic/conditionExpression';

export default defineComponent({
  name: 'ConditionBuilder',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    variableNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      // 'form' = structured rows; 'text' = raw expression textarea.
      // Auto-flips to 'text' when the parser can't handle the expression.
      mode: 'form' as 'form' | 'text',
      // Raw text mirror so we don't reparse on every keystroke.
      textBuffer: this.modelValue ?? '',
    };
  },
  computed: {
    parsed(): ConditionAst {
      return parseCondition(this.modelValue ?? '');
    },
    parseFailed(): boolean {
      return this.parsed.kind === 'unsupported';
    },
    formClauses(): ConditionClause[] {
      return this.parsed.kind === 'and-list' ? this.parsed.clauses : [];
    },
    variableOptions(): string[] {
      return [...this.variableNames];
    },
    functionOptions(): ConditionFunction[] {
      return CONDITION_FUNCTIONS;
    },
    textValue(): string {
      return this.modelValue ?? '';
    },
    effectiveMode(): 'form' | 'text' {
      // Force text when parsing failed; otherwise honour user preference.
      if (this.parsed.kind === 'unsupported') return 'text';
      return this.mode;
    },
  },
  watch: {
    modelValue(val: string) {
      this.textBuffer = val ?? '';
    },
    parsed: {
      immediate: true,
      handler(p: ConditionAst) {
        if (p.kind === 'unsupported' && this.mode === 'form') {
          this.mode = 'text';
        }
      },
    },
  },
  methods: {
    clauseTermKey(clause: ConditionClause): string {
      if (clause.left.kind === 'identifier') return `var:${clause.left.name}`;
      return `fn:${clause.left.name}`;
    },
    functionArgsFor(clause: ConditionClause) {
      if (clause.left.kind !== 'function') return [];
      const fn = CONDITION_FUNCTIONS.find((f) => f.name === clause.left.name);
      return fn ? fn.args : [];
    },
    rightInputType(clause: ConditionClause): 'number' | 'bool' | 'string' {
      if (clause.left.kind === 'function') {
        const fn = CONDITION_FUNCTIONS.find(
          (f) => f.name === (clause.left as { name: string }).name,
        );
        if (fn?.returnKind === 'number') return 'number';
        return 'bool';
      }
      // Bare identifier - we don't know the variable's type; allow string/number.
      // Default to bool for compatibility with the most common pattern
      // (`var == true`); the user can switch to text mode for numeric checks.
      if (
        clause.right?.kind === 'number' ||
        clause.op === '>' ||
        clause.op === '<' ||
        clause.op === '>=' ||
        clause.op === '<='
      ) {
        return 'number';
      }
      if (clause.right?.kind === 'string') return 'string';
      return 'bool';
    },
    rightDisplayValue(clause: ConditionClause): string {
      if (!clause.right) return 'true';
      if (clause.right.kind === 'bool') return clause.right.value ? 'true' : 'false';
      return String(clause.right.value);
    },
    argDisplayValue(clause: ConditionClause, idx: number): string {
      if (clause.left.kind !== 'function') return '';
      const lit = clause.left.args[idx];
      if (!lit) return '';
      if (lit.kind === 'string') return lit.value;
      return String(lit.value);
    },
    emitFromClauses(clauses: ConditionClause[]) {
      const ast: ConditionAst = { kind: 'and-list', clauses };
      this.$emit('update:modelValue', serializeCondition(ast));
    },
    cloneClauses(): ConditionClause[] {
      return this.formClauses.map((c) => ({
        ...c,
        left:
          c.left.kind === 'function'
            ? { kind: 'function', name: c.left.name, args: [...c.left.args] }
            : { kind: 'identifier', name: c.left.name },
        right: c.right ? { ...c.right } : undefined,
      }));
    },
    onTermChange(clauseIdx: number, evt: Event) {
      const target = evt.target as HTMLSelectElement;
      const [kind, name] = target.value.split(':');
      const clauses = this.cloneClauses();
      if (kind === 'var') {
        clauses[clauseIdx].left = { kind: 'identifier', name };
      } else {
        const fn = CONDITION_FUNCTIONS.find((f) => f.name === name);
        clauses[clauseIdx].left = {
          kind: 'function',
          name,
          args: fn ? fn.args.map((a) => defaultLiteralFor(a.kind)) : [],
        };
        // Reset op/right because the term type might have changed.
        delete clauses[clauseIdx].op;
        delete clauses[clauseIdx].right;
      }
      this.emitFromClauses(clauses);
    },
    onOpChange(clauseIdx: number, evt: Event) {
      const target = evt.target as HTMLSelectElement;
      const clauses = this.cloneClauses();
      const c = clauses[clauseIdx];
      if (target.value === '') {
        delete c.op;
        delete c.right;
      } else {
        c.op = target.value as ConditionClause['op'];
        if (!c.right) {
          // Default right value based on the term's expected type.
          const inputType = this.rightInputType(c);
          c.right = defaultLiteralFor(inputType);
        }
      }
      this.emitFromClauses(clauses);
    },
    onRightChange(
      clauseIdx: number,
      kind: 'number' | 'bool' | 'string',
      evt: Event,
    ) {
      const value = (evt.target as HTMLInputElement | HTMLSelectElement).value;
      const clauses = this.cloneClauses();
      const c = clauses[clauseIdx];
      if (kind === 'number') {
        c.right = { kind: 'number', value: parseFloat(value) || 0 };
      } else if (kind === 'bool') {
        c.right = { kind: 'bool', value: value === 'true' };
      } else {
        c.right = { kind: 'string', value };
      }
      this.emitFromClauses(clauses);
    },
    onArgChange(clauseIdx: number, argIdx: number, evt: Event) {
      const value = (evt.target as HTMLInputElement).value;
      const clauses = this.cloneClauses();
      const c = clauses[clauseIdx];
      if (c.left.kind !== 'function') return;
      const fn = CONDITION_FUNCTIONS.find((f) => f.name === c.left.name);
      const argDef = fn?.args[argIdx];
      const argKind = argDef?.kind ?? 'string';
      c.left.args[argIdx] =
        argKind === 'number'
          ? { kind: 'number', value: parseFloat(value) || 0 }
          : { kind: 'string', value };
      this.emitFromClauses(clauses);
    },
    toggleNegate(clauseIdx: number) {
      const clauses = this.cloneClauses();
      clauses[clauseIdx].negated = !clauses[clauseIdx].negated;
      this.emitFromClauses(clauses);
    },
    addClause() {
      const clauses = this.cloneClauses();
      // Use the first available variable name, or '_' as a placeholder so the
      // clause survives the serialize → parse roundtrip (empty name → empty string).
      const defaultName = this.variableOptions[0] ?? '_';
      clauses.push({ negated: false, left: { kind: 'identifier', name: defaultName } });
      this.emitFromClauses(clauses);
    },
    removeClause(clauseIdx: number) {
      const clauses = this.cloneClauses();
      clauses.splice(clauseIdx, 1);
      this.emitFromClauses(clauses);
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

function defaultLiteralFor(kind: 'number' | 'bool' | 'string'): ConditionLiteral {
  if (kind === 'number') return { kind: 'number', value: 0 };
  if (kind === 'bool') return { kind: 'bool', value: true };
  return { kind: 'string', value: '' };
}
</script>

<style lang="scss" scoped>
.ConditionBuilder {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  font-size: 11px;
}
.ConditionBuilder-footer {
  align-self: stretch;
}
.ConditionBuilder-clause {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 4px 1px 6px;
}
.ConditionBuilder-clause-conjunction {
  font-style: italic;
  font-size: 10px;
  opacity: 0.5;
  padding: 0 2px;
}
.ConditionBuilder-clause-negate {
  width: 16px;
  height: 16px;
  font-size: 10px;
  padding: 0;
  opacity: 0.3;
  flex-shrink: 0;
  &.state-active {
    opacity: 1;
    color: var(--color-main-error, #d33);
  }
}
.ConditionBuilder-clause-term,
.ConditionBuilder-clause-op,
.ConditionBuilder-clause-right,
.ConditionBuilder-clause-arg {
  font-size: 11px;
  background: transparent;
  border: none;
  padding: 0 2px;
  color: inherit;
  height: 20px;
  box-sizing: border-box;
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
  }
}
select.ConditionBuilder-clause-term,
select.ConditionBuilder-clause-op,
select.ConditionBuilder-clause-right {
  appearance: none;
  padding-right: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='rgba(255,255,255,0.35)'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 2px center;
  cursor: pointer;
}
.ConditionBuilder-clause-term {
  min-width: 70px;
}
.ConditionBuilder-clause-op {
  min-width: 40px;
}
.ConditionBuilder-clause-right,
.ConditionBuilder-clause-arg {
  min-width: 45px;
}
.ConditionBuilder-clause-remove {
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
.ConditionBuilder-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
}
.ConditionBuilder-add,
.ConditionBuilder-toggle,
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
.ConditionBuilder-text-input {
  width: 100%;
  font-family: monospace;
  font-size: 11px;
  resize: vertical;
  min-height: 28px;
}
.ConditionBuilder-text-warn {
  color: var(--color-main-error, #d33);
  font-size: 10px;
  margin: 2px 0 0;
}
</style>
