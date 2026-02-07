import mongoose from "mongoose";
import { UserType } from "@erp/types";


const userSchema = new mongoose.Schema<UserType>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["admin", "user"], 
      default: "user" 
    },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
  },
  { timestamps: true }
);


export const UserModel = mongoose.model<UserType>("User", userSchema);