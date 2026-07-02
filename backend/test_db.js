const { testConnection } = require('./config/database');
(async () => {
  const result = await testConnection();
  console.log(result);
  process.exit();
})();
