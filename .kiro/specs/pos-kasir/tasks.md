# Implementation Plan: POS Kasir (Point of Sale)

## Overview

Implementasi sistem Point of Sale (POS) Kasir terintegrasi dengan dukungan multi-cabang, membership dengan diskon fleksibel, shift management, dan struk digital via WhatsApp. Sistem ini dibangun di atas infrastruktur Laravel + Inertia + React TSX yang sudah ada.

**Tech Stack:**
- Backend: Laravel 11.x (PHP 8.2+)
- Frontend: React 18.x + TypeScript + Inertia.js
- Database: MySQL/PostgreSQL
- Mobile: Capacitor (barcode scanning)

**Implementation Priority:**
1. Database migrations & models (foundation)
2. Service layer (business logic)
3. Backend controllers & routes
4. Frontend components (POS UI, Admin, Member Portal)
5. Testing (unit tests, property-based tests)

## Tasks

- [ ] 1. Database Layer - Migrations & Models
  - [ ] 1.1 Create database migrations for POS tables
    - Create migration for `membership_tiers` table
    - Create migration for `membership_tier_product_discounts` table
    - Create migration for `members` table
    - Create migration for `pos_transactions` table
    - Create migration for `pos_transaction_items` table
    - Create migration for `cashier_shifts` table
    - Create migration to add `warehouse_id` column to `users` table
    - _Requirements: FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-2.6, FR-2.7_
  
  - [ ] 1.2 Create Eloquent models with relationships
    - Create `MembershipTier` model with fillable, casts, and relationships
    - Create `MembershipTierProductDiscount` model with fillable, casts, and relationships
    - Create `Member` model with fillable, casts, and relationships
    - Create `PosTransaction` model with fillable, casts, and relationships
    - Create `PosTransactionItem` model with fillable, casts, and relationships
    - Create `CashierShift` model with fillable, casts, and relationships
    - Update `User` model to add `warehouse_id` relationship
    - Update `Warehouse` model to add POS-related relationships
    - Update `Product` model to add POS-related relationships
    - _Requirements: FR-1.1, FR-1.2, FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-2.6_

- [ ] 2. Service Layer - Core Business Logic
  - [ ] 2.1 Implement DiscountService for membership discount calculation
    - Implement `calculateDiscounts()` method with discount priority logic
    - Implement `getProductDiscount()` method for specific product discount lookup
    - Implement `getMemberTier()` method to fetch member tier with discount rules
    - Handle discount priority: specific discount > default tier discount > 0%
    - _Requirements: FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.5, AC-3.3, AC-3.4_
  
  - [ ]* 2.2 Write property test for DiscountService
    - **Property 2: Discount Calculation with Priority**
    - **Validates: Requirements AC-3.3, AC-3.4, AC-8.2**
    - Generate random products with various discount configurations
    - Verify correct discount is applied based on priority rules
  
  - [ ] 2.3 Implement POSService for transaction processing
    - Implement `previewCart()` method to calculate cart totals with discounts
    - Implement `processCheckout()` method with database transaction wrapping
    - Implement `voidTransaction()` method with shift validation
    - Implement `getAvailableStock()` method for warehouse-specific stock lookup
    - Implement `searchProducts()` method with warehouse filtering
    - Handle stock updates and StockMovement creation
    - _Requirements: FR-1.3, FR-1.4, FR-4.1, AC-2.3, AC-3.5, AC-4.5, AC-4.6_
  
  - [ ]* 2.4 Write property test for POSService cart calculation
    - **Property 1: Cart Calculation Correctness**
    - **Validates: Requirements AC-2.3, AC-3.5**
    - Generate random cart items with various quantities and prices
    - Verify subtotal, total_discount, and grand_total calculations
  
  - [ ]* 2.5 Write property test for POSService stock consistency
    - **Property 4: Stock Consistency and Warehouse Isolation**
    - **Validates: Requirements AC-4.6, AC-13.2, AC-13.3**
    - Generate random transactions across multiple warehouses
    - Verify stock decreases correctly per warehouse
    - Verify StockMovement records are created correctly
  
  - [ ]* 2.6 Write property test for cash change calculation
    - **Property 3: Cash Change Calculation**
    - **Validates: Requirements AC-4.4**
    - Generate random transactions with various cash_received amounts
    - Verify cash_change calculation is correct
  
  - [ ] 2.7 Implement ShiftService for cashier shift management
    - Implement `getCurrentShift()` method to get active shift
    - Implement `openShift()` method with validation (no duplicate open shifts)
    - Implement `closeShift()` method with cash reconciliation
    - Implement `calculateExpectedCash()` method for shift balance calculation
    - Implement `canPerformTransaction()` method to check shift status
    - _Requirements: FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, AC-11.1, AC-11.2, AC-11.3, AC-11.4, AC-11.5_
  
  - [ ]* 2.8 Write property test for ShiftService cash balance
    - **Property 7: Shift Cash Balance Calculation**
    - **Validates: Requirements AC-11.5**
    - Generate random shifts with multiple transactions
    - Verify expected_cash calculation is correct
  
  - [ ]* 2.9 Write property test for shift transaction isolation
    - **Property 8: Shift Transaction Isolation**
    - **Validates: Requirements AC-11.3**
    - Verify only one open shift per cashier per warehouse
    - Verify transactions require active shift
  
  - [ ] 2.10 Implement ReceiptService for receipt generation and WhatsApp
    - Implement `generateTransactionNumber()` method (format: POS-YYYYMMDD-XXXX)
    - Implement `sendReceiptViaWhatsApp()` method using existing WhatsApp integration
    - Implement `generateReceiptHTML()` method for printable receipt
    - Implement `getReceiptUrl()` method to generate receipt URL
    - _Requirements: FR-1.5, FR-4.1, FR-4.2, FR-4.6, AC-5.2, AC-5.3, AC-5.4, AC-5.5_
  
  - [ ]* 2.11 Write property test for receipt message format
    - **Property 16: Receipt Message Format**
    - **Validates: Requirements AC-5.4, AC-5.5**
    - Generate random transactions
    - Verify WhatsApp message contains all required fields

