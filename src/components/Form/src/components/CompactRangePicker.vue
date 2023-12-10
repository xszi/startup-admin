<template>
  <div class="compact-range-picker">
    <FormItemRest>
      <RangePicker :value="rangeText" :open="false" class="mainPicker" inputReadOnly />
    </FormItemRest>
    <RangePicker
      ref="rangePicker"
      v-model:value="currentVal"
      :ranges="ranges"
      class="subPicker"
      :open="openPopup"
      dropdownClassName="compact-range-picker_dropdown"
      @click="handleClick"
    >
      <template #renderExtraFooter>
        <div class="btn-wrapper">
          <Space class="range-wrapper">
            <Input size="small" readonly :value="startDateFormatter" />
            <span>至</span>
            <Input size="small" readonly :value="endDateFormatter" />
          </Space>
          <Space>
            <a-button size="small" @click="handleCancel">取消</a-button>
            <a-button size="small" type="primary" @click="handleConfirm">确认</a-button>
            <a-button size="small" @click="handleClear">清空</a-button>
          </Space>
        </div>
      </template>
    </RangePicker>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, ref, unref } from 'vue';
  import { Input, RangePicker, Space } from 'ant-design-vue';
  import { FormItemRest } from 'ant-design-vue/es/form';

  import { ranges } from '/@/utils/index';
  import dayjs, { Dayjs } from 'dayjs';
  import type { PropType } from 'vue';

  export default defineComponent({
    name: 'CompactRangePicker',
    components: {
      RangePicker,
      Space,
      Input,
      FormItemRest,
    },
    props: {
      value: {
        type: Array as PropType<Dayjs[]>,
      },
    },
    emits: ['change'],
    setup(_, { attrs, emit }) {
      const rangePicker = ref(null);
      const openPopup = ref(false);
      const currentVal = ref<[Dayjs, Dayjs]>();
      const rangeText = ref<[string, string]>();
      const getAttrs = computed(() => {
        return {
          // ranges,
          // ranges: [],
          ...attrs,
          dropdownClassName: 'compact-range-picker_dropdown',
        };
      });

      const startDateFormatter = computed(() => {
        const range = unref(currentVal);
        if (range && range[0]) {
          return dayjs(range[0]).format('YYYY-MM-DD');
        }
        return '';
      });

      const endDateFormatter = computed(() => {
        const range = unref(currentVal);
        if (range && range[1]) {
          return dayjs(range[1]).format('YYYY-MM-DD');
        }
        return '';
      });

      const handleClick = () => {
        openPopup.value = true;
      };

      const handleClear = () => {
        rangeText.value = undefined;
        currentVal.value = undefined;
        emit('change', undefined);
      };
      const handleConfirm = () => {
        let range = unref(currentVal);
        let startDate;
        let endDate;

        if (range && range[0]) {
          startDate = dayjs(range[0]);
        }

        if (range && range[1]) {
          endDate = dayjs(range[1]);
        }
        rangeText.value = [startDate, endDate];
        close();
        emit('change', unref(currentVal));
      };

      const close = () => {
        openPopup.value = false;
      };
      const handleCancel = () => {
        close();
      };
      return {
        rangeText,
        currentVal,
        handleCancel,
        handleClear,
        handleConfirm,
        startDateFormatter,
        endDateFormatter,
        handleClick,
        openPopup,
        rangePicker,
        ranges,
        getAttrs: getAttrs,
      };
    },
    watch: {
      openPopup(newVal) {
        if (newVal) {
          document.addEventListener('click', this.handleOpenPanel);
        } else {
          document.removeEventListener('click', this.handleOpenPanel);
        }
      },
      value(newVal) {
        this.currentVal = newVal as [Dayjs, Dayjs];
        if (!newVal) {
          this.rangeText = undefined;
        } else {
          let startDate;
          let endDate;

          if (newVal && newVal[0]) {
            startDate = dayjs(newVal[0]);
          }

          if (newVal && newVal[1]) {
            endDate = dayjs(newVal[1]);
          }
          this.rangeText = [startDate, endDate];
        }
      },
    },
    methods: {
      handleOpenPanel(e) {
        if (!this.openPopup) {
          return false;
        }
        let isInPanel = false;
        let node = e.target as HTMLElement | null;
        while (node && node.tagName !== 'body') {
          if (
            node.classList.contains('compact-range-picker_dropdown') ||
            node.classList.contains('compact-range-picker')
          ) {
            isInPanel = true;
          }
          node = node.parentElement;
        }
        if (!isInPanel) {
          this.openPopup = false;
        }
      },
    },
  });
</script>

<style lang="less">
  .compact-range-picker_dropdown {
    &.ant-picker-dropdown-range {
      .ant-picker-preset {
        > .ant-tag-blue {
          width: 90%;
          text-align: center;
        }
      }
      .ant-picker-panel-container {
        overflow: visible;
        position: relative;
      }
      .ant-picker-footer {
        border-bottom: none;
        .ant-picker-ranges {
          position: absolute;
          top: -2px;
          bottom: 0;
          width: 180px;
          right: -180px;
          background-color: #fff;
          border: 1px solid #e2e2e2;
          // display: flex;
          // flex-direction: row;
          > li {
            width: 50%;
          }
        }
      }
    }
  }
</style>

<style lang="less" scoped>
  .compact-range-picker {
    position: relative;
    .subPicker {
      opacity: 0;
      position: absolute;
      left: 0;
    }
  }
  .btn-wrapper {
    text-align: right;
  }
  .range-wrapper {
    width: 40%;
    margin-right: 50px;
  }
</style>
