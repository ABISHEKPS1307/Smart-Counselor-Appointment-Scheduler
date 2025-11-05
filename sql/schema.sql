/*******************************************************************************
 * Smart Counselor Appointment Scheduler - Database Schema
 * Database: Azure SQL / SQL Server (T-SQL)
 * 
 * This script creates all necessary tables, indexes, constraints, and sample data
 * for the Smart Counselor Appointment Scheduler application.
 * 
 * Usage:
 *   - For Azure SQL: Use Azure Data Studio or sqlcmd
 *   - Command: sqlcmd -S <server>.database.windows.net -d CounselorScheduler -U <user> -P <password> -i schema.sql
 *******************************************************************************/

-- Set options for better error handling and transaction control
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting database schema creation...';
GO

-- =============================================================================
-- Drop existing tables if they exist (for clean re-deployment)
-- =============================================================================

IF OBJECT_ID('dbo.AI_Logs', 'U') IS NOT NULL
    DROP TABLE dbo.AI_Logs;
GO

IF OBJECT_ID('dbo.Appointments', 'U') IS NOT NULL
    DROP TABLE dbo.Appointments;
GO

IF OBJECT_ID('dbo.Counselors', 'U') IS NOT NULL
    DROP TABLE dbo.Counselors;
GO

IF OBJECT_ID('dbo.Students', 'U') IS NOT NULL
    DROP TABLE dbo.Students;
GO

PRINT 'Existing tables dropped (if any).';
GO

-- =============================================================================
-- Table: Students
-- Stores student user accounts
-- =============================================================================

CREATE TABLE dbo.Students (
    StudentID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    Password NVARCHAR(200) NOT NULL, -- Stores bcrypt hashed password
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    
    INDEX IX_Students_Email (Email)
);
GO

PRINT 'Table Students created.';
GO

-- =============================================================================
-- Table: Counselors
-- Stores counselor user accounts with specialization
-- =============================================================================

CREATE TABLE dbo.Counselors (
    CounselorID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    Password NVARCHAR(200) NOT NULL, -- Stores bcrypt hashed password
    CounselorType NVARCHAR(80) NOT NULL, -- e.g., Academic, Career, Personal, Mental Health
    Bio NVARCHAR(MAX) NULL,
    Photo NVARCHAR(MAX) NULL, -- Base64 encoded image or URL
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    
    INDEX IX_Counselors_Email (Email),
    INDEX IX_Counselors_Type (CounselorType)
);
GO

PRINT 'Table Counselors created.';
GO

-- =============================================================================
-- Table: Appointments
-- Stores appointment bookings between students and counselors
-- =============================================================================

CREATE TABLE dbo.Appointments (
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    CounselorID INT NOT NULL,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    Status NVARCHAR(30) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled')),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_Appointments_Students FOREIGN KEY (StudentID) 
        REFERENCES dbo.Students(StudentID) ON DELETE CASCADE,
    CONSTRAINT FK_Appointments_Counselors FOREIGN KEY (CounselorID) 
        REFERENCES dbo.Counselors(CounselorID) ON DELETE CASCADE,
    
    INDEX IX_Appointments_Student (StudentID),
    INDEX IX_Appointments_Counselor (CounselorID),
    INDEX IX_Appointments_Date (Date),
    INDEX IX_Appointments_Status (Status)
);
GO

-- Create unique index for conflict detection
-- Prevents double-booking: same counselor, date, time with active appointments
CREATE UNIQUE INDEX IX_Appointments_Conflict 
    ON dbo.Appointments(CounselorID, Date, Time)
    WHERE Status IN ('Pending', 'Accepted');
GO

PRINT 'Table Appointments created with conflict prevention index.';
GO

-- =============================================================================
-- Table: AI_Logs
-- Stores AI interaction logs for audit trail and analytics
-- =============================================================================

CREATE TABLE dbo.AI_Logs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL, -- Can be StudentID or CounselorID
    Role NVARCHAR(20) NULL CHECK (Role IN ('student', 'counselor', 'admin', NULL)),
    Prompt NVARCHAR(MAX) NOT NULL,
    Response NVARCHAR(MAX) NOT NULL,
    Mode NVARCHAR(50) NOT NULL, -- e.g., chat, recommendation, summarizeFeedback
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    
    INDEX IX_AI_Logs_User (UserID, Role),
    INDEX IX_AI_Logs_CreatedAt (CreatedAt),
    INDEX IX_AI_Logs_Mode (Mode)
);
GO

PRINT 'Table AI_Logs created.';
GO

-- =============================================================================
-- Seed Data - Sample Students
-- =============================================================================

PRINT 'Inserting sample students...';
GO

-- Password for all sample users: "Password123!" (bcrypt hashed)
-- Hash generated with bcrypt cost factor 10
INSERT INTO dbo.Students (Name, Email, Password, CreatedAt) VALUES
('Alice Johnson', 'alice.johnson@university.edu', '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK', GETDATE()),
('Bob Smith', 'bob.smith@university.edu', '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK', GETDATE());
GO

