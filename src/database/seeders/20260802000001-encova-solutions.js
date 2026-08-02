'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const USER_EMAIL = 'abasit3110@gmail.com';
const USER_PASSWORD = 'Basit@123';

const CUSTOMERS = [
  {
    no: 'C-000001',
    name: 'City Pharmacy',
    ntn: '3740123456789',
    reg: 'Unregistered',
    type: 'Individual',
    province: 'Punjab',
    address: 'Shop 3, Mall Road, Lahore',
    phone: '0300-1111001',
    strn: null,
  },
  {
    no: 'C-000002',
    name: 'Rehman Medical Store',
    ntn: '1350198765432',
    reg: 'Unregistered',
    type: 'Individual',
    province: 'Khyber Pakhtunkhwa',
    address: 'Namak Mandi, Peshawar',
    phone: '0333-2222002',
    strn: null,
  },
  {
    no: 'C-000003',
    name: 'Karachi Pharma Distributors',
    ntn: '4210056',
    reg: 'Registered',
    type: 'Company',
    province: 'Sindh',
    address: 'Plot 7, SITE Area, Karachi',
    phone: '021-33001234',
    strn: '4210056000',
  },
  {
    no: 'C-000004',
    name: 'Al Shifa Medicine House',
    ntn: '9999999999999',
    reg: 'Unregistered',
    type: 'Individual',
    province: 'Khyber Pakhtunkhwa',
    address: 'Cantt Bazar, Quetta Road, Peshawar',
    phone: '0344-3333003',
    strn: null,
  },
  {
    no: 'C-000005',
    name: 'National Health Supplies',
    ntn: '0001234',
    reg: 'Registered',
    type: 'Company',
    province: 'Punjab',
    address: 'Office 12, Gulberg III, Lahore',
    phone: '042-35761234',
    strn: '0001234000',
  },
  {
    no: 'C-000006',
    name: 'Baloch Medical Centre',
    ntn: '9999999999999',
    reg: 'Unregistered',
    type: 'Individual',
    province: 'Balochistan',
    address: 'Liaquat Bazaar, Quetta',
    phone: '0312-4444004',
    strn: null,
  },
  {
    no: 'C-000007',
    name: 'Punjab Drug Store',
    ntn: '3520178901234',
    reg: 'Unregistered',
    type: 'Individual',
    province: 'Punjab',
    address: 'Circular Road, Faisalabad',
    phone: '0321-5555005',
    strn: null,
  },
  {
    no: 'C-000008',
    name: 'Islamabad Healthcare Hub',
    ntn: '6110034',
    reg: 'Registered',
    type: 'Company',
    province: 'Islamabad Capital Territory',
    address: 'F-10 Markaz, Islamabad',
    phone: '051-2345678',
    strn: '6110034001',
  },
  {
    no: 'C-000009',
    name: 'Syed Brothers Pharmacy',
    ntn: '4220145678901',
    reg: 'Unregistered',
    type: 'Individual',
    province: 'Sindh',
    address: 'Burns Road, Karachi',
    phone: '0315-6666006',
    strn: null,
  },
  {
    no: 'C-000010',
    name: 'Frontier Medicines Ltd',
    ntn: '1540067',
    reg: 'Registered',
    type: 'Company',
    province: 'Khyber Pakhtunkhwa',
    address: 'Industrial Estate, Hayatabad, Peshawar',
    phone: '091-5701234',
    strn: '1540067002',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1. Create company (idempotent)
    let [[company]] = await queryInterface.sequelize.query(
      "SELECT id FROM companies WHERE name = 'Encova Solutions' LIMIT 1",
    );
    if (!company) {
      await queryInterface.bulkInsert('companies', [
        {
          uuid: randomUUID(),
          name: 'Encova Solutions',
          business_name: 'Encova Solutions (Pvt) Ltd',
          ntn: '5678901',
          address: 'Office 7, Plaza 86, Blue Area, Islamabad',
          province: 'Islamabad Capital Territory',
          phone: '+92-51-2345678',
          email: 'info@encovasolutions.com',
          sales_tax_reg_no: '0705678901234',
          fbr_environment: 'sandbox',
          is_active: true,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ]);
      [[company]] = await queryInterface.sequelize.query(
        "SELECT id FROM companies WHERE name = 'Encova Solutions' LIMIT 1",
      );
      console.log(`[seeder] Company created: Encova Solutions (id=${company.id})`);
    } else {
      console.log(`[seeder] Company already exists: Encova Solutions (id=${company.id})`);
    }
    const companyId = company.id;

    // 2. Resolve best available role (CompanyAdmin preferred, SuperAdmin fallback)
    let [[role]] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'CompanyAdmin' LIMIT 1",
    );
    if (!role) {
      [[role]] = await queryInterface.sequelize.query(
        "SELECT id FROM roles WHERE name = 'SuperAdmin' LIMIT 1",
      );
    }
    if (!role?.id) throw new Error('No admin role found — run roles seeder first');

    // 3. Create owner user (idempotent)
    const [existingUser] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { replacements: { email: USER_EMAIL } },
    );
    if (existingUser.length === 0) {
      const passwordHash = await bcrypt.hash(USER_PASSWORD, SALT_ROUNDS);
      await queryInterface.bulkInsert('users', [
        {
          uuid: randomUUID(),
          company_id: companyId,
          role_id: role.id,
          name: 'Abdul Basit',
          email: USER_EMAIL,
          password_hash: passwordHash,
          phone: '+92-300-5678901',
          is_active: true,
          last_login_at: null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ]);
      console.log(`[seeder] User created: ${USER_EMAIL}`);
    } else {
      console.log(`[seeder] User already exists: ${USER_EMAIL}`);
    }

    // 4. Create 10 customers (idempotent — skip if company already has customers)
    const [existingCustomers] = await queryInterface.sequelize.query(
      'SELECT id FROM customers WHERE company_id = :cid LIMIT 1',
      { replacements: { cid: companyId } },
    );
    if (existingCustomers.length === 0) {
      await queryInterface.bulkInsert(
        'customers',
        CUSTOMERS.map((c) => ({
          uuid: randomUUID(),
          company_id: companyId,
          business_name: c.name,
          ntn_cnic: c.ntn,
          registration_type: c.reg,
          customer_type: c.type,
          customer_no: c.no,
          strn: c.strn,
          province: c.province,
          address: c.address,
          phone: c.phone,
          email: null,
          is_active: true,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        })),
      );
      console.log(`[seeder] Created ${CUSTOMERS.length} customers for Encova Solutions`);
    } else {
      console.log('[seeder] Customers already exist — skipping');
    }
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM companies WHERE name = 'Encova Solutions' LIMIT 1",
    );
    const companyId = rows[0]?.id;
    if (companyId) {
      await queryInterface.bulkDelete('customers', { company_id: companyId }, {});
    }
    await queryInterface.bulkDelete('users', { email: USER_EMAIL }, {});
    await queryInterface.bulkDelete('companies', { name: 'Encova Solutions' }, {});
  },
};
