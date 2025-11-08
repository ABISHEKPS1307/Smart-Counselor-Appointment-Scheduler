/*******************************************************************************
 * Smart Counselor Appointment Scheduler - Complete Database Schema
 * Merged and Optimized for Azure SQL / SQL Server
 * 
 * Features:
 * - Correct PasswordHash column names
 * - Performance indexes
 * - Stored procedures
 * - Check constraints
 * - Sample data for testing
 * 
 * Usage:
 *   Run this script in Azure Portal Query Editor or Azure Data Studio
 *******************************************************************************/

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Smart Counselor Appointment Scheduler';
PRINT 'Database Schema Deployment';
PRINT '========================================';
PRINT '';

-- =============================================================================
-- Drop existing objects (for clean deployment)
-- =============================================================================

PRINT 'Dropping existing objects...';

-- Drop stored procedures
IF OBJECT_ID('dbo.sp_RegisterStudent', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_RegisterStudent;
IF OBJECT_ID('dbo.sp_RegisterCounselor', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_RegisterCounselor;
IF OBJECT_ID('dbo.sp_CreateAppointment', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_CreateAppointment;
IF OBJECT_ID('dbo.sp_GetAppointmentsByStudent', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetAppointmentsByStudent;
IF OBJECT_ID('dbo.sp_GetAppointmentsByCounselor', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetAppointmentsByCounselor;
IF OBJECT_ID('dbo.sp_UpdateAppointmentStatus', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_UpdateAppointmentStatus;

-- Drop tables (in correct order due to foreign keys)
IF OBJECT_ID('dbo.AI_Logs', 'U') IS NOT NULL DROP TABLE dbo.AI_Logs;
IF OBJECT_ID('dbo.Appointments', 'U') IS NOT NULL DROP TABLE dbo.Appointments;
IF OBJECT_ID('dbo.Counselors', 'U') IS NOT NULL DROP TABLE dbo.Counselors;
IF OBJECT_ID('dbo.Students', 'U') IS NOT NULL DROP TABLE dbo.Students;
GO

PRINT '✓ Existing objects dropped';
PRINT '';

-- =============================================================================
-- Create Tables
-- =============================================================================

PRINT 'Creating tables...';

-- Students Table
CREATE TABLE dbo.Students (
    StudentID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    
    CONSTRAINT CK_Students_Email CHECK (Email LIKE '%_@__%.__%'),
    CONSTRAINT CK_Students_Name CHECK (LEN(Name) >= 2)
);
GO

PRINT '✓ Students table created';

-- Counselors Table
CREATE TABLE dbo.Counselors (
    CounselorID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CounselorType NVARCHAR(80) NOT NULL,
    Bio NVARCHAR(MAX) NULL,
    Photo NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    
    CONSTRAINT CK_Counselors_Email CHECK (Email LIKE '%_@__%.__%'),
    CONSTRAINT CK_Counselors_Name CHECK (LEN(Name) >= 2),
    CONSTRAINT CK_Counselors_Type CHECK (CounselorType IN ('Academic', 'Career', 'Personal', 'Mental Health'))
);
GO

PRINT '✓ Counselors table created';

-- Appointments Table
CREATE TABLE dbo.Appointments (
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    CounselorID INT NOT NULL,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    
    CONSTRAINT FK_Appointments_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID) ON DELETE CASCADE,
    CONSTRAINT FK_Appointments_Counselors FOREIGN KEY (CounselorID) REFERENCES dbo.Counselors(CounselorID) ON DELETE CASCADE,
    CONSTRAINT CK_Appointments_Status CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled'))
);
GO

PRINT '✓ Appointments table created';

-- AI Logs Table
CREATE TABLE dbo.AI_Logs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    UserType NVARCHAR(20) NOT NULL,
    Prompt NVARCHAR(MAX) NOT NULL,
    Response NVARCHAR(MAX) NULL,
    Mode NVARCHAR(50) NOT NULL,
    Duration INT NULL,
    Cached BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT CK_AI_Logs_UserType CHECK (UserType IN ('student', 'counselor', 'admin')),
    CONSTRAINT CK_AI_Logs_Mode CHECK (Mode IN ('chat', 'summarizeFeedback', 'recommendation'))
);
GO

PRINT '✓ AI_Logs table created';
PRINT '';

-- =============================================================================
-- Create Indexes for Performance
-- =============================================================================

PRINT 'Creating indexes...';

-- Unique indexes for email (prevent duplicates and improve login performance)
CREATE UNIQUE INDEX idx_Students_Email ON dbo.Students(Email);
CREATE UNIQUE INDEX idx_Counselors_Email ON dbo.Counselors(Email);

-- Composite unique index for appointment conflict prevention
CREATE UNIQUE INDEX idx_Appointments_Conflict 
ON dbo.Appointments(CounselorID, Date, Time) 
WHERE Status IN ('Pending', 'Accepted');

-- Performance indexes for common queries
CREATE INDEX idx_Appointments_StudentID ON dbo.Appointments(StudentID);
CREATE INDEX idx_Appointments_CounselorID ON dbo.Appointments(CounselorID);
CREATE INDEX idx_Appointments_Date ON dbo.Appointments(Date);
CREATE INDEX idx_Appointments_Status ON dbo.Appointments(Status);

-- Composite index for appointment listing with status filter
CREATE INDEX idx_Appointments_Student_Date ON dbo.Appointments(StudentID, Date DESC, Status);
CREATE INDEX idx_Appointments_Counselor_Date ON dbo.Appointments(CounselorID, Date DESC, Status);

-- Index for AI logs analysis
CREATE INDEX idx_AI_Logs_UserID_Mode ON dbo.AI_Logs(UserID, Mode, CreatedAt DESC);
CREATE INDEX idx_AI_Logs_CreatedAt ON dbo.AI_Logs(CreatedAt DESC);

-- Index for counselor filtering
CREATE INDEX idx_Counselors_Type ON dbo.Counselors(CounselorType);
GO

PRINT '✓ Indexes created';
PRINT '';

-- =============================================================================
-- Stored Procedures
-- =============================================================================

PRINT 'Creating stored procedures...';
GO

-- Register Student with duplicate check
CREATE PROCEDURE dbo.sp_RegisterStudent
    @Name NVARCHAR(100),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM dbo.Students WHERE Email = @Email)
    BEGIN
        THROW 50001, 'Email already registered', 1;
    END
    
    INSERT INTO dbo.Students (Name, Email, PasswordHash, CreatedAt)
    VALUES (@Name, @Email, @PasswordHash, GETUTCDATE());
    
    SELECT 
        StudentID, Name, Email, CreatedAt
    FROM dbo.Students 
    WHERE StudentID = SCOPE_IDENTITY();
END
GO

PRINT '✓ sp_RegisterStudent created';
GO

-- Register Counselor with duplicate check
CREATE PROCEDURE dbo.sp_RegisterCounselor
    @Name NVARCHAR(100),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @CounselorType NVARCHAR(80),
    @Bio NVARCHAR(MAX) = NULL,
    @Photo NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM dbo.Counselors WHERE Email = @Email)
    BEGIN
        THROW 50002, 'Email already registered', 1;
    END
    
    INSERT INTO dbo.Counselors (Name, Email, PasswordHash, CounselorType, Bio, Photo, CreatedAt)
    VALUES (@Name, @Email, @PasswordHash, @CounselorType, @Bio, @Photo, GETUTCDATE());
    
    SELECT 
        CounselorID, Name, Email, CounselorType, Bio, Photo, CreatedAt
    FROM dbo.Counselors 
    WHERE CounselorID = SCOPE_IDENTITY();
END
GO

PRINT '✓ sp_RegisterCounselor created';
GO

-- Create Appointment with conflict detection
CREATE PROCEDURE dbo.sp_CreateAppointment
    @StudentID INT,
    @CounselorID INT,
    @Date DATE,
    @Time TIME
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        IF EXISTS (
            SELECT 1 FROM dbo.Appointments 
            WHERE CounselorID = @CounselorID 
            AND Date = @Date AND Time = @Time 
            AND Status IN ('Pending', 'Accepted')
        )
        BEGIN
            THROW 50003, 'This time slot is already booked', 1;
        END
        
        IF NOT EXISTS (SELECT 1 FROM dbo.Students WHERE StudentID = @StudentID)
        BEGIN
            THROW 50004, 'Student not found', 1;
        END
        
        IF NOT EXISTS (SELECT 1 FROM dbo.Counselors WHERE CounselorID = @CounselorID)
        BEGIN
            THROW 50005, 'Counselor not found', 1;
        END
        
        INSERT INTO dbo.Appointments (StudentID, CounselorID, Date, Time, Status, CreatedAt)
        VALUES (@StudentID, @CounselorID, @Date, @Time, 'Pending', GETUTCDATE());
        
        SELECT 
            AppointmentID, StudentID, CounselorID, Date, Time, Status, CreatedAt
        FROM dbo.Appointments 
        WHERE AppointmentID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT '✓ sp_CreateAppointment created';
GO

-- Get Appointments by Student
CREATE PROCEDURE dbo.sp_GetAppointmentsByStudent
    @StudentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AppointmentID,
        a.StudentID,
        a.CounselorID,
        c.Name AS CounselorName,
        c.Email AS CounselorEmail,
        c.CounselorType,
        a.Date,
        a.Time,
        a.Status,
        a.CreatedAt
    FROM dbo.Appointments a
    INNER JOIN dbo.Counselors c ON a.CounselorID = c.CounselorID
    WHERE a.StudentID = @StudentID
    ORDER BY a.Date DESC, a.Time DESC;
END
GO

PRINT '✓ sp_GetAppointmentsByStudent created';
GO

-- Get Appointments by Counselor
CREATE PROCEDURE dbo.sp_GetAppointmentsByCounselor
    @CounselorID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AppointmentID,
        a.StudentID,
        s.Name AS StudentName,
        s.Email AS StudentEmail,
        a.CounselorID,
        a.Date,
        a.Time,
        a.Status,
        a.CreatedAt
    FROM dbo.Appointments a
    INNER JOIN dbo.Students s ON a.StudentID = s.StudentID
    WHERE a.CounselorID = @CounselorID
    ORDER BY a.Date DESC, a.Time DESC;
END
GO

PRINT '✓ sp_GetAppointmentsByCounselor created';
GO

-- Update Appointment Status
CREATE PROCEDURE dbo.sp_UpdateAppointmentStatus
    @AppointmentID INT,
    @Status NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Status NOT IN ('Pending', 'Accepted', 'Rejected', 'Cancelled')
    BEGIN
        THROW 50006, 'Invalid status', 1;
    END
    
    UPDATE dbo.Appointments 
    SET Status = @Status, UpdatedAt = GETUTCDATE()
    WHERE AppointmentID = @AppointmentID;
    
    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50007, 'Appointment not found', 1;
    END
    
    SELECT 
        AppointmentID, StudentID, CounselorID, Date, Time, Status, CreatedAt, UpdatedAt
    FROM dbo.Appointments 
    WHERE AppointmentID = @AppointmentID;
END
GO

PRINT '✓ sp_UpdateAppointmentStatus created';
PRINT '';

-- =============================================================================
-- Insert Sample Data
-- =============================================================================

PRINT 'Inserting sample data...';

-- Sample Students (Password: "Password123!" for all)
INSERT INTO dbo.Students (Name, Email, PasswordHash, CreatedAt) VALUES
('Alice Johnson', 'alice.johnson@university.edu', '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK', GETUTCDATE()),
('Bob Smith', 'bob.smith@university.edu', '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK', GETUTCDATE()),
('Carol Davis', 'carol.davis@university.edu', '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK', GETUTCDATE());
GO

PRINT '✓ Sample students inserted';

-- Sample Counselors (Password: "Password123!" for all)
INSERT INTO dbo.Counselors (Name, Email, PasswordHash, CounselorType, Bio, Photo, CreatedAt) VALUES
(
    'Dr. Emily Carter',
    'emily.carter@university.edu',
    '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK',
    'Academic',
    'Ph.D. in Educational Psychology with 10+ years of experience in academic counseling. Specialized in helping students with course selection, study strategies, and academic goal setting.',
    NULL,
    GETUTCDATE()
),
(
    'Michael Rodriguez',
    'michael.rodriguez@university.edu',
    '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK',
    'Career',
    'Career development specialist with expertise in resume building, interview preparation, and career path exploration. Previously worked as HR manager at Fortune 500 companies.',
    NULL,
    GETUTCDATE()
),
(
    'Dr. Sarah Kim',
    'sarah.kim@university.edu',
    '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK',
    'Mental Health',
    'Licensed clinical psychologist specializing in stress management, anxiety, and depression. Providing supportive counseling for students facing mental health challenges.',
    NULL,
    GETUTCDATE()
),
(
    'James Wilson',
    'james.wilson@university.edu',
    '$2a$10$rZ8qY8XqVVxGJCH0Z9y1YeQJxG8t1KQYw7PqVHJ1MZw8WqYPQHZLK',
    'Personal',
    'Personal development coach focusing on work-life balance, time management, and personal growth strategies for university students.',
    NULL,
    GETUTCDATE()
);
GO

PRINT '✓ Sample counselors inserted';

-- Sample Appointments
DECLARE @StudentID1 INT, @StudentID2 INT, @StudentID3 INT;
DECLARE @CounselorID1 INT, @CounselorID2 INT, @CounselorID3 INT;

SELECT @StudentID1 = StudentID FROM dbo.Students WHERE Email = 'alice.johnson@university.edu';
SELECT @StudentID2 = StudentID FROM dbo.Students WHERE Email = 'bob.smith@university.edu';
SELECT @StudentID3 = StudentID FROM dbo.Students WHERE Email = 'carol.davis@university.edu';

SELECT @CounselorID1 = CounselorID FROM dbo.Counselors WHERE Email = 'emily.carter@university.edu';
SELECT @CounselorID2 = CounselorID FROM dbo.Counselors WHERE Email = 'michael.rodriguez@university.edu';
SELECT @CounselorID3 = CounselorID FROM dbo.Counselors WHERE Email = 'sarah.kim@university.edu';

INSERT INTO dbo.Appointments (StudentID, CounselorID, Date, Time, Status, CreatedAt) VALUES
(@StudentID1, @CounselorID1, DATEADD(DAY, 2, CAST(GETUTCDATE() AS DATE)), '10:00:00', 'Pending', GETUTCDATE()),
(@StudentID2, @CounselorID2, DATEADD(DAY, 3, CAST(GETUTCDATE() AS DATE)), '14:00:00', 'Accepted', GETUTCDATE()),
(@StudentID1, @CounselorID2, DATEADD(DAY, 5, CAST(GETUTCDATE() AS DATE)), '11:30:00', 'Pending', GETUTCDATE()),
(@StudentID3, @CounselorID3, DATEADD(DAY, 7, CAST(GETUTCDATE() AS DATE)), '09:00:00', 'Pending', GETUTCDATE());
GO

PRINT '✓ Sample appointments inserted';
PRINT '';

-- =============================================================================
-- Verification
-- =============================================================================

PRINT '========================================';
PRINT 'Database Schema Deployment Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
DECLARE @StudentCount INT, @CounselorCount INT, @AppointmentCount INT;
SELECT @StudentCount = COUNT(*) FROM dbo.Students;
SELECT @CounselorCount = COUNT(*) FROM dbo.Counselors;
SELECT @AppointmentCount = COUNT(*) FROM dbo.Appointments;

PRINT '  Students: ' + CAST(@StudentCount AS NVARCHAR(10));
PRINT '  Counselors: ' + CAST(@CounselorCount AS NVARCHAR(10));
PRINT '  Appointments: ' + CAST(@AppointmentCount AS NVARCHAR(10));
PRINT '';
PRINT 'Sample Login Credentials:';
PRINT '  Password for all users: Password123!';
PRINT '';
PRINT 'Students:';
PRINT '  - alice.johnson@university.edu';
PRINT '  - bob.smith@university.edu';
PRINT '  - carol.davis@university.edu';
PRINT '';
PRINT 'Counselors:';
PRINT '  - emily.carter@university.edu (Academic)';
PRINT '  - michael.rodriguez@university.edu (Career)';
PRINT '  - sarah.kim@university.edu (Mental Health)';
PRINT '  - james.wilson@university.edu (Personal)';
PRINT '';
PRINT '✅ Schema deployment successful!';
GO