PRINT 'Sample students inserted.';
GO

-- =============================================================================
-- Seed Data - Sample Counselors
-- =============================================================================

PRINT 'Inserting sample counselors...';
GO

INSERT INTO dbo.Counselors (Name, Email, Password, CounselorType, Bio, Photo, CreatedAt) VALUES
(
    'Dr. Emily Carter',
    'emily.carter@university.edu',
    '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK',
    'Academic',
    'Ph.D. in Educational Psychology with 10+ years of experience in academic counseling. Specialized in helping students with course selection, study strategies, and academic goal setting.',
    NULL,
    GETDATE()
),
(
    'Michael Rodriguez',
    'michael.rodriguez@university.edu',
    '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK',
    'Career',
    'Career development specialist with expertise in resume building, interview preparation, and career path exploration. Previously worked as HR manager at Fortune 500 companies.',
    NULL,
    GETDATE()
);
GO

PRINT 'Sample counselors inserted.';
GO

-- =============================================================================
-- Seed Data - Sample Appointments
-- =============================================================================

PRINT 'Inserting sample appointments...';
GO

DECLARE @StudentID1 INT, @StudentID2 INT;
DECLARE @CounselorID1 INT, @CounselorID2 INT;

SELECT @StudentID1 = StudentID FROM dbo.Students WHERE Email = 'alice.johnson@university.edu';
SELECT @StudentID2 = StudentID FROM dbo.Students WHERE Email = 'bob.smith@university.edu';
SELECT @CounselorID1 = CounselorID FROM dbo.Counselors WHERE Email = 'emily.carter@university.edu';
SELECT @CounselorID2 = CounselorID FROM dbo.Counselors WHERE Email = 'michael.rodriguez@university.edu';

INSERT INTO dbo.Appointments (StudentID, CounselorID, Date, Time, Status, CreatedAt) VALUES
(@StudentID1, @CounselorID1, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)), '10:00:00', 'Pending', GETDATE()),
(@StudentID2, @CounselorID2, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)), '14:00:00', 'Accepted', GETDATE()),
(@StudentID1, @CounselorID2, DATEADD(DAY, 5, CAST(GETDATE() AS DATE)), '11:30:00', 'Pending', GETDATE());
GO

PRINT 'Sample appointments inserted.';
GO

-- =============================================================================
-- Verification Queries
-- =============================================================================

PRINT '';
PRINT '========================================';
PRINT 'Database Schema Creation Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Verification:';
PRINT '';

SELECT 'Students' AS TableName, COUNT(*) AS RecordCount FROM dbo.Students
UNION ALL
SELECT 'Counselors', COUNT(*) FROM dbo.Counselors
UNION ALL
SELECT 'Appointments', COUNT(*) FROM dbo.Appointments
UNION ALL
SELECT 'AI_Logs', COUNT(*) FROM dbo.AI_Logs;
GO

PRINT '';
PRINT 'Sample Login Credentials:';
PRINT 'Student: alice.johnson@university.edu / Password123!';
PRINT 'Student: bob.smith@university.edu / Password123!';
PRINT 'Counselor: emily.carter@university.edu / Password123!';
PRINT 'Counselor: michael.rodriguez@university.edu / Password123!';
PRINT '';
PRINT 'Schema deployment successful!';
GO

-- =============================================================================
-- Additional Database Objects (Optional)
-- =============================================================================

-- Create stored procedure for appointment conflict check
GO
CREATE PROCEDURE dbo.sp_CheckAppointmentConflict
    @CounselorID INT,
    @Date DATE,
    @Time TIME
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS ConflictCount
    FROM dbo.Appointments
    WHERE CounselorID = @CounselorID
      AND Date = @Date
      AND Time = @Time
      AND Status IN ('Pending', 'Accepted');
END;
GO

PRINT 'Stored procedure sp_CheckAppointmentConflict created.';
GO

-- Create view for appointment details
GO
CREATE VIEW dbo.vw_AppointmentDetails AS
SELECT 
    a.AppointmentID,
    a.Date,
    a.Time,
    a.Status,
    a.CreatedAt,
    s.StudentID,
    s.Name AS StudentName,
    s.Email AS StudentEmail,
    c.CounselorID,
    c.Name AS CounselorName,
    c.Email AS CounselorEmail,
    c.CounselorType
FROM dbo.Appointments a
INNER JOIN dbo.Students s ON a.StudentID = s.StudentID
INNER JOIN dbo.Counselors c ON a.CounselorID = c.CounselorID;
GO

PRINT 'View vw_AppointmentDetails created.';
GO

PRINT '';
PRINT 'All database objects created successfully!';
PRINT 'Database is ready for application use.';
GO
