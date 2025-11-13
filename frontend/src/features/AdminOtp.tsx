import React, { useState } from "react";
import axios from "axios";

export default function AdminOtp({onOtpValid}:{onOtpValid:(token:string)=>void}) {
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  async function submit() {
    try {
      const fd = new URLSearchParams(); fd.append('otp', otp);
      let resp = await axios.post('/api/admin/login', fd);
      onOtpValid(resp.data.token);
    } catch {
      setErr('Yanlış OTP veya Bağlantı hatası!');
    }
  }
  return (
    <div className="flex flex-col gap-4 p-4 xs:w-full">
      <h1 className="font-bold text-xl mb-4">Admin OTP Girişi</h1>
      <input className="border rounded px-2 py-1" type="text" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" />
      <button className="bg-green-600 text-white rounded px-4 py-2" disabled={!otp} onClick={submit}>Giriş</button>
      {err && <span className="text-red-500">{err}</span>}
    </div>
  );
}