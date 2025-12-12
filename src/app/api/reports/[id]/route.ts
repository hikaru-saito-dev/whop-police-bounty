import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest, isTeamMember, banUserFromCompany, getWhopClient } from '@/lib/whop';
import {
  getReportById,
  updateReportStatus,
} from '@/lib/models/Report';

// PATCH - Update report status (approve/deny)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authInfo = await verifyUserFromRequest(request);
    if (!authInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, companyId: authCompanyId } = authInfo;
    const body = await request.json();
    const { action, companyId: bodyCompanyId } = body; // action: 'approve' | 'deny'

    // Use companyId from body, auth, or query params
    const companyId = bodyCompanyId || authCompanyId || request.nextUrl.searchParams.get('company_id');

    if (!action || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, companyId' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'deny') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    // Check if user is team member
    const isAdmin = await isTeamMember(userId, companyId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Team members only' }, { status: 403 });
    }

    // Get report from MongoDB
    const report = await getReportById(id, companyId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update report status
    if (action === 'approve') {
      // Ban the user using Whop SDK
      const client = getWhopClient();
      
      // First, try to find the user by username
      try {
        const reportedUser = await client.users.retrieve(report.reportedUsername.replace('@', ''));
        const banned = await banUserFromCompany(reportedUser.id, companyId);
        
        if (!banned) {
          console.warn(`Could not ban user ${reportedUser.id} - they may not be a member`);
        }
      } catch (error) {
        console.error('Error banning user:', error);
        // Continue with approval even if ban fails
      }

      const updatedReport = await updateReportStatus(
        id,
        companyId,
        'approved',
        userId
      );

      return NextResponse.json({ report: updatedReport });
    } else {
      const updatedReport = await updateReportStatus(
        id,
        companyId,
        'denied',
        userId
      );

      return NextResponse.json({ report: updatedReport });
    }
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

