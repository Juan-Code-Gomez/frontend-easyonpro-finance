import { create } from 'zustand';

const useTransactionStore = create((set, get) => ({
  transactions: [],
  summary: null,
  categories: [],
  loading: false,

  setSummary: (summary) => set({ summary }),
  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),
  setLoading: (loading) => set({ loading }),

  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),

  removeTransaction: (id) =>
    set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

  updateTransaction: (updated) =>
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === updated.id ? updated : t)),
    })),
}));

export default useTransactionStore;
