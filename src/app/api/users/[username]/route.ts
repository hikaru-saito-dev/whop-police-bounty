import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest, getWhopClient } from '@/lib/whop';

// GET - Fetch user information by username
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const authInfo = await verifyUserFromRequest(request);
        if (!authInfo?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username } = await params;
        const cleanUsername = username.replace('@', '');
        const { companyId } = authInfo;

        const client = getWhopClient();

        try {
            let userData: {
                id: string;
                username: string;
                name: string | null;
                bio: string | null;
                profilePicture: string | null;
                createdAt: string;
                email: string | null;
            } | null = null;
            let memberInfo: {
                joinedAt?: string;
                totalSpent?: number;
                status?: string;
                accessLevel?: string;
            } | null = null;

            // Strategy 1: If we have companyId, try to get member info first (more efficient, includes email)
            // This gives us both user info and member-specific data in one call
            if (companyId) {
                try {
                    const members = client.members.list({
                        company_id: companyId,
                        query: cleanUsername, // Search by username (also supports name and email)
                        first: 5, // Only need the first match
                    });

                    for await (const member of members) {
                        // Found as member - use member.user for user data and member for additional info
                        userData = {
                            id: member.user?.id || '',
                            username: member.user?.username || '',
                            name: member.user?.name || '',
                            bio: null, // Not in member.user, will fetch separately if needed
                            profilePicture: null, // Not in member.user, will fetch separately if needed
                            createdAt: '', // Not in member.user, will fetch separately if needed
                            email: member.user?.email || '',
                        };

                        memberInfo = {
                            joinedAt: member.joined_at,
                            totalSpent: member.usd_total_spent,
                            status: member.status,
                            accessLevel: member.access_level,
                        };

                        // Fetch full user details for bio, profile picture, created_at
                        try {
                            const fullUser = await client.users.retrieve(member.user?.id || '');
                            if (userData) {
                                userData.bio = fullUser.bio || '';
                                userData.profilePicture = fullUser.profile_picture?.url || null;
                                userData.createdAt = fullUser.created_at || '';
                            }
                        } catch {
                            // If we can't get full user details, continue with what we have
                        }

                        break;

                    }
                } catch (memberError) {
                    // If member lookup fails, fall through to user.retrieve()
                    console.warn('Could not fetch member details, falling back to user.retrieve():', memberError);
                }
            }

            // Strategy 2: If not found as member (or no companyId), use users.retrieve()
            if (!userData) {
                const user = await client.users.retrieve(cleanUsername);
                userData = {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    bio: user.bio,
                    profilePicture: user.profile_picture?.url || null,
                    createdAt: user.created_at,
                    email: null, // Not available from users.retrieve()
                };

                // Try to get email from members if we have companyId
                if (companyId) {
                    try {
                        const members = client.members.list({
                            company_id: companyId,
                            user_ids: [user.id],
                            first: 5,
                        });

                        for await (const member of members) {
                            if (member.user?.id === user.id) {
                                userData.email = member.user.email || null;
                                memberInfo = {
                                    joinedAt: member.joined_at,
                                    totalSpent: member.usd_total_spent,
                                    status: member.status,
                                    accessLevel: member.access_level,
                                };
                                break;
                            }
                        }
                    } catch {
                        // Email not available
                    }
                }
            }

            return NextResponse.json({
                id: userData.id,
                username: userData.username,
                name: userData.name,
                bio: userData.bio,
                profilePicture: userData.profilePicture,
                createdAt: userData.createdAt,
                email: userData.email,
                bannerImage: null, // Not available in current API
                location: null, // Not available in current API
                discordId: null, // Not available in current API
                discord: null, // Not available in current API
                // Additional member info if available
                ...(memberInfo && {
                    joinedAt: memberInfo.joinedAt,
                    totalSpent: memberInfo.totalSpent,
                    memberStatus: memberInfo.status,
                    accessLevel: memberInfo.accessLevel,
                }),
            });
        } catch (error: any) {
            if (error.status === 404) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

