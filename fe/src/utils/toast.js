import toast from "react-hot-toast";

export const notifyError = (message) => toast.error(message);
export const notifySuccess = (message) => toast.success(message);