import { FieldTypeController } from '~ims-app-base/logic/types/FieldTypeController';
import LocaleBlockStatusPropEditor from '../blocks/LocaleBlock/LocaleBlockStatusPropEditor.vue';
import { AssetPropType } from '~ims-app-base/logic/types/Props';

export class LocaleBlockStatusFieldController extends FieldTypeController {
  name = 'localeBlockStatus';
  title = '[[t:LocaleBlockStatus]]';
  editor = async () => LocaleBlockStatusPropEditor;
  presenter = async () => LocaleBlockStatusPropEditor;

  override dataTypes = [
    {
      Type: AssetPropType.BOOLEAN,
    },
  ];
}
