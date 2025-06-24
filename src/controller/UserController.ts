import { AppDataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { User } from "../entities/User";
import * as bcrypt from "bcrypt";

import { OtpController } from "./otp.controller";
import * as jwt from "jsonwebtoken";
import { Status } from "../entities/User";
import { createResponse } from "../interfaces/otp.interface";

const otpController = new OtpController();

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  async fetchAllUsers(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const users = await this.userRepository.find();
    return createResponse(true, "Users fetched successfully", users);
  }

  async retrieveUser(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      const rs = createResponse(false, "User not found");
      return response.status(404).json(rs);
    }
    return createResponse(true, "User fetched successfully", user);
  }

  async saveUser(request: Request, response: Response, next: NextFunction) {
    console.log("saving user");
    const { firstName, lastName, age, email, password, phoneNumber, status } =
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
      // throw new Error("user already exists with this email");
      const rs = createResponse(false, "User already exists with this email");
      return response.status(400).json(rs);
    }

    // check if status is valid
    if (status && !Status[status]) {
      const rs = createResponse(false, "Invalid status passed");
      return response.status(400).json(rs);
    }

    const hashpw = await bcrypt.hash(password, 10);

    const user = Object.assign(new User(), {
      firstName,
      lastName,
      age,
      email,
      password: hashpw,
      phoneNumber,
      status,
    });

    await otpController.sendOtp(user.email, null);

    this.userRepository.save(user);

    const rs = createResponse(true, "User created successfully", user);

    return response.status(201).json(rs);
  }

  async updateUser(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);
    const data = request.body;

    if (!id) {
      const res = createResponse(false, "User id is required");
      return response.status(400).json(res);
    }

    // Remove password from data if present
    if (data.password) {
      delete data.password;
    }

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      const message = createResponse(false, "User not found");
      return response.status(404).json(message);
    }

    await this.userRepository.update({ id }, { ...data });

    const rs = createResponse(true, "User updated successfully", user);

    return response.status(200).json(rs);
  }

  async loginUser(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, password } = request.body;

      // Validate input
      if (!email || !password) {
        return response
          .status(400)
          .json(createResponse(false, "Email and password are required"));
      }

      // Find user
      const user = await this.userRepository.findOneBy({ email });
      if (!user) {
        return response.status(404).json(
          createResponse(false, "Invalid credentials") // Generic message for security
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return response.status(401).json(
          createResponse(false, "Invalid credentials") // Generic message
        );
      }

      // Check verification status
      if (!user.isVerified) {
        return response
          .status(403)
          .json(
            createResponse(false, "Please verify your email address first")
          );
      }

      // Generate token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY!, {
        expiresIn: "1d",
      });

      // Handle 2FA
      if (user.is2faEnabled) {
        await otpController.sendOtp(user.email, null);

        // Include the token in 2FA response if needed for next step
        return response.status(200).json(
          createResponse(
            true,
            "2FA required - OTP sent to your email",
            { requires2fa: true, tempToken: token } // Optional
          )
        );
      }

      // Successful login
      return response.status(200).json(
        createResponse(true, "Login successful", {
          user: this.sanitizeUser(user),
          token,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Helper function to remove sensitive data from user object
  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async verify2fa(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);
    const { code } = request.body;

    if (!id) {
      return response
        .status(400)
        .json(createResponse(false, "User id is required"));
    } else if (!code) {
      return response
        .status(400)
        .json(createResponse(false, "Code is required"));
    }

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      return response.status(404).json(createResponse(false, "User not found"));
    }

    if (!user.is2faEnabled) {
      return response
        .status(400)
        .json(createResponse(false, "2FA is not enabled"));
    }

    const isCodeValid = await otpController.verifyOtp(user.email, null, code);

    if (!isCodeValid) {
      return response.status(400).json(createResponse(false, "Invalid code"));
    } else {
      await this.userRepository.update({ id }, { is2faEnabled: false });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY!, {
      expiresIn: "1d",
    });

    return response.status(200).json(
      createResponse(true, "2FA verification successful", {
        user: this.sanitizeUser(user),
        token,
      })
    );
  }

  async removeUser(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);

    let userToRemove = await this.userRepository.findOneBy({ id });

    if (!userToRemove) {
      return response.status(404).json(createResponse(false, "User not found"));
    }

    await this.userRepository.remove(userToRemove);

    return response
      .status(200)
      .json(createResponse(true, "User removed successfully"));
  }

  async forgotPassword(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const { email } = request.body;

    if (!email) {
      return response
        .status(400)
        .json(createResponse(false, "email is required"));
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      return response.status(404).json(createResponse(false, "User not found"));
    }

    await otpController.sendOtp(user.email, null);

    return response
      .status(200)
      .json(createResponse(true, "OTP sent Successfully"));
  }

  async verifyUserOTP(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const { email, code } = request.body;
    console.log(`user entered code is ${code}`);

    if (!email) {
      return response
        .status(400)
        .json(createResponse(false, "email is required"));
    } else if (!code) {
      return response
        .status(400)
        .json(createResponse(false, "code is required"));
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      return response.status(404).json(createResponse(false, "User not found"));
    }

    const isCodeValid = await otpController.verifyOtp(user.email, null, code);

    console.log(`isCodeValid is ${isCodeValid}`);

    if (isCodeValid === false) {
      return response.status(400).json(createResponse(false, "invalid code"));
    } else if (isCodeValid === true) {
      user.isVerified = true;
      this.userRepository.save(user);

      return response
        .status(200)
        .json(createResponse(true, "User has been verified", user));
    } else {
      return response
        .status(400)
        .json(createResponse(false, "Otp has already expired"));
    }
  }

  async resendUserOtp(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const { email } = request.body;

    if (!email) {
      return response
        .status(400)
        .json(createResponse(false, "email is required"));
    }

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      return response.status(404).json(createResponse(false, "User not found"));
    }

    await otpController.resendOtp(user.email, null);

    return response
      .status(200)
      .json(createResponse(true, "OTP has been sent to your email"));
  }

  async updatePassword(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const id = parseInt(request.params.id);
    const { password, confirmPassword } = request.body;

    if (!password) {
      return response
        .status(400)
        .json(createResponse(false, "password is required"));
    } else if (!confirmPassword) {
      return response
        .status(400)
        .json(createResponse(false, "confirm password is required"));
    }

    if (password !== confirmPassword) {
      return response
        .status(400)
        .json(createResponse(false, "Passwords do not match"));
    }

    const user = await this.userRepository.findOneBy({ id });

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      return response
        .status(400)
        .json(createResponse(false, "Incorrect password"));
    }
    const hashpw = await bcrypt.hash(password, 10);

    user.password = hashpw;
    this.userRepository.save(user);
    return response
      .status(200)
      .json(createResponse(true, "Password updated successfully", user));
  }

  async enable2fa(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id);

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      return response.status(404).json(createResponse(false, "User not found"));
    }

    user.is2faEnabled = true;
    this.userRepository.save(user);

    return response
      .status(200)
      .json(createResponse(true, "2FA has been enabled successfully", user));
  }
}
