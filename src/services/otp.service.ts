import * as nodemailer from 'nodemailer';
import axios from "axios";
import {
  OTP,
  OTPConfig,
  OTPServiceOptions,
  NotificationResponse,
} from "../interfaces/otp.interface";
import {
  EMAIL_PASSWORD,
  EMAIL_USER,
  EMAIL_SERVICE,
  EMAIL_FROM,
  SMS_KEY,
} from "../config";

export class OTPService {
  private defaultConfig: OTPConfig = {
    length: 5, // Only 5 digits
    expiresIn: 5, // 5 minutes expiration
  };

  private otpStorage: Map<string, OTP> = new Map();
  private transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  async generateOTP(userIdentifier: string, purpose: string): Promise<OTP> {
    const code = this.generateRandomCode(this.defaultConfig);
    const expiresAt = new Date(
      Date.now() + this.defaultConfig.expiresIn * 60 * 1000
    );

    const otp: OTP = {
      code,
      expiresAt,
      purpose,
    };

    this.otpStorage.set(userIdentifier, otp);
    return otp;
  }

  async sendOTP(
    userIdentifier: string,
    options: OTPServiceOptions
  ): Promise<NotificationResponse> {
    const otp = this.otpStorage.get(userIdentifier);
    if (!otp) {
      throw new Error("OTP not found or expired");
    }

    try {
      switch (options.transport) {
        case "email":
          return await this.sendOTPByEmail(
            userIdentifier,
            otp.code,
            options.emailOptions
          );
        case "sms":
          return await this.sendOTPBySMS(userIdentifier, otp.code);
        default:
          throw new Error("Unsupported transport method");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      return {
        success: false,
        info: "Failed to send OTP",
        data: error,
      };
    }
  }

  async verifyOTP(
    userIdentifier: string,
    code: string,
    purpose: string
  ): Promise<boolean> {
    const otp = this.otpStorage.get(userIdentifier);
    if (!otp) return false;

    const isValid =
      otp.code === code &&
    //   otp.purpose === purpose &&
      otp.expiresAt > new Date();

    if (isValid) {
      this.otpStorage.delete(userIdentifier);
    }

    return isValid;
  }

  private generateRandomCode(config: OTPConfig): string {
    let result = "";
    const characters = "0123456789"; // Only digits

    for (let i = 0; i < config.length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return result;
  }

  private async sendOTPByEmail(
    email: string,
    otp: string,
    emailOptions?: { subject: string; template?: string }
  ): Promise<NotificationResponse> {
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: emailOptions?.subject || "Your OTP Code",
      text: `Your OTP code is ${otp}. It expires in ${this.defaultConfig.expiresIn} minutes.`,
      html:
        emailOptions?.template ||
        `
                <div>
                    <h2>Your Verification Code</h2>
                    <p>Your OTP code is: <strong>${otp}</strong></p>
                    <p>This code will expire in ${this.defaultConfig.expiresIn} minutes.</p>
                </div>
            `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        info: "Email sent successfully",
        data: info,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        info: "Failed to send email",
        data: error,
      };
    }
  }

  private async sendOTPBySMS(
    phoneNumber: string,
    otp: string
  ): Promise<NotificationResponse> {
    const apiKey = SMS_KEY;
    if (!apiKey) {
      console.error("SMS API key not configured");
      return {
        success: false,
        info: "SMS API key not configured",
      };
    }

    const endPoint = "https://sms.arkesel.com/sms/api";
    const params = {
      action: "send-sms",
      api_key: apiKey,
      to: phoneNumber,
      from: "Daemonlite",
      sms: `Your Daemonlite OTP code is ${otp}. It expires in ${this.defaultConfig.expiresIn} minutes.`,
    };

    try {
      const response = await axios.get(endPoint, { params });
      const data = response.data;

      if (data.code === "ok") {
        console.log(`SMS notification sent to ${phoneNumber}`);
        return {
          success: true,
          info: "SMS sent successfully",
          data: data,
        };
      } else {
        console.error(`Failed to send SMS to ${phoneNumber}:`, data);
        return {
          success: false,
          info: "Failed to send SMS",
          data: data,
        };
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      return {
        success: false,
        info: "Failed to send SMS",
        data: error,
      };
    }
  }
}
