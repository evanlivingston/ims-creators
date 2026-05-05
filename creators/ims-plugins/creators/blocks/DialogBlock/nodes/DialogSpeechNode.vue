<template>
  <div class="DialogSpeechNode DialogEditorNode">
    <div
      class="DialogSpeechNode-header DialogNode-header DialogEditorNode-header"
      :title="$t(`imsDialogEditor.nodes.${nodeDescriptor.name}.description`)"
    >
      <div>
        <ExecHandle
          id="in"
          type="target"
          :position="Position.Left"
        ></ExecHandle>
        <i :class="nodeDescriptor.icon"></i>
        {{ $t(`imsDialogEditor.nodes.${nodeDescriptor.name}.title`) }}
      </div>
      <div v-if="!readonly" class="DialogSpeechNode-header-settings">
        <dialog-speech-node-attach-cover
          v-if="!coverValue"
          v-model="coverValue"
        ></dialog-speech-node-attach-cover>
        <button
          class="is-button is-button-icon"
          :title="$t('gddPage.settings')"
          @click="openSpeechParametersDialog()"
        >
          <i class="ri-settings-3-fill" />
        </button>
      </div>
    </div>
    <div class="DialogSpeechNode-body DialogEditorNode-body">
      <div v-if="coverValue" class="DialogSpeechNode-cover">
        <file-presenter
          :value="coverValue"
          :inline="true"
          class="DialogSpeechNode-cover-image"
        ></file-presenter>
        <menu-button
          v-if="!readonly"
          v-model:shown="coverMenuShown"
          class="DialogSpeechNode-cover-menu"
          :class="{ 'state-active': coverMenuShown }"
        >
          <menu-list :menu-list="coverMenu"></menu-list>
        </menu-button>
      </div>
      <div class="DialogSpeechNode-content">
        <template v-for="(variable, var_index) of mainSpeechList" :key="variable.name">
          <div
            v-if="
              variable.name === 'script' &&
              !isInputPinConnected(variable.name)
            "
            class="DialogSpeechNode-prop-line DialogSpeechNode-prop-builder"
          >
            <span class="DialogSpeechNode-prop-builder-caption">
              {{ getMainVariableCaption(var_index) }}:
            </span>
            <ScriptBuilder
              class="DialogSpeechNode-prop-builder-input"
              :model-value="
                typeof nodeDataController.values[variable.name] === 'string'
                  ? (nodeDataController.values[variable.name] as string)
                  : ''
              "
              :readonly="readonly"
              @update:model-value="nodeDataController.setValue(variable.name, $event)"
            ></ScriptBuilder>
          </div>
          <div
            v-else-if="
              variable.name === 'sequence' &&
              !isInputPinConnected(variable.name)
            "
            class="DialogSpeechNode-prop-line DialogSpeechNode-prop-builder"
          >
            <span class="DialogSpeechNode-prop-builder-caption">
              {{ getMainVariableCaption(var_index) }}:
            </span>
            <SequenceBuilder
              class="DialogSpeechNode-prop-builder-input"
              :model-value="
                typeof nodeDataController.values[variable.name] === 'string'
                  ? (nodeDataController.values[variable.name] as string)
                  : ''
              "
              :readonly="readonly"
              @update:model-value="nodeDataController.setValue(variable.name, $event)"
            ></SequenceBuilder>
          </div>
          <DataField
            v-else
            :ref="'main-' + variable.name"
            class="DialogSpeechNode-prop-line"
            :model-value="nodeDataController.values[variable.name] ?? null"
            :play-value="
              playingNodeData?.values
                ? playingNodeData.values[variable.name]
                : null
            "
            :in-id="generateDataPinId(false, variable.name)"
            :node-data-controller="nodeDataController"
            :readonly="readonly"
            :title="variable.description ?? ''"
            :placeholder="
              variable.name === 'text'
                ? $t('imsDialogEditor.speech.enterSpeech')
                : ''
            "
            :caption="getMainVariableCaption(var_index)"
            @update:model-value="
              nodeDataController.setValue(variable.name, $event)
            "
          ></DataField>
        </template>
        <div v-if="options.length > 0" class="DialogSpeechNode-options">
          <ContextMenuZone
            v-for="(option, option_index) of options"
            :key="option_index"
            class="DialogSpeechNode-options-one"
            :class="{
              'state-unavailable':
                isPlaying && !playOptionConditionPass(option_index),
            }"
            :menu-list="getOptionContextMenu(option, option_index)"
            ignoring-css-selector=".DataField-input"
          >
            <div class="DialogSpeechNode-options-one-common">
              <div
                v-for="(field, field_idx) of getActiveExtraFields(option)"
                :key="field.key"
                class="DialogSpeechNode-options-one-param"
                :class="{ 'type-first': field_idx === 0 }"
              >
                <div
                  v-if="
                    field.key === 'condition' &&
                    !isInputPinConnected(field.key, option_index)
                  "
                  class="DialogSpeechNode-options-one-param-input DialogSpeechNode-options-one-condition"
                >
                  <span class="DialogSpeechNode-options-one-condition-caption">
                    {{ field.caption }}:
                  </span>
                  <ConditionBuilder
                    class="DialogSpeechNode-options-one-condition-input"
                    :model-value="
                      typeof option.values[field.key] === 'string'
                        ? (option.values[field.key] as string)
                        : ''
                    "
                    :variable-names="dialogueVariableNames"
                    :readonly="readonly"
                    @update:model-value="
                      nodeDataController.setOptionValue(
                        option_index,
                        field.key,
                        $event,
                      )
                    "
                  ></ConditionBuilder>
                </div>
                <div
                  v-else-if="
                    field.key === 'script' &&
                    !isInputPinConnected(field.key, option_index)
                  "
                  class="DialogSpeechNode-options-one-param-input DialogSpeechNode-options-one-condition"
                >
                  <span class="DialogSpeechNode-options-one-condition-caption">
                    {{ field.caption }}:
                  </span>
                  <ScriptBuilder
                    class="DialogSpeechNode-options-one-condition-input"
                    :model-value="
                      typeof option.values[field.key] === 'string'
                        ? (option.values[field.key] as string)
                        : ''
                    "
                    :readonly="readonly"
                    @update:model-value="
                      nodeDataController.setOptionValue(
                        option_index,
                        field.key,
                        $event,
                      )
                    "
                  ></ScriptBuilder>
                </div>
                <DataField
                  v-else-if="field.key !== 'dialogue'"
                  class="DialogSpeechNode-options-one-param-input"
                  :in-id="generateDataPinId(false, field.key, option_index)"
                  :placeholder="$t('imsDialogEditor.speech.enterText')"
                  :node-data-controller="nodeDataController"
                  :caption="field.caption"
                  :readonly="readonly"
                  :model-value="option.values[field.key] ?? null"
                  :play-value="
                    playingNodeData?.options &&
                    playingNodeData.options[option_index] &&
                    playingNodeData.options[option_index].values
                      ? playingNodeData.options[option_index].values[field.key]
                      : null
                  "
                  @update:model-value="
                    nodeDataController.setOptionValue(
                      option_index,
                      field.key,
                      $event,
                    )
                  "
                ></DataField>
                <div
                  v-else
                  class="DialogSpeechNode-options-one-param-input DialogSpeechNode-options-one-dialogue"
                >
                  <span class="DialogSpeechNode-options-one-dialogue-caption">
                    {{ field.caption }}:
                  </span>
                  <AssetSelectorPropEditor
                    class="DialogSpeechNode-options-one-dialogue-input"
                    :model-value="option.dialogue ?? null"
                    :where="dialogueAssetWhere"
                    :allow-custom="true"
                    :nullable="true"
                    @update:model-value="onDialogueJumpSelected(option_index, $event)"
                  ></AssetSelectorPropEditor>
                </div>
              </div>
              <div
                v-for="(variable, var_index) of optionSpeechList"
                :key="variable.name"
                class="DialogSpeechNode-options-one-param"
                :class="{
                  ' type-first':
                    var_index === 0 && getActiveExtraFields(option).length === 0,
                }"
              >
                <DataField
                  class="DialogSpeechNode-options-one-param-input"
                  :model-value="
                    nodeDataController.getOptionValue(
                      option_index,
                      variable.name,
                    )
                  "
                  :play-value="
                    playingNodeData?.options &&
                    playingNodeData.options[option_index] &&
                    playingNodeData.options[option_index].values
                      ? playingNodeData.options[option_index].values[
                          variable.name
                        ]
                      : null
                  "
                  :in-id="generateDataPinId(false, variable.name, option_index)"
                  :caption="getOptionVariableCaption(option_index, var_index)"
                  :node-data-controller="nodeDataController"
                  :readonly="readonly"
                  :title="variable.description ?? ''"
                  :placeholder="
                    variable.name === 'text'
                      ? $t('imsDialogEditor.speech.enterText')
                      : ''
                  "
                  @update:model-value="
                    nodeDataController.setOptionValue(
                      option_index,
                      variable.name,
                      $event,
                    )
                  "
                ></DataField>
              </div>
            </div>
            <div
              v-if="isPlaying && playOptionConditionPass(option_index)"
              class="DialogSpeechNode-options-one-select"
            >
              <button
                class="is-button"
                @click="dialogPlayer.playChoose(option_index)"
              >
                {{ $t('imsDialogEditor.play.select') }}
              </button>
            </div>
            <div class="DialogSpeechNode-options-one-handle">
              <ExecHandle
                :id="`out-${option_index + 1}`"
                type="source"
                :position="Position.Right"
              ></ExecHandle>
            </div>
            <menu-button class="DialogSpeechNode-options-one-menu">
              <menu-list
                :menu-list="getOptionContextMenu(option, option_index)"
              />
            </menu-button>
          </ContextMenuZone>
        </div>
        <div
          v-if="!readonly"
          class="DialogSpeechNode-addOption"
          @click="addOption"
        >
          + {{ $t('imsDialogEditor.speech.addOption') }}
        </div>
      </div>
      <ExecHandle
        v-if="options.length === 0"
        id="out"
        type="source"
        :position="Position.Right"
      ></ExecHandle>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Position } from '@vue-flow/core';
