import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middlewarre.js";
import {
  userRegister,
  userLogin,
  getUserProfile,
  userLogout,
  changePassword,
  updateAccountDeatils,
  changeAvatar,
  refreshAccessToken,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  userRegister
);

router.route("/login").post(userLogin);

// Secure Routes
router.route("/logout").post(verifyJwt, userLogout);

router.route("/profile").post(verifyJwt, getUserProfile);

route.route("/change-password").post(verifyJwt, changePassword);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/update-account").post(verifyJwt, updateAccountDeatils);

router.route("/change-avatar").post(upload.single("avatar"), changeAvatar);

export default router;
