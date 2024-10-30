import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { excludeuserFieldsPlugin } from "../plugins/userModelPlugin.js";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  userEmail: {
    type: String,
    required: true,
  },
  userPassword: {
    type: String,
    required: true,
  },
  userAccessToken: {
    type: String,
    default: null,
  },
  userIsActive: {
    type: Boolean,
    required: true,
    default: true,
  },
});

userSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("userPassword")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.userPassword, salt);
    user.userPassword = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

userSchema.plugin(excludeuserFieldsPlugin);

const userModel = mongoose.model("user", userSchema);

export default userModel;
