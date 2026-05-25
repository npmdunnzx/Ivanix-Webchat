import authController from "../controller/auth.controller.js";
import express from "express";
import {validate, loginRule, signupRule, resetPassword } from "../middlewares/validate.js";
import {checkExistEmail,checkExistUsername} from "../middlewares/verifySignup.js";

const router = express.Router();

router.post("/signup",[signupRule(),validate, checkExistUsername, checkExistEmail], authController.signup);
router.post("/login",[loginRule(),validate], authController.signup);

export default router;