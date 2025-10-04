import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface TaskRunRequest {
  task_type: 'analyze_articles' | 'generate_summaries' | 'extract_insights' | 'categorize_content' | 'sentiment_analysis';
  parameters: {
    table_name?: string;
    record_ids?: string[];
    filters?: Record<string, any>;
    options?: Record<string, any>;
  };
  priority?: 'low' | 'normal' | 'high';
}

interface TaskRunResponse {
  success: boolean;
  task_id?: string;
  results?: any;
  error?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GPT_MODEL = 'gpt-4o-mini'; // Cost-effective model

/**
 * Create task record in database
 */
async function createTask(
  taskType: string,
  parameters: any,
  priority: string = 'normal'
): Promise<string> {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      task_type: taskType,
      parameters: parameters,
      priority: priority,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data.id;
}

/**
 * Update task status
 */
async function updateTaskStatus(
  taskId: string,
  status: string,
  results?: any,
  error?: string
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (results) {
    updateData.results = results;
  }

  if (error) {
    updateData.error_message = error;
  }

  const { error: updateError } = await supabase
    .from('ai_tasks')
    .update(updateData)
    .eq('id', taskId);

  if (updateError) {
    throw new Error(`Failed to update task: ${updateError.message}`);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(messages: any[], temperature: number = 0.7): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: messages,
      temperature: temperature,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Analyze articles for insights
 */
async function analyzeArticles(parameters: any): Promise<any> {
  const { table_name = 'articles', filters = {}, options = {} } = parameters;
  
  // Build query
  let query = supabase.from(table_name).select('*');
  
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.date_from) {
    query = query.gte('published_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('published_at', filters.date_to);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data: articles, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  if (!articles || articles.length === 0) {
    return { message: 'No articles found for analysis' };
  }

  // Prepare content for analysis
  const articlesText = articles.map(article => 
    `Title: ${article.title}\nContent: ${article.body || article.lead || ''}\n---`
  ).join('\n');

  const prompt = `Analyze the following articles and provide insights:

${articlesText}

Please provide:
1. Main themes and topics
2. Sentiment analysis (positive, negative, neutral)
3. Key insights and trends
4. Recommendations for content strategy
5. Most engaging topics

Format your response as JSON with the following structure:
{
  "themes": ["theme1", "theme2"],
  "sentiment": {"positive": 0.6, "negative": 0.2, "neutral": 0.2},
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "top_topics": ["topic1", "topic2"]
}`;

  const analysis = await callOpenAI([
    { role: 'system', content: 'You are an expert content analyst. Provide detailed, actionable insights from article content.' },
    { role: 'user', content: prompt }
  ]);

  return {
    articles_analyzed: articles.length,
    analysis: JSON.parse(analysis),
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate summaries for content
 */
async function generateSummaries(parameters: any): Promise<any> {
  const { table_name, record_ids, options = {} } = parameters;
  
  if (!record_ids || record_ids.length === 0) {
    throw new Error('record_ids is required for summary generation');
  }

  const { data: records, error } = await supabase
    .from(table_name)
    .select('*')
    .in('id', record_ids);

  if (error) {
    throw new Error(`Failed to fetch records: ${error.message}`);
  }

  const summaries = [];

  for (const record of records) {
    const content = record.body || record.description || record.content || '';
    
    if (!content) {
      summaries.push({
        id: record.id,
        summary: 'No content available for summarization',
        error: 'Empty content'
      });
      continue;
    }

    const prompt = `Summarize the following content in 2-3 sentences, focusing on the key points:

${content}`;

    try {
      const summary = await callOpenAI([
        { role: 'system', content: 'You are an expert summarizer. Create concise, informative summaries.' },
        { role: 'user', content: prompt }
      ]);

      summaries.push({
        id: record.id,
        title: record.title || record.name || 'Untitled',
        summary: summary,
        word_count: content.length
      });
    } catch (error) {
      summaries.push({
        id: record.id,
        summary: 'Failed to generate summary',
        error: error.message
      });
    }
  }

  return {
    summaries,
    total_processed: records.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract insights from content
 */
async function extractInsights(parameters: any): Promise<any> {
  const { table_name, filters = {}, options = {} } = parameters;
  
  let query = supabase.from(table_name).select('*');
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.featured) {
    query = query.eq('featured', filters.featured);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data: records, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch records: ${error.message}`);
  }

  if (!records || records.length === 0) {
    return { message: 'No records found for insight extraction' };
  }

  const content = records.map(record => 
    `Title: ${record.title || record.name}\nContent: ${record.description || record.body || ''}\n---`
  ).join('\n');

  const prompt = `Extract key insights from the following content:

${content}

Please provide:
1. Key trends and patterns
2. Important statistics or metrics
3. Notable quotes or statements
4. Actionable recommendations
5. Areas for further investigation

Format as JSON with this structure:
{
  "trends": ["trend1", "trend2"],
  "statistics": ["stat1", "stat2"],
  "quotes": ["quote1", "quote2"],
  "recommendations": ["rec1", "rec2"],
  "investigation_areas": ["area1", "area2"]
}`;

  const insights = await callOpenAI([
    { role: 'system', content: 'You are an expert data analyst. Extract meaningful insights from content.' },
    { role: 'user', content: prompt }
  ]);

  return {
    records_analyzed: records.length,
    insights: JSON.parse(insights),
    timestamp: new Date().toISOString()
  };
}

/**
 * Categorize content
 */
async function categorizeContent(parameters: any): Promise<any> {
  const { table_name, record_ids, options = {} } = parameters;
  
  if (!record_ids || record_ids.length === 0) {
    throw new Error('record_ids is required for categorization');
  }

  const { data: records, error } = await supabase
    .from(table_name)
    .select('*')
    .in('id', record_ids);

  if (error) {
    throw new Error(`Failed to fetch records: ${error.message}`);
  }

  const categories = [];

  for (const record of records) {
    const content = record.title + ' ' + (record.description || record.body || '');
    
    const prompt = `Categorize the following content into one of these categories: 
    - Education
    - Health
    - Environment
    - Technology
    - Social Issues
    - Economy
    - Culture
    - Sports
    - Politics
    - Other

Content: ${content}

Respond with only the category name.`;

    try {
      const category = await callOpenAI([
        { role: 'system', content: 'You are a content categorization expert. Choose the most appropriate category.' },
        { role: 'user', content: prompt }
      ]);

      categories.push({
        id: record.id,
        title: record.title || record.name,
        suggested_category: category.trim(),
        confidence: 'high' // You could implement confidence scoring
      });
    } catch (error) {
      categories.push({
        id: record.id,
        title: record.title || record.name,
        suggested_category: 'Other',
        error: error.message
      });
    }
  }

  return {
    categories,
    total_processed: records.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Perform sentiment analysis
 */
async function performSentimentAnalysis(parameters: any): Promise<any> {
  const { table_name, record_ids, options = {} } = parameters;
  
  if (!record_ids || record_ids.length === 0) {
    throw new Error('record_ids is required for sentiment analysis');
  }

  const { data: records, error } = await supabase
    .from(table_name)
    .select('*')
    .in('id', record_ids);

  if (error) {
    throw new Error(`Failed to fetch records: ${error.message}`);
  }

  const sentiments = [];

  for (const record of records) {
    const content = record.title + ' ' + (record.description || record.body || '');
    
    const prompt = `Analyze the sentiment of the following content and respond with a JSON object containing:
    - sentiment: "positive", "negative", or "neutral"
    - confidence: a number between 0 and 1
    - reasoning: brief explanation

Content: ${content}

Respond with only the JSON object.`;

    try {
      const sentimentResult = await callOpenAI([
        { role: 'system', content: 'You are a sentiment analysis expert. Analyze text sentiment accurately.' },
        { role: 'user', content: prompt }
      ]);

      const sentiment = JSON.parse(sentimentResult);
      
      sentiments.push({
        id: record.id,
        title: record.title || record.name,
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence,
        reasoning: sentiment.reasoning
      });
    } catch (error) {
      sentiments.push({
        id: record.id,
        title: record.title || record.name,
        sentiment: 'neutral',
        confidence: 0,
        error: error.message
      });
    }
  }

  return {
    sentiments,
    total_processed: records.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Main function handler
 */
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { task_type, parameters, priority = 'normal' }: TaskRunRequest = await req.json();

    // Validate required fields
    if (!task_type || !parameters) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: task_type, parameters' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate task type
    const validTaskTypes = ['analyze_articles', 'generate_summaries', 'extract_insights', 'categorize_content', 'sentiment_analysis'];
    if (!validTaskTypes.includes(task_type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid task_type. Must be one of: ${validTaskTypes.join(', ')}` 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create task record
    const taskId = await createTask(task_type, parameters, priority);
    
    // Update status to processing
    await updateTaskStatus(taskId, 'processing');

    let results: any;

    try {
      // Execute the appropriate task
      switch (task_type) {
        case 'analyze_articles':
          results = await analyzeArticles(parameters);
          break;
        case 'generate_summaries':
          results = await generateSummaries(parameters);
          break;
        case 'extract_insights':
          results = await extractInsights(parameters);
          break;
        case 'categorize_content':
          results = await categorizeContent(parameters);
          break;
        case 'sentiment_analysis':
          results = await performSentimentAnalysis(parameters);
          break;
        default:
          throw new Error(`Unknown task type: ${task_type}`);
      }

      // Update task as completed
      await updateTaskStatus(taskId, 'completed', results);

      const response: TaskRunResponse = {
        success: true,
        task_id: taskId,
        results: results,
        status: 'completed'
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );

    } catch (taskError) {
      // Update task as failed
      await updateTaskStatus(taskId, 'failed', null, taskError.message);

      const response: TaskRunResponse = {
        success: false,
        task_id: taskId,
        error: taskError.message,
        status: 'failed'
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

  } catch (error) {
    console.error('Error processing task:', error);

    const response: TaskRunResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase functions serve`
  2. Make an HTTP request:

  curl -i --location --request POST 'http://localhost:54321/functions/v1/process-task-run' \
    --header 'Authorization: Bearer YOUR_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"task_type":"analyze_articles","parameters":{"table_name":"articles","filters":{"limit":10}}}'

*/
