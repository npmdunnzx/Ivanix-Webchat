import React, { useState, useEffect } from "react";
import authImage from "../assets/images/auth.png";
import "../assets/styles/auth.css";
import { useNavigate, useLocation } from "react-router-dom";
import { MdEmail, MdLock, MdPerson } from "react-icons/md";
import { motion, AnimatePresence } from "motion/react";

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
//   console.log("location", location);
  const isSignup = location.pathname === "/signup";

  const [mode, setMode] = useState("login");
  // const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMode(isSignup ? "signup" : "login");
  }, [isSignup]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "signup") {
      navigate("/login");
    } else {
      navigate("/chat");
    }
  };

  const toggleMode = (newMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      navigate(`/${newMode}`, { replace: true });
    }
  };

  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");

  return (
    <div className="auth-container">
      <div className="auth-background">
        <img src={authImage} alt="Auth Image" />
        <div className="auth-overlay"></div>
      </div>

      <motion.main
        className="auth-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
      <section className="left-side-auth">
        <h1>Ivanix</h1>
        <h2>Chào mừng trở lại</h2>
      </section>

      <section className="right-side-auth">
        <div className="mode-toggle">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => toggleMode("login")}
          >
            Đăng nhập
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => toggleMode("signup")}
          >
            Đăng ký
          </button>
        </div>
        <AnimatePresence mode="wait">
            {mode === "login" ? (
          <motion.div key="login_form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <p>Vui lòng nhập thông tin đăng nhập của bạn.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>

              <div className="input-wrapper">
                <MdEmail className="icon" size={22} />

                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Nhập email"
                //   required
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
                  //   required
                />
              </div>
            </div>
            <div className="remember-group">
              <input type="checkbox" name="remember" id="remember-checkbox" />

              <label htmlFor="remember-checkbox">Ghi nhớ đăng nhập</label>
            </div>
            <button type="submit" id="login-button">
              Đăng nhập
            </button>
          </form>
          </motion.div>
        ) : (
          <motion.div key="signup_form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <p>Vui lòng nhập thông tin đăng ký của bạn.</p>
          <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Tên đăng nhập</label>
                    <div className="input-wrapper">
                        <MdPerson className="icon" size={22} />
                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Nhập tên đăng nhập"
                            required
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-wrapper">
                        <MdEmail className="icon" size={22} />
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Nhập email"
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
                            required
                        />
                    </div>
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
