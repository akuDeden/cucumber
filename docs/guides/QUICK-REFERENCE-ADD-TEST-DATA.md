# 🚀 Quick Reference: Menambah Test Data Baru

## ⚡ TL;DR

### Mau test dengan kombinasi data berbeda?
**→ Tinggal tambah row di Examples table!**

```gherkin
Examples:
  | section | row | description    |
  | A       | A   | Existing test  |
  | E       | F   | NEW TEST!      | ← Add this line
```

## 📋 Cheat Sheet

### 1️⃣ Tambah Kombinasi Test Baru

**Location:** `src/features/p0/advanceSearch.authenticated.feature`

```gherkin
@advanced-search-plot
Scenario Outline: Search by <section> <row> <number>
    When I select section "<section>"
    And I select row "<row>"
    And I enter plot number "<number>"
    Then I should see results
    
    Examples:
        | section | row | number | description           |
        | A       | A   | 1      | Existing              |
        | X       | Y   | 99     | NEW - just add row!   | ← ADD HERE
```

### 2️⃣ Test dengan Multiple Parameters

```gherkin
Examples:
    | section | row | price | capacity | description           |
    | A       | A   | 500   | 3        | Test case 1           |
    | B       | B   | 1000  | 5        | NEW TEST CASE         | ← ADD HERE
```

### 3️⃣ Group Test Cases

```gherkin
Examples:
    # Happy path tests
    | section | row | status |
    | A       | A   | Valid  |
    | B       | B   | Valid  |
    
    # Edge cases - NEW
    | Z       | Z   | Valid  | ← ADD NEW GROUP
```

## 🎯 Common Use Cases

### Use Case 1: Test Section Baru (E, F, G)
```gherkin
Examples:
    | section | row |
    | A       | A   |  # Existing
    | E       | A   |  # NEW
    | F       | B   |  # NEW
    | G       | C   |  # NEW
```

### Use Case 2: Test Price Range
```gherkin
Examples:
    | price | description       |
    | 100   | Minimum price     |
    | 500   | Low price         |
    | 1000  | Medium price      |
    | 5000  | High price        | # NEW
    | 10000 | Maximum price     | # NEW
```

### Use Case 3: Test Capacity Combinations
```gherkin
Examples:
    | burial | entombment | cremation | description       |
    | 3      | 0          | 2         | Existing          |
    | 5      | 1          | 3         | High capacity     | # NEW
    | 0      | 0          | 1         | Cremation only    | # NEW
```

## ⚙️ No Code Changes Needed!

✅ **Tidak perlu ubah:**
- ❌ Step definitions (.steps.ts)
- ❌ Page objects (.ts)
- ❌ Environment variables (.env)
- ❌ Test data file (test-data.ts)

✅ **Hanya perlu ubah:**
- ✅ Examples table di feature file

## 🏃 Run Tests

```bash
# Run all scenarios (akan run semua rows di Examples)
npm run test:headless -- --tags "@advanced-search-plot"

# Cucumber akan otomatis generate multiple test runs!
# 3 rows di Examples = 3 test scenarios executed
```

## 💡 Pro Tips

### Tip 1: Use Description Column
```gherkin
Examples:
    | section | row | description                |
    | A       | A   | High capacity plot         |
    | B       | A   | Garden plot type           |
    | C       | B   | Edge case - far section    |  ← Descriptive!
```

### Tip 2: Comment Your Groups
```gherkin
Examples:
    # Standard plots (A, B sections)
    | section | row |
    | A       | A   |
    | B       | B   |
    
    # Edge cases (far sections)
    | Y       | Z   |  ← Clear grouping
```

### Tip 3: Align Columns for Readability
```gherkin
# ✅ GOOD - Easy to read
Examples:
    | section | row | price | description           |
    | A       | A   | 500   | Low price             |
    | B       | B   | 1000  | Medium price          |

# ❌ BAD - Hard to read
Examples:
    | section | row | price | description |
    | A | A | 500 | Low price |
    | B | B | 1000 | Medium price |
```

## 📝 Copy-Paste Templates

### Template 1: Single Parameter
```gherkin
Scenario Outline: Test <value>
    When I use "<value>"
    Then I should see result
    
    Examples:
        | value | description |
        | V1    | Test 1      |
        | V2    | Test 2      |
```

### Template 2: Two Parameters
```gherkin
Scenario Outline: Test <param1> <param2>
    When I use "<param1>" and "<param2>"
    Then I should see result
    
    Examples:
        | param1 | param2 | description |
        | A      | 1      | Test 1      |
        | B      | 2      | Test 2      |
```

### Template 3: Complex
```gherkin
Scenario Outline: Test <a> <b> <c>
    When I use "<a>"
    And I use "<b>"
    And I use "<c>"
    Then I should see result
    
    Examples:
        | a | b | c | description |
        | 1 | 2 | 3 | Test 1      |
        | 4 | 5 | 6 | Test 2      |
```

## ❓ FAQ

### Q: Berapa banyak rows yang bisa ditambah?
**A:** Tidak ada limit! Tapi pertimbangkan execution time. 100 rows = 100 test runs.

### Q: Bisa dynamic data tidak (random, timestamp)?
**A:** Tidak di Examples table. Kalau perlu dynamic, pakai step definition dengan code.

### Q: Harus restart test setelah ubah Examples?
**A:** Ya, karena Cucumber baca feature file saat runtime start.

### Q: Bisa conditional execution tidak?
**A:** Use tags! Tambahkan tag per row (tapi jarang dipakai).

---

## 🎉 Summary

| Task | Action |
|------|--------|
| **Tambah test data** | Tambah row di Examples table |
| **Ubah test data** | Edit values di Examples table |
| **Hapus test data** | Hapus row di Examples table |
| **Group test data** | Add comment di Examples table |
| **Document test** | Add description column |

**EASY! NO CODE CHANGES NEEDED!** 🚀

---

**Last Updated:** January 9, 2026
