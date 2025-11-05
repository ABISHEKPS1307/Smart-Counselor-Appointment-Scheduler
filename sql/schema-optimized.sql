/**
 * Smart Counselor Appointment Scheduler - Optimized Database Schema
 * Azure SQL / SQL Server with Indexes, Stored Procedures, and Constraints
 */

-- =============================================================================
-- Drop existing objects (for clean deployment)
-- =============================================================================

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

-- =============================================================================
-- Create Tables
-- =============================================================================

-- Students Table
CREATE TABLE Students (
    StudentID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    
    CONSTRAINT CK_Students_Email CHECK (Email LIKE '%_@__%.__%'),
    CONSTRAINT CK_Students_Name CHECK (LEN(Name) >= 2)
);

-- Counselors Table
CREATE TABLE Counselors (
    CounselorID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CounselorType NVARCHAR(50) NOT NULL,
    Bio NVARCHAR(MAX) NULL,
    Photo NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    
    CONSTRAINT CK_Counselors_Email CHECK (Email LIKE '%_@__%.__%'),
    CONSTRAINT CK_Counselors_Name CHECK (LEN(Name) >= 2),
    CONSTRAINT CK_Counselors_Type CHECK (CounselorType IN ('Academic', 'Career', 'Personal', 'Mental Health'))
);

-- Appointments Table
CREATE TABLE Appointments (
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    CounselorID INT NOT NULL,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    
    CONSTRAINT FK_Appointments_Students FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    CONSTRAINT FK_Appointments_Counselors FOREIGN KEY (CounselorID) REFERENCES Counselors(CounselorID),
    CONSTRAINT CK_Appointments_Status CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled')),
    CONSTRAINT CK_Appointments_Date CHECK (Date >= CAST(GETUTCDATE() AS DATE))
);

