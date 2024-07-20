const express = require("express");
const ejsMate = require("ejs-mate");
const path = require("path");
const User = require("./models/User");
const userRouter = require("./routes/user");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");

const app = express();
const PORT = 8000;

mongoose
  .connect("mongodb://localhost:27017/sendemail-test-db")
  .then(() => {
    console.log("DB接続成功!!!");
  })
  .catch((err) => {
    console.log("DB接続失敗...");
  });

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// セッション設定
const sessionConfig = {
  secret: "mysecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

// フォームからのPOSTリクエストを受け取るためのミドルウェア
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 認証を, authenticateという方法でLocalStrategyを使ってやることを宣言
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/", userRouter);

app.listen(PORT, () => {
  console.log("ポート8000に接続中...");
});
