import type { RouteLocationNormalized, RouteRecordNormalized } from 'vue-router'
import type { App, Plugin } from 'vue'
import { message } from 'ant-design-vue'
import useClipboard from 'vue-clipboard3'
import { isEmpty, isNullOrUnDef } from './is'
import dayjs, { Dayjs } from 'dayjs'

import { unref } from 'vue'
import { isObject } from '/@/utils/is'

export const noop = () => {}

/**
 * @description:  Set ui mount node
 */
export function getPopupContainer(node?: HTMLElement): HTMLElement {
  return (node?.parentNode as HTMLElement) ?? document.body
}

/**
 * Add the object as a parameter to the URL
 * @param baseUrl url
 * @param obj
 * @returns {string}
 * eg:
 *  let obj = {a: '3', b: '4'}
 *  setObjToUrlParams('www.baidu.com', obj)
 *  ==>www.baidu.com?a=3&b=4
 */
export function setObjToUrlParams(baseUrl: string, obj: any): string {
  let parameters = ''
  for (const key in obj) {
    parameters += key + '=' + encodeURIComponent(obj[key]) + '&'
  }
  parameters = parameters.replace(/&$/, '')
  return /\?$/.test(baseUrl) ? baseUrl + parameters : baseUrl.replace(/\/?$/, '?') + parameters
}

// 深度合并
export function deepMerge<T = any>(src: any = {}, target: any = {}): T {
  let key: string
  for (key in target) {
    src[key] = isObject(src[key]) ? deepMerge(src[key], target[key]) : (src[key] = target[key])
  }
  return src
}

export function openWindow(
  url: string,
  opt?: { target?: TargetContext | string; noopener?: boolean; noreferrer?: boolean },
) {
  const { target = '__blank', noopener = true, noreferrer = true } = opt || {}
  const feature: string[] = []

  noopener && feature.push('noopener=yes')
  noreferrer && feature.push('noreferrer=yes')

  window.open(url, target, feature.join(','))
}

// dynamic use hook props
export function getDynamicProps<T, U>(props: T): Partial<U> {
  const ret: Recordable = {}

  Object.keys(props).map((key) => {
    ret[key] = unref((props as Recordable)[key])
  })

  return ret as Partial<U>
}

export function getRawRoute(route: RouteLocationNormalized): RouteLocationNormalized {
  if (!route) return route
  const { matched, ...opt } = route
  return {
    ...opt,
    matched: (matched
      ? matched.map((item) => ({
          meta: item.meta,
          name: item.name,
          path: item.path,
        }))
      : undefined) as RouteRecordNormalized[],
  }
}

export const withInstall = <T>(component: T, alias?: string) => {
  const comp = component as any
  comp.install = (app: App) => {
    app.component(comp.name || comp.displayName, component)
    if (alias) {
      app.config.globalProperties[alias] = component
    }
  }
  return component as T & Plugin
}

export const successColor = '#26B51C'
export const errorColor = '#DD383E'
export const warningColor = '#e6a23c'
export const primaryColor = '#0f62fe'
export const infoColor = '#9195A3'

export const handleCopy = async (text) => {
  const { toClipboard } = useClipboard()
  try {
    await toClipboard(text)
    message.success('复制成功')
  } catch (e) {
    console.error(e)
  }
}

// 验证提交表单
export function validateField(array, rule, unique = false) {
  const keys = Object.keys(rule)
  const result = {
    errMsg: '',
    isValid: false,
  }
  const keyMap = {}
  const isValid = array.every((item) => {
    if (!keyMap[item.name]) {
      keyMap[item.name] = true
    } else {
      if (unique) {
        result.errMsg = '存在相同的属性名，请删除后重新提交'
        return false
      }
    }
    for (const key of keys) {
      const field = rule[key]
      const isNull = isEmpty(item[key]) || isNullOrUnDef(item[key])
      if (field.required === true && isNull) {
        // 必填项
        result.errMsg = field.errMsg
        return false
      } else if (field.relyField) {
        // 依赖某个字段
        if (isObject(field.relyField)) {
          // 某个字段的值为指定值才需要填写
          const name = field.relyField.name
          const value = field.relyField.value
          if (Array.isArray(value)) {
            console.log(value.includes(item[name]), isNull)
            if (value.includes(item[name]) && isNull) {
              result.errMsg = field.errMsg
              return false
            }
          } else if (item[name] === value && isNull) {
            result.errMsg = field.errMsg
            return false
          }
        }
      }
    }
    return true
  })
  result.isValid = isValid
  return result
}

export type labelValueItem = { label: string; value: string | number }

export const getOptionLabelByValue = (value, options: labelValueItem[]) => {
  const res = options.find((item) => item.value === value)
  return res ? res.label : ''
}

// 格式化开始、结束日期
export const formateDateTime = (time, type) => {
  const times = time.split(' ')
  if (times.length < 2) return ''
  if (type === 'start') {
    return `${times[0]} 00:00:00`
  }
  if (type === 'end') {
    return `${times[0]} 23:59:59`
  }
}

// 日期组件预设值
export const ranges: Record<string, [Dayjs, Dayjs]> = {
  今天: [dayjs(), dayjs()],
  昨天: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')],
  近7天: [dayjs().subtract(6, 'day'), dayjs()],
  上周: [
    dayjs().startOf('week').add(1, 'day').subtract(7, 'day'),
    dayjs().endOf('week').add(1, 'day').subtract(7, 'day'),
  ],
  本月: [dayjs().startOf('month'), dayjs()],
  上月: [
    dayjs().subtract(1, 'month').startOf('month'),
    dayjs().subtract(1, 'month').endOf('month'),
  ],
  今年: [dayjs().startOf('year'), dayjs()],
  去年: [dayjs().subtract(1, 'year').startOf('year'), dayjs().subtract(1, 'year').endOf('year')],
  最近30天: [dayjs().subtract(29, 'day'), dayjs()],
  最近60天: [dayjs().subtract(59, 'day'), dayjs()],
  最近90天: [dayjs().subtract(89, 'day'), dayjs()],
  往后7天: [dayjs().add(1, 'day'), dayjs().add(7, 'day')],
  往后60天: [dayjs().add(1, 'day'), dayjs().add(60, 'day')],
}
//大数转字符串
export const toNonExponential = (num) => {
  num = parseFloat(num)
  const m = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/)
  return num.toFixed(Math.max(0, (m[1] || '').length - m[2]))
}

// 获取 Map 值
export const getMapKey = (map, key) => {
  return map[key] ? map[key] : ''
}

//过滤数组空字符串
export const filterArrayData = (data, filterStr = '') => {
  if (!Array.isArray(data)) return data
  return data.filter((i) => i !== filterStr)
}
