import jwt from "jsonwebtoken";
import http from "http-status";
import ApiResponse from "../services/ApiResponse.js";
import { auth_error_code } from "../constants/statusCodes.js";
import {
  access_denied,
  token_not_found,
} from "../constants/messageConstants.js";

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res
        .status(http.UNAUTHORIZED)
        .json(ApiResponse.error(auth_error_code, access_denied));
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    const user = await userModel.findOne({ userAccessToken: token });

    if (!user) {
      return res
        .status(http.UNAUTHORIZED)
        .json(ApiResponse.error(auth_error_code, token_not_found));
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    req.user = verified;
    next();
  } catch (err) {
    res
      .status(http.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(auth_error_code, err.message));
  }
};
