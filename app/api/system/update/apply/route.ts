import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const upstream = process.env.GITHUB_UPSTREAM || 'main'; // The branch in the upstream repo to sync from

    if (!owner || !repo || !token) {
      return NextResponse.json({ 
        error: 'Configuração do GitHub ausente.' 
      }, { status: 500 });
    }

    // Call GitHub Merge Upstream API
    // This API syncs the fork's default branch with the upstream's default branch
    // POST /repos/{owner}/{repo}/merge-upstream
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/merge-upstream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VozzySmart-Update-Apply'
      },
      body: JSON.stringify({
        branch: upstream // The fork branch to update
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[UPDATE-APPLY] GitHub API error:', data);
      return NextResponse.json({ 
        error: data.message || 'Erro ao sincronizar com upstream',
        details: data
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronização iniciada com sucesso. O Vercel deve iniciar um novo deploy em instantes.',
      data
    });

  } catch (error) {
    console.error('[UPDATE-APPLY] Unhandled error:', error);
    return NextResponse.json({ error: 'Erro interno ao aplicar atualização' }, { status: 500 });
  }
}
