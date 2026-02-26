import { ReactNode } from "react";
import logoCollabcrea from "@/assets/logo-collabcrea.png";

interface WatermarkOverlayProps {
  children: ReactNode;
  locked?: boolean;
}

const WatermarkOverlay = ({ children, locked = true }: WatermarkOverlayProps) => {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {children}
      {/* Watermark overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden bg-black/20">
        {/* Repeating diagonal watermarks - extended coverage */}
        <div className="absolute -inset-[50%] flex flex-col items-center justify-center gap-8 -rotate-30">
          {Array.from({ length: 12 }).map((_, row) => (
            <div key={row} className="flex items-center gap-10 whitespace-nowrap">
              {Array.from({ length: 6 }).map((_, col) => (
                <div key={col} className="flex flex-col items-center gap-1">
                  <img
                    src={logoCollabcrea}
                    alt=""
                    className="w-8 h-8 opacity-30 select-none"
                    draggable={false}
                  />
                  <span
                    className="text-white/30 text-base font-bold tracking-widest select-none"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                  >
                    COLLABCREA
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* Central large watermark with logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 -rotate-30">
            <img
              src={logoCollabcrea}
              alt=""
              className="w-16 h-16 opacity-40 select-none"
              draggable={false}
            />
            <span
              className="text-white/40 text-4xl font-black tracking-[0.3em] select-none"
              style={{ textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
            >
              COLLABCREA
            </span>
          </div>
        </div>
      </div>
      {/* Lock icon overlay */}
      <div className="absolute bottom-3 right-3 z-20 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Contenu verrouillé
      </div>
    </div>
  );
};

export default WatermarkOverlay;
