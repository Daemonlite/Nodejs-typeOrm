import { Request, Response } from 'express';
import { OTPService } from '../services/otp.service';
import { OTPServiceOptions, NotificationResponse } from '../interfaces/otp.interface';

export class OTPController {
    private otpService = new OTPService();

    async sendOTP(req: Request, res: Response) {
        try {
            const { identifier, purpose, transport, phoneNumber, email, subject } = req.body;
            
            if (!identifier || !purpose || !transport) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Missing required fields: identifier, purpose, transport' 
                });
            }

            // Validate transport method
            if (!['email', 'sms'].includes(transport)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid transport method. Use "email" or "sms"' 
                });
            }

            // Validate identifier based on transport
            if (transport === 'email' && !email) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Email required for email transport' 
                });
            }

            if (transport === 'sms' && !phoneNumber) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Phone number required for SMS transport' 
                });
            }

            const options: OTPServiceOptions = { 
                transport,
                emailOptions: {
                    subject: subject || 'Your OTP Code',
                }
            };

            await this.otpService.generateOTP(identifier, purpose);
            const result = await this.otpService.sendOTP(identifier, options);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json({ 
                success: true,
                message: 'OTP sent successfully',
                // Only return OTP in development for testing
                
            });
        } catch (error) {
            console.error('Error sending OTP:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to send OTP' 
            });
        }
    }

    async verifyOTP(req: Request, res: Response) {
        try {
            const { identifier, code, purpose } = req.body;
            
            if (!identifier || !code || !purpose) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Missing required fields: identifier, code, purpose' 
                });
            }

            const isValid = await this.otpService.verifyOTP(identifier, code, purpose);
            
            if (isValid) {
                res.status(200).json({ 
                    success: true,
                    message: 'OTP verified successfully' 
                });
            } else {
                res.status(400).json({ 
                    success: false,
                    error: 'Invalid OTP or expired' 
                });
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to verify OTP' 
            });
        }
    }
}