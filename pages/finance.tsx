import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

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

const CATEGORIES_RECEITA = ['Vendas Loja', 'Encomendas', 'iFood', 'Aportes'];
const CATEGORIES_DESPESA = ['Insumos', 'Embalagens', 'Limpeza', 'Aluguel', 'Energia', 'Água', 'Salários', 'Impostos', 'Marketing', 'Manutenção'];
const PAYMENT_METHODS = ['Pix', 'Cartão Crédito', 'Cartão Débito', 'Dinheiro', 'Transferência', 'Boleto'];
const COST_CENTERS = ['Loja Física', 'Produção', 'Administrativo', 'Delivery'];

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    receiptImage: ''
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
        // Salva a imagem como string Base64 para exibir e salvar no banco
        setFormData(prev => ({ ...prev, receiptImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };
  // ---------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      alert('Lançamento salvo com sucesso!');
      setFormData({ ...formData, description: '', amount: 0, receiptImage: '', beneficiary: '' }); // Limpa campos principais
      fetchTransactions();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir lançamento?')) return;
    await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
    fetchTransactions();
  };

  // Cálculos de Resumo
  const totalReceitas = transactions.filter(t => t.type === 'Receita').reduce((acc, t) => acc + t.amount, 0);
  const totalDespesas = transactions.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + t.amount, 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="min-h-screen relative font-sans text-gray-800 pb-20">
      <Head><title>Financeiro | Glacê</title></Head>

      {/* Fundo */}
      <div className="fixed inset-0 z-0" style={{ backgroundImage: "url('/bg-confeitaria.png')", backgroundSize: 'cover' }}></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 className="text-4xl font-serif font-bold text-glace-wine">Financeiro</h1>
                <p className="text-glace-gold text-sm uppercase tracking-widest font-semibold mt-1">Fluxo de Caixa & Lançamentos</p>
            </div>
            <Link href="/" className="bg-white/80 backdrop-blur text-glace-wine px-6 py-3 rounded-full font-bold shadow-sm hover:bg-white transition">
                ⬅️ Voltar ao Painel
            </Link>
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

        {/* --- FORMULÁRIO COMPLETO (BASEADO NA PLANILHA) --- */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl mb-12 border border-white/60">
            <h2 className="font-serif font-bold text-2xl text-glace-wine mb-6 border-b border-glace-gold/20 pb-2">Novo Lançamento</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Linha 1: Data, Tipo e Valor (Destaques) */}
                    <div className="md:col-span-3">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data Lançamento</label>
                        <input type="date" className="w-full p-3 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label>
                        <div className="flex bg-white/70 rounded-xl p-1 shadow-inner">
                            <button type="button" onClick={() => setFormData({...formData, type: 'Receita'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${formData.type === 'Receita' ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:bg-white'}`}>Receita</button>
                            <button type="button" onClick={() => setFormData({...formData, type: 'Despesa'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${formData.type === 'Despesa' ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:bg-white'}`}>Despesa</button>
                        </div>
                    </div>
                    <div className="md:col-span-6">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor (R$)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-gray-500 font-bold">R$</span>
                            <input type="number" step="0.01" className="w-full p-3 pl-10 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold text-xl font-bold text-gray-800" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} required />
                        </div>
                    </div>

                    {/* Linha 2: Descrição e Categoria */}
                    <div className="md:col-span-8">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição do Lançamento</label>
                        <input type="text" placeholder="Ex: Compra de Chocolate Belga" className="w-full p-3 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                    </div>
                    <div className="md:col-span-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label>
                        <select className="w-full p-3 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            {(formData.type === 'Receita' ? CATEGORIES_RECEITA : CATEGORIES_DESPESA).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Linha 3: Detalhes Financeiros */}
                    <div className="md:col-span-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Meio de Pagamento</label>
                        <select className="w-full p-3 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                             {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Centro de Custo</label>
                        <select className="w-full p-3 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold" value={formData.costCenter} onChange={e => setFormData({...formData, costCenter: e.target.value})}>
                             {COST_CENTERS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-4">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
                        <select className={`w-full p-3 rounded-xl border-none shadow-inner focus:ring-2 focus:ring-glace-gold font-bold ${formData.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="Pago">Pago / Recebido</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Agendado">Agendado</option>
                        </select>
                    </div>

                    {/* Linha 4: Beneficiário e Observação */}
                    <div className="md:col-span-6">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Beneficiário / Fornecedor</label>
                        <input type="text" placeholder="Quem recebeu ou pagou?" className="w-full p-3 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold" value={formData.beneficiary} onChange={e => setFormData({...formData, beneficiary: e.target.value})} />
                    </div>
                    <div className="md:col-span-6">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data do Pagamento (Opcional)</label>
                         <input type="date" className="w-full p-3 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold" value={formData.paymentDate || ''} onChange={e => setFormData({...formData, paymentDate: e.target.value})} />
                    </div>

                    {/* Linha 5: ANEXO (DRAG AND DROP) */}
                    <div className="md:col-span-12">
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Comprovante / Recibo</label>
                         
                         <div 
                            className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${dragActive ? 'border-glace-gold bg-yellow-50 scale-[1.01]' : 'border-gray-300 bg-white/50 hover:border-glace-wine hover:bg-white/80'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                         >
                            <input 
                                ref={inputRef}
                                type="file" 
                                className="hidden" 
                                onChange={handleChangeFile}
                                accept="image/*,.pdf"
                            />
                            
                            {formData.receiptImage ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md border border-gray-200">
                                        {/* Exibe miniatura se for imagem */}
                                        <img src={formData.receiptImage} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-green-600 font-bold text-sm">✅ Comprovante anexado!</p>
                                        <p className="text-xs text-gray-400">Clique para trocar</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <span className="text-4xl mb-2 text-glace-wine">📎</span>
                                    <p className="text-gray-600 font-medium">Arraste e solte o comprovante aqui</p>
                                    <p className="text-xs text-gray-400 mt-1">ou clique para buscar na pasta</p>
                                </>
                            )}
                         </div>
                    </div>

                    {/* Linha Final: Observações e Botão */}
                    <div className="md:col-span-12">
                        <textarea rows={2} className="w-full p-3 rounded-xl border-none bg-white/70 shadow-inner focus:ring-2 focus:ring-glace-gold placeholder-gray-400 text-sm" placeholder="Observações adicionais..." value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})}></textarea>
                    </div>

                    <div className="md:col-span-12">
                        <button type="submit" className="w-full py-4 bg-glace-wine text-white font-bold rounded-xl shadow-lg hover:bg-red-900 transition transform active:scale-[0.99] uppercase tracking-wider text-lg">
                            💾 Lançar no Financeiro
                        </button>
                    </div>

                </div>
            </form>
        </div>

        {/* --- TABELA DE LANÇAMENTOS RECENTES --- */}
        <div className="mt-12">
            <h3 className="font-serif font-bold text-2xl text-gray-700 mb-6">Últimos Movimentos</h3>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <table className="min-w-full text-sm">
                    <thead className="bg-glace-cream text-glace-wine font-bold">
                        <tr>
                            <th className="px-6 py-4 text-left">Data</th>
                            <th className="px-6 py-4 text-left">Descrição</th>
                            <th className="px-6 py-4 text-center">Categoria</th>
                            <th className="px-6 py-4 text-center">Comprovante</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map(t => (
                            <tr key={t._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-bold text-gray-700">
                                    {t.description}
                                    <div className="text-xs text-gray-400 font-normal">{t.beneficiary} • {t.paymentMethod}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                        {t.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {t.receiptImage ? (
                                        <span className="text-green-500 text-lg" title="Comprovante salvo">📄</span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold text-lg ${t.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'Receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleDelete(t._id)} className="text-gray-400 hover:text-red-600 transition">🗑️</button>
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