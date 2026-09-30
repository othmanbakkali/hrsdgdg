-- =============================================================================
-- HRSDGDG PLATFORM — POSTGRESQL RELATIONAL DATABASE SCHEMA
-- =============================================================================

-- 1. Users Table (Clients, Merchants/Jewellers, Administrators)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'client', -- 'client', 'commercant', 'admin'
    seller_type VARCHAR(64),                     -- 'bijouterie', 'expert', 'marque', 'particulier'
    shop_name VARCHAR(255),
    phone VARCHAR(64),
    address TEXT,
    city VARCHAR(100),
    badges JSONB DEFAULT '[]'::jsonb,
    satisfaction NUMERIC(5, 2) DEFAULT 100,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    sales_count INT DEFAULT 0,
    favoris JSONB DEFAULT '[]'::jsonb,
    subscription JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    nom_fr VARCHAR(100) NOT NULL,
    nom_ar VARCHAR(100),
    nom_en VARCHAR(100),
    icon VARCHAR(32) DEFAULT '💎',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Jewelry Products (Bijoux) Table
CREATE TABLE IF NOT EXISTS bijoux (
    id VARCHAR(64) PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    titre_fr VARCHAR(255),
    titre_ar VARCHAR(255),
    titre_en VARCHAR(255),
    description TEXT,
    description_fr TEXT,
    description_ar TEXT,
    description_en TEXT,
    prix NUMERIC(12, 2) NOT NULL,
    ancien_prix NUMERIC(12, 2),
    type_vente VARCHAR(32) NOT NULL DEFAULT 'FIRST_HAND', -- 'FIRST_HAND', 'SECOND_HAND', 'AUCTION'
    matiere VARCHAR(64) DEFAULT 'Or',
    gramme NUMERIC(8, 2) DEFAULT 0,
    poids NUMERIC(8, 2) DEFAULT 0,
    purete VARCHAR(32) DEFAULT '18k',
    pierre VARCHAR(100) DEFAULT 'Aucune',
    taille VARCHAR(64) DEFAULT 'Unique',
    etat VARCHAR(64) DEFAULT 'Neuf',
    annee INT,
    nombre_proprietaires INT DEFAULT 1,
    style VARCHAR(64) DEFAULT 'Moderne',
    occasion VARCHAR(64) DEFAULT 'Cadeau',
    pour_qui VARCHAR(64) DEFAULT 'Femme',
    images JSONB DEFAULT '[]'::jsonb,
    disponibilite VARCHAR(32) DEFAULT 'disponible', -- 'disponible', 'rupture', 'enchere'
    city VARCHAR(100) DEFAULT 'Casablanca',
    stock INT DEFAULT 1,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    commercant_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    vendeur_nom VARCHAR(255),
    vendeur_type VARCHAR(64) DEFAULT 'bijouterie',
    vendeur_badge VARCHAR(100) DEFAULT '✓ Vendeur vérifié',
    garantie BOOLEAN DEFAULT false,
    facture BOOLEAN DEFAULT false,
    certificat BOOLEAN DEFAULT false,
    boite BOOLEAN DEFAULT false,
    authentifie VARCHAR(64) DEFAULT 'Vérifié',
    badge VARCHAR(64),
    note NUMERIC(3, 2) DEFAULT 5.0,
    nombre_avis INT DEFAULT 0,
    favoris_count INT DEFAULT 0,
    statut VARCHAR(32) DEFAULT 'Validated', -- 'Validated', 'Pending', 'Rejected'
    rejection_reason TEXT,
    why_this_item JSONB DEFAULT '[]'::jsonb,
    look_complementary_ids JSONB DEFAULT '[]'::jsonb,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    bijou_id VARCHAR(64) REFERENCES bijoux(id) ON DELETE CASCADE,
    client_id VARCHAR(64),
    client_nom VARCHAR(255) DEFAULT 'Client HRSDGDG',
    note INT NOT NULL CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Auctions (Enchères) Table
CREATE TABLE IF NOT EXISTS encheres (
    id VARCHAR(64) PRIMARY KEY,
    bijou_id VARCHAR(64) REFERENCES bijoux(id) ON DELETE CASCADE,
    prix_depart NUMERIC(12, 2) NOT NULL,
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    increment_min NUMERIC(10, 2) DEFAULT 50,
    prix_reserve NUMERIC(12, 2),
    statut VARCHAR(32) DEFAULT 'Active', -- 'Active', 'Ended', 'Cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Auction Bids (Offres Enchères) Table
CREATE TABLE IF NOT EXISTS offres_encheres (
    id VARCHAR(64) PRIMARY KEY,
    enchere_id VARCHAR(64) REFERENCES encheres(id) ON DELETE CASCADE,
    client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    montant NUMERIC(12, 2) NOT NULL,
    date_offre TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Orders (Commandes) Table
CREATE TABLE IF NOT EXISTS commandes (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    client_nom VARCHAR(255),
    client_telephone VARCHAR(64),
    client_adresse TEXT,
    client_ville VARCHAR(100),
    mode_paiement VARCHAR(64) DEFAULT 'cash_on_delivery',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
    statut VARCHAR(64) DEFAULT 'Confirmed', -- 'Confirmed', 'In Preparation', 'Shipped', 'Delivered', 'Cancelled'
    tracking_steps JSONB DEFAULT '[]'::jsonb,
    date_commande TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    bijou_id VARCHAR(64) REFERENCES bijoux(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    badge VARCHAR(64),
    price_monthly NUMERIC(10, 2) DEFAULT 0,
    price_annual NUMERIC(10, 2) DEFAULT 0,
    max_products INT DEFAULT 5,
    commission_rate NUMERIC(5, 2) DEFAULT 8.0,
    features JSONB DEFAULT '[]'::jsonb
);

-- 10. System Configuration Table
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Sessions Table (User Authentication Sessions)
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    nom VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bijoux_category ON bijoux(category_id);
CREATE INDEX IF NOT EXISTS idx_bijoux_commercant ON bijoux(commercant_id);
CREATE INDEX IF NOT EXISTS idx_bijoux_statut ON bijoux(statut);
CREATE INDEX IF NOT EXISTS idx_bijoux_type_vente ON bijoux(type_vente);
CREATE INDEX IF NOT EXISTS idx_bijoux_prix ON bijoux(prix);
CREATE INDEX IF NOT EXISTS idx_encheres_statut ON encheres(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

