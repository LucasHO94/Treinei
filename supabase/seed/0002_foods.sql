-- Treinei — seed inicial de alimentos (subconjunto comum, por 100g)
-- Valores aproximados de referência nutricional pública (TACO/TBCA).
-- IDs fixos para baterem com o seed local embutido no app (src/lib/db/local-seed.ts).
-- TODO (Fase 3): importar tabela TACO completa (~500 itens) via CSV — ver README.md.

insert into foods (id, name, portion_desc, portion_grams, protein_g, carbs_g, fat_g, kcal) values
  ('b298af11-7b2b-4966-a21a-05da193de214', 'Arroz branco cozido', '100g', 100, 2.5, 28.1, 0.2, 128),
  ('d017c251-fa3b-4d91-ba5a-ec3988ac6f65', 'Arroz integral cozido', '100g', 100, 2.6, 25.8, 1, 124),
  ('1e93d5b5-0d87-4550-a7cb-5d7e2770cd10', 'Feijão carioca cozido', '100g', 100, 4.8, 13.6, 0.5, 76),
  ('a27a2db4-4a9a-49f0-9baa-261bf0462a04', 'Feijão preto cozido', '100g', 100, 4.5, 14, 0.5, 77),
  ('4125200c-02d6-4580-9dd7-f1b4e0162cbe', 'Peito de frango grelhado', '100g', 100, 32, 0, 3.6, 159),
  ('21b785df-a42b-4d21-918a-c7af28b53d62', 'Coxa de frango assada', '100g', 100, 26, 0, 10, 197),
  ('2ecb1535-94a1-4ab7-9bfb-ebaa050cf6b7', 'Carne bovina moída (patinho)', '100g', 100, 26, 0, 8, 180),
  ('ac7ebfca-e8c8-4746-bdc6-d33ee19edd59', 'Ovo cozido', '1 unidade', 50, 6.3, 0.6, 5, 70),
  ('6e234da4-a65e-426b-8d10-858d4224fbe0', 'Ovo (clara)', '1 unidade', 33, 3.6, 0.2, 0, 17),
  ('935273f0-8944-4816-a015-70334dfe7571', 'Batata doce cozida', '100g', 100, 1.6, 20.1, 0.1, 86),
  ('e4c52205-3198-4907-96c3-d22213e537ee', 'Batata inglesa cozida', '100g', 100, 1.9, 18.2, 0.1, 82),
  ('20ca8cd7-96f1-40c6-b59c-80038d9ec1e2', 'Aveia em flocos', '100g', 100, 13.9, 66.6, 8.5, 394),
  ('8ad726e1-c0d1-4159-999a-9d4cc49f8d96', 'Pão francês', '1 unidade', 50, 4, 28, 1.5, 135),
  ('76de02ae-9759-4a7c-bdf3-acf6d6de3066', 'Pão integral', '1 fatia', 25, 2.5, 12, 1, 70),
  ('c539b298-47cd-4d9e-bf93-56d61281fa6e', 'Whey protein (concentrado)', '1 scoop', 30, 24, 3, 1.5, 120),
  ('244c60d3-5b69-4e69-aa4a-4d2821f2867a', 'Banana prata', '1 unidade', 70, 0.9, 20, 0.1, 85),
  ('989e090a-70ad-4061-9f8d-cb702b22da6e', 'Maçã', '1 unidade', 130, 0.3, 19, 0.2, 78),
  ('326b3a39-b713-4e60-a67d-81331866c1bd', 'Brócolis cozido', '100g', 100, 2.8, 4, 0.4, 28),
  ('9abfe2ec-4672-473d-a2da-52056cb3f8d9', 'Tomate', '100g', 100, 0.9, 3.9, 0.2, 18),
  ('c6aaa5a8-a3e1-4028-8fa4-74260f30f461', 'Alface', '100g', 100, 1.4, 1.7, 0.2, 11),
  ('25308918-8844-4377-bd29-138079c3933a', 'Azeite de oliva extra virgem', '1 colher (sopa)', 13, 0, 0, 13.5, 119),
  ('253605dc-0be2-4f3d-8dce-92f962d8d497', 'Castanha do Pará', '1 unidade', 5, 0.7, 0.6, 3.4, 33),
  ('27cd390b-351f-4234-959a-8335e91c5c49', 'Amendoim torrado', '30g', 30, 7.6, 6, 14, 175),
  ('93d2cb38-c8b0-402d-a393-bc73f44fdf30', 'Iogurte natural integral', '100g', 100, 3.5, 4.7, 3, 61),
  ('cc8e73c3-2572-4f04-9cc3-1b76d330ca57', 'Leite desnatado', '200ml', 200, 6.8, 9.8, 0.4, 70),
  ('8e46cf95-1206-435e-a330-6077425e290e', 'Queijo minas frescal', '30g', 30, 5.4, 0.9, 4.3, 71),
  ('e2e06109-2bcc-4b7a-8a49-4494867517ea', 'Tapioca (goma hidratada)', '100g', 100, 0, 25, 0, 100),
  ('00a500d9-2116-4cb6-b725-41a192fc45f9', 'Salmão grelhado', '100g', 100, 22, 0, 13, 208),
  ('f5aeb1dc-fddb-4578-87e3-63643eab3a6f', 'Atum em água (lata)', '100g', 100, 26, 0, 1, 116),
  ('23f0660e-2643-4ba6-998a-2c7b7bffe75e', 'Abacate', '100g', 100, 2, 8.5, 14.7, 160);
