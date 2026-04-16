/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

const transporter = nodemailer.createTransport({
    secure: true,
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    },
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
    host: envVars.EMAIL_SENDER.SMTP_HOST,
     tls: {
        rejectUnauthorized: false 
    }
})
console.log("SMTP_USER:", envVars.EMAIL_SENDER.SMTP_USER);
console.log("SMTP_PASS:", envVars.EMAIL_SENDER.SMTP_PASS);
console.log("SMTP_PORT:", envVars.EMAIL_SENDER.SMTP_PORT);
console.log("SMTP_HOST:", envVars.EMAIL_SENDER.SMTP_HOST);
console.log("SMTP_PASS2:", JSON.stringify(envVars.EMAIL_SENDER.SMTP_PASS));

interface SendEmailOptions {
    from?: string;
    to: string,
    subject: string;
    templateName: string;
    templateData?: Record<string, any>
    attachments?: {
        filename: string,
        content: Buffer | string,
        contentType: string
    }[]
}

export const sendEmail = async ({
    from,
    to,
    subject,
    templateName,
    templateData,
    attachments
}: SendEmailOptions) => {
    try {
        console.log({ from, to, subject, templateName, templateData, attachments });
        const templatePath = path.join(__dirname, `templates/${templateName}.ejs`)
        const html = await ejs.renderFile(templatePath, templateData)
        const info = await transporter.sendMail({
            from: `"${templateData?.senderName} via Greetely" <${envVars.EMAIL_SENDER.SMTP_FROM}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments?.map(attachment => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType
            }))
        })
        console.log("SMTP_USER1:", envVars.EMAIL_SENDER.SMTP_USER);
console.log("SMTP_PASS1:", envVars.EMAIL_SENDER.SMTP_PASS);
console.log("info:", info);

        console.log(`\u2709\uFE0F Email sent to ${to}: ${info.messageId}`);
    } catch (error: any) {
        console.log("email sending error", error.message);
        throw new AppError(401, "Email error")
    }
}