- [ ] 3. Checkpoint - Service Layer Complete
  - Ensure all service layer tests pass, ask the user if questions arise.

- [ ] 4. Backend Controllers - HTTP Request Handling
  - [ ] 4.1 Create Form Request validators
    - Create `CheckoutRequest` with validation rules and custom validation logic
    - Create `OpenShiftRequest` with validation rules
    - Create `CloseShiftRequest` with validation rules
    - Create `StoreTierRequest` for membership tier creation
    - Create `UpdateTierRequest` for membership tier update
    - Create `StoreProductDiscountRequest` for product discount creation
    - Create `StoreMemberRequest` for member creation
    - Create `UpdateMemberRequest` for member update
    - _Requirements: AC-1.4, AC-1.5, AC-4.3, AC-11.1, AC-11.4_
  
  - [ ] 4.2 Implement POSController for POS transactions
    - Implement `index()` method to render POS UI
    - Implement `searchProducts()` method with warehouse filtering
    - Implement `previewCart()` method for cart preview with discounts
    - Implement `checkout()` method to process checkout
    - Implement `show()` method to show transaction detail
    - Implement `void()` method to void transaction
    - Add authorization checks (role: kasir, admin, supervisor)
    - _Requirements: AC-1.2, AC-2.3, AC-3.5, AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-12.3_
  
  - [ ] 4.3 Implement CashierShiftController for shift management
    - Implement `current()` method to get current active shift
    - Implement `open()` method to open new shift
    - Implement `close()` method to close shift with reconciliation
    - Implement `index()` method to list shift history
    - Implement `show()` method to show shift detail
    - Add authorization checks
    - _Requirements: AC-11.1, AC-11.2, AC-11.3, AC-11.4, AC-11.5, AC-11.6_
  
  - [ ] 4.4 Implement ReceiptController for receipt viewing and sending
    - Implement `show()` method to view receipt (with auth and access control)
    - Implement `sendWhatsApp()` method to resend receipt via WhatsApp
    - Implement `print()` method to get printable receipt HTML
    - Add authorization checks (member access control)
    - _Requirements: FR-4.2, FR-4.3, FR-4.4, FR-4.5, AC-5.1, AC-5.2, AC-6.1, AC-6.2, AC-6.3, AC-6.4_
  
  - [ ]* 4.5 Write property test for member receipt access control
    - **Property 10: Member Receipt Access Control**
    - **Validates: Requirements AC-6.4**
    - Generate random members and transactions
    - Verify access control rules are enforced
  
  - [ ] 4.6 Implement MembershipController for membership management
    - Implement `indexTiers()` method to list membership tiers
    - Implement `storeTier()` method to create tier
    - Implement `updateTier()` method to update tier
    - Implement `destroyTier()` method to delete tier
    - Implement `indexProductDiscounts()` method to list product discounts
    - Implement `storeProductDiscount()` method to create product discount
    - Implement `destroyProductDiscount()` method to delete product discount
    - Implement `indexMembers()` method to list members
    - Implement `storeMember()` method to create member
    - Implement `updateMember()` method to update member
    - Implement `destroyMember()` method to deactivate member
    - Implement `searchMembers()` method to search members
    - Add authorization checks (admin only)
    - _Requirements: AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5_
  
  - [ ]* 4.7 Write property test for member number uniqueness
    - **Property 11: Member Number Uniqueness**
    - **Validates: Requirements AC-9.4**
    - Attempt to create members with duplicate member_number
    - Verify uniqueness constraint is enforced
  
  - [ ]* 4.8 Write property test for CRUD data integrity
    - **Property 17: CRUD Data Integrity**
    - **Validates: Requirements AC-7.1, AC-7.2, AC-7.4, AC-8.3, AC-8.5, AC-9.1, AC-9.2**
    - Test create, read, update, delete operations for all entities
    - Verify data persistence and retrieval
  
  - [ ] 4.9 Implement POSReportController for sales reports
    - Implement `dashboard()` method for dashboard overview
    - Implement `sales()` method for sales report with filters
    - Implement `topProducts()` method for top selling products
    - Implement `branchComparison()` method for branch performance comparison
    - Add warehouse filtering based on user role
    - _Requirements: AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5, AC-14.1, AC-14.2, AC-14.3, AC-14.4, AC-14.5_
  
  - [ ]* 4.10 Write property test for report aggregation accuracy
    - **Property 13: Report Aggregation Accuracy**
    - **Validates: Requirements AC-10.1, AC-10.2, AC-10.3**
    - Generate random transactions with various filters
    - Verify aggregation calculations are correct
  
  - [ ]* 4.11 Write property test for warehouse isolation
    - **Property 9: Warehouse Isolation for Cashiers**
    - **Validates: Requirements AC-12.3, AC-13.1, AC-13.4**
    - Generate random cashiers with different warehouse assignments
    - Verify they can only access their warehouse data

