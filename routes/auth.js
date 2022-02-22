"use strict";

const jwt = require("jsonwebtoken");
const db = require("../db");
const { ensureCorrectUser } = require("../middleware/auth");

const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const { register } = require("../models/user");




/** POST /login: {username, password} => {token} */
router.post("/login", ensureCorrectUser, async function (req, res, next) {
    const { username, password } = req.body;
    const isAuthenticated = await User.authenticate(username, password);
   
    if(isAuthenticated === true){
        const token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token });
    }

    throw new UnauthorizedError("Invalid user/password.");
   
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {
    const { user } = await register(req.body);
    const token = jwt.sign({ user }, SECRET_KEY);

    return res.json({ token });
});







module.exports = router;