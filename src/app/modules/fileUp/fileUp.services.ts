import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getFileUrl, s3Client } from "../../config/S3Client.config";
import { envVars } from "../../config/env";

const uploadFiles = async (files: Express.MulterS3.File[]) => {
    const uploadedFiles = files.map((file) => ({
        url: getFileUrl(file),
        key: file.key,
        size: file.size,
        type: file.mimetype,
    }));

    return uploadedFiles;
};

const deleteFileFromS3 = async (key: string) => {
    const command = new DeleteObjectCommand({
        Bucket: envVars.S3.S3_BUCKET_NAME!,
        Key: key,
    });

    await s3Client.send(command);

    return {
        success: true,
        message: "File deleted successfully",
    };
};

export const FileService = {
    uploadFiles,
    deleteFileFromS3,
};