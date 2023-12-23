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

//记账记录查询
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
