// MongoDB initialization script
db = db.getSiblingDB('helpdesk');

// Create collections
db.createCollection('users');
db.createCollection('articles');
db.createCollection('tickets');
db.createCollection('agentsuggestions');
db.createCollection('auditlogs');
db.createCollection('configs');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.articles.createIndex({ "title": "text", "body": "text", "tags": "text" });
db.tickets.createIndex({ "createdBy": 1 });
db.tickets.createIndex({ "status": 1 });
db.agentsuggestions.createIndex({ "ticketId": 1 });
db.auditlogs.createIndex({ "ticketId": 1 });
db.auditlogs.createIndex({ "traceId": 1 });

print('MongoDB initialized successfully');


