-- =============================================================================
-- Demo Association — `membership` schema (DEMO SANDBOX ONLY)
-- =============================================================================
-- Represents a third-party association's business data brought into MJ (Pattern 1:
-- tables live in the MJ database, registered as entities via CodeGen). Member is the
-- scoring anchor; the rest are single-hop activity sources for Sonar factors.
--
-- This file is applied ONLY to the sandbox database (Sonar_Demo). It is never part of
-- the main `mj:migrate` line. Teardown = DROP DATABASE Sonar_Demo (or drop schema +
-- delete the membership __mj.Entity/EntityField rows).
--
-- MJ table conventions (so CodeGen reflects cleanly later): UUID PKs with
-- NEWSEQUENTIALID() + named PK/FK constraints; NO __mj_CreatedAt/UpdatedAt (CodeGen
-- adds them); no FK indexes (CodeGen adds them).
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'membership')
    EXEC('CREATE SCHEMA membership');
GO

-- Anchor: one row scored per member ------------------------------------------------
IF OBJECT_ID('membership.Member') IS NULL
CREATE TABLE membership.Member (
    ID              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Member PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    FirstName       NVARCHAR(100)    NOT NULL,
    LastName        NVARCHAR(100)    NOT NULL,
    Email           NVARCHAR(255)    NOT NULL,
    MembershipType  NVARCHAR(50)     NOT NULL,  -- Individual / Student / Corporate / Retired
    Status          NVARCHAR(50)     NOT NULL,  -- Active / Grace / Lapsed / Prospect
    JoinDate        DATE             NOT NULL,
    RenewalDate     DATE             NULL,
    ChapterRegion   NVARCHAR(100)    NULL
);
GO

-- Source: event registrations / attendance ----------------------------------------
IF OBJECT_ID('membership.EventRegistration') IS NULL
CREATE TABLE membership.EventRegistration (
    ID                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EventRegistration PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    MemberID          UNIQUEIDENTIFIER NOT NULL,
    EventName         NVARCHAR(200)    NOT NULL,
    EventDate         DATE             NOT NULL,
    Attended          BIT              NOT NULL,
    RegistrationType  NVARCHAR(50)     NOT NULL,  -- InPerson / Virtual
    CONSTRAINT FK_EventRegistration_Member FOREIGN KEY (MemberID) REFERENCES membership.Member(ID)
);
GO

-- Source: email/newsletter engagement ---------------------------------------------
IF OBJECT_ID('membership.EmailEngagement') IS NULL
CREATE TABLE membership.EmailEngagement (
    ID            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EmailEngagement PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    MemberID      UNIQUEIDENTIFIER NOT NULL,
    ActivityType  NVARCHAR(50)     NOT NULL,  -- Open / Click / Bounce / Unsubscribe
    OccurredOn    DATETIME2        NOT NULL,
    CampaignName  NVARCHAR(200)    NOT NULL,
    CONSTRAINT FK_EmailEngagement_Member FOREIGN KEY (MemberID) REFERENCES membership.Member(ID)
);
GO

-- Source: payments (dues / donations) ---------------------------------------------
IF OBJECT_ID('membership.Payment') IS NULL
CREATE TABLE membership.Payment (
    ID           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Payment PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    MemberID     UNIQUEIDENTIFIER NOT NULL,
    Amount       DECIMAL(10,2)    NOT NULL,
    PaidOn       DATE             NOT NULL,
    PaymentType  NVARCHAR(50)     NOT NULL,  -- Dues / Donation / EventFee
    TermYear     INT              NULL,
    CONSTRAINT FK_Payment_Member FOREIGN KEY (MemberID) REFERENCES membership.Member(ID)
);
GO

-- Source: certifications / continuing education -----------------------------------
IF OBJECT_ID('membership.Certification') IS NULL
CREATE TABLE membership.Certification (
    ID           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Certification PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    MemberID     UNIQUEIDENTIFIER NOT NULL,
    CourseName   NVARCHAR(200)    NOT NULL,
    CompletedOn  DATE             NOT NULL,
    IsActive     BIT              NOT NULL,
    CreditHours  DECIMAL(5,1)     NOT NULL,
    CONSTRAINT FK_Certification_Member FOREIGN KEY (MemberID) REFERENCES membership.Member(ID)
);
GO
