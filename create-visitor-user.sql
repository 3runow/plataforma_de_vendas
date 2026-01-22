-- Script para criar usuários de teste (ADMIN e VISITANTE)
-- Use este script para popular o banco com usuários de teste

-- IMPORTANTE: Substitua as passwords pelos hashes reais usando bcryptjs ou similar
-- Este é apenas um exemplo. Use uma senha segura em produção.

-- Criar USUÁRIO ADMIN (acesso completo)
INSERT INTO "User" 
  (name, email, password, role, "createdAt", "updatedAt", "isGuest")
VALUES
  ('Admin Demo', 'admin@demo.com', 'hash_da_senha_admin_aqui', 'admin', NOW(), NOW(), false)
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Criar USUÁRIO VISITANTE (acesso somente leitura)
INSERT INTO "User" 
  (name, email, password, role, "createdAt", "updatedAt", "isGuest")
VALUES
  ('Visitante Demo', 'visitante@demo.com', 'hash_da_senha_visitante_aqui', 'visitor', NOW(), NOW(), false)
ON CONFLICT (email) DO UPDATE SET role = 'visitor';

-- Verificar usuários criados
SELECT id, name, email, role, "createdAt" FROM "User" 
WHERE role IN ('admin', 'visitor') 
ORDER BY "createdAt" DESC;
