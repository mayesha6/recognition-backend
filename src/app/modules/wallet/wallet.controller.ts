import { NextFunction, Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import httpStatus from "http-status-codes";
import { WalletServices } from "./wallet.services";

const getWallet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.params.userId
    const { year, quarter } = req.body

    const wallet = await WalletServices.getWallet(userId, year, quarter)

    sendResponse(res, {

        success: true,
        statusCode: httpStatus.OK,
        message: "Wallet retrieve successfully",
        data: wallet,
    })

})

const distributePoints = catchAsync(async(req,res)=>{

 const { designation, points } = req.body

 const result =
 await WalletServices.distributePoints(
 designation,
 points
 )

 sendResponse(res,{
  success:true,
  statusCode:httpStatus.OK,
  message:"Points distributed",
  data:result
 })

})

export const WalletController = {
    getWallet,
    distributePoints
};