import type { NodeDescriptor } from './NodeDescriptor';
import ExecHandle from '../parts/ExecHandle.vue';
import type {
  NodeDataController,
  NodeDataOption,
} from '../editor/NodeDataController';
import ContextMenuZone from '~ims-app-base/components/Common/ContextMenuZone.vue';
import DataField from '../parts/DataField.vue';
import {
  AssetPropType,
  type AssetPropValueFile,
} from '~ims-app-base/logic/types/Props';
import { convertTranslatedTitle } from '~ims-app-base/logic/utils/assets';
import { generateDataPinId } from '../editor/DialogEditor';
import ConfirmDialog from '~ims-app-base/components/Common/ConfirmDialog.vue';
import type { ScriptBlockPlainPropValue } from '../logic/nodeStoring';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import type { DialogBlockController } from '../editor/DialogBlockController';
import SpeechParametersDialog from '../dialogs/SpeechParametersDialog.vue';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import MenuList from '~ims-app-base/components/Common/MenuList.vue';
import type { ScriptPlayNode } from '../play/ScriptPlayNode';
import type { DialogPlayer } from '../play/DialogPlayer';
import DialogSpeechNodeAttachCover from './DialogSpeechNodeAttachCover.vue';
import FilePresenter from '~ims-app-base/components/File/FilePresenter.vue';
import AssetSelectorPropEditor from '~ims-app-base/components/Props/AssetSelectorPropEditor.vue';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import type { AssetPropValue } from '~ims-app-base/logic/types/Props';
import ConditionBuilder from '../parts/ConditionBuilder.vue';
import ScriptBuilder from '../parts/ScriptBuilder.vue';
import SequenceBuilder from '../parts/SequenceBuilder.vue';

