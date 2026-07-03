import { Outlet } from "react-router-dom";
import "../assets/styles/layout.css";
import Sidebar from "./Sidebar.jsx";

function LayoutPage() {
    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default LayoutPage;