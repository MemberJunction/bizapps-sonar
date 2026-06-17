-- =============================================================================
-- Demo Association — seed data (DEMO SANDBOX ONLY: Sonar_Demo)
-- =============================================================================
-- ~15 members across engagement profiles so the score distribution is visibly varied:
--   M01-M04 Healthy · M05-M08 Neutral · M09-M12 At-Risk · M13-M15 Lapsed/Prospect
-- Member IDs are hardcoded (referenced below); activity rows use default IDs.
-- Re-runnable: clears the tables first (child → parent order).
-- "Now" anchor for the data ≈ 2026-06-17 (90d window ≈ since 2026-03-19; 12mo ≈ since 2025-06).
-- =============================================================================

DELETE FROM membership.Certification;
DELETE FROM membership.Payment;
DELETE FROM membership.EmailEngagement;
DELETE FROM membership.EventRegistration;
DELETE FROM membership.Member;
GO

INSERT INTO membership.Member (ID, FirstName, LastName, Email, MembershipType, Status, JoinDate, RenewalDate, ChapterRegion) VALUES
('B1000000-0000-4000-8000-000000000001','Ava','Chen','ava.chen@example.org','Individual','Active','2019-02-10','2026-09-01','West'),
('B1000000-0000-4000-8000-000000000002','Liam','Patel','liam.patel@example.org','Corporate','Active','2017-06-15','2026-08-15','East'),
('B1000000-0000-4000-8000-000000000003','Maria','Gonzalez','maria.g@example.org','Individual','Active','2020-11-01','2026-12-01','Central'),
('B1000000-0000-4000-8000-000000000004','Noah','Williams','noah.w@example.org','Individual','Active','2018-03-22','2026-07-20','West'),
('B1000000-0000-4000-8000-000000000005','Sofia','Rossi','sofia.rossi@example.org','Student','Active','2023-09-01','2026-09-01','East'),
('B1000000-0000-4000-8000-000000000006','Ethan','Kim','ethan.kim@example.org','Individual','Active','2021-01-12','2026-10-05','Central'),
('B1000000-0000-4000-8000-000000000007','Olivia','Brown','olivia.b@example.org','Individual','Active','2019-05-30','2026-06-30','West'),
('B1000000-0000-4000-8000-000000000008','Lucas','Muller','lucas.m@example.org','Corporate','Active','2022-02-18','2026-11-11','East'),
('B1000000-0000-4000-8000-000000000009','Emma','Davis','emma.davis@example.org','Individual','Grace','2016-08-08','2026-05-01','Central'),
('B1000000-0000-4000-8000-000000000010','Mason','Lee','mason.lee@example.org','Individual','Active','2020-04-04','2026-06-25','West'),
('B1000000-0000-4000-8000-000000000011','Isabella','Nguyen','isabella.n@example.org','Student','Grace','2021-09-15','2026-04-15','East'),
('B1000000-0000-4000-8000-000000000012','James','Wilson','james.w@example.org','Individual','Active','2015-12-01','2026-07-01','Central'),
('B1000000-0000-4000-8000-000000000013','Charlotte','Smith','charlotte.s@example.org','Individual','Lapsed','2014-03-10','2025-03-10','West'),
('B1000000-0000-4000-8000-000000000014','Benjamin','Garcia','ben.garcia@example.org','Individual','Lapsed','2013-07-22','2024-07-22','East'),
('B1000000-0000-4000-8000-000000000015','Amelia','Johnson','amelia.j@example.org','Prospect','Prospect','2026-05-20',NULL,'Central');
GO

