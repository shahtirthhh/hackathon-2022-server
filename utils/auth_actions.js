const JWT = require("jsonwebtoken");
class CustomResponse {
  constructor(code, message, isError = true, data = undefined) {
    this.code = code;
    this.message = message;
    this.error = isError;
    this.data = data;
  }
}
const auth_actions = {
  generate_token: (email, aadhar, role) => {
    const token = JWT.sign(
      {
        email,
        aadhar,
        role,
      },
      process.env.TOKEN_GENERATION_SECRET_KEY,
      { expiresIn: "1d" }
    );
    return token;
  },
  verify_token: (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    if (!authHeader) {
      return res
        .status(401)
        .send(
          new CustomResponse(
            "AUTHENTICATION_ERROR",
            "Authentication error !",
            true
          )
        );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .send(
          new CustomResponse(
            "AUTHENTICATION_ERROR",
            "Authentication error !",
            true
          )
        );
    }
    try {
      const decoded = JWT.verify(
        token,
        process.env.TOKEN_GENERATION_SECRET_KEY
      );
      const { email, aadhar, role } = decoded;

      if (req.body.role === role) {
        req.body.email = email;
        next();
      } else {
        return res
          .status(401)
          .send(
            new CustomResponse(
              "AUTHENTICATION_ERROR",
              "Authentication error !",
              true
            )
          );
      }
    } catch (error) {
      return res
        .status(401)
        .send(
          new CustomResponse(
            "AUTHENTICATION_ERROR",
            "Authentication error !",
            true
          )
        );
    }
  },
};
module.exports = auth_actions;
