# Sales Flow Fix Summary

## Tanggal: 21 Januari 2026

## Masalah yang Diperbaiki

Berdasarkan gambar yang dikirimkan user, flow untuk menambah item pada Sales Form perlu diperbaiki. Ketika menambah item, ada **5 field yang harus diisi**:

1. **Item** - Search dropdown
2. **Related Plot** - Search dropdown  
3. **Qty** - Input field
4. **Price** - Input field
5. **Discount (amt)** - Input field

### Data Test yang Diinginkan (sesuai gambar)

| Item   | Related Plot | Qty | Price     | Discount | Total      |
|--------|--------------|-----|-----------|----------|------------|
| item a | B F 1        | 1   | $1,313.56 | $0.00    | $1,313.56  |
| item b | B F 2        | 1   | $178.35   | $0.00    | $178.35    |
| item c | B F 3        | 2   | $32.95    | $0.00    | $65.90     |
| item d | B F 4        | 1   | $105.08   | $0.00    | $105.08    |
| item e | B F 5        | 1   | $101.21   | $0.00    | $101.21    |

**Summary:**
- Subtotal: $1,764.10
- Discount: $0.00
- VAT 10%: $176.41
- **Total: $1,940.51**

---

## Perubahan yang Dilakukan

### 1. Update Test Data ([src/data/test-data.ts](../src/data/test-data.ts))

**Sebelum:**
- Items menggunakan plot **A A 3** dan **A A 4**
- Item terakhir adalah **"item f"**

**Sesudah:**
- Items menggunakan plot **B F 1, B F 2, B F 3, B F 4, B F 5** (sesuai gambar)
- Item terakhir diubah ke **"item e"** (karena di staging environment hanya tersedia item a-e)

```typescript
items: [
  { description: 'item a', related_plot: 'B F 1', quantity: 1, price: 1313.56, discount: 0 },
  { description: 'item b', related_plot: 'B F 2', quantity: 1, price: 178.35, discount: 0 },
  { description: 'item c', related_plot: 'B F 3', quantity: 2, price: 32.95, discount: 0 },
  { description: 'item d', related_plot: 'B F 4', quantity: 1, price: 105.08, discount: 0 },
  { description: 'item e', related_plot: 'B F 5', quantity: 1, price: 101.21, discount: 0 }
]
```

### 2. Update Feature File ([src/features/p0/sales.authenticated.feature](../src/features/p0/sales.authenticated.feature))

**Sebelum:**
```gherkin
| description | related_plot | quantity | price    | discount |
| item a      | A A 3        | 1        | 1313.56  | 0        |
| item b      | A A 4        | 1        | 178.35   | 0        |
...
| item f      | A A 3        | 1        | 101.21   | 0        |
```

**Sesudah:**
```gherkin
| description | related_plot | quantity | price    | discount |
| item a      | B F 1        | 1        | 1313.56  | 0        |
| item b      | B F 2        | 1        | 178.35   | 0        |
| item c      | B F 3        | 2        | 32.95    | 0        |
| item d      | B F 4        | 1        | 105.08   | 0        |
| item e      | B F 5        | 1        | 101.21   | 0        |
```

### 3. Perbaiki Implementation ([src/pages/p0/SalesPage.ts](../src/pages/p0/SalesPage.ts))

#### Method `fillItemDetails()` - Diperbaiki untuk handle search dropdown

**Perubahan Utama:**

1. **Item Selection (Search Dropdown)**
   - **Sebelum:** Klik dropdown → langsung pilih dari list
   - **Sesudah:** Klik dropdown → ketik di search textbox → pilih dari hasil search
   
   ```typescript
   // Click to open dropdown
   await itemCombobox.click();
   
   // Type in search textbox
   const itemSearchInput = this.page.locator('input[type="text"]').first();
   await itemSearchInput.fill(item.description);
   
   // Select from filtered results
   await itemOption.click();
   ```

2. **Plot Selection (Search Dropdown)**
   - **Sebelum:** Menggunakan `keyboard.type()` langsung
   - **Sesudah:** Mencari search textbox spesifik → fill() → pilih hasil yang **NOT Occupied**
   
   ```typescript
   // Click plot dropdown
   await this.page.locator(salesSelectors.allItemPlots).nth(index).click();
   
   // Fill search textbox
   const plotSearchInput = this.page.locator('input[placeholder*="typing"]').last();
   await plotSearchInput.fill(item.related_plot);
   
   // Find available plot (not occupied)
   const targetIndex = plotOptions.findIndex(opt => {
     const startsWithPlot = trimmed.startsWith(item.related_plot + ' ');
     const notOccupied = !trimmed.includes('Occupied');
     return startsWithPlot && notOccupied;
   });
   ```

