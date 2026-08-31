CREATE TABLE IF NOT EXISTS bncc_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    grade_level VARCHAR(100),
    subject VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_bncc_skills (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    bncc_skill_id UUID REFERENCES bncc_skills(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, bncc_skill_id)
);

CREATE INDEX IF NOT EXISTS idx_bncc_skills_code ON bncc_skills(code);
CREATE INDEX IF NOT EXISTS idx_bncc_skills_slug ON bncc_skills(slug);
