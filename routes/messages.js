"use strict";

const { route } = require("express/lib/application");
const { UnauthorizedError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Message = require("../models/message");

const Router = require("express").Router;
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function(req, res, next){

    const msg = await Message.get(req.params.id);
    const toUser = msg.to_user.username;
    const fromUser = msg.from_user.username;
    const currUser = res.locals.user.username;

    if(currUser === toUser || currUser === fromUser){
        return res.json({ message: msg });
    } 
    
    throw new UnauthorizedError();

})


/** POST / - post message.
 *
 * {from_username, to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res, next){
    
    const { from_username, to_username, body } = req.body;
    const msg = await Message.create({ from_username, to_username, body });

    return res.json({ message: msg });

});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function (req, res, next){
    const msg = await Message.get(req.params.id);
    const toUser = msg.to_user.username;
    const currUser = res.locals.user.username;
    if(toUser === currUser){
        const readMsg = await Message.markRead(req.params.id);
        return res.json({ message: readMsg });
    }
    throw new UnauthorizedError("Can't mark message as read");

});


module.exports = router;