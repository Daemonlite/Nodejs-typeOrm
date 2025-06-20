import { AppDataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { User } from "../entity/User";
import * as bcrypt from "bcrypt";

import { OTPController } from "./otp.controller";
import { OTPService } from "../services/otp.service";

const otpService = new OTPService();

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  async fetchAllUsers(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    return this.userRepository.find();
  }

  async RetrieveUser(request: Request, response: Response, next: NextFunction) {
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
    const { firstName, lastName, age, email, password } = request.body;

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
    }

    const hashpw = await bcrypt.hash(password, 10);

    const user = Object.assign(new User(), {
      firstName,
      lastName,
      age,
      email,
      password: hashpw,
    });

    return this.userRepository.save(user);
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

    if (user.is2faEnabled) {
        const res = await otpService.sendOTP(user.email, {
        transport: 'email'
        });

        return res
    } else {
        return {
        message: "login successful",
        user: user,
        };
    }

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


async forgotPassword(request: Request, response: Response, next: NextFunction) {
    const { email } = request.body;

    if (!email) {
      throw new Error("email is required");
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new Error("user not found");
    }

    const otp = await otpService.generateOTP(email, 'reset');
    return {
        message: "OTP has been sent to your email",
    }
}

async verifyOTP(request: Request, response: Response, next: NextFunction) {
    const { email, code } = request.body;

    if (!email) {
      throw new Error("email is required");
    } else if (!code) {
      throw new Error("code is required");
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new Error("user not found");
    }

    const isCodeValid = await otpService.verifyOTP(email, code,'verification');

    if (!isCodeValid) {
      throw new Error("invalid code");
    }

    user.isVerified = true;
    this.userRepository.save(user);
    return {
      message: "user has been verified",
      user: user,
    }


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
}
