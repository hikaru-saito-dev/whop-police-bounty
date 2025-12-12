import Whop from '@whop/sdk';
import { NextRequest } from 'next/server';

let whopClient: Whop | null = null;

export function getWhopClient(): Whop {
  if (!whopClient) {
    const apiKey = process.env.WHOP_API_KEY;
    const appID = process.env.NEXT_PUBLIC_WHOP_APP_ID;

    if (!apiKey) {
      throw new Error('WHOP_API_KEY environment variable is not set');
    }

    whopClient = new Whop({
      apiKey,
      appID: appID || undefined,
    });
  }

  return whopClient;
}

export interface UserTokenPayload {
  userId: string;
  appId: string;
}

/**
 * Get company ID from experience using experienceId
 * Based on betting-whop project pattern
 */
async function getCompanyIdFromExperience(headers: Headers, requestUrl?: string): Promise<string | undefined> {
  try {
    let experienceId: string | undefined;
    
    // Method 1: Try to get experienceId from headers
    experienceId = headers.get('x-whop-experience-id') || 
                   headers.get('whop-experience-id') ||
                   headers.get('x-experience-id') ||
                   headers.get('experience-id') ||
                   undefined;
    
    // Method 2: Extract from URL query parameters (PRIMARY METHOD)
    if (!experienceId && requestUrl) {
      try {
        const urlObj = new URL(requestUrl);
        // Check 'experience' query parameter
        experienceId = urlObj.searchParams.get('experience') || undefined;
        
        // If no experience, check for direct company_id
        if (!experienceId) {
          const companyId = urlObj.searchParams.get('company_id') || undefined;
          if (companyId) {
            return companyId;
          }
        }
      } catch {
        // Invalid URL, skip
      }
    }
    
    if (!experienceId) {
      return undefined;
    }
    
    // Retrieve experience using SDK to get companyId
    const client = getWhopClient();
    try {
      const experience = await client.experiences.retrieve(experienceId);
      return experience.company?.id;
    } catch (error) {
      console.warn('Error retrieving experience:', error);
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching company ID from experience:', error);
    return undefined;
  }
}

/**
 * Verify user token from NextRequest (for API routes)
 * Returns userId and companyId if valid, null otherwise
 */
export async function verifyUserFromRequest(
  request: NextRequest
): Promise<{ userId: string; companyId?: string } | null> {
  try {
    const client = getWhopClient();
    const headers = request.headers;
    const userToken = headers.get('x-whop-user-token');
    
    if (!userToken || !client.appID) {
      return null;
    }

    const payload = await client.verifyUserToken(userToken, {
      appId: client.appID,
    });

    if (!payload?.userId) {
      return null;
    }

    // Get companyId from headers or experience
    let companyId = headers.get('x-whop-company-id') || undefined;
    
    if (!companyId) {
      const standardHeaders = new Headers();
      headers.forEach((value, key) => standardHeaders.set(key, value));
      companyId = await getCompanyIdFromExperience(standardHeaders, request.url);
    }

    return { userId: payload.userId, companyId };
  } catch (error) {
    console.error('Error verifying user token:', error);
    return null;
  }
}

/**
 * Verify user from Next.js headers (for App Router)
 * Works with Next.js Headers object
 */
export async function verifyUserFromHeaders(
  headers: Headers,
  requestUrl?: string
): Promise<{ userId: string; companyId?: string } | null> {
  try {
    const client = getWhopClient();
    const userToken = headers.get('x-whop-user-token');
    
    if (!userToken || !client.appID) {
      return null;
    }

    // Verify user token directly with the token string
    const payload = await client.verifyUserToken(userToken, {
      appId: client.appID,
    });

    if (!payload?.userId) {
      return null;
    }

    // Get companyId from headers or experience
    let companyId = headers.get('x-whop-company-id') || undefined;
    
    if (!companyId) {
      // Convert Next.js Headers to standard Headers for getCompanyIdFromExperience
      const standardHeaders = new Headers();
      headers.forEach((value, key) => standardHeaders.set(key, value));
      companyId = await getCompanyIdFromExperience(standardHeaders, requestUrl);
    }

    return { userId: payload.userId, companyId };
  } catch (error) {
    console.error('Error verifying user token:', error);
    return null;
  }
}

/**
 * Check if user is the company owner
 */
export async function isCompanyOwner(userId: string, companyId: string): Promise<boolean> {
  try {
    const client = getWhopClient();
    const company = await client.companies.retrieve(companyId);
    return company.owner_user?.id === userId;
  } catch (error) {
    console.error('Error checking company ownership:', error);
    return false;
  }
}

/**
 * Check if user is an authorized user (team member/admin) of the company
 * Returns the role if found, null otherwise
 */
export async function getAuthorizedUserRole(
  userId: string,
  companyId: string
): Promise<string | null> {
  try {
    const client = getWhopClient();
    
    // Check if user is an authorized user (team member) of the company
    const authorizedUsers = await client.authorizedUsers.list({
      company_id: companyId,
    });

    for await (const authorizedUser of authorizedUsers) {
      if (authorizedUser.user?.id === userId) {
        return authorizedUser.role || null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking authorized user role:', error);
    return null;
  }
}

/**
 * Check if user is an authorized user (team member/admin) of the company
 */
export async function isTeamMember(userId: string, companyId: string): Promise<boolean> {
  const role = await getAuthorizedUserRole(userId, companyId);
  return role !== null;
}

export async function banUserFromCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    const client = getWhopClient();
    
    // Get all memberships for this user in the company
    const memberships = await client.memberships.list({
      company_id: companyId,
      user_ids: [userId],
    });

    let canceled = false;
    // Cancel all memberships to effectively ban the user
    for await (const membership of memberships) {
      try {
        // Cancel the membership immediately
        await client.memberships.cancel(membership.id, {
          cancellation_mode: 'immediate',
        });
        canceled = true;
      } catch (error) {
        console.error(`Error canceling membership ${membership.id}:`, error);
      }
    }

    return canceled;
  } catch (error) {
    console.error('Error banning user:', error);
    return false;
  }
}
