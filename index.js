const fs = require('fs');
const path = require('path');

module.exports = {
    name: "Economia DNT",
    init: (bot) => {
        const dbPath = path.join(process.cwd(), 'economy.json');

        const getDb = () => {
            if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        };
        const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

        // --- COMANDO: /balance ---
        bot.command({
            name: 'balance',
            description: 'Verifica o saldo bancário',
            options: [
                { name: 'user', description: 'Usuário para ver o saldo', type: 6, required: false }
            ],
            run: async (ctx) => {
                const db = getDb();
                const target = ctx.interaction.options.getUser('user') || ctx.interaction.user;
                const saldo = db[target.id] || 0;
                
                await ctx.reply(`💰 O saldo de **${target.username}** é **R$ ${saldo}**.`);
            }
        });

        // --- COMANDO: /daily ---
        bot.command({
            name: 'daily',
            description: 'Receba seus 100 reais diários',
            run: async (ctx) => {
                const db = getDb();
                const userId = ctx.interaction.user.id;
                db[userId] = (db[userId] || 0) + 100;
                saveDb(db);
                await ctx.reply(`💸 Você recebeu **R$ 100**! Saldo atual: **R$ ${db[userId]}**.`);
            }
        });

        // --- COMANDO: /addmoney ---
        bot.command({
            name: 'addmoney',
            description: 'Adiciona dinheiro a um usuário (Admin)',
            options: [
                { name: 'user', description: 'Usuário', type: 6, required: true },
                { name: 'valor', description: 'Quantia', type: 4, required: true }
            ],
            run: async (ctx) => {
                if (!ctx.interaction.member.permissions.has('Administrator')) return ctx.reply('❌ Sem permissão.');
                const target = ctx.interaction.options.getUser('user');
                const amount = ctx.interaction.options.getInteger('valor');
                const db = getDb();
                db[target.id] = (db[target.id] || 0) + amount;
                saveDb(db);
                await ctx.reply(`✅ Adicionado **R$ ${amount}** para ${target.username}.`);
            }
        });

        // --- COMANDO: /ranking ---
        bot.command({
            name: 'ranking',
            description: 'Veja quem são os mais ricos do servidor',
            run: async (ctx) => {
                const db = getDb();
                
                // Transforma o objeto {id: saldo} em uma array ordenada
                const sorted = Object.entries(db)
                    .map(([id, balance]) => ({ id, balance }))
                    .sort((a, b) => b.balance - a.balance)
                    .slice(0, 10); // Pega o Top 10

                if (sorted.length === 0) {
                    return ctx.reply("🏦 Ninguém tem dinheiro ainda. Que tal usar o `/daily`?");
                }

                let rankMsg = "🏆 **RANKING DE RICOS DA NDJ-LIB** 🏆\n\n";
                
                // Monta a lista visual
                for (let i = 0; i < sorted.length; i++) {
                    try {
                        // Tenta buscar o nome do usuário para ficar bonito no log
                        const user = await ctx.client.users.fetch(sorted[i].id);
                        rankMsg += `${i + 1}. **${user.username}** — R$ ${sorted[i].balance}\n`;
                    } catch {
                        rankMsg += `${i + 1}. *Usuário Desconhecido* — R$ ${sorted[i].balance}\n`;
                    }
                }

                await ctx.reply(rankMsg);
            }
        });
        
        // --- COMANDO: /roleta ---
        bot.command({
            name: 'roleta',
            description: 'Tente a sorte na roleta do Tigrinho DNT!',
            options: [
                { name: 'valor', description: 'Quanto quer apostar?', type: 4, required: true }
            ],
            run: async (ctx) => {
                const db = getDb();
                const userId = ctx.interaction.user.id;
                const aposta = ctx.interaction.options.getInteger('valor');

                if (aposta <= 0) return ctx.reply("❌ Aposte um valor válido!");
                if ((db[userId] || 0) < aposta) return ctx.reply("❌ Saldo insuficiente!");

                // Emojis baseados na sua animação
                const itens = ['🍒', '🐯', '🌸'];
                const resultado = [
                    itens[Math.floor(Math.random() * itens.length)],
                    itens[Math.floor(Math.random() * itens.length)],
                    itens[Math.floor(Math.random() * itens.length)]
                ];

                let multiplicador = 0;
                let mensagem = "";

                // Lógica de Ganho baseada no GIF
                if (resultado[0] === resultado[1] && resultado[1] === resultado[2]) {
                    const icone = resultado[0];
                    if (icone === '🍒') multiplicador = 2;
                    if (icone === '🐯') multiplicador = 5;
                    if (icone === '🌸') multiplicador = 10;
                    
                    const ganho = aposta * multiplicador;
                    db[userId] += ganho;
                    mensagem = `🎰 **[ ${resultado.join(' | ')} ]**\n\n🔥 MODO TURBO! Você ganhou **R$ ${ganho}** (${multiplicador}x)!`;
                } else {
                    db[userId] -= aposta;
                    mensagem = `🎰 **[ ${resultado.join(' | ')} ]**\n\n📉 Não foi dessa vez... Você perdeu **R$ ${aposta}**.`;
                }

                saveDb(db);
                await ctx.reply(mensagem);
            }
        });


                // --- COMANDO: /coinflip ---
        bot.command({
            name: 'coinflip',
            description: 'Aposte seu dinheiro no cara ou coroa',
            options: [
                { name: 'lado', description: 'Escolha seu lado', type: 3, required: true, 
                  choices: [{ name: 'Cara', value: 'cara' }, { name: 'Coroa', value: 'coroa' }] },
                { name: 'valor', description: 'Quanto quer apostar?', type: 4, required: true }
            ],
            run: async (ctx) => {
                const db = getDb();
                const userId = ctx.interaction.user.id;
                const escolha = ctx.interaction.options.getString('lado');
                const aposta = ctx.interaction.options.getInteger('valor');

                // Validações
                if (aposta <= 0) return ctx.reply("❌ Aposte um valor válido!");
                if ((db[userId] || 0) < aposta) return ctx.reply("❌ Você não tem saldo suficiente para essa aposta.");

                const resultado = Math.random() < 0.5 ? 'cara' : 'coroa';
                const venceu = escolha === resultado;

                if (venceu) {
                    db[userId] += aposta;
                    await ctx.reply(`🪙 Caiu **${resultado}**! Você ganhou **R$ ${aposta}**! 🎉`);
                } else {
                    db[userId] -= aposta;
                    await ctx.reply(`🪙 Caiu **${resultado}**... Você perdeu **R$ ${aposta}**. 💸`);
                }

                saveDb(db);
            }
        });
        

        
        // --- COMANDO: /removemoney ---
        bot.command({
            name: 'removemoney',
            description: 'Remove dinheiro de um usuário',
            options: [
                { name: 'user', description: 'Usuário', type: 6, required: true },
                { name: 'valor', description: 'Quantia', type: 4, required: true }
            ],
            run: async (ctx) => {
                if (!ctx.interaction.member.permissions.has('Administrator')) return ctx.reply('❌ Sem permissão.');
                const target = ctx.interaction.options.getUser('user');
                const amount = ctx.interaction.options.getInteger('valor');
                const db = getDb();
                db[target.id] = Math.max(0, (db[target.id] || 0) - amount);
                saveDb(db);
                await ctx.reply(`📉 Removido **R$ ${amount}** de ${target.username}.`);
            }
        });

        console.log("💰 [Módulo] Sistema de Economia DNT (com Balance) carregado!");
    }
};
