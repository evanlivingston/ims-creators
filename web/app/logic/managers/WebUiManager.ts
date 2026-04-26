import UiManager from '~ims-app-base/logic/managers/UiManager';

export default class WebUiManager extends UiManager {
  async init(context: any) {
    // No tab controller or desktop-specific behavior
  }
}
