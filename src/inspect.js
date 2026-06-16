import PocketBase from 'pocketbase';

async function run() {
  const pb = new PocketBase('http://150.136.18.45');
  await pb.collection('users').authWithPassword('admin@admin.com', 'admin123');
  const records = await pb.collection('cidades_hsp').getFullList({
    limit: 5
  });
  console.log(JSON.stringify(records, null, 2));
}

run().catch(console.error);
