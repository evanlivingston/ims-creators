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
      <div v-if="project && hasWarning" class="WelcomeFormContentCreateProject-warning">
        <i class="ri-error-warning-fill"></i>
        {{ $t('desktop.welcome.sameProjectTitle') }}
      </div>
      <AdvancedForm :project-folder-name="projectFolderName"
        @update:folder-name="projectFolderName = $event"></AdvancedForm>
      <div class="WelcomeFormContentSelectProject-create">
        <button class="is-button accent" @click="downloadProject" :disabled="!canCreate || hasWarning">{{$t('desktop.welcome.downloadProject')}}</button>
      </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AdvancedForm from './AdvancedForm.vue';
import ImsSelect from '~ims-app-base/components/Common/ImsSelect.vue';
import ImsInput from '~ims-app-base/components/Common/ImsInput.vue';
import type { ProjectInfoWithParams, ProjectShortInfo } from '~ims-app-base/logic/types/ProjectTypes';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import SelectFolderForm from '../Common/SelectFolderForm.vue';
import path from 'path';
import DesktopCreatorManager from '#logic/managers/DesktopCreatorManager';
import { forbiddenFilenameCharsRegexp } from '#bridge/utils/regex';
import DesktopProjectManager from '#logic/managers/DesktopProjectManager';
import ApiManager from '~ims-app-base/logic/managers/ApiManager';
import { HttpMethods, Service } from '~ims-app-base/logic/managers/ApiWorker';

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
      hasWarning: false,
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
    },
    projectPath(){
      return path.join(this.projectLocation, this.projectFolderName);
    },
  },
  methods: {
    async checkExistsProject(val: string){
      this.hasWarning = await window.imshost.fs.exists(val);
    },
    async downloadProject() {
      if(this.canCreate && this.project){
        let rootWorkspaceId = null
        if (this.project.id){
          const projectInfo: ProjectInfoWithParams = await this.$getAppManager()
            .get(ApiManager)
            .call(Service.CREATORS, HttpMethods.GET, 'project/info', {
              pid: this.project.id,
            });
          rootWorkspaceId = projectInfo.rootWorkspaces.find((w) => w.name === 'gdd')?.id;
        }

        await this.$getAppManager().get(DesktopProjectManager).initializeLocalProject(this.projectPath, {
          id: this.project.id ?? null,
          title: this.project.title,
          rootWorkspaceId
        });
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
    async projectPath(new_val: string){
      await this.checkExistsProject(new_val);
    },
    project(){
      if(this.project){
        this.projectFolderName = this.project.title;
      }      
    },
    projectName(new_val: string){
      this.projectFolderName = new_val.trim().replace(forbiddenFilenameCharsRegexp, '_');
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
