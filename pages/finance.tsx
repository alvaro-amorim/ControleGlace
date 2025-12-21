import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Toast from '../components/Toast'; // Seu Card de Notificação
import CustomModal from '../components/CustomModal'; // O Novo Modal de Inputs

// Tipagem baseada na sua planilha
interface Transaction {
  _id: string;
  date: string;
  type: 'Receita' | 'Despesa';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  costCenter: string;
  beneficiary: string;
  status: 'Pago' | 'Pendente' | 'Agendado';
  observation: string;
  paymentDate: string;
  receiptImage: string;
}

// --- SENHA MESTRE ---
const SECURITY_CODE = '104298';

const CATEGORIES_RECEITA = ['Vendas Loja', 'Encomendas', 'iFood', 'Aportes'];
const CATEGORIES_DESPESA = ['Insumos', 'Embalagens', 'Limpeza', 'Aluguel', 'Energia', 'Água', 'Salários', 'Impostos', 'Marketing', 'Manutenção'];
const PAYMENT_METHODS = ['Pix', 'Cartão Crédito', 'Cartão Débito', 'Dinheiro', 'Transferência', 'Boleto'];
const COST_CENTERS = ['Loja Física', 'Produção', 'Administrativo', 'Delivery'];

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle do Toast (Notificação Personalizada)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // Controle do Modal de Cadastro (Formulário)
  const [showModal, setShowModal] = useState(false);

  // Controle do Modal de Confirmação/Input (Novo!)
  const [customModal, setCustomModal] = useState({
    isOpen: false,
    type: 'confirm' as 'confirm' | 'input',
    title: '',
    message: '',
    inputType: 'text' as 'text' | 'number' | 'password',
    onConfirm: (val?: string) => {}
  });

  // Estado para Drag & Drop
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Despesa',
    category: 'Insumos',
    description: '',
    amount: 0,
    paymentMethod: 'Pix',
    costCenter: 'Produção',
    beneficiary: '',
    status: 'Pago',
    observation: '',
    receiptImage: '',
    paymentDate: ''
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

  // --- LÓGICA DE DRAG & DROP E UPLOAD ---
  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChangeFile = (e: any) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        setFormData(prev => ({ ...prev, receiptImage: reader.result as string }));
        setToast({ message: 'Comprovante anexado!', type: 'info' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setToast({ message: 'Lançamento salvo com sucesso!', type: 'success' });
      
      setFormData({ 
        ...formData, 
        description: '', 
        amount: 0, 
        receiptImage: '', 
        beneficiary: '', 
        observation: '' 
      }); 
      setShowModal(false);
      fetchTransactions();
    } else {
      setToast({ message: 'Erro ao salvar.', type: 'error' });
    }
  };

  // --- NOVA LÓGICA DE DELETAR (USANDO MODAL BONITO) ---
  const handleDelete = (id: string) => {
    // 1. Abre Modal de Confirmação (Sim/Não)
    setCustomModal({
        isOpen: true,
        type: 'confirm',
        title: 'Excluir Lançamento',
        message: 'Tem certeza que deseja apagar este registro permanentemente?',
        inputType: 'text',
        onConfirm: () => {
            // 2. Se o usuário clicar em Confirmar, abre o Modal de Senha
            // O timeout é para dar um efeito suave de transição entre um modal e outro
            setTimeout(() => {
                setCustomModal({
                    isOpen: true,
                    type: 'input',
                    title: 'Segurança',
                    message: 'Digite a SENHA MESTRE para confirmar a exclusão:',
                    inputType: 'password',
                    onConfirm: async (password) => {
                        if (password === SECURITY_CODE) {
                            await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
                            setToast({ message: 'Lançamento excluído!', type: 'warning' });
                            fetchTransactions();
                        } else {
                            setToast({ message: 'Senha incorreta!', type: 'error' });
                        }
                    }
                });
            }, 200);
        }
    });
  };

  // Cálculos de Resumo
  const totalReceitas = transactions.filter(t => t.type === 'Receita').reduce((acc, t) => acc + t.amount, 0);
  const totalDespesas = transactions.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + t.amount, 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="min-h-screen relative font-sans text-gray-800 pb-20">
      <Head><title>Financeiro | Glacê</title></Head>

      {/* --- COMPONENTES GLOBAIS DE UI --- */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <CustomModal 
        isOpen={customModal.isOpen}
        type={customModal.type}
        title={customModal.title}
        message={customModal.message}
        inputType={customModal.inputType}
        onConfirm={customModal.onConfirm}
        onClose={() => setCustomModal(prev => ({ ...prev, isOpen: false }))}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />

      <div className="fixed inset-0 z-0" style={{ backgroundImage: "url('/bg-confeitaria.png')", backgroundSize: 'cover' }}></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 className="text-4xl font-serif font-bold text-glace-wine">Financeiro</h1>
                <p className="text-glace-gold text-sm uppercase tracking-widest font-semibold mt-1">Fluxo de Caixa & Lançamentos</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-glace-wine text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-900 transition flex items-center gap-2 transform active:scale-95"
                >
                    <span>+</span> Novo Lançamento
                </button>
                <Link href="/" className="bg-white/80 backdrop-blur text-glace-wine px-6 py-3 rounded-full font-bold shadow-sm hover:bg-white transition">
                    ⬅️ Voltar
                </Link>
            </div>
        </div>

        {/* --- CARDS DE RESUMO --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/90 p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Receitas</p>
                <p className="text-3xl font-bold text-green-600">R$ {totalReceitas.toFixed(2)}</p>
            </div>
            <div className="bg-white/90 p-6 rounded-2xl shadow-lg border-l-4 border-red-500">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Despesas</p>
                <p className="text-3xl font-bold text-red-600">R$ {totalDespesas.toFixed(2)}</p>
            </div>
            <div className="bg-glace-wine text-white p-6 rounded-2xl shadow-lg border-l-4 border-glace-gold relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-xs font-bold text-white/70 uppercase">Saldo Atual</p>
                    <p className="text-3xl font-bold">R$ {saldo.toFixed(2)}</p>
                </div>
                <div className="absolute right-[-20px] top-[-20px] text-white/10 text-9xl font-serif">$</div>
            </div>
        </div>

        {/* --- MODAL DE NOVO LANÇAMENTO (FORMULÁRIO) --- */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-scale-up">
                    <button 
                        onClick={() => setShowModal(false)} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl z-10 p-2"
                    >
                        ✕
                    </button>
                    
                    <div className="p-8 border-b border-gray-100 bg-gray-50 sticky top-0 z-0">
                        <h2 className="font-serif font-bold text-2xl text-glace-wine">Novo Lançamento</h2>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                
                                <div className="md:col-span-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data</label>
                                    <input type="date" className="w-full p-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-glace-gold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label>
                                    <div className="flex bg-gray-100 rounded-xl p-1">
                                        <button type="button" onClick={() => setFormData({...formData, type: 'Receita'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${formData.type === 'Receita' ? 'bg-green-500 text-white shadow' : 'text-gray-500'}`}>Receita</button>
                                        <button type="button" onClick={() => setFormData({...formData, type: 'Despesa'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${formData.type === 'Despesa' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}>Despesa</button>
                                    </div>
                                </div>
                                <div className="md:col-span-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-gray-500 font-bold">R$</span>
                                        <input type="number" step="0.01" className="w-full p-3 pl-10 rounded-xl border bg-gray-50 font-bold text-xl text-gray-800 outline-none focus:ring-2 focus:ring-glace-gold" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} required />
                                    </div>
                                </div>

                                <div className="md:col-span-8">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
                                    <input type="text" placeholder="Ex: Compra de Chocolate" className="w-full p-3 rounded-xl border bg-gray-50 outline-none focus:ring-2 focus:ring-glace-gold" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                                    <select className="w-full p-3 rounded-xl border bg-gray-50 outline-none focus:ring-2 focus:ring-glace-gold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        {(formData.type === 'Receita' ? CATEGORIES_RECEITA : CATEGORIES_DESPESA).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Método Pagamento</label>
                                    <select className="w-full p-3 rounded-xl border bg-gray-50 outline-none focus:ring-2 focus:ring-glace-gold" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Centro de Custo</label>
                                    <select className="w-full p-3 rounded-xl border bg-gray-50 outline-none focus:ring-2 focus:ring-glace-gold" value={formData.costCenter} onChange={e => setFormData({...formData, costCenter: e.target.value})}>
                                        {COST_CENTERS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
                                    <select className={`w-full p-3 rounded-xl border outline-none font-bold ${formData.status === 'Pago' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                        <option value="Pago">Pago / Recebido</option>
                                        <option value="Pendente">Pendente</option>
                                        <option value="Agendado">Agendado</option>
                                    </select>
                                </div>

                                <div className="md:col-span-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Beneficiário / Fornecedor</label>
                                    <input type="text" className="w-full p-3 rounded-xl border bg-gray-50 outline-none focus:ring-2 focus:ring-glace-gold" value={formData.beneficiary} onChange={e => setFormData({...formData, beneficiary: e.target.value})} />
                                </div>
                                <div className="md:col-span-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data Pagamento (Opcional)</label>
                                    <input type="date" className="w-full p-3 rounded-xl border bg-gray-50 outline-none focus:ring-2 focus:ring-glace-gold" value={formData.paymentDate} onChange={e => setFormData({...formData, paymentDate: e.target.value})} />
                                </div>

                                <div className="md:col-span-12">
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Comprovante</label>
                                     <div 
                                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${dragActive ? 'border-glace-gold bg-yellow-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => inputRef.current?.click()}
                                     >
                                        <input ref={inputRef} type="file" className="hidden" onChange={handleChangeFile} accept="image/*,.pdf" />
                                        
                                        {formData.receiptImage ? (
                                            <div className="flex items-center gap-3">
                                                <img src={formData.receiptImage} alt="Preview" className="w-16 h-16 object-cover rounded shadow" />
                                                <div className="text-left">
                                                    <p className="text-green-600 font-bold text-sm">✅ Imagem anexada!</p>
                                                    <p className="text-xs text-gray-400">Clique para alterar</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-3xl mb-1">📎</span>
                                                <p className="text-gray-500 text-sm">Clique ou arraste o comprovante</p>
                                            </>
                                        )}
                                     </div>
                                </div>

                                <div className="md:col-span-12">
                                    <textarea rows={2} className="w-full p-3 rounded-xl border bg-gray-50 outline-none focus:ring-2 focus:ring-glace-gold text-sm" placeholder="Observações..." value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})}></textarea>
                                </div>
                                <div className="md:col-span-12">
                                    <button type="submit" className="w-full py-4 bg-glace-wine text-white font-bold rounded-xl shadow-lg hover:bg-red-900 transition uppercase tracking-widest">
                                        💾 Salvar Lançamento
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* --- TABELA DE HISTÓRICO --- */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-serif font-bold text-xl text-gray-700">Histórico de Movimentações</h3>
                <span className="text-xs text-gray-400 uppercase font-bold">{transactions.length} registros</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-glace-cream text-glace-wine font-bold">
                        <tr>
                            <th className="px-6 py-4 text-left">Data</th>
                            <th className="px-6 py-4 text-left">Descrição</th>
                            <th className="px-6 py-4 text-center">Categoria</th>
                            <th className="px-6 py-4 text-center">Recibo</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map(t => (
                            <tr key={t._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                    {new Date(t.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-700">{t.description}</div>
                                    <div className="text-xs text-gray-400">
                                        {t.beneficiary && <span>{t.beneficiary} • </span>}
                                        {t.paymentMethod}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                        {t.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {t.receiptImage ? (
                                        <span className="text-green-500 text-xl cursor-help" title="Comprovante Anexado">📄</span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold text-lg whitespace-nowrap ${t.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'Receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleDelete(t._id)} 
                                        className="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"
                                        title="Excluir"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}