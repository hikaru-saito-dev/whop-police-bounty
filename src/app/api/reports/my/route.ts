import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/whop';
import { getReportsByReporter } from '@/lib/models/Report';

// GET - Fetch reports submitted by the current user
export async function GET(request: NextRequest) {
  try {
    const authInfo = await verifyUserFromRequest(request);
    if (!authInfo || !authInfo.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, companyId: authCompanyId } = authInfo;
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id') || authCompanyId;

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    // Get reports submitted by this user
    const reports = await getReportsByReporter(userId, companyId);
    
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Error fetching user reports:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

