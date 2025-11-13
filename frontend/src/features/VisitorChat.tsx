import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function VisitorChat({ name, conversationId }:{name:string,conversationId:number}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const ws = useRef<WebSocket|null>(null);
  const fileRef = useRef<HTMLInputElement|null>(null);

  useEffect(() => {
    axios.get(`/api/messages/${conversationId}`).then(res => setMessages(res.data));
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    ws.current = new WebSocket(`${proto}://${window.location.host}/ws/${conversationId}`);
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.error) return;
      setMessages(msgs => [...msgs, {sender: data.sender, type: data.type||'text', content: data.content}]);
    };
    return () => { ws.current?.close(); };
  }, [conversationId]);

  function sendMessage(type:string="text", content?:string) {
    if(type==="text") ws.current?.send(JSON.stringify({sender:"visitor",type:"text",content:input}));
    else if(type!="text" && content) ws.current?.send(JSON.stringify({sender:"visitor",type,content}));
    setInput("");
  }
  async function handleFile(e:any) {
    const file = e.target.files[0];
    if (!file) return;
    let type = file.type.startsWith("image/") ? "image" : (file.type.startsWith("audio/") ? "audio" : null);
    if (!type) return;
    let fd=new FormData();
    fd.append("file", file);
    fd.append("conversation_id", conversationId.toString());
    fd.append("sender","visitor");
    fd.append("type",type);
    let resp = await axios.post("/api/upload", fd, {headers:{"Content-Type":"multipart/form-data"}});
    sendMessage(type, resp.data.url);
  }

  return (
    <div className="flex flex-col xs:h-screen sm:h-screen">
      <div className="font-bold text-xl bg-blue-600 text-white px-2 py-2 text-center">{name} için Sohbet</div>
      <div className="flex-1 overflow-y-auto xs:p-2 sm:p-4" style={{ minHeight: 320 }}>
        {messages.map((m, i) => (
          <div key={i} className={`mb-2 flex ${m.sender==="visitor"? "justify-end":"justify-start"}`}>  
            {m.type==="image" && <img src={m.content} alt="img" style={{maxWidth:160}} />}
            {m.type==="audio" && <audio controls src={m.content}></audio>}
            {m.type==="text" && <div className={`rounded px-3 py-2 max-w-xs break-words ${m.sender==="visitor"? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>{m.content}</div>}
          </div>
        ))}
      </div>
      <form className="flex xs:p-2 sm:p-3 gap-2" onSubmit={e=>{e.preventDefault();sendMessage();}}>
        <input className="border rounded px-2 py-1 flex-1" value={input} onChange={e=>setInput(e.target.value)} maxLength={1024} placeholder="Mesaj..." />
        <input type="file"accept="image/*,audio/*"style={{display:"none"}}ref={fileRef}onChange={handleFile}/>
        <button type="button"className="bg-gray-300 px-3 py-1 rounded"onClick={()=>fileRef.current?.click()}>+</button>
        <button className="bg-blue-500 text-white px-4 py-1 rounded" disabled={!input.trim()} type="submit">Gönder</button>
      </form>
    </div>
  );
}