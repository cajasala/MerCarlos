const { poolPromise, sql } = require('./utils/db');
(async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 as test');
    console.log('Database connection successful:', result.recordset);
    
    // Check if tables exist
    const tablesResult = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    console.log('Tables:', tablesResult.recordset.map(r => r.TABLE_NAME));
    
    // Check Orden table specifically
    const ordenResult = await pool.request().query('SELECT TOP 1 * FROM Orden');
    console.log('Orden table sample:', ordenResult.recordset[0] || 'No records');
    
    // Check StatusOrden table
    const statusResult = await pool.request().query('SELECT * FROM StatusOrden');
    console.log('StatusOrden table:', statusResult.recordset);
  } catch (err) {
    console.error('Database error:', err.message);
  }
})();