"use strict";
// Magento B2C Redington API endpoints exposed for the Medusa storefront.
// Each entry includes HTTP method, Magento path, and authentication expectations.
Object.defineProperty(exports, "__esModule", { value: true });
exports.magentoB2cEndpoints = void 0;
exports.magentoB2cEndpoints = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpbGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGkvYXBpbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEseUVBQXlFO0FBQ3pFLGtGQUFrRjs7O0FBYXJFLFFBQUEsbUJBQW1CLEdBQTBCO0lBQ3hELGFBQWEsRUFBRTtRQUNiLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLHNDQUFzQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUU7S0FDOUc7SUFDRCx5QkFBeUIsRUFBRTtRQUN6QixFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtLQUNwRjtJQUNELGVBQWUsRUFBRTtRQUNmLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLG9DQUFvQyxFQUFFLElBQUksRUFBRSxpREFBaUQsRUFBRTtLQUNqSjtJQUNELG1CQUFtQixFQUFFO1FBQ25CLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSx5Q0FBeUMsRUFBRSxJQUFJLEVBQUUsa0NBQWtDLEVBQUU7UUFDcEksRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLHlDQUF5QyxFQUFFLElBQUksRUFBRSxrQ0FBa0MsRUFBRTtLQUNySTtJQUNELFNBQVMsRUFBRTtRQUNULEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO0tBQ3RGO0lBQ0QsU0FBUyxFQUFFO1FBQ1QsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtLQUNyRztJQUNELFdBQVcsRUFBRTtRQUNYLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLG1DQUFtQyxFQUFFLElBQUksRUFBRSx5Q0FBeUMsRUFBRTtLQUN2STtJQUNELGdCQUFnQixFQUFFO1FBQ2hCLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLDZCQUE2QixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUU7S0FDMUc7SUFDRCxpQkFBaUIsRUFBRTtRQUNqQixFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSwrQkFBK0IsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO1FBQ3JHLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLCtCQUErQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUU7UUFDdEcsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtLQUMvRjtJQUNELGtCQUFrQixFQUFFO1FBQ2xCLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLHVDQUF1QyxFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRTtRQUNsSSxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO0tBQzVGO0lBQ0Qsd0JBQXdCLEVBQUU7UUFDeEIsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUU7UUFDN0YsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsa0NBQWtDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUMzRyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxtQ0FBbUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO1FBQ3hHLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7S0FDdEc7SUFDRCxPQUFPLEVBQUU7UUFDUCxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtLQUNyRjtJQUNELFdBQVcsRUFBRTtRQUNYLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUU7S0FDNUY7SUFDRCxxQkFBcUIsRUFBRTtRQUNyQixFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUNqRixFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUM1RixFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtLQUN6RjtJQUNELGdCQUFnQixFQUFFO1FBQ2hCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLDhCQUE4QixFQUFFO1FBQy9GLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsOEJBQThCLEVBQUU7S0FDcEc7SUFDRCx3QkFBd0IsRUFBRTtRQUN4QixFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsdURBQXVELEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1FBQ3ZJLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLDhEQUE4RCxFQUFFLElBQUksRUFBRSw4REFBOEQsRUFBRTtRQUN0TCxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUseUVBQXlFLEVBQUUsSUFBSSxFQUFFLDhEQUE4RCxFQUFFO1FBQzVMLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSx5RUFBeUUsRUFBRSxJQUFJLEVBQUUsZ0VBQWdFLEVBQUU7UUFDak0sRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLHlFQUF5RSxFQUFFLElBQUksRUFBRSxnRUFBZ0UsRUFBRTtLQUNyTTtJQUNELFlBQVksRUFBRTtRQUNaLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLHlDQUF5QyxFQUFFLElBQUksRUFBRSxnREFBZ0QsRUFBRTtRQUN2SixFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxnREFBZ0QsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO1FBQ3JILEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLHlEQUF5RCxFQUFFLElBQUksRUFBRSxnREFBZ0QsRUFBRTtRQUNuSyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSx5REFBeUQsRUFBRSxJQUFJLEVBQUUsa0RBQWtELEVBQUU7UUFDeEssRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUseURBQXlELEVBQUUsSUFBSSxFQUFFLGtEQUFrRCxFQUFFO0tBQzVLO0lBQ0QsZUFBZSxFQUFFO1FBQ2YsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLCtDQUErQyxFQUFFLElBQUksRUFBRSw4QkFBOEIsRUFBRTtRQUNwSSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsdURBQXVELEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUN2SCxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsa0VBQWtFLEVBQUUsSUFBSSxFQUFFLDhCQUE4QixFQUFFO1FBQ25KLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxrRUFBa0UsRUFBRSxJQUFJLEVBQUUsOEJBQThCLEVBQUU7UUFDdEosRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLGtFQUFrRSxFQUFFLElBQUksRUFBRSw4QkFBOEIsRUFBRTtLQUMxSjtJQUNELDRCQUE0QixFQUFFO1FBQzVCLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxzQ0FBc0MsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO0tBQzFHO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsc0NBQXNDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtLQUN2RztJQUNELFNBQVMsRUFBRTtRQUNULEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO1FBQy9FLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFO0tBQ2hGO0lBQ0QsU0FBUyxFQUFFO1FBQ1QsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsMENBQTBDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtLQUM1RztJQUNELE1BQU0sRUFBRTtRQUNOLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRTtRQUMzRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRTtLQUNuRjtDQUNGLENBQUMifQ==