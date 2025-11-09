/*******************************************************************************
 * Smart Counselor Appointment Scheduler - Feedback Feature Schema Update
 * Add Feedback table for AI-powered counselor rating system
 * 
 * Features:
 * - Feedback storage with AI-generated ratings
 * - Sentiment analysis
 * - AI-generated summaries
 * - Foreign key constraints
 * - Performance indexes
 *******************************************************************************/

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '========================================';
PRINT 'Adding Feedback Feature';
PRINT '========================================';
PRINT '';

-- =============================================================================
-- Drop existing Feedback table if exists
-- =============================================================================

IF OBJECT_ID('dbo.Feedback', 'U') IS NOT NULL 
BEGIN
    PRINT 'Dropping existing Feedback table...';
    DROP TABLE dbo.Feedback;
    PRINT '✓ Feedback table dropped';
END
GO

-- =============================================================================
-- Create Feedback Table
-- =============================================================================

PRINT 'Creating Feedback table...';

CREATE TABLE dbo.Feedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    AppointmentID INT NOT NULL,
    StudentID INT NOT NULL,
    CounselorID INT NOT NULL,
    FeedbackText NVARCHAR(MAX) NOT NULL,
    Rating INT NOT NULL,
    Sentiment NVARCHAR(20) NOT NULL,
    Summary NVARCHAR(500) NULL,
    ImprovementSuggestions NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign key constraints
    CONSTRAINT FK_Feedback_Appointment FOREIGN KEY (AppointmentID) REFERENCES dbo.Appointments(AppointmentID) ON DELETE CASCADE,
    CONSTRAINT FK_Feedback_Student FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID),
    CONSTRAINT FK_Feedback_Counselor FOREIGN KEY (CounselorID) REFERENCES dbo.Counselors(CounselorID),
    
    -- Check constraints
    CONSTRAINT CK_Feedback_Rating CHECK (Rating >= 1 AND Rating <= 5),
    CONSTRAINT CK_Feedback_Sentiment CHECK (Sentiment IN ('positive', 'neutral', 'negative')),
    CONSTRAINT CK_Feedback_Text CHECK (LEN(FeedbackText) >= 10),
    
    -- Unique constraint - one feedback per appointment
    CONSTRAINT UQ_Feedback_Appointment UNIQUE (AppointmentID)
);
GO

PRINT '✓ Feedback table created';

-- =============================================================================
-- Create Performance Indexes
-- =============================================================================

PRINT 'Creating indexes...';

-- Index for getting feedback by counselor (most common query)
CREATE NONCLUSTERED INDEX IX_Feedback_CounselorID 
ON dbo.Feedback(CounselorID) 
INCLUDE (Rating, Sentiment, Summary, CreatedAt);

-- Index for getting feedback by student
CREATE NONCLUSTERED INDEX IX_Feedback_StudentID 
ON dbo.Feedback(StudentID) 
INCLUDE (Rating, Sentiment, Summary, CreatedAt);

-- Index for getting feedback by appointment
CREATE NONCLUSTERED INDEX IX_Feedback_AppointmentID 
ON dbo.Feedback(AppointmentID);

PRINT '✓ Indexes created';
PRINT '';

-- =============================================================================
-- Verify Installation
-- =============================================================================

PRINT 'Verifying installation...';

IF OBJECT_ID('dbo.Feedback', 'U') IS NOT NULL
BEGIN
    PRINT '✓ Feedback table exists';
    
    -- Check row count
    DECLARE @rowCount INT;
    SELECT @rowCount = COUNT(*) FROM dbo.Feedback;
    PRINT '  Row count: ' + CAST(@rowCount AS NVARCHAR(10));
    
    -- List indexes
    SELECT 
        name AS IndexName,
        type_desc AS IndexType
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.Feedback')
    AND name IS NOT NULL;
END
ELSE
BEGIN
    PRINT '✗ Feedback table creation failed';
END

PRINT '';
PRINT '========================================';
PRINT 'Feedback Feature Schema Update Complete';
PRINT '========================================';
GO
