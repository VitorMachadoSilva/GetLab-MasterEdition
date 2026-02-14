'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Step {
  target: string;
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  disableBeacon?: boolean;
}

interface CustomJoyrideProps {
  run: boolean;
  steps: Step[];
  onCallback: (data: any) => void;
}

export default function CustomJoyride({ run, steps, onCallback }: CustomJoyrideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!run || steps.length === 0) return;

    const step = steps[currentStep];
    if (step.target === 'body' || !step.target) {
      setTargetPosition({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });

      // Scroll suave até o elemento
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, run, steps]);

  if (!run || steps.length === 0) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const isCentered = step.placement === 'center' || step.target === 'body';

  const handleNext = () => {
    if (isLast) {
      onCallback({ status: 'finished', type: 'step:after' });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onCallback({ status: 'skipped', type: 'tour:end' });
  };

  const getTooltipPosition = () => {
    if (isCentered) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 200;

    let top = targetPosition.top;
    let left = targetPosition.left;

    switch (step.placement) {
      case 'bottom':
        top = targetPosition.top + targetPosition.height + padding;
        left = targetPosition.left + targetPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = targetPosition.top - tooltipHeight - padding;
        left = targetPosition.left + targetPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetPosition.top + targetPosition.height / 2 - tooltipHeight / 2;
        left = targetPosition.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetPosition.top + targetPosition.height / 2 - tooltipHeight / 2;
        left = targetPosition.left + targetPosition.width + padding;
        break;
      default:
        top = targetPosition.top + targetPosition.height + padding;
        left = targetPosition.left;
    }

    // Garantir que está dentro da viewport
    const maxLeft = window.innerWidth - tooltipWidth - 20;
    const maxTop = window.innerHeight - tooltipHeight - 20;
    left = Math.max(20, Math.min(left, maxLeft));
    top = Math.max(20, Math.min(top, maxTop));

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Background blur */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Highlight area - SEM backdrop-blur */}
        {!isCentered && targetPosition.width > 0 && (
          <>
            {/* Área destacada limpa (sem blur) */}
            <div
              className="absolute bg-transparent"
              style={{
                top: targetPosition.top - 8,
                left: targetPosition.left - 8,
                width: targetPosition.width + 16,
                height: targetPosition.height + 16,
                boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
                zIndex: 9999,
              }}
            />
            {/* Borda animada ao redor */}
            <div
              className="absolute rounded-xl border-4 border-primary-400 animate-pulse pointer-events-none"
              style={{
                top: targetPosition.top - 12,
                left: targetPosition.left - 12,
                width: targetPosition.width + 24,
                height: targetPosition.height + 24,
                zIndex: 10000,
              }}
            />
          </>
        )}
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[9999] animate-scale-in pointer-events-auto"
        style={getTooltipPosition()}
      >
        <div className="glass rounded-2xl shadow-modern border-2 border-white/20 overflow-hidden max-w-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-5 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {step.title && (
                  <h3 className="text-xl font-black mb-1">{step.title}</h3>
                )}
                <div className="text-sm font-semibold opacity-90">
                  Passo {currentStep + 1} de {steps.length}
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 bg-white">
            <p className="text-gray-700 leading-relaxed font-medium">
              {step.content}
            </p>
          </div>

          {/* Footer */}
          <div className="p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 font-semibold"
            >
              Pular Tutorial
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold flex items-center gap-2 transition-all"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="btn-modern px-6 py-2 bg-gradient-fmpsc text-white rounded-xl font-bold flex items-center gap-2 shadow-modern hover:shadow-glow"
              >
                {isLast ? (
                  <>
                    Concluir ✓
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
