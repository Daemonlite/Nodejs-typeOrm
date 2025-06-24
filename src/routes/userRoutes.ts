import { UserController } from "../controller/UserController";
import { authMiddleware,rateLimitMiddleware } from "../middlewares/main";


export const userRoutes = [
  // Public routes
  {
    method: "post",
    route: "/users",
    controller: UserController,
    action: "saveUser",
    middlewares: [rateLimitMiddleware] // Prevent abuse of signups
  },
  {
    method: "post",
    route: "/users/login",
    controller: UserController,
    action: "loginUser",
    middlewares: [rateLimitMiddleware] // Prevent brute force attacks
  },
  {
    method: "post",
    route: "/users/forgot-password",
    controller: UserController,
    action: "forgotPassword",
    middlewares: [rateLimitMiddleware] // Prevent email/SMS flooding
  },
  {
    method: "post",
    route: "/users/verify-otp",
    controller: UserController,
    action: "verifyUserOTP",
    middlewares: [rateLimitMiddleware] // Protect OTP verification
  },
  {
    method: "post",
    route: "/users/resend-otp",
    controller: UserController,
    action: "resendUserOtp",
    middlewares: [rateLimitMiddleware] // Prevent email/SMS flooding
  },

  // Authenticated routes
  {
    method: "get",
    route: "/users",
    controller: UserController,
    action: "fetchAllUsers",
    middlewares: [authMiddleware, rateLimitMiddleware] 
  },
  {
    method: "get",
    route: "/users/:id",
    controller: UserController,
    action: "retrieveUser", 
    middlewares: [authMiddleware]
  },
  {
    method: "patch",
    route: "/users/:id",
    controller: UserController,
    action: "updateUser", 
    middlewares: [authMiddleware]
  },
  {
    method: "delete",
    route: "/users/:id",
    controller: UserController,
    action: "removeUser",
    middlewares: [authMiddleware]
  },

  // Suggested additional routes
  {
    method: "get",
    route: "/users/me",
    controller: UserController,
    action: "getCurrentUser",
    middlewares: [authMiddleware]
  },
  {
    method: "patch",
    route: "/users/:id/password",
    controller: UserController,
    action: "updatePassword", 
    middlewares: [authMiddleware]
  },
  {
    method: "patch",
    route: "/users/:id/2fa",
    controller: UserController,
    action: "enable2fa", 
    middlewares: [authMiddleware]
  },
  {
    method: "post",
    route: "/users/:id/2fa/verify",
    controller: UserController,
    action: "verify2fa", 
    middlewares: [authMiddleware]
  }
];