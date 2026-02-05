<template>
  <div class="Form">
    <form-builder
        :form-schema="formSchemaFiltered"
        :form-model="formModel"
    ></form-builder>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { FormSchema } from "~ims-app-base/components/Form/FormBuilderTypes"
import ImsSelect from '~ims-app-base/components/Common/ImsSelect.vue';
import FormBuilder from '~ims-app-base/components/Form/FormBuilder.vue';
import FormBuilderModelBindObject from "~ims-app-base/components/Form/FormBuilderModelBindObject"
import UiManager from "~ims-app-base/logic/managers/UiManager"
import type { LangStr } from '~ims-app-base/logic/types/ProjectTypes';
import FormCheckBox from '~ims-app-base/components/Form/FormCheckBox.vue';
import UiPreferenceManager from '~ims-app-base/logic/managers/UiPreferenceManager';

export default defineComponent({
  name: 'DesktopSettingsDialog_common',
  components: {
    FormBuilder
  },
  props:{
    search: {},
    isEmpty: {}
  },
  computed: {
    formSchema(): FormSchema {
        return [
            {
                caption: this.$t('desktop.settings.fields.language'),
                prop: 'appLanguage',
                editor: ImsSelect,
                editorProps: {
                    getOptionLabel: (opt: any) => opt.title,
                    reduce: (opt: any) => opt.value,
                    options: [
                        {
                            value: 'en',
                            title: 'English - English'
                        }, 
                        {
                            value: 'ru',
                            title: 'Русский - Russian'
                        }
                    ]
                }
            },
            {
                caption: this.$t('desktop.settings.fields.theme'),
                prop: 'currentTheme',
                editor: ImsSelect,
                editorProps: {
                    getOptionLabel: (opt: any) => opt.title,
                    reduce: (opt: any) => opt.value,
                    options: [                         
                        {
                            value: 'ims-light',
                            title: this.$t('desktop.settings.fields.lightTheme')
                        },
                        {
                            value: 'ims-dark',
                            title: this.$t('desktop.settings.fields.darkTheme')
                        },
                    ]
                }
            },
            {
                caption: this.$t('desktop.settings.fields.autoUpdate'),
                prop: 'needAutoUpdate',
                editor: FormCheckBox,
                editorProps: {
                    value: this.needAutoUpdate,
                },
            }
        ]
    },
    formSchemaFiltered(){
        if(this.search)
        {
            const search = new RegExp(".*"+this.search+".*",'i');
            return [...this.formSchema].filter(field => {
                const caption = field ? (field.caption ? field.caption : "") : "";
                return search.test(caption);
            })
        }
        else return [...this.formSchema];
    },
    formModel(){
        return new FormBuilderModelBindObject(this);
    },
    appLanguage: {
        get(){
            return this.$getAppManager().get(UiManager).getLanguage();
        },
        set(val: LangStr){
            return this.$getAppManager().get(UiManager).setLanguage(val);
        }
    },
    currentTheme: {
      get() {
        return this.$getAppManager().get(UiManager).getColorTheme();
      },
      set(val: string) {
        this.$getAppManager().get(UiManager).setColorTheme(val);
      },
    },
    needAutoUpdate: {
      get() {
        return this.$getAppManager().get(UiPreferenceManager).getPreference('settings.autoUpdateCheck', true);
      },
      set(val: boolean) {
        this.$getAppManager().get(UiPreferenceManager).setPreference('settings.autoUpdateCheck', val);
      }, 
    }
  },
  watch:{
    formSchemaFiltered(){
        this.$emit('update:isEmpty', this.formSchemaFiltered.length === 0)
    }
  }
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>

</style>
