<template>
  <div class="cell-value-copy">
    <span v-if="copyOnly" class="cell-value">{{ copyVal }}</span>
    <a-button
      v-else
      type="link"
      size="small"
      class="table-link-btn"
      @click.stop="$emit('vClick')"
      >{{ copyVal }}</a-button
    >
    <copy-outlined class="cell-copy-icon" @click.stop="handleCopy(copyVal)" />
  </div>
</template>
<script lang="ts" setup name="CellCopy">
  import { CopyOutlined } from '@ant-design/icons-vue';
  import { handleCopy } from '/@/utils';
  defineEmits(['vClick']);
  defineProps({
    copyVal: {
      type: String,
      default: '',
    },
    copyOnly: {
      type: Boolean,
      default: true,
    },
  });
</script>