- [ ] 5. Checkpoint - Backend Complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [ ] 6. Backend Routes & Middleware
  - [ ] 6.1 Define routes for POS transactions
    - Define routes in `routes/web.php` for POSController
    - Apply auth middleware and role-based authorization
    - Group routes under `/pos` prefix
    - _Requirements: AC-12.1, AC-12.2, AC-12.3, AC-12.4_
  
  - [ ] 6.2 Define routes for cashier shifts
    - Define routes for CashierShiftController
    - Apply auth middleware
    - Group routes under `/pos/shifts` prefix
  
  - [ ] 6.3 Define routes for receipts
    - Define routes for ReceiptController
    - Apply auth middleware with member access control
    - Group routes under `/pos/receipts` prefix
  
  - [ ] 6.4 Define routes for membership management
    - Define routes for MembershipController
    - Apply auth middleware with admin-only authorization
    - Group routes under `/settings/membership` prefix
  
  - [ ] 6.5 Define routes for POS reports
    - Define routes for POSReportController
    - Apply auth middleware with role-based filtering
    - Group routes under `/pos/reports` prefix
  
  - [ ] 6.6 Update role-based authorization middleware
    - Add "kasir" role to authorization system
    - Implement warehouse-based access control for kasir role
    - Update existing middleware to support POS routes
    - _Requirements: AC-12.1, AC-12.2, AC-12.3, AC-12.4, AC-12.5, FR-7.1_

