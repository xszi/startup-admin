```js
<template #ApiMultiSearch="{ model, field }">
  <ApiMultiSearch
    v-model:value="model[field]"
    @search="onSearch1"
    :params="multiSearchProps.params"
    :api="optionsListApi"
    :always-load="multiSearchProps.alwaysLoad"
    :label-field="multiSearchProps.labelField"
    :value-field="multiSearchProps.valueField"
    :result-field="multiSearchProps.resultField"
  />
</template>
```