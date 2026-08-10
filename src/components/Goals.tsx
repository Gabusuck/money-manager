import React, { useState } from 'react';
import { PiggyBank, TrendingUp, Plus, Trash2, Target, Calendar, CheckCircle2, X, Zap } from 'lucide-react';
import type { SavingGoal } from '../types';

interface GoalsProps {
  goals: SavingGoal[];
  onAddGoal: (goal: Omit<SavingGoal, 'id'>) => void;
  onDeleteGoal: (id: string) => void;
  onContributeToGoal: (goalId: string, amount: number) => void;
}

const P = {
  brand: '#4F6EF7',
  brandLight: '#EEF1FE',
  brandDark: '#3A58E0',
  success: '#16C784',
  successLight: '#ECFDF5',
  purple: '#8B5CF6',
  purpleLight: '#F5F3FF',
  ink: '#111827',
  inkMuted: '#6B7280',
  inkSubtle: '#9CA3AF',
  border: '#E5E8F8',
  surface: '#FFFFFF',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1.5px solid ${P.border}`,
  background: P.surface,
  color: P.ink,
  fontSize: 13,
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: P.inkSubtle,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: 6,
};

export const Goals: React.FC<GoalsProps> = ({
  goals,
  onAddGoal,
  onDeleteGoal,
  onContributeToGoal,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState<'Poupança' | 'Investimento'>('Poupança');
  const [deadline, setDeadline] = useState('');
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const formatEuro = (value: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(target);
    if (!title.trim() || isNaN(parsedTarget) || parsedTarget <= 0) {
      alert('Preenche os dados da meta corretamente.');
      return;
    }
    onAddGoal({ title: title.trim(), target: parsedTarget, current: 0, category, deadline: deadline || undefined });
    setTitle(''); setTarget(''); setCategory('Poupança'); setDeadline('');
    setIsAdding(false);
  };

  const handleContributionSubmit = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) { alert('Introduz um valor válido.'); return; }
    onContributeToGoal(goalId, amount);
    setContributionAmount('');
    setContributingId(null);
  };

  // Stats
  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const completedCount = goals.filter(g => g.current >= g.target).length;
  const overallPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  return (
    <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero Summary */}
      <div style={{
        background: 'linear-gradient(135deg,#4F6EF7 0%,#7C5CFC 100%)',
        borderRadius: 24,
        padding: '20px 20px',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(79,110,247,0.30)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{position:'absolute',top:-24,right:-24,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}} />
        <div style={{position:'absolute',bottom:-16,right:40,width:70,height:70,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}} />

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.7}}>
            Metas &amp; Objetivos
          </p>
          {completedCount > 0 && (
            <span style={{fontSize:11,fontWeight:800,background:'rgba(255,255,255,0.18)',borderRadius:999,padding:'4px 12px',display:'flex',alignItems:'center',gap:5}}>
              <CheckCircle2 style={{width:12,height:12}} />
              {completedCount} concluída{completedCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          <div>
            <span style={{fontSize:9,fontWeight:700,opacity:0.65,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Total Poupado</span>
            <span style={{fontSize:22,fontWeight:900,letterSpacing:'-0.02em'}}>{formatEuro(totalSaved)}</span>
          </div>
          <div style={{textAlign:'right'}}>
            <span style={{fontSize:9,fontWeight:700,opacity:0.65,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Objetivo Total</span>
            <span style={{fontSize:22,fontWeight:900,letterSpacing:'-0.02em'}}>{formatEuro(totalTarget)}</span>
          </div>
        </div>

        {/* Progress Bar Global */}
        {totalTarget > 0 && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:10,opacity:0.7}}>Progresso geral</span>
              <span style={{fontSize:10,fontWeight:900}}>{overallPct.toFixed(0)}%</span>
            </div>
            <div style={{height:6,borderRadius:999,background:'rgba(255,255,255,0.2)',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:999,background:'rgba(255,255,255,0.9)',width:`${overallPct}%`,transition:'width 0.5s ease'}} />
            </div>
          </div>
        )}
      </div>

      {/* Botão Nova Meta */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            width:'100%',
            padding:'14px',
            borderRadius:16,
            background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)',
            color:'#fff',
            fontSize:12,
            fontWeight:800,
            letterSpacing:'0.05em',
            border:'none',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:8,
            cursor:'pointer',
            boxShadow:'0 4px 16px rgba(79,110,247,0.30)',
          }}
        >
          <Plus style={{width:16,height:16}} />
          Nova Meta
        </button>
      )}

      {/* Formulário */}
      {isAdding && (
        <form onSubmit={handleCreateGoal} style={{background:P.surface,borderRadius:20,border:`1px solid ${P.border}`,padding:20,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 4px 20px rgba(79,110,247,0.08)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${P.border}`,paddingBottom:12}}>
            <span style={{fontSize:12,fontWeight:900,color:P.ink,display:'flex',alignItems:'center',gap:6}}>
              <Target style={{width:14,height:14,color:P.brand}} />
              Criar Novo Objetivo
            </span>
            <button type="button" onClick={() => setIsAdding(false)} style={{width:28,height:28,borderRadius:8,background:P.brandLight,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <X style={{width:12,height:12,color:P.brand}} />
            </button>
          </div>

          {/* Título */}
          <div>
            <label style={labelStyle}>Título do Objetivo</label>
            <input type="text" placeholder="Novo Portátil, Férias de Verão, Fundo Emergência…" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} required />
          </div>

          {/* Valor + Categoria */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={labelStyle}>Valor Alvo (€)</label>
              <input type="number" placeholder="1000" value={target} onChange={e => setTarget(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value as any)} style={inputStyle}>
                <option value="Poupança">Poupança</option>
                <option value="Investimento">Investimento</option>
              </select>
            </div>
          </div>

          {/* Data Limite */}
          <div>
            <label style={{...labelStyle, display:'flex', alignItems:'center', gap:4}}>
              <Calendar style={{width:10,height:10}} /> Data Limite (Opcional)
            </label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} />
          </div>

          {/* Submit */}
          <button type="submit" style={{width:'100%',padding:'14px',borderRadius:14,background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)',color:'#fff',fontSize:12,fontWeight:900,letterSpacing:'0.07em',border:'none',cursor:'pointer',boxShadow:'0 6px 20px rgba(79,110,247,0.35)',textTransform:'uppercase' as const}}>
            Criar Meta
          </button>
        </form>
      )}

      {/* Lista de Metas */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {goals.length === 0 ? (
          <div style={{background:P.surface,borderRadius:20,border:`1px solid ${P.border}`,padding:'40px 20px',textAlign:'center',boxShadow:'0 2px 12px rgba(79,110,247,0.06)'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:P.brandLight,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
              <Target style={{width:22,height:22,color:P.brand}} />
            </div>
            <p style={{fontSize:13,fontWeight:700,color:P.ink,marginBottom:6}}>Sem metas definidas</p>
            <p style={{fontSize:11,color:P.inkSubtle}}>Cria o teu primeiro objetivo e começa a acompanhar a tua poupança.</p>
          </div>
        ) : (
          goals.map(goal => {
            const pct = Math.min((goal.current / goal.target) * 100, 100);
            const isFinished = goal.current >= goal.target;
            const isPoupanca = goal.category === 'Poupança';
            const accentColor = isPoupanca ? P.purple : P.success;
            const accentBg    = isPoupanca ? P.purpleLight : P.successLight;
            const remaining   = Math.max(goal.target - goal.current, 0);

            // Dias restantes até ao prazo
            let daysLeft: number | null = null;
            if (goal.deadline && !isFinished) {
              daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
            }

            return (
              <div
                key={goal.id}
                style={{
                  background: isFinished
                    ? `linear-gradient(135deg,${P.success}08,${P.success}14)`
                    : P.surface,
                  borderRadius: 22,
                  border: isFinished
                    ? `1.5px solid ${P.success}40`
                    : `1px solid ${P.border}`,
                  padding: '16px',
                  boxShadow: '0 2px 16px rgba(79,110,247,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                {/* Accent bar left */}
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:accentColor,borderRadius:'22px 0 0 22px'}} />

                {/* Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',paddingLeft:10,marginBottom:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:38,height:38,borderRadius:'50%',background:accentBg,border:`1px solid ${accentColor}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {isPoupanca
                        ? <PiggyBank style={{width:16,height:16,color:accentColor}} />
                        : <TrendingUp style={{width:16,height:16,color:accentColor}} />
                      }
                    </div>
                    <div>
                      <h4 style={{fontSize:13,fontWeight:800,color:P.ink,lineHeight:1.3}}>{goal.title}</h4>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3,flexWrap:'wrap'}}>
                        <span style={{fontSize:9,fontWeight:800,background:accentBg,color:accentColor,borderRadius:999,padding:'2px 8px',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                          {goal.category}
                        </span>
                        {goal.deadline && (
                          <span style={{fontSize:9,fontWeight:700,color:daysLeft !== null && daysLeft <= 7 ? '#EF4444' : P.inkSubtle,display:'flex',alignItems:'center',gap:3}}>
                            <Calendar style={{width:9,height:9}} />
                            {daysLeft !== null && daysLeft >= 0
                              ? `${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`
                              : 'Prazo ultrapassado'
                            }
                          </span>
                        )}
                        {isFinished && (
                          <span style={{fontSize:9,fontWeight:800,background:'#ECFDF5',color:'#16C784',borderRadius:999,padding:'2px 8px',display:'flex',alignItems:'center',gap:3}}>
                            <CheckCircle2 style={{width:9,height:9}} /> Concluída!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    style={{width:28,height:28,borderRadius:10,background:'#FEF2F2',border:'1px solid #FECACA',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}
                    title="Eliminar meta"
                  >
                    <Trash2 style={{width:12,height:12,color:'#EF4444'}} />
                  </button>
                </div>

                {/* Progresso */}
                <div style={{paddingLeft:10,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                    <span style={{fontSize:11,fontWeight:700,color:P.inkMuted}}>
                      {formatEuro(goal.current)} <span style={{color:P.inkSubtle,fontWeight:600}}>de {formatEuro(goal.target)}</span>
                    </span>
                    <span style={{fontSize:14,fontWeight:900,color: isFinished ? P.success : P.ink}}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div style={{height:8,borderRadius:999,background: isFinished ? `${P.success}20` : '#F0F4FF',overflow:'hidden'}}>
                    <div style={{
                      height:'100%',
                      borderRadius:999,
                      width:`${pct}%`,
                      background: isFinished
                        ? `linear-gradient(90deg,${P.success},#0D9488)`
                        : `linear-gradient(90deg,${accentColor},${isPoupanca ? '#7C5CFC' : '#06B6D4'})`,
                      transition:'width 0.5s cubic-bezier(0.16,1,0.3,1)',
                      boxShadow: `0 0 8px ${accentColor}50`,
                    }} />
                  </div>

                  {!isFinished && (
                    <p style={{fontSize:10,color:P.inkSubtle,marginTop:5}}>
                      Faltam <strong style={{color:P.ink}}>{formatEuro(remaining)}</strong> para atingires o objetivo
                    </p>
                  )}
                </div>

                {/* Ação de Contribuição */}
                <div style={{paddingLeft:10,paddingTop:10,borderTop:`1px solid ${P.border}`}}>
                  {isFinished ? (
                    <div style={{display:'flex',alignItems:'center',gap:6,color:P.success,fontSize:11,fontWeight:800}}>
                      <CheckCircle2 style={{width:14,height:14}} />
                      Objetivo alcançado! 🎯
                    </div>
                  ) : contributingId === goal.id ? (
                    <form onSubmit={e => handleContributionSubmit(e, goal.id)} style={{display:'flex',gap:8,alignItems:'center'}}>
                      <input
                        type="number"
                        placeholder="Valor (€)"
                        value={contributionAmount}
                        onChange={e => setContributionAmount(e.target.value)}
                        style={{...inputStyle, padding:'9px 12px', fontSize:12, flex:1}}
                        required
                        autoFocus
                      />
                      <button type="submit" style={{padding:'9px 14px',borderRadius:12,background:`linear-gradient(135deg,${P.brand},#7C5CFC)`,color:'#fff',fontSize:11,fontWeight:800,border:'none',cursor:'pointer',whiteSpace:'nowrap' as const,flexShrink:0}}>
                        Reforçar
                      </button>
                      <button type="button" onClick={() => setContributingId(null)} style={{padding:'9px 10px',borderRadius:12,background:'#F7F8FF',border:`1px solid ${P.border}`,color:P.inkMuted,fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0}}>
                        <X style={{width:12,height:12}} />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setContributingId(goal.id)}
                      style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:12,background:P.brandLight,border:`1px solid #C7D2FE`,color:P.brand,fontSize:11,fontWeight:800,cursor:'pointer'}}
                    >
                      <Zap style={{width:12,height:12}} />
                      Adicionar Reforço
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
