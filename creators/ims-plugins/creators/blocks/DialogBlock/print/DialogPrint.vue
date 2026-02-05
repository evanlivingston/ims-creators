<template>
  <div class="DialogPrint">
    <imc-presenter :value="graphText"></imc-presenter>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';
import ImcPresenter from '~ims-app-base/components/ImcText/ImcPresenter.vue';
import { packQuillDeltaToPropValue } from '~ims-app-base/components/ImcText/ImcContent';
import type { Node } from '@vue-flow/core';
import { extractDialogBlockData } from '../editor/DialogEditor';
import {
  castAssetPropValueToString,
  joinAssetPropValueTexts,
  type AssetPropValue,
} from '~ims-app-base/logic/types/Props';
import { NodeType } from '../nodes/NodeDescriptor';
import { getNodeDescriptors } from '../nodes/getNodeDescriptiors';

type NamedGroup = {
  name: string;
  nodes: Node[];
  nextName: string | null;
};

export default defineComponent({
  name: 'DialogPrint',
  components: {
    ImcPresenter,
  },
  props: {
    resolvedBlock: {
      type: Object as PropType<ResolvedAssetBlock>,
      required: true,
    },
  },
  computed: {
    graphText() {
      const { nodes } = extractDialogBlockData(this.resolvedBlock.props);
      const startId = this.resolvedBlock.props['start']
        ? castAssetPropValueToString(this.resolvedBlock.props['start'])
        : null;

      const node_descriptors_map = new Map(
        getNodeDescriptors().map((d) => [d.name, d]),
      );
      const flow_nodes = nodes.filter((node) => {
        const descr = node.type
          ? node_descriptors_map.get(node.type)
          : undefined;
        return (
          descr &&
          [NodeType.EXEC, NodeType.EXEC_START, NodeType.EXEC_END].includes(
            descr.type,
          )
        );
      });
      const { nodesMap, groups } = this.makeNodeGroups(flow_nodes, startId);

      const texts: AssetPropValue[] = [];
      for (const group of groups) {
        texts.push(
          packQuillDeltaToPropValue({
            ops: [
              {
                insert: group.name + '. ',
                attributes: {
                  bold: true,
                },
              },
            ],
          }),
        );
        for (const node of group.nodes) {
          texts.push(this.renderNode(node, nodesMap));
          texts.push('\n\n');
        }
        if (group.nextName) {
          texts.push(`[${group.nextName}]\n\n`);
        }
      }

      return joinAssetPropValueTexts(texts[0], ...texts.slice(1));
    },
  },
  methods: {
    renderNode(
      node: Node,
      nodesMap: Map<string, { node: Node; group: null | NamedGroup }>,
    ): AssetPropValue {
      switch (node.type) {
        case 'start':
        case 'end':
          return packQuillDeltaToPropValue({
            ops: [
              {
                insert: this.$t(
                  'imsDialogEditor.nodes.' + node.type + '.title',
                ).toUpperCase(),
                attributes: {
                  bold: true,
                },
              },
            ],
          });

        case 'trigger': {
          //const texts: AssetPropValue[] = ['⚡ '];
          const texts: AssetPropValue[] = [
            packQuillDeltaToPropValue({
              ops: [
                {
                  insert: {
                    icon: 'flashlight-fill',
                  },
                },
              ],
            }),
            ' ',
          ];

          if (node.data?.subject) {
            texts.push(node.data?.subject);
          }
          return joinAssetPropValueTexts(texts[0], ...texts.slice(1));
        }
        case 'speech': {
          const texts: AssetPropValue[] = [];
          /*TODO:
          for (const param of Object.keys(
            this.controller.state.__settings.speech.main,
          )) {
            if (node.data?.values[param]) {
              texts.push(node.data?.values[param]);
              if (param === 'character') {
                texts.push(': ');
              }
            }
          }
          */
          if (node.data?.values?.character) {
            texts.push(node.data?.values?.character);
            texts.push(': ');
          }
          if (node.data?.values?.text) {
            texts.push(node.data?.values?.text);
          }

          const node_opts = Array.isArray(
            this.resolvedBlock.props[`nodes\\${node.id}\\options`],
          )
            ? (this.resolvedBlock.props[
                `nodes\\${node.id}\\options`
              ] as number[])
            : [];
          for (const nn_index of node_opts) {
            texts.push('\n\n\t- ');
            texts.push(
              this.resolvedBlock.props[
                `nodes\\${node.id}\\options\\${nn_index}\\values\\text`
              ] ?? '',
            );
            const opt_id = castAssetPropValueToString(
              this.resolvedBlock.props[
                `nodes\\${node.id}\\options\\${nn_index}\\next`
              ],
            );
            const opt_id_map = nodesMap.get(opt_id);
            if (opt_id_map && opt_id_map.group) {
              texts.push(` [${opt_id_map.group.name}]`);
            }
          }

          return joinAssetPropValueTexts(texts[0], ...texts.slice(1));
        }
        default:
          return node.type ?? '';
      }
    },
    makeNodeGroups(nodes: Node[], startId: string | null) {
      const nodesMap = new Map(
        nodes.map((n) => [n.id, { node: n, group: null as null | NamedGroup }]),
      );

      let group_counter = 0;
      const res_groups: NamedGroup[] = [];

      const start_group = (node_id: string | null): string | null => {
        if (!node_id) {
          for (const [key, node] of nodesMap) {
            if (!node.group) {
              node_id = key;
              break;
            }
          }
          if (!node_id) return null;
        }

        const node = nodesMap.get(node_id);
        if (!node) return null;

        let group: NamedGroup;
        if (node.group) {
          const node_ind_group = node.group.nodes.findIndex(
            (n) => n.id === node_id,
          );
          if (node_ind_group > 0) {
            const old_group = node.group;
            group = {
              name: (++group_counter).toString(),
              nodes: node.group.nodes.slice(node_ind_group),
              nextName: null,
            };
            res_groups.push(group);
            for (const n of group.nodes) {
              const n_map = nodesMap.get(n.id);
              if (n_map) n_map.group = group;
            }
            old_group.nodes = old_group.nodes.slice(0, node_ind_group);
            old_group.nextName = group.name;
            return group.name;
          } else {
            return null;
          }
        } else {
          group = {
            name: (++group_counter).toString(),
            nodes: [node.node],
            nextName: null,
          };
          res_groups.push(group);
          node.group = group;
          let cur_node = node.node;
          const new_options_roots: string[] = [];
          while (cur_node) {
            const node_opts = Array.isArray(
              this.resolvedBlock.props[`nodes\\${cur_node.id}\\options`],
            )
              ? (this.resolvedBlock.props[
                  `nodes\\${cur_node.id}\\options`
                ] as number[])
              : [];
            for (const nn_index of node_opts) {
              const opt_id = castAssetPropValueToString(
                this.resolvedBlock.props[
                  `nodes\\${cur_node.id}\\options\\${nn_index}\\next`
                ],
              );
              if (opt_id) {
                new_options_roots.push(opt_id);
              }
            }

            const next_id = castAssetPropValueToString(
              this.resolvedBlock.props[`nodes\\${cur_node.id}\\next`],
            );
            const next_map = next_id ? nodesMap.get(next_id) : undefined;
            if (next_map) {
              if (next_map.group) {
                group.nextName = start_group(next_map.node.id);
                break;
              }
              next_map.group = group;
              group.nodes.push(next_map.node);
              cur_node = next_map.node;
            } else {
              break;
            }
          }
          if (new_options_roots.length > 0) {
            for (const sg of new_options_roots) {
              start_group(sg);
            }
          } else start_group(null);

          return group.name;
        }
      };

      start_group(startId);

      return {
        groups: res_groups,
        nodesMap,
      };
    },
  },
});
</script>
