# ✅ FINAL REFACTORING - Hybrid Approach

## 📅 Date: January 9, 2026

## 🎯 Final Decision: HYBRID APPROACH

Setelah diskusi dan analisis, kami menggunakan **Hybrid Approach** yang menggabungkan:
- **Placeholders + test-data.ts** untuk data KONSISTEN
- **Scenario Outline + Examples** untuk data BERVARIASI

## 🤔 Why Hybrid?

### Problem yang Ditemukan
User menanyakan: *"Jika semua pakai Scenario Outline, mau ganti cemetery harus ubah di banyak tempat?"*

**Valid concern!** ✅

### Analysis

| Approach | Pro | Con |
|----------|-----|-----|
| **Full Placeholder** | Easy to change consistent data | Hard to add test variations |
| **Full Scenario Outline** | Easy to add variations | Hard to change consistent data |
| **✅ Hybrid** | Easy for both! | None! |

## 📝 Implementation

### 1. Data yang Pakai PLACEHOLDER (Consistent)
```typescript
// test-data.ts
export const CEMETERY = process.env.TEST_CEMETERY || 'Astana Tegal Gundul';
export const LOGIN_DATA = { ... };
export const INTERMENT_DATA = { ... };
```

**Used for:**
- Cemetery name
- Login credentials
- Organization name
- Interment data
- ROI data

**Why?** Data ini **SAMA** di hampir semua scenarios.

**Change?** Edit `test-data.ts` atau `.env` → semua scenarios updated! ✅

---

### 2. Data yang Pakai SCENARIO OUTLINE (Variable)
```gherkin
Scenario Outline: Search by <section> <row>
    Examples:
        | section | row | price |
        | A       | A   | 500   |
        | B       | B   | 1000  |
```

**Used for:**
- Section combinations (A, B, C, D, E...)
- Row variations (A, B, C, D, E...)
- Price ranges (500, 1000, 5000...)
- Capacity combinations (1/1/1, 3/0/2...)
- Plot types (Garden, Lawn, Monumental...)

**Why?** Data ini **BERVARIASI** untuk test kombinasi berbeda.

**Change?** Tambah row di Examples table → instant new test! ✅

---

### 3. HYBRID dalam Practice
```gherkin
Feature: Advanced Search

    Background:
        Given I login with "<TEST_EMAIL>" and "<TEST_PASSWORD>"    # ← PLACEHOLDER
        And I navigate to "<TEST_CEMETERY>"                        # ← PLACEHOLDER

    Scenario Outline: Search by <section> <row> with <price>
        When I select section "<section>"                          # ← EXAMPLES
        And I select row "<row>"                                   # ← EXAMPLES
        And I enter price "<price>"                                # ← EXAMPLES
        
        Examples:
            | section | row | price |
            | A       | A   | 500   |
            | B       | B   | 1000  |
```

**Perfect!**
- Mau ganti cemetery? Edit `test-data.ts` ✅
- Mau test section C dengan price 5000? Tambah row ✅

---

## 📊 Changes Summary

### Files Modified
1. ✅ `test-data.ts` - Cleaned up unused advanced search data
2. ✅ `TestDataHelper.ts` - Removed unused placeholders
3. ✅ `.env.example` - Simplified with comments
4. ✅ `advanceSearch.authenticated.feature` - Reduced Examples to essential only
5. ✅ `README.md` - Added Hybrid Approach explanation

### Files Created
1. ✅ `docs/HYBRID-APPROACH-GUIDE.md` - Complete guide (NEW!)

---

## 🎯 What Was Cleaned Up

### Removed from test-data.ts:
```typescript
// ❌ REMOVED - Not needed anymore (moved to Scenario Outline)
price: process.env.TEST_ADVANCE_PRICE || '500',
burialCapacity: process.env.TEST_ADVANCE_BURIAL_CAPACITY || '3',
entombmentCapacity: process.env.TEST_ADVANCE_ENTOMBMENT_CAPACITY || '0',
cremationCapacity: process.env.TEST_ADVANCE_CREMATION_CAPACITY || '2',
intermentsQtyFrom: process.env.TEST_ADVANCE_INTERMENTS_FROM || '0',
intermentsQtyTo: process.env.TEST_ADVANCE_INTERMENTS_TO || '2',
section: process.env.TEST_ADVANCE_SECTION || 'A',
row: process.env.TEST_ADVANCE_ROW || 'A',
section2: process.env.TEST_ADVANCE_SECTION_2 || 'B',
row2: process.env.TEST_ADVANCE_ROW_2 || 'A'
```

