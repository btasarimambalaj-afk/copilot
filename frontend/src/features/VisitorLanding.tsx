import React, { useState } from "react";
import axios from "axios";

export default function VisitorLanding({onNameSubmit}:{onNameSubmit:(name:string,cid:number)=>void}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  async function startChat() {
    try{
      let res = await axios.post("/api/visitor/start", new URLSearchParams({display_name: name}));
      onNameSubmit(name, res.data.conversation_id);
    }catch(e){ setError("Bağlantı hatası!"); }
  }
  return (
    <div className="flex flex-col gap-4 p-4 xs:w-full">
      <h1 className="font-bold text-xl mb-2">Canlı Destek</h1>
      <input className="border rounded px-2 py-1" type="text" placeholder="Adınızı girin" value={name} onChange={e=>setName(e.target.value)} />
      <button className="bg-blue-500 text-white rounded px-4 py-2" disabled={!name} onClick={startChat}>Sohbete Başla</button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}