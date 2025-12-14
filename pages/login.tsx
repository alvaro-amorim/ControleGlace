import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Login Simulado
    if (email && password) {
        router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans">
      <Head>
        <title>Login | Glacê</title>
      </Head>

      {/* --- FUNDO COM A IMAGEM QUE VOCÊ UPLOADOU --- */}
      <div 
        className="absolute inset-0 z-0"
        style={{
            backgroundImage: "url('/telalogin.png')", // Puxa sua imagem nova
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      >
        {/* Camada escura bem suave para destacar o cartão branco */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
      </div>

      {/* --- O CARTÃO BRANCO (ESTILO DA FOTO) --- */}
      <div className="relative z-10 w-full max-w-[400px] bg-white rounded-[35px] shadow-2xl px-8 py-10 m-4 animate-fade-in-up">
        
        {/* CABEÇALHO COM LOGO */}
        <div className="flex flex-col items-center mb-8">
             <img 
                src="/logo-glace.png" 
                alt="Glacê Logo" 
                className="w-20 mb-4" 
             />
            <h1 className="text-2xl font-bold text-glace-wine mb-1">Bem-vindo de volta!</h1>
            <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Painel Administrativo</p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Campo E-mail */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {/* Ícone de Envelope (SVG) */}
                    <svg className="h-5 w-5 text-glace-wine group-focus-within:text-glace-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <input 
                    type="email" 
                    required
                    placeholder="E-mail"
                    className="w-full bg-white border-2 border-gray-100 text-gray-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-glace-wine focus:ring-1 focus:ring-glace-wine transition-all placeholder-gray-400 font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            {/* Campo Senha */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {/* Ícone de Cadeado (SVG) */}
                    <svg className="h-5 w-5 text-glace-wine group-focus-within:text-glace-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <input 
                    type="password" 
                    required
                    placeholder="Senha"
                    className="w-full bg-white border-2 border-gray-100 text-gray-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-glace-wine focus:ring-1 focus:ring-glace-wine transition-all placeholder-gray-400 font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {/* Botão Entrar */}
            <button 
                type="submit" 
                className="w-full bg-glace-wine hover:bg-[#5a0e10] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 mt-2 uppercase tracking-wide text-sm"
            >
                Entrar
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-gray-300 text-[10px] uppercase tracking-widest">
                Sistema Glacê v2.0
            </p>
        </div>
      </div>
    </div>
  );
}