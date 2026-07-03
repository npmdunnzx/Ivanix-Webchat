import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import Chat from "./pages/Chat.jsx";
// import Settings from "./pages/SettingsPage.jsx";
// import Search from "./pages/SearchPage.jsx";
import Contacts from "./pages/Contacts.jsx";
import Storage from "./pages/Storage.jsx";
import LayoutPage from "./components/LayoutPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        <Route element={<LayoutPage />}>
          <Route path="/chat" element={<Chat />} />
          {/* <Route path="/settings" element={<Settings />} /> */}
          {/* <Route path="/search" element={<Search />} /> */}
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/storage" element={<Storage />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
