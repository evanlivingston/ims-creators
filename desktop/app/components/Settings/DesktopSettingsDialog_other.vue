<template>
  <div class="Form">
    <div class="StudioSettingsDialog_other-header"
        v-if="formSchemaFiltered.filterMaintenance.length < maintenance.length"
    >
        {{$t('desktop.settings.fields.maintenance')}}
    </div>
    <div class="Form-row StudioSettingsDialog-row  use-buttons-action">
        <button v-if="showButton('openLogsFolder')" class="is-button"
                @click="openLogsFolder"
        >{{$t('desktop.settings.fields.openLogsFolder')}}</button>
    </div>
  </div>
</template>

<script lang="ts" type="text/ecmascript-6">
import { defineComponent, type PropType } from 'vue';
import type { FormSchema } from "~ims-app-base/components/Form/FormBuilderTypes"
import ImsSelect from '~ims-app-base/components/Common/ImsSelect.vue';
import FormBuilder from '~ims-app-base/components/Form/FormBuilder.vue';
import FormBuilderModelBindObject from "~ims-app-base/components/Form/FormBuilderModelBindObject"
import UiManager from "~ims-app-base/logic/managers/UiManager"
import type { LangStr } from '~ims-app-base/logic/types/ProjectTypes';

export default defineComponent({
  name: 'DesktopSettingsDialog_common',
  components: {
    FormBuilder
  },
  props:{
    search: {},
    isEmpty: {}
  },
  data(){
    return {
        maintenance:[
            'openLogsFolder'
        ]
    }
  },
  computed: {
    formSchemaFiltered(){
        let answer=false;
        let filterMaintenance =[];
        if(this.search)
        {
            const research = new RegExp(".*"+this.search+".*",'i');
            for(const setting of this.maintenance){
                if(!research.test(this.$t('studio.settings.' + setting).valueOf())){
                    filterMaintenance.push(setting);
                }
            }
            if(filterMaintenance.length === this.maintenance.length) 
            answer=true;
        }
        return {answer,filterMaintenance};
    }
  },
  methods: {
    openLogsFolder(){
        const file = window.imshost.log.transports.file.getFile();
        if (file) window.imshost.shellApi.showFileInFolder(file.path)
    },
    showButton(title){
        return !this.formSchemaFiltered.filterMaintenance.includes(title);
    },
  },
  watch:{
    formSchemaFiltered(){
        this.$emit('update:isEmpty', this.formSchemaFiltered.answer)
    }
  }
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
.StudioSettingsDialog_other-header{
    margin-bottom: 15px;
    color: #666666;
    font-weight: bold;
}
</style>
