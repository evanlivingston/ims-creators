<template>
  <div class="SelectFolderForm use-buttons-icon">
    <ims-input
      :model-value="value"
      :placeholder="placeholder"
      @change="updateValue($event)"
      :title="value"
      type="text"
    ></ims-input>
    <button class="is-button SelectFolderForm-button" @click="selectFolder()">
      <i class="ri-folder-line"></i>
    </button>
   </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ImsInput from '~ims-app-base/components/Common/ImsInput.vue';


export default defineComponent({
  name: 'SelectFolderForm',
  components: {
    ImsInput,
  },
  props: {
    value:{
      type: String,
      default: null,
    },
    placeholder: {
      type: String,
      default: '',
    }
  },
  emits: ['update'],
  methods: {
    updateValue(ev: string){
      this.$emit('update', ev);
    },
    async selectFolder(){
      const res = await window.imshost.fs.showSelectDirectoryDialog({
        defaultPath: this.value,
      });
      if(!res.canceled){
        this.updateValue(res.filePaths[0]);
      }
    }
  }
})
</script>
<style>
.SelectFolderForm{
  display: flex;
  align-items: center;
  gap: 5px;
  width: 60%;
}
</style>