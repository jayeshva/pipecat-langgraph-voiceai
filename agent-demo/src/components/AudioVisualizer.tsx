import React, { useEffect, useRef } from 'react';
import type { VoiceState } from '../types';

interface AudioVisualizerProps {
  state: VoiceState;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      phase += 0.06;

      let amplitude = 12;
      let strokeColor = '#38bdf8'; // Cyan default
      let glowColor = 'rgba(56, 189, 248, 0.5)';

      if (state === 'agent_speaking') {
        amplitude = 42;
        strokeColor = '#c084fc'; // Purple speaking
        glowColor = 'rgba(192, 132, 252, 0.8)';
      } else if (state === 'user_speaking') {
        amplitude = 34;
        strokeColor = '#34d399'; // Emerald speaking
        glowColor = 'rgba(52, 211, 153, 0.8)';
      } else if (state === 'processing') {
        amplitude = 22;
        strokeColor = '#fbbf24'; // Amber processing
        glowColor = 'rgba(251, 191, 36, 0.8)';
      } else if (state === 'listening') {
        amplitude = 16;
        strokeColor = '#38bdf8';
        glowColor = 'rgba(56, 189, 248, 0.5)';
      } else {
        amplitude = 4;
        strokeColor = '#475569';
        glowColor = 'rgba(71, 85, 105, 0.2)';
      }

      ctx.save();
      ctx.shadowBlur = 24;
      ctx.shadowColor = glowColor;

      // Draw 4 layered sine waves with gradient colors
      [0.5, 0.75, 1.0].forEach((scale, index) => {
        ctx.beginPath();
        ctx.lineWidth = index === 2 ? 3 : 1.5;
        ctx.strokeStyle = index === 2 ? strokeColor : strokeColor + '88';

        for (let x = 0; x < width; x++) {
          const y =
            centerY +
            Math.sin((x * 0.02) + phase + (index * 1.4)) *
              amplitude *
              scale *
              Math.sin((x / width) * Math.PI);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state]);

  return (
    <div className="relative flex flex-col items-center justify-center py-6 select-none">
      {/* Outer 3D Orbital Ring 1 */}
      <div
        className={`absolute w-52 h-52 rounded-full border border-cyan-500/20 pointer-events-none transition-all duration-700 ${
          state !== 'disconnected' ? 'animate-ring-spin opacity-80' : 'opacity-20'
        }`}
      />
      {/* Outer 3D Orbital Ring 2 */}
      <div
        className={`absolute w-44 h-44 rounded-full border border-purple-500/25 pointer-events-none transition-all duration-700 ${
          state !== 'disconnected' ? 'animate-ring-spin-reverse opacity-80' : 'opacity-20'
        }`}
      />

      {/* Main Glowing Hologram Orb Container */}
      <div
        className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 z-10 ${
          state === 'agent_speaking'
            ? 'animate-orb-active bg-gradient-to-tr from-purple-600/30 via-indigo-600/30 to-fuchsia-600/30 border-2 border-purple-400/80 shadow-[0_0_50px_rgba(192,132,252,0.6)]'
            : state === 'user_speaking'
            ? 'bg-gradient-to-tr from-emerald-600/30 via-teal-600/30 to-cyan-600/30 border-2 border-emerald-400/80 shadow-[0_0_50px_rgba(52,211,153,0.6)]'
            : state === 'processing'
            ? 'bg-gradient-to-tr from-amber-600/20 via-orange-600/20 to-yellow-600/20 border-2 border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.5)]'
            : state === 'listening'
            ? 'bg-gradient-to-tr from-sky-600/20 via-cyan-600/20 to-blue-600/20 border-2 border-sky-400/60 shadow-[0_0_30px_rgba(56,189,248,0.4)]'
            : 'bg-slate-900/60 border border-slate-800/80'
        }`}
      >
        {/* Inner Glowing Core */}
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
            state === 'agent_speaking'
              ? 'bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-indigo-500 shadow-[0_0_40px_rgba(192,132,252,0.9)]'
              : state === 'user_speaking'
              ? 'bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_40px_rgba(52,211,153,0.9)]'
              : state === 'processing'
              ? 'bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-400 animate-pulse shadow-[0_0_30px_rgba(251,191,36,0.8)]'
              : state === 'listening'
              ? 'bg-gradient-to-tr from-sky-400 via-cyan-400 to-blue-500 shadow-[0_0_25px_rgba(56,189,248,0.7)]'
              : 'bg-slate-800/90 border border-slate-700/80'
          }`}
        >
          {/* Glass Core Pupil */}
          <div className="w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                state === 'agent_speaking'
                  ? 'bg-purple-200 animate-ping shadow-[0_0_15px_#c084fc]'
                  : state === 'user_speaking'
                  ? 'bg-emerald-200 animate-ping shadow-[0_0_15px_#34d399]'
                  : state === 'processing'
                  ? 'bg-amber-200 animate-ping shadow-[0_0_15px_#fbbf24]'
                  : state === 'listening'
                  ? 'bg-sky-200 shadow-[0_0_10px_#38bdf8]'
                  : 'bg-slate-600'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Cyber Waveform Canvas */}
      <canvas
        ref={canvasRef}
        width={340}
        height={76}
        className="mt-5 rounded-xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-md shadow-lg"
      />
    </div>
  );
};
