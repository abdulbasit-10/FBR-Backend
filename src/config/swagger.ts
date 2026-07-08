import swaggerJsdoc from 'swagger-jsdoc';
import config from '../config';

/**
 * Minimal but useful OpenAPI 3 spec. Keeps a bearer-auth scheme and
 * a shared success envelope so ad-hoc endpoints can just add `@openapi`
 * JSDoc later without re-declaring the boilerplate.
 */
const spec: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: `${config.appName} API`,
      version: '1.0.0',
      description:
        'REST API for the FBR / PRAL Digital Invoicing backend.\n\n' +
        'All authenticated endpoints require `Authorization: Bearer <access_token>`.',
    },
    servers: [{ url: config.apiPrefix, description: 'Current server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {},
            meta: { type: 'object' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {},
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Companies' },
      { name: 'Customers' },
      { name: 'Products' },
      { name: 'Invoices' },
      { name: 'Dashboard' },
      { name: 'Reports' },
      { name: 'Lookup' },
      { name: 'Users & Roles' },
      { name: 'Settings' },
      { name: 'Notifications' },
      { name: 'API Logs' },
      { name: 'FBR Tokens' },
    ],
    paths: {
      // ── Auth ────────────────────────────────────────────────────────────────
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email & password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@example.com' },
                    password: { type: 'string', example: 'Admin@12345' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Returns accessToken + refreshToken' } },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'New accessToken' } },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout (invalidate refresh token)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/auth/change-password': {
        post: {
          tags: ['Auth'],
          summary: 'Change own password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['oldPassword', 'newPassword'],
                  properties: {
                    oldPassword: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8, example: 'NewPass@123' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Password changed' } },
        },
      },
      // ── Companies ───────────────────────────────────────────────────────────
      '/companies': {
        get: {
          tags: ['Companies'],
          summary: 'List companies',
          responses: { 200: { description: 'OK' } },
        },
        post: {
          tags: ['Companies'],
          summary: 'Create company (SuperAdmin)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'businessName', 'ntn', 'address', 'province'],
                  properties: {
                    name: { type: 'string', example: 'Acme Pvt Ltd' },
                    businessName: { type: 'string', example: 'Acme Business' },
                    ntn: { type: 'string', example: '1234567', description: '7-digit NTN or 13-digit CNIC' },
                    address: { type: 'string', example: '123 Main St, Karachi' },
                    province: { type: 'string', example: 'Sindh' },
                    phone: { type: 'string', example: '0300-1234567' },
                    email: { type: 'string', format: 'email' },
                    salesTaxRegNo: { type: 'string' },
                    fbrEnvironment: { type: 'string', enum: ['sandbox', 'production', 'both'], default: 'sandbox' },
                    isActive: { type: 'boolean', default: true },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/companies/{uuid}': {
        get: {
          tags: ['Companies'],
          summary: 'Get company by UUID',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Companies'],
          summary: 'Update company',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    businessName: { type: 'string' },
                    ntn: { type: 'string' },
                    address: { type: 'string' },
                    province: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    salesTaxRegNo: { type: 'string' },
                    fbrEnvironment: { type: 'string', enum: ['sandbox', 'production', 'both'] },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Companies'],
          summary: 'Delete company (SuperAdmin)',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      // ── Customers ───────────────────────────────────────────────────────────
      '/customers': {
        get: {
          tags: ['Customers'],
          summary: 'List customers',
          responses: { 200: { description: 'OK' } },
        },
        post: {
          tags: ['Customers'],
          summary: 'Create customer',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['businessName', 'registrationType', 'province', 'address'],
                  properties: {
                    businessName: { type: 'string', example: 'XYZ Corp' },
                    ntnCnic: { type: 'string', example: '1234567', description: '7-digit NTN or 13-digit CNIC (required if Registered)' },
                    registrationType: { type: 'string', enum: ['Registered', 'Unregistered'] },
                    province: { type: 'string', example: 'Punjab' },
                    address: { type: 'string', example: '45 Garden Town, Lahore' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    isActive: { type: 'boolean', default: true },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/customers/{uuid}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer by UUID',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Customers'],
          summary: 'Update customer',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    businessName: { type: 'string' },
                    ntnCnic: { type: 'string' },
                    registrationType: { type: 'string', enum: ['Registered', 'Unregistered'] },
                    province: { type: 'string' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Customers'],
          summary: 'Delete customer',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      // ── Products ────────────────────────────────────────────────────────────
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'List products',
          responses: { 200: { description: 'OK' } },
        },
        post: {
          tags: ['Products'],
          summary: 'Create product',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'hsCode', 'uom', 'saleType', 'rate'],
                  properties: {
                    name: { type: 'string', example: 'Widget A' },
                    description: { type: 'string' },
                    hsCode: { type: 'string', example: '0101.2100' },
                    uom: { type: 'string', example: 'KGS' },
                    saleType: { type: 'string', example: 'Goods at standard rate (default)' },
                    rate: { type: 'string', example: '18%' },
                    rateValue: { type: 'number', example: 18 },
                    sroScheduleNo: { type: 'string' },
                    sroItemSerialNo: { type: 'string' },
                    unitPrice: { type: 'number', example: 1000 },
                    fixedNotifiedValueOrRetailPrice: { type: 'number', default: 0 },
                    isActive: { type: 'boolean', default: true },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/products/{uuid}': {
        get: {
          tags: ['Products'],
          summary: 'Get product by UUID',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Products'],
          summary: 'Update product',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    hsCode: { type: 'string' },
                    uom: { type: 'string' },
                    saleType: { type: 'string' },
                    rate: { type: 'string' },
                    rateValue: { type: 'number' },
                    sroScheduleNo: { type: 'string' },
                    sroItemSerialNo: { type: 'string' },
                    unitPrice: { type: 'number' },
                    fixedNotifiedValueOrRetailPrice: { type: 'number' },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Products'],
          summary: 'Delete product',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      // ── Invoices ────────────────────────────────────────────────────────────
      '/invoices': {
        get: {
          tags: ['Invoices'],
          summary: 'List invoices',
          responses: { 200: { description: 'OK' } },
        },
        post: {
          tags: ['Invoices'],
          summary: 'Create invoice (draft)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['customerId', 'invoiceDate', 'items'],
                  properties: {
                    customerId: { type: 'integer', example: 1 },
                    invoiceType: { type: 'string', enum: ['Sale Invoice', 'Debit Note'], default: 'Sale Invoice' },
                    invoiceDate: { type: 'string', format: 'date', example: '2026-07-07' },
                    invoiceRefNo: { type: 'string', description: 'Required for Debit Note (22 or 28 digits)' },
                    scenarioId: { type: 'string', example: 'SN001', description: 'Sandbox scenario ID' },
                    environment: { type: 'string', enum: ['sandbox', 'production'], default: 'sandbox' },
                    notes: { type: 'string' },
                    items: {
                      type: 'array',
                      minItems: 1,
                      items: {
                        type: 'object',
                        required: ['hsCode', 'productDescription', 'rate', 'uom', 'quantity', 'valueSalesExcludingST', 'salesTaxApplicable', 'saleType'],
                        properties: {
                          productId: { type: 'integer' },
                          hsCode: { type: 'string', example: '0101.2100' },
                          productDescription: { type: 'string', example: 'Widget A' },
                          rate: { type: 'string', example: '18%' },
                          uom: { type: 'string', example: 'KGS' },
                          quantity: { type: 'number', example: 10 },
                          totalValues: { type: 'number', example: 11800 },
                          valueSalesExcludingST: { type: 'number', example: 10000 },
                          fixedNotifiedValueOrRetailPrice: { type: 'number', default: 0 },
                          salesTaxApplicable: { type: 'number', example: 1800 },
                          salesTaxWithheldAtSource: { type: 'number', default: 0 },
                          extraTax: { type: 'number', default: 0 },
                          furtherTax: { type: 'number', default: 0 },
                          sroScheduleNo: { type: 'string' },
                          fedPayable: { type: 'number', default: 0 },
                          discount: { type: 'number', default: 0 },
                          saleType: { type: 'string', example: 'Goods at standard rate (default)' },
                          sroItemSerialNo: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/invoices/{uuid}': {
        get: {
          tags: ['Invoices'],
          summary: 'Get invoice by UUID',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Invoices'],
          summary: 'Update invoice (draft/failed only)',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    customerId: { type: 'integer' },
                    invoiceType: { type: 'string', enum: ['Sale Invoice', 'Debit Note'] },
                    invoiceDate: { type: 'string', format: 'date' },
                    invoiceRefNo: { type: 'string' },
                    scenarioId: { type: 'string' },
                    environment: { type: 'string', enum: ['sandbox', 'production'] },
                    notes: { type: 'string' },
                    items: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Invoices'],
          summary: 'Delete invoice (draft/cancelled only)',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/invoices/{uuid}/submit': {
        post: {
          tags: ['Invoices'],
          summary: 'Submit an invoice to FBR (validate | post)',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { mode: { type: 'string', enum: ['validate', 'post'], default: 'post' } },
                },
              },
            },
          },
          responses: { 200: { description: 'OK' } },
        },
      },
      '/invoices/{uuid}/enqueue': {
        post: {
          tags: ['Invoices'],
          summary: 'Queue invoice for asynchronous FBR submission',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 202: { description: 'Accepted' } },
        },
      },
      // ── Dashboard ───────────────────────────────────────────────────────────
      '/dashboard': {
        get: {
          tags: ['Dashboard'],
          summary: 'Cards, charts & recent invoices',
          responses: { 200: { description: 'OK' } },
        },
      },
      // ── Reports ─────────────────────────────────────────────────────────────
      '/reports/daily': {
        get: {
          tags: ['Reports'],
          summary: 'Daily sales/tax report',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/reports/monthly': {
        get: {
          tags: ['Reports'],
          summary: 'Monthly sales/tax report',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/reports/tax': {
        get: {
          tags: ['Reports'],
          summary: 'Tax report grouped by rate',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/reports/sales': {
        get: {
          tags: ['Reports'],
          summary: 'Sales report grouped by customer or product',
          responses: { 200: { description: 'OK' } },
        },
      },
      // ── Lookup ──────────────────────────────────────────────────────────────
      '/lookup/provinces': {
        get: {
          tags: ['Lookup'],
          summary: 'FBR Provinces (cached)',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/lookup/hs-codes': {
        get: {
          tags: ['Lookup'],
          summary: 'FBR HS Codes (cached, ?q= to search)',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/lookup/uoms': {
        get: {
          tags: ['Lookup'],
          summary: 'FBR UOM list (cached)',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/lookup/rates': {
        get: {
          tags: ['Lookup'],
          summary: 'FBR sale-type → rate mapping',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/lookup/registration-type': {
        get: {
          tags: ['Lookup'],
          summary: 'Get registration type (Registered/Unregistered) for NTN/CNIC',
          parameters: [
            { name: 'registrationNo', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/lookup/sync': {
        post: {
          tags: ['Lookup'],
          summary: 'Refresh local cache from FBR (all datasets)',
          responses: { 200: { description: 'OK' } },
        },
      },
      // ── Users & Roles ────────────────────────────────────────────────────────
      '/admin/users': {
        get: {
          tags: ['Users & Roles'],
          summary: 'List users',
          responses: { 200: { description: 'OK' } },
        },
        post: {
          tags: ['Users & Roles'],
          summary: 'Create user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password', 'roleId'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', minLength: 8, example: 'Pass@1234' },
                    phone: { type: 'string' },
                    roleId: { type: 'integer', example: 2 },
                    companyId: { type: 'integer' },
                    isActive: { type: 'boolean', default: true },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/admin/users/{uuid}': {
        get: {
          tags: ['Users & Roles'],
          summary: 'Get user by UUID',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Users & Roles'],
          summary: 'Update user',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    roleId: { type: 'integer' },
                    companyId: { type: 'integer' },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Users & Roles'],
          summary: 'Delete user',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/admin/users/{uuid}/reset-password': {
        post: {
          tags: ['Users & Roles'],
          summary: 'Reset user password (admin)',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['newPassword'],
                  properties: {
                    newPassword: { type: 'string', minLength: 8, example: 'NewPass@123' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Password reset' } },
        },
      },
      '/admin/roles': {
        get: {
          tags: ['Users & Roles'],
          summary: 'List roles',
          responses: { 200: { description: 'OK' } },
        },
        post: {
          tags: ['Users & Roles'],
          summary: 'Create role',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Manager' },
                    description: { type: 'string' },
                    permissionIds: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/admin/roles/{uuid}': {
        get: {
          tags: ['Users & Roles'],
          summary: 'Get role by UUID',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Users & Roles'],
          summary: 'Update role',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    permissionIds: { type: 'array', items: { type: 'integer' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Users & Roles'],
          summary: 'Delete role',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/admin/permissions': {
        get: {
          tags: ['Users & Roles'],
          summary: 'List all permissions',
          responses: { 200: { description: 'OK' } },
        },
      },
      // ── Settings ─────────────────────────────────────────────────────────────
      '/settings': {
        get: {
          tags: ['Settings'],
          summary: 'List company settings',
          responses: { 200: { description: 'OK' } },
        },
        post: {
          tags: ['Settings'],
          summary: 'Upsert setting',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['key', 'value'],
                  properties: {
                    key: { type: 'string', example: 'invoice_prefix' },
                    value: { example: 'INV' },
                    scope: { type: 'string', enum: ['global', 'company', 'user'], default: 'company' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'OK' } },
        },
      },
      // ── Notifications ────────────────────────────────────────────────────────
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'List my notifications',
          responses: { 200: { description: 'OK' } },
        },
      },
      // ── API Logs ─────────────────────────────────────────────────────────────
      '/api-logs': {
        get: {
          tags: ['API Logs'],
          summary: 'List all API logs',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api-logs/errors': {
        get: {
          tags: ['API Logs'],
          summary: 'List only error logs (>= 400)',
          responses: { 200: { description: 'OK' } },
        },
      },
      // ── FBR Tokens ───────────────────────────────────────────────────────────
      '/fbr-tokens': {
        get: {
          tags: ['FBR Tokens'],
          summary: 'List company FBR tokens',
          responses: { 200: { description: 'OK' } },
        },
        post: {
          tags: ['FBR Tokens'],
          summary: 'Upsert an FBR bearer token (sandbox|production)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['environment', 'token'],
                  properties: {
                    environment: { type: 'string', enum: ['sandbox', 'production'] },
                    token: { type: 'string', example: 'eyJhbGciOiJSUzI1NiJ9...' },
                    expiresAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(spec);
