import React, { useState, useEffect } from 'react';
import type { SourceType } from './api/dataSources'; // or import type path
import { fetchSourceTypes } from './api/dataSources';

export default function App() {
  const [types, setTypes] = useState<SourceType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSourceTypes()
      .then((data: SourceType[]) => {
        setTypes(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading source types...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {types.map((type) => (
        <li key={type.id}>{type.name} - {type.description}</li>
      ))}
    </ul>
  );
}
