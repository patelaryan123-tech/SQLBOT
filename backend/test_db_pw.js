const mysql = require('mysql2/promise');

const passwords = ['', 'root', 'password', '123456', 'admin'];
const user = 'root';

(async () => {
    for (const pw of passwords) {
        try {
            console.log(`Trying password: '${pw}'`);
            const conn = await mysql.createConnection({
                host: 'localhost',
                user: user,
                password: pw
            });
            console.log(`SUCCESS with password: '${pw}'`);
            await conn.end();
            process.exit(0);
        } catch (e) {
            console.log(`Failed: ${e.message}`);
        }
    }
    console.log('All failed.');
    process.exit(1);
})();
