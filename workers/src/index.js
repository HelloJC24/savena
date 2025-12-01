/**
 * Savena Sync API - Cloudflare Worker
 * Handles wallet sync operations using R2 storage
 */

export default {
  async fetch(request, env, ctx) {
    // CORS handling
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route requests
      if (path.startsWith('/api/wallet/')) {
        return await handleWalletRequest(request, env, corsHeaders);
      }

      if (path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: Date.now() }, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, corsHeaders, 404);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message }, corsHeaders, 500);
    }
  },
};

/**
 * Handle wallet-related requests
 */
async function handleWalletRequest(request, env, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const walletId = pathParts[3]; // /api/wallet/{walletId}

  if (!walletId) {
    return jsonResponse({ error: 'Wallet ID required' }, corsHeaders, 400);
  }

  // Verify password from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401);
  }

  const password = authHeader.substring(7);
  const walletKey = `wallets/${walletId}/data.json`;
  const passwordKey = `wallets/${walletId}/password`;

  switch (request.method) {
    case 'POST': // Create new wallet
      return await createWallet(env, walletId, password, request, corsHeaders);

    case 'GET': // Get wallet data
      return await getWallet(env, walletId, password, corsHeaders);

    case 'PUT': // Update wallet data
      return await updateWallet(env, walletId, password, request, corsHeaders);

    case 'DELETE': // Delete wallet
      return await deleteWallet(env, walletId, password, corsHeaders);

    default:
      return jsonResponse({ error: 'Method not allowed' }, corsHeaders, 405);
  }
}

/**
 * Create a new wallet
 */
async function createWallet(env, walletId, password, request, corsHeaders) {
  const walletKey = `wallets/${walletId}/data.json`;
  const passwordKey = `wallets/${walletId}/password`;

  // Check if wallet already exists
  const existing = await env.SAVENA_STORAGE.get(passwordKey);
  if (existing) {
    return jsonResponse({ error: 'Wallet already exists' }, corsHeaders, 409);
  }

  // Store password hash
  const passwordHash = await hashPassword(password);
  await env.SAVENA_STORAGE.put(passwordKey, passwordHash);

  // Store initial wallet data
  const data = await request.json();
  await env.SAVENA_STORAGE.put(walletKey, JSON.stringify({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return jsonResponse({ 
    success: true, 
    walletId,
    message: 'Wallet created successfully' 
  }, corsHeaders, 201);
}

/**
 * Get wallet data
 */
async function getWallet(env, walletId, password, corsHeaders) {
  const walletKey = `wallets/${walletId}/data.json`;
  const passwordKey = `wallets/${walletId}/password`;

  // Verify password
  const storedHashObj = await env.SAVENA_STORAGE.get(passwordKey);
  if (!storedHashObj) {
    return jsonResponse({ error: 'Wallet not found' }, corsHeaders, 404);
  }
  const storedHash = await storedHashObj.text();

  const isValid = await verifyPassword(password, storedHash);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid password' }, corsHeaders, 401);
  }

  // Get wallet data
  const dataObj = await env.SAVENA_STORAGE.get(walletKey);
  if (!dataObj) {
    return jsonResponse({ error: 'Wallet data not found' }, corsHeaders, 404);
  }
  const data = await dataObj.json();

  return jsonResponse(data, corsHeaders);
}

/**
 * Update wallet data
 */
async function updateWallet(env, walletId, password, request, corsHeaders) {
  const walletKey = `wallets/${walletId}/data.json`;
  const passwordKey = `wallets/${walletId}/password`;

  // Verify password
  const storedHashObj = await env.SAVENA_STORAGE.get(passwordKey);
  if (!storedHashObj) {
    return jsonResponse({ error: 'Wallet not found' }, corsHeaders, 404);
  }
  const storedHash = await storedHashObj.text();

  const isValid = await verifyPassword(password, storedHash);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid password' }, corsHeaders, 401);
  }

  // Update wallet data
  const data = await request.json();
  await env.SAVENA_STORAGE.put(walletKey, JSON.stringify({
    ...data,
    updatedAt: new Date().toISOString(),
  }));

  return jsonResponse({ 
    success: true, 
    message: 'Wallet updated successfully',
    updatedAt: new Date().toISOString()
  }, corsHeaders);
}

/**
 * Delete wallet
 */
async function deleteWallet(env, walletId, password, corsHeaders) {
  const walletKey = `wallets/${walletId}/data.json`;
  const passwordKey = `wallets/${walletId}/password`;

  // Verify password
  const storedHashObj = await env.SAVENA_STORAGE.get(passwordKey);
  if (!storedHashObj) {
    return jsonResponse({ error: 'Wallet not found' }, corsHeaders, 404);
  }
  const storedHash = await storedHashObj.text();

  const isValid = await verifyPassword(password, storedHash);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid password' }, corsHeaders, 401);
  }

  // Delete wallet data and password
  await env.SAVENA_STORAGE.delete(walletKey);
  await env.SAVENA_STORAGE.delete(passwordKey);

  return jsonResponse({ 
    success: true, 
    message: 'Wallet deleted successfully' 
  }, corsHeaders);
}

/**
 * Hash password using SHA-256
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against stored hash
 */
async function verifyPassword(password, storedHash) {
  const hash = await hashPassword(password);
  return hash === storedHash;
}

/**
 * Helper to return JSON response
 */
function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
