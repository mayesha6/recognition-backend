import { Types } from "mongoose"

export interface IWallet {
  user: Types.ObjectId
  year: number
  quarter: number

  pointsAllocated: number
  pointsUsed: number
  pointsBalance: number
}