import React, { useState, useEffect, useContext } from "react";
import authImage from "../assets/images/auth.png";
import logoAuth from "../assets/images/logoauth.png";
import "../assets/styles/auth.css";
import { useNavigate, useLocation } from "react-router-dom";
import { MdEmail, MdLock, MdPerson } from "react-icons/md";
import { motion, AnimatePresence } from "motion/react";
import { AuthContext } from "../context/AuthContext.jsx";
import authService from "../services/auth.service.js";

function AuthPage() {
  const { setUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = location.pathname === "/signup";

  const [mode, setMode] = useState("login");

  useEffect(() => {
    setMode(isSignup ? "signup" : "login");
  }, [isSignup]);

  const toggleMode = (newMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      navigate(`/${newMode}`, { replace: true });
    }
  };

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [successMess, setSuccessMess] = useState("");

  const [signupMess, setSignupMess] = useState({
    username: "",
    email: "",
    password: "",
  });

  async function handleSignup(e) {
    e.preventDefault();

    const response = await authService.signup(signupData);
    if (response.success) {
      setSuccessMess(response.data.message);
      setMode("login");
    } else {
      const error = {};
      response.listErr.forEach((err) => {
        error[err.path] = err.msg;
      });
      setSignupMess(error);
      console.log("signup error", signupMess);
    }
  }

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [loginMess, setLoginMess] = useState({
    email: "",
    password: "",
  });

  async function handleLogin(e) {
    e.preventDefault();
    const response = await authService.login(loginData, loginData.rememberMe);
    if (response.success) {
      setUserInfo(response.data.user);
      navigate("/chat");
    }
    else {
      const error = {};
      response.listErr.forEach((err) => {
        error[err.path] = err.msg;
      });
      setLoginMess(error);
      console.log("login error", loginMess);
    }
  }
  return (
    <div className="auth-container">
      <div className="auth-background">
        <img src={authImage} alt="Auth background" />
        <div className="auth-overlay"></div>
      </div>

      <motion.main
        className="auth-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <section className="left-side-auth">
          <div className="auth-brand-block">
            <div className="auth-logo-stage">
              <img
                src={logoAuth}
                alt="Ivanix logo"
                className="auth-logo-image"
              />
            </div>

            <h1>Ivanix</h1>
            <h2>Chào mừng trở lại</h2>
          </div>

          <a className="auth-about-link" href="#">
            About us...
          </a>
        </section>

        <section className="right-side-auth">
          <div className="mode-toggle">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => toggleMode("login")}
              type="button"
            >
              Đăng nhập
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => toggleMode("signup")}
              type="button"
            >
              Đăng ký
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                className="auth-form-panel"
                key="login_form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="success-message">{successMess}</span>
                <p>Vui lòng nhập thông tin đăng nhập của bạn.</p>
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-wrapper">
                      <MdEmail className="icon" size={22} />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Nhập email"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Mật khẩu</label>
                    <div className="input-wrapper">
                      <MdLock className="icon" size={22} />
                      <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Nhập mật khẩu"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="remember-group">
                    <input
                      type="checkbox"
                      name="remember"
                      id="remember-checkbox"
                      checked={loginData.rememberMe}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          rememberMe: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="remember-checkbox">Ghi nhớ đăng nhập</label>
                  </div>

                  <button type="submit" id="login-button">
                    Đăng nhập
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                className="auth-form-panel"
                key="signup_form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p>Vui lòng nhập thông tin đăng ký của bạn.</p>
                <form onSubmit={handleSignup}>
                  <div className="form-group">
                    <label htmlFor="username">Tên đăng nhập</label>
                    <div className="input-wrapper">
                      <MdPerson className="icon" size={22} />
                      <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Nhập tên đăng nhập"
                        value={signupData.username}
                        required
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            username: e.target.value,
                          })
                        }
                      />
                    </div>
                    <span className="error-message">{signupMess.username}</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="signup-email">Email</label>
                    <div className="input-wrapper">
                      <MdEmail className="icon" size={22} />
                      <input
                        type="email"
                        id="signup-email"
                        name="email"
                        placeholder="Nhập email"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <span className="error-message">{signupMess.email}</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="signup-password">Mật khẩu</label>
                    <div className="input-wrapper">
                      <MdLock className="icon" size={22} />
                      <input
                        type="password"
                        id="signup-password"
                        name="password"
                        placeholder="Nhập mật khẩu"
                        value={signupData.password}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <span className="error-message">{signupMess.password}</span>
                  </div>

                  <button type="submit" id="signup-button">
                    Đăng ký
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </motion.main>
    </div>
  );
}

export default AuthPage;
