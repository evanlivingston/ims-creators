import { FieldTypeController } from '~ims-app-base/logic/types/FieldTypeController';
import LocaleBlockKeyPropPresenter from '../blocks/LocaleBlock/LocaleBlockKeyPropPresenter.vue';
import { AssetPropType } from '~ims-app-base/logic/types/Props';

export class LocaleBlockKeyController extends FieldTypeController {
  name = 'localeBlockKey';
  title = '[[t:LocaleBlockKey]]';
  editor = async () => LocaleBlockKeyPropPresenter;
  presenter = async () => LocaleBlockKeyPropPresenter;

  override dataTypes = [
    {
      Type: AssetPropType.STRING,
    },
  ];
}
