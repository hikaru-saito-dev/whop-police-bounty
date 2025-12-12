import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest, isCompanyOwner, isTeamMember, getWhopClient } from '@/lib/whop';
import {
  createReport,
  getReportsByCompany,
} from '@/lib/models/Report';

// GET - Fetch reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const authInfo = await verifyUserFromRequest(request);
    if (!authInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, companyId: authCompanyId } = authInfo;
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id') || authCompanyId;

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    // Check if user is owner or team member (admin)
    const isOwner = await isCompanyOwner(userId, companyId);
    const isAdmin = await isTeamMember(userId, companyId);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Owners and team members only' }, { status: 403 });
    }

    // Get reports from MongoDB
    const reports = await getReportsByCompany(companyId);
    
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Submit a new report
export async function POST(request: NextRequest) {
  try {
    const authInfo = await verifyUserFromRequest(request);
    if (!authInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, companyId: authCompanyId } = authInfo;
    const body = await request.json();
    const { reportedUsername, description, proofImageUrl, companyId: bodyCompanyId } = body;

    // Use companyId from body, auth, or query params
    const companyId = bodyCompanyId || authCompanyId || request.nextUrl.searchParams.get('company_id');

    if (!reportedUsername || !description || !proofImageUrl || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: reportedUsername, description, proofImageUrl, companyId' },
        { status: 400 }
      );
    }

    // Get reporter's username
    const client = getWhopClient();
    let reporterUsername = 'Unknown';
    try {
      const user = await client.users.retrieve(userId);
      reporterUsername = user.username;
    } catch (error) {
      console.error('Error fetching user:', error);
    }

    // Create report in MongoDB
    const report = await createReport({
      reportedUsername,
      description,
      proofImageUrl,
      reporterUserId: userId,
      reporterUsername,
      companyId,
      status: 'pending',
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

