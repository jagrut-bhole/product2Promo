import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  //tokens gheyche
  // check karayche
  // decode karayche tokens
  // user la find karaycha
  // user la check karaycha
  // requset made user la send karaycha

  try {
    const token = req.cookie?.accessToken;
  
    if (!token) {
      throw new ApiError(400, "Access Token not found...");
    }
  
    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
    if (!decodeToken) {
      throw new ApiError(400, "Tokens not fetched...");
    }
  
    const user = await User.findById(decodeToken?._id)
  
    if (!user) {
      throw new ApiError(400, "User not found...");
    }
  
    req.user = user;
  
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
