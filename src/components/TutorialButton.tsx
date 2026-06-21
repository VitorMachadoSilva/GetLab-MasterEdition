'use client';

import { useState } from 'react';
import { HelpCircle, X, Play } from 'lucide-react';

interface TutorialButtonProps {
  onStart: () => void;
  autoDisabled?: boolean;
  onEnableAuto?: () => void;
  pageLabel?: string;
}

export default function TutorialButton({
  onStart,
  autoDisabled = false,
  onEnableAuto,
  pageLabel = 'esta página',
}: TutorialButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-4">
            <div className="w-64 rounded-2xl border-2 border-primary-100 bg-white p-4 shadow-2xl">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-800">Precisa de ajuda?</h4>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Faça um tour guiado por {pageLabel} e veja as principais ações desta tela.
              </p>
              {autoDisabled && (
                <div className="mb-3 rounded-xl bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800">
                  O tutorial automático desta página está desativado.
                </div>
              )}
              <button
                onClick={() => {
                  setShowTooltip(false);
                  onStart();
                }}
                className="btn-modern w-full bg-gradient-fmpsc text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Iniciar Tutorial
              </button>
              {autoDisabled && onEnableAuto && (
                <button
                  onClick={() => {
                    onEnableAuto();
                    setShowTooltip(false);
                  }}
                  className="mt-2 w-full rounded-xl border-2 border-primary-100 bg-white px-4 py-2 text-sm font-bold text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  Reativar tutorial automático
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="relative w-16 h-16 rounded-full shadow-modern hover:shadow-glow transition-all group-hover:scale-110"
          title="Ajuda e Tutorial"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
          
          {/* Button content */}
          <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <HelpCircle className="text-white" size={32} strokeWidth={2.5} />
          </div>

          {/* Ping animation */}
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-500"></span>
          </span>
        </button>
      </div>
    </>
  );
}
