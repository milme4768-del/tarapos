import { create } from 'zustand';

const generateRequestId = () =>
  'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

const CART_STORAGE_KEY = 'taraaang_active_cart';

const loadSavedCart = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        items: parsed.items || [],
        customer: parsed.customer || { name: '', mobile: '' },
        paymentMethod: parsed.paymentMethod || 'cash',
        discountType: parsed.discountType || 'flat',
        discountValue: parsed.discountValue || parsed.discount || 0,
        notes: parsed.notes || '',
        clientRequestId: parsed.clientRequestId || generateRequestId(),
      };
    }
  } catch (err) {
    console.error('Failed to load cart from storage:', err);
  }
  return {
    items: [],
    customer: { name: '', mobile: '' },
    paymentMethod: 'cash',
    discountType: 'flat',
    discountValue: 0,
    notes: '',
    clientRequestId: generateRequestId(),
  };
};

const initialCart = loadSavedCart();

export const useCartStore = create((set, get) => ({
  items: initialCart.items,
  customer: initialCart.customer,
  paymentMethod: initialCart.paymentMethod,
  discountType: initialCart.discountType,
  discountValue: initialCart.discountValue,
  notes: initialCart.notes,
  clientRequestId: initialCart.clientRequestId,
  isOnline: navigator.onLine,

  setOnlineStatus: (status) => set({ isOnline: status }),

  // Persist current state helper
  persist: () => {
    const state = get();
    const dataToSave = {
      items: state.items,
      customer: state.customer,
      paymentMethod: state.paymentMethod,
      discountType: state.discountType,
      discountValue: state.discountValue,
      notes: state.notes,
      clientRequestId: state.clientRequestId,
    };
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  },

  // Add Item to cart with variant
  addItem: (product, variant, qty = 1) => {
    const items = [...get().items];
    const existingIndex = items.findIndex((i) => i.variantId === variant._id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += qty;
      items[existingIndex].lineTotal = Number(
        (items[existingIndex].quantity * items[existingIndex].price).toFixed(2)
      );
    } else {
      items.push({
        productId: product._id,
        productName: product.name,
        variantId: variant._id,
        variantName: variant.name,
        unit: variant.unit || 'plate',
        quantity: qty,
        price: variant.price,
        lineTotal: Number((qty * variant.price).toFixed(2)),
      });
    }

    set({ items });
    get().persist();
  },

  // Add Custom / Unlisted Item
  addCustomItem: ({ name, price, quantity = 1, unit = 'unit' }) => {
    const items = [...get().items];
    const customId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const unitPrice = Math.max(0, parseFloat(price) || 0);
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    items.push({
      productId: null,
      productName: name.trim(),
      variantId: customId,
      variantName: 'Custom',
      unit: unit.trim() || 'unit',
      quantity: qty,
      price: unitPrice,
      lineTotal: Number((qty * unitPrice).toFixed(2)),
      isCustom: true,
    });

    set({ items });
    get().persist();
  },

  // Update item quantity
  updateQuantity: (variantId, delta) => {
    let items = [...get().items];
    const index = items.findIndex((i) => i.variantId === variantId);

    if (index > -1) {
      const newQty = items[index].quantity + delta;
      if (newQty <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = newQty;
        items[index].lineTotal = Number((newQty * items[index].price).toFixed(2));
      }
      set({ items });
      get().persist();
    }
  },

  // Remove single item completely
  removeItem: (variantId) => {
    const items = get().items.filter((i) => i.variantId !== variantId);
    set({ items });
    get().persist();
  },

  // Update customer info
  setCustomer: (customerData) => {
    const customer = { ...get().customer, ...customerData };
    set({ customer });
    get().persist();
  },

  // Update payment method
  setPaymentMethod: (paymentMethod) => {
    set({ paymentMethod });
    get().persist();
  },

  // Update discount (supports flat or percentage)
  setDiscount: (value, type = null) => {
    const val = Math.max(0, Number(value) || 0);
    const dType = type || get().discountType;
    set({ discountValue: val, discountType: dType });
    get().persist();
  },

  setDiscountType: (type) => {
    set({ discountType: type });
    get().persist();
  },

  // Update notes
  setNotes: (notes) => {
    set({ notes });
    get().persist();
  },

  // Clear cart and generate a brand-new clientRequestId
  clearCart: () => {
    const newRequestId = generateRequestId();
    set({
      items: [],
      customer: { name: '', mobile: '' },
      paymentMethod: 'cash',
      discountType: 'flat',
      discountValue: 0,
      notes: '',
      clientRequestId: newRequestId,
    });
    localStorage.removeItem(CART_STORAGE_KEY);
  },

  // Subtotal helper
  getSubtotal: () => {
    return Number(
      get()
        .items.reduce((sum, item) => sum + item.quantity * item.price, 0)
        .toFixed(2)
    );
  },

  // Calculate actual discount in rupees
  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const { discountType, discountValue } = get();

    if (discountType === 'percentage') {
      const pct = Math.max(0, Math.min(100, Number(discountValue) || 0));
      return Number(((subtotal * pct) / 100).toFixed(2));
    }
    // Flat discount cannot exceed subtotal
    return Number(Math.min(subtotal, Math.max(0, Number(discountValue) || 0)).toFixed(2));
  },

  // Tax calculation helper (defaults to 0 if taxPercentage is 0)
  getTaxAmount: (taxPercentage = 0) => {
    const subtotal = get().getSubtotal();
    const discountAmt = get().getDiscountAmount();
    const taxable = Math.max(0, subtotal - discountAmt);
    const taxRate = Number(taxPercentage) || 0;
    return Number(((taxable * taxRate) / 100).toFixed(2));
  },

  // Grand total helper
  getGrandTotal: (taxPercentage = 0) => {
    const subtotal = get().getSubtotal();
    const discountAmt = get().getDiscountAmount();
    const taxable = Math.max(0, subtotal - discountAmt);
    const taxRate = Number(taxPercentage) || 0;
    const tax = Number(((taxable * taxRate) / 100).toFixed(2));
    return Number((taxable + tax).toFixed(2));
  },

  // Total items count
  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
