# Redington configuration bridge

The Magento deployment under `B2C/app/code/Redington` exposes a number of
settings via `etc/adminhtml/system.xml`.  The table below explains how those
options map to the new Medusa environment variables introduced in
`src/modules/redington-config/index.ts`.

| Magento module / field | Magento path | Medusa environment variable | Notes |
| --- | --- | --- | --- |
| `Redington_Product` → “Enable Default stock removed” | `redington_productnew/general/enable` | `REDINGTON_PRODUCT_DISABLE_DEFAULT_STOCK` | `true` if Magento toggle is enabled |
| `Redington_DomainBasedOutOfStockControl` → “Enable Default Domain Based Out Of Stock Control” | `redington_domainbasedoutofstocknew/general/enable` | `REDINGTON_DOMAIN_STOCK_CONTROL_ENABLED` | |
| `Redington_DomainBasedAuthentication` → “Enable Domain Based Authentication” | `redington_domainbasedauthentication/general/enable` | `REDINGTON_DOMAIN_AUTH_ENABLED` | |
| `Redington_MaxQtyCheck` → “Parent Category Id” | `redington_product/company_code/category_id` | `REDINGTON_PRODUCT_CATEGORY_ROOT_ID` | Accepts a single category id |
| `Redington_MaxQtyCheck` → “Max Order Qty Duration” | `redington_product/max_order_qty/max_order_qty_duration` | `REDINGTON_PRODUCT_MAX_ORDER_DURATION` | Duration in months |
| `Redington_GetInTouch` → “Customer Enquiry Email Receiver” | `redington_sms/get_in_touch_email_receiver/email` | `REDINGTON_GET_IN_TOUCH_EMAIL` | |
| `Redington_PaymentIntegration` → “Payment Information API URL” | `redington_paymentintegration/payment_general/initiate_session_url` | `REDINGTON_PAYMENT_API_URL` | |
| `Redington_PaymentIntegration` → “Username” | `redington_paymentintegration/payment_general/username` | `REDINGTON_PAYMENT_USERNAME` | |
| `Redington_PaymentIntegration` → “Password” | `redington_paymentintegration/payment_general/password` | `REDINGTON_PAYMENT_PASSWORD` | |
| `Redington_CurrencyMapping` → “Redington Available Payment Method” | `redington_paymentintegration/redington/payment_method` | `REDINGTON_AVAILABLE_PAYMENT_METHODS` | comma separated |
| `Redington_OUTOFStockProductEnquiry` → “Email template” | `product_stock/email_configuration/email_template_stock` | `REDINGTON_STOCK_ENQUIRY_EMAIL_TEMPLATE` | |
| 〃 → “Notify template” | `product_stock/email_configuration/email_template_notify` | `REDINGTON_STOCK_ENQUIRY_NOTIFY_TEMPLATE` | |
| 〃 → “Email subject (enquiry)” | `product_stock/email_configuration/notify_email_subject` | `REDINGTON_STOCK_ENQUIRY_EMAIL_SUBJECT` | |
| 〃 → “Email subject (notify)” | `product_stock/email_configuration/notify_email_subject_notify` | `REDINGTON_STOCK_ENQUIRY_NOTIFY_SUBJECT` | |
| 〃 → “Email sender” | `product_stock/email_configuration/sender` | `REDINGTON_STOCK_ENQUIRY_EMAIL_SENDER` | |
| `Redington_SapIntegration` → “Frontend domain url” | `redington_sapintegration/domain_url/domain` | `REDINGTON_SAP_DOMAIN` | |
| 〃 → “KSA Company Code” | `redington_sapintegration/company_code/ksa_company_code` | `REDINGTON_SAP_KSA_COMPANY_CODE` | |
| 〃 → “Multiple Recipients” | `redington_sapintegration/mail_notifications/multiple_recipients` | `REDINGTON_SAP_NOTIFICATION_RECIPIENTS` | comma separated |
| 〃 → “SAP API URL” | `redington_sapintegration/api_general/sap_api_url` | `REDINGTON_SAP_API_URL` | |
| 〃 → “API Client Id” | `redington_sapintegration/api_general/web_api_client_id` | `REDINGTON_SAP_API_CLIENT_ID` | |
| 〃 → “API Client Secret” | `redington_sapintegration/api_general/web_api_client_secret` | `REDINGTON_SAP_API_CLIENT_SECRET` | |
| 〃 → “Customer Number” | `redington_sapintegration/api_general/customer_number` | `REDINGTON_SAP_CUSTOMER_NUMBER` | |
| 〃 → “Get Invoice API URL” | `redington_sapintegration/invoice_api/invoice_api_url` | `REDINGTON_SAP_INVOICE_API_URL` | |
| 〃 → “Invoice API Client Id” | `redington_sapintegration/invoice_api/web_api_client_id` | `REDINGTON_SAP_INVOICE_CLIENT_ID` | |
| 〃 → “Invoice API Client Secret” | `redington_sapintegration/invoice_api/web_api_client_secret` | `REDINGTON_SAP_INVOICE_CLIENT_SECRET` | |
| 〃 → “Get Invoice PDF API URL” | `redington_sapintegration/invoice_api/invoice_pdf_api_url` | `REDINGTON_SAP_INVOICE_PDF_API_URL` | |
| `Redington_GuestUserRegister` → “Allowed Portal Base URL” | `redington_settings/guest_user/allowed_domains` | `REDINGTON_GUEST_ALLOWED_DOMAINS` | newline or comma separated |
| `Redington_OtpFunctionality` → “API URL” | `redington_sms/api_details/api_url` | `REDINGTON_SMS_API_URL` | |
| 〃 → “Client Id” | `redington_sms/api_details/client_id` | `REDINGTON_SMS_CLIENT_ID` | |
| 〃 → “Client Secret” | `redington_sms/api_details/client_secret` | `REDINGTON_SMS_CLIENT_SECRET` | |
| 〃 → “Sender Id” | `redington_sms/api_details/sender_id` | `REDINGTON_SMS_SENDER_ID` | |
| 〃 → “Application” | `redington_sms/api_details/application` | `REDINGTON_SMS_APPLICATION` | |
| 〃 → “Enable OTP” | `redington_sms/sms_text/enabled_otp` | `REDINGTON_SMS_ENABLE_OTP` | |
| 〃 → “OTP Text” | `redington_sms/sms_text/otp_text` | `REDINGTON_SMS_OTP_TEXT` | |

Use `import { redingtonConfig } from "../modules/redington-config"` (adjust the
relative path as needed) to access the values inside the Medusa service layer.
Call `buildRedingtonConfig()` if you need to recalculate after mutating
environment variables (for example in integration tests).
