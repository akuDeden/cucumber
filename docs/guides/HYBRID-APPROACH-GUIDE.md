# 🎯 Hybrid Approach: Best of Both Worlds

## 📋 Overview

Framework Chronicle menggunakan **Hybrid Approach** yang menggabungkan:
- **Placeholders + test-data.ts** untuk data yang **KONSISTEN** (cemetery, credentials)
- **Scenario Outline + Examples** untuk data yang **BERVARIASI** (section A/B/C, row, price)

## 🤔 Why Hybrid Approach?

### ❌ Problem dengan Full Scenario Outline
```gherkin
# MASALAH: Cemetery harus di-repeat di setiap row!
Examples:
    | cemetery              | section | row | price |
    | Astana Tegal Gundul  | A       | A   | 500   |
    | Astana Tegal Gundul  | B       | B   | 1000  |
    | Astana Tegal Gundul  | C       | C   | 5000  |
    # ↑ Cemetery sama, tapi harus repeat!

# Mau ganti cemetery? Harus ubah di SEMUA ROWS! 😰
```

### ❌ Problem dengan Full Placeholder
```gherkin
# MASALAH: Harus buat banyak scenarios atau ubah .env
Scenario: Test section A
    When I select section "<TEST_SECTION_A>"

Scenario: Test section B
    When I select section "<TEST_SECTION_B>"

# Mau test 10 sections? Buat 10 scenarios! 😰
```

### ✅ Solution: Hybrid Approach
```gherkin
Background:
    Given I am on login page
    When I enter email "<TEST_EMAIL>"          # ← PLACEHOLDER (konsisten)
    And I enter password "<TEST_PASSWORD>"     # ← PLACEHOLDER (konsisten)
    And I navigate to "<TEST_CEMETERY>"        # ← PLACEHOLDER (konsisten)

Scenario Outline: Search by <section> <row>
    When I select section "<section>"          # ← EXAMPLES (bervariasi)
    And I select row "<row>"                   # ← EXAMPLES (bervariasi)
    Then I should see results
    
    Examples:
        | section | row |
        | A       | A   |
        | B       | B   |
        | C       | C   |  # ← Easy to add!

# Mau ganti cemetery? Ubah di test-data.ts aja! 🎉
# Mau tambah section D? Tambah row di Examples! 🎉
```

---

## 🎯 Golden Rule: Kapan Pakai Mana?

| Data Type | Approach | Reason | Example |
|-----------|----------|--------|---------|
| **Credentials** | Placeholder | Sama di semua test | email, password |
| **Cemetery** | Placeholder | Biasanya sama, mudah override | Astana Tegal Gundul |
| **Organization** | Placeholder | Sama di semua test | astana tegal gundul |
| **Section/Row** | Scenario Outline | Beda-beda untuk test kombinasi | A, B, C, D, E |
| **Price Range** | Scenario Outline | Test berbagai range | 500, 1000, 5000 |
| **Capacity** | Scenario Outline | Test berbagai kombinasi | 1/1/1, 3/0/2 |
| **Plot Type** | Scenario Outline | Test berbagai types | Garden, Lawn, Monumental |

### Decision Tree

```
Apakah data ini SAMA di semua test scenarios?
│
├─ YES → Use PLACEHOLDER + test-data.ts
│         Example: Cemetery, Email, Password
│         Benefit: Ubah di 1 tempat (test-data.ts)
│
└─ NO → Use SCENARIO OUTLINE + Examples
          Example: Section A/B/C, Row A/B/C
          Benefit: Tambah kombinasi baru = tambah row
```

---

## 📝 Implementation Examples

### Example 1: Login (PLACEHOLDER - Consistent Data)

```gherkin
Feature: Login

    Background:
        Given I am on login page
        When I enter email "<TEST_EMAIL>"        # ← PLACEHOLDER
        And I enter password "<TEST_PASSWORD>"   # ← PLACEHOLDER
        And I click login button
        Then I should see org "<TEST_ORG_NAME>"  # ← PLACEHOLDER

    Scenario: Successful login
        Then I should be logged in
```

**Why?** Email, password, org name **SAMA** di semua login tests.

**Mau ganti?** Edit `test-data.ts` atau `.env` → semua scenarios terupdate! ✅

---

### Example 2: Advanced Search (HYBRID)

```gherkin
Feature: Advanced Search

    Background:
        Given I am logged in with "<TEST_EMAIL>" and "<TEST_PASSWORD>"  # ← PLACEHOLDER
        And I navigate to "<TEST_CEMETERY>"                             # ← PLACEHOLDER

    Scenario Outline: Search by <section> <row> with <price>
        When I select section "<section>"       # ← FROM EXAMPLES
        And I select row "<row>"                # ← FROM EXAMPLES
        And I enter price "<price>"             # ← FROM EXAMPLES
        Then I should see results
        
        Examples:
            | section | row | price | description           |
            | A       | A   | 500   | Low price test        |
            | B       | B   | 1000  | Medium price test     |
            | C       | C   | 5000  | High price test       |
```

**Why?**
- Cemetery & credentials **KONSISTEN** → Placeholder
- Section/row/price **BERVARIASI** → Scenario Outline

**Benefit:**
- Mau ganti cemetery? Ubah `test-data.ts` → semua scenarios terupdate ✅
- Mau test section D dengan price 10000? Tambah row di Examples ✅

---

### Example 3: Interment (PLACEHOLDER - Consistent Data)

