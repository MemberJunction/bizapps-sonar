-- =============================================================================
-- Demo Association — `membership.ResourceReview` table + seed (DEMO SANDBOX ONLY)
-- =============================================================================
-- A free-text review source for the membership demo set, so the "Sonar: Resource Review
-- Sentiment" LLM factor has prose to read for the Active "Demo Member Engagement" model
-- (anchored on membership.Member). The other membership sources are numeric/activity; this
-- is the only one with free text — the whole point of an LLM factor.
--
-- Reviews are authored so SENTIMENT corroborates each member's engagement Status, and the
-- factor weighs the most-recent review most:
--   Active  → warm (one exception: Noah Williams is "souring" — recent prose turns negative
--             before his Status flips, the early-warning signal the factor exists to catch)
--   Grace   → cooling / mixed
--   Lapsed  → frustrated / negative
--   Prospect→ tentative / curious
--
-- Applied ONLY to Sonar_Demo. Idempotent (table is dedicated to this seed → wipe + reinsert).
--   set -a && . ./.env && set +a && node demo/apply-to-demo.cjs demo/membership-reviews.sql
-- After applying, run `npm run mj:codegen:demo` to register it as an MJ entity.
--
-- MJ conventions (match membership-schema.sql): UUID PK NEWSEQUENTIALID(); named PK/FK;
-- NO __mj_CreatedAt/UpdatedAt (CodeGen adds them); no FK indexes (CodeGen adds them).
-- =============================================================================

IF OBJECT_ID('membership.ResourceReview') IS NULL
CREATE TABLE membership.ResourceReview (
    ID             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ResourceReview PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    MemberID       UNIQUEIDENTIFIER NOT NULL,
    ResourceTitle  NVARCHAR(200)    NOT NULL,  -- what they reviewed (free text; no Resource table in this demo)
    Rating         INT              NOT NULL,  -- 1-5 stars (the factor IGNORES this; it reads the prose)
    Review         NVARCHAR(MAX)    NULL,      -- the prose the LLM factor reads
    CreatedDate    DATETIME2        NOT NULL,
    CONSTRAINT FK_ResourceReview_Member FOREIGN KEY (MemberID) REFERENCES membership.Member(ID)
);
GO

DELETE FROM membership.ResourceReview;
GO

INSERT INTO membership.ResourceReview (ID, MemberID, ResourceTitle, Rating, Review, CreatedDate) VALUES
-- ===== ACTIVE — warm / enthusiastic =====
-- Olivia Brown
('B1100000-0000-4000-8000-000000000001', 'B1000000-0000-4000-8000-000000000007', 'Cheesemaking Masterclass', 5, 'The masterclass was phenomenal — easily the best member benefit. Learned more in a weekend than a year of YouTube.', '2026-01-15T10:00:00'),
('B1100000-0000-4000-8000-000000000002', 'B1000000-0000-4000-8000-000000000007', '2026 Spring Conference', 5, 'Renewed on the spot after the spring conference. This community is genuinely gold.', '2026-05-20T14:00:00'),
-- Ava Chen
('B1100000-0000-4000-8000-000000000003', 'B1000000-0000-4000-8000-000000000001', 'Certification Prep Guide', 5, 'The prep guide got me through my exam first try. Incredible resource, worth the membership alone.', '2025-11-10T09:00:00'),
('B1100000-0000-4000-8000-000000000004', 'B1000000-0000-4000-8000-000000000001', 'Regional Networking Meetup', 4, 'Always learn something at the regional meetups and the people are warm. I look forward to them.', '2026-04-02T18:00:00'),
-- Maria Gonzalez
('B1100000-0000-4000-8000-000000000005', 'B1000000-0000-4000-8000-000000000003', 'Mentorship Program', 5, 'Paired me with a brilliant mentor. Honestly career-changing — I cannot recommend it enough.', '2026-02-18T11:00:00'),
('B1100000-0000-4000-8000-000000000006', 'B1000000-0000-4000-8000-000000000003', 'Member Resource Library', 5, 'The new resource library is fantastic. I use it weekly and keep finding gems.', '2026-06-01T08:30:00'),
-- Ethan Kim
('B1100000-0000-4000-8000-000000000007', 'B1000000-0000-4000-8000-000000000006', 'New Member Orientation', 4, 'Solid content and a genuinely welcoming crowd. Really glad I joined this year.', '2026-03-22T13:00:00'),
-- Mason Lee
('B1100000-0000-4000-8000-000000000008', 'B1000000-0000-4000-8000-000000000010', 'Monthly Webinar Series', 5, 'Worth every penny — the webinars alone justify the dues. Consistently excellent.', '2025-12-05T12:00:00'),
('B1100000-0000-4000-8000-000000000009', 'B1000000-0000-4000-8000-000000000010', '2026 Spring Conference', 4, 'Parking was a nightmare, but the content was top-notch and I left energized.', '2026-05-10T16:00:00'),
-- Lucas Muller (Corporate)
('B1100000-0000-4000-8000-00000000000A', 'B1000000-0000-4000-8000-000000000008', 'Compliance Template Pack', 5, 'Our whole team uses the compliance templates now. Massive time saver, very well done.', '2026-01-30T09:30:00'),
('B1100000-0000-4000-8000-00000000000B', 'B1000000-0000-4000-8000-000000000008', 'Corporate Partner Portal', 5, 'The partner portal is well built and actually useful — rare for member software.', '2026-04-25T10:00:00'),
-- Liam Patel (Corporate)
('B1100000-0000-4000-8000-00000000000C', 'B1000000-0000-4000-8000-000000000002', 'Industry Trends Report', 4, 'Reliable, professional org. The quarterly industry reports are genuinely worth it.', '2026-05-15T15:00:00'),
-- Sofia Rossi (Student)
('B1100000-0000-4000-8000-00000000000D', 'B1000000-0000-4000-8000-000000000005', 'Student Course Bundle', 5, 'As a student the discounted rate plus free courses is unbeatable. Such good value.', '2026-02-01T11:00:00'),
('B1100000-0000-4000-8000-00000000000E', 'B1000000-0000-4000-8000-000000000005', 'Member Job Board', 5, 'Landed an internship through the job board. Forever grateful to this association.', '2026-06-10T09:00:00'),
-- Noah Williams — SOURING: was warm, recent prose turns negative (early warning before Status flips)
('B1100000-0000-4000-8000-00000000000F', 'B1000000-0000-4000-8000-000000000004', 'New Member Orientation', 5, 'Loved my first year — tons of value and great people. Felt like I found my crowd.', '2025-10-12T10:00:00'),
('B1100000-0000-4000-8000-000000000010', 'B1000000-0000-4000-8000-000000000004', '2026 Spring Conference', 2, 'Honestly the quality has slipped. The last two events felt phoned-in and overpriced. Disappointed.', '2026-06-05T17:00:00'),
-- James Wilson
('B1100000-0000-4000-8000-000000000011', 'B1000000-0000-4000-8000-000000000012', 'Member Handbook', 4, 'Does what it says and a few pleasant surprises along the way. No complaints.', '2026-04-18T14:00:00'),

