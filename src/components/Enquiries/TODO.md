# TODO: Fix Multiple Unwanted API Calls in EnquiriesList

## Steps to Complete:
- [x] 1. Update frontend component (Ratan-Decor-Admin/src/components/Enquiries/EnquiriesList.jsx): Add useRef to prevent double initial fetchEnquiries call due to StrictMode; replace any debugToken with client-side JWT decoding if role needed.
- [x] 2. Test: Restart frontend server, load EnquiriesList, verify single initial GET /enquiries/all (no POST /enquiries/debug-token or duplicates), test search/filters trigger single requests.
- [x] 3. Complete: Remove this TODO or mark done.

Progress: All steps completed. The extra API call was due to debugToken (if present); replaced with client-side JWT decoding for single initial fetch.
