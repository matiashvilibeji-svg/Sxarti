-- Sxarti Seed Data — Georgian Test Data
-- NOTE: Replace owner_id values with actual auth.users UUIDs after signup.
-- These placeholder UUIDs will NOT work with RLS enabled.

-- Placeholder UUIDs
-- Tenant 1 owner: 00000000-0000-0000-0000-000000000001
-- Tenant 2 owner: 00000000-0000-0000-0000-000000000002
-- Tenant 1 id:    aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Tenant 2 id:    bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

-- ============================================================
-- TENANTS
-- ============================================================

INSERT INTO tenants (id, owner_id, business_name, bot_persona_name, bot_tone, subscription_plan, working_hours, payment_details, trial_ends_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001',
   'ტექნო უსაფრთხოება', 'ანა', 'friendly', 'business',
   '{"mon": "09:00-18:00", "tue": "09:00-18:00", "wed": "09:00-18:00", "thu": "09:00-18:00", "fri": "09:00-18:00", "sat": "10:00-15:00", "sun": null}',
   '{"bank": "თიბისი", "account": "GE00TB0000000000000001", "accept_cash": true}',
   now() + interval '14 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000002',
   'სმარტ ჰაუსი', 'გიორგი', 'formal', 'starter',
   '{"mon": "10:00-19:00", "tue": "10:00-19:00", "wed": "10:00-19:00", "thu": "10:00-19:00", "fri": "10:00-19:00", "sat": "11:00-16:00", "sun": null}',
   '{"bank": "საქართველოს ბანკი", "account": "GE00BG0000000000000002", "accept_cash": true}',
   now() + interval '14 days');

-- ============================================================
-- PRODUCTS — ტექნო უსაფრთხოება (Tenant 1)
-- ============================================================

INSERT INTO products (tenant_id, name, description, price, stock_quantity, images, is_active)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'HD კამერა 2MP', '2 მეგაპიქსელიანი HD კამერა, ღამის ხედვით, წყალგამძლე IP66',
   145.00, 30, ARRAY['https://example.com/cam-2mp.jpg'], true),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '4MP კამერა Pro', '4 მეგაპიქსელიანი პროფესიონალური კამერა, 30მ ღამის ხედვა',
   265.00, 20, ARRAY['https://example.com/cam-4mp.jpg'], true),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '8 არხიანი DVR', '8 არხიანი ციფრული ვიდეო ჩამწერი, H.265+, 2TB HDD',
   420.00, 15, ARRAY['https://example.com/dvr-8ch.jpg'], true),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '4 კამერიანი კომპლექტი', '4 HD კამერა + 4 არხიანი DVR + 1TB HDD + კაბელები',
   890.00, 10, ARRAY['https://example.com/kit-4cam.jpg'], true),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'სმარტ ზარის კამერა', 'WiFi ზარის კამერა, ორმხრივი აუდიო, მობილურთან დაკავშირება',
   195.00, 25, ARRAY['https://example.com/doorbell.jpg'], true);

-- ============================================================
-- PRODUCTS — სმარტ ჰაუსი (Tenant 2)
-- ============================================================

INSERT INTO products (tenant_id, name, description, price, stock_quantity, images, is_active)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'სმარტ ნათურა RGB', 'WiFi ნათურა, 16 მილიონი ფერი, ხმოვანი მართვა',
   35.00, 100, ARRAY['https://example.com/smart-bulb.jpg'], true),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'სმარტ თერმოსტატი', 'პროგრამირებადი თერმოსტატი, WiFi, ენერგოეფექტური',
   280.00, 12, ARRAY['https://example.com/thermostat.jpg'], true),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'მოძრაობის სენსორი', 'PIR სენსორი, Zigbee, 120° კუთხე, 8მ რადიუსი',
   45.00, 50, ARRAY['https://example.com/motion-sensor.jpg'], true),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'სმარტ საკეტი', 'თითის ანაბეჭდით, PIN კოდით და აპით გახსნა',
   520.00, 8, ARRAY['https://example.com/smart-lock.jpg'], true),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'უსაფრთხოების სისტემა Pro', 'სრული სახლის სისტემა: ჰაბი + 4 სენსორი + სირენა',
   1150.00, 5, ARRAY['https://example.com/security-system.jpg'], true);

-- ============================================================
-- DELIVERY ZONES — თბილისის რაიონები (Tenant 1)
-- ============================================================

INSERT INTO delivery_zones (tenant_id, zone_name, fee, estimated_days, is_active)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ვაკე', 5.00, '1 დღე', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'საბურთალო', 5.00, '1 დღე', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ისანი', 7.00, '1-2 დღე', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'გლდანი', 8.00, '1-2 დღე', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'დიდუბე', 6.00, '1 დღე', true);

-- ============================================================
-- DELIVERY ZONES — თბილისის რაიონები (Tenant 2)
-- ============================================================

INSERT INTO delivery_zones (tenant_id, zone_name, fee, estimated_days, is_active)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ვაკე', 0.00, '1 დღე', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'საბურთალო', 0.00, '1 დღე', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ისანი', 5.00, '1-2 დღე', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'გლდანი', 5.00, '1-2 დღე', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'დიდუბე', 3.00, '1 დღე', true);

-- ============================================================
-- FAQs — ტექნო უსაფრთხოება (Tenant 1)
-- ============================================================

INSERT INTO faqs (tenant_id, question, answer)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'რამდენ ხანში მოხდება მიწოდება?',
   'თბილისში მიწოდება ხდება 1-2 სამუშაო დღეში. რეგიონებში 2-4 სამუშაო დღეში.'),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'არის თუ არა გარანტია?',
   'ყველა პროდუქტზე მოქმედებს 1 წლიანი გარანტია. პროფესიონალურ კომპლექტებზე — 2 წელი.'),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'მონტაჟს აკეთებთ?',
   'დიახ, ჩვენ ვაკეთებთ პროფესიონალურ მონტაჟს. ფასი დამოკიდებულია კამერების რაოდენობაზე. დაგვიკავშირდით დეტალებისთვის.');
