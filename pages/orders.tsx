import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface Order {
  _id: string;
  orderDate: string; // Nova Data de Entrada
  customerName: string;
  deliveryDate: string;
  description: string;
  totalValue: number;
  paymentStatus: 'Pendente' | 'Sinal 50% Pago' | 'Pago Integral';
  status: 'Pendente' | 'Em Produção' | 'Pronto' | 'Entregue' | 'Cancelado';
  deliveryMethod: 'Retirada' | 'Entrega';
  address: string;
  contact: string;
  observation: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Data de hoje formatada para inputs
  const today = new Date().toISOString().slice(0, 16);

  const [formData, setFormData] = useState<Partial<Order>>({
    orderDate: today, // Automático: Hoje
    customerName: '', deliveryDate: '', description: '', totalValue: 0,
    paymentStatus: 'Pendente', status: 'Pendente', deliveryMethod: 'Retirada',
    address: '', contact: '', observation: ''
  });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  };

  const handleSync = async () => {
    if (!confirm("⚠️ ATENÇÃO: Isso vai SOBRESCREVER o app com os dados da PLANILHA.\n\nCertifique-se que sua planilha tem a nova coluna 'Data Pedido' (Coluna B).\n\nDeseja continuar?")) return;
    setLoading(true);
    await fetch('/api/orders/sync', { method: 'POST' });
    fetchOrders();
    alert('✅ Sincronizado!');
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    await fetch('/api/orders', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
    });
    alert('Pedido Salvo!');
    resetForm();
    fetchOrders();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este pedido?')) return;
    await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
    fetchOrders();
  };

  const startEdit = (o: Order) => {
    // Ajuste datas para input datetime-local
    const fmtDelivery = o.deliveryDate ? new Date(o.deliveryDate).toISOString().slice(0, 16) : '';
    const fmtOrder = o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 16) : '';
    
    setFormData({ ...o, deliveryDate: fmtDelivery, orderDate: fmtOrder });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ 
        orderDate: today, 
        customerName: '', deliveryDate: '', description: '', totalValue: 0, 
        paymentStatus: 'Pendente', status: 'Pendente', deliveryMethod: 'Retirada', 
        address: '', contact: '', observation: '' 
    });
    setIsEditing(false);
  };

  const openOrders = orders.filter(o => !['Entregue', 'Cancelado'].includes(o.status));
  const historyOrders = orders.filter(o => ['Entregue', 'Cancelado'].includes(o.status)).reverse();

  const getStatusColor = (s: string) => {
      switch(s) {
          case 'Pendente': return 'bg-yellow-100 text-yellow-700';
          case 'Em Produção': return 'bg-blue-100 text-blue-700';
          case 'Pronto': return 'bg-green-100 text-green-700';
          case 'Entregue': return 'bg-gray-100 text-gray-500';
          default: return 'bg-red-100 text-red-500';
      }
  };

  return (
    <div className="min-h-screen relative font-sans text-gray-800 pb-20">
      <Head><title>Encomendas | Glacê</title></Head>
      <div className="fixed inset-0 z-0" style={{ backgroundImage: "url('/bg-confeitaria.png')", backgroundSize: 'cover' }}></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div>
               <h1 className="text-4xl font-serif font-bold text-glace-wine">Encomendas</h1>
               <p className="text-glace-gold text-sm uppercase tracking-widest font-semibold mt-1">Gestão de Pedidos e Prazos</p>
           </div>
           <div className="flex gap-3">
             <button onClick={handleSync} className="bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow hover:bg-green-700 transition text-sm flex items-center gap-2">🔄 Sync Planilha</button>
             <Link href="/" className="bg-white/80 backdrop-blur text-glace-wine px-6 py-2 rounded-full font-bold shadow hover:bg-white transition">⬅️ Voltar</Link>
           </div>
        </div>

        {/* --- FORMULÁRIO COMPLETO --- */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl mb-12 border-t-4 border-glace-gold relative">
            <h2 className="font-serif font-bold text-xl text-glace-wine mb-4 flex items-center gap-2">
                {isEditing ? '✏️ Editando Pedido' : '🎂 Nova Encomenda'}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* LINHA 1: DATAS E CLIENTE */}
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Entrada (Auto)</label>
                    <input type="datetime-local" className="w-full p-3 rounded-lg border bg-gray-100 text-gray-500 cursor-not-allowed" value={formData.orderDate} disabled />
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-red-600 uppercase block mb-1">📅 Data Entrega</label>
                    <input type="datetime-local" className="w-full p-3 rounded-lg border-2 border-red-100 bg-red-50 focus:border-red-300 outline-none" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} required />
                </div>
                <div className="md:col-span-4">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome do Cliente</label>
                    <input className="w-full p-3 rounded-lg border bg-white/80 focus:ring-2 focus:ring-glace-gold outline-none" placeholder="Ex: Maria Silva" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Contato (Whats)</label>
                    <input className="w-full p-3 rounded-lg border bg-white/80 focus:ring-2 focus:ring-glace-gold outline-none" placeholder="(00) 00000-0000" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                </div>

                {/* LINHA 2: DESCRIÇÃO E OBSERVAÇÃO */}
                <div className="md:col-span-7">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Descrição do Pedido (Sabor, Tema, Recheio)</label>
                    <textarea rows={3} className="w-full p-3 rounded-lg border bg-white/80 focus:ring-2 focus:ring-glace-gold outline-none" placeholder="Bolo 2kg, Massa Branca, Recheio Ninho com Morango, Tema Dinossauro..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                </div>
                <div className="md:col-span-5">
                    <label className="text-xs font-bold text-glace-wine uppercase block mb-1">⚠️ Observações (Alergias, Plaquinha)</label>
                    <textarea rows={3} className="w-full p-3 rounded-lg border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-400 outline-none placeholder-yellow-700/50" placeholder="Escrever 'Parabéns João', Sem Lactose, etc." value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})} />
                </div>

                {/* LINHA 3: FINANCEIRO E LOGÍSTICA */}
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Valor Total (R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400">R$</span>
                        <input type="number" className="w-full p-3 pl-8 rounded-lg border bg-white/80 font-bold text-lg text-gray-700" value={formData.totalValue} onChange={e => setFormData({...formData, totalValue: Number(e.target.value)})} />
                    </div>
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Pagamento</label>
                    <select className="w-full p-3 rounded-lg border bg-white/80 cursor-pointer" value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value as any})}>
                        <option>Pendente</option><option>Sinal 50% Pago</option><option>Pago Integral</option>
                    </select>
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status Pedido</label>
                    <select className="w-full p-3 rounded-lg border bg-white/80 cursor-pointer font-medium" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                        <option>Pendente</option><option>Em Produção</option><option>Pronto</option><option>Entregue</option><option>Cancelado</option>
                    </select>
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Entrega / Retirada</label>
                    <select className="w-full p-3 rounded-lg border bg-white/80 font-bold text-glace-wine cursor-pointer" value={formData.deliveryMethod} onChange={e => setFormData({...formData, deliveryMethod: e.target.value as any})}>
                        <option value="Retirada">🛍️ Retirada</option>
                        <option value="Entrega">🛵 Entrega</option>
                    </select>
                </div>

                {/* ENDEREÇO CONDICIONAL */}
                {formData.deliveryMethod === 'Entrega' && (
                    <div className="md:col-span-12 animate-fade-in-down bg-white/50 p-4 rounded-xl border border-dashed border-glace-wine/30">
                        <label className="text-xs font-bold text-glace-wine uppercase block mb-1">📍 Endereço da Entrega</label>
                        <input className="w-full p-3 rounded-lg border border-white bg-white shadow-sm" placeholder="Rua, Número, Bairro e Complemento" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                )}

                <div className="md:col-span-12 mt-2">
                    <button type="submit" className="w-full bg-glace-wine text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-900 transition uppercase tracking-widest text-sm">
                        {isEditing ? '💾 Salvar Alterações' : '✨ Lançar Pedido'}
                    </button>
                </div>
            </form>
        </div>

        {/* --- DASHBOARD DE ABERTAS --- */}
        <div className="mb-16">
            <h3 className="font-serif font-bold text-2xl text-glace-wine mb-6 flex items-center gap-2">
                ⏳ Fila de Produção <span className="text-sm bg-glace-gold text-white px-2 py-1 rounded-full">{openOrders.length}</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {openOrders.map(order => {
                    const date = new Date(order.deliveryDate);
                    const isToday = new Date().toDateString() === date.toDateString();
                    
                    return (
                        <div key={order._id} className={`bg-white rounded-xl shadow-md p-6 border-l-8 relative overflow-hidden transition hover:-translate-y-1 ${isToday ? 'border-red-500 ring-4 ring-red-50' : 'border-blue-500'}`}>
                            {isToday && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase animate-pulse">Entrega Hoje!</span>}
                            
                            <div className="flex justify-between items-start mb-3 mt-2">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                        {order.customerName}
                                        <span className="text-lg filter grayscale opacity-70" title={order.deliveryMethod}>
                                            {order.deliveryMethod === 'Entrega' ? '🛵' : '🛍️'}
                                        </span>
                                    </h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Entrada: {new Date(order.orderDate).toLocaleDateString()}</p>
                                    
                                    {order.deliveryMethod === 'Entrega' && order.address && (
                                        <p className="text-xs text-glace-wine font-semibold mt-1 max-w-[250px] truncate bg-red-50 px-2 py-1 rounded inline-block">📍 {order.address}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-2xl text-gray-800">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    <p className="text-xs font-bold uppercase text-red-500">{date.toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm text-gray-700 italic border border-gray-100 relative">
                                <span className="absolute -top-2 -left-1 text-2xl text-gray-200">"</span>
                                {order.description}
                                {order.observation && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 text-yellow-700 font-semibold not-italic flex gap-1">
                                        <span>⚠️</span> {order.observation}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase mb-4">
                                <span className={`px-2 py-1 rounded ${getStatusColor(order.status)}`}>{order.status}</span>
                                <span className={`px-2 py-1 rounded ${order.paymentStatus === 'Pago Integral' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.paymentStatus}</span>
                            </div>

                            <div className="flex justify-between items-center border-t pt-3 mt-2">
                                <span className="font-bold text-lg text-glace-wine">R$ {order.totalValue.toFixed(2)}</span>
                                <div className="space-x-2">
                                    <button onClick={() => startEdit(order)} className="text-blue-500 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm font-bold transition">Editar</button>
                                    <button onClick={() => handleDelete(order._id)} className="text-red-400 hover:bg-red-50 px-3 py-1 rounded-lg text-sm transition">Excluir</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {openOrders.length === 0 && <p className="text-center text-gray-400 italic mt-10">Nenhuma encomenda pendente.</p>}
        </div>

        {/* --- HISTÓRICO --- */}
        <div className="opacity-80 mt-20">
            <h3 className="font-serif font-bold text-xl text-gray-500 mb-4 border-b border-gray-300 pb-2">📜 Histórico de Concluídas</h3>
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full text-sm text-gray-600">
                    <thead className="bg-gray-100 font-bold">
                        <tr>
                            <th className="px-4 py-3 text-left">Entrega</th>
                            <th className="px-4 py-3 text-left">Cliente</th>
                            <th className="px-4 py-3 text-left">Pedido</th>
                            <th className="px-4 py-3 text-left">Obs</th>
                            <th className="px-4 py-3 text-right">Valor</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {historyOrders.map(order => (
                            <tr key={order._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{new Date(order.deliveryDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-medium">{order.customerName}</td>
                                <td className="px-4 py-3 truncate max-w-[150px]" title={order.description}>{order.description}</td>
                                <td className="px-4 py-3 truncate max-w-[100px] text-yellow-600">{order.observation}</td>
                                <td className="px-4 py-3 text-right">R$ {order.totalValue.toFixed(2)}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold">{order.status}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button onClick={() => startEdit(order)} className="text-blue-400 hover:underline mr-2">Ver</button>
                                    <button onClick={() => handleDelete(order._id)} className="text-red-300 hover:text-red-500">x</button>
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