// Dialogue Type asset id (design/Types/Dialogue.ima.json). Used to scope the
// cross-conversation jump picker to dialogue assets only.
const DIALOGUE_TYPE_ID = 'a9afe517-a79f-4753-9e34-3a39fde65766';

// Well-known optional fields the dialogue runner reads on each option.
// `condition` is a string expression. `priority` orders options. `falseConditionAction`
// controls hide/disable on failed condition. `script` is an inline DSL run on select.
// `dialogue` is special: stored on option (sibling to `next`), not in option.values.
type ExtraOptionField = {
  key: string;
  caption: string;
  pinTypes: { Type: AssetPropType }[];
  defaultValue: ScriptBlockPlainPropValue | null;
  // i18n keys for the add/remove menu items + icons
  addMenu: { label: string; icon: string };
  removeMenu: { label: string; confirmTitle: string; confirmBody: string; icon: string };
};

const EXTRA_OPTION_FIELDS: ExtraOptionField[] = [
  {
    key: 'condition',
    caption: '[[t:Condition]]',
    pinTypes: [{ Type: AssetPropType.STRING }],
    defaultValue: '',
    addMenu: { label: 'imsDialogEditor.speech.addOptionCondition', icon: 'ri-filter-fill' },
    removeMenu: {
      label: 'imsDialogEditor.speech.deleteOptionCondition',
      confirmTitle: 'imsDialogEditor.speech.deleteOptionCondition',
      confirmBody: 'imsDialogEditor.speech.deleteOptionConditionConfirm',
      icon: 'ri-filter-off-fill',
    },
  },
  {
    key: 'priority',
    caption: '[[t:Priority]]',
    pinTypes: [{ Type: AssetPropType.INTEGER }],
    defaultValue: 0,
    addMenu: { label: 'imsDialogEditor.speech.addOptionPriority', icon: 'ri-sort-desc' },
    removeMenu: {
      label: 'imsDialogEditor.speech.deleteOptionPriority',
      confirmTitle: 'imsDialogEditor.speech.deleteOptionPriority',
      confirmBody: 'imsDialogEditor.speech.deleteOptionPriorityConfirm',
      icon: 'ri-sort-asc',
    },
  },
  {
    key: 'falseConditionAction',
    caption: '[[t:False Condition Action]]',
    pinTypes: [{ Type: AssetPropType.STRING }],
    defaultValue: 'hide',
    addMenu: { label: 'imsDialogEditor.speech.addOptionFalseAction', icon: 'ri-eye-off-line' },
    removeMenu: {
      label: 'imsDialogEditor.speech.deleteOptionFalseAction',
      confirmTitle: 'imsDialogEditor.speech.deleteOptionFalseAction',
      confirmBody: 'imsDialogEditor.speech.deleteOptionFalseActionConfirm',
      icon: 'ri-eye-line',
    },
  },
  {
    key: 'script',
    caption: '[[t:Inline Script]]',
    pinTypes: [{ Type: AssetPropType.TEXT }],
    defaultValue: '',
    addMenu: { label: 'imsDialogEditor.speech.addOptionScript', icon: 'ri-code-line' },
    removeMenu: {
      label: 'imsDialogEditor.speech.deleteOptionScript',
      confirmTitle: 'imsDialogEditor.speech.deleteOptionScript',
      confirmBody: 'imsDialogEditor.speech.deleteOptionScriptConfirm',
      icon: 'ri-code-line',
    },
  },
  {
    key: 'dialogue',
    caption: '[[t:Cross-Conversation Jump]]',
    pinTypes: [],
    defaultValue: null,
    addMenu: { label: 'imsDialogEditor.speech.addOptionDialogueJump', icon: 'ri-share-forward-fill' },
    removeMenu: {
      label: 'imsDialogEditor.speech.deleteOptionDialogueJump',
      confirmTitle: 'imsDialogEditor.speech.deleteOptionDialogueJump',
      confirmBody: 'imsDialogEditor.speech.deleteOptionDialogueJumpConfirm',
      icon: 'ri-share-forward-2-line',
    },
  },
];

