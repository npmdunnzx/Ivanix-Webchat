import { body, validationResult } from "express-validator";

const signupRule = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid")
      .normalizeEmail(),
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .trim()
      .isLength({ min: 5, max: 15 })
      .withMessage("Username must be between 5 and 15 characters")
      .matches(/^[A-Za-z][A-Za-z0-9_]*$/)
      .withMessage(
        "Username must start with a letter and contain only letters and numbers",
      ),
    body("password")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/)
      .withMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      ),
  ];
};

const loginRule = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid")
      .normalizeEmail(),
    body("password", "Password is required").notEmpty(),
  ];
};

const resetPassword = () => {
  return [
    body("newPassword")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/)
      .notEmpty()
      .withMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      ),
  ];
};

const validate = (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ errors: error.array() });
  }
  next();
};
export { loginRule, signupRule, validate, resetPassword };
