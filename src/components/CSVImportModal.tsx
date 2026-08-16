import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
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

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, banks, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
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
      if (filename.includes('revolut') || headers.includes('completed date') || headers.includes('started date') || (headers.includes('descrição') && headers.includes('valor'))) {
        detectedFormat = 'revolut';
      } else if (filename.includes('trading') || filename.includes('t212') || headers.includes('ticker') || headers.includes('action') || headers.includes('total (eur)')) {
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

        const rawDate = row[dateIdx];
        const rawDesc = row[descIdx];
        const rawAmount = row[amountIdx];

        if (!rawDate || !rawDesc || !rawAmount) continue;

        let dateStr = '';
        try {
          const cleanDate = rawDate.split(' ')[0]; // pega só a data caso tenha horas
          const parts = cleanDate.split(/[-/.]/);
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            } else if (parts[0].length === 4) {
              dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
          } else {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
              dateStr = dateObj.toISOString().split('T')[0];
            }
          }
        } catch {
          continue;
        }

        if (!dateStr) continue;

        const cleanAmount = rawAmount.replace(/[^\d.,-]/g, '').replace(',', '.');
        const numAmount = parseFloat(cleanAmount);
        if (isNaN(numAmount) || numAmount === 0) continue;

        const type: TransactionType = numAmount > 0 ? 'income' : 'expense';
        const finalVal = Math.abs(numAmount);

        let category: TransactionCategory = 'Outros';
        const descLower = rawDesc.toLowerCase();
        if (descLower.includes('uber') || descLower.includes('bolt') || descLower.includes('combustivel') || descLower.includes('galp') || descLower.includes('bp') || descLower.includes('repsol') || descLower.includes('metro') || descLower.includes('carris')) {
          category = 'Transportes';
        } else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('cafe') || descLower.includes('restaurante') || descLower.includes('bar') || descLower.includes('mcdonald') || descLower.includes('burger')) {
          category = 'Lazer';
        } else if (descLower.includes('renda') || descLower.includes('agua') || descLower.includes('luz') || descLower.includes('gas') || descLower.includes('seguro')) {
          category = 'Fixos';
        } else if (descLower.includes('vencimento') || descLower.includes('salario') || descLower.includes('transferencia recebida')) {
          category = 'Salário';
        }

        txs.push({
          description: rawDesc,
          amount: finalVal,
          type,
          category,
          date: dateStr,
          bankId: selectedBankId,
        });
      }
    } else if (detectedFormat === 'millennium') {
      let tableStartRow = -1;
      let dateIdx = -1, descIdx = -1, amountIdx = -1;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].map(c => c.toLowerCase());
        const hasDate = row.some(c => c.includes('data valor') || c.includes('data lan') || c.includes('data mov'));
        const hasDesc = row.some(c => c.includes('descri') || c.includes('movimento') || c.includes('conceito') || c.includes('desc'));
        const hasAmount = row.some(c => c.includes('valor') || c.includes('montante') || c.includes('importe') || c.includes('quantia'));

        if (hasDate && hasDesc && hasAmount) {
          tableStartRow = i;
          dateIdx = rows[i].findIndex(c => c.toLowerCase().includes('data valor') || c.toLowerCase().includes('data lan') || c.toLowerCase().includes('data mov'));
          descIdx = rows[i].findIndex(c => c.toLowerCase().includes('descri') || c.toLowerCase().includes('movimento') || c.toLowerCase().includes('conceito') || c.toLowerCase().includes('desc'));
          amountIdx = rows[i].findIndex(c => c.toLowerCase().includes('valor') || c.toLowerCase().includes('montante') || c.toLowerCase().includes('importe') || c.toLowerCase().includes('quantia'));
          break;
        }
      }

      if (tableStartRow === -1) {
        throw new Error('Não identificámos a tabela do Millennium BCP. Verifica se tens cabeçalhos como "Data Lançamento", "Descrição" e "Valor".');
      }

      for (let i = tableStartRow + 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= Math.max(dateIdx, descIdx, amountIdx)) continue;

        const rawDate = row[dateIdx];
        const rawDesc = row[descIdx];
        const rawAmount = row[amountIdx];

        if (!rawDate || !rawDesc || !rawAmount) continue;

        const parts = rawDate.split(/[-/.]/);
        if (parts.length !== 3) continue;
        let dateStr = '';
        if (parts[2].length === 4) {
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (parts[0].length === 4) {
          dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        if (!dateStr) continue;

        const cleanAmount = rawAmount.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
        const numAmount = parseFloat(cleanAmount);
        if (isNaN(numAmount) || numAmount === 0) continue;

        const type: TransactionType = numAmount > 0 ? 'income' : 'expense';
        const finalVal = Math.abs(numAmount);

        let category: TransactionCategory = 'Outros';
        const descLower = rawDesc.toLowerCase();
        if (descLower.includes('uber') || descLower.includes('bolt') || descLower.includes('gasolin') || descLower.includes('prio') || descLower.includes('galp') || descLower.includes('via verde')) {
          category = 'Transportes';
        } else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('cafe') || descLower.includes('rest') || descLower.includes('comer') || descLower.includes('taberna')) {
          category = 'Lazer';
        } else if (descLower.includes('renda') || descLower.includes('condominio') || descLower.includes('continente') || descLower.includes('pingo doce') || descLower.includes('auchan')) {
          category = 'Fixos';
        } else if (descLower.includes('vencimento') || descLower.includes('salario') || descLower.includes('reforma')) {
          category = 'Salário';
        }

        txs.push({
          description: rawDesc,
          amount: finalVal,
          type,
          category,
          date: dateStr,
          bankId: selectedBankId,
        });
      }
    } else if (detectedFormat === 't212') {
      const actionIdx = rows[0].findIndex(h => h.toLowerCase().includes('action') || h.toLowerCase().includes('ação') || h.toLowerCase().includes('oper'));
      const timeIdx = rows[0].findIndex(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('tempo') || h.toLowerCase().includes('data'));
      const totalIdx = rows[0].findIndex(h => h.toLowerCase().includes('total') || h.toLowerCase().includes('importe') || h.toLowerCase().includes('valor'));
      const nameIdx = rows[0].findIndex(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('nome') || h.toLowerCase().includes('ticker'));

      if (timeIdx === -1 || totalIdx === -1) {
        throw new Error('Não identificámos colunas cruciais no CSV da Trading 212 (Time, Total).');
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= Math.max(timeIdx, totalIdx)) continue;

        const rawTime = row[timeIdx];
        const rawTotal = row[totalIdx];
        const rawAction = actionIdx !== -1 ? row[actionIdx] : 'Investimento';
        const rawName = nameIdx !== -1 ? row[nameIdx] : '';

        if (!rawTime || !rawTotal) continue;

        const dateStr = rawTime.split(' ')[0];
        const cleanAmount = rawTotal.replace(/[^\d.,-]/g, '').replace(',', '.');
        const numAmount = parseFloat(cleanAmount);
        if (isNaN(numAmount) || numAmount === 0) continue;

        const actionLower = rawAction.toLowerCase();
        let type: TransactionType = 'transfer';
        let category: TransactionCategory = 'Investimento';
        
        if (actionLower.includes('dividend') || actionLower.includes('juro') || actionLower.includes('interest')) {
          type = 'income';
          category = 'Investimento';
        }

        txs.push({
          description: `${rawAction}${rawName ? ' - ' + rawName : ''}`,
          amount: Math.abs(numAmount),
          type,
          category,
          date: dateStr,
          bankId: selectedBankId,
        });
      }
    }

    if (txs.length === 0) {
      throw new Error('Não encontrámos lançamentos válidos com este formato no CSV.');
    }

    setParsedTransactions(txs);
  };

  const handleConfirm = () => {
    if (parsedTransactions.length === 0) return;
    onImport(parsedTransactions);
    setFile(null);
    setParsedTransactions([]);
    onClose();
  };

  const totalExp = parsedTransactions.filter(t => t.type !== 'income').reduce((s,t) => s + t.amount, 0);
  const totalInc = parsedTransactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.50)',backdropFilter:'blur(8px)',zIndex:55,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div 
        style={{
          background:'#FFFFFF',
          borderRadius:24,
          border:`1px solid ${P.border}`,
          padding:20,
          width:'100%',
          maxWidth:440,
          boxShadow:'0 20px 60px rgba(79,110,247,0.15)',
          maxHeight:'90vh',
          display:'flex',
          flexDirection:'column'
        }}
      >
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${P.border}`,paddingBottom:12,marginBottom:16,flexShrink:0}}>
          <div>
            <h3 style={{fontSize:13,fontWeight:900,color:P.ink,display:'flex',alignItems:'center',gap:6}}>
              <Upload style={{width:16,height:16,color:P.brand}} />
              Importar Extrato Bancário
            </h3>
            <span style={{fontSize:9,color:P.inkSubtle,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Revolut · Millennium · Trading 212</span>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:8,background:P.brandLight,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <X style={{width:12,height:12,color:P.brand}} />
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:14}} className="no-scrollbar">
          <div>
            <label style={{fontSize:9,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Associar à Conta</label>
            <select 
              value={selectedBankId} 
              onChange={e => {
                setSelectedBankId(e.target.value);
                if (file) { processFile(file); }
              }} 
              style={{width:'100%',padding:'11px 12px',borderRadius:12,border:`1.5px solid ${P.border}`,background:P.surface,color:P.ink,fontSize:12,fontWeight:600,outline:'none'}}
            >
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{fontSize:9,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Formato do CSV</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,background:'#F7F8FF',border:`1px solid ${P.border}`,borderRadius:12,padding:3}}>
              {([
                { key: 'auto', label: 'Auto' },
                { key: 'revolut', label: 'Revolut' },
                { key: 'millennium', label: 'Millennium' },
                { key: 't212', label: 'T212' },
              ] as const).map(f => {
                const active = format === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setFormat(f.key);
                      if (file) {
                        setTimeout(() => processFile(file), 50);
                      }
                    }}
                    style={{
                      padding:'6px 2px',
                      borderRadius:8,
                      border:'none',
                      cursor:'pointer',
                      fontSize:9,
                      fontWeight:800,
                      transition:'all 0.15s',
                      background: active ? P.surface : 'transparent',
                      color: active ? P.brand : P.inkSubtle,
                      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border:`1.5px dashed ${P.brand}50`,
                borderRadius:16,
                padding:'28px 16px',
                textAlign:'center',
                background:`rgba(79,110,247,0.02)`,
                cursor:'pointer',
                transition:'all 0.2s',
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                gap:8
              }}
            >
              <Upload style={{width:24,height:24,color:P.brand}} />
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
                padding:'12px 14px',
                display:'flex',
                alignItems:'center',
                justifyContent:'space-between'
              }}
            >
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <FileText style={{width:20,height:20,color:P.success,flexShrink:0}} />
                <div style={{minWidth:0}}>
                  <p style={{fontSize:11,fontWeight:800,color:P.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.name}</p>
                  <p style={{fontSize:9,color:P.success,fontWeight:700,marginTop:1}}>{parsedTransactions.length} movimentos extraídos</p>
                </div>
              </div>
              <button 
                onClick={() => { setFile(null); setParsedTransactions([]); }} 
                style={{background:'none',border:'none',color:P.inkSubtle,cursor:'pointer',padding:4}}
              >
                <X style={{width:14,height:14}} />
              </button>
            </div>
          )}

          {errorMsg && (
            <div style={{background:P.dangerLight,border:`1px solid ${P.danger}30`,borderRadius:12,padding:'10px 12px',display:'flex',alignItems:'center',gap:8,color:P.danger,fontSize:10,fontWeight:700}}>
              <AlertCircle style={{width:14,height:14,flexShrink:0}} />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedTransactions.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
              <span style={{fontSize:9,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',padding:'0 2px'}}>Resumo dos Movimentos</span>
              
              <div style={{background:'#F7F8FF',borderRadius:14,padding:'10px 12px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div>
                  <span style={{fontSize:8,fontWeight:700,color:P.inkSubtle,textTransform:'uppercase'}}>Despesas</span>
                  <p style={{fontSize:13,fontWeight:900,color:P.danger,marginTop:2}}>
                    -{formatEuro(totalExp)}
                  </p>
                </div>
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:8,fontWeight:700,color:P.inkSubtle,textTransform:'uppercase'}}>Receitas</span>
                  <p style={{fontSize:13,fontWeight:900,color:P.success,marginTop:2}}>
                    +{formatEuro(totalInc)}
                  </p>
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:120,overflowY:'auto'}} className="no-scrollbar">
                {parsedTransactions.slice(0, 3).map((tx, idx) => (
                  <div key={idx} style={{background:'#FFFFFF',borderRadius:10,border:`1px solid ${P.border}`,padding:'8px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{minWidth:0}}>
                      <p style={{fontSize:10,fontWeight:800,color:P.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</p>
                      <span style={{fontSize:8,color:P.inkSubtle,fontWeight:600}}>{tx.date} · {tx.category}</span>
                    </div>
                    <span style={{fontSize:10,fontWeight:900,color: tx.type === 'income' ? P.success : P.danger, flexShrink:0, paddingLeft:8}}>
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

        <div style={{borderTop:`1px solid ${P.border}`,paddingTop:12,marginTop:16,display:'flex',gap:10,flexShrink:0}}>
          <button 
            onClick={onClose} 
            style={{flex:1,padding:'11px',borderRadius:12,background:'#F7F8FF',border:`1px solid ${P.border}`,color:P.inkMuted,fontSize:11,fontWeight:800,cursor:'pointer'}}
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={parsedTransactions.length === 0}
            style={{
              flex:1.5,
              padding:'11px',
              borderRadius:12,
              background: parsedTransactions.length > 0 ? 'linear-gradient(135deg,#4F6EF7,#7C5CFC)' : P.inkSubtle,
              color:'#fff',
              fontSize:11,
              fontWeight:900,
              border:'none',
              cursor: parsedTransactions.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: parsedTransactions.length > 0 ? '0 4px 14px rgba(79,110,247,0.30)' : 'none',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:6
            }}
          >
            <CheckCircle2 style={{width:14,height:14}} />
            Confirmar Importação
          </button>
        </div>
      </div>
    </div>
  );
};
