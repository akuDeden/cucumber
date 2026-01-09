# 📊 Data-Driven Testing Guide

## 🎯 Overview

Framework Chronicle automation sudah dirombak untuk menggunakan **Data-Driven Testing** dengan **Scenario Outline** approach untuk maintenance yang lebih mudah dan fleksibel.

## 🔄 Perubahan Utama

### Before (Old Approach)
```gherkin
# Harus buat scenario terpisah atau ubah .env untuk test data berbeda
Scenario: Search section A
  When I select section "<TEST_ADVANCE_SECTION_A>"
  Then I should see results

# Mau test section B? Buat scenario baru!
Scenario: Search section B
  When I select section "<TEST_ADVANCE_SECTION_B>"
  Then I should see results
```

### After (New Approach)
```gherkin
# Satu scenario, banyak kombinasi data!
Scenario Outline: Search by section - <section> <row>
  When I select section "<section>"
  And I select row "<row>"
  Then I should see results
  
  Examples:
    | section | row | description        |
    | A       | A   | Section A test     |
    | B       | A   | Section B test     |
    | C       | B   | Section C test     |
    | D       | C   | New test added!    |
```

## ✅ Benefits

| Benefit | Description |
|---------|-------------|
| 🚀 **Faster** | Tambah test case baru hanya dengan menambah row di Examples table |
| 🔧 **Easier Maintenance** | Update di satu tempat, tidak perlu ubah code atau environment variables |
| 📖 **Self-Documenting** | Examples table adalah dokumentasi lengkap test cases |
| ♻️ **No Duplication** | Tidak ada duplikasi scenario untuk data yang berbeda |
| 🎯 **Clear Intent** | Langsung terlihat kombinasi data yang di-test |

## 📝 Template & Examples

### 1. Single Parameter Test

```gherkin
Scenario Outline: Test with <value>
  When I enter value "<value>"
  Then I should see result
  
  Examples:
    | value  | description      |
    | 100    | Normal value     |
    | 500    | High value       |
    | 1000   | Maximum value    |
```

### 2. Multiple Parameters Test

```gherkin
Scenario Outline: Search by <section> <row> <number>
  When I select section "<section>"
  And I select row "<row>"
  And I enter number "<number>"
  Then I should see "<section> <row> <number>"
  
  Examples:
    | section | row | number | description           |
    | A       | A   | 1      | High capacity plot    |
    | B       | A   | 1      | Garden plot           |
    | C       | B   | 5      | Different section     |
```

### 3. Complex Combinations

```gherkin
Scenario Outline: Advanced filters - B:<burial> E:<entombment> C:<cremation>
  When I enter burial capacity "<burial>"
  And I enter entombment capacity "<entombment>"
  And I enter cremation capacity "<cremation>"
  Then I should see results
  
  Examples:
    | burial | entombment | cremation | description       |
    | 3      | 0          | 2         | High capacity     |
    | 1      | 1          | 1         | Standard capacity |
    | 2      | 0          | 0         | Burial only       |
```

## 🎨 Best Practices

### ✅ DO:

1. **Use descriptive scenario names with parameter placeholders**
   ```gherkin
   Scenario Outline: Login as <userType> - expect <result>
   ```

2. **Add description column untuk dokumentasi**
   ```gherkin
   Examples:
     | section | row | description           |
     | A       | A   | High capacity plot    |
   ```

3. **Group related test data**
   ```gherkin
   Examples:
     # Happy path tests
     | section | row | status |
     | A       | A   | Valid  |
     | B       | B   | Valid  |
     
     # Edge cases
     | Z       | Z   | Valid  |
   ```

4. **Use meaningful parameter names**
   ```gherkin
   # ✅ GOOD
   | burialCapacity | cremationCapacity |
   | 3              | 2                 |
   
   # ❌ BAD
   | b | c |
   | 3 | 2 |
   ```

### ❌ DON'T:

1. **Don't use cryptic parameter names**
   ```gherkin
   # ❌ BAD
   Examples:
     | a | b | c |
     | x | y | z |
   ```

2. **Don't forget descriptions**
   ```gherkin
   # ❌ BAD - Tidak ada context
   Examples:
     | section | row |
     | A       | A   |
   
   # ✅ GOOD
   Examples:
     | section | row | description    |
     | A       | A   | Standard test  |
   ```

## 🔄 Hybrid Approach (Recommended)

Gunakan kombinasi **Scenario Outline** untuk data bervariasi dan **Placeholder** untuk data konsisten:

