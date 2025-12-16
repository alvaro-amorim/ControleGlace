import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/'); 
      } else {
        setError(data.message || 'Email ou senha incorretos');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans text-gray-800">
      <Head><title>Login | Glacê</title></Head>

      {/* --- FUNDO: telalogin.png --- */}
      <div 
        className="fixed inset-0 z-0" 
        style={{ 
            backgroundImage: "url('/telalogin.png')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
        }}
      ></div>
      
      {/* Overlay leve */}
      <div className="fixed inset-0 z-0 bg-black/20"></div>

      <div className="relative z-10 w-full max-w-sm p-4">
        <div className="bg-white/95 backdrop-blur p-8 rounded-3xl shadow-2xl border-t-8 border-glace-wine">
          
          {/* --- LOGO AUMENTADA --- */}
          <div className="flex justify-center mb-4">
            <img 
                src="/logo-glace.png" 
                alt="Glacê Logo" 
                className="h-40 w-auto object-contain drop-shadow-md hover:scale-105 transition duration-500" 
            />
          </div>
          
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Gestão Exclusiva</p>
          </div>

          {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-xs text-center font-bold mb-4 border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-glace-wine uppercase mb-1 ml-1">E-mail</label>
              <input 
                type="email"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-glace-wine outline-none transition bg-gray-50 focus:bg-white"
                placeholder="admin@glace.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-glace-wine uppercase mb-1 ml-1">Senha</label>
              <input 
                type="password"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-glace-wine outline-none transition bg-gray-50 focus:bg-white"
                placeholder="******"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-glace-wine text-white font-bold rounded-xl shadow-lg hover:bg-red-900 transition transform active:scale-[0.98] mt-4 uppercase tracking-wider text-sm"
            >
              {loading ? 'Validando...' : 'Entrar no Sistema'}
            </button>
          </form>

          {/* --- RODAPÉ COM A PERGUNTA --- */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Ainda não tem acesso?</p>
            <Link href="/register" className="text-sm font-bold text-glace-gold hover:text-yellow-600 transition">
              Criar conta de Administrador
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}