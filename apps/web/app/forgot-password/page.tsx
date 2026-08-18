'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { clientApi } from '@/lib/api';
export default function Forgot() {
  const [email, setEmail] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await clientApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    toast.success('Se a conta existir, você receberá instruções.');
  }
  return (
    <div className="container" style={{ maxWidth: 500 }}>
      <header className="page-head">
        <h1>Recuperar acesso.</h1>
        <p className="muted">Enviaremos as próximas instruções por email.</p>
      </header>
      <form className="card stack" style={{ padding: 26 }} onSubmit={submit}>
        <label className="label">
          Email
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button className="btn btn-primary">Enviar instruções</button>
      </form>
    </div>
  );
}
