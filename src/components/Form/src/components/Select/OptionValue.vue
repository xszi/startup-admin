<template>
  <div class="w-full overflow-hidden overflow-ellipsis" @mouseenter="handleMouseOver">
    <Tooltip :title="!Array.isArray(item.label) ? item.label : item.label.join(' ｜ ')">
      <template v-if="!Array.isArray(item.label)">
        {{ item.label }}
      </template>
      <template v-else>
        <span v-for="(node, index) in item.label" :key="node">
          {{ node }}<span v-if="index !== item.label.length - 1" class="split"></span>
        </span>
      </template>
    </Tooltip>
  </div>
</template>
<script setup lang="ts" name="OptionValue">
  import { Tooltip } from 'ant-design-vue';

  defineProps({
    item: {
      type: Object,
      default: () => ({}),
    },
  });

  const handleMouseOver = (e) => {
    const target = e.target;
    if (!target) return;
    if (target.scrollWidth <= target.clientWidth) {
      const maskEl = target.querySelector('.mask');
      if (maskEl) {
        return;
      }
      const mask = document.createElement('div');
      mask.style.position = 'absolute';
      mask.classList.add('mask');
      mask.style.left = '0';
      mask.style.right = '0';
      mask.style.top = '0';
      mask.style.bottom = '0';
      mask.style.zIndex = '999';
      target.style.position = 'relative';
      target.appendChild(mask);
    }
  };
</script>

<style lang="less" scoped>
  .split {
    height: 1.2em;
    line-height: 1.2em;
    vertical-align: -0.3em;
    width: 1px;
    margin: 0 8px;
    display: inline-block;
    background-color: @table-header-bg;
  }
</style>
