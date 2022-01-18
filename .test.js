const generator = require('./dist/index').generator
;(async () => {
    const code = await generator({
        classes: {
            BackofficeUser:
                'preAuthorizer: auth.preAuthorizer\nmethods:\n    - method: createUser\n      sync: true\n      steps:\n          - id: default\n            handler: auth.createUser\n    - method: signIn\n      sync: true\n      readonly: true\n      steps:\n          - id: default\n            handler: auth.signIn\n    - method: updatePassword\n      sync: true\n      steps:\n          - id: default\n            handler: auth.updatePassword\n',
            CDH: 'getInstanceId: index.getInstanceId\nmethods:\n  - method: query\n    inputModel: QueryUserInput\n    outputModel: QueryUserOutput\n    sync: true\n    readonly: true\n    steps:\n        - id: default\n          handler: index.query\n',
            MsisdnAuthenticator:
                'preAuthorizer: index.preAuthorizer\ninit: \n  inputModel: GetMsisdnAuthInput\n  handler: index.init\ngetState: index.getState\ngetInstanceId: index.getInstanceId\nmethods:\n    - method: sendOtp\n      tag: otp\n      sync: true\n      steps:\n          - id: default\n            handler: index.sendOtp\n\n    - method: validateOtp\n      inputModel: ValidateOtpInput\n      tag: otp\n      sync: true\n      steps:\n          - id: default\n            handler: index.validateOtp\n\n    - method: signup\n      tag: signup\n      inputModel: SignUpInput\n      sync: true\n      steps:\n          - id: default\n            handler: index.signup\n',
            Places: 'getInstanceId: index.getInstanceId\nmethods:\n  - method: getPlaces\n    sync: true\n    readonly: true\n    steps:\n        - id: default\n          handler: index.getPlaces\n',
            StoreLocator:
                'preAuthorizer: index.preAuthorizer\ninit: index.init\ngetState: index.getState\ngetInstanceId: index.getInstanceId\nmethods:\n  - method: upsertStore\n    sync: true\n    steps:\n        - id: default\n          handler: store.upsertStore\n  - method: removeStore\n    sync: true\n    steps:\n        - id: default\n          handler: store.removeStore\n  - method: locate\n    sync: true\n    readonly: true\n    steps:\n        - id: default\n          handler: store.locate\n',
            User: 'preAuthorizer: auth.preAuthorizer\ninit: index.init\ndependencies:\n  - utils\ngetState: index.getState\nmethods:\n\n    - method: updateEmail\n      tag: auth\n      sync: true\n      steps:\n          - id: default\n            handler: auth.updateEmail\n\n    - method: validateEmail\n      tag: auth\n      sync: true\n      steps:\n          - id: default\n            handler: auth.validateEmail\n\n    - method: signup\n      inputModel: UserSignUpInput\n      tag: profile\n      sync: true\n      steps:\n          - id: default\n            handler: profile.signup\n\n\n    - method: setAvatar\n      tag: profile\n      sync: true\n      steps:\n          - id: default\n            handler: profile.setAvatar\n\n\n    - method: getAvatar\n      tag: profile\n      sync: true\n      steps:\n          - id: default\n            handler: profile.getAvatar\n\n\n    - method: updateProfile\n      inputModel : UpdateProfileInput\n      tag: profile\n      sync: true\n      steps:\n          - id: default\n            handler: profile.updateProfile\n\n\n    - method: getProfile\n      tag: profile\n      sync: true\n      readOnly: true\n      steps:\n          - id: default\n            handler: profile.getProfile\n\n    - method: clearAddresses\n      tag: profile\n      sync: true\n      steps:\n          - id: default\n            handler: profile.clearAddresses\n\n    - method: isSignupComplete\n      tag: profile\n      sync: true\n      steps:\n          - id: default\n            handler: profile.isSignupComplete\n\n    - method: upsertAddress\n      tag: address\n      inputModel: Address\n      sync: true\n      steps:\n          - id: default\n            handler: address.upsertAddress\n\n    - method: upsertInvoiceAddress\n      tag: address\n      inputModel: Address\n      sync: true\n      steps:\n          - id: default\n            handler: address.upsertInvoiceAddress\n\n    - method: removeAddress\n      tag: address\n      inputModel: RemoveAddressInput\n      sync: true\n      steps:\n          - id: default\n            handler: address.removeAddress\n',
        },
        models: {
            Address: {
                properties: {
                    addressId: { type: 'string' },
                    title: { type: 'string', minLength: 1 },
                    nameSurname: { type: 'string' },
                    alternativeRecipient: { type: 'string' },
                    country: { type: 'string' },
                    city: { type: 'string' },
                    district: { type: 'string' },
                    neighborhood: { type: 'string' },
                    street: { type: 'string' },
                    building: { type: 'string' },
                    door: { type: 'string' },
                    floor: { type: 'string' },
                    postalCode: { type: 'string' },
                    phoneNumber: { type: 'string' },
                    location: { $ref: '#/$defs/Location' },
                    invoiceType: { enum: ['NONE', 'E-ARSIV', 'INDIVIDUAL', 'CORPORATE'], type: 'string', default: 'NONE' },
                    identityNo: { type: 'string', minLength: 1 },
                    companyName: { type: 'string', minLength: 1 },
                    taxNo: { type: 'string', minLength: 1 },
                    taxOffice: { type: 'string', minLength: 1 },
                    text: { type: 'string' },
                    createdAt: { type: 'number' },
                    updatedAt: { type: 'number' },
                },
                allOf: [
                    {
                        if: { properties: { invoiceType: { const: 'NONE' } } },
                        then: { required: ['title', 'country', 'city', 'district', 'neighborhood', 'street', 'building', 'door', 'floor'] },
                    },
                    {
                        if: { properties: { invoiceType: { const: 'E-ARSIV' } } },
                        then: {
                            required: ['title', 'country', 'city', 'district', 'neighborhood', 'street', 'building', 'door', 'floor', 'identityNo'],
                        },
                    },
                    {
                        if: { properties: { invoiceType: { const: 'CORPORATE' } } },
                        then: {
                            required: [
                                'title',
                                'country',
                                'city',
                                'district',
                                'neighborhood',
                                'street',
                                'building',
                                'door',
                                'floor',
                                'identityNo',
                                'companyName',
                                'taxNo',
                                'taxOffice',
                            ],
                        },
                    },
                ],
                additionalProperties: false,
                type: 'object',
            },
            GetMsisdnAuthInput: {
                properties: { msisdn: { type: 'string', minLength: 12, maxLength: 12, pattern: '^[0-9]*$' } },
                required: ['msisdn'],
                type: 'object',
            },
            IsSignUpCompleteOutput: {
                properties: { isSignupComplete: { type: 'boolean' }, userId: { type: 'string' } },
                required: ['userId', 'isSignupComplete'],
                type: 'object',
            },
            Location: { properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'], type: 'object' },
            QueryUserInput: { properties: { msisdn: { type: 'string', minLength: 10, maxLength: 10 } }, required: ['msisdn'], type: 'object' },
            QueryUserOutput: { properties: { customerId: { type: 'string' } }, required: ['customerId'], type: 'object' },
            RemoveAddressInput: { properties: { addressId: { type: 'string', minLength: 1 } }, required: ['addressId'], type: 'object' },
            SignUpInput: {
                properties: {
                    signupToken: { type: 'string', minLength: 1 },
                    firstName: { type: 'string', minLength: 2 },
                    lastName: { type: 'string', minLength: 2 },
                    email: { type: 'string', format: 'email' },
                    birthdate: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['male', 'female'] },
                    contactCampaign: { type: 'boolean', default: false },
                    address: { $ref: '#/$defs/Address' },
                },
                required: ['firstName', 'lastName', 'email', 'birthdate', 'gender', 'address'],
                type: 'object',
            },
            SigninInput: { properties: { password: { type: 'string', minLenght: 8 } }, required: ['password'], type: 'object' },
            UpdateEmailInput: { properties: { email: { type: 'string', format: 'email' } }, required: ['email'], type: 'object' },
            UpdatePasswordInput: {
                properties: { oldPassword: { type: 'string', minLenght: 8 }, password: { type: 'string', minLenght: 8 } },
                required: ['oldPassword', 'password'],
                type: 'object',
            },
            UpdateProfileInput: {
                properties: {
                    firstName: { type: 'string', minLength: 2 },
                    lastName: { type: 'string', minLength: 2 },
                    birthdate: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['male', 'female'] },
                    contactCampaign: { type: 'boolean', default: false },
                },
                required: ['firstName', 'lastName', 'birthdate', 'gender'],
                type: 'object',
            },
            UserSignUpInput: {
                properties: {
                    firstName: { type: 'string', minLength: 2 },
                    lastName: { type: 'string', minLength: 2 },
                    email: { type: 'string', format: 'email' },
                    msisdn: { type: 'string', minLength: 12, maxLength: 12 },
                    birthdate: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['male', 'female'] },
                    contactCampaign: { type: 'boolean', default: false },
                },
                required: ['firstName', 'lastName', 'email', 'msisdn', 'birthdate', 'gender'],
                type: 'object',
            },
            ValidateOtpInput: { properties: { otp: { type: 'string', minLength: 6, maxLength: 6 } }, required: ['otp'], type: 'object' },
        },
    })
    console.log(code)
})()