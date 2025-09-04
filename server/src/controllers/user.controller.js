import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import jwt from "jsonwebtoken";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { User } from "../models/user.model.js";

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: true });
  return { accessToken, refreshToken };
};

const userRegister = asyncHandler(async (req, res) => {
  // get user details from frontend: done
  // validation - not empty:done
  // check if user already exists: username, email :done
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { username, email, password, fullName } = req.body;

  if (
    [username, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Required...");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(400, "User already exists...");
  }

  const avatarLocalPath = req.files?.avatar[0].path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File missing.... Please check!!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar Missing...!!!");
  }

  const user = await User.create({
    username: username.toLowercase(),
    email,
    password,
    fullName,
    avatar: avatar.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Server error while creating the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Created SuccessFully...."));
});

const userLogin = asyncHandler(async (req, res) => {
  // req body -> data-
  // username or email-
  //find the user-
  //password check-
  //access and referesh token
  //send cookie

  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and Password are required..");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError("User not found...");
  }

  const checkPassword = await user.isPasswordCorrect(password);

  if (!checkPassword) {
    throw new ApiError(400, "Invalid Password");
  }

  //   const {accessToken, refreshToken}

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  if (!(accessToken && refreshToken)) {
    throw new ApiError(400, "Tokens not generated...");
  }

  const loggedInUser = await User.findById(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In successfully..."
      )
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "User Details fetched Successfully....")
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out Successfully..."));
});

const changePassword = asyncHandler(async (req, res) => {
  //take both password
  //check it if empty or not
  //check if old password is correct or not
  //if correct update the new password in User daabase
  //return response
  const { oldPassword, newPassword } = req.body;

  if (!(oldPassword || newPassword)) {
    throw new ApiError(400, "Please Enter the Passwords");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully..."));
});

const updateAccountDeatils = asyncHandler(async (req, res) => {
  // take which fields to update
  // check it
  // get the user
  // push it in the user
  // return the response

  const { fullName } = req.body;

  if (!fullName) {
    throw new ApiError(400, "Please enter the field value...");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullName: this.fullName },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Detail changed Successfully..."));
});

const changeAvatar = asyncHandler(async (req, res) => {
  //get the file path
  //check it
  //upload it to cloudinary
  //check it done
  //find user and update it
  //send response

  const { avatarLocalPath } = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image path missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uploading the Avatar Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Image updated successfully...."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // req.cookie madun refresh token gheycha:done
  // checking it:done
  // decode karaycha: done
  // decode token la check lavaycha:done
  // user la find karaych on basis of the token : done
  // user nhi bhetla tr error deycha: done
  // new access and refresh token generate karayche : done
  // return res deycha

  const incomingRefreshToken = req.cookie.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Can't get the incoming refresh token");
  }

  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodeToken) {
      throw new ApiError(400, "Tokens not matched....");
    }

    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(400, "User Not Found...");
    }

    const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200,{accessToken,newRefreshToken}, "Token refreshed successfully....")
      );
  } catch (error) {}
});

export {
  userRegister,
  userLogin,
  getUserProfile,
  userLogout,
  changePassword,
  updateAccountDeatils,
  changeAvatar,
  refreshAccessToken,
};
