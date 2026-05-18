-- Seed data for development/testing

-- Insert test admin user (password: Admin123!)
INSERT INTO users (id, name, email, password, role) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Admin User',
    'admin@nexarecruit.com',
    '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoS6kxMAGfX5.F4eW0.dCDEz7u5F8xJi',
    'ADMIN'
)
ON CONFLICT (email) DO NOTHING;

-- Insert test recruiter (password: Recruiter123!)
INSERT INTO users (id, name, email, password, role) VALUES
(
    'a0000000-0000-0000-0000-000000000002',
    'Sarah Johnson',
    'recruiter@nexarecruit.com',
    '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoS6kxMAGfX5.F4eW0.dCDEz7u5F8xJi',
    'RECRUITER'
)
ON CONFLICT (email) DO NOTHING;

-- Insert test candidate (password: Candidate123!)
INSERT INTO users (id, name, email, password, role) VALUES
(
    'a0000000-0000-0000-0000-000000000003',
    'Alex Developer',
    'candidate@nexarecruit.com',
    '$2a$12$LQv3c1yqBo9SkvXS7QTJPOoS6kxMAGfX5.F4eW0.dCDEz7u5F8xJi',
    'CANDIDATE'
)
ON CONFLICT (email) DO NOTHING;
