"use client";

import { ArrowBigDown, ArrowBigUp, Redo } from "lucide-react";
import { useState } from "react";

export default function Wallet() {
  const [position, setPosition] = useState({ x: -172, y: -172 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      x: event.clientX - rect.left - 192, // Adjusted for centering (half of 96px radius)
      y: event.clientY - rect.top - 192, // Adjusted for centering (half of 96px radius)
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: -172, y: -172 });
  };

  const gradientStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transition: "left 0.3s linear, top 0.3s linear", // Linear animation
  };

  return (
    <div
      className="bg-theme-secondary-muted p-6 rounded-lg flex flex-col justify-between w-96 h-56 transition hover:scale-105 duration-300 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-between items-center">
        <p className="text-4xl text-theme-accent font-bold">23$</p>
        <p className="text-theme-primary">WERITY</p>
      </div>
      <div className="flex justify-between items-end">
        <p className="text-theme-primary">ID123456</p>
        <div className="flex flex-col gap-0.5 items-end text-theme-primary">
          <div className="flex items-center gap-1">
            <p>Send</p>
            <Redo size={20} />
          </div>
          <div className="flex items-center gap-1">
            <p>Deposit</p>
            <ArrowBigUp size={20} />
          </div>
          <div className="flex items-center gap-1">
            <p>Withdraw</p>
            <ArrowBigDown size={20} />
          </div>
        </div>
      </div>
      {/* circular gradient */}
      <div
        className="absolute rounded-full bg-theme-wallet-gradient blur-3xl w-96 h-96 bg-clip-content pointer-events-none"
        style={gradientStyle}
      ></div>
    </div>
  );
}