-- Event registrations (Healthy: 4 mostly-attended recent; Neutral: 2; At-Risk: 1 old/no-show; Lapsed: none)
INSERT INTO membership.EventRegistration (MemberID, EventName, EventDate, Attended, RegistrationType) VALUES
('B1000000-0000-4000-8000-000000000001','Annual Conference 2026','2026-04-10',1,'InPerson'),
('B1000000-0000-4000-8000-000000000001','Spring Webinar','2026-05-02',1,'Virtual'),
('B1000000-0000-4000-8000-000000000001','Leadership Summit','2025-10-15',1,'InPerson'),
('B1000000-0000-4000-8000-000000000001','AI Workshop','2026-03-20',1,'Virtual'),
('B1000000-0000-4000-8000-000000000002','Annual Conference 2026','2026-04-10',1,'InPerson'),
('B1000000-0000-4000-8000-000000000002','Trade Expo','2026-02-12',1,'InPerson'),
('B1000000-0000-4000-8000-000000000002','Q1 Webinar','2026-01-20',1,'Virtual'),
('B1000000-0000-4000-8000-000000000002','Networking Night','2025-11-05',1,'InPerson'),
('B1000000-0000-4000-8000-000000000003','Annual Conference 2026','2026-04-10',1,'Virtual'),
('B1000000-0000-4000-8000-000000000003','AI Workshop','2026-03-20',1,'Virtual'),
('B1000000-0000-4000-8000-000000000003','Spring Webinar','2026-05-02',1,'Virtual'),
('B1000000-0000-4000-8000-000000000003','Mentor Mixer','2025-09-30',1,'InPerson'),
('B1000000-0000-4000-8000-000000000004','Annual Conference 2026','2026-04-10',1,'InPerson'),
('B1000000-0000-4000-8000-000000000004','Leadership Summit','2025-10-15',1,'InPerson'),
('B1000000-0000-4000-8000-000000000004','Q1 Webinar','2026-01-20',0,'Virtual'),
('B1000000-0000-4000-8000-000000000004','Data Workshop','2026-05-28',1,'InPerson'),
('B1000000-0000-4000-8000-000000000005','Spring Webinar','2026-05-02',1,'Virtual'),
('B1000000-0000-4000-8000-000000000005','Student Forum','2026-03-01',1,'Virtual'),
('B1000000-0000-4000-8000-000000000006','Annual Conference 2026','2026-04-10',0,'InPerson'),
('B1000000-0000-4000-8000-000000000006','Q1 Webinar','2026-01-20',1,'Virtual'),
('B1000000-0000-4000-8000-000000000007','Networking Night','2025-11-05',1,'InPerson'),
('B1000000-0000-4000-8000-000000000007','Spring Webinar','2026-05-02',1,'Virtual'),
('B1000000-0000-4000-8000-000000000008','Trade Expo','2026-02-12',1,'InPerson'),
('B1000000-0000-4000-8000-000000000008','Annual Conference 2026','2026-04-10',1,'InPerson'),
('B1000000-0000-4000-8000-000000000009','Annual Conference 2025','2025-04-12',1,'InPerson'),
('B1000000-0000-4000-8000-000000000010','Summer Webinar','2025-07-10',0,'Virtual'),
('B1000000-0000-4000-8000-000000000011','Student Forum','2025-10-01',1,'Virtual');
GO

-- Email engagement (Healthy: ~6 recent opens/clicks; Neutral: ~3; At-Risk: ~1 old/bounce; Lapsed: none; Prospect: 1 welcome)
INSERT INTO membership.EmailEngagement (MemberID, ActivityType, OccurredOn, CampaignName) VALUES
('B1000000-0000-4000-8000-000000000001','Open','2026-06-01','June Newsletter'),
('B1000000-0000-4000-8000-000000000001','Click','2026-06-01','June Newsletter'),
('B1000000-0000-4000-8000-000000000001','Open','2026-05-15','Event Invite'),
('B1000000-0000-4000-8000-000000000001','Click','2026-05-16','Event Invite'),
('B1000000-0000-4000-8000-000000000001','Open','2026-04-20','April Newsletter'),
('B1000000-0000-4000-8000-000000000001','Open','2026-06-10','Dues Reminder'),
('B1000000-0000-4000-8000-000000000002','Open','2026-06-05','June Newsletter'),
('B1000000-0000-4000-8000-000000000002','Click','2026-06-05','June Newsletter'),
('B1000000-0000-4000-8000-000000000002','Open','2026-05-10','May Newsletter'),
('B1000000-0000-4000-8000-000000000002','Click','2026-05-11','Member Survey'),
('B1000000-0000-4000-8000-000000000002','Open','2026-04-25','Event Invite'),
('B1000000-0000-4000-8000-000000000002','Click','2026-06-12','Renewal Offer'),
('B1000000-0000-4000-8000-000000000003','Open','2026-06-02','June Newsletter'),
('B1000000-0000-4000-8000-000000000003','Click','2026-06-02','June Newsletter'),
('B1000000-0000-4000-8000-000000000003','Open','2026-05-18','May Newsletter'),
('B1000000-0000-4000-8000-000000000003','Click','2026-05-19','Event Invite'),
('B1000000-0000-4000-8000-000000000003','Open','2026-04-12','April Newsletter'),
('B1000000-0000-4000-8000-000000000004','Open','2026-06-07','June Newsletter'),
('B1000000-0000-4000-8000-000000000004','Open','2026-05-22','May Newsletter'),
('B1000000-0000-4000-8000-000000000004','Click','2026-05-23','Event Invite'),
('B1000000-0000-4000-8000-000000000004','Open','2026-04-18','April Newsletter'),
('B1000000-0000-4000-8000-000000000005','Open','2026-06-02','June Newsletter'),
('B1000000-0000-4000-8000-000000000005','Open','2026-05-05','May Newsletter'),
('B1000000-0000-4000-8000-000000000005','Click','2026-05-06','Member Survey'),
('B1000000-0000-4000-8000-000000000006','Open','2026-05-20','May Newsletter'),
('B1000000-0000-4000-8000-000000000006','Open','2026-06-08','June Newsletter'),
('B1000000-0000-4000-8000-000000000007','Open','2026-06-03','June Newsletter'),
('B1000000-0000-4000-8000-000000000007','Click','2026-06-03','June Newsletter'),
('B1000000-0000-4000-8000-000000000007','Open','2026-04-30','April Newsletter'),
('B1000000-0000-4000-8000-000000000008','Open','2026-05-25','May Newsletter'),
('B1000000-0000-4000-8000-000000000008','Open','2026-06-09','June Newsletter'),
('B1000000-0000-4000-8000-000000000008','Click','2026-06-09','June Newsletter'),
('B1000000-0000-4000-8000-000000000009','Open','2026-02-10','February Newsletter'),
('B1000000-0000-4000-8000-000000000010','Bounce','2026-05-01','May Newsletter'),
('B1000000-0000-4000-8000-000000000011','Open','2025-12-01','December Newsletter'),
('B1000000-0000-4000-8000-000000000015','Open','2026-05-21','Welcome Email');
GO

