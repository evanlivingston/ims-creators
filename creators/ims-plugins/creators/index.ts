import type { PluginDescriptor } from '~ims-app-base/logic/managers/Plugin/PluginControllerBase';
import blocks from './blocks/index';
import exportSegments from './export-segments/index';
import fieldTypes from './field-types/index';
import modules from './modules/index';

export default function () {
  return {
    name: 'creators-plugin',
    title: 'Creators plugin',
    content: [...blocks(), ...exportSegments(), ...fieldTypes(), ...modules()],
    version: '1.0.0',
    api: '2026020401',
  } as PluginDescriptor;
}
