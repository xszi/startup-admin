```js
<template #ApiInputMultiSelect="{ model, field }">
  <ApiInputMultiSelect
    v-model:value="model[field]"
    @search="onSearch2"
    :params="inputMultiSelect.params"
    :api="optionsListApi"
    :always-load="inputMultiSelect.alwaysLoad"
    :label-field="inputMultiSelect.labelField"
    :value-field="inputMultiSelect.valueField"
    :result-field="inputMultiSelect.resultField"
  />
```