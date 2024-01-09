import { defHttp } from '/@/utils/http/axios'

import { ErrorMessageMode } from '/#/axios'
import { ExceptionReps, ExceptionReq } from './model/accountingModel'

//记账记录查询
export function fetchAccountList(params: ExceptionReq, mode: ErrorMessageMode = 'none') {
  return defHttp.post<ExceptionReps>(
    {
      url: `/v1/account/qryAccountPage`,
      params,
    },
    {
      errorMessageMode: mode,
    },
  )
}

//新增记账
export function addAccount(params: ExceptionReq, mode: ErrorMessageMode = 'none') {
  return defHttp.post<ExceptionReps>(
    {
      url: `/v1/account/addAccount`,
      params,
    },
    {
      errorMessageMode: mode,
    },
  )
}

//编辑记账
export function editAccount(params: ExceptionReq, mode: ErrorMessageMode = 'none') {
  return defHttp.post<ExceptionReps>(
    {
      url: `/v1/account/editAccount`,
      params,
    },
    {
      errorMessageMode: mode,
    },
  )
}

//删除记账
export function deleteAccount(params: any, mode: ErrorMessageMode = 'none') {
  return defHttp.post<ExceptionReps>(
    {
      url: `/v1/account/deleteAccount`,
      params,
    },
    {
      errorMessageMode: mode,
    },
  )
}
