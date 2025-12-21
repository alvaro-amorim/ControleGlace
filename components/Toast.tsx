import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animação de entrada suave
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-fechar após 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Espera a animação de saída terminar antes de desmontar
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-bold transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'} ${bgColors[type]}`}>
      <span className="text-xl">{icons[type]}</span>
      <p className="text-sm drop-shadow-md">{message}</p>
      <button onClick={() => setIsVisible(false)} className="ml-4 opacity-70 hover:opacity-100 transition text-lg">✕</button>
    </div>
  );
}