import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { getPool, sql } from './db';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4000;

// Get all source types
app.get('/source-types', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM source_types');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Create data source
app.post('/data-sources', async (req, res) => {
  const { name, source_type_id, is_active, connection_properties } = req.body;
  try {
    const pool = await getPool();
    const insertResult = await pool.request()
      .input('name', sql.VarChar, name)
      .input('source_type_id', sql.Int, source_type_id)
      .input('is_active', sql.Bit, is_active ?? true)
      .query(`INSERT INTO data_sources (name, source_type_id, is_active)
              OUTPUT INSERTED.id
              VALUES (@name, @source_type_id, @is_active)`);

    const dataSourceId = insertResult.recordset[0].id;

    // Insert connection properties as key-value pairs
    if (connection_properties && Array.isArray(connection_properties)) {
      for (const prop of connection_properties) {
        await pool.request()
          .input('data_source_id', sql.Int, dataSourceId)
          .input('property_key', sql.VarChar, prop.key)
          .input('property_value', sql.VarChar, prop.value)
          .query(`INSERT INTO connection_properties (data_source_id, property_key, property_value)
                  VALUES (@data_source_id, @property_key, @property_value)`);
      }
    }

    res.status(201).json({ id: dataSourceId });
  } catch (err) {
    res.status(500).json({ error: 'Database insert error' });
  }
});

// Get all data sources with connection properties
app.get('/data-sources', async (req, res) => {
  try {
    const pool = await getPool();

    const sourcesResult = await pool.request().query('SELECT * FROM data_sources');
    const sources = sourcesResult.recordset;

    // Fetch properties for each data source
    for (const source of sources) {
      const propsResult = await pool.request()
        .input('data_source_id', sql.Int, source.id)
        .query('SELECT property_key, property_value FROM connection_properties WHERE data_source_id = @data_source_id');

      source.connection_properties = propsResult.recordset;
    }
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: 'Database read error' });
  }
});

// Get single data source by ID with properties
app.get('/data-sources/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const pool = await getPool();

    const sourceResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM data_sources WHERE id = @id');

    if (sourceResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const source = sourceResult.recordset[0];

    const propsResult = await pool.request()
      .input('data_source_id', sql.Int, id)
      .query('SELECT property_key, property_value FROM connection_properties WHERE data_source_id = @data_source_id');

    source.connection_properties = propsResult.recordset;

    res.json(source);
  } catch (err) {
    res.status(500).json({ error: 'Database read error' });
  }
});

// Update data source and its connection properties
app.put('/data-sources/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, source_type_id, is_active, connection_properties } = req.body;
  try {
    const pool = await getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.VarChar, name)
      .input('source_type_id', sql.Int, source_type_id)
      .input('is_active', sql.Bit, is_active)
      .query(`UPDATE data_sources SET name=@name, source_type_id=@source_type_id, is_active=@is_active, updated_at=SYSDATETIME() WHERE id=@id`);

    // Delete old properties
    await pool.request()
      .input('data_source_id', sql.Int, id)
      .query('DELETE FROM connection_properties WHERE data_source_id=@data_source_id');

    // Insert new properties
    if (connection_properties && Array.isArray(connection_properties)) {
      for (const prop of connection_properties) {
        await pool.request()
          .input('data_source_id', sql.Int, id)
          .input('property_key', sql.VarChar, prop.key)
          .input('property_value', sql.VarChar, prop.value)
          .query(`INSERT INTO connection_properties (data_source_id, property_key, property_value)
                  VALUES (@data_source_id, @property_key, @property_value)`);
      }
    }

    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database update error' });
  }
});

// Delete data source and its connection properties
app.delete('/data-sources/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const pool = await getPool();

    await pool.request()
      .input('data_source_id', sql.Int, id)
      .query('DELETE FROM connection_properties WHERE data_source_id=@data_source_id');

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM data_sources WHERE id=@id');

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database delete error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