- [ ] 7. Frontend - POS Kasir UI
  - [ ] 7.1 Create POS main page layout
    - Create `resources/js/pages/pos/index.tsx` with three-column layout
    - Implement responsive design for PC and tablet
    - Add keyboard shortcuts (Enter, Esc, F1)
    - _Requirements: NFR-2.1, NFR-2.2, NFR-2.3_
  
  - [ ] 7.2 Implement ProductSearch component
    - Create `ProductSearch.tsx` with search input and barcode scanner integration
    - Integrate Capacitor barcode scanner for mobile/tablet
    - Implement manual barcode input for PC
    - Display search results with product info (name, price, stock)
    - Add "Add to Cart" functionality
    - _Requirements: AC-1.1, AC-1.2, AC-1.3, AC-1.4_
  
  - [ ] 7.3 Implement Cart component
    - Create `Cart.tsx` to display cart items
    - Implement quantity update functionality
    - Implement item removal functionality
    - Implement "Clear Cart" functionality
    - Display subtotal calculation
    - Show stock warnings if quantity exceeds available stock
    - _Requirements: AC-1.5, AC-1.6, AC-2.1, AC-2.2, AC-2.3, AC-2.4_
  
  - [ ] 7.4 Implement MemberSelector component
    - Create `MemberSelector.tsx` for member search and selection
    - Implement search by member number, name, or phone
    - Display member info (name, tier, discount)
    - Add "Remove Member" functionality
    - _Requirements: AC-3.1, AC-3.2, AC-3.6_
  
  - [ ] 7.5 Implement CheckoutPanel component
    - Create `CheckoutPanel.tsx` with discount breakdown display
    - Show subtotal, discount per item, total discount, grand total
    - Implement cash input field
    - Calculate and display change
    - Add "Checkout" button with validation
    - _Requirements: AC-3.5, AC-4.1, AC-4.2, AC-4.3, AC-4.4_
  
  - [ ] 7.6 Implement ReceiptModal component
    - Create `ReceiptModal.tsx` to show receipt after checkout
    - Display transaction summary
    - Add "Print Receipt" button (browser print or Bluetooth)
    - Add "Send via WhatsApp" button with phone input
    - Implement printer integration (browser print API and Capacitor Bluetooth)
    - _Requirements: AC-5.1, AC-5.2, AC-5.3, FR-6.1, FR-6.2, FR-6.3_
  
  - [ ] 7.7 Implement ShiftManager component
    - Create `ShiftManager.tsx` for shift open/close interface
    - Implement "Open Shift" form with opening balance input
    - Implement "Close Shift" form with actual cash input
    - Display shift summary (transactions, expected cash, difference)
    - Show warning if difference exceeds threshold
    - _Requirements: AC-11.1, AC-11.2, AC-11.4, AC-11.5, FR-5.6_
  
  - [ ] 7.8 Create PrinterService for receipt printing
    - Create `resources/js/services/PrinterService.ts`
    - Implement browser print functionality for PC
    - Implement Bluetooth printer functionality for mobile/tablet
    - Convert receipt HTML to ESC/POS commands for thermal printers
    - Handle printer errors gracefully
    - _Requirements: FR-6.1, FR-6.2, FR-6.3_

- [ ] 8. Frontend - Member Portal
  - [ ] 8.1 Create member transaction history page
    - Create `resources/js/pages/member/transactions.tsx`
    - Display list of member transactions (date, number, total, status)
    - Implement pagination
    - Add click to view detail functionality
    - Require authentication
    - _Requirements: AC-6.1, AC-6.2, AC-6.3_
  
  - [ ] 8.2 Create receipt detail page
    - Create `resources/js/pages/receipts/show.tsx`
    - Display full transaction detail (items, quantities, prices, discounts)
    - Show receipt header (store info, transaction number, date)
    - Show receipt summary (subtotal, discount, grand total, payment, change)
    - Implement access control (member can only view their receipts)
    - Handle redirect to login if not authenticated
    - _Requirements: AC-6.3, AC-6.4, AC-6.5, FR-4.2, FR-4.3, FR-4.4_

