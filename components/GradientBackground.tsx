"use client";

export default function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0f] overflow-hidden">
      {/* Blue glow */}
      <div className="absolute top-[-10%] left-[5%] w-[600px] h-[600px] bg-[#3f7fff] rounded-full blur-[160px] opacity-40"></div>

      {/* Purple glow */}
      <div className="absolute bottom-[-5%] right-[5%] w-[700px] h-[700px] bg-[#8a4bff] rounded-full blur-[180px] opacity-40"></div>

      {/* Soft white glow */}
      <div className="absolute top-[30%] right-[30%] w-[450px] h-[450px] bg-white rounded-full blur-[220px] opacity-10"></div>
    </div>
  );
}
