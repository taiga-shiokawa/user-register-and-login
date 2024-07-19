const express = require("express");
const User = require("../models/User");
const { Resend } = require("resend");
require('dotenv').config();
const passport = require("passport");
const resend = new Resend(process.env.RESEND_API_KEY);

const router = express.Router();

// ホーム画面へ遷移
router.get("/index", (req, res) => {
  res.render("index");
});

// アカウント作成画面へ遷移
router.get("/register", (req, res) => {
  res.render("register");
});

// アカウント作成処理
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registerdUser = await User.register(user, password);
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "メールアドレス確認",
      html: `
        <h1>メールアドレスの確認</h1>
        <p>ゴキブリが、あなたを見ているよ。</p>
        <p>以下のリンクをクリックし、認証を実行してください。</p>
        <a href="http://localhost:8000/login">みょ〜ん</a>
      `,
    });
    console.log("メール送信成功 : ", data);
    res.redirect("/register");
  } catch (err) {
    console.log("メール送信エラー : ", err);
  }
});

// ログイン画面へ遷移
router.get("/login", (req, res) => {
  res.render("login");
});

// ログイン処理
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return next(err);
    }
    if (!user) {
      console.log("Login failed:", info.message);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      return res.redirect("/index");
    });
  })(req, res, next);
});

// パスワード更新
router.get("/pass-update", (req, res) => {
  res.render("pass-update");
});

// パスワード更新処理
router.post("/pass-update", async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: '認証されていません' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    const isValid = await user.authenticate(currentPassword);
    if (!isValid) {
      return res.status(400).json({ message: '現在のパスワードが正しくありません' });
    }

    await user.setPassword(newPassword);
    await user.save();

    req.login(user, (err) => {
      if (err) {
        console.error("Re-login error:", err);
        return res.status(500).json({ message: 'ログインエラーが発生しました' });
      }
      res.json({ message: 'パスワードが正常に更新されました' });
    });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: 'パスワードの更新中にエラーが発生しました' });
  }
});

module.exports = router;