- [ ] 9. Frontend - Admin Dashboard
  - [ ] 9.1 Create membership management page
    - Create `resources/js/pages/settings/membership/index.tsx` with tabs
    - Implement "Membership Tiers" tab with tier list and CRUD forms
    - Implement "Members" tab with member list and CRUD forms
    - Implement "Product Discounts" tab with discount list and CRUD forms
    - Add search functionality for members
    - _Requirements: AC-7.1, AC-7.2, AC-7.4, AC-7.5, AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-9.1, AC-9.2, AC-9.3, AC-9.5_
  
  - [ ] 9.2 Create POS reports dashboard
    - Create `resources/js/pages/pos/reports/index.tsx`
    - Implement report filters (date range, warehouse, cashier)
    - Display sales summary (total transactions, omzet, discount)
    - Display member vs non-member breakdown
    - Display top products chart
    - Display branch comparison chart
    - Display transaction table with pagination
    - _Requirements: AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5, AC-14.1, AC-14.2, AC-14.3, AC-14.4, AC-14.5_
  
  - [ ] 9.3 Create shift history page
    - Create `resources/js/pages/pos/shifts/index.tsx`
    - Display list of shifts (date, cashier, warehouse, status)
    - Show shift summary (opening balance, closing balance, difference)
    - Implement filters (date, cashier, warehouse)
    - Add click to view detail functionality
    - _Requirements: AC-11.6_

- [ ] 10. Checkpoint - Frontend Complete
  - Ensure all frontend components render correctly, ask the user if questions arise.

- [ ] 11. Integration & Wiring
  - [ ] 11.1 Wire POS UI with backend API
    - Connect ProductSearch to `/pos/products/search` endpoint
    - Connect Cart preview to `/pos/cart/preview` endpoint
    - Connect Checkout to `/pos/transactions/checkout` endpoint
    - Handle API errors and display user-friendly messages
    - _Requirements: AC-1.2, AC-2.3, AC-4.5_
  
  - [ ] 11.2 Wire ShiftManager with backend API
    - Connect Open Shift to `/pos/shifts/open` endpoint
    - Connect Close Shift to `/pos/shifts/close` endpoint
    - Connect Current Shift to `/pos/shifts/current` endpoint
    - Handle shift validation errors
    - _Requirements: AC-11.1, AC-11.4_
  
  - [ ] 11.3 Wire ReceiptModal with WhatsApp and printer services
    - Connect Send WhatsApp to `/pos/receipts/{transaction}/send-whatsapp` endpoint
    - Connect Print to PrinterService
    - Handle external service errors gracefully
    - _Requirements: AC-5.1, AC-5.2, AC-5.3_
  
  - [ ] 11.4 Wire MembershipController with frontend forms
    - Connect tier CRUD forms to membership tier endpoints
    - Connect member CRUD forms to member endpoints
    - Connect product discount forms to discount endpoints
    - Handle validation errors and display feedback
    - _Requirements: AC-7.1, AC-7.4, AC-8.3, AC-8.5, AC-9.1, AC-9.2_
  
  - [ ] 11.5 Wire POSReportController with report dashboard
    - Connect report filters to `/pos/reports/sales` endpoint
    - Connect top products chart to `/pos/reports/top-products` endpoint
    - Connect branch comparison to `/pos/reports/branch-comparison` endpoint
    - Implement data visualization (charts/graphs)
    - _Requirements: AC-10.4, AC-10.5, AC-14.2, AC-14.3_
  
  - [ ] 11.6 Implement stock validation and overselling prevention
    - Add real-time stock checking before adding to cart
    - Implement database row locking for stock updates
    - Handle concurrent transaction scenarios
    - Display appropriate error messages
    - _Requirements: AC-1.5, NFR-4.3_
  
  - [ ]* 11.7 Write property test for no overselling
    - **Property 5: No Overselling**
    - **Validates: Requirements AC-1.5**
    - Generate random transactions with quantity > stock
    - Verify transactions are rejected
  
  - [ ] 11.8 Implement idempotency for offline sync
    - Add idempotency key to transaction creation
    - Prevent duplicate transactions during offline sync
    - Handle duplicate detection and return existing transaction
    - _Requirements: NFR-4.1, NFR-4.2_
  
  - [ ]* 11.9 Write property test for transaction idempotency
    - **Property 5: Transaction Idempotency**
    - **Validates: Requirements NFR-4.1, NFR-4.2**
    - Simulate duplicate transaction requests
    - Verify no duplicate transactions are created

