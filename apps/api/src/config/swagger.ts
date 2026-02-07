import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flux ERP API',
      version: '1.0.0',
      description: 'API Documentation for the Flux ERP System',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local Development Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  
  apis: [path.join(__dirname, '../docs/*.yaml')], 
};

export const swaggerSpec = swaggerJsdoc(options);