export default defineComponent({
  name: 'DialogSpeechNode',
  components: {
    ExecHandle,
    ContextMenuZone,
    DataField,
    MenuButton,
    MenuList,
    DialogSpeechNodeAttachCover,
    FilePresenter,
    AssetSelectorPropEditor,
    ConditionBuilder,
    ScriptBuilder,
    SequenceBuilder,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    dialogController: {
      type: Object as PropType<DialogBlockController>,
      required: true,
    },
    nodeDescriptor: {
      type: Object as PropType<NodeDescriptor>,
      required: true,
    },
    nodeDataController: {
      type: Object as PropType<NodeDataController>,
      required: true,
    },
    selected: {
      type: Boolean,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    playingNodeData: {
      type: [Object, null] as PropType<ScriptPlayNode> | null,
      default: null,
    },
    dialogPlayer: {
      type: Object as PropType<DialogPlayer>,
      required: true,
    },
  },
  data() {
    return {
      coverMenuShown: false,
    };
  },
  computed: {
    Position() {
      return Position;
    },
    options() {
      return this.nodeDataController.options;
    },
    mainSpeechList() {
      return this.dialogController.getMainSpeech();
    },
    optionSpeechList() {
      return this.dialogController.getOptionSpeech();
    },
    isPlaying() {
      return this.dialogPlayer.currentPlayingNode?.id === this.id;
    },
    coverValue: {
      get() {
        return this.nodeDataController.values[
          'cover'
        ] as null | AssetPropValueFile;
      },
      set(val: null | AssetPropValueFile) {
        this.nodeDataController.setValue('cover', val);
      },
    },
    coverMenu() {
      return [
        {
          title: this.$t('imsDialogEditor.speech.dettachCover'),
          action: () => this.deleteCover(),
          icon: 'delete',
          danger: true,
        },
      ];
    },
    dialogueAssetWhere() {
      return {
        workspaceids:
          this.$getAppManager()
            .get(ProjectManager)
            .getWorkspaceIdByName('gdd') ?? null,
        typeids: DIALOGUE_TYPE_ID,
      };
    },
    dialogueVariableNames(): string[] {
      // Variable names defined on this dialogue (script.variables.own).
      // Fed to the ConditionBuilder so writers can pick from a dropdown
      // instead of typing raw identifiers.
      return this.dialogController
        .getVariables()
        .map((v) => v.name)
        .filter(Boolean);
    },
  },
  watch: {
    options() {
      this.updatePins();
    },
    mainSpeechList() {
      this.updatePins();
    },
    optionSpeechList() {
      this.updatePins();
    },
  },
  mounted() {
    this.updatePins();
  },
  methods: {
    async deleteCover() {
      const confirm = await this.$getAppManager()
        .get(DialogManager)
        .show(
          ConfirmDialog,
          {
            header: this.$t('imsDialogEditor.speech.dettachCover'),
            message: this.$t('imsDialogEditor.speech.dettachCoverConfirm'),
            danger: true,
          },
          this,
        );
      if (!confirm) {
        return;
      }
      this.coverValue = null;
      this.coverMenuShown = false;
    },
    getMainVariableCaption(var_index: number) {
      const variable = this.mainSpeechList[var_index];
      return variable &&
        variable.name === 'text' &&
        var_index === this.mainSpeechList.length - 1 &&
        variable.type &&
        !this.isInputPinConnected(variable.name)
        ? ''
        : convertTranslatedTitle(variable.title, (key: any) => this.$t(key));
    },
    getOptionVariableCaption(option_index: number, var_index: number) {
      const variable = this.optionSpeechList[var_index];
      const caption =
        variable.name === 'text' &&
        var_index === 0 &&
        variable.type &&
        !this.isInputPinConnected(variable.name)
          ? ''
          : convertTranslatedTitle(variable.title, (key: any) => this.$t(key));
      return var_index === 0
        ? option_index + 1 + (caption ? '. ' + caption : '')
        : caption;
    },
    generateDataPinId,
    isInputPinConnected(param: string, option_index?: number) {
      return this.nodeDataController.isPinConnected(
        generateDataPinId(false, param, option_index),
      );
    },
    convertTranslatedTitle(title: string) {
      return convertTranslatedTitle(title, (...args) => this.$t(...args));
    },
    updatePins() {
      for (const variable of this.mainSpeechList) {
        this.nodeDataController.setPinDataType(
          generateDataPinId(false, variable.name),
          variable.type,
        );
      }
      for (
        let option_index = 0;
        option_index < this.options.length;
        option_index++
      ) {
        for (const variable of this.optionSpeechList) {
          this.nodeDataController.setPinDataType(
            generateDataPinId(false, variable.name, option_index),
            variable.type,
          );
        }
        for (const field of EXTRA_OPTION_FIELDS) {
          if (field.pinTypes.length === 0) continue;
          this.nodeDataController.setPinDataType(
            generateDataPinId(false, field.key, option_index),
            field.pinTypes,
          );
        }
      }
    },
    activate() {
      for (const variable_name of Object.keys(
        this.dialogController.state.__settings.speech.main,
      )) {
        if (
          !this.$refs['main-' + variable_name] ||
          (this.$refs['main-' + variable_name] as any).length === 0
        )
          continue;
        if (!this.nodeDataController.values[variable_name]) {
          (this.$refs['main-' + variable_name] as any)[0].focus();
          return;
        }
      }
    },
    async addOption() {
      const new_index = this.nodeDataController.addOption();
      this.updatePins();
      await this.$nextTick();
      let option_input = this.$refs['option-' + new_index];
      if (Array.isArray(option_input)) option_input = option_input[0];
      if (!option_input) return;
      (option_input as any).focus();
    },
    setOptionValue(option_index: number, value: ScriptBlockPlainPropValue) {
      this.nodeDataController.setOptionValue(option_index, 'text', value);
    },
    isExtraFieldActive(option: NodeDataOption, field: ExtraOptionField) {
      if (field.key === 'dialogue') {
        return option.dialogue !== undefined && option.dialogue !== null;
      }
      return option.values[field.key] !== undefined;
    },
    getActiveExtraFields(option: NodeDataOption) {
      return EXTRA_OPTION_FIELDS.filter((field) =>
        this.isExtraFieldActive(option, field),
      ).map((field) => ({
        ...field,
        caption: convertTranslatedTitle(field.caption, (key: any) =>
          this.$t(key),
        ),
      }));
    },
    onDialogueJumpSelected(
      option_index: number,
      val: AssetPropValue | null,
    ) {
      // AssetSelectorPropEditor emits either an AssetPropValueAsset
      // ({AssetId, Title, Name}), a plain string for custom-typed values, or
      // null when cleared. Store as-is; the web save layer's _simplifyValue
      // flattens {AssetId, Title} -> Title at flush time so the runner reads
      // option.dialogue as a plain string.
      if (val === null) {
        // Picker emits null for "clear selection". Keep the field enabled by
        // storing an empty string rather than fully deleting it.
        this.nodeDataController.setOptionDialogue(option_index, '');
        return;
      }
      this.nodeDataController.setOptionDialogue(option_index, val);
    },
    getOptionContextMenu(option: NodeDataOption, option_index: number) {
      if (this.readonly) return [];
      const items: any[] = [];
      for (const field of EXTRA_OPTION_FIELDS) {
        const active = this.isExtraFieldActive(option, field);
        if (active) {
          items.push({
            title: this.$t(field.removeMenu.label),
            icon: field.removeMenu.icon,
            action: async () => {
              const confirm = await this.$getAppManager()
                .get(DialogManager)
                .show(ConfirmDialog, {
                  header: this.$t(field.removeMenu.confirmTitle),
                  message: this.$t(field.removeMenu.confirmBody),
                  danger: true,
                });
              if (!confirm) return;
              if (field.key === 'dialogue') {
                this.nodeDataController.setOptionDialogue(option_index, null);
              } else {
                this.nodeDataController.deleteOptionValue(
                  option_index,
                  field.key,
                );
              }
            },
          });
        } else {
          items.push({
            title: this.$t(field.addMenu.label),
            icon: field.addMenu.icon,
            action: async () => {
              if (field.key === 'dialogue') {
                this.nodeDataController.setOptionDialogue(option_index, '');
              } else {
                this.nodeDataController.setOptionValue(
                  option_index,
                  field.key,
                  field.defaultValue,
                );
              }
            },
          });
        }
      }
      items.push({
        title: this.$t('imsDialogEditor.speech.deleteOption'),
        icon: 'delete',
        danger: true,
        action: async () => {
          const confirm = await this.$getAppManager()
            .get(DialogManager)
            .show(ConfirmDialog, {
              header: this.$t('imsDialogEditor.speech.deleteOption'),
              message: this.$t('imsDialogEditor.speech.deleteOptionConfirm'),
              danger: true,
            });
          if (!confirm) return;
          this.nodeDataController.deleteOption(option_index);
        },
      });
      return items;
    },
    async openSpeechParametersDialog() {
      await this.$getAppManager()
        .get(DialogManager)
        .show(SpeechParametersDialog, {
          dialogController: this.dialogController,
        });
    },
    playOptionConditionPass(option_index: number) {
      if (!this.playingNodeData) {
        return true;
      }
      if (
        !this.playingNodeData.options ||
        !this.playingNodeData.options[option_index]
      ) {
        return true;
      }
      const option = this.playingNodeData.options[option_index];
      if (!option.values) {
        return true;
      }
      const cond = option.values.condition;
      if (cond === undefined) return true;
      if (typeof cond === 'string') return true;
      return !!cond;
    },
  },
});
</script>

<style lang="scss" scoped>
.DialogSpeechNode-prop-line {
  display: flex;
  margin-bottom: 10px;
  align-items: baseline;
}

.DialogSpeechNode-prop-line,
.DialogSpeechNode-options-one-param {
  &:not(:hover):deep(
      .DataField-in:not(.state-connected),
      .DataField-out:not(.state-connected)
    ) {
    opacity: 0;
  }
}
.DialogSpeechNode {
  max-width: 600px;
}

.DialogSpeechNode-prop-caption {
  margin-right: 5px;
}
.DialogSpeechNode-prop-content {
  flex: 1;
}

.DialogSpeechNode-header {
  padding: 7px 10px;
  font-size: 14px;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.DialogSpeechNode-header-settings {
  &:deep(.is-button) {
    color: var(--imsde-node-header-text-color);
  }
  display: flex;
}
.DialogSpeechNode-content {
  padding-top: 7px;
}
.DialogSpeechNode-body {
  padding-bottom: 7px;
}
.DialogSpeechNode-addOption {
  font-weight: bold;
  font-size: 12px;
  padding: 10px 10px 0 10px;
  cursor: pointer;
  border-top: 1px solid var(--imsde-node-content-inner-border-color);
}
.DialogSpeechNode-contentPlaceholder {
  font-style: italic;
}

.DialogSpeechNode-speechContent {
  margin: 5px 0;
}

.DialogSpeechNode-options-one {
  position: relative;
  border-top: 1px solid var(--imsde-node-content-inner-border-color);
  padding: 10px 0;
  display: flex;
  align-items: center;
  &.state-unavailable {
    opacity: 0.5;
  }
}
.DialogSpeechNode-options-one-common {
  flex: 1;
}

.DialogSpeechNode-options-one-param {
  &:not(:last-child) {
    margin-bottom: 10px;
  }
  &:not(.type-first) {
    .DialogSpeechNode-options-one-param-input {
      padding-left: 22px;
    }
  }
}

.DialogSpeechNode-prop-content {
  min-width: 100px;
}

.DialogSpeechNode-prop-builder {
  display: flex;
  align-items: flex-start;
  padding: 0 10px;
  gap: 6px;
}
.DialogSpeechNode-prop-builder-caption {
  color: var(--imsde-node-content-caption-color, inherit);
  font-size: 11px;
  flex: 0 0 auto;
  padding-top: 2px;
}
.DialogSpeechNode-prop-builder-input {
  flex: 1 1 auto;
  min-width: 0;
}

.DialogSpeechNode-options-one-condition {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.DialogSpeechNode-options-one-condition-caption {
  color: var(--imsde-node-content-caption-color, inherit);
  font-size: 11px;
  flex: 0 0 auto;
  padding-top: 2px;
}
.DialogSpeechNode-options-one-condition-input {
  flex: 1 1 auto;
  min-width: 0;
}

.DialogSpeechNode-options-one-dialogue {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
}
.DialogSpeechNode-options-one-dialogue-caption {
  color: var(--imsde-node-content-caption-color, inherit);
  white-space: nowrap;
}
.DialogSpeechNode-options-one-dialogue-input {
  flex: 1;
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

.DialogSpeechNode-options-one-menu {
  opacity: 0;
  margin-right: 10px;
}
.DialogSpeechNode-options-one:hover {
  .DialogSpeechNode-options-one-menu {
    opacity: 100%;
  }
}

.DialogSpeechNode-options-one-select > .is-button {
  --button-border-color: var(--imsde-node-playing-color);
  &:not(:hover) {
    --button-text-color: var(--imsde-node-playing-color);
  }
  &:hover {
    --button-bg-color: var(--imsde-node-playing-color);
  }
}
.DialogSpeechNode-cover {
  position: relative;
}
.DialogSpeechNode-cover-image {
  max-width: 100%;
  object-fit: cover;
  max-height: 400px;
  display: block;
  margin: 0 auto;
}

.DialogSpeechNode-cover-menu {
  position: absolute;
  top: 0px;
  right: 0px;
  background-color: var(--local-bg-color);
  display: none;
  border-bottom-left-radius: 2px;
  color: var(--local-text-color);
}

.DialogSpeechNode-cover:hover .DialogSpeechNode-cover-menu,
.DialogSpeechNode-cover-menu.state-active {
  display: flex;
}
</style>
