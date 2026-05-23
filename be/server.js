import {app, httpServer} from "./src/config/server.config.js";
import db from "./src/config/db.config.js";
import config from "./src/config/env.config.js";

const port = config.PORT || 4000;
httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

db.query("SELECT NOW()").then(res => {
    console.log("Database connection test successful:", res.rows[0]);
}).catch(err => {
    console.error("Database connection test failed:", err);
});
