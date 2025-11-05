/**
 * Swagger/OpenAPI Documentation Configuration
 */

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import config from './config.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Counselor Appointment Scheduler API',
      version: '1.0.0',
      description: 'RESTful API for managing student-counselor appointments with AI-powered recommendations',
      contact: {
        name: 'API Support',
        email: 'support@counselorscheduler.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: config.env === 'production' 
          ? 'https://your-app.azurewebsites.net'
          : `http://localhost:${config.port}`,
        description: config.env === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login'
        }
      },
      schemas: {
        Student: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            StudentID: {
              type: 'integer',
              description: 'Auto-generated student ID'
            },
            name: {
              type: 'string',
              minLength: 2,
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@university.edu'
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'Password123!'
            },
            CreatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Counselor: {
          type: 'object',
          required: ['name', 'email', 'password', 'counselorType'],
          properties: {
            CounselorID: {
              type: 'integer'
            },
            name: {
              type: 'string',
              example: 'Dr. Jane Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane.smith@university.edu'
            },
            password: {
              type: 'string',
              minLength: 8
            },
            counselorType: {
              type: 'string',
              enum: ['Academic', 'Career', 'Personal', 'Mental Health'],
              example: 'Academic'
            },
            bio: {
              type: 'string',
              example: 'Experienced academic counselor with 10+ years'
            },
            photo: {
              type: 'string',
              example: 'https://example.com/photo.jpg'
            },
            CreatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Appointment: {
          type: 'object',
          required: ['studentID', 'counselorID', 'date', 'time'],
          properties: {
            AppointmentID: {
              type: 'integer'
            },
            studentID: {
              type: 'integer'
            },
            counselorID: {
              type: 'integer'
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2024-12-25'
            },
            time: {
              type: 'string',
              format: 'time',
              example: '14:00:00'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
              default: 'Pending'
            },
            CreatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AIQuery: {
          type: 'object',
          required: ['prompt', 'mode'],
          properties: {
            prompt: {
              type: 'string',
              minLength: 3,
              example: 'I need help choosing a counselor for career guidance'
            },
            mode: {
              type: 'string',
              enum: ['chat', 'summarizeFeedback', 'recommendation'],
              example: 'recommendation'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Invalid credentials'
                },
                code: {
                  type: 'integer',
                  example: 401
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Students',
        description: 'Student management operations'
      },
      {
        name: 'Counselors',
        description: 'Counselor management operations'
      },
      {
        name: 'Appointments',
        description: 'Appointment booking and management'
      },
      {
        name: 'AI',
        description: 'AI-powered assistance and recommendations'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to API routes with JSDoc comments
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger UI
 * @param {object} app - Express app
 */
export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Counselor Scheduler API Docs'
  }));
  
  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

export default specs;
