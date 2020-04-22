const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const User = require("./models/user");
const methodOverride = require("method-override");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();

dotenv.config({
  path: "./config.env",
});

app.use(express.urlencoded());
app.use(express.json());
app.use(methodOverride("_method"));
app.use(cookieParser());

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB is connected"));

const publicDirectory = path.join(__dirname, "./public");
app.use(express.static(publicDirectory));
app.set("view engine", "hbs");

app.get("/", async (req, res) => {
  try {
    const users = await User.find();
    const selectedUser = await User.findOne({ email: "john@email.com" });
    res.render("index", {
      data: users,
      dataUser: selectedUser,
    });
  } catch (error) {
    status: error.message;
  }
});

app.get("/register", (req, res) => {
  res.render("register.hbs");
});

app.get("/login", (req, res) => {
  res.render("login.hbs");
});

app.post("/register/user", async (req, res) => {
  console.log(req.body);
  const name = req.body.form_user_name;
  const email = req.body.form_user_email;
  const password = req.body.form_user_password;
  const age = req.body.form_user_age;
  const hashedPassword = await bcryptjs.hash(password, 8);
  // ^^ .hash hashes password 8 times (parameters are password variable name and number of times password is to be hashed) //

  try {
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      // ^^ Shorthand when both the key and its value are the same (name: name) //
    });

    const signToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

    const cookieOptions = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    };

    res.cookie("jwt", signToken, cookieOptions);

    res.status(201).json(newUser);
    // Always need a response, otherwise code will crash //
    // 201 code means that data has been submitted and everything is working fine //
  } catch (error) {
    console.log(error.message);
    res.status(400).json({
      status: error.message,
    });
  }
});

app.post("/login/user", async (req, res) => {
  const email = req.body.loginEmail;
  const password = req.body.loginPassword;

  console.log(email);
  console.log(password);

  const user = await User.findOne({ email: email });
  
  const hashedPassword = user.password;
  const isMatch = await bcryptjs.compare(password, hashedPassword);
  console.log(isMatch);

  if (req.cookies) {
    console.log(req.cookies.jwt);

    const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
    console.log(decoded);

    if ((decoded.id == user._id) && isMatch) {
      res.send("<h1>User Logged In</h1>");
    } else {
      res.send('<h1>Email or password is incorrect, please try again</h1>')
    }
  }
});

app.put("/edit/:id", async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);

  res.render("edit", {
    data: user,
  });
});

app.put("/edit/:id/success", async (req, res) => {
  const userId = req.params.id;

  const userUpdate = await User.findByIdAndUpdate(userId, {
    name: req.body.form_user_name,
    email: req.body.form_user_email,
    password: req.body.form_user_password,
    age: req.body.form_user_age,
  });

  res.status(200).send("<h1>user updated</h1>");
});

app.delete("/delete/:id", async (req, res) => {
  const userId = req.params.id;
  const userToDelete = await User.findByIdAndRemove(userId);

  res.send("<h1>User Deleted</h1>");
});

app.listen(5000, (req, res) => {
  console.log("Server is running on port 5000");
});
