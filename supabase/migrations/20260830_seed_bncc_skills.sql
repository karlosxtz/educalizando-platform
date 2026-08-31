-- Migration: Seed initial BNCC Skills
-- Includes samples for Early Childhood and Elementary (1st to 5th grade)

INSERT INTO bncc_skills (code, slug, description, grade_level, subject)
VALUES 
    -- Educação Infantil (Crianças Pequenas: 4 a 5 anos)
    ('EI03EO01', 'ei03eo01', 'Demonstrar empatia pelos outros, percebendo que as pessoas têm diferentes sentimentos, necessidades e maneiras de pensar e agir.', 'Educação Infantil (4 a 5 anos)', 'O eu, o outro e o nós'),
    ('EI03CG01', 'ei03cg01', 'Criar com o corpo formas diversificadas de expressão de sentimentos, sensações e emoções, tanto nas situações do cotidiano quanto em brincadeiras, dança, teatro, música.', 'Educação Infantil (4 a 5 anos)', 'Corpo, gestos e movimentos'),
    ('EI03TS01', 'ei03ts01', 'Utilizar sons produzidos por materiais, objetos e instrumentos musicais durante brincadeiras de faz de conta, encenações, criações musicais, festas.', 'Educação Infantil (4 a 5 anos)', 'Traços, sons, cores e formas'),
    ('EI03EF01', 'ei03ef01', 'Expressar ideias, desejos e sentimentos sobre suas vivências, por meio da linguagem oral e escrita (escrita espontânea), de fotos, desenhos e outras formas de expressão.', 'Educação Infantil (4 a 5 anos)', 'Escuta, fala, pensamento e imaginação'),
    ('EI03ET01', 'ei03et01', 'Estabelecer relações de comparação entre objetos, observando suas propriedades.', 'Educação Infantil (4 a 5 anos)', 'Espaços, tempos, quantidades, relações e transformações'),
    
    -- Ensino Fundamental 1º Ano
    ('EF01LP01', 'ef01lp01', 'Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo da página.', '1º Ano', 'Língua Portuguesa'),
    ('EF01MA01', 'ef01ma01', 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas e reconhecer situações em que os números não indicam contagem nem ordem, mas sim código de identificação.', '1º Ano', 'Matemática'),
    ('EF01CI01', 'ef01ci01', 'Comparar características de diferentes materiais presentes em objetos de uso cotidiano, discutindo sua origem, os modos como são descartados e como podem ser usados de forma mais consciente.', '1º Ano', 'Ciências'),
    
    -- Ensino Fundamental 2º Ano
    ('EF02LP01', 'ef02lp01', 'Utilizar, ao produzir o texto, grafia correta de palavras conhecidas ou com estruturas silábicas já dominadas, letras maiúsculas no início de frases e em substantivos próprios, pontuação no final de frases.', '2º Ano', 'Língua Portuguesa'),
    ('EF02MA01', 'ef02ma01', 'Comparar e ordenar números naturais (até a ordem de centenas) pela compreensão de características do sistema de numeração decimal (valor posicional e função do zero).', '2º Ano', 'Matemática'),
    
    -- Ensino Fundamental 3º Ano
    ('EF03LP01', 'ef03lp01', 'Ler e compreender, com autonomia, textos injuntivos instrucionais (receitas, instruções de montagem etc.), com a estrutura própria desses textos e mesclando palavras, imagens e recursos gráfico-visuais.', '3º Ano', 'Língua Portuguesa'),
    ('EF03MA01', 'ef03ma01', 'Ler, escrever e comparar números naturais de até a ordem de unidade de milhar, estabelecendo relações entre os registros numéricos e em língua materna.', '3º Ano', 'Matemática'),
    
    -- Ensino Fundamental 4º Ano
    ('EF04LP01', 'ef04lp01', 'Grafar palavras utilizando regras de correspondência fonema-grafema regulares diretas e contextuais.', '4º Ano', 'Língua Portuguesa'),
    ('EF04MA01', 'ef04ma01', 'Ler, escrever e ordenar números naturais até a ordem de dezenas de milhar.', '4º Ano', 'Matemática'),
    
    -- Ensino Fundamental 5º Ano
    ('EF05LP01', 'ef05lp01', 'Grafar palavras utilizando regras de correspondência fonema-grafema regulares, contextuais e morfológicas e palavras de uso frequente com correspondências irregulares.', '5º Ano', 'Língua Portuguesa'),
    ('EF05MA01', 'ef05ma01', 'Ler, escrever e ordenar números naturais até a ordem das centenas de milhar com compreensão das principais características do sistema de numeração decimal.', '5º Ano', 'Matemática')
ON CONFLICT (code) DO NOTHING;
