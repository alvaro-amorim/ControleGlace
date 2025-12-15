import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', securityCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        alert('🎉 Cadastro realizado! Agora faça o login.');
        router.push('/login');
      } else {
        setError(data.message || 'Erro ao cadastrar');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans text-gray-800">
      <Head><title>Cadastro | Glacê</title></Head>

      <div className="fixed inset-0 z-0" style={{ backgroundImage: "url('/bg-confeitaria.png')", backgroundSize: 'cover' }}></div>
      <div className="fixed inset-0 z-0 bg-pattern-overlay"></div>

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="bg-white/90 backdrop-blur p-8 rounded-3xl shadow-2xl border-t-8 border-glace-gold">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-glace-wine">Novo Acesso</h1>
            <p className="text-sm text-gray-500 mt-1">Crie seu usuário administrativo</p>
          </div>

          {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm text-center font-bold mb-4 border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
              <input 
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-glace-wine outline-none"
                placeholder="Ex: Álvaro Amorim"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
              <input 
                type="email"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-glace-wine outline-none"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
                    <input 
                        type="password"
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-glace-wine outline-none"
                        placeholder="******"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-red-500 uppercase mb-1">Cód. Mestre 🔒</label>
                    <input 
                        type="password"
                        className="w-full p-3 rounded-xl border-2 border-red-100 bg-red-50 focus:border-red-400 outline-none text-center font-mono tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                        value={form.securityCode}
                        onChange={e => setForm({...form, securityCode: e.target.value})}
                        required
                    />
                </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-glace-wine text-white font-bold rounded-xl shadow-lg hover:bg-red-900 transition transform active:scale-[0.98] mt-4"
            >
              {loading ? 'Validando...' : '✨ Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-glace-gold font-bold hover:underline">
              Já tem conta? Entrar
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}