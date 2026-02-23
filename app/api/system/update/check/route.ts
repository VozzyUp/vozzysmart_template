import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // We check for updates relative to the UPSTREAM repository
    // This is where the core template is maintained
    const owner = process.env.GITHUB_UPSTREAM_OWNER || 'VozzyUp';
    const repo = process.env.GITHUB_UPSTREAM_REPO || 'vozzysmart_template';
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      console.error('[UPDATE-CHECK] Missing GITHUB_TOKEN');
      return NextResponse.json({ 
        error: 'Variável GITHUB_TOKEN ausente no Vercel.',
        configured: false 
      }, { status: 500 });
    }

    // Fetch latest tags/releases from GitHub Upstream
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VozzySmart-Update-Checker'
      },
      next: { revalidate: 60 } // Reduced cache to 60 seconds for easier testing
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
        message: 'Nenhuma versão encontrada no repositório upstream.'
      });
    }

    // Extract versions and sort them semantically
    const versions = tags
      .map((t: any) => ({
        tagName: t.name,
        version: t.name.replace(/^v/i, '')
      }))
      .sort((a: any, b: any) => {
        // Simple semantic sort (could be improved, but works for standard X.Y.Z)
        const partsA = a.version.split('.').map(Number);
        const partsB = b.version.split('.').map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const valA = partsA[i] || 0;
          const valB = partsB[i] || 0;
          if (valA !== valB) return valB - valA; // Descending
        }
        return 0;
      });

    const latest = versions[0];
    
    // Compare versions
    const isNewer = latest.version !== CURRENT_VERSION;

    return NextResponse.json({
      available: isNewer,
      currentVersion: CURRENT_VERSION,
      latestVersion: latest.version,
      tagName: latest.tagName,
      configured: true,
      upstream: `${owner}/${repo}`,
      debug: {
        allTags: tags.map((t: any) => t.name),
        detectedLatest: latest.version,
        match: latest.version === CURRENT_VERSION
      }
    });

  } catch (error) {
    console.error('[UPDATE-CHECK] Unhandled error:', error);
    return NextResponse.json({ error: 'Erro interno ao verificar atualizações' }, { status: 500 });
  }
}
