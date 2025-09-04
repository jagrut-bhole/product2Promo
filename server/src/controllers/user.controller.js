import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

export { userRegister, userLogin };
