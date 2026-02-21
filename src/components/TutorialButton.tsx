'use client';

import { useState } from 'react';
import { HelpCircle, X, Play } from 'lucide-react';

interface TutorialButtonProps {
  onStart: () => void;
}

export default function TutorialButton({ onStart }: TutorialButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Tooltip — abre para cima e para a esquerda, com largura controlada */}
        {showTooltip && (
          <div className="absolute bottom-[calc(100%+12px)] right-0 animate-fade-in-up">
            <div className="glass rounded-2xl shadow-modern border-2 border-white/20 p-3 w-56">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-800 text-sm">🎓 Precisa de ajuda?</h4>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3 leading-snug">
                Faça um tour guiado pela plataforma e aprenda a usar todas as funcionalidades!
              </p>
              <button
                onClick={() => {
                  setShowTooltip(false);
                  onStart();
                }}
                className="btn-modern w-full bg-gradient-fmpsc text-white px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-2"
              >
                <Play size={14} />
                Iniciar Tutorial
              </button>
            </div>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="relative w-12 h-12 rounded-full shadow-modern hover:shadow-glow transition-all group-hover:scale-110"
          title="Ajuda e Tutorial"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>

          {/* Button content */}
          <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <HelpCircle className="text-white" size={26} strokeWidth={2.5} />
          </div>

          {/* Ping animation */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary-500"></span>
          </span>
        </button>
      </div>
    </>
  );
}