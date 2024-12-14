import httpStatus from "http-status";
import { ObjectId } from "mongodb";
import axios from "axios";

import ApiResponse from "../services/ApiResponse.js";
import { error_code, success_code } from "../constants/statusCodes.js";
import {
  id_not_found,
  server_error,
  success_message,
} from "../constants/messageConstants.js";

export const getCitiesController = async (req, res) => {
  try {
    const id = req.query.id;
    const searchParam = req.query.city_name;

    if (!id) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, id_not_found));
    }

    if (!searchParam) {
      return res
        .status(httpStatus.OK)
        .json(ApiResponse.response(success_code, success_message, []));
    }

    const params = new URLSearchParams();
    params.append("apikey", process.env.KOOM_API_KEY);
    params.append("district_id", id);

    const response = await axios.post(
      "https://application.koombiyodelivery.lk/api/Cities/users",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.status !== 200 || response.data === "Invalid API Key") {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(ApiResponse.error(error_code, server_error));
    }

    const cities = response.data;

    const regex = new RegExp(`\\b${searchParam.toLowerCase()}`, "i");

    // Filter cities based on the search query (case-insensitive)
    const filteredCities = cities.filter((city) =>
      regex.test(city.city_name.toLowerCase())
    );

    const uniqueCities = [
      ...new Map(filteredCities.map((city) => [city.city_id, city])).values(),
    ];

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, uniqueCities));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};
