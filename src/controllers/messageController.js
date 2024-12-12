import httpStatus from "http-status";
import { messageSchema } from "../schemas/messageSchema.js";
import ApiResponse from "../services/ApiResponse.js";
import { error_code, success_code } from "../constants/statusCodes.js";
import MessageModel from "../models/messageModel.js";
import { message_sent } from "../constants/messageConstants.js";

export const createMessageController = async (req, res) => {
  try {
    const { error, value } = messageSchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const newMessage = new MessageModel({
      ...value,
    });

    await newMessage.save();

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, message_sent));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};
