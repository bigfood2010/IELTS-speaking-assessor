import React, { useEffect, useState } from 'react';
import { Check, ShieldCheck, Trash2, Key, UserRound, LogOut } from 'lucide-react';
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>
      </header>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-4">
            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-600">
              <UserRound size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Account</h2>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border border-zinc-200 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-full border border-zinc-200 bg-zinc-100 flex items-center justify-center shadow-sm">
                  <span className="text-xl font-semibold text-zinc-500">{user?.email?.[0].toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-zinc-900">{name}</p>
                <p className="text-sm text-zinc-500">{user?.email}</p>
                <span className="inline-block mt-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                  Google Account
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        {/* API Key Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-5">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Key size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-900">Gemini API Key</h2>
                {!isEditing && apiKey && (
                   <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                     Active
                   </span>
                )}
              </div>
              <p className="text-sm text-zinc-500">Your own Gemini project key for transcription, grading, and free-tier quota usage.</p>
            </div>
          </div>

          {!isEditing && apiKey ? (
            <div className="space-y-4 animate-in fade-in duration-300">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                 <div>
                   <p className="text-sm font-medium text-zinc-700 mb-1">Secret Key</p>
                   <p className="font-mono text-xl tracking-widest text-zinc-400 mt-1">••••••••••••••••••••</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={handleRemove}
                     className="p-2.5 text-zinc-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
                     title="Remove Key"
                   >
                     <Trash2 size={18} />
                   </button>
                   <button
                     onClick={() => setIsEditing(true)}
                     className="px-4 py-2.5 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm"
                   >
                     Replace Key
                   </button>
                 </div>
               </div>
               <div className="flex items-start gap-2 text-xs text-zinc-500">
                 <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                 <p>Your key stays in this browser's local storage and is never sent to our servers. Google applies quota and any billing to the project behind this key. If that free tier is exhausted, replace it with a key from another Google account or project.</p>
               </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  {apiKey ? 'New Secret Key' : 'Secret Key'}
                </label>
                <input
                  type="password"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="AIzaSy..."
                  autoFocus
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              
              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <p>Your key stays in this browser's local storage and is never sent to our servers. Google enforces free-tier quotas per project, so you can wait for the midnight Pacific reset or replace this key with one from another Google account or project.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                {apiKey && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setInputValue(apiKey);
                    }}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 rounded-xl"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!inputValue.trim() || isSaved}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 shadow-sm"
                >
                  {isSaved && <Check size={16} />}
                  {isSaved ? 'Saved' : (apiKey ? 'Save Update' : 'Add Key')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
