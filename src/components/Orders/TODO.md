
# TODO: Fix Multiple Unwanted API Calls in OrdersList

## Steps to Complete:

- [x] 1. Update backend controller (Ratan-Decor-api/order/controller.js): Add support for customer query param to filter orders by user name using Sequelize LIKE.
- [x] 2. Update API service (Ratan-Decor-Admin/src/components/Orders/adminOrderApi.js): Add customer to URLSearchParams in getOrders.
- [x] 3. Update frontend component (Ratan-Decor-Admin/src/components/Orders/OrdersList.jsx): Include filters.customer in fetchOrders useCallback dependencies and pass it to adminOrderApi.getOrders.
- [x] 4. Test: Restart backend/frontend servers, load OrdersList, verify single initial fetch (or dev double), test customer search triggers filtered fetch without extras.
- [x] 5. Complete: Remove this TODO or mark done.

Progress: All steps completed. The extra API call was due to debugToken; replaced with client-side JWT decoding for single initial fetch. Task completed successfully.