```gherkin
Feature: Interment

    Background:
        Given I am logged in with "<TEST_EMAIL>" and "<TEST_PASSWORD>"

    Scenario: Add new interment
        When I fill interment form with:
            | firstName     | <TEST_INTERMENT_FIRSTNAME> |  # ← PLACEHOLDER
            | lastName      | <TEST_INTERMENT_LASTNAME>  |  # ← PLACEHOLDER
            | intermentType | <TEST_INTERMENT_TYPE>      |  # ← PLACEHOLDER
        Then I should see deceased in interments tab
```

**Why?** Interment data **KONSISTEN** untuk regression testing.

**Mau ganti?** Edit `test-data.ts` atau `.env` → semua scenarios terupdate! ✅

---

## 🏗️ File Structure

### 1. test-data.ts (Consistent Data)
```typescript
// Data yang KONSISTEN di banyak scenarios
export const LOGIN_DATA = {
  valid: {
    email: process.env.TEST_EMAIL || 'default@example.com',
    password: process.env.TEST_PASSWORD || 'default123'
  }
};

export const CEMETERY = process.env.TEST_CEMETERY || 'Astana Tegal Gundul';

export const INTERMENT_DATA = {
  add: {
    firstName: process.env.TEST_INTERMENT_FIRSTNAME || 'John',
    lastName: process.env.TEST_INTERMENT_LASTNAME || 'Doe'
  }
};
```

### 2. Feature Files (Variable Data)
```gherkin
# Data yang BERVARIASI dalam 1 scenario
Examples:
    | section | row | price | capacity |
    | A       | A   | 500   | 3        |
    | B       | B   | 1000  | 5        |
    | C       | C   | 5000  | 10       |
```

---

## 🔄 Workflow

### Scenario 1: Mau Ganti Cemetery untuk Semua Tests
```bash
# Option 1: Edit test-data.ts (permanent)
export const CEMETERY = 'New Cemetery Name';

# Option 2: Set environment variable (temporary)
echo "TEST_CEMETERY=New Cemetery Name" >> .env

# ✅ DONE! Semua scenarios otomatis pakai cemetery baru!
```

### Scenario 2: Mau Test Section D Row E dengan Price 10000
```gherkin
# Edit feature file - tambah row di Examples
Examples:
    | section | row | price | description           |
    | A       | A   | 500   | Existing              |
    | D       | E   | 10000 | NEW TEST!             | ← Add this

# ✅ DONE! No code changes needed!
```

### Scenario 3: Mau Test dengan Credentials Berbeda
```bash
# Set environment variable
echo "TEST_EMAIL=newuser@example.com" >> .env
echo "TEST_PASSWORD=newpassword123" >> .env

# ✅ DONE! Semua login scenarios otomatis pakai credentials baru!
```

---

## 📊 Comparison

| Aspect | Full Placeholder | Full Outline | ✅ Hybrid |
|--------|-----------------|--------------|----------|
| **Ganti cemetery** | Easy (1 place) | Hard (many rows) | ✅ Easy |
| **Tambah section** | Hard (new scenario) | Easy (add row) | ✅ Easy |
| **Ganti credentials** | Easy (1 place) | Hard (many rows) | ✅ Easy |
| **Test combinations** | Hard (many scenarios) | Easy (Examples) | ✅ Easy |
| **Maintenance** | Medium | Medium | ✅ **Best** |

---

## 🎓 Best Practices

### ✅ DO:

1. **Use Placeholder for Consistent Data**
   ```gherkin
   When I login with "<TEST_EMAIL>" and "<TEST_PASSWORD>"
   ```

2. **Use Scenario Outline for Variable Data**
   ```gherkin
   Scenario Outline: Test <section> <row>
       Examples:
           | section | row |
           | A       | A   |
   ```

3. **Combine Both in Same Feature**
   ```gherkin
   Background:
       Given I login with "<TEST_EMAIL>"        # Placeholder
   
   Scenario Outline: Test <section>
       When I select "<section>"                # From Examples
   ```

### ❌ DON'T:

1. **Don't Use Placeholder for Variable Data**
   ```gherkin
   # ❌ BAD
   <TEST_SECTION_A>, <TEST_SECTION_B>, <TEST_SECTION_C>
   ```

2. **Don't Repeat Consistent Data in Examples**
   ```gherkin
   # ❌ BAD
   Examples:
       | cemetery             | section |
       | Astana Tegal Gundul | A       |
       | Astana Tegal Gundul | B       |  # Repeated!
   ```

3. **Don't Hardcode Credentials in Feature Files**
   ```gherkin
   # ❌ BAD
   When I login with "user@example.com"
   
   # ✅ GOOD
   When I login with "<TEST_EMAIL>"
   ```

---

## 📚 Summary

### The Golden Rules

| Type | Use | Example |
|------|-----|---------|
| **Consistent across scenarios** | Placeholder + test-data.ts | Cemetery, Email, Password |
| **Varies within one test** | Scenario Outline + Examples | Section A/B/C, Price ranges |
| **Both needed** | Hybrid Approach | Background (placeholder) + Scenario (outline) |

### Benefits of Hybrid Approach

1. ✅ **Flexibility**: Easy to add new test combinations
2. ✅ **Maintainability**: Change consistent data in one place
3. ✅ **Readability**: Clear what varies and what stays same
4. ✅ **Scalability**: Support multiple environments and data sets
5. ✅ **Best of Both Worlds**: No trade-offs!

---

## 🎯 Quick Reference

**Mau ubah Cemetery?**
→ Edit `test-data.ts` atau `.env`

**Mau tambah Section D?**
→ Tambah row di Examples table

**Mau ubah Email?**
→ Edit `test-data.ts` atau `.env`

**Mau test Price 10000?**
→ Tambah row di Examples table

**Perfect! No trade-offs!** 🎉

---

**Last Updated:** January 9, 2026  
**Approach:** Hybrid (Placeholder + Scenario Outline)
