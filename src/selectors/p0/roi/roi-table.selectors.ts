/**
 * ROI Table Menu Selectors
 * Real selectors from project.chronicle.rip
 * Discovered via MCP Playwright manual exploration on 2026-02-04
 */

export const RoiTableSelectors = {
    // Sidebar navigation - VERIFIED
    sidebarTableButton: 'mat-button-toggle:has-text("Tables") button',
    sidebarTableButtonAlt: 'button:has([data-testid="side-menu-span-label-menu-sidebar-0"]:has-text("Tables"))',

    // Tables page - Tabs - VERIFIED
    roisTab: 'a.mat-tab-link:has-text("ROIS")',
    roisTabDataTestId: 'a[data-testid="content-wrapper-a-2"]',

    // Alternative tab selectors by text
    tabByText: (tabName: string) => `a.mat-tab-link:has-text("${tabName.toUpperCase()}")`,

    // ROIs tab - Actions - VERIFIED
    // Note: Add button uses data-testid="content-wrapper-button-add-plot" even though label is "ADD ROIS"
    addRoiButton: 'button[data-testid="content-wrapper-button-add-plot"]',
    addRoiButtonByText: 'button:has-text("ADD ROIS")',

    exportButton: 'button.action.export',
    exportButtonByText: 'button:has-text("EXPORT")',

    // Verification
    activeTab: '.mat-tab-link-active',
    activeTabText: (tabName: string) => `.mat-tab-link-active:has-text("${tabName.toUpperCase()}")`,

    // ROI Table - Filter and Search
    filterButton: 'button[data-testid="content-wrapper-button-action"]',
    filterDrawer: '.mat-drawer-content',
    filterApplyButton: 'button[data-testid="button-apply"]',
    filterCloseButton: 'button:has-text("CLOSE")',

    // ROI Table - Rows and Data
    tableWrapper: '[data-testid="content-wrapper-div-table-wrapper"]',
    tableRows: 'mat-row',

    // First row selectors (for specific cell access)
    // Note: nth-of-type(1) is the first data row (excluding header)
    firstRow: 'mat-table mat-row[role="row"]:nth-of-type(1)',

    // Cell selectors within a row (1-indexed after checkbox)
    // Cell 1: checkbox, Cell 2: Plot ID, Cell 3: Right Type, Cell 4: Term of Right, etc.
    firstRowPlotIdCell: 'mat-row:nth-of-type(1) mat-cell:nth-of-type(2)',

    // Generic Plot ID cell selector (for any row)
    plotIdCell: (rowIndex: number) => `mat-row:nth-of-type(${rowIndex}) mat-cell:nth-of-type(2)`,

    // ROI Table - Plot ID link/div (clickable to navigate to ROI details/edit)
    plotIdClickable: '.mat-cell.mat-column-plotId',

    // ROI Form (Add/Edit)
    roiFormTitle: 'h1',
    plotSelect: 'mat-select', // For Add ROI - select plot
    // Use mat-form-field text matching as label is usually in the wrapper
    rightTypeSelect: 'mat-form-field:has-text("Right type") mat-select',
    termOfRightSelect: 'mat-form-field:has-text("Term of right") mat-select',

    // Fee input - has different data-testid for Add vs Edit forms
    // Add form: data-testid="roi-form-input-number-0"
    // Edit form: data-testid="roi-form-input-number"
    feeInput: 'input[data-testid="roi-form-input-number-0"]',
    feeInputEdit: 'input[data-testid="roi-form-input-number"]',

    // Certificate input - use mat-form-field wrapper for specificity
    certificateInput: 'mat-form-field:has-text("Certificate number") input[type="text"]',

    // Save buttons - different for Add vs Edit forms
    // Edit form: button with text "save"
    // Add form: TWO buttons - "save" and "save and add interment"
    // We need to click only "save" to avoid redirect to interment page
    saveButton: 'button:has-text("save")',
    saveAndAddIntermentButton: 'button:has-text("save and add interment")',
    cancelButton: 'button:has-text("cancel")',

    // Row Actions
    rowActionButton: 'button:has(mat-icon:has-text("more_vert"))', // Standard 3-dots menu

    // ============================================
    // PLOTS TAB - Filter by Status
    // ============================================
    plotsTab: 'a[data-testid="content-wrapper-a-0"]',
    plotsTabByText: 'a.mat-tab-link:has-text("PLOTS")',

    // Filter dialog - Status dropdown
    filterStatusCombobox: '[role="combobox"][aria-label="Status"]',
    filterVacantOption: '[role="option"]:has-text("Vacant")',
    filterClearButton: 'button:has-text("CLEAR")',

    // Plots tab - first row Plot ID
    plotsFirstRowPlotId: 'mat-row:first-of-type mat-cell:nth-of-type(2)',

    // ============================================
    // ADD ROI FORM - Plot Search
    // ============================================
    plotSearchInput: 'input[data-testid="input-start-typing-to-search-0"]',
    plotEventTypeCombobox: '[role="combobox"][aria-label="Event Type"]',
    plotOptionByName: (name: string) => `mat-option:has-text("${name}")`,

    // Toast / Snackbar
    toastMessage: 'simple-snack-bar, .mat-snack-bar-container, [role="status"]',
    toastSuccessText: 'Data saved successfully.'
};
