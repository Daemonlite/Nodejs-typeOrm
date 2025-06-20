
import * as dotenv from "dotenv";

dotenv.config();


export const port = process.env.PORT || 3000;
export const EMAIL_SERVICE = process.env.EMAIL_SERVICE;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
export const EMAIL_FROM = process.env.EMAIL_FROM;
export const SMS_KEY = process.env.SMS_KEY;


