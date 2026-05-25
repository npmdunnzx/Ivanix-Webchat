import db from "../config/db.config.js";

const checkExistEmail = async (req, res, next) => {
    const {email} = req.body;
    const query = "SELECT * FROM users WHERE email = $1";

    try {
        const {rows} = await db.query(query, [email]);

        if (rows.length > 0 ) {
            return res.status(409).json({message:"Email is already used"});
        }
        next();
    }
    catch (err) {
        return res.status(500).json({message:"Internal Server Error"});
    }
}

const checkExistUsername = async (req, res, next) => {
    const {username} = req.body;
    const query = "SELECT * FROM users WHERE username = $1";

    try {
        const {rows} = await db.query(query, [username]);

        if (rows.length > 0 ) {
            return res.status(409).json({message:"Username is already used"});
        }
        next();
    }
    catch (err) {
        return res.status(500).json({message:"Internal Server Error"});
    }
}

export {checkExistEmail, checkExistUsername};