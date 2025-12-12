import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromHeaders, isTeamMember } from '@/lib/whop';

export const runtime = 'nodejs';

/**
 * GET /api/auth/role
 * Get user role and authorization status using ONLY @whop/sdk (no database)
 * Role is determined by checking if user is an authorized user (team member) of the company
 */
export async function GET(request: NextRequest) {
  try {
    const headers = await import('next/headers').then(m => m.headers());
    const searchParams = request.nextUrl.searchParams;
    const experienceId = searchParams.get('experience');
    
    // Verify user and get companyId (pass request.url so experienceId can be extracted)
    const authInfo = await verifyUserFromHeaders(headers, request.url);
    
    if (!authInfo) {
      return NextResponse.json({ role: 'none', isAuthorized: false }, { status: 401 });
    }

    const { userId, companyId } = authInfo;

    if (!companyId) {
      return NextResponse.json({ 
        role: 'none', 
        isAuthorized: false,
        userId,
        companyId: null,
      });
    }

    // Check if user is team member (admin) using ONLY @whop/sdk
    // Team members are authorized users of the company
    const isAdmin = await isTeamMember(userId, companyId);
    const role: 'admin' | 'member' | 'none' = isAdmin ? 'admin' : 'member';
    
    // All authenticated users with companyId are authorized (can use the app)
    const isAuthorized = true;

    return NextResponse.json({ 
      role, 
      userId,
      companyId,
      isAuthorized,
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ role: 'none', isAuthorized: false }, { status: 500 });
  }
}

