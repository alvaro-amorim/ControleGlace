import { useEffect, useState } from 'react';

interface CustomModalProps {
  isOpen: boolean;
  type: 'confirm' | 'input' | 'alert'; // Tipos de modal
  title: string;
  message: string;
  inputType?: 'text' | 'number' | 'password';
  confirmText?: string;
  cancelText?: string;
  onConfirm: (inputValue?: string) => void;
  onClose: () => void;
}

export default function CustomModal({ 
  isOpen, type, title, message, inputType = 'text', 
  confirmText = 'Confirmar', cancelText = 'Cancelar', 
  onConfirm, onClose 
}: CustomModalProps) {
  
  const [inputValue, setInputValue] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setInputValue(''); // Limpa input ao abrir
    } else {
      setTimeout(() => setShow(false), 300);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  const handleConfirm = (e?: React.FormEvent) => {
    e?.preventDefault();
    onConfirm(inputValue);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Fundo Escuro com Blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Janela do Modal */}
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        
        {/* Faixa Colorida no Topo */}
        <div className={`h-2 w-full ${title.includes('Excluir') || title.includes('Saída') ? 'bg-red-500' : 'bg-glace-wine'}`}></div>

        <div className="p-6">
          <h3 className="text-xl font-serif font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{message}</p>

          {/* Campo de Input (se necessário) */}
          {type === 'input' && (
            <form onSubmit={handleConfirm}>
              <input 
                autoFocus
                type={inputType} 
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-bold text-gray-700 focus:border-glace-wine focus:ring-4 focus:ring-glace-wine/10 outline-none transition-all"
                placeholder={inputType === 'password' ? '••••••' : 'Digite aqui...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </form>
          )}

          {/* Botões */}
          <div className="flex gap-3 mt-6 justify-end">
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => handleConfirm()}
              className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition transform active:scale-95 ${title.includes('Excluir') ? 'bg-red-500 hover:bg-red-600' : 'bg-glace-wine hover:bg-red-900'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}