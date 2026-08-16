import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Clipboard } from 'lucide-react';
import type { Transaction, Bank, TransactionCategory, TransactionType } from '../types';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: Bank[];
  onImport: (transactions: Omit<Transaction, 'id'>[]) => void;
}

const P = {
  brand: '#4F6EF7',
  brandLight: '#EEF1FE',
  success: '#16C784',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  ink: '#111827',
  inkMuted: '#6B7280',
  inkSubtle: '#9CA3AF',
  border: '#E5E8F8',
  surface: '#FFFFFF',
};

const parseCSV = (text: string): string[][] => {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' || char === ';') {
      if (!inQuotes) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (!inQuotes) {
        row.push(entry.trim());
        lines.push(row);
        row = [];
        entry = '';
      } else {
        entry += char;
      }
    } else {
      entry += char;
    }
  }
  if (row.length > 0 || entry) {
    row.push(entry.trim());
    lines.push(row);
  }
  return lines.filter(l => l.length > 0 && l.some(cell => cell !== ''));
};

const parseFreeText = (text: string, bankId: string): Omit<Transaction, 'id'>[] => {
  const lines = text.split('\n');
  const txs: Omit<Transaction, 'id'>[] = [];
  
  // Regex para detetar valores com sinal e símbolos opcionais
  const amountRegex = /(-?\+?\d+(?:[\s\.]\d{3})*(?:[\.,]\d{2}))\s*(?:€|EUR|usd)?/i;
  // Regex para datas comuns
  const dateRegex = /(\d{1,2})[\/\-\s](\d{1,2}|\w{3,4})[\/\-\s]?(\d{2,4})?/;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Extrair valor
    const amountMatch = line.match(amountRegex);
    if (!amountMatch) continue;

    let rawAmountStr = amountMatch[1].replace(/\s/g, '');
    if (rawAmountStr.includes(',') && rawAmountStr.includes('.')) {
      rawAmountStr = rawAmountStr.replace(/\./g, '').replace(',', '.');
    } else if (rawAmountStr.includes(',')) {
      rawAmountStr = rawAmountStr.replace(',', '.');
    }
    
    const rawAmount = parseFloat(rawAmountStr);
    if (isNaN(rawAmount)) continue;

    const type: TransactionType = rawAmount < 0 || line.includes('-') ? 'expense' : 'income';
    const amount = Math.abs(rawAmount);

    // Extrair data
    let dateStr = new Date().toISOString().split('T')[0];
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      let month = new Date().getMonth();
      let year = new Date().getFullYear();

      const rawMonth = dateMatch[2];
      if (/^\d+$/.test(rawMonth)) {
        month = parseInt(rawMonth) - 1;
      } else {
        const monthsPT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const monthsEN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const mLower = rawMonth.toLowerCase();
        const ptIdx = monthsPT.findIndex(m => mLower.startsWith(m));
        const enIdx = monthsEN.findIndex(m => mLower.startsWith(m));
        if (ptIdx !== -1) month = ptIdx;
        else if (enIdx !== -1) month = enIdx;
      }

      if (dateMatch[3]) {
        let yr = parseInt(dateMatch[3]);
        if (yr < 100) yr += 2000;
        year = yr;
      }

      try {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      } catch {}
    }

    // Obter descrição limpa
    let description = line
      .replace(amountRegex, '')
      .replace(dateRegex, '')
      .replace(/[\-\|•\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!description || description.length < 2) {
      description = 'Movimento Colado';
    }

    // Categorização inteligente automática
    let category = 'Outros';
    const descLower = description.toLowerCase();
    if (descLower.includes('uber') || descLower.includes('bolt') || descLower.includes('combustivel') || descLower.includes('galp') || descLower.includes('bp') || descLower.includes('repsol') || descLower.includes('metro') || descLower.includes('carris')) {
      category = 'Transportes';
    } else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('cafe') || descLower.includes('restaurante') || descLower.includes('bar') || descLower.includes('mcdonald') || descLower.includes('burger')) {
      category = 'Lazer';
    } else if (descLower.includes('renda') || descLower.includes('agua') || descLower.includes('luz') || descLower.includes('gas') || descLower.includes('seguro') || descLower.includes('continente') || descLower.includes('pingo doce') || descLower.includes('auchan')) {
      category = 'Fixos';
    } else if (descLower.includes('vencimento') || descLower.includes('salario') || descLower.includes('recompensa')) {
      category = 'Salário';
    }

    txs.push({
      description,
      amount,
      type,
      category,
      date: dateStr,
      bankId
    });
  }

  return txs;
};

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, banks, onImport }) => {
  const [importMode, setImportMode] = useState<'csv' | 'text'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(banks.length > 0 ? banks[0].id : '');
  const [format, setFormat] = useState<'auto' | 'revolut' | 'millennium' | 't212'>('auto');
  const [parsedTransactions, setParsedTransactions] = useState<Omit<Transaction, 'id'>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMsg('Por favor, seleciona um ficheiro em formato CSV.');
      return;
    }
    setFile(selectedFile);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          throw new Error('O ficheiro CSV não tem linhas suficientes.');
        }
        detectAndParse(rows, selectedFile);
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao analisar o ficheiro CSV.');
        setFile(null);
        setParsedTransactions([]);
      }
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const detectAndParse = (rows: string[][], selectedFile: File) => {
    const headers = rows[0].map(h => h.toLowerCase());
    let detectedFormat = format;

    if (detectedFormat === 'auto') {
      const filename = selectedFile.name.toLowerCase();
      if (filename.includes('revolut') || headers.includes('completed date') || headers.includes('started date') || headers.includes('balance')) {
        detectedFormat = 'revolut';
      } else if (filename.includes('trading') || filename.includes('t212') || headers.includes('action') || headers.includes('ticker') || headers.includes('sub account')) {
        detectedFormat = 't212';
      } else if (filename.includes('millennium') || filename.includes('bcp') || rows.some(r => r.some(c => c.toLowerCase().includes('millennium') || c.toLowerCase().includes('data valor')))) {
        detectedFormat = 'millennium';
      } else {
        detectedFormat = 'revolut'; // Fallback
      }
    }

    const txs: Omit<Transaction, 'id'>[] = [];

    if (detectedFormat === 'revolut') {
      const dateIdx = rows[0].findIndex(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('data') || h.toLowerCase().includes('concluído') || h.toLowerCase().includes('iniciado'));
      const descIdx = rows[0].findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('descrição') || h.toLowerCase().includes('conceito'));
      const amountIdx = rows[0].findIndex(h => h.toLowerCase().includes('amount') || h.toLowerCase().includes('valor') || h.toLowerCase().includes('importe'));
      
      if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
        throw new Error('Não foi possível identificar colunas básicas (Data, Descrição, Valor) no CSV do Revolut.');
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= Math.max(dateIdx, descIdx, amountIdx)) continue;

        const rawAmount = parseFloat(row[amountIdx].replace(',', '.'));
        if (isNaN(rawAmount)) continue;

        const desc = row[descIdx] || 'Lançamento Revolut';
        const type: TransactionType = rawAmount > 0 ? 'income' : 'expense';

        let category: TransactionCategory = 'Outros';
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

        let formattedDate = new Date().toISOString().split('T')[0];
        try {
          const rawDate = row[dateIdx].trim();
          const cleanDate = rawDate.split(' ')[0];
          const parts = cleanDate.split(/[\-\/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (parts[2].length === 4) {
              formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        } catch {}

        txs.push({
          description: desc,
          amount: Math.abs(rawAmount),
          type,
          category,
          date: formattedDate,
          bankId: selectedBankId
        });
      }
    } else if (detectedFormat === 'millennium') {
      let dataIndex = -1;
      let descIndex = -1;
      let importeValeurIndex = -1;

      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const row = rows[r];
        const dateIdx = row.findIndex(c => c.toLowerCase().includes('data valor') || c.toLowerCase().includes('data mov'));
        const descIdx = row.findIndex(c => c.toLowerCase().includes('descrição') || c.toLowerCase().includes('descritivo') || c.toLowerCase().includes('movimento'));
        const valueIdx = row.findIndex(c => c.toLowerCase().includes('importâncias') || c.toLowerCase().includes('valor') || c.toLowerCase().includes('montante'));

        if (dateIdx !== -1 && descIdx !== -1 && valueIdx !== -1) {
          dataIndex = dateIdx;
          descIndex = descIdx;
          importeValeurIndex = valueIdx;
          break;
        }
      }

      if (dataIndex === -1) {
        dataIndex = rows[0].findIndex(c => c.toLowerCase().includes('data') || /^\d{2}[\-\/]\d{2}[\-\/]\d{4}$/.test(c));
        descIndex = rows[0].findIndex(c => c.toLowerCase().includes('desc') || c.toLowerCase().includes('conceito') || c.toLowerCase().includes('descritivo'));
        importeValeurIndex = rows[0].findIndex(c => c.toLowerCase().includes('valor') || c.toLowerCase().includes('quantia') || c.toLowerCase().includes('importe') || c.toLowerCase().includes('saldo'));
      }

      if (dataIndex === -1 || descIndex === -1 || importeValeurIndex === -1) {
        throw new Error('Não conseguimos ler as colunas de data/descrição/valores do Millennium. Tenta o método Copiar e Colar Texto!');
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= Math.max(dataIndex, descIndex, importeValeurIndex)) continue;

        const dateStr = row[dataIndex].trim();
        if (!dateStr || dateStr.toLowerCase().includes('data')) continue;

        let rawAmountStr = row[importeValeurIndex].replace(/\s/g, '');
        if (rawAmountStr.includes('.') && rawAmountStr.includes(',')) {
          rawAmountStr = rawAmountStr.replace(/\./g, '').replace(',', '.');
        } else if (rawAmountStr.includes(',')) {
          rawAmountStr = rawAmountStr.replace(',', '.');
        }

        const rawAmount = parseFloat(rawAmountStr);
        if (isNaN(rawAmount)) continue;

        const desc = row[descIndex] || 'Lançamento Millennium';
        const type: TransactionType = rawAmount > 0 ? 'income' : 'expense';

        let category: TransactionCategory = 'Outros';
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

        let formattedDate = new Date().toISOString().split('T')[0];
        try {
          const parts = dateStr.split(/[\-\/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (parts[2].length === 4) {
              formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        } catch {}

        txs.push({
          description: desc,
          amount: Math.abs(rawAmount),
          type,
          category,
          date: formattedDate,
          bankId: selectedBankId
        });
      }
    } else if (detectedFormat === 't212') {
      const dateIdx = rows[0].findIndex(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('data') || h.toLowerCase().includes('hora'));
      const actionIdx = rows[0].findIndex(h => h.toLowerCase().includes('action') || h.toLowerCase().includes('ação') || h.toLowerCase().includes('tipo'));
      const totalIdx = rows[0].findIndex(h => h.toLowerCase().includes('total') || h.toLowerCase().includes('valor') || h.toLowerCase().includes('importe'));
      const notesIdx = rows[0].findIndex(h => h.toLowerCase().includes('notes') || h.toLowerCase().includes('notas') || h.toLowerCase().includes('comentário'));

      if (dateIdx === -1 || actionIdx === -1 || totalIdx === -1) {
        throw new Error('Não foi possível identificar colunas (Hora, Ação, Total) no CSV da Trading 212.');
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= Math.max(dateIdx, actionIdx, totalIdx)) continue;

        const action = row[actionIdx] || '';
        const isDeposit = action.toLowerCase().includes('deposit') || action.toLowerCase().includes('depósito');
        const isWithdrawal = action.toLowerCase().includes('withdraw') || action.toLowerCase().includes('levantamento');
        const isInterest = action.toLowerCase().includes('interest') || action.toLowerCase().includes('juro');
        
        let type: TransactionType = 'expense';
        let category: TransactionCategory = 'Investimento';

        if (isDeposit) {
          type = 'expense';
          category = 'Investimento';
        } else if (isWithdrawal) {
          type = 'income';
          category = 'Investimento';
        } else if (isInterest) {
          type = 'income';
          category = 'Investimento';
        } else {
          continue; // Ignorar ordens normais de compra e venda interna de ações
        }

        const rawAmount = parseFloat(row[totalIdx].replace(',', '.'));
        if (isNaN(rawAmount)) continue;

        const notes = row[notesIdx] || action;
        let formattedDate = new Date().toISOString().split('T')[0];
        try {
          const rawDate = row[dateIdx].trim();
          const cleanDate = rawDate.split(' ')[0];
          const parts = cleanDate.split(/[\-\/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (parts[2].length === 4) {
              formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        } catch {}

        txs.push({
          description: `T212: ${notes}`,
          amount: Math.abs(rawAmount),
          type,
          category,
          date: formattedDate,
          bankId: selectedBankId
        });
      }
    }

    if (txs.length === 0) {
      throw new Error('Nenhuma transação válida foi encontrada no ficheiro.');
    }

    setParsedTransactions(txs);
  };

  const handleFreeTextChange = (text: string) => {
    setPastedText(text);
    setErrorMsg(null);
    if (!text.trim()) {
      setParsedTransactions([]);
      return;
    }
    try {
      const txs = parseFreeText(text, selectedBankId);
      setParsedTransactions(txs);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o texto colado.');
      setParsedTransactions([]);
    }
  };

  const handleConfirm = () => {
    if (parsedTransactions.length === 0) return;
    onImport(parsedTransactions);
    onClose();
    // Limpar estado
    setFile(null);
    setPastedText('');
    setParsedTransactions([]);
  };

  const formatEuro = (value: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

  const totalExp = parsedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalInc = parsedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-sm max-h-[85vh] rounded-[32px] border border-slate-100 p-5 shadow-premium flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest">
              Importar Transações
            </h4>
            <p style={{fontSize:9,color:P.inkSubtle,marginTop:2}}>Adiciona dados do teu extrato bancário</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white border border-slate-150 flex items-center justify-center text-slate-400 hover:bg-slate-55 transition-custom"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Seleção de Conta Bancária */}
        <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,flexShrink:0}}>
          <div>
            <label style={{fontSize:8,fontWeight:850,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.06em'}}>Conta Destino</label>
            <select
              value={selectedBankId}
              onChange={(e) => {
                setSelectedBankId(e.target.value);
                if (importMode === 'text' && pastedText) {
                  // Re-analisar com o novo banco
                  const txs = parseFreeText(pastedText, e.target.value);
                  setParsedTransactions(txs);
                }
              }}
              style={{
                width:'100%',
                padding:'8px 10px',
                marginTop:4,
                borderRadius:10,
                border:`1px solid ${P.border}`,
                background:'#FFFFFF',
                fontSize:11,
                fontWeight:700,
                color:P.ink
              }}
            >
              {banks.map(bank => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{fontSize:8,fontWeight:850,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.06em'}}>Formato CSV</label>
            <select
              value={format}
              disabled={importMode === 'text'}
              onChange={(e) => setFormat(e.target.value as any)}
              style={{
                width:'100%',
                padding:'8px 10px',
                marginTop:4,
                borderRadius:10,
                border:`1px solid ${P.border}`,
                background: importMode === 'text' ? '#F3F4F6' : '#FFFFFF',
                fontSize:11,
                fontWeight:700,
                color:P.ink,
                cursor: importMode === 'text' ? 'not-allowed' : 'default'
              }}
            >
              <option value="auto">Deteção Auto</option>
              <option value="revolut">Revolut CSV</option>
              <option value="millennium">Millennium BCP</option>
              <option value="t212">Trading 212</option>
            </select>
          </div>
        </div>

        {/* Seleção de Modo: Ficheiro CSV ou Copiar/Colar */}
        <div style={{display:'flex',background:'#F7F8FF',border:'1px solid #E5E8F8',borderRadius:12,padding:3,gap:3,marginTop:12,flexShrink:0}}>
          <button
            type="button"
            onClick={() => { setImportMode('csv'); setParsedTransactions([]); setErrorMsg(null); }}
            style={{
              flex:1,
              padding:'6px 2px',
              borderRadius:9,
              border:'none',
              cursor:'pointer',
              fontSize:9,
              fontWeight:800,
              textTransform:'uppercase',
              letterSpacing:'0.05em',
              transition:'all 0.2s',
              background: importMode === 'csv' ? '#FFFFFF' : 'transparent',
              color: importMode === 'csv' ? '#4F6EF7' : '#9CA3AF',
              boxShadow: importMode === 'csv' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Ficheiro CSV
          </button>
          <button
            type="button"
            onClick={() => { setImportMode('text'); setParsedTransactions([]); setErrorMsg(null); }}
            style={{
              flex:1,
              padding:'6px 2px',
              borderRadius:9,
              border:'none',
              cursor:'pointer',
              fontSize:9,
              fontWeight:800,
              textTransform:'uppercase',
              letterSpacing:'0.05em',
              transition:'all 0.2s',
              background: importMode === 'text' ? '#FFFFFF' : 'transparent',
              color: importMode === 'text' ? '#4F6EF7' : '#9CA3AF',
              boxShadow: importMode === 'text' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Copiar e Colar Texto
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 mt-4" style={{display:'flex',flexDirection:'column',gap:12}}>
          
          {importMode === 'csv' ? (
            // Drag and drop CSV
            !file ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex:1,
                  minHeight:100,
                  border:`2px dashed ${P.border}`,
                  borderRadius:20,
                  background:'#FFFFFF',
                  padding:20,
                  textAlign:'center',
                  cursor:'pointer',
                  transition:'all 0.2s',
                  display:'flex',
                  flexDirection:'column',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:8
                }}
              >
                <Upload style={{width:22,height:22,color:P.brand}} />
                <div>
                  <p style={{fontSize:11,fontWeight:800,color:P.ink}}>Arrasta o extrato CSV para aqui</p>
                  <p style={{fontSize:9,color:P.inkSubtle,marginTop:2}}>Ou clica para escolher o ficheiro</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv" 
                  style={{display:'none'}} 
                />
              </div>
            ) : (
              <div 
                style={{
                  background:P.successLight,
                  border:`1px solid ${P.success}30`,
                  borderRadius:16,
                  padding:'10px 12px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'space-between'
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                  <FileText style={{width:18,height:18,color:P.success,flexShrink:0}} />
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:10,fontWeight:800,color:P.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.name}</p>
                    <p style={{fontSize:8,color:P.success,fontWeight:700,marginTop:1}}>{parsedTransactions.length} movimentos extraídos</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setParsedTransactions([]); }} 
                  style={{background:'none',border:'none',color:P.inkSubtle,cursor:'pointer',padding:4}}
                >
                  <X style={{width:14,height:14}} />
                </button>
              </div>
            )
          ) : (
            // Caixa de Texto Inteligente (Copiar/Colar)
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{position:'relative'}}>
                <textarea
                  value={pastedText}
                  onChange={(e) => handleFreeTextChange(e.target.value)}
                  placeholder="Seleciona e COPIA os movimentos no ecrã do teu banco (Millennium BCP, Revolut, etc.) e COLA-OS aqui diretamente..."
                  style={{
                    width:'100%',
                    height:100,
                    padding:'10px 12px',
                    borderRadius:16,
                    border:`1px solid ${P.border}`,
                    background:'#FFFFFF',
                    fontSize:10,
                    fontWeight:600,
                    color:P.ink,
                    resize:'none',
                    lineHeight:1.4,
                    outline:'none'
                  }}
                />
                {!pastedText && (
                  <Clipboard style={{position:'absolute',right:12,bottom:12,width:14,height:14,color:P.inkSubtle,pointerEvents:'none'}} />
                )}
              </div>
              <p style={{fontSize:8,color:P.inkSubtle,lineHeight:1.3,fontWeight:600,padding:'0 2px'}}>
                💡 <strong>Como funciona:</strong> O nosso algoritmo lê o texto colado da área de transferência e encontra automaticamente as datas, valores e nomes das lojas de forma inteligente.
              </p>
            </div>
          )}

          {errorMsg && (
            <div style={{background:P.dangerLight,border:`1px solid ${P.danger}30`,borderRadius:12,padding:'8px 10px',display:'flex',alignItems:'center',gap:8,color:P.danger,fontSize:9,fontWeight:700}}>
              <AlertCircle style={{width:13,height:13,flexShrink:0}} />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedTransactions.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:2}}>
              <span style={{fontSize:8,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',padding:'0 2px'}}>Resumo da Leitura ({parsedTransactions.length} detetados)</span>
              
              <div style={{background:'#F7F8FF',borderRadius:14,padding:'8px 10px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div>
                  <span style={{fontSize:7,fontWeight:700,color:P.inkSubtle,textTransform:'uppercase'}}>Despesas</span>
                  <p style={{fontSize:11,fontWeight:900,color:P.danger,marginTop:1}}>
                    -{formatEuro(totalExp)}
                  </p>
                </div>
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:7,fontWeight:700,color:P.inkSubtle,textTransform:'uppercase'}}>Receitas</span>
                  <p style={{fontSize:11,fontWeight:900,color:P.success,marginTop:1}}>
                    +{formatEuro(totalInc)}
                  </p>
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:110,overflowY:'auto'}} className="no-scrollbar">
                {parsedTransactions.slice(0, 3).map((tx, idx) => (
                  <div key={idx} style={{background:'#FFFFFF',borderRadius:10,border:`1px solid ${P.border}`,padding:'6px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{minWidth:0, marginRight:6}}>
                      <p style={{fontSize:9,fontWeight:800,color:P.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</p>
                      <span style={{fontSize:7,color:P.inkSubtle,fontWeight:600}}>{tx.date} · {tx.category}</span>
                    </div>
                    <span style={{fontSize:9,fontWeight:900,color: tx.type === 'income' ? P.success : P.danger, flexShrink:0}}>
                      {tx.type === 'income' ? '+' : '-'}{formatEuro(tx.amount)}
                    </span>
                  </div>
                ))}
                {parsedTransactions.length > 3 && (
                  <p style={{fontSize:8,color:P.inkSubtle,textAlign:'center',fontWeight:700,marginTop:2}}>
                    e mais {parsedTransactions.length - 3} movimentos...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé / Botões */}
        <div style={{borderTop:`1px solid ${P.border}`,paddingTop:10,marginTop:10,display:'flex',gap:8,flexShrink:0}}>
          <button 
            onClick={onClose} 
            style={{flex:1,padding:'9px',borderRadius:10,background:'#F7F8FF',border:`1px solid ${P.border}`,color:P.inkMuted,fontSize:10,fontWeight:800,cursor:'pointer'}}
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={parsedTransactions.length === 0}
            style={{
              flex:1.5,
              padding:'9px',
              borderRadius:10,
              background: parsedTransactions.length > 0 ? 'linear-gradient(135deg,#4F6EF7,#7C5CFC)' : P.inkSubtle,
              color:'#fff',
              fontSize:10,
              fontWeight:900,
              border:'none',
              cursor: parsedTransactions.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: parsedTransactions.length > 0 ? '0 4px 12px rgba(79,110,247,0.30)' : 'none',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:4
            }}
          >
            <CheckCircle2 style={{width:13,height:13}} />
            Confirmar Importação
          </button>
        </div>
      </div>
    </div>
  );
};
