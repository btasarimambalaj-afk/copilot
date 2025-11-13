import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminList({token,onSelectUser}:{token:string,onSelectUser:(user:{id:number,name:string,conversationId:number})=>void}) {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(()=>{
    axios.get('/api/_admin/visitors', { params: { token } }).then(res=>setUsers(res.data));
  },[token]);
  return (
    <div className="flex flex-col gap-2 p-4 xs:w-full">
      <h2 className="font-bold text-lg mb-2">Ziyaretçiler Listesi</h2>
      {!users.length && <div className="text-gray-400">Henüz kimse yazışmıyor.</div>}
      {users.map(u=>(
        <button key={u.id} className="border rounded px-4 py-2 text-left bg-gray-50 hover:bg-blue-100" onClick={()=>onSelectUser(u)}>{u.name} (ID: {u.id})</button>
      ))}
    </div>
  );
}