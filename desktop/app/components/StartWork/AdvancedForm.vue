<template>
    <AdvancedPropsSpoiler class="AdvancedForm">
        <template #default>
          <div>
            <div class="WelcomeFormContentCreateProject-Action">
                <div class="WelcomeFormContentStart-Action-left">
                    <div class="WelcomeFormContentStart-Action-title">{{$t('desktop.welcome.folderName')}}</div>
                    <div class="WelcomeFormContentStart-Action-subtext">{{$t('desktop.welcome.folderNameTooltip')}}</div>
                </div>
                <ims-input
                    :model-value="projectFolderName"
                    @update:model-value="$emit('update:folder-name', $event)"
                    class="WelcomeFormContentStart-Action-right"
                    placeholder="Name"
                    type="text"
                ></ims-input>
            </div>
          </div>
        </template>
      </AdvancedPropsSpoiler>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AdvancedPropsSpoiler from '~ims-app-base/components/Form/AdvancedPropsSpoiler.vue';
import ImsInput from '~ims-app-base/components/Common/ImsInput.vue';

export default defineComponent({
  name: 'AdvancedForm',
  components: {
    AdvancedPropsSpoiler,
    ImsInput,
  },
  emits: ['update:folder-name'],
  props: {
    projectFolderName: {
      type: String,
      default: ''
    }
  },
})
</script>
<style scoped>
.AdvancedForm{
    margin-bottom: 10px;
    padding: 0px 15px 10px;
}
</style>