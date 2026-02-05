import { defineAsyncComponent } from 'vue';
import { BaseAppConfiguration, type ProjectMenuItem } from '~ims-app-base/logic/configurations/base-app-configuration';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';

export default class CreatorsDesktopAppConfiguration extends BaseAppConfiguration {
  override name = 'creators-desktop';
  override appTitle = 'Creators';
  override isDesktop = true;
  
  override getProjectMenu(appManager: IAppManager): ProjectMenuItem[] {
    const project_info = appManager.get(ProjectManager).getProjectInfo();
    if (!project_info) return [];

    const ProjectTreePanel = defineAsyncComponent(
      () => import('~ims-app-base/components/GameDesign/ProjectTreePanel.vue'),
    );

    return [
        {
            name: 'project-gdd',
            title: appManager.$t('translatedTitles.Gdd'),
            icon: 'ri-file-copy-2-fill',
            component: ProjectTreePanel,
            props: {
              type: 'gdd',
            },
            rightsRelatedWorkspaceName: 'gdd',
          }
    ].filter((x) => x) as ProjectMenuItem[];
  }
}
