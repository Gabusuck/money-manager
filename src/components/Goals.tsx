import React, { useState } from 'react';
import { PiggyBank, TrendingUp, Plus, Trash2, Calendar, Target, PlusCircle } from 'lucide-react';
import type { SavingGoal } from '../types';

interface GoalsProps {
  goals: SavingGoal[];
  onAddGoal: (goal: Omit<SavingGoal, 'id'>) => void;
  onDeleteGoal: (id: string) => void;
  onContributeToGoal: (goalId: string, amount: number) => void;
}

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

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(target);
    if (!title.trim() || isNaN(parsedTarget) || parsedTarget <= 0) {
      alert('Preenche os dados da meta corretamente.');
      return;
    }
    onAddGoal({
      title: title.trim(),
      target: parsedTarget,
      current: 0,
      category,
      deadline: deadline || undefined,
    });
    // Reset Form
    setTitle('');
    setTarget('');
    setCategory('Poupança');
    setDeadline('');
    setIsAdding(false);
  };

  const handleContributionSubmit = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Introduz um valor válido de contribuição.');
      return;
    }
    onContributeToGoal(goalId, amount);
    setContributionAmount('');
    setContributingId(null);
  };

  return (
    <div className="px-4 pb-6 space-y-5">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mt-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Metas & Objetivos</h2>
          <p className="text-xxs text-slate-500 mt-0.5">Define e acompanha as tuas poupanças</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1c1d22] hover:bg-[#282a30] rounded-full hover:scale-102 active:scale-98 transition-transform shadow-premium cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Meta
        </button>
      </div>

      {/* Formulário Nova Meta */}
      {isAdding && (
        <form 
          onSubmit={handleCreateGoal}
          className="bg-[#e5e6eb] rounded-3xl p-5 space-y-4 shadow-premium animate-in fade-in slide-in-from-top-4 duration-200 text-black border border-slate-200"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-4 h-4 text-slate-800" /> Criar Novo Objetivo
            </h3>
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="text-xs font-bold text-slate-500 hover:text-black cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Título do Objetivo</label>
              <input
                type="text"
                placeholder="Ex: Novo Portátil, Férias de Verão..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-black text-black shadow-inner-soft"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Valor Alvo (€)</label>
                <input
                  type="number"
                  placeholder="Ex: 800"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-black text-black shadow-inner-soft"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-black text-black shadow-inner-soft"
                >
                  <option value="Poupança" className="bg-white text-black">Poupança (TV/Câmara)</option>
                  <option value="Investimento" className="bg-white text-black">Investimento (T212)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Data Limite (Opcional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-black text-black shadow-inner-soft"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#1c1d22] hover:bg-[#282a30] text-white rounded-full text-xs font-black uppercase tracking-widest shadow-premium hover:scale-[1.01] active:scale-99 transition-transform cursor-pointer"
            >
              Criar Meta
            </button>
          </div>
        </form>
      )}

      {/* Lista de Metas em Cartões Flutuantes com cantos rounded-3xl */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="bg-[#e5e6eb] rounded-3xl p-8 text-center shadow-premium text-slate-600">
            <PiggyBank className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xxs font-bold">Ainda não definiste metas de poupança.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const pct = Math.min((goal.current / goal.target) * 100, 100);
            const isFinished = goal.current >= goal.target;
            const isPoupanca = goal.category === 'Poupança';

            return (
              <div 
                key={goal.id} 
                className="bg-[#e5e6eb] rounded-[28px] p-5 space-y-4 shadow-premium hover:border-slate-300 transition-custom relative overflow-hidden text-black border border-slate-200"
              >
                {/* Indicador de Categoria Lateral */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-lg" 
                  style={{ backgroundColor: isPoupanca ? '#a855f7' : '#10b981' }}
                />

                <div className="flex justify-between items-start pl-1">
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${isPoupanca ? 'bg-cat-purple/10 border-cat-purple/20 text-cat-purple' : 'bg-cat-green/10 border-cat-green/20 text-cat-green'} shadow-sm shrink-0`}>
                      {isPoupanca ? <PiggyBank className="w-4.5 h-4.5" /> : <TrendingUp className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{goal.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${isPoupanca ? 'bg-cat-purple/10 text-cat-purple' : 'bg-cat-green/10 text-cat-green'}`}>
                          {goal.category}
                        </span>
                        {goal.deadline && (
                          <span className="text-[9px] text-slate-500 flex items-center gap-1 font-semibold">
                            <Calendar className="w-3 h-3 text-slate-400" /> Até {goal.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="w-7 h-7 text-slate-450 hover:text-cat-red hover:bg-red-50 rounded-lg flex items-center justify-center transition-custom cursor-pointer"
                    title="Eliminar meta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progresso Visual */}
                <div className="space-y-1.5 pl-1">
                  <div className="flex justify-between text-xxs font-semibold text-slate-500">
                    <span>{formatEuro(goal.current)} de {formatEuro(goal.target)}</span>
                    <span className="font-extrabold text-slate-900">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white border border-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isPoupanca ? 'bg-cat-purple' : 'bg-cat-green'}`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>

                {/* Ações da Meta (Contributo rápido) */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 pl-1">
                  {isFinished ? (
                    <span className="text-[10px] font-black text-cat-green uppercase tracking-widest">🎯 Objetivo Alcançado!</span>
                  ) : contributingId === goal.id ? (
                    <form 
                      onSubmit={(e) => handleContributionSubmit(e, goal.id)}
                      className="flex items-center gap-2 w-full animate-in fade-in duration-200"
                    >
                      <input
                        type="number"
                        placeholder="Valor (€)"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        className="flex-1 p-2 text-xxs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-black text-black shadow-inner-soft"
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-[#1c1d22] text-white text-xxs font-bold rounded-xl hover:bg-[#27292f] shadow-sm transition-custom cursor-pointer"
                      >
                        Reforçar
                      </button>
                      <button
                        type="button"
                        onClick={() => setContributingId(null)}
                        className="px-2 py-2 text-xxs font-bold text-slate-500 hover:text-black transition-custom cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setContributingId(goal.id)}
                      className="flex items-center gap-1 text-xxs font-extrabold text-slate-800 hover:underline transition-custom cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Adicionar Reforço
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