-- AI Logs Table
CREATE TABLE AI_Logs (
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

-- =============================================================================
-- Create Indexes for Performance
-- =============================================================================

-- Unique indexes for email (prevent duplicates and improve login performance)
CREATE UNIQUE INDEX idx_Students_Email ON Students(Email);
CREATE UNIQUE INDEX idx_Counselors_Email ON Counselors(Email);

-- Composite unique index for appointment conflict prevention
-- Only active appointments (Pending or Accepted) are checked for conflicts
CREATE UNIQUE INDEX idx_Appointments_Conflict 
ON Appointments(CounselorID, Date, Time) 
WHERE Status IN ('Pending', 'Accepted');

-- Performance indexes for common queries
CREATE INDEX idx_Appointments_StudentID ON Appointments(StudentID);
CREATE INDEX idx_Appointments_CounselorID ON Appointments(CounselorID);
CREATE INDEX idx_Appointments_Date ON Appointments(Date);
CREATE INDEX idx_Appointments_Status ON Appointments(Status);

-- Composite index for appointment listing with status filter
CREATE INDEX idx_Appointments_Student_Date ON Appointments(StudentID, Date DESC, Status);
CREATE INDEX idx_Appointments_Counselor_Date ON Appointments(CounselorID, Date DESC, Status);

-- Index for AI logs analysis
CREATE INDEX idx_AI_Logs_UserID_Mode ON AI_Logs(UserID, Mode, CreatedAt DESC);
CREATE INDEX idx_AI_Logs_CreatedAt ON AI_Logs(CreatedAt DESC);

-- Index for counselor filtering
CREATE INDEX idx_Counselors_Type ON Counselors(CounselorType);

-- =============================================================================
-- Stored Procedures
-- =============================================================================

-- Register Student with duplicate check
GO
CREATE PROCEDURE sp_RegisterStudent
    @Name NVARCHAR(100),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check for duplicate email
    IF EXISTS (SELECT 1 FROM Students WHERE Email = @Email)
    BEGIN
        THROW 50001, 'Email already registered', 1;
    END
    
    -- Insert student
    INSERT INTO Students (Name, Email, PasswordHash, CreatedAt)
    VALUES (@Name, @Email, @PasswordHash, GETUTCDATE());
    
    -- Return created student
    SELECT 
        StudentID, 
        Name, 
        Email, 
        CreatedAt
    FROM Students 
    WHERE StudentID = SCOPE_IDENTITY();
END
GO

-- Register Counselor with duplicate check
GO
CREATE PROCEDURE sp_RegisterCounselor
    @Name NVARCHAR(100),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @CounselorType NVARCHAR(50),
    @Bio NVARCHAR(MAX) = NULL,
    @Photo NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check for duplicate email
    IF EXISTS (SELECT 1 FROM Counselors WHERE Email = @Email)
    BEGIN
        THROW 50002, 'Email already registered', 1;
    END
    
    -- Insert counselor
    INSERT INTO Counselors (Name, Email, PasswordHash, CounselorType, Bio, Photo, CreatedAt)
    VALUES (@Name, @Email, @PasswordHash, @CounselorType, @Bio, @Photo, GETUTCDATE());
    
    -- Return created counselor
    SELECT 
        CounselorID, 
        Name, 
        Email, 
        CounselorType,
        Bio,
        Photo,
        CreatedAt
    FROM Counselors 
    WHERE CounselorID = SCOPE_IDENTITY();
END
GO

-- Create Appointment with conflict detection
GO
CREATE PROCEDURE sp_CreateAppointment
    @StudentID INT,
    @CounselorID INT,
    @Date DATE,
    @Time TIME
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Check for time slot conflict
        IF EXISTS (
            SELECT 1 
            FROM Appointments 
            WHERE CounselorID = @CounselorID 
            AND Date = @Date 
            AND Time = @Time 
            AND Status IN ('Pending', 'Accepted')
        )
        BEGIN
            THROW 50003, 'This time slot is already booked', 1;
        END
        
        -- Verify student exists
        IF NOT EXISTS (SELECT 1 FROM Students WHERE StudentID = @StudentID)
        BEGIN
            THROW 50004, 'Student not found', 1;
        END
        
        -- Verify counselor exists
        IF NOT EXISTS (SELECT 1 FROM Counselors WHERE CounselorID = @CounselorID)
        BEGIN
            THROW 50005, 'Counselor not found', 1;
        END
        
        -- Create appointment
        INSERT INTO Appointments (StudentID, CounselorID, Date, Time, Status, CreatedAt)
        VALUES (@StudentID, @CounselorID, @Date, @Time, 'Pending', GETUTCDATE());
        
        DECLARE @AppointmentID INT = SCOPE_IDENTITY();
        
        -- Return created appointment with details
        SELECT 
            a.AppointmentID,
            a.StudentID,
            a.CounselorID,
            a.Date,
            a.Time,
            a.Status,
            a.CreatedAt,
            s.Name AS StudentName,
            s.Email AS StudentEmail,
            c.Name AS CounselorName,
            c.Email AS CounselorEmail,
            c.CounselorType
        FROM Appointments a
        INNER JOIN Students s ON a.StudentID = s.StudentID
        INNER JOIN Counselors c ON a.CounselorID = c.CounselorID
        WHERE a.AppointmentID = @AppointmentID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Get appointments by student with counselor details
GO
CREATE PROCEDURE sp_GetAppointmentsByStudent
    @StudentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AppointmentID,
        a.StudentID,
        a.CounselorID,
        a.Date,
        a.Time,
        a.Status,
        a.CreatedAt,
        c.Name AS CounselorName,
        c.Email AS CounselorEmail,
        c.CounselorType,
        c.Photo AS CounselorPhoto
    FROM Appointments a
    INNER JOIN Counselors c ON a.CounselorID = c.CounselorID
    WHERE a.StudentID = @StudentID
    ORDER BY a.Date DESC, a.Time DESC;
END
GO

-- Get appointments by counselor with student details
GO
CREATE PROCEDURE sp_GetAppointmentsByCounselor
    @CounselorID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AppointmentID,
        a.StudentID,
        a.CounselorID,
        a.Date,
        a.Time,
        a.Status,
        a.CreatedAt,
        s.Name AS StudentName,
        s.Email AS StudentEmail
    FROM Appointments a
    INNER JOIN Students s ON a.StudentID = s.StudentID
    WHERE a.CounselorID = @CounselorID
    ORDER BY a.Date DESC, a.Time DESC;
END
GO

-- Update appointment status with validation
GO
CREATE PROCEDURE sp_UpdateAppointmentStatus
    @AppointmentID INT,
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate status
    IF @Status NOT IN ('Pending', 'Accepted', 'Rejected', 'Cancelled')
    BEGIN
        THROW 50006, 'Invalid status value', 1;
    END
    
    -- Check if appointment exists
    IF NOT EXISTS (SELECT 1 FROM Appointments WHERE AppointmentID = @AppointmentID)
    BEGIN
        THROW 50007, 'Appointment not found', 1;
    END
    
    -- Update status
    UPDATE Appointments 
    SET Status = @Status, UpdatedAt = GETUTCDATE()
    WHERE AppointmentID = @AppointmentID;
    
    -- Return updated appointment
    SELECT 
        a.AppointmentID,
        a.StudentID,
        a.CounselorID,
        a.Date,
        a.Time,
        a.Status,
        a.CreatedAt,
        a.UpdatedAt,
        s.Name AS StudentName,
        c.Name AS CounselorName
    FROM Appointments a
    INNER JOIN Students s ON a.StudentID = s.StudentID
    INNER JOIN Counselors c ON a.CounselorID = c.CounselorID
    WHERE a.AppointmentID = @AppointmentID;
END
GO

-- =============================================================================
-- Sample Seed Data (for testing)
-- =============================================================================

-- Insert sample students (password: Password123!)
INSERT INTO Students (Name, Email, PasswordHash, CreatedAt) VALUES
('Alice Johnson', 'alice.johnson@university.edu', '$2a$10$YourHashedPasswordHere1', GETUTCDATE()),
('Bob Smith', 'bob.smith@university.edu', '$2a$10$YourHashedPasswordHere2', GETUTCDATE());

-- Insert sample counselors (password: Password123!)
INSERT INTO Counselors (Name, Email, PasswordHash, CounselorType, Bio, CreatedAt) VALUES
('Emily Carter', 'emily.carter@university.edu', '$2a$10$YourHashedPasswordHere3', 'Academic', 
 'Experienced academic counselor specializing in course selection and degree planning.', GETUTCDATE()),
('Michael Rodriguez', 'michael.rodriguez@university.edu', '$2a$10$YourHashedPasswordHere4', 'Career', 
 'Career counselor with 10+ years helping students transition to professional life.', GETUTCDATE());

-- =============================================================================
-- Database Statistics and Monitoring Views
-- =============================================================================

-- View for appointment statistics
GO
CREATE VIEW vw_AppointmentStatistics AS
SELECT 
    Status,
    COUNT(*) AS TotalCount,
    COUNT(DISTINCT StudentID) AS UniqueStudents,
    COUNT(DISTINCT CounselorID) AS UniqueCounselors
FROM Appointments
GROUP BY Status;
GO

-- View for counselor workload
GO
CREATE VIEW vw_CounselorWorkload AS
SELECT 
    c.CounselorID,
    c.Name,
    c.CounselorType,
    COUNT(a.AppointmentID) AS TotalAppointments,
    SUM(CASE WHEN a.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingAppointments,
    SUM(CASE WHEN a.Status = 'Accepted' THEN 1 ELSE 0 END) AS AcceptedAppointments
FROM Counselors c
LEFT JOIN Appointments a ON c.CounselorID = a.CounselorID
GROUP BY c.CounselorID, c.Name, c.CounselorType;
GO

-- View for AI usage statistics
GO
CREATE VIEW vw_AIUsageStatistics AS
SELECT 
    UserType,
    Mode,
    COUNT(*) AS TotalQueries,
    AVG(Duration) AS AvgDuration,
    SUM(CASE WHEN Cached = 1 THEN 1 ELSE 0 END) AS CachedQueries,
    CAST(SUM(CASE WHEN Cached = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) AS CacheHitRate
FROM AI_Logs
GROUP BY UserType, Mode;
GO

-- =============================================================================
-- Performance Monitoring Queries (for DBA)
-- =============================================================================

/*
-- Find slow queries
SELECT TOP 10
    qs.execution_count,
    qs.total_worker_time / qs.execution_count AS avg_cpu_time,
    qs.total_elapsed_time / qs.execution_count AS avg_elapsed_time,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY avg_elapsed_time DESC;

-- Check index usage
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE database_id = DB_ID()
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;
*/

PRINT 'Database schema created successfully with optimizations!';
PRINT 'Tables: Students, Counselors, Appointments, AI_Logs';
PRINT 'Indexes: 12 indexes created for performance';
PRINT 'Stored Procedures: 6 procedures created';
PRINT 'Views: 3 monitoring views created';
