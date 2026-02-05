<template>
  <div class="WelcomeFormContentSelectProject">
    <div
      class="WelcomeFormContentSelectProject-back use-buttons-without-border"
    >
      <button class="is-button" @click="$emit('back')">
        <i class="ri-arrow-left-line"></i>
        {{ $t('desktop.welcome.back') }}
      </button>
    </div>
    <div class="WelcomeFormContentSelectProject-Other">
      <div class="WelcomeFormContentCreateProject-Action" v-if="hasProjects">
        <div class="WelcomeFormContentStart-Action-left">
          <div class="WelcomeFormContentStart-Action-title">{{$t('desktop.welcome.selectProject')}}</div>
          <div class="WelcomeFormContentStart-Action-subtext">{{$t('desktop.welcome.selectProject')}}</div>
        </div>
        <ims-select
          v-model="project"
          class="WelcomeFormContentCreateProject-Action-ImsSelect"
          :options="projects"
          :label-prop="'title'"
          :clearable="false"
          :placeholder="$t('desktop.welcome.selectProject')"
        >
          <template #list-footer>
            <button
              class="is-button is-button-dropdown-item"
              @click="createProject"
            >
              {{$t('desktop.welcome.createNewProject')}}
            </button>
          </template>
        </ims-select>
      </div>
      <div class="WelcomeFormContentCreateProject-Action">
          <div class="WelcomeFormContentStart-Action-left">
            <div class="WelcomeFormContentStart-Action-title">{{$t('desktop.welcome.location')}}</div>
            <div class="WelcomeFormContentStart-Action-subtext">{{$t('desktop.welcome.locationTooltip')}}</div>
          </div>
          <SelectFolderForm 
            :value="projectLocation"
            :placeholder="$t('desktop.welcome.location')"
            @update="projectLocation = $event">
          </SelectFolderForm>
        </div>
      </div>
      <AdvancedForm :project-folder-name="projectFolderName"
        @update:folder-name="projectFolderName = $event"></AdvancedForm>
      <div class="WelcomeFormContentSelectProject-create">
        <button class="is-button accent" @click="downloadProject" :disabled="!canCreate">{{$t('desktop.welcome.downloadProject')}}</button>
      </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AdvancedForm from './AdvancedForm.vue';
import ImsSelect from '~ims-app-base/components/Common/ImsSelect.vue';
import ImsInput from '~ims-app-base/components/Common/ImsInput.vue';
import type { ProjectShortInfo } from '~ims-app-base/logic/types/ProjectTypes';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import SelectFolderForm from '../Common/SelectFolderForm.vue';
import path from 'path';
import DesktopCreatorManager from '#logic/managers/DesktopCreatorManager';

export default defineComponent({
  name: 'WelcomeFormContentSelectProject',
  components: {
    AdvancedForm,
    ImsSelect,
    ImsInput,
    SelectFolderForm,
  },
  emits: ['back', 'create-project'],
  data() {
    return {
      projectLocation: '',
      project: null as ProjectShortInfo | null,
      projectFolderName: '',
    }
  },
  async mounted(){
    this.projectLocation = await window.imshost.shell.getDocumentsFolder();
  },
  computed: {
    projects() {
      return this.$getAppManager().get(DesktopCreatorManager).getRecentProjectList();
    },
    hasProjects(){
      return this.projects.length > 0;
    },
    canCreate(){
      return this.project && this.projectFolderName && this.projectLocation;
    }
  },
  methods: {
    async downloadProject() {
      if(this.canCreate){
        await this.$getAppManager().get(DesktopCreatorManager).openProjectWindow(path.join(this.projectLocation, this.projectFolderName), false);
      }
      else {
        this.$getAppManager()
          .get(UiManager)
          .showError(this.$t('fields.allFieldsMustBeFulled'));
      }
    },
    createProject(){
      this.$emit('create-project');
    }
  },
  watch: {
    project(){
      if(this.project){
        this.projectFolderName = this.project.title;
      }      
    }
  }
});
</script>

<style lang="scss">
.WelcomeFormContentSelectProject-back {
  display: flex;
  color: var(--local-sub-text-color);
  padding-left: 10px;
  padding-top: 5px;
}
.WelcomeFormContentSelectProject-create {
  text-align: center;
}
.WelcomeFormContentSelectProject-Other {
  padding: 10px 15px;
}
.WelcomeFormContentCreateProject-Action-ImsSelect{
  width: 60%;
}
</style>
