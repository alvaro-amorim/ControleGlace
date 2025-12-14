import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Definição dos tipos
interface Transaction {
  _id: string;
  type: 'entrada' | 'saida';
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  status: 'pago' | 'pendente';
  attachment?: string;
  costCenter?: string;
  payee?: string;
  dueDate?: string;
  observation?: string;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'saida',
    status: 'pago',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    category: 'Insumos',
    paymentMethod: 'Pix',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const res = await fetch('/api/finance');
    const data = await res.json();
    if (data.success) setTransactions(data.data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
    fetchTransactions();
  };

  // --- CÂMERA ---
  const startCamera = async () => {
    setShowCamera(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0, 300, 200);
            const imageData = canvasRef.current.toDataURL('image/jpeg');
            setFormData({ ...formData, attachment: imageData });
            
            // Para a câmera
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
            setShowCamera(false);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    setIsModalOpen(false);
    setFormData({ type: 'saida', status: 'pago', date: new Date().toISOString().split('T')[0], amount: 0, description: '' });
    fetchTransactions();
  };

  // Cálculos de Resumo
  const totalEntradas = transactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0);
  const totalSaidas = transactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="min-h-screen relative font-sans text-gray-800">
      <Head><title>Financeiro | Glacê</title></Head>

      {/* --- FUNDO PADRÃO --- */}
      <div className="fixed inset-0 z-0" style={{ backgroundImage: "url('/bg-confeitaria.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      {/* --- CONTEÚDO --- */}
      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 className="text-4xl font-serif font-bold text-glace-wine">Financeiro</h1>
                <p className="text-glace-gold text-sm uppercase tracking-widest font-semibold">Fluxo de Caixa</p>
            </div>
            <div className="space-x-3">
                <button onClick={() => setIsModalOpen(true)} className="bg-glace-wine hover:bg-red-900 text-white px-6 py-2 rounded-full shadow-lg transition transform hover:scale-105 font-bold">
                    + Novo Lançamento
                </button>
                <Link href="/" className="bg-white text-glace-wine border border-glace-wine px-6 py-2 rounded-full font-bold hover:bg-red-50 transition">
                    Voltar
                </Link>
            </div>
        </div>

        {/* --- CARDS DE RESUMO (GLASSMORPHISM) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
                <p className="text-sm text-gray-500 font-bold uppercase">Entradas</p>
                <p className="text-3xl font-serif text-green-600 font-bold">R$ {totalEntradas.toFixed(2)}</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
                <p className="text-sm text-gray-500 font-bold uppercase">Saídas</p>
                <p className="text-3xl font-serif text-red-600 font-bold">R$ {totalSaidas.toFixed(2)}</p>
            </div>
            <div className={`glass-panel p-6 rounded-2xl shadow-lg border-l-4 ${saldo >= 0 ? 'border-glace-gold' : 'border-red-600'}`}>
                <p className="text-sm text-gray-500 font-bold uppercase">Saldo Atual</p>
                <p className={`text-4xl font-serif font-bold ${saldo >= 0 ? 'text-glace-wine' : 'text-red-600'}`}>
                    R$ {saldo.toFixed(2)}
                </p>
            </div>
        </div>

        {/* --- TABELA (CARD BRANCO) --- */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-glace-cream text-glace-wine font-serif font-bold border-b border-glace-gold/30">
                        <tr>
                            <th className="px-6 py-4 text-left">Data</th>
                            <th className="px-6 py-4 text-left">Descrição</th>
                            <th className="px-6 py-4 text-left">Categoria</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Carregando dados...</td></tr>}
                        {!loading && transactions.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum lançamento encontrado.</td></tr>
                        )}
                        {transactions.map((t) => (
                            <tr key={t._id} className="hover:bg-red-50/30 transition-colors">
                                <td className="px-6 py-4 text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    {t.description}
                                    {t.attachment && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 rounded">📎 Foto</span>}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{t.category}</td>
                                <td className={`px-6 py-4 text-right font-bold ${t.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'saida' ? '- ' : ''}R$ {t.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {t.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleDelete(t._id)} className="text-gray-400 hover:text-red-600 transition">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- MODAL DE NOVO LANÇAMENTO --- */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-8 border-glace-wine">
                    <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="font-serif text-xl font-bold text-glace-wine">Novo Lançamento</h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl">×</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">TIPO</label>
                                <select 
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-glace-gold outline-none"
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                                >
                                    <option value="saida">🔴 Saída (Despesa)</option>
                                    <option value="entrada">🟢 Entrada (Receita)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">VALOR (R$)</label>
                                <input 
                                    type="number" step="0.01" required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-glace-gold outline-none"
                                    value={formData.amount} 
                                    onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">DESCRIÇÃO</label>
                            <input 
                                type="text" required placeholder="Ex: Compra de Farinha"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-glace-gold outline-none"
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">CATEGORIA</label>
                                <select 
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-glace-gold outline-none"
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option>Insumos</option>
                                    <option>Embalagens</option>
                                    <option>Vendas</option>
                                    <option>Fixos (Luz/Água)</option>
                                    <option>Outros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">DATA</label>
                                <input 
                                    type="date" 
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-glace-gold outline-none"
                                    value={formData.date} 
                                    onChange={e => setFormData({...formData, date: e.target.value})} 
                                />
                            </div>
                        </div>

                        {/* Área da Câmera */}
                        <div className="border-t pt-4">
                            <label className="block text-xs font-bold text-gray-500 mb-2">COMPROVANTE (FOTO)</label>
                            
                            {!showCamera && !formData.attachment && (
                                <button type="button" onClick={startCamera} className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition flex items-center justify-center gap-2">
                                    📷 Abrir Câmera
                                </button>
                            )}

                            {showCamera && (
                                <div className="space-y-2">
                                    <video ref={videoRef} autoPlay className="w-full rounded-lg bg-black h-48 object-cover"></video>
                                    <button type="button" onClick={capturePhoto} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold shadow">
                                        📸 Capturar Foto
                                    </button>
                                </div>
                            )}

                            {formData.attachment && (
                                <div className="relative mt-2">
                                    <img src={formData.attachment} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, attachment: undefined})}
                                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                    >
                                        X
                                    </button>
                                    <p className="text-center text-xs text-green-600 font-bold mt-1">Foto anexada com sucesso!</p>
                                </div>
                            )}
                            <canvas ref={canvasRef} width="300" height="200" className="hidden"></canvas>
                        </div>

                        <button type="submit" className="w-full bg-glace-wine hover:bg-red-900 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 mt-4">
                            Salvar Lançamento
                        </button>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}