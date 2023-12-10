import { defHttp } from '/@/utils/http/axios'

import { ErrorMessageMode } from '/#/axios'
import { ExceptionReps, ExceptionReq } from './model/accountingModel'

//记账记录查询
export function fetchRecordList(params: ExceptionReq, mode: ErrorMessageMode = 'message') {
  return defHttp.post<ExceptionReps>(
    {
      url: `/exceptionInfo/pc/qryRecordsPage`,
      params,
    },
    {
      errorMessageMode: mode,
    },
  )
}