-- Payments (Dues for current term + Donations from engaged members; lapsed have only old dues)
INSERT INTO membership.Payment (MemberID, Amount, PaidOn, PaymentType, TermYear) VALUES
('B1000000-0000-4000-8000-000000000001',150.00,'2026-01-15','Dues',2026),
('B1000000-0000-4000-8000-000000000001',250.00,'2026-03-01','Donation',NULL),
('B1000000-0000-4000-8000-000000000001',100.00,'2025-12-20','Donation',NULL),
('B1000000-0000-4000-8000-000000000002',500.00,'2026-01-10','Dues',2026),
('B1000000-0000-4000-8000-000000000002',1000.00,'2026-02-14','Donation',NULL),
('B1000000-0000-4000-8000-000000000003',150.00,'2026-02-01','Dues',2026),
('B1000000-0000-4000-8000-000000000003',75.00,'2026-04-10','Donation',NULL),
('B1000000-0000-4000-8000-000000000004',150.00,'2026-01-20','Dues',2026),
('B1000000-0000-4000-8000-000000000004',300.00,'2025-11-30','Donation',NULL),
('B1000000-0000-4000-8000-000000000005',50.00,'2026-02-15','Dues',2026),
('B1000000-0000-4000-8000-000000000006',150.00,'2026-03-05','Dues',2026),
('B1000000-0000-4000-8000-000000000007',150.00,'2026-01-25','Dues',2026),
('B1000000-0000-4000-8000-000000000007',50.00,'2026-05-01','Donation',NULL),
('B1000000-0000-4000-8000-000000000008',500.00,'2026-01-05','Dues',2026),
('B1000000-0000-4000-8000-000000000009',150.00,'2025-01-20','Dues',2025),
('B1000000-0000-4000-8000-000000000010',150.00,'2026-06-10','Dues',2026),
('B1000000-0000-4000-8000-000000000011',50.00,'2025-09-20','Dues',2025),
('B1000000-0000-4000-8000-000000000012',150.00,'2024-12-01','Dues',2024),
('B1000000-0000-4000-8000-000000000013',150.00,'2024-03-01','Dues',2024),
('B1000000-0000-4000-8000-000000000014',150.00,'2023-07-01','Dues',2023);
GO

-- Certifications (Healthy: 1-2 recent active; Neutral: 0-1; At-Risk/Lapsed: none)
INSERT INTO membership.Certification (MemberID, CourseName, CompletedOn, IsActive, CreditHours) VALUES
('B1000000-0000-4000-8000-000000000001','Advanced Practitioner','2025-11-10',1,12.0),
('B1000000-0000-4000-8000-000000000001','Ethics 2026','2026-03-15',1,4.0),
('B1000000-0000-4000-8000-000000000002','Leadership Certificate','2026-02-20',1,8.0),
('B1000000-0000-4000-8000-000000000003','Data Fundamentals','2025-09-01',1,6.0),
('B1000000-0000-4000-8000-000000000003','Ethics 2026','2026-04-01',1,4.0),
('B1000000-0000-4000-8000-000000000004','Advanced Practitioner','2026-01-15',1,12.0),
('B1000000-0000-4000-8000-000000000005','Intro Course','2026-03-10',1,3.0),
('B1000000-0000-4000-8000-000000000007','Ethics 2025','2025-08-01',0,4.0),
('B1000000-0000-4000-8000-000000000008','Leadership Certificate','2025-10-05',1,8.0);
GO
