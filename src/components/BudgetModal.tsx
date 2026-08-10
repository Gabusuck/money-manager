import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, Shield, PiggyBank, TrendingUp, RefreshCw } from 'lucide-react';
import type { BudgetAllocation } from '../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetAllocation;
  onSaveBudget: (budget: BudgetAllocation) => void;
  onClearAllData: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budget,
  onSaveBudget,
  onClearAllData,
}) => {
  const [salary, setSalary] = useState(budget.salary);
  const [fixos, setFixos] = useState(budget.fixos);
  const [poupanca, setPoupanca] = useState(budget.poupanca);
  const [investimento, setInvestimento] = useState(budget.investimento);
  const [plafondReal, setPlafondReal] = useState(budget.plafondReal);

  useEffect(() => {
    if (isOpen) {
      setSalary(budget.salary);
      setFixos(budget.fixos);
      setPoupanca(budget.poupanca);
      setInvestimento(budget.investimento);
      setPlafondReal(budget.plafondReal);
    }
  }, [isOpen, budget]);

  if (!isOpen) return null;

  const totalAllocated = fixos + poupanca + investimento + plafondReal;
  const difference = salary - totalAllocated;
  const isBalanced = difference === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (salary <= 0 || fixos < 0 || poupanca < 0 || investimento < 0 || plafondReal < 0) {
      alert('Por favor, insere valores válidos superiores ou iguais a 0.');
      return;
    }
    onSaveBudget({
      salary,
      fixos,
      poupanca,
      investimento,
      plafondReal,
    });
    onClose();
  };

  const handleAutoBalance = () => {
    // Ajustar o Plafond Real para equilibrar a diferença
    const newPlafond = Math.max(0, salary - (fixos + poupanca + investimento));
    setPlafondReal(newPlafond);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl border-t border-brand-border p-6 space-y-5 safe-pb shadow-xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-brand-dark" /> Ajustar Orçamento Referência
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-brand-gray flex items-center justify-center border border-brand-border text-gray-500 hover:text-brand-dark transition-custom"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Salário Líquido Referência */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Salário Líquido (In)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">€</span>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark font-semibold"
              />
            </div>
          </div>

          <div className="border-t border-brand-border pt-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Alocação por Categorias</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Fixos */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cat-red" /> Fixos / Contas
                </label>
                <input
                  type="number"
                  value={fixos}
                  onChange={(e) => setFixos(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark"
                />
              </div>

              {/* Poupança */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                  <PiggyBank className="w-3 h-3 text-cat-purple" /> Poupança
                </label>
                <input
                  type="number"
                  value={poupanca}
                  onChange={(e) => setPoupanca(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark"
                />
              </div>

              {/* Investimento */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-cat-green" /> Investimento
                </label>
                <input
                  type="number"
                  value={investimento}
                  onChange={(e) => setInvestimento(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark"
                />
              </div>

              {/* Plafond Real */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-cat-orange" /> Plafond Real
                </label>
                <input
                  type="number"
                  value={plafondReal}
                  onChange={(e) => setPlafondReal(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Estado da Alocação */}
          <div className="p-3.5 rounded-xl text-xxs flex justify-between items-center bg-brand-gray border border-brand-border">
            <div>
              <p className="font-semibold text-brand-dark">Resumo de Alocação:</p>
              <p className="text-gray-500 mt-0.5">
                Total Alocado: {totalAllocated}€ de {salary}€
              </p>
            </div>
            <div>
              {isBalanced ? (
                <span className="font-bold text-cat-green">100% Equilibrado</span>
              ) : (
                <div className="text-right">
                  <span className={`font-bold ${difference > 0 ? 'text-cat-yellow' : 'text-cat-red'}`}>
                    {difference > 0 ? `Sobra: +${difference}€` : `Diferença: ${difference}€`}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="flex items-center gap-0.5 text-[10px] font-semibold text-brand-dark hover:underline mt-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Ajustar Plafond
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submeter */}
          <button
            type="submit"
            className="w-full py-3 bg-brand-dark text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-98 transition-custom"
          >
            Guardar Configuração
          </button>

          {/* Resetar Dados */}
          <button
            type="button"
            onClick={onClearAllData}
            className="w-full py-2.5 text-xxs font-bold text-cat-red hover:bg-red-50 border border-red-200 rounded-xl transition-custom"
          >
            Limpar Todos os Dados e Recomeçar do Zero
          </button>
        </form>
      </div>
    </div>
  );
};
