const axios = require("axios");
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");


dotenv.config();

const apiKey = process.env.SMS_KEY;

if (!apiKey) {
  console.error("SMS_KEY is not defined in environment variables");
  process.exit(1);
}

export const sendSms = async (phoneNumber, otp) => {
  console.log(`Sending SMS to ${phoneNumber}`);
  
  const endPoint = "https://sms.arkesel.com/sms/api";
  const params = {
    action: "send-sms",
    api_key: apiKey,
    to: phoneNumber,
    from: "Prostash",
    sms: `Your Daemonlite OTP code is ${otp}. It expires in 5 minutes.`,
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




export const sendOtpEmail = async (email, otp) => {
    // Create reusable transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Professional HTML email template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your OTP Code</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #6c5ce7;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                padding: 30px;
                background-color: #f9f9f9;
                border-radius: 0 0 5px 5px;
                border: 1px solid #e1e1e1;
                border-top: none;
            }
            .otp-code {
                font-size: 24px;
                font-weight: bold;
                color: #6c5ce7;
                text-align: center;
                margin: 20px 0;
                padding: 10px;
                background-color: #f0eefc;
                border-radius: 5px;
                letter-spacing: 5px;
            }
            .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #777;
                text-align: center;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #6c5ce7;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Stash</h1>
        </div>
        <div class="content">
            <h2>Your One-Time Password (OTP)</h2>
            <p>Hello,</p>
            <p>We received a request to authenticate your account. Please use the following OTP to complete your verification:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>This code will expire in 5 minutes. If you didn't request this code, please ignore this email or contact support.</p>
            
            <p>Thank you,<br>The Stash Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Stash. All rights reserved.</p>
            <p>If you have any questions, contact us at support@stash.com</p>
        </div>
    </body>
    </html>
    `;

    // Email options
    const mailOptions = {
        from: `"Stash" <${process.env.EMAIL_FROM || 'no-reply@stash.com'}>`,
        to: email,
        subject: 'Your Stash OTP Verification Code',
        html: htmlTemplate,
        text: `Your Stash OTP code is ${otp}. This code expires in 5 minutes.`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}: ${info.messageId}`);
        return {
            success: true,
            message: 'OTP email sent successfully',
            messageId: info.messageId
        };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return {
            success: false,
            message: 'Failed to send OTP email',
            error: error.message
        };
    }
};