```gherkin
Feature: Advanced Search

  Background:
    Given I am on login page
    When I enter email "<TEST_EMAIL>"        # ← Placeholder (konsisten)
    And I enter password "<TEST_PASSWORD>"   # ← Placeholder (konsisten)
    And I click login button
  
  @search
  Scenario Outline: Search by <section> <row>
    When I select section "<section>"        # ← From Examples (bervariasi)
    And I select row "<row>"                 # ← From Examples (bervariasi)
    Then I should see results
    
    Examples:
      | section | row | description    |
      | A       | A   | Section A test |
      | B       | B   | Section B test |
```

## 📋 Decision Matrix

| Scenario | Approach | Reason |
|----------|----------|--------|
| **Test 10 kombinasi section/row** | Scenario Outline | Data bervariasi, outline lebih efisien |
| **Login credentials di semua test** | Placeholder + test-data.ts | Data sama di semua scenario |
| **UI text validation** | Hardcode | Static data, tidak pernah berubah |
| **Price range testing (100, 500, 1000)** | Scenario Outline | Multiple values untuk satu scenario |
| **Organization name** | Placeholder + test-data.ts | Konsisten, mungkin perlu override per environment |

## 🚀 How to Add New Test Combinations

### Step 1: Identify Pattern
Apakah test ini akan dijalankan dengan data berbeda-beda? **→ Use Scenario Outline**

### Step 2: Extract Parameters
```gherkin
# Original scenario
When I select section "A"
And I select row "A"

# Converted to outline
When I select section "<section>"
And I select row "<row>"
```

### Step 3: Create Examples Table
```gherkin
Examples:
  | section | row | description        |
  | A       | A   | Original test      |
  | B       | B   | New combination    |
```

### Step 4: Add More Combinations
```gherkin
Examples:
  | section | row | description        |
  | A       | A   | Original test      |
  | B       | B   | New combination    |
  | C       | C   | Another test       | ← Just add a row!
  | D       | A   | Edge case          | ← Easy!
```

## 📊 Real-World Examples

### Example 1: Search by Section & Row
```gherkin
@advanced-search-plot @smoke @p0
Scenario Outline: Advanced search plot by Section, Row, and Number - <section> <row> <number>
    When I click Advanced search button
    And I select section "<section>" in advanced search
    And I select row "<row>" in advanced search
    And I enter plot number "<number>" in advanced search
    And I click Search button in advanced search
    Then I should see search results containing "<section> <row> <number>"

    Examples:
        | section | row | number | description           |
        | A       | A   | 1      | High capacity plot    |
        | B       | A   | 1      | Garden plot           |
        | C       | B   | 5      | Different section     |
```

### Example 2: Capacity Testing
```gherkin
@advance-search-capacity @p0
Scenario Outline: Advanced search plot by Capacity - B:<burial> E:<entombment> C:<cremation>
    When I click Advanced search button
    And I enter burial capacity "<burial>" in advanced search
    And I enter entombment capacity "<entombment>" in advanced search
    And I enter cremation capacity "<cremation>" in advanced search
    And I click Search button in advanced search
    Then I should see search results information

    Examples:
        | burial | entombment | cremation | description           |
        | 3      | 0          | 2         | High capacity         |
        | 1      | 1          | 1         | Standard capacity     |
        | 2      | 0          | 0         | Burial only           |
```

### Example 3: Price Range Testing
```gherkin
@advance-search-price @p0
Scenario Outline: Advanced search plot by Price - <price>
    When I click Advanced search button
    And I enter price "<price>" in advanced search
    And I click Search button in advanced search
    Then I should see search results information

    Examples:
        | price | description           |
        | 500   | Low price range       |
        | 1000  | Medium price range    |
        | 5000  | High price range      |
```

## 🎯 Summary

| Old Approach | New Approach | Winner |
|--------------|--------------|--------|
| 1 scenario = 1 data combination | 1 scenario = N data combinations | ✅ New |
| Tambah test = tambah scenario | Tambah test = tambah row | ✅ New |
| Data tersebar di .env & code | Data jelas di Examples table | ✅ New |
| Susah tracking kombinasi test | Self-documenting | ✅ New |
| Duplikasi scenario | No duplication | ✅ New |

## 💡 Tips

1. **Start Simple**: Mulai dengan 2-3 rows di Examples, tambah gradually
2. **Keep Readable**: Align columns di Examples table agar mudah dibaca
3. **Add Comments**: Gunakan comment untuk group related test data
4. **Description Column**: Selalu tambahkan description column untuk dokumentasi
5. **Meaningful Names**: Gunakan parameter names yang jelas dan descriptive

---

**Updated:** January 9, 2026  
**Framework:** Chronicle Automation  
**Approach:** Data-Driven Testing with Scenario Outline