- [ ] 12. Receipt Generation & Printing
  - [ ] 12.1 Create receipt print view
    - Create `resources/views/receipts/print.blade.php`
    - Implement thermal printer format (58mm/80mm)
    - Add CSS for print media
    - Include all receipt elements (header, items, summary, footer)
    - _Requirements: FR-6.3_
  
  - [ ] 12.2 Implement WhatsApp receipt message template
    - Create message template with store info, transaction summary, and receipt URL
    - Integrate with existing Evolution API WhatsApp service
    - Handle message sending errors gracefully
    - _Requirements: AC-5.3, AC-5.4, FR-4.6_
  
  - [ ]* 12.3 Write unit tests for receipt generation
    - Test `generateTransactionNumber()` format
    - Test `generateReceiptHTML()` output
    - Test `getReceiptUrl()` format
    - Test WhatsApp message template format

- [ ] 13. Error Handling & Validation
  - [ ] 13.1 Implement comprehensive error handling
    - Add stock validation errors with user-friendly messages
    - Add payment validation errors
    - Add shift validation errors
    - Add warehouse validation errors
    - Add member validation errors
    - Handle database transaction rollbacks
    - Handle external service failures (WhatsApp, printer)
    - _Requirements: NFR-3.3_
  
  - [ ]* 13.2 Write unit tests for error scenarios
    - Test insufficient stock error
    - Test insufficient cash error
    - Test no active shift error
    - Test warehouse access denied error
    - Test inactive member error
    - Test duplicate shift error
    - Test void after shift close error

- [ ] 14. Database Seeders & Sample Data
  - [ ] 14.1 Create database seeders
    - Create seeder for membership tiers (Bronze, Silver, Gold)
    - Create seeder for sample members
    - Create seeder for sample product discounts
    - Create seeder for kasir users with warehouse assignments
    - _Requirements: AC-7.1, AC-9.1_
  
  - [ ]* 14.2 Write unit tests for seeders
    - Verify seeders run without errors
    - Verify seeded data integrity

- [ ] 15. Final Integration Testing
  - [ ]* 15.1 Write integration tests for complete checkout flow
    - Test: scan product → add to cart → apply member → checkout → print receipt
    - Verify all database records are created correctly
    - Verify stock is updated correctly
    - Verify WhatsApp message is sent
  
  - [ ]* 15.2 Write integration tests for shift management flow
    - Test: open shift → perform transactions → close shift
    - Verify shift balance calculations
    - Verify transactions are linked to shift
  
  - [ ]* 15.3 Write integration tests for member portal flow
    - Test: login → view transactions → view receipt detail
    - Verify access control is enforced
    - Verify data is displayed correctly
  
  - [ ]* 15.4 Write integration tests for multi-warehouse scenarios
    - Test: multiple cashiers in different warehouses
    - Verify warehouse isolation
    - Verify stock updates are warehouse-specific
    - **Property 4: Stock Consistency and Warehouse Isolation**
    - **Property 9: Warehouse Isolation for Cashiers**

- [ ] 16. Final Checkpoint - All Tests Pass
  - Ensure all unit tests, property tests, and integration tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- All property tests should run minimum 100 iterations
- Use Pest PHP for property-based testing with pest-plugin-faker
- Database transactions should wrap all checkout operations for atomicity
- External service failures (WhatsApp, printer) should not fail transactions
- Implement idempotency for offline sync scenarios
- Use database row locking for concurrent stock updates
- Role-based authorization: kasir (POS only), admin (all features), supervisor (reports + POS)
- Warehouse isolation: kasir can only access their assigned warehouse
- Member access control: members can only view their own receipts

## Testing Configuration

**Property-Based Testing:**
- Library: Pest PHP with pest-plugin-faker
- Minimum iterations: 100 per property test
- Tag format: `#[Feature('pos-kasir')]` and `#[Property(N)]`

**Test Coverage Goals:**
- Service layer: 90%+ coverage
- Controllers: 80%+ coverage
- Models: 100% relationship coverage

**Test Execution:**
- Run unit tests: `php artisan test --filter Unit`
- Run property tests: `php artisan test --filter Property`
- Run integration tests: `php artisan test --filter Integration`
- Run all tests: `php artisan test`
