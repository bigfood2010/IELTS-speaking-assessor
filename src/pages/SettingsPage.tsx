import { useEffect, useState } from 'react';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Key from 'lucide-react/dist/esm/icons/key';
import UserRound from 'lucide-react/dist/esm/icons/user-round';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Save from 'lucide-react/dist/esm/icons/save';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';


import { useGeminiKey } from '@/hooks/useGeminiKey';
import { useAuth } from '@/store/AuthContext';

const focusRingClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-emerald/40 focus-visible:ring-offset-2';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-20">
      <header>
        <h1 className="text-3xl font-extrabold text-studio-ink sm:text-4xl">Settings</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-studio-silver pb-5">
            <div className="rounded-xl bg-studio-paper p-2.5 text-studio-ink shadow-inner">
              <UserRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-studio-ink">Account</h2>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-5">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-2xl border-2 border-white shadow-sm" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-studio-paper shadow-inner">
                  <span className="text-2xl font-extrabold text-zinc-300">{user?.email?.[0]?.toUpperCase() ?? ''}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-xl font-extrabold leading-none text-studio-ink">{name}</p>
                <p className="text-sm font-medium text-zinc-400">{user?.email}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-vibrant-emerald/20 bg-vibrant-emerald/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-vibrant-emerald">
                  <ShieldCheck size={13} />
                  Authenticated via Google
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-studio-silver px-5 text-sm font-bold text-vibrant-rose transition-colors hover:border-vibrant-rose/20 hover:bg-vibrant-rose/5 ${focusRingClass}`}
            >
              <LogOut size={18} />
              SIGN OUT
            </button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-studio-silver pb-5">
            <div className="rounded-xl bg-vibrant-gold/10 p-2.5 text-vibrant-gold shadow-inner">
              <Key size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold leading-tight text-studio-ink">Gemini API Key</h2>
                {!isEditing && apiKey ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-vibrant-emerald px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm shadow-vibrant-emerald/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                    ACTIVE
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <p className="mb-6 text-sm font-medium leading-6 text-zinc-500">
            Connect your own Google AI key to get unlimited practice and private assessments.
          </p>

          {!isEditing && apiKey ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-studio-silver bg-studio-paper/40 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Secret Key</p>
                  <p className="truncate font-mono text-sm tracking-[0.16em] text-zinc-300">••••••••••••••••</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRemove}
                    aria-label="Remove API key"
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-zinc-300 transition-colors hover:border-vibrant-rose/20 hover:bg-white hover:text-vibrant-rose ${focusRingClass}`}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className={`h-10 rounded-xl border border-studio-silver bg-white px-4 text-xs font-bold text-studio-ink transition-colors hover:border-studio-ink hover:bg-studio-paper ${focusRingClass}`}
                  >
                    Replace Key
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-vibrant-emerald/20 bg-vibrant-emerald/5 p-4 text-xs font-semibold leading-relaxed text-vibrant-emerald/80">
                <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                <p>Security: Your key is stored only on your device. We never see it and it never touches our servers.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-3">
                <label htmlFor="gemini-api-key" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Secret Key
                </label>
                <div className="relative group">
                  <input
                    id="gemini-api-key"
                    name="gemini-api-key"
                    type="password"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="AIzaSy... (PASTE KEY HERE)"
                    autoComplete="off"
                    autoFocus
                    spellCheck={false}
                    className={`w-full rounded-xl border border-studio-silver bg-studio-paper/30 px-4 py-3 pr-12 font-mono text-sm text-studio-ink outline-none transition-colors placeholder:text-zinc-200 focus:border-vibrant-gold/40 focus:bg-white ${focusRingClass}`}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center">
                    <Key size={18} className="text-zinc-200 transition-colors group-focus-within:text-vibrant-gold" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 rounded-2xl border border-vibrant-emerald/20 bg-vibrant-emerald/5 p-4 text-xs font-semibold leading-relaxed text-vibrant-emerald/80">
                <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                <p>Establishing link: Enter your Google AI Studio key to initialize the high-fidelity assessment sequence.</p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 border-t border-studio-silver pt-5">
                {apiKey ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setInputValue(apiKey);
                    }}
                    className={`h-11 px-5 text-sm font-bold text-zinc-400 transition-colors hover:text-studio-ink ${focusRingClass}`}
                  >
                    ABORT
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!inputValue.trim() || isSaved}
                  className={`flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
                    isSaved ? 'bg-vibrant-emerald shadow-vibrant-emerald/30' : 'bg-vibrant-emerald shadow-vibrant-emerald/20'
                  } ${focusRingClass}`}
                >
                  {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
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
