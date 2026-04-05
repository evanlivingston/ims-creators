import { defineAsyncComponent } from 'vue';
import {
  LEVEL_ASSET_ID,
  DIAGRAM_ASSET_ID,
  SCRIPT_ASSET_ID,
  GAME_OBJECT_ASSET_ID,
  MARKDOWN_ASSET_ID,
} from '~ims-app-base/logic/constants';
import EditorSubContext from '~ims-app-base/logic/project-sub-contexts/EditorSubContext';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';

export default function () {
  return [
    {
      type: 'module',
      content: {
        async activate(projectContext: IProjectContext) {
          const cancel_callbacks: { cancel: () => void }[] = [];

          cancel_callbacks.push(
            projectContext.get(EditorSubContext).registerAssetLayout({
              name: 'gameobject',
              pageComponent: defineAsyncComponent(
                () =>
                  import(
                    '~ims-app-base/components/Asset/Layout/AssetDefaultPageLayout.vue'
                  ),
              ),
              editorComponent: defineAsyncComponent(
                () => import('./AssetEditors/AssetBlockGameObjectEditor.vue'),
              ),
              props: {
                headerLocaleButton: true,
              },
            }),
          );

          cancel_callbacks.push(
            projectContext.get(EditorSubContext).registerAssetLayout({
              name: 'markdown',
              pageComponent: defineAsyncComponent(
                () =>
                  import(
                    '~ims-app-base/components/Asset/Layout/AssetDefaultPageLayout.vue'
                  ),
              ),
              editorComponent: defineAsyncComponent(
                () => import('./AssetEditors/MarkdownEditor.vue'),
              ),
              props: {
                headerHideParent: true,
              },
            }),
          );

          cancel_callbacks.push(
            projectContext
              .get(EditorSubContext)
              .registerAssetLayoutBind(LEVEL_ASSET_ID, 'full'),
          );

          cancel_callbacks.push(
            projectContext
              .get(EditorSubContext)
              .registerAssetLayoutBind(DIAGRAM_ASSET_ID, 'full'),
          );

          cancel_callbacks.push(
            projectContext
              .get(EditorSubContext)
              .registerAssetLayoutBind(SCRIPT_ASSET_ID, 'full'),
          );

          cancel_callbacks.push(
            projectContext
              .get(EditorSubContext)
              .registerAssetLayoutBind(GAME_OBJECT_ASSET_ID, 'gameobject'),
          );

          cancel_callbacks.push(
            projectContext
              .get(EditorSubContext)
              .registerAssetLayoutBind(MARKDOWN_ASSET_ID, 'markdown'),
          );

          return async () => {
            for (const descr of cancel_callbacks) {
              descr.cancel();
            }
          };
        },
      },
    },
  ];
}
