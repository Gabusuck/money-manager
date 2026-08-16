import React, { useState, useEffect } from 'react';
import { X, Cloud, Copy, Check, Download, Upload, RefreshCw, Key, Link2, ShieldCheck, Trash2, Plus, Info } from 'lucide-react';
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
  onImportTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
}

const GOCARDLESS_API = 'https://bankaccountdata.gocardless.com/api/v2';

const P = {
  brand: '#4F6EF7',
  brandDark: '#3A58E0',
  brandLight: '#EEF1FE',
  success: '#16C784',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  ink: '#111827',
  inkMuted: '#6B7280',
  inkSubtle: '#9CA3AF',
  border: '#E5E8F8',
  surface: '#FFFFFF',
};

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  transactions,
  banks,
  budget,
  goals,
  onRestoreData,
  onImportTransactions
}) => {
  const [syncCode, setSyncCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cloud' | 'banking' | 'automation'>('cloud');

  // Estados do GoCardless (Open Banking)
  const [secretId, setSecretId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isKeysConfigured, setIsKeysConfigured] = useState(false);
  const [connections, setConnections] = useState<{ bankId: string; bankName: string; requisitionId: string; accountId: string }[]>([]);
  
  // Ecrã de ligar nova conta
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [associateBankId, setAssociateBankId] = useState(banks.length > 0 ? banks[0].id : '');
  const [loadingInsts, setLoadingInsts] = useState(false);

  useEffect(() => {
    const code = localStorage.getItem('allmymoney_sync_code');
    if (code) setSyncCode(code);

    // Carregar configurações locais do GoCardless
    const gId = localStorage.getItem('gocardless_secret_id') || '';
    const gKey = localStorage.getItem('gocardless_secret_key') || '';
    setSecretId(gId);
    setSecretKey(gKey);
    setIsKeysConfigured(!!(gId && gKey));

    const savedConnections = localStorage.getItem('gocardless_connections');
    if (savedConnections) {
      try {
        setConnections(JSON.parse(savedConnections));
      } catch {
        setConnections([]);
      }
    }

    // Verificar se voltámos de um redirecionamento de consentimento pendente
    checkPendingRequisition();
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

    const chunkSize = 200;
    const chunks: string[] = [];
    for (let i = 0; i < base64url.length; i += chunkSize) {
      chunks.push(base64url.substring(i, i + chunkSize));
    }

    try {
      let activeCode = syncCode;
      if (!activeCode || activeCode.length !== 8) {
        const keyResponse = await fetch('https://keyvalue.immanuel.co/api/KeyVal/GetAppKey');
        if (!keyResponse.ok) throw new Error('Falha ao contactar servidor de chaves.');
        const rawKey = await keyResponse.text();
        const newAppKey = rawKey.replace(/"/g, '').trim();
        if (!newAppKey) throw new Error('Nenhuma chave recebida do servidor.');
        activeCode = newAppKey;
      }

      const countResponse = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${activeCode}/backup_chunks/${chunks.length}`, { method: 'POST' });
      if (!countResponse.ok) throw new Error('Falha ao registar dados de segmentação.');

      const promises = chunks.map((chunk, index) => {
        return fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${activeCode}/backup_${index}/${chunk}`, { method: 'POST' }).then(res => {
          if (!res.ok) throw new Error(`Falha ao gravar segmento ${index}`);
        });
      });

      await Promise.all(promises);
      localStorage.setItem('allmymoney_sync_code', activeCode);
      setSyncCode(activeCode);
      setStatusText('Sincronizado com sucesso!');
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
      const countResponse = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${code}/backup_chunks`);
      if (!countResponse.ok) throw new Error('Erro ao ler índice de backup na nuvem.');
      const rawCount = await countResponse.text();
      const cleanCountText = rawCount.replace(/"/g, '').trim();
      const count = parseInt(cleanCountText, 10);
      
      if (isNaN(count) || count <= 0) {
        const oldResponse = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${code}/backupData`);
        if (!oldResponse.ok) throw new Error('Código inválido ou sem dados na nuvem.');
        const rawResult = await oldResponse.text();
        const cleanResult = rawResult.replace(/^"|"$/g, '').trim();
        if (!cleanResult || cleanResult === 'null') {
          throw new Error('Nenhuma cópia de segurança encontrada com este código.');
        }
        const decoded = decodeBase64Url(cleanResult);
        payload = JSON.parse(decoded);
      } else {
        const promises: Promise<string>[] = [];
        for (let i = 0; i < count; i++) {
          promises.push(
            fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${code}/backup_${i}`)
              .then(async res => {
                if (!res.ok) throw new Error(`Falha ao descarregar segmento ${i}`);
                const raw = await res.text();
                return raw.replace(/"/g, '').trim();
              })
          );
        }
        const chunks = await Promise.all(promises);
        const base64url = chunks.join('');
        const decoded = decodeBase64Url(base64url);
        payload = JSON.parse(decoded);
      }

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

  // --- LÓGICA DE OPEN BANKING GOCARDLESS ---

  const handleSaveGCKeys = () => {
    const trimmedId = secretId.trim();
    const trimmedKey = secretKey.trim();
    if (!trimmedId || !trimmedKey) {
      alert('Por favor, introduz ambas as chaves.');
      return;
    }
    localStorage.setItem('gocardless_secret_id', trimmedId);
    localStorage.setItem('gocardless_secret_key', trimmedKey);
    setIsKeysConfigured(true);
    alert('Chaves de API GoCardless guardadas localmente no teu iPhone!');
  };

  const handleRemoveGCKeys = () => {
    if (window.confirm('Tens a certeza que queres apagar as chaves e remover todas as conexões bancárias?')) {
      localStorage.removeItem('gocardless_secret_id');
      localStorage.removeItem('gocardless_secret_key');
      localStorage.removeItem('gocardless_connections');
      setSecretId('');
      setSecretKey('');
      setIsKeysConfigured(false);
      setConnections([]);
    }
  };

  // Obter token dinâmico da API
  const fetchToken = async (): Promise<string> => {
    const res = await fetch(`${GOCARDLESS_API}/token/new/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ secret_id: secretId.trim(), secret_key: secretKey.trim() })
    });
    if (!res.ok) throw new Error('Não foi possível autenticar no GoCardless. Confirma as tuas chaves.');
    const data = await res.json();
    return data.access;
  };

  const handleLoadInstitutions = async () => {
    setLoadingInsts(true);
    try {
      const token = await fetchToken();
      const res = await fetch(`${GOCARDLESS_API}/institutions/?country=pt`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Erro ao obter bancos.');
      const data = await res.json();
      setInstitutions(data);
      if (data.length > 0) setSelectedInstId(data[0].id);
      setShowAddConnection(true);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoadingInsts(false);
    }
  };

  // Iniciar ligação e redirecionar para o banco
  const handleStartBankConnection = async () => {
    if (!selectedInstId || !associateBankId) return;
    setLoading(true);
    setStatusText('A ligar ao banco...');
    try {
      const token = await fetchToken();
      const redirectUrl = window.location.origin + window.location.pathname;
      const reference = 'ref-' + Math.random().toString(36).substring(2, 14);

      const res = await fetch(`${GOCARDLESS_API}/requisitions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          redirect: redirectUrl,
          institution_id: selectedInstId,
          reference: reference,
          user_language: 'PT'
        })
      });

      if (!res.ok) throw new Error('Falha ao criar sessão de ligação.');
      const data = await res.json();

      const selectedInst = institutions.find(i => i.id === selectedInstId);
      const appBank = banks.find(b => b.id === associateBankId);

      // Guardar requisição pendente localmente
      const pendingData = {
        requisitionId: data.id,
        bankId: associateBankId,
        bankName: appBank?.name || selectedInst?.name || 'Banco'
      };
      localStorage.setItem('gocardless_pending_req', JSON.stringify(pendingData));

      // Redirecionar o utilizador para a página do banco
      window.location.href = data.link;
    } catch (err: any) {
      alert('Erro ao ligar ao banco: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o utilizador acabou de voltar do banco
  const checkPendingRequisition = async () => {
    const pending = localStorage.getItem('gocardless_pending_req');
    if (!pending) return;

    const { requisitionId, bankId, bankName } = JSON.parse(pending);
    setLoading(true);
    setStatusText('A validar ligação bancária...');

    try {
      const token = await fetchToken();
      // Obter contas associadas a esta ligação
      const res = await fetch(`${GOCARDLESS_API}/requisitions/${requisitionId}/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Não foi possível obter dados da ligação.');
      const data = await res.json();

      if (data.status === 'LN' && data.accounts && data.accounts.length > 0) {
        // Obter o ID da primeira conta ligada
        const accountId = data.accounts[0];
        
        const newConnection = {
          bankId,
          bankName,
          requisitionId,
          accountId
        };

        const updated = [...connections.filter(c => c.bankId !== bankId), newConnection];
        setConnections(updated);
        localStorage.setItem('gocardless_connections', JSON.stringify(updated));
        localStorage.removeItem('gocardless_pending_req');
        alert(`Conta do ${bankName} ligada com sucesso!`);
      } else {
        throw new Error('A ligação não foi concluída no banco ou expirou.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro no emparelhamento bancário: ' + err.message);
      localStorage.removeItem('gocardless_pending_req');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  // Descarregar transações de uma conta ligada
  const handleSyncConnection = async (conn: { bankId: string; bankName: string; accountId: string }) => {
    setLoading(true);
    setStatusText(`A sincronizar ${conn.bankName}...`);

    try {
      const token = await fetchToken();
      const res = await fetch(`${GOCARDLESS_API}/accounts/${conn.accountId}/transactions/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Erro ao ler transações da conta.');
      const data = await res.json();

      const booked = data.transactions?.booked || [];
      if (booked.length === 0) {
        alert('Não foram encontrados novos movimentos consolidados no banco.');
        return;
      }

      // Mapear transações para o nosso modelo
      const mapped: Omit<Transaction, 'id'>[] = booked.map((t: any) => {
        const rawAmount = parseFloat(t.transactionAmount?.amount || '0');
        const desc = t.remittanceInformationUnstructured || t.creditorName || t.debtorName || 'Movimento Automático';
        const type = rawAmount > 0 ? 'income' : 'expense';
        const finalVal = Math.abs(rawAmount);

        // Categorização inteligente automática
        let category = 'Outros';
        const descLower = desc.toLowerCase();
        if (descLower.includes('uber') || descLower.includes('bolt') || descLower.includes('combustivel') || descLower.includes('galp') || descLower.includes('bp') || descLower.includes('repsol') || descLower.includes('metro') || descLower.includes('carris')) {
          category = 'Transportes';
        } else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('cafe') || descLower.includes('restaurante') || descLower.includes('bar') || descLower.includes('mcdonald') || descLower.includes('burger')) {
          category = 'Lazer';
        } else if (descLower.includes('renda') || descLower.includes('agua') || descLower.includes('luz') || descLower.includes('gas') || descLower.includes('seguro') || descLower.includes('continente') || descLower.includes('pingo doce') || descLower.includes('auchan')) {
          category = 'Fixos';
        } else if (descLower.includes('vencimento') || descLower.includes('salario') || descLower.includes('recompensa')) {
          category = 'Salário';
        }

        return {
          description: desc,
          amount: finalVal,
          type,
          category,
          date: t.bookingDate || t.valueDate || new Date().toISOString().split('T')[0],
          bankId: conn.bankId
        };
      });

      onImportTransactions(mapped);
      alert(`Sincronização concluída! Importados ${mapped.length} movimentos para a conta do ${conn.bankName}.`);
    } catch (err: any) {
      console.error(err);
      alert(`Erro na sincronização: ` + err.message);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const handleRemoveConnection = (bankId: string) => {
    if (window.confirm('Remover esta ligação bancária? Terás de associar novamente no banco se quiseres reativar.')) {
      const updated = connections.filter(c => c.bankId !== bankId);
      setConnections(updated);
      localStorage.setItem('gocardless_connections', JSON.stringify(updated));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-sm max-h-[85vh] rounded-[32px] border border-slate-100 p-5 shadow-premium flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-brand-purple shrink-0" />
            Sincronização &amp; Ligar Bancos
          </h4>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white border border-slate-150 flex items-center justify-center text-slate-400 hover:bg-slate-55 transition-custom"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs de Seleção */}
        <div style={{display:'flex',background:'#F7F8FF',border:'1px solid #E5E8F8',borderRadius:16,padding:4,gap:4,marginTop:12,flexShrink:0}}>
          <button
            type="button"
            onClick={() => { setActiveTab('cloud'); setShowAddConnection(false); }}
            style={{
              flex:1,
              padding:'8px 4px',
              borderRadius:12,
              border:'none',
              cursor:'pointer',
              fontSize:10,
              fontWeight:800,
              textTransform:'uppercase',
              letterSpacing:'0.05em',
              transition:'all 0.2s',
              background: activeTab === 'cloud' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'cloud' ? '#4F6EF7' : '#9CA3AF',
              boxShadow: activeTab === 'cloud' ? '0 1px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Nuvem
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('banking'); setShowAddConnection(false); }}
            style={{
              flex:1,
              padding:'8px 4px',
              borderRadius:12,
              border:'none',
              cursor:'pointer',
              fontSize:10,
              fontWeight:800,
              textTransform:'uppercase',
              letterSpacing:'0.05em',
              transition:'all 0.2s',
              background: activeTab === 'banking' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'banking' ? '#4F6EF7' : '#9CA3AF',
              boxShadow: activeTab === 'banking' ? '0 1px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Bancos (Auto)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('automation'); setShowAddConnection(false); }}
            style={{
              flex:1,
              padding:'8px 4px',
              borderRadius:12,
              border:'none',
              cursor:'pointer',
              fontSize:10,
              fontWeight:800,
              textTransform:'uppercase',
              letterSpacing:'0.05em',
              transition:'all 0.2s',
              background: activeTab === 'automation' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'automation' ? '#4F6EF7' : '#9CA3AF',
              boxShadow: activeTab === 'automation' ? '0 1px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Atalhos
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 mt-4">
          {statusText && (
            <div className="p-3 bg-purple-55 border border-purple-100/50 rounded-2xl text-[10px] text-brand-purple font-bold text-center flex items-center justify-center gap-2">
              {loading && <RefreshCw className="w-3 h-3 animate-spin text-brand-purple" />}
              {statusText}
            </div>
          )}

          {activeTab === 'cloud' ? (
            <>
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
                      Ativar &amp; Guardar na Nuvem
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

              {/* Backup Manual */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Backup Manual por Ficheiro</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportFile}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-brand-dark rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Exportar JSON
                  </button>
                  
                  <label className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-brand-dark rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Importar JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          ) : activeTab === 'banking' ? (
            <div className="space-y-4">
              {!isKeysConfigured ? (
                // Ecrã de introdução de chaves do GoCardless
                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3.5">
                  <div className="flex items-center gap-2 text-brand-dark">
                    <Key className="w-4 h-4 text-brand-purple shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Credenciais Open Banking</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                    Para sincronizar diretamente os teus bancos de forma oficial, cria uma conta gratuita em <a href="https://bankaccountdata.gocardless.com" target="_blank" rel="noreferrer" style={{color:P.brand,textDecoration:'underline'}}>GoCardless.com</a> (antigo Nordigen) e obtém as tuas chaves de developer:
                  </p>
                  <div className="space-y-2.5">
                    <div>
                      <label style={{fontSize:8,fontWeight:850,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.06em'}}>Secret ID</label>
                      <input
                        type="text"
                        value={secretId}
                        onChange={e => setSecretId(e.target.value)}
                        placeholder="Ex: 8a4c281e-..."
                        className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label style={{fontSize:8,fontWeight:850,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.06em'}}>Secret Key</label>
                      <input
                        type="password"
                        value={secretKey}
                        onChange={e => setSecretKey(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleSaveGCKeys}
                      className="w-full py-2.5 mt-2 bg-gradient-to-tr from-[#4F6EF7] to-[#7C5CFC] text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                    >
                      Guardar Credenciais
                    </button>
                  </div>
                </div>
              ) : showAddConnection ? (
                // Ecrã para adicionar nova ligação bancária
                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ligar nova conta</span>
                    <button onClick={() => setShowAddConnection(false)} className="text-[9px] font-black text-brand-purple">Voltar</button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label style={{fontSize:8,fontWeight:850,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.06em'}}>1. Seleciona o Banco</label>
                      <select
                        value={selectedInstId}
                        onChange={e => setSelectedInstId(e.target.value)}
                        className="w-full px-3 py-2.5 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                      >
                        {institutions.map(inst => (
                          <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{fontSize:8,fontWeight:850,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.06em'}}>2. Associar à Conta na App</label>
                      <select
                        value={associateBankId}
                        onChange={e => setAssociateBankId(e.target.value)}
                        className="w-full px-3 py-2.5 mt-1 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                      >
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleStartBankConnection}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-tr from-[#16C784] to-[#0D9488] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Iniciar Autorização Bancária
                    </button>
                    <p style={{fontSize:8,color:P.inkSubtle,textAlign:'center',lineHeight:1.4}}>
                      Vais ser redirecionado para a página segura do teu banco para dares consentimento de consulta.
                    </p>
                  </div>
                </div>
              ) : (
                // Lista de conexões configuradas
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contas Bancárias Ligadas</span>
                      <button
                        onClick={handleLoadInstitutions}
                        disabled={loadingInsts}
                        className="p-1 px-2.5 rounded-lg bg-[#EEF1FE] text-brand-purple text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1"
                      >
                        {loadingInsts ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />}
                        Ligar Banco
                      </button>
                    </div>

                    {connections.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl">
                        <Link2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                        <p style={{fontSize:10,fontWeight:700,color:P.inkMuted}}>Sem bancos ligados</p>
                        <p style={{fontSize:8,color:P.inkSubtle,marginTop:2}}>Clica em Ligar Banco no topo para começar.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {connections.map(conn => (
                          <div key={conn.bankId} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="min-w-0">
                              <span className="text-xs font-black text-brand-dark leading-tight block truncate">{conn.bankName}</span>
                              <span className="text-[8px] text-cat-green font-bold flex items-center gap-1 mt-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Conta Ativa
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleSyncConnection(conn)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-brand-purple hover:bg-indigo-50"
                                title="Sincronizar Lançamentos"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveConnection(conn.bankId)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-red-500 hover:bg-red-50"
                                title="Desconectar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Detalhes de Credenciais */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-3.5 flex justify-between items-center">
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <Info className="w-4 h-4 text-brand-purple" />
                      <div>
                        <span style={{fontSize:9,fontWeight:800,color:P.ink,display:'block'}}>Chaves Locais ativas</span>
                        <span style={{fontSize:8,color:P.inkSubtle}}>As chaves estão salvas e seguras</span>
                      </div>
                    </div>
                    <button onClick={handleRemoveGCKeys} className="p-1.5 px-3 rounded-lg bg-red-50 text-red-500 text-[8px] font-extrabold uppercase tracking-widest">
                      Apagar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Automação de Gastos</span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  Como esta app garante a tua **total privacidade** e guarda tudo de forma local, podes criar atalhos automáticos no telemóvel para registar as compras reais instantaneamente!
                </p>
              </div>

              {/* iOS Shortcuts */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
                <span className="text-[9px] font-black text-brand-dark uppercase tracking-widest block" style={{color:'#4F6EF7'}}>Configuração do iPhone (iOS Atalhos)</span>
                <ol className="text-[9px] text-slate-500 leading-relaxed font-semibold pl-4 list-decimal space-y-1">
                  <li>Abre a app <strong className="text-slate-800">Atalhos</strong> no iPhone e vai a <strong className="text-slate-800">Automação</strong>.</li>
                  <li>Cria uma nova Automação Pessoal e escolhe <strong className="text-slate-800">Transação</strong> (Apple Pay) ou ao receber Notificação do teu Banco (Revolut, Millennium).</li>
                  <li>Adiciona a ação <strong className="text-slate-800">Obter conteúdo de URL</strong>.</li>
                  <li>Configura o URL do teu atalho (substituindo as variáveis do valor e comerciante):
                    <div style={{background:'#F7F8FF',padding:'6px 8px',borderRadius:8,fontFamily:'monospace',fontSize:8,wordBreak:'break-all',marginTop:4,color:'#4F6EF7'}}>
                      {window.location.origin}/#add?amount=<strong>[Valor]</strong>&amp;desc=<strong>[Comerciante]</strong>&amp;bank=revolut
                    </div>
                  </li>
                  <li>Desativa "Perguntar ao Executar". Fica 100% automático!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
