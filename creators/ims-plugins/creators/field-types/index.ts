import { LocaleBlockKeyController } from './LocaleBlockKeyFieldController';
import { LocaleBlockStatusFieldController } from './LocaleBlockStatusFieldController';

export default function () {
  return [
    new LocaleBlockKeyController(),
    new LocaleBlockStatusFieldController(),
  ]
    .filter((el) => el)
    .map((el) => {
      return {
        type: 'field',
        content: {
          controller: el,
        },
      };
    });
}
