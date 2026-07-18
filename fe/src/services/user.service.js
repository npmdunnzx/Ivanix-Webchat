import userApi from "../apis/user.apis.js";

const profile = async (email) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await userApi.profile(email);
        response.data = data;
        return response;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "user", msg: "Could not fetch user profile" });
        } else {
        console.error("Error fetching user profile:", error);
        }
    }
};

const search = async (keyword) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await userApi.search(keyword);
        response.data = data;
        return response;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "user", msg: "Could not search users" });
        } else {
            console.error("Error searching users:", error);
        }
    }
};

export default {
    profile,
    search
};