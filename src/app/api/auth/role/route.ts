import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromHeaders, isCompanyOwner, getAuthorizedUserRole } from '@/lib/whop';

export const runtime = 'nodejs';

/**
 * GET /api/auth/role
 * Get user role and authorization status using ONLY @whop/sdk (no database)
 * Role is determined by checking if user is an authorized user (team member) of the company
 */
export async function GET(request: NextRequest) {
  try {
    const headers = await import('next/headers').then(m => m.headers());
    
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

    // Check user role using ONLY @whop/sdk
    // Priority: company owner > authorized user with owner role > authorized user (admin/moderator/etc) > member
    const isCompanyOwnerUser = await isCompanyOwner(userId, companyId);
    const authorizedUserRole = await getAuthorizedUserRole(userId, companyId);
    
    let role: 'owner' | 'admin' | 'member' | 'none';
    if (isCompanyOwnerUser) {
      // User is the actual company owner
      role = 'owner';
    } else if (authorizedUserRole === 'owner') {
      // User has owner role in authorized users (co-owner)
      role = 'owner';
    } else if (authorizedUserRole) {
      // User is an authorized user (admin, moderator, etc.)
      role = 'admin';
    } else {
      // Regular member
      role = 'member';
    }
    
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

