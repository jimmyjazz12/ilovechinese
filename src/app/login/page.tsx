"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";

export default function LoginPage() {
  const [selected, setSelected] = useState("clem");
  const { user, login } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleLogin = () => {
    if (selected === "admin") {
      // Set admin in localStorage so admin page can read it
      localStorage.setItem("current_user", "admin");
      router.push("/admin");
      return;
    }
    login(selected);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF4B4B] to-[#FF9600] rounded-2xl flex items-center justify-center text-4xl shadow-lg mx-auto mb-4">
            <span role="img" aria-label="dragon">&#x1F409;</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight">
            I Love Chinese
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">Apprends le Mandarin</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E5E7EB]">
          <label
            htmlFor="user-select"
            className="block text-sm font-semibold text-[#1A1A1A] mb-2"
          >
            Qui es-tu ?
          </label>
          <select
            id="user-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#1A1A1A] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#58CC02]/40 focus:border-[#58CC02] transition-all appearance-none cursor-pointer"
          >
            <option value="clem">Clem</option>
            <option value="amelie">Am&eacute;lie</option>
            <option value="admin">Admin</option>
          </select>

          <button
            onClick={handleLogin}
            className="w-full mt-5 py-3.5 rounded-xl text-white font-bold text-base shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg, #58CC02, #46A302)",
            }}
          >
            Entrer
          </button>
        </div>
      </div>
    </div>
  );
}
