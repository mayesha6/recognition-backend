import { Request, Response } from "express";
import { FileService } from "./fileUp.services";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";

const uploadFiles = async (req: Request, res: Response) => {
    const files = req.files as Express.MulterS3.File[];

    if (!files || files.length === 0) {
        return  sendResponse(res, {
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "No files uploaded",
        data: null,
    });
    }

    const result = await FileService.uploadFiles(files);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Files uploaded Successfully",
        data: result,
    });
};

const deleteFile = async (req: Request, res: Response) => {
    const { key } = req.body;

    const result = await FileService.deleteFileFromS3(key);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: result.message,
        data: null,
    });
};


export const FileController = {
    uploadFiles,
    deleteFile
};