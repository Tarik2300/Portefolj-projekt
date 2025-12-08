-- Testdata for JTT Task Manager
-- Baseret på JTT ApS case

-- =====================
-- BRUGERE
-- =====================
INSERT INTO users (username, name, password, role) VALUES
('mads', 'Mads Jensen', 'password123', 'TEAMLEAD'),
('sofie', 'Sofie Nielsen', 'password123', 'EMPLOYEE'),
('lars', 'Lars Pedersen', 'password123', 'EMPLOYEE'),
('emma', 'Emma Hansen', 'password123', 'EMPLOYEE');

-- =====================
-- OPGAVER
-- =====================

-- Opgave 1: Høj prioritet, i gang (Sofie)
INSERT INTO tasks (title, description, priority, deadline, status, assigned_to) VALUES
('Reparation af varmepumpe', 'Kunde i Valby har problemer med varmepumpen. Kører ikke optimalt og larmer.', 'HIGH', '2024-12-10', 'IN_PROGRESS', 2);

-- Opgave 2: Medium prioritet, ikke startet (Lars)
INSERT INTO tasks (title, description, priority, deadline, status, assigned_to) VALUES
('Serviceeftersyn hos Novo', 'Årligt serviceeftersyn af ventilationsanlæg hos Novo Nordisk, bygning A3.', 'MEDIUM', '2024-12-15', 'TODO', 3);

-- Opgave 3: Lav prioritet, færdig (Emma)
INSERT INTO tasks (title, description, priority, deadline, status, assigned_to) VALUES
('Opdater kundekartotek', 'Gennemgå og opdater kontaktinfo for alle erhvervskunder i Region Hovedstaden.', 'LOW', '2024-12-08', 'DONE', 4);

-- Opgave 4: Høj prioritet, ikke startet (Sofie)
INSERT INTO tasks (title, description, priority, deadline, status, assigned_to) VALUES
('Akut: Vandskade hos Mærsk', 'Vandskade i kælder. Pumpe og affugtning nødvendig. Kontakt: Henrik på 40123456.', 'HIGH', '2024-12-09', 'TODO', 2);

-- Opgave 5: Medium prioritet, i gang (Lars)
INSERT INTO tasks (title, description, priority, deadline, status, assigned_to) VALUES
('Installation af solceller', 'Montering af 12 solcellepaneler på lager i Glostrup. Stillads bestilt.', 'MEDIUM', '2024-12-20', 'IN_PROGRESS', 3);

-- Opgave 6: Lav prioritet, ikke startet (Emma)
INSERT INTO tasks (title, description, priority, deadline, status, assigned_to) VALUES
('Bestil nye værktøjskasser', 'Indkøb af 5 nye værktøjskasser til servicebiler. Se budget i Teams.', 'LOW', '2024-12-22', 'TODO', 4);

-- Opgave 7: Medium prioritet, færdig (Sofie)
INSERT INTO tasks (title, description, priority, deadline, status, assigned_to) VALUES
('El-tjek i butik', 'Lovpligtigt el-tjek hos tøjbutik på Strøget. Rapport sendt til kunde.', 'MEDIUM', '2024-12-05', 'DONE', 2);

-- Opgave 8: Høj prioritet, i gang (Mads - teamleder tager selv opgave)
INSERT INTO tasks (title, description, priority, deadline, status, assigned_to) VALUES
('Tilbudsgivning: DSB kontrakt', 'Udarbejd tilbud på 2-årig serviceaftale med DSB. Deadline for indsendelse.', 'HIGH', '2024-12-12', 'IN_PROGRESS', 1);

-- =====================
-- SUBTASKS
-- =====================

-- Subtasks til opgave 1 (Varmepumpe)
INSERT INTO subtasks (description, completed, task_id) VALUES
('Tjek kompressor', true, 1),
('Rens filtre', true, 1),
('Bestil reservedel', false, 1);

-- Subtasks til opgave 2 (Novo serviceeftersyn)
INSERT INTO subtasks (description, completed, task_id) VALUES
('Hent nøgler i reception', false, 2),
('Tjek alle ventiler', false, 2),
('Udfyld servicerapport', false, 2);

-- Subtasks til opgave 4 (Vandskade Mærsk)
INSERT INTO subtasks (description, completed, task_id) VALUES
('Ring til kunde', false, 4),
('Hent pumpeudstyr', false, 4),
('Tag billeder til forsikring', false, 4);

-- Subtasks til opgave 5 (Solceller)
INSERT INTO subtasks (description, completed, task_id) VALUES
('Monter beslag på tag', true, 5),
('Installer paneler', false, 5),
('Tilslut inverter', false, 5),
('Test system', false, 5);

-- Subtasks til opgave 8 (DSB tilbud)
INSERT INTO subtasks (description, completed, task_id) VALUES
('Beregn timepris', true, 8),
('Lav serviceoversigt', true, 8),
('Skriv tilbudstekst', false, 8);
