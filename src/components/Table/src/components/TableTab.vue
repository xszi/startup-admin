<template>
  <Tabs v-model:activeKey="currentKey" size="small">
    <TabPane v-for="item in tabs" v-bind="item" :key="item.key">
      <template #tab>
        <div :class="dataSource[item.name || item.key] ? 'stat' : ''">
          {{ item.label
          }}<span
            v-if="dataSource[item.name || item.key]"
            :class="[item.type, item.class ? item.class : 'primary']"
            >（{{
              (dataSource[item.name || item.key] > 100
                ? '99+'
                : dataSource[item.name || item.key]) || ''
            }}）
          </span>
        </div>
      </template>
    </TabPane>
  </Tabs>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { integer, object, oneOfType } from 'vue-types';
  import { Tabs, TabPane } from 'ant-design-vue';
  import { TableTabPane } from '../types/table';

  export default defineComponent({
    name: 'TableTab',
    components: {
      Tabs,
      TabPane,
    },
    props: {
      modelValue: oneOfType([String, integer()]),
      dataSource: object().def({}),
      tabs: {
        type: Array as PropType<TableTabPane[]>,
        default: () => [],
      },
    },
    emits: ['update:modelValue'],
    setup() {
      const currentKey = ref<string | number>('');
      return {
        currentKey,
      };
    },
    watch: {
      currentKey(newVal) {
        if (newVal !== this.modelValue) {
          this.$emit('update:modelValue', newVal);
        }
      },
      modelValue(newVal) {
        this.currentKey = newVal;
      },
    },
    mounted() {
      if (this.modelValue) {
        this.currentKey = this.modelValue;
      }
    },
  });
</script>

<style lang="less" scope>
  .stat {
    padding-left: 8px;
  }
  .primary {
    color: @primary-color;
  }
  .error {
    color: @error-color;
  }
  .warning {
    color: @warning-color;
  }
  .success {
    color: @success-color;
  }
</style>
