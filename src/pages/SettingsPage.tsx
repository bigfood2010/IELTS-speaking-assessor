import React, { useEffect, useState } from 'react';
import Check from 'lucide-react/dist/esm/icons/check';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Key from 'lucide-react/dist/esm/icons/key';
import UserRound from 'lucide-react/dist/esm/icons/user-round';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Save from 'lucide-react/dist/esm/icons/save';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';


import { useGeminiKey } from '@/hooks/useGeminiKey';
import { useAuth } from '@/store/AuthContext';

export default function SettingsPage() {
  const { apiKey, saveKey, removeKey } = useGeminiKey();
  const { user, signOut } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (apiKey) {
      setInputValue(apiKey);
      setIsEditing(false);
    } else {
      setInputValue('');
      setIsEditing(true);
    }
  }, [apiKey]);

  const handleSave = () => {
    if (!inputValue.trim()) {
      return;
    }

    saveKey(inputValue);
    setIsSaved(true);
    setIsEditing(false);
    window.setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRemove = () => {
    removeKey();
    setInputValue('');
    setIsEditing(true);
  };

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-20">
      <header className="space-y-2">
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-vibrant-emerald">Configuration</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-studio-ink">Studio Settings</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[3rem] border border-studio-silver bg-white p-10 shadow-xl shadow-black/5">
          <div className="flex items-center gap-4 border-b border-studio-silver pb-6 mb-8">
            <div className="rounded-2xl bg-studio-paper p-3 text-studio-ink shadow-inner">
              <UserRound size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-studio-ink">Account</h2>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-6">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-[2.5rem] border-4 border-white shadow-2xl" />
              ) : (
                <div className="w-24 h-24 rounded-[2.5rem] bg-studio-paper flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-black text-zinc-300">{user?.email?.[0].toUpperCase()}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-2xl font-black tracking-tight text-studio-ink leading-none">{name}</p>
                <p className="text-lg font-medium text-zinc-400">{user?.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-vibrant-emerald/10 border border-vibrant-emerald/20 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-vibrant-emerald">
                  <ShieldCheck size={14} />
                  Authenticated via Google
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-4 inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-studio-silver px-6 py-4 text-sm font-black text-vibrant-rose transition-all hover:bg-vibrant-rose/5 hover:border-vibrant-rose/20"
            >
              <LogOut size={20} />
              SIGN OUT
            </button>
          </div>
        </div>

        <div className="rounded-[3rem] border border-studio-silver bg-white p-10 shadow-xl shadow-black/5">
          <div className="flex items-center gap-4 border-b border-studio-silver pb-6 mb-8">
            <div className="rounded-2xl bg-vibrant-gold/10 p-3 text-vibrant-gold shadow-inner">
              <Key size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight text-studio-ink leading-tight">Gemini API Key</h2>
                {!isEditing && apiKey ? (
                   <span className="inline-flex items-center gap-2 rounded-full bg-vibrant-emerald px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-vibrant-emerald/20">
                     <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                     ACTIVE
                   </span>
                ) : null}
              </div>
            </div>
          </div>

          <p className="mb-8 text-lg font-medium leading-relaxed text-zinc-500">
            Connect your own Google AI key to get unlimited practice and private assessments.
          </p>

          {!isEditing && apiKey ? (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2.5rem] border-2 border-studio-silver bg-studio-paper/40">
                 <div className="min-w-0 flex-1">
                   <p className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-1.5">Secret Key</p>
                   <p className="font-mono text-lg tracking-[0.2em] text-zinc-300 truncate">••••••••••••••••</p>
                 </div>
                 <div className="flex items-center gap-2 shrink-0">
                   <button
                     onClick={handleRemove}
                     className="flex h-12 w-12 items-center justify-center text-zinc-300 hover:text-vibrant-rose transition-all rounded-xl border border-transparent hover:border-vibrant-rose/20 hover:bg-white"
                     title="Remove Key"
                   >
                     <Trash2 size={20} />
                   </button>
                   <button
                     onClick={() => setIsEditing(true)}
                     className="px-5 py-3 text-[12px] font-black text-studio-ink bg-white border-2 border-studio-silver rounded-xl hover:border-studio-ink hover:bg-studio-paper transition-all"
                   >
                     Replace Key
                   </button>
                 </div>
               </div>
               <div className="flex items-start gap-3 p-4 rounded-2xl bg-vibrant-emerald/5 border border-vibrant-emerald/20 text-xs font-bold leading-relaxed text-vibrant-emerald/80">
                 <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                 <p>Security: Your key is stored only on your device. We never see it and it never touches our servers.</p>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">
                   Secret Key
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="AIzaSy... (PASTE KEY HERE)"
                    autoFocus
                    className="w-full rounded-[2rem] border-2 border-studio-silver bg-studio-paper/30 px-8 py-5 font-mono text-lg text-studio-ink outline-none transition-all placeholder:text-zinc-200 focus:border-vibrant-gold/30 focus:bg-white focus:shadow-xl"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center">
                    <Key size={20} className="text-zinc-200 group-focus-within:text-vibrant-gold transition-colors" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-vibrant-emerald/5 border border-vibrant-emerald/20 text-xs font-bold leading-relaxed text-vibrant-emerald/80">
                <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                <p>Establishing link: Enter your Google AI Studio key to initialize the high-fidelity assessment sequence.</p>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 mt-4 border-t border-studio-silver">
                {apiKey ? (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setInputValue(apiKey);
                    }}
                    className="px-6 py-3 text-sm font-black text-zinc-400 transition-all hover:text-studio-ink"
                  >
                    ABORT
                  </button>
                ) : null}
                <button
                  onClick={handleSave}
                  disabled={!inputValue.trim() || isSaved}
                  className={`flex items-center gap-3 rounded-[1.5rem] px-10 py-4 text-sm font-black text-white transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 ${
                    isSaved ? 'bg-vibrant-emerald shadow-vibrant-emerald/30' : 'bg-vibrant-emerald shadow-vibrant-emerald/20'
                  }`}
                >
                  {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                  {isSaved ? 'SAVED' : (apiKey ? 'SAVE UPDATE' : 'ADD KEY')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
