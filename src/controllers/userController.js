import { ADMIN_ROLE } from "../constants/role.js";
import userModel from "../models/userModel.js";

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
