"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const password_1 = require("../../src/utils/password");
const env_1 = __importDefault(require("../../src/config/env"));
const logger_1 = require("../../src/utils/logger");
const prisma = new client_1.PrismaClient();
async function main() {
    logger_1.logger.info('Starting database seeding...');
    try {
        const existingSuperAdmin = await prisma.user.findUnique({
            where: { email: env_1.default.SUPER_ADMIN_EMAIL },
        });
        if (existingSuperAdmin) {
            logger_1.logger.info('Super admin already exists, skipping creation');
            return;
        }
        const superAdminPassword = await (0, password_1.hashPassword)(env_1.default.SUPER_ADMIN_PASSWORD);
        const superAdmin = await prisma.user.create({
            data: {
                email: env_1.default.SUPER_ADMIN_EMAIL,
                passwordHash: superAdminPassword,
                fullName: 'Super Administrator',
                role: client_1.UserRole.super_admin,
                isActive: true,
            },
        });
        logger_1.logger.info('Super admin created successfully', {
            id: superAdmin.id,
            email: superAdmin.email,
        });
        const sampleCenter = await prisma.center.create({
            data: {
                name: 'Sample Educational Center',
                location: '123 Education Street, Learning City, LC 12345',
                phoneNumber: '+1-555-0123',
                email: 'info@samplecenter.edu',
                createdBy: superAdmin.id,
            },
        });
        logger_1.logger.info('Sample center created successfully', {
            id: sampleCenter.id,
            name: sampleCenter.name,
        });
        const centerAdminPassword = await (0, password_1.hashPassword)('Admin123!');
        const centerAdmin = await prisma.user.create({
            data: {
                email: 'admin@samplecenter.edu',
                passwordHash: centerAdminPassword,
                fullName: 'Center Administrator',
                phoneNumber: '+1-555-0124',
                role: client_1.UserRole.center_admin,
                centerId: sampleCenter.id,
                isActive: true,
            },
        });
        logger_1.logger.info('Sample center admin created successfully', {
            id: centerAdmin.id,
            email: centerAdmin.email,
            centerId: sampleCenter.id,
        });
        logger_1.logger.info('Database seeding completed successfully');
    }
    catch (error) {
        logger_1.logger.error('Database seeding failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
    }
}
main()
    .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=index.js.map