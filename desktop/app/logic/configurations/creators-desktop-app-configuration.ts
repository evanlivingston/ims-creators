import { defineAsyncComponent } from 'vue';
import { BaseAppConfiguration, type ProjectMenuItem } from '~ims-app-base/logic/configurations/base-app-configuration';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';

export default class CreatorsDesktopAppConfiguration extends BaseAppConfiguration {
  override name = 'creators-desktop';
  override appTitle = 'Creators';
  override isDesktop = true;
  
  override getProjectMenu(projectContext: IProjectContext): ProjectMenuItem[] {

    const ProjectTreePanel = defineAsyncComponent(
      () => import('~ims-app-base/components/GameDesign/ProjectTreePanel.vue'),
    );

    return [
        {
            name: 'project-gdd',
            title: projectContext.appManager.$t('translatedTitles.Gdd'),
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
