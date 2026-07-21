import { calculateInvoiceTotals } from '@erp/types';

describe('Business Logic - Invoice Calculations', () => {
  it('should correctly calculate subtotal, tax, and total', () => {
    const params = {
      items: [
        { quantity: 2, price: 100 }, // 200
        { quantity: 1, price: 50 },  // 50
      ],
      taxRate: 10, // 10% of 250 = 25
      discount: 20, // 250 + 25 - 20 = 255
    };

    const result = calculateInvoiceTotals(params);

    expect(result.subTotal).toBe(250);
    expect(result.taxTotal).toBe(25);
    expect(result.total).toBe(255);
  });

  it('should handle zero tax and zero discount', () => {
    const params = {
      items: [
        { quantity: 5, price: 20 },
      ],
      taxRate: 0,
      discount: 0,
    };

    const result = calculateInvoiceTotals(params);

    expect(result.subTotal).toBe(100);
    expect(result.taxTotal).toBe(0);
    expect(result.total).toBe(100);
  });

  it('should round to 2 decimal places', () => {
    const params = {
      items: [
        { quantity: 1, price: 33.333 },
      ],
      taxRate: 8.5,
      discount: 0,
    };

    const result = calculateInvoiceTotals(params);

    expect(result.subTotal).toBe(33.33);
    expect(result.taxTotal).toBe(2.83);
    expect(result.total).toBe(36.17);
  });
});
