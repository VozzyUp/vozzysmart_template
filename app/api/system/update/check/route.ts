import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      console.error('[UPDATE-CHECK] Missing GitHub configuration');
      return NextResponse.json({ 
        error: 'Configuração do GitHub (Token/Owner/Repo) ausente nas variáveis de ambiente.',
        configured: false 
      }, { status: 500 });
    }

    // Fetch latest tags/releases from GitHub
    // We'll use the tags API to find the absolute latest version
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VozzySmart-Update-Checker'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[UPDATE-CHECK] GitHub API error:', errorData);
      return NextResponse.json({ 
        error: `Erro ao consultar GitHub: ${errorData.message || response.statusText }`,
        status: response.status
      }, { status: response.status });
    }

    const tags = await response.json();
    
    if (!tags || tags.length === 0) {
      return NextResponse.json({
        available: false,
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        message: 'Nenhuma versão encontrada no repositório.'
      });
    }

    // Assume the first tag is the latest
    const latestTag = tags[0].name.replace(/^v/, ''); // Remove 'v' prefix if present
    
    // Simple version comparison
    const isNewer = latestTag !== CURRENT_VERSION;

    return NextResponse.json({
      available: isNewer,
      currentVersion: CURRENT_VERSION,
      latestVersion: latestTag,
      tagName: tags[0].name,
      configured: true
    });

  } catch (error) {
    console.error('[UPDATE-CHECK] Unhandled error:', error);
    return NextResponse.json({ error: 'Erro interno ao verificar atualizações' }, { status: 500 });
  }
}
