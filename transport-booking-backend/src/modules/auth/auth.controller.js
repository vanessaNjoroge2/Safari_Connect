import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
  changeCurrentUserPassword,
} from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "./auth.validation.js";

export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await registerUser(validatedData);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await loginUser(validatedData);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const result = await getCurrentUser(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const result = await updateCurrentUser(req.user.userId, validatedData);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const changeMyPassword = async (req, res, next) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    await changeCurrentUserPassword(req.user.userId, validatedData);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};