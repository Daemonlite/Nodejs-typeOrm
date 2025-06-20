export interface OTPConfig {
    length: number;
    expiresIn: number; // in minutes
}

export interface OTP {
    code: string;
    expiresAt: Date;
    purpose: string;
}

export interface OTPServiceOptions {
    transport: 'email' | 'sms';
    emailOptions?: {
        subject: string;
        template?: string;
    };
}

export interface NotificationResponse {
    success: boolean;
    info: string;
    data?: any;
}