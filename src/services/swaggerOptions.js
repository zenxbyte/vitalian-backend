import swaggerJsDoc from "swagger-jsdoc";

const swaggerOptions = {
  swaggerDefinition: {
    myapi: "3.0.0",
    info: {
      title: "Application EndPoints",
      version: "1.0.0",
      description: "API Documentation",
    },
    servers: [
      {
        url: "http://localhost:3050",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerDocs = swaggerJsDoc(swaggerOptions);
