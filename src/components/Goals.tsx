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

  // Estados para contributo rápido
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
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-5">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mt-2">
        <div>
          <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Metas & Objetivos</h2>
          <p className="text-xxs text-gray-400 mt-0.5">Define e acompanha as tuas poupanças</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-brand-dark rounded-full hover:bg-slate-800 transition-custom shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Meta
        </button>
      </div>

      {/* Formulário Nova Meta */}
      {isAdding && (
        <form 
          onSubmit={handleCreateGoal}
          className="bg-white rounded-2xl border border-brand-border p-4 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-brand-dark" /> Criar Novo Objetivo
            </h3>
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="text-xs text-gray-400 hover:text-brand-dark"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Título do Objetivo</label>
              <input
                type="text"
                placeholder="Ex: Novo Portátil, Férias de Verão..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Valor Alvo (€)</label>
                <input
                  type="number"
                  placeholder="Ex: 800"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full p-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark"
                >
                  <option value="Poupança">Poupança (TV/Câmara)</option>
                  <option value="Investimento">Investimento (T212)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Data Limite (Opcional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-dark text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-custom"
            >
              Criar Meta
            </button>
          </div>
        </form>
      )}

      {/* Lista de Metas */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center shadow-xs">
            <PiggyBank className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Ainda não definiste metas de poupança.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const pct = Math.min((goal.current / goal.target) * 100, 100);
            const isFinished = goal.current >= goal.target;
            const isPoupanca = goal.category === 'Poupança';

            return (
              <div 
                key={goal.id} 
                className="bg-white rounded-2xl border border-brand-border p-5 space-y-4 shadow-xs hover:border-slate-300 transition-custom"
              >
                {/* Cabeçalho do Objetivo */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isPoupanca ? 'bg-cat-purple/10 text-cat-purple' : 'bg-cat-green/10 text-cat-green'}`}>
                      {isPoupanca ? <PiggyBank className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark">{goal.title}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${isPoupanca ? 'bg-cat-purple/10 text-cat-purple' : 'bg-cat-green/10 text-cat-green'}`}>
                          {goal.category}
                        </span>
                        {goal.deadline && (
                          <span className="text-[9px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> Até {goal.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="w-7 h-7 text-gray-400 hover:text-cat-red hover:bg-red-50 rounded-lg flex items-center justify-center transition-custom"
                    title="Eliminar meta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progresso Visual */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xxs font-medium text-gray-500">
                    <span>{formatEuro(goal.current)} de {formatEuro(goal.target)}</span>
                    <span className="font-bold text-brand-dark">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-brand-gray rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isPoupanca ? 'bg-cat-purple' : 'bg-cat-green'}`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>

                {/* Ações da Meta (Contributo rápido) */}
                <div className="flex justify-between items-center pt-1 border-t border-brand-border">
                  {isFinished ? (
                    <span className="text-xxs font-bold text-cat-green uppercase tracking-wider">🎯 Objetivo Alcançado!</span>
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
                        className="flex-1 p-2 text-xxs bg-brand-gray border border-brand-border rounded-lg focus:outline-none focus:border-brand-dark text-brand-dark"
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-brand-dark text-white text-xxs font-semibold rounded-lg hover:bg-slate-800 transition-custom"
                      >
                        Reforçar
                      </button>
                      <button
                        type="button"
                        onClick={() => setContributingId(null)}
                        className="px-2 py-2 text-xxs text-gray-400 hover:text-brand-dark transition-custom"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setContributingId(goal.id)}
                      className="flex items-center gap-1 text-xxs font-bold text-brand-dark hover:underline transition-custom"
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