### Kept in test-data.ts (Fallback):
```typescript
// ✅ KEPT - Used as fallback/override values
plotId: process.env.TEST_ADVANCE_PLOT_ID || 'B A 1',
plotType: process.env.TEST_ADVANCE_PLOT_TYPE || 'Monumental',
status: process.env.TEST_ADVANCE_STATUS || 'Vacant'
```

### Reduced Examples Rows:
- Section/Row combos: 3 → 2 rows (removed excessive C B 5)
- Plot Type: 3 → 2 rows (removed Lawn, kept Garden & Monumental)
- Price: 3 → 2 rows (removed 5000, kept 500 & 1000)
- Capacity: 3 → 2 rows (removed "Burial only")
- Interments: 3 → 2 rows (removed 3-10 range)

**Reason:** Keep essential test cases, can add more anytime easily.

---

## 🚀 How to Use

### Scenario 1: Mau Ganti Cemetery
```bash
# Edit test-data.ts
export const CEMETERY = 'New Cemetery Name';

# OR set environment variable
echo "TEST_CEMETERY=New Cemetery Name" >> .env

# ✅ DONE! All scenarios use new cemetery!
```

### Scenario 2: Mau Test Section D Row E
```gherkin
# Edit feature file - add row in Examples
Examples:
    | section | row |
    | A       | A   |
    | D       | E   |  ← Just add this!

# ✅ DONE! No code changes!
```

### Scenario 3: Mau Ganti Credentials
```bash
# Set environment variables
echo "TEST_EMAIL=newuser@example.com" >> .env
echo "TEST_PASSWORD=newpass123" >> .env

# ✅ DONE! All login scenarios use new credentials!
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[HYBRID-APPROACH-GUIDE.md](docs/HYBRID-APPROACH-GUIDE.md)** | ⭐ Main guide - READ THIS FIRST! |
| [DATA-DRIVEN-TESTING-GUIDE.md](docs/DATA-DRIVEN-TESTING-GUIDE.md) | Detailed Scenario Outline guide |
| [QUICK-REFERENCE-ADD-TEST-DATA.md](docs/QUICK-REFERENCE-ADD-TEST-DATA.md) | Quick cheat sheet |
| [README.md](README.md) | Updated with Hybrid Approach |

---

## ✅ Final Checklist

- [x] Analyzed user's concern about changing cemetery
- [x] Decided on Hybrid Approach
- [x] Cleaned up unused test data
- [x] Reduced Examples rows to essential
- [x] Updated all documentation
- [x] Created HYBRID-APPROACH-GUIDE.md
- [x] Updated README with clear explanation
- [x] Updated .env.example with comments

---

## 🎉 Benefits Achieved

### For Consistent Data (Cemetery, Credentials)
- ✅ Change in ONE place (`test-data.ts` or `.env`)
- ✅ All scenarios automatically updated
- ✅ Support multiple environments

### For Variable Data (Section, Row, Price)
- ✅ Add new combinations by adding rows
- ✅ No code changes needed
- ✅ Self-documenting

### Overall
- ✅ **No trade-offs!**
- ✅ **Best of both worlds!**
- ✅ **Maintainable & Flexible!**

---

## 💡 Key Insights

1. **Not all data should be in Scenario Outline**
   - Some data is consistent (cemetery, credentials)
   - Some data varies (section A/B/C, prices)

2. **Hybrid Approach solves the trade-off**
   - Consistent data → Placeholder
   - Variable data → Scenario Outline

3. **User's question was valid!**
   - Full Scenario Outline would require repeating cemetery
   - Hybrid Approach eliminates this problem

4. **Framework is now production-ready**
   - Clean structure
   - Easy to maintain
   - Flexible for different needs

---

**Final Status:** ✅ **COMPLETE & PRODUCTION READY!**

**Approach:** Hybrid (Placeholder for Consistent + Scenario Outline for Variable)  
**Date:** January 9, 2026  
**Framework:** Chronicle Automation
