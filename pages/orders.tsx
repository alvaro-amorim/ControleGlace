import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Definição do Tipo de Pedido
interface Order {
  _id: string;
  customerName: string;
  deliveryDate: string;
  description: string;
  totalValue: number;
  status: 'pendente' | 'producao' | 'entrega' | 'concluido';
  paymentStatus: 'Pendente' | 'Sinal 50% Pago' | 'Pago Integral';
  contact?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Order>>({
    customerName: '',
    deliveryDate: '',
    description: '',
    totalValue: 0,
    status: 'pendente',
    paymentStatus: 'Pendente',
    contact: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este pedido?')) return;
    await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
    fetchOrders();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    
    await fetch('/api/orders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    setIsModalOpen(false);
    resetForm();
    fetchOrders();
  };

  const startEdit = (order: Order) => {
    setFormData(order);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
        customerName: '', deliveryDate: '', description: '', 
        totalValue: 0, status: 'pendente', paymentStatus: 'Pendente', contact: ''
    });
    setIsEditing(false);
  };

  // Cores dos Status
  const getStatusColor = (status: string) => {
    switch(status) {
        case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'producao': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'entrega': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'concluido': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-gray-800">
      <Head><title>Pedidos | Glacê</title></Head>

      {/* --- FUNDO PREMIUM --- */}
      <div className="fixed inset-0 z-0" style={{ backgroundImage: "url('/bg-confeitaria.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div>
                <h1 className="text-4xl font-serif font-bold text-glace-wine">Encomendas</h1>
                <p className="text-glace-gold text-sm uppercase tracking-widest font-semibold">Gestão de Pedidos</p>
            </div>
            <div className="space-x-3">
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }} 
                    className="bg-glace-wine hover:bg-red-900 text-white px-6 py-2 rounded-full shadow-lg transition transform hover:scale-105 font-bold"
                >
                    + Nova Encomenda
                </button>
                <Link href="/" className="bg-white text-glace-wine border border-glace-wine px-6 py-2 rounded-full font-bold hover:bg-red-50 transition">
                    Voltar
                </Link>
            </div>
        </div>

        {/* --- GRID DE PEDIDOS (CARDS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && <p className="col-span-3 text-center text-gray-400">Carregando pedidos...</p>}
            
            {!loading && orders.length === 0 && (
                <div className="col-span-3 glass-panel p-10 text-center rounded-2xl">
                    <p className="text-gray-400 text-lg font-serif italic">Nenhuma encomenda ativa no momento.</p>
                </div>
            )}

            {orders.map((order) => (
                <div key={order._id} className="glass-panel rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-glace-wine flex flex-col justify-between group">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-serif font-bold text-xl text-gray-800 group-hover:text-glace-wine transition">{order.customerName}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                                    Entrega: {new Date(order.deliveryDate).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                {order.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed bg-white/50 p-3 rounded-lg border border-gray-100">
                            {order.description}
                        </p>

                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-gray-500 font-bold">Total:</span>
                            <span className="font-bold text-glace-wine text-lg">R$ {order.totalValue.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Pagamento:</span>
                            <span className={`font-bold ${order.paymentStatus.includes('Pago Integral') ? 'text-green-600' : 'text-orange-500'}`}>
                                {order.paymentStatus}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition">
                        <button onClick={() => startEdit(order)} className="text-blue-500 hover:text-blue-700 text-sm font-bold bg-blue-50 px-3 py-1 rounded-lg">
                            Editar
                        </button>
                        <button onClick={() => handleDelete(order._id)} className="text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 px-3 py-1 rounded-lg">
                            Excluir
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* --- MODAL DE NOVO PEDIDO --- */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-t-8 border-glace-gold">
                    <div className="bg-gray-50 px-8 py-5 border-b flex justify-between items-center">
                        <h2 className="font-serif text-2xl font-bold text-glace-wine">
                            {isEditing ? '✏️ Editar Encomenda' : '🍰 Nova Encomenda'}
                        </h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-3xl">×</button>
                    </div>
                    
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-glace-gold uppercase mb-1">Nome do Cliente</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none"
                                    value={formData.customerName} 
                                    onChange={e => setFormData({...formData, customerName: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-glace-gold uppercase mb-1">Contato / WhatsApp</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none"
                                    value={formData.contact} 
                                    onChange={e => setFormData({...formData, contact: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-glace-gold uppercase mb-1">Detalhes do Pedido (Sabor, Decoração...)</label>
                            <textarea 
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none resize-none"
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data Entrega</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none"
                                    value={formData.deliveryDate ? formData.deliveryDate.split('T')[0] : ''} 
                                    onChange={e => setFormData({...formData, deliveryDate: e.target.value})} 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor Total (R$)</label>
                                <input 
                                    type="number" step="0.01"
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none font-bold text-gray-700"
                                    value={formData.totalValue} 
                                    onChange={e => setFormData({...formData, totalValue: Number(e.target.value)})} 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status Pagamento</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none bg-white"
                                    value={formData.paymentStatus} 
                                    onChange={e => setFormData({...formData, paymentStatus: e.target.value as any})}
                                >
                                    <option>Pendente</option>
                                    <option>Sinal 50% Pago</option>
                                    <option>Pago Integral</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Status da Produção</label>
                            <div className="flex gap-4">
                                {['pendente', 'producao', 'entrega', 'concluido'].map((s) => (
                                    <label key={s} className={`cursor-pointer border rounded-lg px-4 py-2 flex items-center gap-2 transition ${formData.status === s ? 'bg-glace-wine text-white border-glace-wine' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                                        <input 
                                            type="radio" 
                                            name="status" 
                                            value={s} 
                                            checked={formData.status === s}
                                            onChange={() => setFormData({...formData, status: s as any})}
                                            className="hidden" 
                                        />
                                        <span className="capitalize font-bold text-sm">{s}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 mt-4 text-lg">
                            {isEditing ? 'Salvar Alterações' : 'Confirmar Encomenda'}
                        </button>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}