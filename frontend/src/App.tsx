import React, { useState } from "react";
import VisitorLanding from "./features/VisitorLanding";
import VisitorChat from "./features/VisitorChat";
import AdminOtp from "./features/AdminOtp";
import AdminList from "./features/AdminList";
import AdminChat from "./features/AdminChat";

export default function App() {
  const [visitorName, setVisitorName] = useState("");
  const [visitorConversationId, setVisitorConversationId] = useState<number|null>(null);
  const [adminToken, setAdminToken] = useState<string|null>(null);
  const [adminSelectedUser, setAdminSelectedUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<"visitor_name"|"visitor_chat"|"admin_otp"|"admin_list"|"admin_chat">("visitor_name");

  if (currentScreen === "visitor_name") {
    return <VisitorLanding onNameSubmit={(name: string, cid: number) => {setVisitorName(name);setVisitorConversationId(cid);setCurrentScreen("visitor_chat");}} />;
  }
  if (currentScreen === "visitor_chat") {
    return <VisitorChat name={visitorName} conversationId={visitorConversationId!} />;
  }
  if (currentScreen === "admin_otp") {
    return <AdminOtp onOtpValid={(token:string)=>{setAdminToken(token);setCurrentScreen("admin_list");}} />;
  }
  if (currentScreen === "admin_list") {
    return <AdminList token={adminToken!} onSelectUser={user=>{setAdminSelectedUser(user);setCurrentScreen("admin_chat");}} />;
  }
  if (currentScreen === "admin_chat") {
    return <AdminChat user={adminSelectedUser!} token={adminToken!} goBack={()=>setCurrentScreen("admin_list")} />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <button className="bg-blue-500 text-white rounded px-4 py-2" onClick={()=>setCurrentScreen("visitor_name")}>Ziyaretçi Girişi</button>
      <button className="bg-green-600 text-white rounded px-4 py-2" onClick={()=>setCurrentScreen("admin_otp")}>Admin Panel</button>
    </div>
  );
}