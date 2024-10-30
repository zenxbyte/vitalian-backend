import jwt from "jsonwebtoken";
import http from "http-status";

import { auth_error_code } from "../constants/statusCodes.js";
import {
  access_denied,
  token_not_found,
} from "../constants/messageConstants.js";

import TokenModel from "../models/tokenModel.js";

import ApiResponse from "../services/ApiResponse.js";

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

    const userToken = await TokenModel.findOne({ accessToken: token }).populate(
      "userId"
    );

    if (!userToken) {
      return res
        .status(http.UNAUTHORIZED)
        .json(ApiResponse.error(auth_error_code, token_not_found));
    }

    if (!userToken.tokenUser.cusIsActive) {
      return res
        .status(http.SERVICE_UNAVAILABLE)
        .json(ApiResponse.error(auth_error_code, access_denied));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = payload;
    next();
  } catch (err) {
    res
      .status(http.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(auth_error_code, err.message));
  }
};
