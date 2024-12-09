import httpStatus from "http-status";
import { ObjectId } from "mongodb";

import { ADMIN_ROLE } from "../constants/role.js";
import userModel from "../models/userModel.js";
import { userSchema } from "../schemas/userSchema.js";
import ApiResponse from "../services/ApiResponse.js";
import { error_code, success_code } from "../constants/statusCodes.js";
import {
  cannot_delete_current_user,
  success_message,
  user_exists,
} from "../constants/messageConstants.js";

export const createDefaultUser = async () => {
  try {
    const userEmail = process.env.DEFAULT_ADMIN_EMAIL.toLowerCase();
    const existingAdmin = await userModel.findOne({ userEmail });

    if (existingAdmin) {
      return;
    }

    const newUser = new userModel({
      userFirstName: process.env.DEFAULT_ADMIN_FNAME,
      userLastName: process.env.DEFAULT_ADMIN_LNAME,
      userEmail: process.env.DEFAULT_ADMIN_EMAIL.toLowerCase(),
      userRole: ADMIN_ROLE,
      userPassword: process.env.DEFAULT_ADMIN_PWD,
    });

    const user = await newUser.save();
    console.log("Admin Created - " + user.userEmail);

    return;
  } catch (error) {
    console.error(error);
    return;
  }
};

// Get all admins
export const getAllAdminController = async (req, res) => {
  try {
    const result = await userModel.find();

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, result));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Create User
export const createUserController = async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const user = await userModel.findOne({ userEmail: value.userEmail });

    if (user) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, user_exists));
    }

    const newUser = new userModel({
      ...value,
    });

    await newUser.save();

    return res
      .status(httpStatus.CREATED)
      .json(ApiResponse.response(success_code, success_message));
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Delete User
export const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, cannot_delete_current_user));
    }

    await userModel.findByIdAndDelete(new ObjectId(id));

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};