-- ===== GRACE — cooling / mixed =====
-- Emma Davis
('B1100000-0000-4000-8000-000000000012', 'B1000000-0000-4000-8000-000000000009', 'Monthly Webinar Series', 4, 'Used to be a highlight of my month, real sense of community back then.', '2025-11-20T12:00:00'),
('B1100000-0000-4000-8000-000000000013', 'B1000000-0000-4000-8000-000000000009', 'Renewal Notice', 2, 'Renewal came with a price hike and zero explanation. Feeling taken for granted — reconsidering.', '2026-05-28T09:00:00'),
-- Isabella Nguyen (Student)
('B1100000-0000-4000-8000-000000000014', 'B1000000-0000-4000-8000-000000000011', 'Regional Networking Meetup', 3, 'It is fine, but I expected more events near campus. A bit underwhelming so far.', '2026-01-08T18:00:00'),
('B1100000-0000-4000-8000-000000000015', 'B1000000-0000-4000-8000-000000000011', 'Student Course Bundle', 2, 'Hard to justify the cost lately — not much here for students this term. Drifting away.', '2026-06-02T10:00:00'),

-- ===== LAPSED — frustrated / negative =====
-- Benjamin Garcia
('B1100000-0000-4000-8000-000000000016', 'B1000000-0000-4000-8000-000000000014', 'Monthly Webinar Series', 2, 'Dwindling value year over year. The good speakers stopped coming and nobody noticed.', '2025-12-15T12:00:00'),
('B1100000-0000-4000-8000-000000000017', 'B1000000-0000-4000-8000-000000000014', 'Member Support', 1, 'Cancelled my card after support ignored three emails. Completely done with this org.', '2026-03-10T08:00:00'),
-- Charlotte Smith
('B1100000-0000-4000-8000-000000000018', 'B1000000-0000-4000-8000-000000000013', 'New Member Orientation', 2, 'Felt invisible from day one. No engagement, no follow-up, no reason to stay.', '2026-01-22T11:00:00'),
('B1100000-0000-4000-8000-000000000019', 'B1000000-0000-4000-8000-000000000013', 'Renewal Notice', 1, 'Let it lapse without a second thought. Honestly forgot I was even a member.', '2026-04-05T09:00:00'),

-- ===== PROSPECT — tentative / curious =====
-- Amelia Johnson
('B1100000-0000-4000-8000-00000000001A', 'B1000000-0000-4000-8000-000000000015', 'Intro Webinar (Free)', 3, 'Attended a free webinar to check it out. Decent enough — still deciding whether it is worth joining.', '2026-06-12T13:00:00');
GO
