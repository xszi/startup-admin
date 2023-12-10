<template>
  <a-tree-select v-bind="getAttrs" @change="handleChange">
    <template v-for="item in Object.keys($slots)" #[item]="data">
      <slot :name="item" v-bind="data || {}"></slot>
    </template>
    <template v-if="loading" #suffixIcon>
      <LoadingOutlined spin />
    </template>
  </a-tree-select>
</template>

<script lang="ts">
  import { computed, defineComponent, watch, ref, onMounted, unref } from 'vue';
  import { TreeSelect } from 'ant-design-vue';
  import { isArray, isFunction } from '/@/utils/is';
  import { get } from 'lodash-es';
  import { propTypes } from '/@/utils/propTypes';
  import { LoadingOutlined } from '@ant-design/icons-vue';
  export default defineComponent({
    name: 'ApiTreeSelect',
    components: { ATreeSelect: TreeSelect, LoadingOutlined },
    props: {
      api: { type: Function as PropType<(arg?: Recordable) => Promise<Recordable>> },
      params: { type: Object },
      immediate: { type: Boolean, default: true },
      resultField: propTypes.string.def(''),
      setDefaultValueByFetch: { type: Boolean, default: false },
      nodeDisabled: { type: Function },
    },
    emits: ['options-change', 'change'],
    setup(props, { attrs, emit }) {
      const treeData = ref<Recordable[]>([]);
      const isFirstLoaded = ref<Boolean>(false);
      const loading = ref(false);
      const getAttrs = computed(() => {
        return {
          ...(props.api ? { treeData: unref(treeData) } : {}),
          ...attrs,
        };
      });
      function handleChange(...args) {
        emit('change', ...args);
      }

      watch(
        () => props.params,
        () => {
          !unref(isFirstLoaded) && fetch();
        },
        { deep: true },
      );

      watch(
        () => props.immediate,
        (v) => {
          v && !isFirstLoaded.value && fetch();
        },
      );

      onMounted(() => {
        props.immediate && fetch(props.setDefaultValueByFetch);
      });

      function setNodeDisabled(data) {
        const { nodeDisabled } = props;
        return data.map((item) => {
          item.disabled = nodeDisabled!(item);
          if (item?.children?.length > 0) {
            item.children = setNodeDisabled(item.children);
          }
          return item;
        });
      }
      function flatData(data, res: any[] = []) {
        data.forEach((item) => {
          res.push(item);
          const children = item.children;
          if (Array.isArray(children)) {
            flatData(children, res);
          }
        });
        return res;
      }
      function getDefaultValue(data, key) {
        const res = flatData(data);
        return res.find((i) => !i.disabled)?.[key];
      }

      async function fetch(setDefault = false) {
        const { api, nodeDisabled } = props;
        if (!api || !isFunction(api)) return;
        loading.value = true;
        treeData.value = [];
        let result;
        try {
          result = await api(props.params);
        } catch (e) {
          console.error(e);
        }
        loading.value = false;
        if (!result) return;
        if (!isArray(result)) {
          result = get(result, props.resultField);
        }
        if (isFunction(nodeDisabled)) {
          result = setNodeDisabled(result);
        }

        if (setDefault) {
          const defaultVal = getDefaultValue(result, (attrs?.fieldNames as Recordable)?.value);
          handleChange(defaultVal);
        }
        treeData.value = (result as Recordable[]) || [];
        isFirstLoaded.value = true;
        emit('options-change', treeData.value);
      }
      return { getAttrs, loading, handleChange };
    },
  });
</script>
