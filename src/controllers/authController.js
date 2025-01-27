import httpStatus from "http-status";
import bcrypt from "bcrypt";

import {
  bad_request_code,
  error_code,
  success_code,
} from "../constants/statusCodes.js";
import { loginSchema } from "../schemas/loginSchema.js";
import {
  incorrect_password_email,
  logged_in_success,
  logged_out_success,
  user_not_found,
} from "../constants/messageConstants.js";
import ApiResponse from "../services/ApiResponse.js";
import { generateAccessToken } from "../services/jwtServices.js";
import userModel from "../models/userModel.js";

export const loginController = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(bad_request_code, error.message));
    }

    const { userEmail, userPassword } = value;
    const user = await userModel.findOne({
      userEmail: userEmail.toLowerCase(),
    });

    if (!user)
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.response(error_code, incorrect_password_email));

    const isMatch = await bcrypt.compare(userPassword, user.userPassword);
    if (!isMatch)
      return res
        .status(httpStatus.PRECONDITION_FAILED)
        .json(ApiResponse.response(error_code, incorrect_password_email));

    const token = generateAccessToken(user._id, user.userRole);

    user.userAccessToken = token;

    const updatedUser = await user.save();

    return res.status(httpStatus.OK).json(
      ApiResponse.response(success_code, logged_in_success, {
        user: updatedUser,
        token,
      })
    );
  } catch (error) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json(ApiResponse.error(bad_request_code, error.message));
  }
};

// Logout employee
export const logoutController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.user.id });

    if (!user)
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.response(error_code, user_not_found));

    user.userAccessToken = null;

    await user.save();

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, logged_out_success));
  } catch (error) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json(ApiResponse.error(bad_request_code, error.message));
  }
};
