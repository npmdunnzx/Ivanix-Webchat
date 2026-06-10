import { query } from "express";
import bcrypt from "bcryptjs";
import utils from "../utils/utils.js";
import config from "../config/env.config.js";
import db from "../config/db.config.js";

const salt = bcrypt.genSaltSync(config.BCRYPT.saltRounds);

const signup = async (username, email, password ) => {
    const hashedPw = bcrypt.hashSync(password, salt);

    const query = "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email";

    try {
        const { rows } = await db.query(
            query,
            [username, email, hashedPw]
        );
        return rows[0];
    } catch (error) {
        console.error("Could not signup:", error.message);
        throw new Error("Could not signup:", error.message);
    }
}

const login = async (email, password) => {
    const query = "SELECT id, username, email, password_hash FROM users WHERE email = $1";

    try {
        const { rows } = await db.query(
            query,
            [email]
        );
        if (rows.length === 0) {
            throw new Error("User not found");
        };
        const user = rows[0];

        const passwordMatch = await bcrypt.compareSync(password, user.password_hash);
        if (!passwordMatch) {
            throw new Error("Invalid password");
        }
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
        };
        return userData;
    } catch (error) {
        console.error("Could not login:", error.message);
        throw new Error("Could not login", error.message);
    }
}

// const logout = async () =>  {

// }

export default { signup, login };