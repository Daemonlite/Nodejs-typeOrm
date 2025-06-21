import { AppDataSource } from "../data-source";
import { Otp } from "../entities/Otp";
import { User } from "../entities/User";
import { sendSms, sendOtpEmail } from "../utils";

export class OtpController {
  private otpRepository = AppDataSource.getRepository(Otp);

 public async generateOtp(email: string | null, phoneNumber: string | null) {
    if (!email && !phoneNumber) {
      throw new Error("Either email or phoneNumber must be provided");
    }

    // Generate new OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Find existing OTP record if it exists
    const existingOtp = await this.findExistingOtp(email, phoneNumber);

    let otpData: Otp;
    if (existingOtp) {
      // Update existing OTP
      existingOtp.code = otpCode;
      existingOtp.expiresAt = expiresAt;
      otpData = await this.otpRepository.save(existingOtp);
    } else {
      // Create new OTP
      otpData = new Otp();
      otpData.code = otpCode;
      otpData.expiresAt = expiresAt;
      otpData.phoneNumber = phoneNumber;
      otpData.email = email;
      otpData = await this.otpRepository.save(otpData);
    }

    return otpData.code;
  }

  private async findExistingOtp(
    email: string | null,
    phoneNumber: string | null
  ) {
    let whereCondition = {};
    if (email) {
      whereCondition = { email };
    } else if (phoneNumber) {
      whereCondition = { phoneNumber };
    }

    const otp = await this.otpRepository.findOne({ where: whereCondition });
    
    if (!otp) {
      return null;
    }

    return {
      code: otp.code,
      expiresAt: otp.expiresAt,
      ...otp // Include all other properties if needed later
    };
  }

  public async sendOtp(email: string | null, phoneNumber: string | null) {
    const otpCode = await this.generateOtp(email, phoneNumber);
    if (phoneNumber) {
      await sendSms(phoneNumber, otpCode);
    } else if (email) {
      await sendOtpEmail(email, otpCode);
    }
  }

  public async verifyOtp(
    email: string | null,
    phoneNumber: string | null,
    otpCode: string
  ) {
    const relatedOtp = await this.findExistingOtp(email, phoneNumber);

    if (!relatedOtp) {
      throw new Error("OTP not found");
    }

    if (relatedOtp.expiresAt < new Date()) {
      throw new Error("OTP has expired");
    }

    if (relatedOtp.code === otpCode) {
      await this.otpRepository.remove(relatedOtp);
    }
    return relatedOtp.code === otpCode;
  }

  public async resendOtp(email: string | null, phoneNumber: string | null) {
    const otpCode = await this.generateOtp(email, phoneNumber);
    if (phoneNumber) {
      await sendSms(phoneNumber, otpCode);
    } else if (email) {
      await sendOtpEmail(email, otpCode);
    }
  }
}