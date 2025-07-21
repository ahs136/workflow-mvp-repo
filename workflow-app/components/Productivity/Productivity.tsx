'use client';

import { useState } from 'react';

export default function ProductivityPage() {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null); // can be object or string
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'API error');
      }

      const data = await res.json();

      setResult(data.result); // expected parsed JSON object or error string
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">AI Event Parser</h2>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={4}
        placeholder="Describe your event..."
        className="w-full border p-2 rounded"
      />

      <button
        onClick={handleParse}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Parsing...' : 'Parse with AI'}
      </button>

      {error && <p className="text-red-600">Error: {error}</p>}

      {result && (
        <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
          <h2>Parsed Event JSON:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
