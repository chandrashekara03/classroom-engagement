import { supabase } from '@/lib/supabaseClient';

export default async function TestPage() {
  // Query the users table
  const { data, error } = await supabase.from('users').select('*');

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Supabase Users Table Test</h1>
      {error && <pre className="text-red-500">{JSON.stringify(error, null, 2)}</pre>}
      <pre className="bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
