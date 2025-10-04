// supabase/functions/clerk-webhook/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { Webhook } from 'https://esm.sh/svix@1.15.0'

// Tipos para os dados do evento do Clerk
type User = {
  id: string
  email_addresses: {
    id: string
    email_address: string
  }[]
  primary_email_address_id: string
  first_name: string
  last_name: string
  image_url: string
  created_at: number
  updated_at: number
}

type Event = {
  data: User
  object: 'event'
  type: 'user.created' | 'user.updated' | 'user.deleted'
}

// Função principal da Edge Function
Deno.serve(async (req) => {
  try {
    // 1. Obter o segredo do webhook do Vault da Supabase
    const WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET_KEY')
    if (!WEBHOOK_SECRET) {
      throw new Error('CLERK_WEBHOOK_SECRET_KEY is not set in environment variables')
    }

    // 2. Validar a assinatura do webhook para garantir que ele veio do Clerk
    const headers = Object.fromEntries(req.headers)
    const payload = await req.json()
    const svix_id = headers['svix-id']
    const svix_timestamp = headers['svix-timestamp']
    const svix_signature = headers['svix-signature']

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error: Missing svix headers', { status: 400 })
    }

    const wh = new Webhook(WEBHOOK_SECRET)
    let evt: Event | null = null

    try {
      evt = wh.verify(JSON.stringify(payload), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as Event
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return new Response('Error: Webhook signature verification failed', { status: 400 })
    }

    // 3. Criar um cliente Supabase com permissão de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const eventType = evt.type
    const { id, email_addresses, primary_email_address_id, ...attributes } = evt.data
    const primaryEmail = email_addresses.find(email => email.id === primary_email_address_id)?.email_address

    // 4. Executar a ação com base no tipo de evento (usuário criado, atualizado ou deletado)
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        { email: primaryEmail, user_metadata: attributes }
      )
      if (error) {
        // Se o usuário não existir, crie-o
        if (error.message.includes('User not found')) {
          const { data: newUser, error: newUserError } = await supabaseAdmin.auth.admin.createUser({
            id: id,
            email: primaryEmail,
            user_metadata: attributes,
            email_confirm: true // O Clerk já verificou o e-mail
          })
          if (newUserError) {
            throw newUserError
          }
          console.log(`User ${newUser.user.id} created successfully.`)
        } else {
          throw error
        }
      } else {
        console.log(`User ${data.user.id} updated successfully.`)
      }
    } else if (eventType === 'user.deleted') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (error) {
        throw error
      }
      console.log(`User ${id} deleted successfully.`)
    }

    return new Response('Webhook processed successfully', { status: 200 })

  } catch (error) {
    console.error('Error processing webhook:', error.message)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
})