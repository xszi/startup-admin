import type { IPageData, TPageParams } from '/#/axios'

export type ExceptionReq = TPageParams<{
  /**
   * 模板id
   */
  templateId?: string
  /**
   * 创建人
   */
  createByName: string
}>
export type ExceptionReps = {
  id: string
  /**
   * 创建时间
   */
  createTime?: string
  /**
   * 确认时间
   */
  confirmTime?: string
  /**
   * 关闭时间
   */
  closeTime?: string
  /**
   * 所选表单
   */
  templateName?: string
  /**
   * 创建人
   */
  createByName?: string
  /**
   * 状态
   */
  status?: number | string
}

export type ExceptionPageReps = IPageData<ExceptionReps>

export interface Log {
  code: string | number //状态：1-创建，2-编辑，3-确认，4-关闭
  createTime: string // 创建时间
  name: string // 操作人
  remark: string // 内容
}

export interface ExceptionDetail {
  id: string
  formType: string | number // 表单类型
  status: string | number // 状态：0-草稿，1-已创建，2-已确认，3-已关闭
  stayTime: string //停留时长
  logList: Array<Log> // 进度
  createByName: string // 创建人
  title: string
  happenTime: string // 日期
  shift: string // 班次
  lineCode: string // 拉线编码
  lineName: string // 拉线名称
  processCode: string // 工序编码
  processName: string //工序名称
  equipmentCode: string // 设备编码
  equipmentName: string // 设备名称
  typeName: string // 问题
  productionType: string // 产品信息
  stopTime: string // 时间开始时间
  restartTime: string // 时间结束时间
  stopMins: string // 停机时长
  handleByName: string // 维修人员
  handleByDept: string // 维修部门
  exceptionDesc: string // 异常描述
  reasonDesc: string // 原因分析
  upgradeDesc: string // 改善对策
  // responsiblePersonName: string; // 责任人员
  dept: string // 责任部门
  receivers: Array<string> //通知人
}
