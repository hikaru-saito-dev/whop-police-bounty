'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close, ContentCopy, CheckCircle } from '@mui/icons-material';
import { useAccess } from './AccessProvider';

interface Membership {
  id: string;
  productTitle: string;
  planId: string;
  status: string;
  createdAt: string;
  currency: string | null;
}

interface UserInfo {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  profilePicture: string | null;
  bannerImage: string | null;
  createdAt: string;
  location: string | null;
  discordId: string | null;
  discord: string | null;
  joinedAt?: string;
  totalSpent?: number;
  memberships?: Membership[];
}

interface UserInfoModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
}

export default function UserInfoModal({ open, onClose, username }: UserInfoModalProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { companyId } = useAccess();
  useEffect(() => {
    if (open && username) {
      fetchUserInfo();
    } else {
      setUserInfo(null);
      setError(null);
    }
  }, [open, username]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanUsername = username.replace('@', '');
      const response = await fetch(`/api/users/${cleanUsername}?company_id=${companyId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to fetch user information');
        }
        return;
      }

      const data = await response.json();
      setUserInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user information');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    if (diffMonths === 0) return 'this month';
    if (diffMonths === 1) return '1 month ago';
    return `${month} ${year}`;
  };

  const AdminDetailRow = ({ label, value }: { label: string; value: string | null }) => {
    if (!value) return null;
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {value}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleCopy(value, label)}
            sx={{ p: 0.5 }}
          >
            {copiedField === label ? (
              <CheckCircle fontSize="small" color="success" />
            ) : (
              <ContentCopy fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          borderRadius: 2,
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : userInfo ? (
          <>
              {/* Banner */}
            <Box
              sx={{
                width: '100%',
                height: 200,
                bgcolor: 'background.paper',
                backgroundImage: userInfo.bannerImage
                  ? `url(${userInfo.bannerImage})`
                  : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            />

            {/* Close Button */}
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              }}
            >
              <Close />
            </IconButton>

            {/* Profile Section */}
            <Box sx={{ px: 3, pb: 3, position: 'relative', mt: -8 }}>
              {/* Profile Picture */}
              <Avatar
                src={userInfo.profilePicture || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  border: 4,
                  borderColor: 'background.default',
                  mb: 2,
                }}
              >
                {userInfo.username.charAt(0).toUpperCase()}
              </Avatar>

              {/* User Name and Handle */}
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {userInfo.name || userInfo.username}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {userInfo.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Created: {formatDate(userInfo.createdAt)}
              </Typography>
              {
                userInfo.joinedAt && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Joined: {formatDate(userInfo.joinedAt)}
                  </Typography>
                )
              }

              <Divider sx={{ my: 3 }} />

              {/* Membership Information */}
              {userInfo.memberships && userInfo.memberships.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Memberships ({userInfo.memberships.length})
                  </Typography>
                  <Paper elevation={0} sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 3 }}>
                    {userInfo.memberships.map((membership, index) => (
                      <Box key={membership.id} sx={{ mb: index < userInfo.memberships!.length - 1 ? 2 : 0, pb: index < userInfo.memberships!.length - 1 ? 2 : 0, borderBottom: index < userInfo.memberships!.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {membership.productTitle}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1, 
                              bgcolor: membership.status === 'active' ? 'success.main' : 
                                       membership.status === 'completed' ? 'info.main' :
                                       membership.status === 'canceled' ? 'error.main' : 'grey.700',
                              color: 'white',
                              textTransform: 'capitalize',
                            }}
                          >
                            {membership.status}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Plan ID: {membership.planId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Created: {formatDate(membership.createdAt)}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                </>
              )}

              {/* Total Spending */}
              {userInfo.totalSpent !== undefined && userInfo.totalSpent !== null && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Spending
                  </Typography>
                  <Paper elevation={0} sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Spent:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ${userInfo.totalSpent.toFixed(2)} USD
                      </Typography>
                    </Box>
                  </Paper>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Admin Details */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Admin details
              </Typography>
              <Paper elevation={0} sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <AdminDetailRow label="ID" value={userInfo.id} />
                <AdminDetailRow label="Email" value={userInfo.email} />
                <AdminDetailRow label="Location" value={userInfo.location} />
                <AdminDetailRow label="Discord ID" value={userInfo.discordId} />
                <AdminDetailRow label="Discord" value={userInfo.discord} />
              </Paper>
            </Box>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