3. **Quantity, Price, Discount (Input Fields)**
   - Tetap menggunakan `.fill()` method
   - **Perbaikan:** Discount field sekarang di-handle dengan error handling yang lebih robust
   
   ```typescript
   // Try main selector
   await this.page.locator(salesSelectors.allItemDiscounts).nth(index).fill(discount);
   
   // Fallback: Try alternative selector if main selector fails
   const itemRow = this.page.locator('[data-testid="sales-calculator-div-description-long"]').nth(index);
   const inputs = itemRow.locator('input[type="text"]');
   await inputs.nth(2).fill(discount); // inputs[2] = discount field
   ```

---

## Catatan Penting

### 1. Item Availability
- Di staging environment, hanya tersedia **item a, b, c, d, e**
- Tidak ada **"item f"**
- Jika butuh item f, perlu ditambahkan di backend

### 2. Plot Availability
- Plot **B F 1 sampai B F 5** di staging environment berstatus **(Occupied)**
- Test akan memilih **"none"** jika plot yang diminta sudah Occupied
- Untuk test yang sukses, pastikan plot B F 1-5 dalam status **Available** atau **(Reserved)**

### 3. Login Credentials untuk Testing
```
Email: faris+astanaorg@chronicle.rip
Password: 12345
```

---

## Cara Testing Manual dengan MCP Playwright

```bash
# Login dulu
URL: https://staging.chronicle.rip
Email: faris+astanaorg@chronicle.rip
Password: 12345

# Navigate ke Sales
1. Klik menu "Sales"
2. Klik "CREATE SALE"

# Fill form dengan data sesuai gambar
1. Reference: testNew 001
2. Issue Date: 21/01/2026
3. Due Date: 22/01/2026
4. Owner: (pilih yang tersedia)
5. Note: this is note test
6. Add Purchaser: Jon Doe (jondoe@test.com)

# Add Items (5 items)
Item 1:
- Item: item a (search dropdown)
- Plot: B F 1 (search dropdown)
- Qty: 1
- Price: 1313.56
- Discount: 0

Item 2:
- Item: item b
- Plot: B F 2
- Qty: 1
- Price: 178.35
- Discount: 0

... (dan seterusnya sesuai tabel di atas)

# Verify Summary
- Subtotal: $1,764.10
- Discount: $0.00
- VAT: $176.41
- Total: $1,940.51
```

---

## File yang Diubah

1. [src/data/test-data.ts](../src/data/test-data.ts)
   - Update `SALES_DATA.create.items` untuk menggunakan plot B F 1-5
   - Update item f → item e

2. [src/features/p0/sales.authenticated.feature](../src/features/p0/sales.authenticated.feature)
   - Update data table untuk menggunakan plot B F 1-5
   - Update item f → item e

3. [src/pages/p0/SalesPage.ts](../src/pages/p0/SalesPage.ts)
   - Perbaiki method `fillItemDetails()` untuk handle search dropdown
   - Tambah error handling untuk discount field
   - Tambah logging yang lebih detail

---

## Next Steps

1. **Pastikan Plot Available**
   - Cek status plot B F 1-5 di staging
   - Set ke status Available atau Reserved (bukan Occupied)

2. **Tambah Item f (Optional)**
   - Jika memang perlu item f sesuai requirement
   - Bisa ditambahkan di backend staging

3. **Run Test**
   ```bash
   npm test -- --tags "@sales and @create-sales"
   ```

4. **Verifikasi**
   - Test harus berhasil create sale
   - Summary calculation harus match: **Total $1,940.51**

---

## Troubleshooting

### Issue: Plot shows "Occupied"
**Solution:** Plot perlu di-release dulu atau gunakan plot lain yang Available

### Issue: Item tidak ketemu
**Solution:** Pastikan item sudah ada di backend. Cek dengan buka dropdown manually.

### Issue: Discount field timeout
**Solution:** Code sudah ada fallback, tapi pastikan row sudah fully loaded sebelum fill discount.

---

*Dokumentasi dibuat: 21 Januari 2026*
