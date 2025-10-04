// supabase/functions/generate-embeddings/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

// Função para dividir o texto em pedaços (chunks )
function chunkText(text, size = 500, overlap = 50) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push(text.slice(i, end));
    i += size - overlap;
  }
  return chunks;
}

serve(async (req) => {
  try {
    const { record } = await req.json();

    // Crie o cliente Supabase com permissões de serviço para poder escrever no DB
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Inicialize o cliente OpenAI
    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

    // Pega o conteúdo e divide em chunks
    const content = record.body || '';
    const chunks = chunkText(content);

    // Deleta embeddings antigos para este registro para evitar duplicatas
    await supabaseClient
      .from('ai_embeddings')
      .delete()
      .eq('source_record_id', record.id);

    // Gera embedding para cada chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const embeddingResponse = await openai.createEmbeddings({
        model: 'text-embedding-3-small',
        input: chunk,
      });

      const [embedding] = embeddingResponse.data;

      // Salva o embedding no banco de dados
      await supabaseClient.from('ai_embeddings').insert({
        org_id: record.org_id,
        content: chunk,
        embedding: embedding.embedding,
        source_table: 'content_items',
        source_field: 'body',
        source_record_id: record.id,
        chunk_ix: i,
      });
    }

    return new Response(JSON.stringify({ message: `Generated ${chunks.length} embeddings.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
