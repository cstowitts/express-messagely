"use strict";

/** User class for message.ly */

const { NotFoundError } = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username,
                              password,
                              first_name,
                              last_name, 
                              phone,
                              join_at,
                              last_login_at)
            VALUES 
              ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]);

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password 
       FROM users 
       WHERE username = $1`,
      [username]);

    const user = result.rows[0];

    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }

    return false;

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
       WHERE username = $1
       RETURNING username`,
      [username]);

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${username}`);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, 
              first_name, 
              last_name
       FROM users`);

    return result.rows;

  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } 
   * 
   * will throw error if user is
   * */

  static async get(username) {
    const result = await db.query(
      `SELECT username,
                first_name,
                last_name,
                phone,
                join_at,
                last_login_at
          FROM users
          WHERE username = $1`,
      [username]);

    let user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
                  m.to_username,
                  m.body,
                  m.sent_at,
                  m.read_at,
                  u.username,
                  u.first_name,
                  u.last_name,
                  u.phone
          FROM users AS u
               JOIN messages AS m ON u.username = m.to_username
          WHERE m.from_username = $1`,
      [username]);

    return result.rows.map(msg => ({
      id: msg.id,
      to_user: {
        username: msg.to_username,
        first_name: msg.first_name,
        last_name: msg.last_name,
        phone: msg.phone,
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at,
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              m.body,
              m.sent_at,
              m.read_at,
              u.username,
              u.first_name,
              u.last_name,
              u.phone
      FROM users AS u
           JOIN messages AS m ON u.username = m.from_username
      WHERE m.to_username = $1`,
      [username]);

    return result.rows.map(msg => ({
      id: msg.id,
      from_user: {
        username: msg.from_username,
        first_name: msg.first_name,
        last_name: msg.last_name,
        phone: msg.phone,
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at,
    }));

  }
}


module.exports = User;
