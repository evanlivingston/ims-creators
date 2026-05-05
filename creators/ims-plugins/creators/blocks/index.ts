import { BarkBlockDefinition } from './BarkBlock/BarkBlockDefinition';
import { DiagramBlockDefinition } from './DiagramBlock/DiagramBlockDefinition';
import { DialogBlockDefinition } from './DialogBlock/DialogBlockDefinition';
import { LevelEditorBlockDefinition } from './LevelEditorBlock/LevelEditorBlockDefinition';
import { LocaleBlockDefinition } from './LocaleBlock/LocaleBlockDefinition';
import { MarkdownBlockDefinition } from './MarkdownBlock/MarkdownBlockDefinition';
import { TextGridBlockDefinition } from './TextGridBlock/TextGridBlockDefinition';

const list = [
  new MarkdownBlockDefinition(),
  new DiagramBlockDefinition(),
  new DialogBlockDefinition(),
  new LevelEditorBlockDefinition(),
  new TextGridBlockDefinition(),
  new LocaleBlockDefinition(),
  new BarkBlockDefinition(),
];

export default function () {
  return list.map((el) => {
    return {
      type: 'block',
      content: {
        definition: el,
      },
    };
  });
}
