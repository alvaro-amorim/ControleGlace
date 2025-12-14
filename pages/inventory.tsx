import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface Product {
  _id: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  category: string;
  costPrice: number;
  supplier: string;
  observation: string;
  lastEntryDate: string;
}

const SECURITY_CODE = '104298';

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [minQtyLocked, setMinQtyLocked] = useState(true);

  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [normalItems, setNormalItems] = useState<Product[]>([]);

  const [formData, setFormData] = useState({ 
    _id: '', sku: '', name: '', quantity: 0, unit: 'un', minQuantity: 5,
    category: 'Ingredientes', costPrice: 0, supplier: '', observation: '',
    lastEntryDate: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/inventory');
    const data = await res.json();
    if (data.success) {
      const all: Product[] = data.data;
      const critical = all.filter(p => p.quantity <= p.minQuantity);
      const normal = all.filter(p => p.quantity > p.minQuantity);

      // Ordena alfabeticamente
      critical.sort((a, b) => a.name.localeCompare(b.name));
      normal.sort((a, b) => a.name.localeCompare(b.name));

      setLowStockItems(critical);
      setNormalItems(normal);
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/inventory/sync', { method: 'POST' });
      fetchProducts();
      alert('Sincronizado com a Planilha!');
    } catch (e) { alert('Erro no Sync'); }
    setIsSyncing(false);
  };

  const handleUnlockMinQty = () => {
    const code = prompt("🔒 Digite o código para alterar o ESTOQUE MÍNIMO:");
    if (code === SECURITY_CODE) {
        setMinQtyLocked(false);
        alert("🔓 Campo liberado.");
    } else {
        alert("❌ Código incorreto.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
        const code = prompt("🔒 Digite o código para SALVAR ALTERAÇÃO:");
        if (code !== SECURITY_CODE) return alert("❌ Código incorreto!");
    }

    let payload = { ...formData };
    if (!isEditing) {
        payload.lastEntryDate = new Date().toISOString().split('T')[0];
    }

    const method = isEditing ? 'PUT' : 'POST';
    const res = await fetch('/api/inventory', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (res.ok) {
      alert(isEditing ? 'Atualizado!' : 'Cadastrado!');
      resetForm();
      fetchProducts();
    } else {
      alert('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir item?')) return;
    const code = prompt("🔒 Digite o código para EXCLUIR:");
    if (code !== SECURITY_CODE) return alert("❌ Código incorreto!");

    await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const handleQuickAdd = async (p: Product) => {
    const code = prompt("🔒 Digite o código para DAR ENTRADA:");
    if (code !== SECURITY_CODE) return alert("❌ Código incorreto!");

    const qtdStr = prompt(`Quantos "${p.unit}" de ${p.name} chegaram?`);
    if (!qtdStr) return;
    const qtdToAdd = Number(qtdStr);

    if (isNaN(qtdToAdd) || qtdToAdd <= 0) return alert("Valor inválido");

    const newQuantity = p.quantity + qtdToAdd;
    const payload = { 
        ...p, 
        quantity: newQuantity,
        lastEntryDate: new Date().toISOString().split('T')[0]
    };

    await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    alert(`Estoque atualizado!`);
    fetchProducts();
  };

  const startEdit = (p: Product) => {
    setFormData({
        _id: p._id, sku: p.sku, name: p.name, quantity: p.quantity, unit: p.unit, 
        minQuantity: p.minQuantity, category: p.category || 'Ingredientes', 
        costPrice: p.costPrice || 0, supplier: p.supplier || '', observation: p.observation || '',
        lastEntryDate: p.lastEntryDate || ''
    }); 
    setIsEditing(true);
    setMinQtyLocked(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ 
        _id: '', sku: '', name: '', quantity: 0, unit: 'un', minQuantity: 5,
        category: 'Ingredientes', costPrice: 0, supplier: '', observation: '', lastEntryDate: ''
    });
    setIsEditing(false);
    setMinQtyLocked(true);
  };

  // Componente de Linha da Tabela
  const ProductRow = ({ p, isCritical }: { p: Product, isCritical: boolean }) => (
    <tr className={`hover:bg-white/50 transition border-b border-gray-100 ${isCritical ? 'bg-red-50/60' : ''}`}>
        <td className="px-4 py-3 font-medium text-gray-500 text-xs">{p.sku}</td>
        <td className="px-4 py-3">
            <div className="font-bold text-gray-800 font-serif text-lg">{p.name}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{p.category} • {p.supplier}</div>
            {p.observation && <div className="text-xs text-glace-gold italic mt-1">Obs: {p.observation}</div>}
        </td>
        <td className="px-4 py-3 text-center">
            <span className={`px-3 py-1 rounded-full font-bold text-sm shadow-sm ${isCritical ? 'text-red-700 bg-red-100 animate-pulse' : 'text-green-800 bg-green-100'}`}>
                {p.quantity} {p.unit}
            </span>
            <div className="text-xs text-gray-400 mt-2 font-semibold">Mín: {p.minQuantity}</div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
            <div>R$ {p.costPrice?.toFixed(2)}</div>
            <div className="text-xs text-gray-400 mt-1">
                Entrada: {p.lastEntryDate ? new Date(p.lastEntryDate).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '-'}
            </div>
        </td>
        <td className="px-4 py-3 text-right space-x-2">
            <button 
                onClick={() => handleQuickAdd(p)} 
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold border border-blue-200 transition"
                title="Chegou Mercadoria"
            >
                📥 +
            </button>
            <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-glace-wine text-lg p-1 transition">✏️</button>
            <button onClick={() => handleDelete(p._id)} className="text-gray-400 hover:text-red-500 text-lg p-1 transition">🗑️</button>
        </td>
    </tr>
  );

  return (
    <div className="min-h-screen relative font-sans text-gray-800">
      <Head><title>Estoque | Glacê</title></Head>

      {/* --- FUNDO PREMIUM --- */}
      <div className="fixed inset-0 z-0" style={{ backgroundImage: "url('/bg-confeitaria.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div>
               <h1 className="text-4xl font-serif font-bold text-glace-wine">Estoque</h1>
               <p className="text-glace-gold text-sm uppercase tracking-widest font-semibold">Controle de Insumos</p>
           </div>
           <div className="space-x-3 flex">
             <button onClick={handleSync} disabled={isSyncing} className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-full font-bold shadow-sm transition">
               {isSyncing ? '...' : '🔄 Sincronizar'}
             </button>
             <Link href="/" className="bg-glace-wine text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-red-900 transition">Voltar</Link>
           </div>
        </div>

        {/* --- FORMULÁRIO (GLASS PANEL) --- */}
        <div className={`glass-panel p-6 rounded-2xl shadow-xl mb-10 border-t-4 ${isEditing ? 'border-yellow-500 bg-yellow-50/50' : 'border-glace-wine'}`}>
          <div className="flex justify-between mb-6">
            <h2 className="font-serif font-bold text-2xl text-gray-800">{isEditing ? '✏️ Editar Item' : '➕ Novo Item'}</h2>
            {isEditing && <button onClick={resetForm} className="text-red-500 text-sm font-bold hover:underline">CANCELAR EDIÇÃO</button>}
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-glace-gold uppercase mb-1 block">SKU / Cód</label>
              <input className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none bg-white/80" placeholder="CHO-01" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} required disabled={isEditing} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-glace-gold uppercase mb-1 block">Nome do Produto</label>
              <input className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none bg-white/80" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-glace-gold uppercase mb-1 block">Categoria</label>
              <select className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none bg-white/80" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>Ingredientes</option>
                <option>Embalagens</option>
                <option>Decoração</option>
                <option>Limpeza</option>
                <option>Outros</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-glace-gold uppercase mb-1 block">Qtd Atual</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none bg-white/80" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-glace-gold uppercase mb-1 block">Unidade</label>
              <select className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none bg-white/80" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                <option value="un">Un</option>
                <option value="kg">Kg</option>
                <option value="g">g</option>
                <option value="l">L</option>
                <option value="cx">Cx</option>
              </select>
            </div>

            {/* Linha 2 */}
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Custo (R$)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none bg-white/80" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Fornecedor</label>
              <input className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none bg-white/80" placeholder="Ex: Atacadão" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            </div>
             
             {/* TRAVA DE SEGURANÇA */}
             <div className="md:col-span-1">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                  Estoque Mín 
                  {minQtyLocked ? (
                      <button type="button" onClick={handleUnlockMinQty} className="text-gray-400 hover:text-glace-wine" title="Clique para Destravar">🔒</button>
                  ) : (
                      <span className="text-green-500" title="Destravado">🔓</span>
                  )}
              </label>
              <input 
                type="number" 
                className={`w-full border border-gray-300 rounded-lg p-3 outline-none ${minQtyLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-glace-gold'}`} 
                value={formData.minQuantity} 
                onChange={e => setFormData({...formData, minQuantity: Number(e.target.value)})}
                disabled={minQtyLocked} 
              />
            </div>
            {/* --------------------------- */}

            <div className="md:col-span-2 flex items-end">
               <button type="submit" className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-md transition transform active:scale-95 ${isEditing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
                 {isEditing ? '💾 Salvar Alterações' : '✨ Adicionar ao Estoque'}
               </button>
            </div>
            
            <div className="md:col-span-6">
                <input className="w-full border-b border-gray-200 p-2 bg-transparent text-sm focus:border-glace-wine outline-none placeholder-gray-400" placeholder="Observações adicionais (marca, local de armazenamento...)" value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})} />
            </div>
          </form>
        </div>

        {/* --- Tabela 1: CRÍTICOS (Urgente) --- */}
        {lowStockItems.length > 0 && (
            <div className="mb-10 bg-white rounded-2xl shadow-xl border-l-8 border-red-500 overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                    <h3 className="font-serif font-bold text-red-800 flex items-center gap-2 text-xl">
                        🚨 Reposição Necessária <span className="text-sm bg-red-200 text-red-800 px-2 py-1 rounded-full">{lowStockItems.length}</span>
                    </h3>
                </div>
                <table className="min-w-full">
                    <tbody className="divide-y divide-red-100">
                        {lowStockItems.map(p => <ProductRow key={p._id} p={p} isCritical={true} />)}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- Tabela 2: NORMAL --- */}
        <div className="glass-panel rounded-2xl shadow-lg overflow-hidden border-t-4 border-green-500">
            <div className="bg-white/50 px-6 py-4 border-b border-gray-100">
                <h3 className="font-serif font-bold text-green-700 text-xl">✅ Estoque Regular</h3>
            </div>
            <table className="min-w-full text-sm">
                <thead className="bg-glace-cream text-glace-wine font-serif font-bold border-b border-glace-gold/20">
                  <tr>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Produto</th>
                    <th className="px-4 py-3 text-center">Qtd</th>
                    <th className="px-4 py-3 text-left">Custo / Data</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white/80">
                  {normalItems.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Nenhum item com estoque normal.</td></tr>
                  )}
                  {normalItems.map(p => <ProductRow key={p._id} p={p} isCritical={false} />)}
                </tbody>
            </table>
        </div>

      </div>
    </div>
  );
}