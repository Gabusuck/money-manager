import React, { useState, useEffect } from 'react';
import { X, Cloud, Copy, Check, Download, Upload, RefreshCw } from 'lucide-react';
import type { Transaction, Bank, BudgetAllocation, SavingGoal } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  banks: Bank[];
  budget: BudgetAllocation;
  goals: SavingGoal[];
  onRestoreData: (data: {
    transactions: Transaction[];
    banks: Bank[];
    budget: BudgetAllocation;
    goals: SavingGoal[];
  }) => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  transactions,
  banks,
  budget,
  goals,
  onRestoreData
}) => {
  const [syncCode, setSyncCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const code = localStorage.getItem('allmymoney_sync_code');
    if (code) {
      setSyncCode(code);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  // Helpers para codificação/decodificação UTF-8 Base64Url
  const utf8ToB64 = (str: string) => {
    return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  };
  
  const b64ToUtf8 = (str: string) => {
    return decodeURIComponent(Array.prototype.map.call(window.atob(str), (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  };

  const encodeBase64Url = (str: string) => {
    return utf8ToB64(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const decodeBase64Url = (safeStr: string) => {
    let base64 = safeStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return b64ToUtf8(base64);
  };

  const getPayload = () => {
    return {
      transactions,
      banks,
      budget,
      goals,
      version: '1.4.0',
      updatedAt: new Date().toISOString()
    };
  };

  const handleBackup = async () => {
    setLoading(true);
    setStatusText('A guardar cópia na nuvem...');
    const payload = getPayload();
    const jsonStr = JSON.stringify(payload);
    const base64url = encodeBase64Url(jsonStr);

    try {
      if (syncCode && syncCode.length === 8) {
        // Atualizar backup existente no keyvalue.immanuel.co
        const response = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${syncCode}/backupData/${base64url}`, {
          method: 'POST'
        });
        if (!response.ok) throw new Error('Falha ao atualizar backup.');
        setStatusText('Sincronizado com sucesso!');
      } else {
        // Obter nova AppKey do keyvalue.immanuel.co
        const keyResponse = await fetch('https://keyvalue.immanuel.co/api/KeyVal/GetAppKey');
        if (!keyResponse.ok) throw new Error('Falha ao contactar servidor de chaves.');
        const rawKey = await keyResponse.text();
        const newAppKey = rawKey.replace(/"/g, '').trim();

        if (!newAppKey) throw new Error('Nenhuma chave recebida do servidor.');

        // Criar novo backup
        const response = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${newAppKey}/backupData/${base64url}`, {
          method: 'POST'
        });
        if (!response.ok) throw new Error('Falha ao criar backup.');
        
        localStorage.setItem('allmymoney_sync_code', newAppKey);
        setSyncCode(newAppKey);
        setStatusText('Código de sincronização gerado com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao guardar na nuvem: ' + err.message);
      setStatusText('Erro na gravação.');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  const handleRestore = async (codeToUse: string) => {
    const code = codeToUse.trim();
    if (!code) {
      alert('Por favor, introduz um código válido.');
      return;
    }

    setLoading(true);
    setStatusText('A ler dados da nuvem...');

    try {
      let payload;
      
      if (code.length === 8) {
        // keyvalue.immanuel.co (nosso novo padrão de 8 dígitos)
        const response = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${code}/backupData`);
        if (!response.ok) throw new Error('Código inválido ou dados não encontrados.');
        const rawResult = await response.text();
        const cleanResult = rawResult.replace(/^"|"$/g, '').trim();
        
        if (!cleanResult || cleanResult === 'null') {
          throw new Error('Nenhuma cópia de segurança encontrada com este código.');
        }
        
        const decoded = decodeBase64Url(cleanResult);
        payload = JSON.parse(decoded);
      } else if (code.length >= 24) {
        // Fallback api.restful-api.dev (caso tenham algum código de 32 caracteres)
        const response = await fetch(`https://api.restful-api.dev/objects/${code}`);
        if (!response.ok) throw new Error('Cópia de segurança não encontrada.');
        const data = await response.json();
        payload = data.data;
      } else {
        // Fallback antigo npoint
        const response = await fetch(`https://api.npoint.io/bins/${code}`);
        if (!response.ok) throw new Error('Cópia de segurança não encontrada.');
        const data = await response.json();
        payload = data.contents ? data.contents : data;
      }

      // Validação básica de integridade
      if (!payload || !payload.transactions || !payload.banks || !payload.budget) {
        throw new Error('O ficheiro de cópia na nuvem está corrompido ou incompleto.');
      }

      if (window.confirm('Esta ação irá substituir todos os dados atuais no teu telemóvel pelos dados guardados na nuvem. Desejas continuar?')) {
        await onRestoreData({
          transactions: payload.transactions,
          banks: payload.banks,
          budget: payload.budget,
          goals: payload.goals || []
        });
        localStorage.setItem('allmymoney_sync_code', code);
        setSyncCode(code);
        alert('Dados restaurados com sucesso! A aplicação vai reiniciar.');
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao restaurar da nuvem: ' + err.message);
      setStatusText('Erro no restauro.');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusText(''), 3000);
    }
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportFile = () => {
    const payload = getPayload();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `all_my_money_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.transactions || !parsed.banks || !parsed.budget) {
          throw new Error('Ficheiro JSON inválido ou corrompido.');
        }

        if (window.confirm('Queres importar este ficheiro de backup? Todos os teus dados atuais serão substituídos.')) {
          await onRestoreData({
            transactions: parsed.transactions,
            banks: parsed.banks,
            budget: parsed.budget,
            goals: parsed.goals || []
          });
          alert('Backup importado com sucesso! A aplicação vai reiniciar.');
          window.location.reload();
        }
      } catch (err: any) {
        alert('Erro ao ler ficheiro: ' + err.message);
      }
    };
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-sm max-h-[90vh] rounded-[32px] border border-slate-100 p-5 shadow-premium flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-brand-purple shrink-0" />
            Sincronização & Nuvem
          </h4>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white border border-slate-150 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-custom"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 mt-4">
          {statusText && (
            <div className="p-3 bg-purple-50 border border-purple-100/50 rounded-2xl text-[10px] text-brand-purple font-bold text-center flex items-center justify-center gap-2">
              {loading && <RefreshCw className="w-3 h-3 animate-spin text-brand-purple" />}
              {statusText}
            </div>
          )}

        {/* Cópia de Segurança na Nuvem */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Guardar / Restaurar Nuvem</span>
          
          {syncCode ? (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex justify-between items-center relative overflow-hidden">
                <div>
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Código da Nuvem</span>
                  <span className="text-sm font-black text-brand-dark tracking-wider select-all">{syncCode}</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-8 h-8 rounded-full bg-white border border-slate-150 flex items-center justify-center text-slate-400 hover:text-brand-purple transition-custom"
                  title="Copiar Código"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-cat-green" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed font-semibold px-0.5">
                Guarda este código! Introduz este código noutro telemóvel para transferir e recuperar todas as tuas contas e transações.
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <button
                  onClick={handleBackup}
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-tr from-[#633bbf] to-[#05bde8] text-white rounded-xl text-xxs font-black uppercase tracking-wider shadow-sm hover:scale-[1.01] active:scale-99 transition-transform whitespace-nowrap"
                >
                  Guardar
                </button>
                <button
                  onClick={() => handleRestore(syncCode)}
                  disabled={loading}
                  className="w-full py-2.5 bg-white border border-slate-150 text-brand-purple hover:bg-slate-55 rounded-xl text-xxs font-black uppercase tracking-wider shadow-sm hover:scale-[1.01] active:scale-99 transition-transform whitespace-nowrap"
                >
                  Restaurar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Guarda os teus dados na nuvem de forma anónima para poderes mudar de telemóvel sem perder nada.
              </p>
              <button
                onClick={handleBackup}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-tr from-[#633bbf] to-[#05bde8] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-purple-glow hover:scale-[1.01] active:scale-99 transition-transform"
              >
                Ativar & Guardar na Nuvem
              </button>

              <div className="border-t border-slate-100 pt-3.5 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Restaurar com Código existente</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-brand-purple text-brand-dark text-xs font-bold shadow-inner-soft"
                  />
                  <button
                    onClick={() => handleRestore(inputCode)}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-200 text-brand-dark font-black rounded-xl text-[10px] uppercase tracking-wider hover:bg-slate-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    Restaurar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cópia de Segurança Local por Ficheiro */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Backup Manual por Ficheiro</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportFile}
              className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-brand-dark rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Exportar Ficheiro
            </button>
            
            <label className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-brand-dark rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Importar Ficheiro
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};
