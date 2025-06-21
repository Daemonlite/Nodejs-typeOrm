import { AppDataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { User } from "../entities/User";
import * as bcrypt from "bcrypt";

import { OtpController } from "./otp.controller";
import * as jwt from 'jsonwebtoken';

const otpController = new OtpController();

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  async fetchAllUsers(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    return this.userRepository.find();
  }

  async retrieveUser(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new Error("user not found");
    }
    return user;
  }

  async saveUser(request: Request, response: Response, next: NextFunction) {
    console.log('saving user')
    const { firstName, lastName, age, email, password, phoneNumber } =
      request.body;

    if (!firstName) {
      throw new Error("first name is required");
    } else if (!lastName) {
      throw new Error("last name is required");
    } else if (!age) {
      throw new Error("age is required");
    } else if (!email) {
      throw new Error("email is required");
    } else if (!password) {
      throw new Error("password is required");
    } else if (!phoneNumber) {
      throw new Error("phone number is required");
    }

    if (await this.userRepository.findOneBy({ email })) {
      throw new Error("user already exists with this email");
    }

    const hashpw = await bcrypt.hash(password, 10);

    const user = Object.assign(new User(), {
      firstName,
      lastName,
      age,
      email,
      password: hashpw,
      phoneNumber,
    });

    await otpController.sendOtp(user.email, null);

    this.userRepository.save(user);

    return {
      message: "user has been created successfully",
      user: user,
    };
  }

async updateUser(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);
    const data = request.body;

    if (!id) {
      throw new Error("id is required");
    }

    // Remove password from data if present
    if (data.password) {
      delete data.password;
    }

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new Error("user not found");
    }

    await this.userRepository.update({ id }, { ...data });

    return {
      message: "user has been updated successfully",
    };
}


  async loginUser(request: Request, response: Response, next: NextFunction) {
    const { email, password } = request.body;

    if (!email) {
      throw new Error("email is required");
    } else if (!password) {
      throw new Error("password is required");
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new Error("user not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("invalid password");
    }

    if (!user.isVerified) {
      throw new Error("user is not verified");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY!, {
      expiresIn: "1d",
    });

    if (user.is2faEnabled) {
      const res = await otpController.sendOtp(user.email,null);

      return {
        "message": "2FA has been enabled for this user, please check your email for OTP",
        "res": res
      };
    } else {
      return {
        message: "login successful",
        user: user,
        token: token

      };
    }
  }

  async verify2fa(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);
    const { code } = request.body;

    if (!id) {
      throw new Error("id is required");
    } else if (!code) {
      throw new Error("code is required");
    }

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new Error("user not found");
    }

    if (!user.is2faEnabled) {
      throw new Error("2FA is not enabled for this user");
    }

    const isCodeValid = await otpController.verifyOtp(user.email,null,code);

    if (!isCodeValid) {
      throw new Error("invalid code");
    } else {
      
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY!, {
      expiresIn: "1d",
    });

    return ({
      message: "2FA verification successful",
      user: user,
      token: token
    })
  }

  async removeUser(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);

    let userToRemove = await this.userRepository.findOneBy({ id });

    if (!userToRemove) {
      throw new Error("user not found");
    }

    await this.userRepository.remove(userToRemove);

    return "user has been removed";
  }

  async forgotPassword(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const { email } = request.body;

    if (!email) {
      throw new Error("email is required");
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new Error("user not found");
    }


    await otpController.sendOtp(user.email, null);

    return {
      message: "OTP has been sent to your email",
    };
  }

  async verifyUserOTP(request: Request, response: Response, next: NextFunction) {
    const { email, code } = request.body;
    console.log(`user entered code is ${code}`)

    if (!email) {
      throw new Error("email is required");
    } else if (!code) {
      throw new Error("code is required");
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new Error("user not found");
    }

    const isCodeValid = await otpController.verifyOtp(user.email, null, code);

    console.log(`isCodeValid is ${isCodeValid}`)

    if (isCodeValid === false) {
      throw new Error("invalid code");
    } else if (isCodeValid === true) {

      user.isVerified = true;
      this.userRepository.save(user);

      return {
      message: "user has been verified",
      user: user,
    };

    } else {
      throw new Error("Otp has expired");
    }

  }

  async resendUserOtp(request: Request, response: Response, next: NextFunction) {
    const { email } = request.body;

    if (!email) {
      throw new Error("email is required");
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new Error("user not found");
    }

    await otpController.resendOtp(user.email, null);

    return {
      message: "OTP has been sent to your email",
    };
  }

  async updatePassword(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const id = parseInt(request.params.id);
    const { password, confirmPassword } = request.body;

    if (!password) {
      throw new Error("password is required");
    } else if (!confirmPassword) {
      throw new Error("confirm password is required");
    }

    if (password !== confirmPassword) {
      throw new Error("passwords do not match");
    }

    const user = await this.userRepository.findOneBy({ id });

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      throw new Error("Old password cannot be the same as new password");
    }
    const hashpw = await bcrypt.hash(password, 10);

    user.password = hashpw;
    this.userRepository.save(user);
    return response.json({
      message: "password updated successfully",
      user: user,
    });
  }

  async enable2fa(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new Error("user not found");
    }

    user.is2faEnabled = true;
    this.userRepository.save(user);

    return {
      message: "2fa has been enabled",
      user: user,
    };
  }
}
