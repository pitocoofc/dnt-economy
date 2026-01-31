const fs = require('fs');
const path = require('path');

module.exports = {
    name: "Economia Simples",
    init: (bot) => {
        const dbPath = path.join(process.cwd(), 'economy.json');

        // Função interna para ler/escrever dados
        const getDb = () => {
            if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        };
        const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

        // COMANDO: /daily
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

        // COMANDO: /addmoney <user> <valor>
        bot.command({
            name: 'addmoney',
            description: 'Adiciona dinheiro a um usuário (Admin)',
            run: async (ctx) => {
                // Checagem básica: só quem tem permissão de ADM (opcional)
                if (!ctx.interaction.member.permissions.has('Administrator')) {
                    return ctx.reply('❌ Você não tem permissão para usar este comando.');
                }

                const target = ctx.interaction.options.getUser('user');
                const amount = ctx.interaction.options.getInteger('valor');
                const db = getDb();

                db[target.id] = (db[target.id] || 0) + amount;
                saveDb(db);

                await ctx.reply(`✅ Adicionado **R$ ${amount}** para ${target.username}.`);
            }
        });

        // COMANDO: /removemoney <user> <valor>
        bot.command({
            name: 'removemoney',
            description: 'Remove dinheiro de um usuário',
            run: async (ctx) => {
                if (!ctx.interaction.member.permissions.has('Administrator')) {
                    return ctx.reply('❌ Sem permissão.');
                }

                const target = ctx.interaction.options.getUser('user');
                const amount = ctx.interaction.options.getInteger('valor');
                const db = getDb();

                db[target.id] = Math.max(0, (db[target.id] || 0) - amount);
                saveDb(db);

                await ctx.reply(`📉 Removido **R$ ${amount}** de ${target.username}.`);
            }
        });

        console.log("💰 [Módulo] Sistema de Economia DNT carregado!");
    }
};
                      
