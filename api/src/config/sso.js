/**
 * Enterprise SSO Configuration
 * Support for SAML 2.0 and OAuth 2.0 authentication
 * @module config/sso
 */

const ssoConfig = {
    // SAML 2.0 Configuration
    saml: {
        enabled: process.env.SAML_ENABLED === "true",
        entityID: process.env.SAML_ENTITY_ID || "infamous-freight",
        assertionConsumerServiceURL:
            process.env.SAML_ACS_URL || "http://localhost:4000/api/auth/saml/callback",
        identityProviders: {
            okta: {
                singleSignOnService: {
                    url: process.env.OKTA_SSO_URL || "",
                    binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
                },
                certificates: [process.env.OKTA_CERT || ""],
            },
            azureAD: {
                singleSignOnService: {
                    url: process.env.AZURE_SSO_URL || "",
                    binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
                },
                certificates: [process.env.AZURE_CERT || ""],
            },
            generic: {
                singleSignOnService: {
                    url: process.env.GENERIC_SAML_URL || "",
                    binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
                },
                certificates: [process.env.GENERIC_SAML_CERT || ""],
            },
        },
    },

    // OAuth 2.0 Configuration
    oauth: {
        enabled: true,
        providers: {
            google: {
                clientID: process.env.GOOGLE_CLIENT_ID || "",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
                callbackURL: "http://localhost:4000/api/auth/google/callback",
                scope: ["profile", "email"],
                authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
                tokenURL: "https://www.googleapis.com/oauth2/v4/token",
            },
            microsoft: {
                clientID: process.env.MICROSOFT_CLIENT_ID || "",
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
                callbackURL: "http://localhost:4000/api/auth/microsoft/callback",
                scope: ["user.read"],
                authorizationURL: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                tokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            },
            github: {
                clientID: process.env.GITHUB_CLIENT_ID || "",
                clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
                callbackURL: "http://localhost:4000/api/auth/github/callback",
                scope: ["user:email"],
                authorizationURL: "https://github.com/login/oauth/authorize",
                tokenURL: "https://github.com/login/oauth/access_token",
            },
        },
    },

    // JWT Configuration for SSO
    jwt: {
        algorithm: "HS256",
        expiresIn: "7d",
        refreshExpiresIn: "30d",
        issuer: "infamous-freight",
        audience: "infamous-freight-app",
    },

    // Session Configuration
    session: {
        name: "infamous.sid",
        secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
    },

    // OIDC (OpenID Connect) Configuration
    oidc: {
        enabled: process.env.OIDC_ENABLED === "true",
        issuer: process.env.OIDC_ISSUER || "",
        clientID: process.env.OIDC_CLIENT_ID || "",
        clientSecret: process.env.OIDC_CLIENT_SECRET || "",
        scope: "openid profile email",
        responseType: "code",
        authorizationMethod: "query",
    },

    // Multi-tenant SSO
    multiTenant: {
        enabled: process.env.MULTI_TENANT_SSO === "true",
        defaultTenant: "default",
        tenants: {
            default: {
                name: "Infamous Freight",
                samlEnabled: true,
                oauthProviders: ["google", "microsoft"],
            },
            enterprise: {
                name: "Enterprise Tenant",
                samlEnabled: true,
                oauthProviders: ["microsoft"],
                customDomain: process.env.ENTERPRISE_DOMAIN || "",
            },
        },
    },

    // User provisioning settings
    provisioning: {
        autoCreate: true,
        autoSync: true,
        attributeMapping: {
            id: "urn:oid:0.9.2342.19200300.100.1.3",
            email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
            name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
            surname: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
            role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
        },
    },

    // Security settings
    security: {
        enableMFA: process.env.ENABLE_MFA === "true",
        mfaMethod: "totp", // totp, sms, email
        passwordPolicy: {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
        },
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        lockoutAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
    },

    // Utility functions
    getProvider: function (providerName) {
        return this.oauth.providers[providerName] || null;
    },

    isSamlEnabled: function () {
        return this.saml.enabled;
    },

    isOAuthEnabled: function () {
        return this.oauth.enabled;
    },

    getEnabledOAuthProviders: function () {
        return Object.keys(this.oauth.providers).filter(
            (p) => this.oauth.providers[p].clientID,
        );
    },

    getTenantConfig: function (tenantId = "default") {
        return this.multiTenant.tenants[tenantId] || this.multiTenant.tenants.default;
    },
};

module.exports = ssoConfig;
