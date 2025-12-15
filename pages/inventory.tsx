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
  category: 'Receita' | 'Embalagens' | 'Limpeza' | 'Diversos';
  costPrice: number;
  supplier: string;
  observation: string;
  lastMovementDate: string;
}

const SECURITY_CODE = '104298';
const CATEGORIES: ('Receita' | 'Embalagens' | 'Limpeza' | 'Diversos')[] = ['Receita', 'Embalagens', 'Limpeza', 'Diversos'];

// Helper para ícones (apenas visual, não altera lógica)
const getCategoryIcon = (cat: string) => {
    switch(cat) {
        case 'Receita': return '🧂';
        case 'Embalagens': return '🥡';
        case 'Limpeza': return '🧼';
        case 'Diversos': return '🏷️';
        default: return '📦';
    }
};

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [minQtyLocked, setMinQtyLocked] = useState(true);

  // --- Estado para controlar quais categorias estão abertas (Acordeão) ---
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({ 
    sku: '', name: '', quantity: 0, unit: 'un', minQuantity: 5,
    category: 'Receita', costPrice: 0, supplier: '', observation: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/inventory');
    const data = await res.json();
    if (data.success) {
      const sortedProducts = (data.data as Product[]).sort((a, b) => 
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      );
      setAllProducts(sortedProducts);
    }
    setLoading(false);
  };
  
  // --- NOVA FUNÇÃO: Sincronizar com Google Sheets ---
  const handleSync = async () => {
      // Pergunta de segurança para evitar acidente
      if (!confirm("⚠️ ATENÇÃO: Isso vai atualizar o App com os dados da PLANILHA.\nSe você apagou algo na planilha, sumirá daqui.\n\nDeseja continuar?")) return;
      
      setLoading(true);
      try {
          const res = await fetch('/api/inventory/sync', { method: 'POST' });
          const data = await res.json();
          if (data.success) {
              alert(`✅ Sincronizado! ${data.count} itens importados da planilha.`);
              fetchProducts(); // Recarrega a tela
          } else {
              alert("❌ Erro ao sincronizar. Verifique o console.");
          }
      } catch (error) {
          alert("Erro de conexão com o servidor.");
      }
      setLoading(false);
  };
  // --------------------------------------------------

  // --- Função para alternar abrir/fechar categoria ---
  const toggleCategory = (category: string) => {
      setExpandedCategories(prev => {
          const next = new Set(prev);
          if (next.has(category)) {
              next.delete(category);
          } else {
              next.add(category);
          }
          return next;
      });
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

    const method = isEditing ? 'PUT' : 'POST';
    const res = await fetch('/api/inventory', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
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

    const qtdStr = prompt(`Quantos "${p.unit}" de ${p.name} chegaram (Entrada)?`);
    if (!qtdStr) return;
    const qtdToAdd = Number(qtdStr);

    if (isNaN(qtdToAdd) || qtdToAdd <= 0) return alert("Valor inválido");

    const newQuantity = p.quantity + qtdToAdd;
    const payload = { 
        ...p, 
        quantity: newQuantity,
        lastMovementDate: new Date().toISOString().split('T')[0]
    };

    await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    alert(`Entrada registrada! Novo estoque: ${newQuantity} ${p.unit}.`);
    fetchProducts();
  };
  
  const handleQuickRemove = async (p: Product) => {
    const code = prompt("🔒 Digite o código para DAR SAÍDA:");
    if (code !== SECURITY_CODE) return alert("❌ Código incorreto!");

    const qtdStr = prompt(`Quantos "${p.unit}" de ${p.name} foram USADOS/SAÍRAM?`);
    if (!qtdStr) return;
    const qtdToRemove = Number(qtdStr);

    if (isNaN(qtdToRemove) || qtdToRemove <= 0) return alert("Valor inválido");
    if (qtdToRemove > p.quantity) return alert(`Atenção: A saída (${qtdToRemove}) é maior que o estoque atual (${p.quantity}).`);

    const newQuantity = p.quantity - qtdToRemove;
    const payload = { 
        ...p, 
        quantity: newQuantity,
        lastMovementDate: new Date().toISOString().split('T')[0]
    };

    await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    alert(`Saída registrada! Estoque restante: ${newQuantity} ${p.unit}.`);
    fetchProducts();
  };

  const startEdit = (p: Product) => {
    setFormData(p); 
    setIsEditing(true);
    setMinQtyLocked(true);
    
    // Quando editar, garante que a categoria abre para o usuário ver
    setExpandedCategories(prev => new Set(prev).add(p.category));
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ 
        sku: '', name: '', quantity: 0, unit: 'un', minQuantity: 5,
        category: 'Receita', costPrice: 0, supplier: '', observation: '', 
    });
    setIsEditing(false);
    setMinQtyLocked(true);
  };

  // --- Componentes Internos ---

  const ProductRow = ({ p }: { p: Product }) => {
    const isCritical = p.quantity <= p.minQuantity;

    return (
        <tr className={`hover:bg-white/50 transition border-b border-gray-100 ${isCritical ? 'bg-red-50/60' : ''}`}>
            <td className="px-4 py-3 font-medium text-gray-500 text-xs">{p.sku}</td>
            <td className="px-4 py-3">
                <div className="font-bold text-gray-800 font-serif text-lg">{p.name}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">{p.supplier}</div>
                {p.observation && <div className="text-xs text-glace-gold italic mt-1">Obs: {p.observation}</div>}
            </td>
            <td className="px-4 py-3 text-center">
                <span className={`px-3 py-1 rounded-full font-bold text-sm shadow-sm ${isCritical ? 'text-red-700 bg-red-100 animate-pulse' : 'text-green-800 bg-green-100'}`}>
                    {p.quantity} {p.unit}
                </span>
                <div className="text-xs text-gray-400 mt-2 font-semibold">Mín: {p.minQuantity}</div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
                <div className="text-xs text-gray-400 font-semibold">
                    Último Movimento: {p.lastMovementDate ? new Date(p.lastMovementDate).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '-'}
                </div>
                <div>Custo: R$ {p.costPrice?.toFixed(2)}</div>
            </td>
            <td className="px-4 py-3 text-right space-x-2 flex items-center justify-end">
                <button 
                    onClick={() => handleQuickRemove(p)} 
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm font-bold border border-red-200 transition"
                    title="Dar Saída/Baixa no Estoque"
                    disabled={p.quantity === 0}
                >
                    ➖ Baixa
                </button>
                <button 
                    onClick={() => handleQuickAdd(p)} 
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold border border-blue-200 transition"
                    title="Chegou Mercadoria (Entrada)"
                >
                    ➕ Entrada
                </button>
                <button onClick={() => startEdit(p)} className="text-gray-400 hover:text-glace-wine text-lg p-1 transition">✏️</button>
                <button onClick={() => handleDelete(p._id as string)} className="text-gray-400 hover:text-red-500 text-lg p-1 transition">🗑️</button>
            </td>
        </tr>
    );
  };

  // Componente de Tabela Expansível
  const CategoryTable = ({ category, products, isOpen, onToggle }: { category: string, products: Product[], isOpen: boolean, onToggle: () => void }) => {
    const criticalItems = products.filter(p => p.quantity <= p.minQuantity);
    const normalItems = products.filter(p => p.quantity > p.minQuantity);
    const totalCount = products.length;

    return (
        <div className="glass-panel rounded-2xl shadow-lg overflow-hidden border-t-4 border-glace-gold mb-6 transition-all duration-300">
            {/* CABEÇALHO CLICÁVEL (Botão) */}
            <button 
                onClick={onToggle}
                className={`w-full flex justify-between items-center px-6 py-4 border-b text-left transition-colors ${category === 'Receita' ? 'bg-red-50/50 hover:bg-red-100/50' : 'bg-glace-cream hover:bg-white/80'}`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <div>
                        <h3 className="font-serif font-bold text-xl text-glace-wine">
                            {category === 'Receita' ? '👩‍🍳 Ingredientes (Receita)' : `📦 Categoria: ${category}`}
                        </h3>
                        {/* Resumo quando fechado */}
                        {!isOpen && (
                            <p className="text-xs text-gray-500 font-semibold mt-1">
                                {totalCount} itens {criticalItems.length > 0 && <span className="text-red-600">({criticalItems.length} críticos)</span>}
                            </p>
                        )}
                    </div>
                </div>

                {/* Ícone de Seta (Gira quando abre) */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-6 h-6 text-glace-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            
            {/* CORPO DA TABELA (Abre apenas se isOpen === true) */}
            {isOpen && (
                <div className="overflow-x-auto animate-fade-in-down">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white/80 text-gray-600 font-bold border-b border-glace-gold/10">
                        <tr>
                            <th className="px-4 py-3 text-left">SKU</th>
                            <th className="px-4 py-3 text-left">Produto</th>
                            <th className="px-4 py-3 text-center">Qtd</th>
                            <th className="px-4 py-3 text-left">Detalhes</th>
                            <th className="px-4 py-3 text-right">Ações Rápidas</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white/80">
                            {products.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Nenhum item nesta categoria.</td></tr>
                            ) : (
                                <>
                                    {criticalItems.map(p => <ProductRow key={p._id} p={p} />)}
                                    {normalItems.map(p => <ProductRow key={p._id} p={p} />)}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="min-h-screen relative font-sans text-gray-800">
      <Head><title>Estoque | Glacê</title></Head>

      <div className="fixed inset-0 z-0" style={{ backgroundImage: "url('/bg-confeitaria.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        
        {/* CABEÇALHO ATUALIZADO COM BOTÃO SYNC */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div>
               <h1 className="text-4xl font-serif font-bold text-glace-wine">Estoque</h1>
               <p className="text-glace-gold text-sm uppercase tracking-widest font-semibold">Controle de Insumos & Materiais</p>
           </div>
           
           <div className="flex gap-3">
             {/* BOTÃO NOVO DE SYNC */}
             <button 
                onClick={handleSync}
                className="bg-green-600 text-white px-5 py-3 rounded-full font-bold shadow-sm hover:bg-green-700 transition flex items-center gap-2 text-sm"
                title="Puxar dados da Planilha Google"
             >
                🔄 Sincronizar Planilha
             </button>

             <Link href="/" className="bg-glace-wine text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-900 transition flex items-center">
                Voltar
             </Link>
           </div>
        </div>

        {/* --- FORMULÁRIO (Mantido idêntico) --- */}
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
              <select className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-glace-gold outline-none bg-white/80" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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

        {/* --- CARDS TIPO ACORDEÃO (Mantido idêntico) --- */}
        <div className="space-y-4">
            {CATEGORIES.map(category => (
                <CategoryTable 
                    key={category} 
                    category={category} 
                    products={allProducts.filter(p => p.category === category)} 
                    isOpen={expandedCategories.has(category)} 
                    onToggle={() => toggleCategory(category)}
                />
            ))}
        </div>

      </div>
    </div>
  );
}