// Magento B2C Redington API endpoints exposed for the Medusa storefront.
// Each entry includes HTTP method, Magento path, and authentication expectations.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type MagentoEndpoint = {
  name: string;
  method: HttpMethod;
  path: string;
  auth: string;
};

export type MagentoEndpointGroups = Record<string, MagentoEndpoint[]>;

export const magentoB2cEndpoints: MagentoEndpointGroups = {
  accessMapping: [
    { name: 'getDomainDetails', method: 'POST', path: '/V1/access-mapping/getDomainDetails/', auth: 'anonymous' }
  ],
  domainBasedAuthentication: [
    { name: 'checkDomain', method: 'POST', path: '/V1/checkdomain', auth: 'anonymous' }
  ],
  currencyMapping: [
    { name: 'getCustomerInfo', method: 'POST', path: '/V1/customer-info/getCustomerInfo/', auth: 'acl: Redington_CurrencyMapping::currencymapping' }
  ],
  categoryRestriction: [
    { name: 'getCategories', method: 'POST', path: '/V1/category-restriction/getCategories/', auth: 'acl: Magento_Catalog::categories' },
    { name: 'getPromotions', method: 'POST', path: '/V1/category-restriction/getPromotions/', auth: 'acl: Magento_Catalog::categories' }
  ],
  promotion: [
    { name: 'getPromotions', method: 'POST', path: '/V1/promotions/', auth: 'anonymous' }
  ],
  stockData: [
    { name: 'checkStockData', method: 'POST', path: '/V1/checkout/check-stock-data', auth: 'anonymous' }
  ],
  maxQtyCheck: [
    { name: 'getMaxOrderQty', method: 'POST', path: '/V1/max-order-qty/getMaxOrderQty/', auth: 'acl: Redington_MaxQtyCheck::maxQtyCheck' }
  ],
  subscriptionCode: [
    { name: 'checkSubscriptionCode', method: 'POST', path: '/V1/check-subscriptioncode/', auth: 'anonymous' }
  ],
  guestUserRegister: [
    { name: 'verifyGuestUser', method: 'POST', path: '/V1/guestuser/guestuserverify', auth: 'anonymous' },
    { name: 'getAllowedDomains', method: 'GET', path: '/V1/redington/allowed_domains', auth: 'anonymous' },
    { name: 'generateGuestToken', method: 'POST', path: '/V1/guestuser/token', auth: 'anonymous' }
  ],
  paymentIntegration: [
    { name: 'submitPaymentInformation', method: 'POST', path: '/V1/carts/mine/b2cpayment-information', auth: 'customer token (self)' },
    { name: 'getPaymentStatus', method: 'POST', path: '/V1/payment-status', auth: 'anonymous' }
  ],
  retainCartPaymentFailure: [
    { name: 'getRetryTime', method: 'POST', path: '/V1/payment/getRetryTime', auth: 'anonymous' },
    { name: 'cancelRetainedCart', method: 'POST', path: '/V1/redington/retain-cart/cancel', auth: 'anonymous' },
    { name: 'sendRetryEmail', method: 'POST', path: '/V1/redington/payment/retry/email', auth: 'anonymous' },
    { name: 'reorderCart', method: 'POST', path: '/V1/redington/reorder', auth: 'customer token (self)' }
  ],
  invoice: [
    { name: 'getInvoice', method: 'POST', path: '/V1/b2cgetinvoice', auth: 'anonymous' }
  ],
  addBccValue: [
    { name: 'getInvoiceWithBcc', method: 'POST', path: '/V1/newgetinvoice', auth: 'anonymous' }
  ],
  orderReturnManagement: [
    { name: 'viewReturns', method: 'GET', path: '/V1/returnView', auth: 'anonymous' },
    { name: 'requestReturn', method: 'POST', path: '/V1/requestOrderReturn', auth: 'anonymous' },
    { name: 'checkReturn', method: 'POST', path: '/V1/checkOrderReturn', auth: 'anonymous' }
  ],
  otpFunctionality: [
    { name: 'sendOtp', method: 'POST', path: '/V1/otp/send', auth: 'acl: Magento_Customer::group' },
    { name: 'verifyOtp', method: 'POST', path: '/V1/otp/verify', auth: 'acl: Magento_Customer::group' }
  ],
  outOfStockProductEnquiry: [
    { name: 'createEnquiry', method: 'POST', path: '/V1/redington-outofstockproductenquiry/productenquiry', auth: 'customer token (self)' },
    { name: 'searchEnquiries', method: 'GET', path: '/V1/redington-outofstockproductenquiry/productenquiry/search', auth: 'acl: Redington_OutOfStockProductEnquiry::productenquiry_view' },
    { name: 'getEnquiry', method: 'GET', path: '/V1/redington-outofstockproductenquiry/productenquiry/:productenquiryId', auth: 'acl: Redington_OutOfStockProductEnquiry::productenquiry_view' },
    { name: 'updateEnquiry', method: 'PUT', path: '/V1/redington-outofstockproductenquiry/productenquiry/:productenquiryId', auth: 'acl: Redington_OutOfStockProductEnquiry::productenquiry_update' },
    { name: 'deleteEnquiry', method: 'DELETE', path: '/V1/redington-outofstockproductenquiry/productenquiry/:productenquiryId', auth: 'acl: Redington_OutOfStockProductEnquiry::productenquiry_delete' }
  ],
  cookiePolicy: [
    { name: 'createCookiePolicy', method: 'POST', path: '/V1/redington-cookiepolicy/cookiepolicy', auth: 'acl: Redington_CookiePolicy::CookiePolicy_save' },
    { name: 'searchCookiePolicies', method: 'GET', path: '/V1/redington-cookiepolicy/cookiepolicy/search', auth: 'self' },
    { name: 'getCookiePolicy', method: 'GET', path: '/V1/redington-cookiepolicy/cookiepolicy/:cookiepolicyId', auth: 'acl: Redington_CookiePolicy::CookiePolicy_view' },
    { name: 'updateCookiePolicy', method: 'PUT', path: '/V1/redington-cookiepolicy/cookiepolicy/:cookiepolicyId', auth: 'acl: Redington_CookiePolicy::CookiePolicy_update' },
    { name: 'deleteCookiePolicy', method: 'DELETE', path: '/V1/redington-cookiepolicy/cookiepolicy/:cookiepolicyId', auth: 'acl: Redington_CookiePolicy::CookiePolicy_delete' }
  ],
  termsConditions: [
    { name: 'createTerms', method: 'POST', path: '/V1/redington-termsconditions/termsconditions', auth: 'acl: Magento_Customer::group' },
    { name: 'listTerms', method: 'POST', path: '/V1/redington-termsconditions/termsconditions/getlist', auth: 'anonymous' },
    { name: 'getTerms', method: 'GET', path: '/V1/redington-termsconditions/termsconditions/:termsconditionsId', auth: 'acl: Magento_Customer::group' },
    { name: 'updateTerms', method: 'PUT', path: '/V1/redington-termsconditions/termsconditions/:termsconditionsId', auth: 'acl: Magento_Customer::group' },
    { name: 'deleteTerms', method: 'DELETE', path: '/V1/redington-termsconditions/termsconditions/:termsconditionsId', auth: 'acl: Magento_Customer::group' }
  ],
  domainBasedOutOfStockControl: [
    { name: 'getDomainList', method: 'GET', path: '/V1/redington/outofstock/domain-list', auth: 'anonymous' }
  ],
  getInTouch: [
    { name: 'setEnquiryData', method: 'POST', path: '/V1/set-enquiry-data/setEnquiryData/', auth: 'self' }
  ],
  urlCrypto: [
    { name: 'encrypt', method: 'POST', path: '/V1/url/encrypt', auth: 'anonymous' },
    { name: 'decrypt', method: 'POST', path: '/V1/url/decrypt', auth: 'anonymous' }
  ],
  homeVideo: [
    { name: 'searchHomeVideos', method: 'GET', path: '/V1/redington-homevideo/homevideo/search', auth: 'self' }
  ],
  orders: [
    { name: 'listOrders', method: 'GET', path: '/orders', auth: 'admin token' },
    { name: 'getOrder', method: 'GET', path: '/orders/:orderId', auth: 'admin token' }
  ]
};

export type MagentoEndpointGroupKey = keyof typeof magentoB2cEndpoints;
