import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const router = useRouter();
  const [insight, setInsight] = useState('');
  // Iniciamos como true apenas para a IA, não para a página toda
  const [loadingAI, setLoadingAI] = useState(true); 
  const [userName, setUserName] = useState(''); 
  const [isFallback, setIsFallback] = useState(false); 

  useEffect(() => {
    // 1. VERIFICAÇÃO RÁPIDA (Sem travar a tela)
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    // Se não tiver token, aí sim redireciona (o Middleware já protegeu antes, isso é dupla segurança)
    if (!token) {
      router.push('/login');
      return; 
    }

    // Carrega nome do usuário instantaneamente se estiver no cache
    if (user) {
        try {
            const userData = JSON.parse(user);
            setUserName(userData.name || '');
        } catch (e) {}
    }

    // 2. BUSCA A IA EM SEGUNDO PLANO (O site já abriu)
    fetch('/api/ai/insight')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
            setInsight(data.insight);
            setIsFallback(data.isFallback || false); 
        }
        setLoadingAI(false); // Só agora libera a caixa da IA
      })
      .catch(() => setLoadingAI(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = "glace_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push('/login');
  };

  // --- REMOVIDO: AQUELE BLOCO "IF LOADING RETURN VERIFICANDO..." SAIU DAQUI ---
  // O site vai renderizar direto agora 👇

  return (
    <div className="min-h-screen relative font-sans text-gray-800">
      <Head>
        <title>Glacê | Dashboard Premium</title>
      </Head>

      {/* --- FUNDO --- */}
      <div 
        className="fixed inset-0 z-0"
        style={{
            backgroundImage: "url('/bg-confeitaria.png')", 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      ></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto py-12 px-6">
        
        {/* CABEÇALHO */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 animate-fade-in-down">
            <div className="flex items-center gap-6">
                <img 
                    src="/logo-glace.png" 
                    alt="Glacê Logo" 
                    className="h-24 w-24 object-cover rounded-full shadow-xl border-4 border-white ring-2 ring-glace-gold/50"
                />
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-glace-wine">
                        Glacê
                    </h1>
                    <p className="text-glace-gold font-medium tracking-widest text-sm uppercase mt-1">
                        Olá, {userName || 'Confeiteira'}! 👋
                    </p>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
                <div className="bg-white/80 backdrop-blur px-6 py-3 rounded-full shadow-sm border border-glace-gold/30">
                    <p className="text-sm text-glace-wine font-semibold capitalize">
                        📅 {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="text-xs font-bold text-gray-400 hover:text-red-600 transition flex items-center gap-1 cursor-pointer"
                >
                    Sair do Sistema <span>🚪</span>
                </button>
            </div>
        </header>

        {/* --- ÁREA DA IA (O Loading fica SÓ AQUI dentro agora) --- */}
        <section className="mb-12">
            <div className={`glass-panel rounded-3xl p-1 shadow-lg border-t-4 transition-colors duration-500 ${isFallback ? 'border-orange-400' : 'border-glace-wine'}`}>
                <div className="bg-white/60 rounded-[20px] p-6 md:p-8">
                    
                    <div className="flex items-center justify-between mb-4 border-b border-glace-gold/20 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={`${isFallback ? 'bg-orange-500' : 'bg-glace-wine'} text-white p-2 rounded-lg shadow-md transition-colors`}>
                                <span className="text-xl">{isFallback ? '🛡️' : '✨'}</span>
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-glace-wine">Consultoria Virtual</h2>
                        </div>
                        
                        {isFallback && !loadingAI && (
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200 animate-pulse hidden md:inline-block">
                                Modo Segurança (IA Offline)
                            </span>
                        )}
                    </div>
                    
                    {/* AQUI ESTÁ O LOADING LOCALIZADO */}
                    {loadingAI ? (
                        <div className="animate-pulse space-y-3 py-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 bg-glace-wine rounded-full animate-bounce"></div>
                                <div className="w-4 h-4 bg-glace-wine rounded-full animate-bounce delay-100"></div>
                                <div className="w-4 h-4 bg-glace-wine rounded-full animate-bounce delay-200"></div>
                                <span className="text-xs text-glace-wine font-bold ml-2">Analisando dados da confeitaria...</span>
                            </div>
                            <div className="h-2 bg-glace-wine/10 rounded w-1/3"></div>
                            <div className="h-2 bg-glace-wine/10 rounded w-full"></div>
                            <div className="h-2 bg-glace-wine/10 rounded w-3/4"></div>
                        </div>
                    ) : (
                        <div className="text-gray-700 leading-relaxed animate-fade-in">
                            {insight ? (
                                <ReactMarkdown
                                    components={{
                                        strong: ({node, ...props}) => <span className="font-bold text-glace-wine" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mt-2 mb-4" {...props} />,
                                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                        p: ({node, ...props}) => <p className="mb-4" {...props} />,
                                        h1: ({node, ...props}) => <h3 className="text-xl font-bold text-glace-gold mt-4 mb-2" {...props} />,
                                        h2: ({node, ...props}) => <h3 className="text-lg font-bold text-glace-gold mt-4 mb-2" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-md font-bold text-glace-gold mt-4 mb-2" {...props} />,
                                    }}
                                >
                                    {insight}
                                </ReactMarkdown>
                            ) : (
                                <p className="text-glace-wine/50 italic">Sem dados suficientes para análise hoje.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* --- GRID DE NAVEGAÇÃO --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/finance" className="group">
                <div className="h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-glace-wine/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl text-glace-wine">$</span>
                    </div>
                    <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
                        <span className="text-3xl">💰</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2 group-hover:text-glace-wine transition-colors">Financeiro</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">Controle fluxo de caixa, comprovantes e lucros.</p>
                    <span className="inline-flex items-center text-sm font-bold text-glace-wine uppercase tracking-wider group-hover:underline decoration-glace-gold">Acessar Painel <span className="ml-2">→</span></span>
                </div>
            </Link>

            <Link href="/inventory" className="group">
                <div className="h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-glace-wine/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl text-blue-900">📦</span>
                    </div>
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                        <span className="text-3xl">🧂</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2 group-hover:text-glace-wine transition-colors">Estoque</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">Gestão de ingredientes, validades e reposição.</p>
                    <span className="inline-flex items-center text-sm font-bold text-glace-wine uppercase tracking-wider group-hover:underline decoration-glace-gold">Gerenciar Itens <span className="ml-2">→</span></span>
                </div>
            </Link>

            <Link href="/orders" className="group">
                <div className="h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-glace-wine/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl text-glace-gold">★</span>
                    </div>
                    <div className="w-14 h-14 bg-yellow-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-yellow-100 transition-colors">
                        <span className="text-3xl">🎂</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2 group-hover:text-glace-wine transition-colors">Pedidos</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">Controle de encomendas, entregas e produção.</p>
                    <span className="inline-flex items-center text-sm font-bold text-glace-wine uppercase tracking-wider group-hover:underline decoration-glace-gold">Ver Encomendas <span className="ml-2">→</span></span>
                </div>
            </Link>
        </div>

        <footer className="mt-20 text-center border-t border-glace-gold/20 pt-8">
            <p className="text-glace-wine font-serif text-lg">Glacê Confeitaria</p>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Sistema de Gestão v2.0</p>
        </footer>
      </div>
    </div>
  );
}