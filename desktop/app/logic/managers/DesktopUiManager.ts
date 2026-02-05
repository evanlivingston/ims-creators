import type { RouteLocationNamedRaw } from 'vue-router';
import type { AppManagerContext } from '~ims-app-base/logic/managers/IAppManager';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import type { LangStr } from '~ims-app-base/logic/types/ProjectTypes';
import { DesktopTabController } from '../types/DesktopTabController';

export default class DesktopUiManager extends UiManager {
  public tabController = new DesktopTabController(this.appManager);

  async loadLanguage(){
    const saved_lang = await window.imshost.app.getLanguage();
    if (saved_lang && this.getLanguage() !== saved_lang) {
      this.setLanguage(saved_lang as LangStr);
    }
  }
  
  protected override async setLanguageSave(lang: string): Promise<void> {
    await window.imshost.app.setLanguage(lang);
  }

  override async openLink(to: RouteLocationNamedRaw, new_tab = false){
    if(new_tab){
      this.tabController.openNewTab(to);
    }
    else {
      await super.openLink(to, new_tab);
    }
  }

  override closePage() {
    const current_tab = this.tabController.currentTab;
    if (current_tab) this.tabController.removeTab(current_tab);
  }

  public async forceCloseApplication(){
      try {
          await this.appManager.destroy();
      }
      catch (err){
          console.log('UiManager::forceCloseApplication', err)
      }
      await window.imshost.app.exit();
  }
}
